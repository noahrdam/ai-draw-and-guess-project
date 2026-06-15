import { motion } from "motion/react";
import { ACCENT } from "@/lib/constants";

const BG = [
  { x: "8%",  y: "18%", r: 110, c: "rgba(255,85,51,0.055)",  d: 9,  dl: 0   },
  { x: "78%", y: "12%", r: 75,  c: "rgba(59,125,216,0.045)", d: 11, dl: 1.5 },
  { x: "88%", y: "60%", r: 150, c: "rgba(255,85,51,0.038)",  d: 13, dl: 0.7 },
  { x: "3%",  y: "68%", r: 95,  c: "rgba(245,166,35,0.05)",  d: 10, dl: 2   },
  { x: "48%", y: "78%", r: 60,  c: "rgba(43,170,114,0.04)",  d: 12, dl: 0.5 },
  { x: "30%", y: "7%",  r: 85,  c: "rgba(155,89,182,0.04)",  d: 14, dl: 1   },
];

/** Ambient floating blobs and a drifting line behind the welcome screen. */
export function FloatBg() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>
      {BG.map((s, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{ left: s.x, top: s.y, width: s.r * 2, height: s.r * 2, background: s.c }}
          animate={{ y: [0, -26, 0], x: [0, 14, 0] }}
          transition={{ duration: s.d, delay: s.dl, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 900 600" aria-hidden>
        <motion.path
          d="M80 300 Q220 110 360 300 Q500 490 640 300 Q780 110 870 300"
          fill="none"
          stroke={ACCENT}
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: [0, 1, 1, 0], opacity: [0, 0.055, 0.055, 0] }}
          transition={{ duration: 5.5, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
        />
      </svg>
    </div>
  );
}
