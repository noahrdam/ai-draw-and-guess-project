import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ACCENT } from "@/lib/constants";

/** Shows the word to draw, then a 3-2-1-Go! countdown before the round. */
export function CountdownScreen({ word, onDone }: { word: string; onDone: () => void }) {
  const [phase, setPhase] = useState<"word" | "count">("word");
  const [count, setCount] = useState(3);

  useEffect(() => {
    const t = setTimeout(() => setPhase("count"), 2000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase !== "count") return;
    if (count === 0) {
      const t = setTimeout(onDone, 420);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setCount(c => c - 1), 820);
    return () => clearTimeout(t);
  }, [count, phase, onDone]);

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <AnimatePresence mode="wait">
        {phase === "word" ? (
          <motion.div
            key="word"
            className="text-center px-6"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -32 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
          >
            <p
              className="text-xl text-muted-foreground font-medium mb-3"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Draw a...
            </p>
            <h2
              className="text-7xl md:text-9xl font-black capitalize leading-none"
              style={{ fontFamily: "'Nunito', sans-serif", color: ACCENT }}
            >
              {word}
            </h2>
          </motion.div>
        ) : (
          <motion.div
            key={`n${count}`}
            className="select-none leading-none"
            initial={{ scale: 1.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.45, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 26 }}
            style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: "clamp(7rem, 18vw, 14rem)",
              fontWeight: 900,
              color: count === 0 ? ACCENT : "#1C1B20",
            }}
          >
            {count === 0 ? "Go!" : count}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
