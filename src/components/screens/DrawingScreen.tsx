import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Star } from "lucide-react";
import { ACCENT, SHOW_DEBUG } from "@/lib/constants";
import type { RoundResult } from "@/lib/types";
import { useCamera } from "@/hooks/useCamera";
import { useDrawing } from "@/hooks/useDrawing";
import { useHandTracking } from "@/hooks/useHandTracking";
import type { HandFrame } from "@/hooks/useHandTracking";
import { useRound } from "@/hooks/useRound";
import { AIPanel } from "@/components/game/AIPanel";
import { CameraView } from "@/components/game/CameraView";
import { CelebrationOverlay } from "@/components/game/CelebrationOverlay";
import { DrawingCanvas } from "@/components/game/DrawingCanvas";
import { RecognitionDebug } from "@/components/game/RecognitionDebug";
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
  const { timer, guesses, aiState, celebrate, skip } = useRound(word, drawing.getStrokes, drawing.getDataUrl, onRoundEnd);

  // Translate hand frames into stroke actions: a pinch starts a stroke, opening
  // the hand ends it, and an open hand just moves the cursor (hover).
  const wasPinching = useRef(false);
  const handStatus = useHandTracking({
    videoRef: camera.videoRef,
    enabled: camera.state === "granted",
    onFrame: (f: HandFrame) => {
      if (!f.present) {
        if (wasPinching.current) drawing.strokeEnd();
        drawing.hover(null);
        wasPinching.current = false;
        return;
      }
      if (f.pinching && !wasPinching.current) drawing.strokeStart(f.point);
      else if (f.pinching) drawing.strokeMove(f.point);
      else if (wasPinching.current) drawing.strokeEnd();
      else drawing.hover(f.point);
      wasPinching.current = f.pinching;
    },
  });

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
            {camera.state === "granted" && (
              <p className="mt-1.5 text-[10px] md:text-[11px] text-center md:text-left text-muted-foreground">
                {handStatus === "loading" && "Loading hand tracking…"}
                {handStatus === "ready" && "✋ Pinch to draw in the air"}
                {handStatus === "error" && "Hand tracking unavailable — use the mouse"}
              </p>
            )}
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

      {SHOW_DEBUG && <RecognitionDebug guesses={guesses} />}

      {/* Celebration overlay */}
      <AnimatePresence>
        {celebrate && <CelebrationOverlay word={word} />}
      </AnimatePresence>
    </motion.div>
  );
}
