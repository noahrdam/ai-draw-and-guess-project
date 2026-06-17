import { motion } from "motion/react";
import { ChevronRight, Images } from "lucide-react";
import { ACCENT } from "@/lib/constants";
import { Confetti } from "@/components/effects/Confetti";

interface Props {
  word: string;
  aiGuess: string;
  aiGuessConfidence: number;
  correct: boolean;
  timeTaken: number;
  dataUrl: string;
  winStreak: number;
  highStreak: number;
  onNext: () => void;
  onGallery: () => void;
}

/** Round summary: the drawing, what the AI guessed and next actions. */
export function ResultScreen({
  word, aiGuess, aiGuessConfidence, correct, timeTaken, dataUrl, winStreak, highStreak, onNext, onGallery,
}: Props) {
  return (
    <motion.div
      className="relative flex flex-col items-center justify-center min-h-screen px-6 py-12 overflow-hidden"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
    >
      {correct && <Confetti />}

      <div className="w-full max-w-sm space-y-5 relative z-10">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0, rotate: -18 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.08, type: "spring", stiffness: 480, damping: 20 }}
            className="text-6xl mb-3"
          >
            {correct ? "🎉" : "🤔"}
          </motion.div>
          <h2
            className="text-4xl font-black"
            style={{ fontFamily: "'Nunito', sans-serif", color: correct ? ACCENT : "#1C1B20" }}
          >
            {correct ? "Got it!" : "Almost!"}
          </h2>
          {correct && winStreak >= 2 && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 400, damping: 20 }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold mt-2"
              style={{ background: "#FFF3E0", color: "#E65100" }}
            >
              🔥 {winStreak} in a row{winStreak >= highStreak ? " · 🏆 New best!" : ""}
            </motion.span>
          )}
          <p className="text-muted-foreground text-sm mt-1">
            {correct
              ? "The AI guessed your drawing correctly!"
              : "The AI couldn't quite figure this one out."}
          </p>
        </div>

        <div className="bg-card rounded-3xl border border-border p-5 space-y-4 shadow-sm">
          {dataUrl && (
            <div className="w-full aspect-video rounded-2xl overflow-hidden bg-muted">
              <img
                src={dataUrl}
                alt={`Drawing of ${word}`}
                className="w-full h-full object-contain"
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-secondary rounded-2xl p-3.5 text-center">
              <p className="text-xs text-muted-foreground mb-1 font-medium">You drew</p>
              <p
                className="font-black capitalize text-base"
                style={{ fontFamily: "'Nunito', sans-serif" }}
              >
                {word}
              </p>
            </div>
            <div className="bg-secondary rounded-2xl p-3.5 text-center">
              <p className="text-xs text-muted-foreground mb-1 font-medium">AI guessed</p>
              <p
                className="font-black capitalize text-base"
                style={{ fontFamily: "'Nunito', sans-serif", color: correct ? ACCENT : undefined }}
              >
                {aiGuess}
              </p>
              {correct && (
                <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'DM Mono', monospace" }}>
                  {Math.round(aiGuessConfidence * 100)}% confidence
                </p>
              )}
            </div>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Solved in&nbsp;
            <span
              className="font-semibold text-foreground"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              {timeTaken}s
            </span>
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onGallery}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-border bg-card font-semibold text-sm hover:bg-muted transition-colors"
          >
            <Images size={15} /> Gallery
          </button>
          <motion.button
            onClick={onNext}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm text-white"
            style={{ background: ACCENT }}
          >
            Next round <ChevronRight size={15} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
