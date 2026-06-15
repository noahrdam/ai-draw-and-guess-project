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
