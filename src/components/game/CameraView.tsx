import type { RefObject } from "react";
import { motion } from "motion/react";
import { Camera, CameraOff } from "lucide-react";
import { ACCENT } from "@/lib/constants";
import type { CameraState } from "@/lib/types";

interface Props {
  videoRef: RefObject<HTMLVideoElement>;
  state: CameraState;
  onRequest: () => void;
}

/** Webcam preview with overlays for each permission/availability state. */
export function CameraView({ videoRef, state, onRequest }: Props) {
  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-muted border border-border flex-shrink-0">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
      />

      {state !== "granted" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 text-center p-4 bg-card/96">
          {state === "requesting" ? (
            <>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                <Camera size={24} className="text-muted-foreground" />
              </motion.div>
              <p className="text-xs text-muted-foreground">Requesting camera...</p>
            </>
          ) : state === "denied" ? (
            <>
              <CameraOff size={22} className="text-muted-foreground" />
              <p className="text-xs font-semibold">Camera blocked</p>
              <p className="text-xs text-muted-foreground leading-relaxed">Allow camera to air-draw. You can still use your mouse.</p>
            </>
          ) : state === "error" ? (
            <>
              <CameraOff size={22} className="text-muted-foreground" />
              <p className="text-xs font-semibold">No camera found</p>
              <p className="text-xs text-muted-foreground">Draw with mouse or touch.</p>
            </>
          ) : (
            <>
              <Camera size={22} style={{ color: ACCENT }} />
              <p className="text-xs font-semibold">Enable air-drawing</p>
              <button
                onClick={onRequest}
                className="mt-0.5 px-4 py-2 rounded-xl text-xs font-bold text-white"
                style={{ background: ACCENT }}
              >
                Allow camera
              </button>
            </>
          )}
        </div>
      )}

      {state === "granted" && (
        <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          <span className="text-[10px] text-white font-medium tracking-wide">LIVE</span>
        </div>
      )}
    </div>
  );
}
