import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Star } from "lucide-react";
import { ACCENT } from "@/lib/constants";
import type { RoundResult } from "@/lib/types";
import { useCamera } from "@/hooks/useCamera";
import { useDrawing } from "@/hooks/useDrawing";
import { useRound } from "@/hooks/useRound";
import { AIPanel } from "@/components/game/AIPanel";
import { CameraView } from "@/components/game/CameraView";
import { CelebrationOverlay } from "@/components/game/CelebrationOverlay";
import { DrawingCanvas } from "@/components/game/DrawingCanvas";
import { TimerRing } from "@/components/game/TimerRing";
import { Toolbar } from "@/components/game/Toolbar";

interface Props {
  word: string;
  onRoundEnd: (result: RoundResult) => void;
}

export function DrawingScreen({ word, onRoundEnd }: Props) {
  const [onboarding, setOnboarding] = useState(true);
  const dismissOnboarding = () => setOnboarding(false);

  const camera = useCamera();
  const drawing = useDrawing({ onStrokeStart: dismissOnboarding });
  const { timer, guesses, aiState, celebrate, skip } = useRound(word, drawing.getDataUrl, onRoundEnd);

  return (
    <motion.div
      className="flex flex-col relative"
      style={{ minHeight: "100dvh" }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28 }}
    >
      {/* Top bar */}
      <div className="flex-none flex items-center justify-between px-4 md:px-7 py-3 border-b border-border bg-card/90 backdrop-blur-sm z-10">
        <span
          className="text-xl font-black"
          style={{ fontFamily: "'Nunito', sans-serif", color: ACCENT }}
        >
          AirDraw
        </span>
        <div className="flex items-center gap-3">
          <span className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground">
            Draw:&nbsp;
            <span className="font-bold text-foreground capitalize">{word}</span>
          </span>
          <TimerRing value={timer} />
          <button
            onClick={skip}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-xl hover:bg-muted font-medium"
          >
            Skip
          </button>
        </div>
      </div>

      {/* Mobile word */}
      <div className="sm:hidden flex-none text-center py-2 bg-secondary/50 text-sm font-semibold border-b border-border">
        Draw a&nbsp;
        <span className="capitalize" style={{ color: ACCENT }}>{word}</span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col md:flex-row gap-4 p-4 md:p-5 overflow-hidden min-h-0">

        {/* Canvas column */}
        <div className="flex flex-col gap-3 flex-1 min-h-0 overflow-hidden">
          <DrawingCanvas
            canvasRef={drawing.canvasRef}
            cursor={drawing.cursor}
            pressing={drawing.pressing}
            color={drawing.color}
            isEmpty={drawing.isEmpty}
            onboarding={onboarding}
            onDismissOnboarding={dismissOnboarding}
            onPointerDown={drawing.onDown}
            onPointerMove={drawing.onMove}
            onPointerUp={drawing.onUp}
          />
          <Toolbar
            color={drawing.color}
            onColor={drawing.setColor}
            onUndo={drawing.undo}
            onClear={drawing.clear}
          />
        </div>

        {/* AI sidebar — row on mobile, column on desktop */}
        <div className="flex flex-row md:flex-col gap-3 w-full md:w-72 lg:w-80 shrink-0 overflow-hidden">
          <div className="w-28 md:w-full">
            <CameraView videoRef={camera.videoRef} state={camera.state} onRequest={camera.request} />
          </div>
          <div className="flex-1 min-w-0 overflow-y-auto md:overflow-visible">
            <div className="flex items-center gap-1.5 mb-2.5">
              <Star size={11} style={{ color: ACCENT }} fill={ACCENT} />
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                AI Guesses
              </span>
            </div>
            <AIPanel state={aiState} guesses={guesses} />
          </div>
        </div>
      </div>

      {/* Celebration overlay */}
      <AnimatePresence>
        {celebrate && <CelebrationOverlay word={word} />}
      </AnimatePresence>
    </motion.div>
  );
}
