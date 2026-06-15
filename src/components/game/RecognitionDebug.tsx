import { useEffect, useRef } from "react";
import { paintDebug } from "@/lib/recognizer";
import type { Guess } from "@/lib/types";

/**
 * Dev-only overlay showing exactly what the recognition model sees (the 28x28
 * input, scaled up) alongside the current top guess. Toggle via SHOW_DEBUG.
 */
export function RecognitionDebug({ guesses }: { guesses: Guess[] }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const id = setInterval(() => { if (ref.current) paintDebug(ref.current); }, 150);
    return () => clearInterval(id);
  }, []);

  const top = guesses[0];

  return (
    <div className="absolute bottom-2 left-2 z-30 rounded-xl bg-black/80 p-2 text-white shadow-lg">
      <canvas
        ref={ref}
        width={112}
        height={112}
        className="rounded-md bg-white"
        style={{ imageRendering: "pixelated", width: 112, height: 112 }}
      />
      <div className="mt-1 text-center text-[10px] font-mono leading-tight">
        model input
        {top && (
          <div className="text-[11px] font-bold">
            {top.word} {(top.confidence * 100).toFixed(0)}%
          </div>
        )}
      </div>
    </div>
  );
}
