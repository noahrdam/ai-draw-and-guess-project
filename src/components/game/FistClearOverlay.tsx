import type { RefObject } from "react";
import { Trash2 } from "lucide-react";
import { ACCENT } from "@/lib/constants";

interface Props {
  overlayRef: RefObject<HTMLDivElement>;
  ringRef: RefObject<SVGCircleElement>;
}

/** Full-screen overlay that appears while the user holds a fist to clear the canvas. */
export function FistClearOverlay({ overlayRef, ringRef }: Props) {
  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
      style={{ opacity: 0, transition: "opacity 0.15s" }}
    >
      <div className="flex flex-col items-center gap-3 bg-white/95 backdrop-blur-sm rounded-3xl px-10 py-7 shadow-xl border border-border">
        <div className="relative w-24 h-24 flex items-center justify-center">
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 80 80"
            style={{ transform: "rotate(-90deg)" }}
          >
            <circle cx="40" cy="40" r="32" stroke="#e5e7eb" strokeWidth="5" fill="none" />
            <circle
              ref={ringRef}
              cx="40" cy="40" r="32"
              stroke={ACCENT}
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
              style={{ strokeDasharray: "201", strokeDashoffset: "201" }}
            />
          </svg>
          <Trash2 size={30} style={{ color: ACCENT }} />
        </div>
        <span className="text-sm font-semibold text-muted-foreground">Hold to clear…</span>
      </div>
    </div>
  );
}
