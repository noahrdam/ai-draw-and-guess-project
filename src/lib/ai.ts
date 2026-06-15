import { DISTRACTORS } from "./constants";
import type { Guess } from "./types";

/**
 * A scripted sequence of guesses that simulates an AI growing more confident
 * over time, ending on the real word at 95% confidence.
 */
export function getProgression(word: string): Array<{ delay: number; guesses: Guess[] }> {
  const d = DISTRACTORS[word] ?? ["something", "an object", "a shape"];
  return [
    { delay: 1800, guesses: [
      { id: "a", word: d[0], confidence: 0.22 },
      { id: "b", word: d[1], confidence: 0.16 },
    ]},
    { delay: 5200, guesses: [
      { id: "a", word: d[0], confidence: 0.29 },
      { id: "c", word: word,  confidence: 0.24 },
      { id: "b", word: d[1], confidence: 0.18 },
    ]},
    { delay: 9800, guesses: [
      { id: "c", word: word,  confidence: 0.64 },
      { id: "a", word: d[0], confidence: 0.20 },
    ]},
    { delay: 15500, guesses: [
      { id: "c", word: word,  confidence: 0.95 },
    ]},
  ];
}
