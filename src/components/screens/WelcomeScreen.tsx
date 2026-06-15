import { motion } from "motion/react";
import { ACCENT } from "@/lib/constants";
import { FloatBg } from "@/components/effects/FloatBg";

const EXAMPLES = [
  { emoji: "🐱", name: "cat" },
  { emoji: "🌳", name: "tree" },
  { emoji: "🚀", name: "rocket" },
];

export function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -28 }}
      transition={{ duration: 0.38 }}
    >
      <FloatBg />
      <div className="relative z-10 flex flex-col items-center text-center gap-9 max-w-md w-full">

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4"
        >
          <div className="flex items-center justify-center gap-3">
            <motion.span
              className="text-4xl select-none"
              animate={{ rotate: [0, 14, -7, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, repeatDelay: 3 }}
            >
              ✋
            </motion.span>
            <h1
              className="text-6xl md:text-7xl font-black tracking-tight"
              style={{ fontFamily: "'Nunito', sans-serif", color: ACCENT }}
            >
              AirDraw
            </h1>
          </div>
          <p
            className="text-lg text-muted-foreground font-medium leading-relaxed max-w-xs mx-auto"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Draw in the air — your AI companion guesses what you&apos;re making in real time
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.48 }}
          className="flex flex-col items-center gap-3"
        >
          <motion.button
            onClick={onStart}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="px-12 py-4 rounded-2xl text-lg font-bold text-white"
            style={{
              background: ACCENT,
              fontFamily: "'Nunito', sans-serif",
              boxShadow: `0 10px 34px ${ACCENT}44`,
            }}
          >
            Start drawing
          </motion.button>
          <p className="text-xs text-muted-foreground">Camera optional — mouse and touch work too</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.45 }}
          className="flex items-center justify-center gap-6 bg-card border border-border rounded-3xl px-8 py-5 shadow-sm"
        >
          {EXAMPLES.map(({ emoji, name }) => (
            <div key={name} className="flex flex-col items-center gap-2">
              <span className="text-3xl">{emoji}</span>
              <span
                className="text-xs text-muted-foreground font-medium"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                {name}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
