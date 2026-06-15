import { motion } from "motion/react";
import { ACCENT } from "@/lib/constants";
import { Confetti } from "@/components/effects/Confetti";

/** Confetti and a congratulatory card shown when the AI guesses correctly. */
export function CelebrationOverlay({ word }: { word: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 pointer-events-none z-40"
    >
      <Confetti />
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.4, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 460, damping: 22 }}
          className="bg-white rounded-3xl px-10 py-7 shadow-2xl text-center border border-border"
        >
          <div className="text-5xl mb-2">🎉</div>
          <p
            className="text-3xl font-black capitalize"
            style={{ fontFamily: "'Nunito', sans-serif", color: ACCENT }}
          >
            {word}!
          </p>
          <p className="text-sm text-muted-foreground mt-1 font-medium">The AI got it!</p>
        </motion.div>
      </div>
    </motion.div>
  );
}
