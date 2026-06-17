import { CH, CW } from "./constants";
import type { Point } from "./types";

/**
 * MediaPipe Hand landmark indices we care about.
 * Full map: https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker
 */
export const LM = {
  WRIST: 0,
  THUMB_TIP: 4,
  INDEX_MCP: 5,
  INDEX_TIP: 8,
  MIDDLE_TIP: 12,
  RING_TIP: 16,
  PINKY_MCP: 17,
  PINKY_TIP: 20,
} as const;

/** A single hand landmark in normalised image space (0..1). */
export interface Landmark {
  x: number;
  y: number;
  z?: number;
}

/** Pinch enters below this ratio and releases above it (hysteresis avoids flicker). */
export const PINCH_ON = 0.45;
export const PINCH_OFF = 0.6;

function dist(a: Landmark, b: Landmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Scale-invariant pinch measure: thumb-tip↔index-tip distance divided by the
 * length of the hand (wrist↔index-knuckle), so it works near or far from the cam.
 */
export function pinchRatio(landmarks: Landmark[]): number {
  const span = dist(landmarks[LM.WRIST], landmarks[LM.INDEX_MCP]);
  if (span < 1e-4) return Infinity;
  return dist(landmarks[LM.THUMB_TIP], landmarks[LM.INDEX_TIP]) / span;
}

/**
 * Detect rock horns 🤘: index + pinky extended upward, middle + ring curled.
 * Scale-invariant via the hand span (wrist → index knuckle).
 */
export function rockHorns(landmarks: Landmark[]): boolean {
  const span = dist(landmarks[LM.WRIST], landmarks[LM.INDEX_MCP]);
  if (span < 1e-4) return false;
  // Finger "raised": tip is significantly above its own MCP knuckle
  const indexUp  = (landmarks[LM.INDEX_MCP].y  - landmarks[LM.INDEX_TIP].y)  / span > 0.4;
  const pinkyUp  = (landmarks[LM.PINKY_MCP].y  - landmarks[LM.PINKY_TIP].y)  / span > 0.3;
  // Finger "curled": tip is NOT above the index knuckle line
  const middleDown = landmarks[LM.MIDDLE_TIP].y > landmarks[LM.INDEX_MCP].y - span * 0.3;
  const ringDown   = landmarks[LM.RING_TIP].y   > landmarks[LM.INDEX_MCP].y - span * 0.3;
  return indexUp && pinkyUp && middleDown && ringDown;
}

/**
 * Fist: all 4 fingertips curled below the index knuckle line.
 * Scale-invariant via hand span (wrist → index knuckle).
 */
export function fist(landmarks: Landmark[]): boolean {
  const span = dist(landmarks[LM.WRIST], landmarks[LM.INDEX_MCP]);
  if (span < 1e-4) return false;
  // Tips must be clearly below the knuckle (not just touching it)
  const baseline = landmarks[LM.INDEX_MCP].y + span * 0.05;
  return (
    landmarks[LM.INDEX_TIP].y  > baseline &&
    landmarks[LM.MIDDLE_TIP].y > baseline &&
    landmarks[LM.RING_TIP].y   > baseline &&
    landmarks[LM.PINKY_TIP].y  > baseline
  );
}

/**
 * Map the index fingertip to canvas coordinates. The camera preview is shown
 * mirrored, so we mirror x too — moving your hand right moves the cursor right.
 */
export function fingertipToCanvas(landmarks: Landmark[]): Point {
  const tip = landmarks[LM.INDEX_TIP];
  return {
    x: (1 - tip.x) * CW,
    y: tip.y * CH,
  };
}
