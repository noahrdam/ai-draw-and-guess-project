import { useCallback, useEffect, useRef, useState } from "react";
import type { CameraState } from "@/lib/types";

/** Requests the user-facing camera and exposes its lifecycle state. */
export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<CameraState>("idle");

  const request = useCallback(async () => {
    setState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setState("granted");
    } catch (e: unknown) {
      const name = (e as { name?: string })?.name;
      setState(name === "NotAllowedError" ? "denied" : "error");
    }
  }, []);

  useEffect(() => {
    request();
    return () => streamRef.current?.getTracks().forEach(t => t.stop());
  }, [request]);

  return { videoRef, state, request };
}
