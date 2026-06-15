import { motion } from "motion/react";
import { RotateCcw } from "lucide-react";
import type { GalleryItem } from "@/lib/types";

interface Props {
  items: GalleryItem[];
  onBack: () => void;
}

/** Grid of every drawing made this session with its AI verdict. */
export function GalleryScreen({ items, onBack }: Props) {
  return (
    <motion.div
      className="flex flex-col min-h-screen"
      initial={{ opacity: 0, x: 32 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -32 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="flex items-center gap-4 px-5 md:px-8 py-4 border-b border-border bg-card/90 backdrop-blur-sm">
        <button
          onClick={onBack}
          className="p-2 rounded-xl hover:bg-muted transition-colors"
          aria-label="Back"
        >
          <RotateCcw size={17} />
        </button>
        <h2
          className="text-2xl font-black"
          style={{ fontFamily: "'Nunito', sans-serif" }}
        >
          Your Gallery
        </h2>
        <span className="text-sm text-muted-foreground ml-auto font-medium">
          {items.length} drawing{items.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="flex-1 p-5 md:p-8 overflow-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center gap-4">
            <span className="text-7xl opacity-20 select-none">🖼️</span>
            <p className="text-muted-foreground font-medium">No drawings yet.</p>
            <p className="text-sm text-muted-foreground">Complete a round to see your drawings here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.045, type: "spring", stiffness: 300, damping: 28 }}
                className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="aspect-video bg-muted">
                  <img
                    src={item.dataUrl}
                    alt={`Drawing of ${item.word}`}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold capitalize text-sm">{item.word}</span>
                    <span
                      className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                      style={
                        item.correct
                          ? { background: "#2BAA7218", color: "#2BAA72" }
                          : { background: "#F5A62318", color: "#C07F00" }
                      }
                    >
                      {item.correct ? "✓ Correct" : "✗ Missed"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground capitalize">
                    AI: &ldquo;{item.aiGuess}&rdquo;
                  </p>
                  <p
                    className="text-xs text-muted-foreground mt-0.5"
                    style={{ fontFamily: "'DM Mono', monospace" }}
                  >
                    {item.timeTaken}s
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
