import { AnimatePresence, motion } from "motion/react";
import type { AIState, Guess } from "@/lib/types";
import { GuessBubble } from "./GuessBubble";

const AI_MSGS: Record<AIState, string> = {
  idle:     "Waiting for your drawing...",
  thinking: "Hmm, let me see...",
  excited:  "Oh! I think I know this...",
  correct:  "Yes! I got it!",
};

const AI_DOT: Record<AIState, string> = {
  idle:     "#C0BDB8",
  thinking: "#3B7DD8",
  excited:  "#F5A623",
  correct:  "#2BAA72",
};

/** Live status line plus the ranked list of AI guesses. */
export function AIPanel({ state, guesses }: { state: AIState; guesses: Guess[] }) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2 mb-0.5">
        <motion.div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ background: AI_DOT[state] }}
          animate={state !== "idle" ? { scale: [1, 1.45, 1] } : { scale: 1 }}
          transition={{ duration: 0.85, repeat: state !== "idle" ? Infinity : 0 }}
        />
        <AnimatePresence mode="wait">
          <motion.span
            key={state}
            className="text-sm text-muted-foreground font-medium"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
          >
            {AI_MSGS[state]}
          </motion.span>
        </AnimatePresence>
      </div>

      <AnimatePresence mode="popLayout">
        {guesses.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-dashed border-border p-5 text-center"
          >
            <p className="text-sm text-muted-foreground">Guesses appear as you draw...</p>
          </motion.div>
        ) : (
          guesses.map((g, i) => <GuessBubble key={g.id} guess={g} rank={i} />)
        )}
      </AnimatePresence>
    </div>
  );
}
