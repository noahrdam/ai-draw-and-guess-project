import { motion } from "motion/react";
import { ACCENT } from "@/lib/constants";
import type { Guess } from "@/lib/types";

/** A single AI guess with an animated confidence bar. */
export function GuessBubble({ guess, rank }: { guess: Guess; rank: number }) {
  const pct = Math.round(guess.confidence * 100);
  const top = rank === 0;
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className={`rounded-2xl p-3.5 ${top ? "bg-white border border-border shadow-sm" : "bg-background"}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className={`font-semibold capitalize text-sm ${top ? "text-foreground" : "text-muted-foreground"}`}
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          {guess.word}
        </span>
        <span
          className="text-xs font-medium tabular-nums"
          style={{ fontFamily: "'DM Mono', monospace", color: top ? ACCENT : "#B0ADA8" }}
        >
          {pct}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: top ? ACCENT : "#D0CCC6" }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </motion.div>
  );
}
