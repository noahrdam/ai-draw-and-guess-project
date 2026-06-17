import type { PointerEvent, RefObject } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ACCENT, CH, CW } from "@/lib/constants";
import type { Point } from "@/lib/types";
import { Onboarding } from "./Onboarding";

interface Props {
  canvasRef: RefObject<HTMLCanvasElement>;
  cursor: Point | null;
  pressing: boolean;
  color: string;
  isEmpty: boolean;
  onboarding: boolean;
  onDismissOnboarding: () => void;
  onPointerDown: (e: PointerEvent<HTMLCanvasElement>) => void;
  onPointerMove: (e: PointerEvent<HTMLCanvasElement>) => void;
  onPointerUp: () => void;
}

/** The drawing surface: canvas, custom cursor, empty hint and onboarding. */
export function DrawingCanvas({
  canvasRef, cursor, pressing, color, isEmpty,
  onboarding, onDismissOnboarding,
  onPointerDown, onPointerMove, onPointerUp,
}: Props) {
  return (
    <div
      className="relative rounded-3xl overflow-hidden border border-border bg-white shadow-sm"
      style={{ flex: "1 1 auto", minHeight: "clamp(200px, 44vh, 600px)" }}
    >
      <canvas
        ref={canvasRef}
        width={CW}
        height={CH}
        className="absolute inset-0 w-full h-full touch-none cursor-none"
        style={{ display: "block" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      />

      {/* Custom cursor dot */}
      {cursor && (
        <div
          className="absolute pointer-events-none z-30"
          style={{
            left: `${(cursor.x / CW) * 100}%`,
            top:  `${(cursor.y / CH) * 100}%`,
            transform: "translate(-50%,-50%)",
          }}
        >
          <motion.div
            animate={{
              width:      pressing ? 20 : 13,
              height:     pressing ? 20 : 13,
              background: pressing ? color : ACCENT,
            }}
            transition={{ duration: 0.08 }}
            className="rounded-full"
            style={{ boxShadow: `0 0 0 ${pressing ? 6 : 3}px ${(pressing ? color : ACCENT)}28` }}
          />
        </div>
      )}

      <AnimatePresence>
        {isEmpty && !onboarding && (
          <motion.div
            className="absolute inset-0 flex items-end justify-center pb-10 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <p className="text-muted-foreground/25 text-base font-medium select-none">
              Start drawing here...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {onboarding && <Onboarding onDismiss={onDismissOnboarding} />}
      </AnimatePresence>
    </div>
  );
}
