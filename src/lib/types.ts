export type Screen = "welcome" | "countdown" | "drawing" | "result" | "gallery";
export type CameraState = "idle" | "requesting" | "granted" | "denied" | "error";
export type AIState = "idle" | "thinking" | "excited" | "correct";

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  points: Point[];
  color: string;
}

export interface Guess {
  id: string;
  word: string;
  confidence: number;
}

export interface RoundResult {
  correct: boolean;
  aiGuess: string;
  timeTaken: number;
  dataUrl: string;
}

export interface GalleryItem extends RoundResult {
  id: string;
  word: string;
}
