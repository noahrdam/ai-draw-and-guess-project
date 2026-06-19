import * as tf from "@tensorflow/tfjs";
import { LABELS_URL, MODEL_URL } from "./constants";
import type { Guess, Stroke } from "./types";

/**
 * Wraps the doodleNet TensorFlow.js model: lazy loading, QuickDraw-style
 * preprocessing of the canvas strokes, and top-k classification. The model
 * expects a 28x28 grayscale image, inverted and normalised to [0,1], shaped
 * [1, 28, 28, 1], and outputs a softmax over 345 classes.
 */

let modelPromise: Promise<tf.LayersModel> | null = null;
let labels: string[] = [];

/** Kick off model + label loading once; safe to call repeatedly (e.g. to warm up). */
export function loadRecognizer(): Promise<tf.LayersModel> {
  if (!modelPromise) {
    const labelsReady = fetch(LABELS_URL)
      .then(r => r.text())
      .then(t => { labels = t.trim().split(/\r?\n/).map(s => s.trim()); });

    modelPromise = (async () => {
      const model = await tf.loadLayersModel(MODEL_URL);
      await labelsReady;
      // Warm up so the first real inference isn't slow.
      tf.tidy(() => (model.predict(tf.zeros([1, 28, 28, 1])) as tf.Tensor).dataSync());
      return model;
    })();
  }
  return modelPromise;
}

const SRC = 256; // High-res square we rasterise into before downscaling to 28.

let srcCanvas: HTMLCanvasElement | null = null;
let midCanvas: HTMLCanvasElement | null = null;
let dstCanvas: HTMLCanvasElement | null = null;

function bbox(strokes: Stroke[]) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity, has = false;
  for (const s of strokes) {
    for (const p of s.points) {
      has = true;
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
  }
  return has ? { minX, minY, maxX, maxY } : null;
}

/**
 * Render the strokes into a centred 28x28 grayscale buffer matching the
 * QuickDraw training distribution (drawing cropped to its bounding box,
 * scaled to fit with a small margin, black ink on white). Returns the
 * inverted, normalised pixel values, or null if there is nothing drawn.
 */
function rasterize(strokes: Stroke[]): Float32Array | null {
  const box = bbox(strokes);
  if (!box) return null;

  if (!srcCanvas) { srcCanvas = document.createElement("canvas"); srcCanvas.width = srcCanvas.height = SRC; }
  if (!dstCanvas) { dstCanvas = document.createElement("canvas"); dstCanvas.width = dstCanvas.height = 28; }
  const sctx = srcCanvas.getContext("2d")!;
  const dctx = dstCanvas.getContext("2d")!;

  // QuickDraw bitmaps fill almost the whole frame, so keep the margin small.
  const margin = SRC * 0.08;
  const avail = SRC - margin * 2;
  const w = box.maxX - box.minX;
  const h = box.maxY - box.minY;
  const scale = avail / Math.max(w, h, 1);
  const offX = margin + (avail - w * scale) / 2 - box.minX * scale;
  const offY = margin + (avail - h * scale) / 2 - box.minY * scale;

  sctx.fillStyle = "#fff";
  sctx.fillRect(0, 0, SRC, SRC);
  sctx.strokeStyle = "#000";
  // Bold strokes: thin lines vanish into faint gray once downscaled to 28px,
  // which makes everything look like sparse classes ("rain", "feather").
  sctx.lineWidth = Math.max(14, SRC * 0.075);
  sctx.lineCap = "round";
  sctx.lineJoin = "round";
  for (const s of strokes) {
    if (s.points.length === 0) continue;
    sctx.beginPath();
    sctx.moveTo(s.points[0].x * scale + offX, s.points[0].y * scale + offY);
    for (let i = 1; i < s.points.length; i++) {
      sctx.lineTo(s.points[i].x * scale + offX, s.points[i].y * scale + offY);
    }
    // A single dot should still leave a mark.
    if (s.points.length === 1) sctx.lineTo(s.points[0].x * scale + offX + 0.01, s.points[0].y * scale + offY);
    sctx.stroke();
  }

  // Downscale in halving steps so the bold ink survives instead of averaging
  // away. 256 -> 64 -> 28 keeps far more contrast than a single big jump.
  dctx.imageSmoothingEnabled = true;
  dctx.imageSmoothingQuality = "high";
  if (!midCanvas) { midCanvas = document.createElement("canvas"); midCanvas.width = midCanvas.height = 64; }
  const mctx = midCanvas.getContext("2d")!;
  mctx.imageSmoothingEnabled = true;
  mctx.imageSmoothingQuality = "high";
  mctx.clearRect(0, 0, 64, 64);
  mctx.drawImage(srcCanvas, 0, 0, 64, 64);
  dctx.clearRect(0, 0, 28, 28);
  dctx.drawImage(midCanvas, 0, 0, 28, 28);
  const { data } = dctx.getImageData(0, 0, 28, 28);

  const out = new Float32Array(28 * 28);
  for (let i = 0; i < out.length; i++) {
    out[i] = (255 - data[i * 4]) / 255; // invert: ink -> high, paper -> 0
  }
  return out;
}

/** Paint the most recent 28x28 model input onto a canvas (for the debug view). */
export function paintDebug(target: HTMLCanvasElement) {
  if (!dstCanvas) return;
  const ctx = target.getContext("2d");
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, target.width, target.height);
  ctx.drawImage(dstCanvas, 0, 0, target.width, target.height);
}

const pretty = (label: string) => label.replace(/_/g, " ");

/**
 * Classify the current drawing and return the top-k guesses (ranked, with
 * confidence). Empty array if nothing is drawn or the model isn't ready.
 * `id` is the raw model label, so callers can compare against the target word.
 */
export async function classify(strokes: Stroke[], topK = 4): Promise<Guess[]> {
  const input = rasterize(strokes);
  if (!input) return [];
  const model = await loadRecognizer();
  if (labels.length === 0) return [];

  // Run inference inside tidy so intermediate tensors are cleaned up,
  // then read the result asynchronously to avoid blocking the main thread.
  const outTensor = tf.tidy(() => {
    const x = tf.tensor(input, [1, 28, 28, 1]);
    return model.predict(x) as tf.Tensor;
  });
  const probs = Array.from(await outTensor.data());
  outTensor.dispose();

  return probs
    .map((confidence, i) => ({ id: labels[i], word: pretty(labels[i]), confidence }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, topK);
}
