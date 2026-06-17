import type { RefObject } from "react";
import { ACCENT } from "@/lib/constants";

interface Props {
  overlayRef: RefObject<HTMLDivElement>;
  ringRef: RefObject<SVGCircleElement>;
}

/** Centered overlay that appears while the user holds rock horns to toggle music. */
export function MusicToggleOverlay({ overlayRef, ringRef }: Props) {
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
          <img src="/rat-dance.gif" alt="" className="w-14 h-14 object-contain" />
        </div>
        <span className="text-sm font-semibold text-muted-foreground">Hold to toggle music</span>
      </div>
    </div>
  );
}
