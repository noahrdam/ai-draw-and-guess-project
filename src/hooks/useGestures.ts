import { useRef } from "react";
import type { RefObject } from "react";
import { HOLD_MS } from "@/lib/constants";
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
  const rockHornsStartTime = useRef(0);
  const rockHornsLocked    = useRef(false);

  const handStatus = useHandTracking({
    videoRef,
    enabled,
    onFrame: (f: HandFrame) => {
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

      // fist → clear
      if (f.fist && !f.pinching) {
        rockHornsStartTime.current = 0;
        if (!fistLocked.current) {
          if (fistStartTime.current === 0) fistStartTime.current = Date.now();
          const pct = Math.min((Date.now() - fistStartTime.current) / HOLD_MS, 1);
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

        // rock horns → music
        if (f.rockHorns && !f.pinching) {
          if (!rockHornsLocked.current) {
            if (rockHornsStartTime.current === 0) rockHornsStartTime.current = Date.now();
            const pct = Math.min((Date.now() - rockHornsStartTime.current) / HOLD_MS, 1);
            if (progressBarRef.current)  progressBarRef.current.style.width = `${Math.round(pct * 100)}%`;
            if (musicOverlayRef.current) musicOverlayRef.current.style.opacity = "1";
            if (musicRingRef.current)    musicRingRef.current.style.strokeDashoffset = String(201 * (1 - pct));
            if (pct >= 1) {
              onToggleMusic();
              rockHornsStartTime.current = 0;
              rockHornsLocked.current = true;
              if (progressBarRef.current)  progressBarRef.current.style.width = "0%";
              if (musicOverlayRef.current) musicOverlayRef.current.style.opacity = "0";
              if (musicRingRef.current)    musicRingRef.current.style.strokeDashoffset = "201";
            }
          }
        } else {
          if (!f.rockHorns) {
            rockHornsLocked.current = false;
            rockHornsStartTime.current = 0;
            if (musicOverlayRef.current) musicOverlayRef.current.style.opacity = "0";
            if (musicRingRef.current)    musicRingRef.current.style.strokeDashoffset = "201";
          }
          if (progressBarRef.current) progressBarRef.current.style.width = "0%";
        }
      }
    },
  });

  return { handStatus, progressBarRef, fistOverlayRef, fistRingRef, musicOverlayRef, musicRingRef };
}
