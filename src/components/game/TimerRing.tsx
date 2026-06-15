import { motion } from "motion/react";
import { ACCENT, ROUND_DURATION } from "@/lib/constants";

/** Circular countdown indicator that shifts colour as time runs low. */
export function TimerRing({ value }: { value: number }) {
  const pct = value / ROUND_DURATION;
  const R = 18;
  const C = 2 * Math.PI * R;
  const color = pct > 0.5 ? "#2BAA72" : pct > 0.25 ? "#F5A623" : ACCENT;
  return (
    <div className="relative flex items-center justify-center w-12 h-12">
      <svg width="48" height="48" className="-rotate-90 absolute inset-0">
        <circle cx="24" cy="24" r={R} fill="none" stroke="#E8E4DE" strokeWidth="3" />
        <motion.circle
          cx="24" cy="24" r={R}
          fill="none" stroke={color} strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={C}
          animate={{ strokeDashoffset: C * (1 - pct) }}
          transition={{ duration: 0.5 }}
        />
      </svg>
      <span
        className="relative text-xs font-semibold tabular-nums"
        style={{ fontFamily: "'DM Mono', monospace", color }}
      >
        {value}
      </span>
    </div>
  );
}
