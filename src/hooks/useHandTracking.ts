import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { PINCH_OFF, PINCH_ON, fingertipToCanvas, fist, pinchRatio, rockHorns } from "@/lib/hand";
import type { Point } from "@/lib/types";

const WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

/** "loading" the model, "ready" and tracking, or "error" if it failed to init. */
export type HandStatus = "idle" | "loading" | "ready" | "error";

/** One processed frame of hand input, in canvas coordinates. */
export interface HandFrame {
  present: boolean;
  point: Point;
  pinching: boolean;
  rockHorns: boolean;
  fist: boolean;
}

interface Options {
  videoRef: RefObject<HTMLVideoElement>;
  /** Only run while the camera is granted and the screen is mounted. */
  enabled: boolean;
  /** Called once per processed video frame. Kept in a ref, so it can be inline. */
  onFrame: (frame: HandFrame) => void;
}

/**
 * Runs MediaPipe HandLandmarker over the live <video> and emits a HandFrame
 * each animation tick. Pinch state uses hysteresis to stay stable.
 */
export function useHandTracking({ videoRef, enabled, onFrame }: Options): HandStatus {
  const [status, setStatus] = useState<HandStatus>("idle");

  // Keep the callback fresh without re-initialising the model every render.
  const onFrameRef = useRef(onFrame);
  useEffect(() => { onFrameRef.current = onFrame; }, [onFrame]);

  useEffect(() => {
    if (!enabled) return;

    let landmarker: HandLandmarker | null = null;
    let rafId = 0;
    let cancelled = false;
    let pinching = false;
    let lastVideoTime = -1;

    const loop = () => {
      rafId = requestAnimationFrame(loop);
      const video = videoRef.current;
      if (!landmarker || !video || video.readyState < 2 || video.videoWidth === 0) return;

      // detectForVideo needs a strictly increasing timestamp; skip duplicate frames.
      if (video.currentTime === lastVideoTime) return;
      lastVideoTime = video.currentTime;

      const result = landmarker.detectForVideo(video, performance.now());
      const hand = result.landmarks?.[0];

      if (!hand) {
        pinching = false;
        onFrameRef.current({ present: false, point: { x: 0, y: 0 }, pinching: false, rockHorns: false, fist: false });
        return;
      }

      const isFist = fist(hand);
      const ratio = pinchRatio(hand);
      // Fist overrides pinch — closing the hand shouldn't start a stroke
      pinching = isFist ? false : (pinching ? ratio < PINCH_OFF : ratio < PINCH_ON);
      onFrameRef.current({ present: true, point: fingertipToCanvas(hand), pinching, rockHorns: rockHorns(hand), fist: isFist });
    };

    (async () => {
      try {
        setStatus("loading");
        const vision = await FilesetResolver.forVisionTasks(WASM_URL);
        landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
          numHands: 1,
          runningMode: "VIDEO",
        });
        if (cancelled) { landmarker.close(); return; }
        setStatus("ready");
        loop();
      } catch (err) {
        console.error("Hand tracking failed to initialise:", err);
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      landmarker?.close();
      setStatus("idle");
    };
  }, [enabled, videoRef]);

  return status;
}
