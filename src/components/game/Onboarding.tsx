import { motion } from "motion/react";
import { ACCENT } from "@/lib/constants";

/** Full-canvas overlay explaining the air-draw gestures; dismissed on tap. */
export function Onboarding({ onDismiss }: { onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="absolute inset-0 z-20 flex items-center justify-center cursor-pointer"
      style={{ background: "rgba(248,246,243,0.94)", backdropFilter: "blur(6px)" }}
      onClick={onDismiss}
    >
      <div className="text-center max-w-xs px-6">
        <p
          className="text-lg font-bold mb-6"
          style={{ fontFamily: "'Nunito', sans-serif" }}
        >
          How to draw
        </p>
        <div className="flex justify-center gap-8 mb-6">
          {[
            { icon: "✊", label: "Pinch to draw" },
            { icon: "✋", label: "Open to lift" },
          ].map(({ icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-2xl bg-white border border-border shadow-sm flex items-center justify-center text-2xl">
                {icon}
              </div>
              <span className="text-xs text-muted-foreground font-medium">{label}</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground mb-1">Or just click / tap to draw</p>
        <motion.p
          className="text-xs mt-4"
          style={{ color: `${ACCENT}80` }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        >
          Tap anywhere to start
        </motion.p>
      </div>
    </motion.div>
  );
}
