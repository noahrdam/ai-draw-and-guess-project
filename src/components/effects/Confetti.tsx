import { motion } from "motion/react";
import { CONF_COLORS } from "@/lib/constants";

/** A burst of falling confetti pieces, used on a correct guess. */
export function Confetti() {
  const pieces = Array.from({ length: 48 }, (_, i) => ({
    id: i,
    x:     Math.random() * 100,
    dx:    (Math.random() - 0.5) * 70,
    color: CONF_COLORS[i % CONF_COLORS.length],
    w:     8 + Math.random() * 10,
    h:     5 + Math.random() * 7,
    rot:   Math.random() * 360,
    delay: Math.random() * 0.5,
    dur:   2.2 + Math.random() * 1.3,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50" aria-hidden>
      {pieces.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          style={{ left: `${p.x}%`, top: "-4%", width: p.w, height: p.h, background: p.color }}
          animate={{
            y:       ["0vh", "108vh"],
            x:       [0, p.dx],
            rotate:  [p.rot, p.rot + (Math.random() > 0.5 ? 540 : -540)],
            opacity: [1, 1, 0.2],
          }}
          transition={{ duration: p.dur, delay: p.delay, ease: "easeIn" }}
        />
      ))}
    </div>
  );
}
