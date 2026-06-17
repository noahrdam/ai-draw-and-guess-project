import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Star } from "lucide-react";
import { ACCENT, SHOW_DEBUG } from "@/lib/constants";
import type { RoundResult } from "@/lib/types";
import { useCamera } from "@/hooks/useCamera";
import { useDrawing } from "@/hooks/useDrawing";
import { useGestures } from "@/hooks/useGestures";
import { useRound } from "@/hooks/useRound";
import { AIPanel } from "@/components/game/AIPanel";
import { CameraView } from "@/components/game/CameraView";
import { CelebrationOverlay } from "@/components/game/CelebrationOverlay";
import { DrawingCanvas } from "@/components/game/DrawingCanvas";
import { FistClearOverlay } from "@/components/game/FistClearOverlay";
import { MusicToggleOverlay } from "@/components/game/MusicToggleOverlay";
import { RecognitionDebug } from "@/components/game/RecognitionDebug";
import { TimerRing } from "@/components/game/TimerRing";
import { Toolbar } from "@/components/game/Toolbar";

interface Props {
  word: string;
  winStreak: number;
  highStreak: number;
  musicPlaying: boolean;
  onToggleMusic: () => void;
  onRoundEnd: (result: RoundResult) => void;
}

export function DrawingScreen({ word, winStreak, highStreak, musicPlaying, onToggleMusic, onRoundEnd }: Props) {
  const [onboarding, setOnboarding] = useState(true);

  const camera  = useCamera();
  const drawing = useDrawing({ onStrokeStart: () => setOnboarding(false) });
  const { timer, guesses, aiState, celebrate, skip } = useRound(
    word, drawing.getStrokes, drawing.getDataUrl, onRoundEnd,
  );
  const { handStatus, progressBarRef, fistOverlayRef, fistRingRef, musicOverlayRef, musicRingRef } = useGestures({
    videoRef:       camera.videoRef,
    enabled:        camera.state === "granted",
    onStrokeStart:  drawing.strokeStart,
    onStrokeMove:   drawing.strokeMove,
    onStrokeEnd:    drawing.strokeEnd,
    onHover:        drawing.hover,
    onClear:        drawing.clear,
    onToggleMusic,
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
        <div className="flex items-center gap-2.5">
          <span className="text-xl font-black" style={{ fontFamily: "'Nunito', sans-serif", color: ACCENT }}>
            AirDraw
          </span>
          {winStreak >= 2 && (
            <motion.div
              key={winStreak}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg"
              style={{ background: "#FFF3E0" }}
            >
              <span className="text-sm">🔥</span>
              <span className="text-sm font-black" style={{ fontFamily: "'Nunito', sans-serif", color: "#E65100" }}>
                {winStreak}
              </span>
            </motion.div>
          )}
          {highStreak >= 2 && (
            <span className="text-xs text-muted-foreground font-medium hidden sm:inline">🏆 {highStreak}</span>
          )}
          {musicPlaying && (
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="text-base"
            >
              🎵
            </motion.span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground">
            Draw:&nbsp;<span className="font-bold text-foreground capitalize">{word}</span>
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
        Draw a&nbsp;<span className="capitalize" style={{ color: ACCENT }}>{word}</span>
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
            onDismissOnboarding={() => setOnboarding(false)}
            onPointerDown={drawing.onDown}
            onPointerMove={drawing.onMove}
            onPointerUp={drawing.onUp}
          />
          <Toolbar color={drawing.color} onColor={drawing.setColor} onUndo={drawing.undo} onClear={drawing.clear} />
        </div>

        {/* AI sidebar */}
        <div className="flex flex-row md:flex-col gap-3 w-full md:w-72 lg:w-80 shrink-0 overflow-hidden">
          <div className="w-28 md:w-full">
            <CameraView videoRef={camera.videoRef} state={camera.state} onRequest={camera.request} />
            <div className="mt-1.5 h-1 rounded-full bg-muted overflow-hidden">
              <div ref={progressBarRef} className="h-full rounded-full" style={{ width: "0%", background: ACCENT }} />
            </div>
            {camera.state === "granted" && (
              <p className="mt-1.5 text-[10px] md:text-[11px] text-center md:text-left text-muted-foreground">
                {handStatus === "loading" && "Loading hand tracking…"}
                {handStatus === "ready"   && "✋ Pinch to draw in the air"}
                {handStatus === "error"   && "Hand tracking unavailable — use the mouse"}
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

      <FistClearOverlay overlayRef={fistOverlayRef} ringRef={fistRingRef} />
      <MusicToggleOverlay overlayRef={musicOverlayRef} ringRef={musicRingRef} />

      <AnimatePresence>
        {celebrate && <CelebrationOverlay word={word} />}
      </AnimatePresence>
    </motion.div>
  );
}
