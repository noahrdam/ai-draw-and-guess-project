import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { getPoint, renderCanvas } from "@/lib/canvas";
import { PALETTE } from "@/lib/constants";
import type { Point, Stroke } from "@/lib/types";

interface Options {
  /** Fired the first time a stroke begins (used to dismiss onboarding). */
  onStrokeStart?: () => void;
}

export function useDrawing({ onStrokeStart }: Options = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [live, setLive] = useState<Point[]>([]);
  const [pressing, setPressing] = useState(false);
  const [color, setColor] = useState(PALETTE[0]);
  const [cursor, setCursor] = useState<Point | null>(null);

  const liveRef = useRef<Point[]>([]);
  const pressingRef = useRef(false);
  const colorRef = useRef(color);
  useEffect(() => { colorRef.current = color; }, [color]);

  // Latest committed strokes, readable from outside React (the inference loop).
  const strokesRef = useRef<Stroke[]>([]);
  useEffect(() => { strokesRef.current = strokes; }, [strokes]);
  const getStrokes = useCallback(() => strokesRef.current, []);

  // Redraw whenever the picture changes.
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) renderCanvas(ctx, strokes, live, color);
  }, [strokes, live, color]);

  const setLiveBoth = (pts: Point[]) => {
    liveRef.current = pts;
    setLive(pts);
  };

  const strokeStart = useCallback((p: Point) => {
    onStrokeStart?.();
    pressingRef.current = true;
    setPressing(true);
    setLiveBoth([p]);
    setCursor(p);
  }, [onStrokeStart]);

  const strokeMove = useCallback((p: Point) => {
    setCursor(p);
    if (!pressingRef.current) return;
    setLiveBoth([...liveRef.current, p]);
  }, []);

  const strokeEnd = useCallback(() => {
    if (!pressingRef.current) return;
    pressingRef.current = false;
    setPressing(false);
    if (liveRef.current.length > 0) {
      const points = liveRef.current;
      setStrokes(prev => [...prev, { points, color: colorRef.current }]);
    }
    setLiveBoth([]);
  }, []);

  /** Move the cursor without drawing (e.g. an open hand hovering). */
  const hover = useCallback((p: Point | null) => setCursor(p), []);

  const onDown = (e: PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    strokeStart(getPoint(e.nativeEvent, canvasRef.current!));
  };
  const onMove = (e: PointerEvent<HTMLCanvasElement>) => {
    strokeMove(getPoint(e.nativeEvent, canvasRef.current!));
  };
  const onUp = () => strokeEnd();

  const undo = useCallback(() => setStrokes(prev => prev.slice(0, -1)), []);
  const clear = useCallback(() => { setStrokes([]); setLiveBoth([]); }, []);
  const getDataUrl = useCallback(() => canvasRef.current?.toDataURL() ?? "", []);

  return {
    canvasRef,
    color,
    setColor,
    cursor,
    pressing,
    strokes,
    isEmpty: strokes.length === 0 && live.length === 0,
    onDown,
    onMove,
    onUp,
    strokeStart,
    strokeMove,
    strokeEnd,
    hover,
    getStrokes,
    undo,
    clear,
    getDataUrl,
  };
}
