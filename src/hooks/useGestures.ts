import { useRef } from "react";
import type { RefObject } from "react";
import { FIST_HOLD_MS } from "@/lib/constants";
import type { Point } from "@/lib/types";
import { useHandTracking, type HandFrame, type HandStatus } from "@/hooks/useHandTracking";

interface Options {
  videoRef: RefObject<HTMLVideoElement>;
  enabled: boolean;
  onStrokeStart: (p: Point) => void;
  onStrokeMove: (p: Point) => void;
  onStrokeEnd: () => void;
  onHover: (p: Point | null) => void;
  onClear: () => void;
  onToggleMusic: () => void;
}

interface GestureRefs {
  handStatus: HandStatus;
  progressBarRef: RefObject<HTMLDivElement>;
  fistOverlayRef: RefObject<HTMLDivElement>;
  fistRingRef: RefObject<SVGCircleElement>;
  musicOverlayRef: RefObject<HTMLDivElement>;
  musicRingRef: RefObject<SVGCircleElement>;
}

/**
 * Translates raw hand frames into drawing actions and gesture commands.
 * Owns the DOM refs used for frame-rate progress feedback so the RAF loop
 * can update them directly without triggering React re-renders.
 */
export function useGestures({
  videoRef, enabled,
  onStrokeStart, onStrokeMove, onStrokeEnd, onHover, onClear, onToggleMusic,
}: Options): GestureRefs {
  const progressBarRef  = useRef<HTMLDivElement>(null);
  const fistOverlayRef  = useRef<HTMLDivElement>(null);
  const fistRingRef     = useRef<SVGCircleElement>(null);
  const musicOverlayRef = useRef<HTMLDivElement>(null);
  const musicRingRef    = useRef<SVGCircleElement>(null);

  const wasPinching      = useRef(false);
  const fistStartTime    = useRef(0);
  const fistLocked       = useRef(false);
  const rockHornsCount   = useRef(0);
  const rockHornsLocked  = useRef(false);

  const handStatus = useHandTracking({
    videoRef,
    enabled,
    onFrame: (f: HandFrame) => {
      // ── Drawing ──────────────────────────────────────────────────────────
      if (!f.present) {
        if (wasPinching.current) onStrokeEnd();
        onHover(null);
        wasPinching.current = false;
        return;
      }
      if (f.pinching && !wasPinching.current) onStrokeStart(f.point);
      else if (f.pinching)                    onStrokeMove(f.point);
      else if (wasPinching.current)           onStrokeEnd();
      else                                    onHover(f.point);
      wasPinching.current = f.pinching;

      // ── Fist hold → clear ────────────────────────────────────────────────
      if (f.fist && !f.pinching) {
        rockHornsCount.current = 0;
        if (!fistLocked.current) {
          if (fistStartTime.current === 0) fistStartTime.current = Date.now();
          const pct = Math.min((Date.now() - fistStartTime.current) / FIST_HOLD_MS, 1);
          if (fistOverlayRef.current) fistOverlayRef.current.style.opacity = "1";
          if (fistRingRef.current)    fistRingRef.current.style.strokeDashoffset = String(201 * (1 - pct));
          if (pct >= 1) {
            onClear();
            fistStartTime.current = 0;
            fistLocked.current = true;
            if (fistOverlayRef.current) fistOverlayRef.current.style.opacity = "0";
            if (fistRingRef.current)    fistRingRef.current.style.strokeDashoffset = "201";
          }
        }
      } else {
        if (!f.fist) {
          fistLocked.current = false;
          fistStartTime.current = 0;
          if (fistOverlayRef.current) fistOverlayRef.current.style.opacity = "0";
          if (fistRingRef.current)    fistRingRef.current.style.strokeDashoffset = "201";
        }

        // ── Rock horns hold → toggle music ─────────────────────────────────
        if (f.rockHorns && !f.pinching) {
          if (!rockHornsLocked.current) {
            rockHornsCount.current += 1;
            const pct = Math.round((rockHornsCount.current / 25) * 100);
            if (progressBarRef.current)  progressBarRef.current.style.width = `${pct}%`;
            if (musicOverlayRef.current) musicOverlayRef.current.style.opacity = "1";
            if (musicRingRef.current)    musicRingRef.current.style.strokeDashoffset = String(201 * (1 - rockHornsCount.current / 25));
            if (rockHornsCount.current >= 25) {
              onToggleMusic();
              rockHornsCount.current = 0;
              rockHornsLocked.current = true;
              if (progressBarRef.current)  progressBarRef.current.style.width = "0%";
              if (musicOverlayRef.current) musicOverlayRef.current.style.opacity = "0";
              if (musicRingRef.current)    musicRingRef.current.style.strokeDashoffset = "201";
            }
          }
        } else {
          if (!f.rockHorns) {
            rockHornsLocked.current = false;
            if (musicOverlayRef.current) musicOverlayRef.current.style.opacity = "0";
            if (musicRingRef.current)    musicRingRef.current.style.strokeDashoffset = "201";
          }
          rockHornsCount.current = 0;
          if (progressBarRef.current) progressBarRef.current.style.width = "0%";
        }
      }
    },
  });

  return { handStatus, progressBarRef, fistOverlayRef, fistRingRef, musicOverlayRef, musicRingRef };
}
