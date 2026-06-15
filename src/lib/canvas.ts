import { CH, CW } from "./constants";
import type { Point, Stroke } from "./types";

/** Convert a pointer position into normalised canvas coordinates. */
export function getPoint(
  e: { clientX: number; clientY: number },
  canvas: HTMLCanvasElement,
): Point {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) / r.width) * CW,
    y: ((e.clientY - r.top) / r.height) * CH,
  };
}

/** Redraw all committed strokes plus the in-progress one onto the canvas. */
export function renderCanvas(
  ctx: CanvasRenderingContext2D,
  committed: Stroke[],
  live: Point[],
  color: string,
) {
  ctx.clearRect(0, 0, CW, CH);
  const all = live.length > 1 ? [...committed, { points: live, color }] : committed;
  for (const s of all) {
    if (s.points.length < 2) continue;
    ctx.beginPath();
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.moveTo(s.points[0].x, s.points[0].y);
    for (let i = 1; i < s.points.length; i++) ctx.lineTo(s.points[i].x, s.points[i].y);
    ctx.stroke();
  }
}
