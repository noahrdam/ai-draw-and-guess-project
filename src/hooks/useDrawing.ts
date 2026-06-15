import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { getPoint, renderCanvas } from "@/lib/canvas";
import { PALETTE } from "@/lib/constants";
import type { Point, Stroke } from "@/lib/types";

interface Options {
  /** Fired the first time the user presses on the canvas (used to dismiss onboarding). */
  onStrokeStart?: () => void;
}

/** Owns the drawing canvas: stroke state, pointer handlers and rendering. */
export function useDrawing({ onStrokeStart }: Options = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [live, setLive] = useState<Point[]>([]);
  const [pressing, setPressing] = useState(false);
  const [color, setColor] = useState(PALETTE[0]);
  const [cursor, setCursor] = useState<Point | null>(null);

  // Redraw whenever the picture changes.
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) renderCanvas(ctx, strokes, live, color);
  }, [strokes, live, color]);

  const onDown = (e: PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    onStrokeStart?.();
    setPressing(true);
    const p = getPoint(e.nativeEvent, canvasRef.current!);
    setLive([p]);
    setCursor(p);
  };

  const onMove = (e: PointerEvent<HTMLCanvasElement>) => {
    const p = getPoint(e.nativeEvent, canvasRef.current!);
    setCursor(p);
    if (!pressing) return;
    setLive(prev => [...prev, p]);
  };

  const onUp = () => {
    if (live.length > 0) setStrokes(prev => [...prev, { points: live, color }]);
    setLive([]);
    setPressing(false);
  };

  const undo = useCallback(() => setStrokes(prev => prev.slice(0, -1)), []);
  const clear = useCallback(() => { setStrokes([]); setLive([]); }, []);
  const getDataUrl = useCallback(() => canvasRef.current?.toDataURL() ?? "", []);

  return {
    canvasRef,
    color,
    setColor,
    cursor,
    pressing,
    isEmpty: strokes.length === 0 && live.length === 0,
    onDown,
    onMove,
    onUp,
    undo,
    clear,
    getDataUrl,
  };
}
