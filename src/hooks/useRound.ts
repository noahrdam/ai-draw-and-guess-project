import { useCallback, useEffect, useRef, useState } from "react";
import { getProgression } from "@/lib/ai";
import { ROUND_DURATION } from "@/lib/constants";
import type { AIState, Guess, RoundResult } from "@/lib/types";

/**
 * Drives a single drawing round: the countdown timer and the scripted AI
 * guess progression. Calls `onRoundEnd` exactly once, when the AI gets it
 * right, the timer runs out, or the player skips.
 */
export function useRound(
  word: string,
  getDataUrl: () => string,
  onRoundEnd: (result: RoundResult) => void,
) {
  const intervalId = useRef<ReturnType<typeof setInterval>>();
  const timeoutIds = useRef<ReturnType<typeof setTimeout>[]>([]);
  const doneRef = useRef(false);
  const timerVal = useRef(ROUND_DURATION);
  const guessesRef = useRef<Guess[]>([]);

  // Keep mutable callbacks fresh without retriggering the timing effects.
  const onEndRef = useRef(onRoundEnd);
  const getDataUrlRef = useRef(getDataUrl);
  useEffect(() => { onEndRef.current = onRoundEnd; }, [onRoundEnd]);
  useEffect(() => { getDataUrlRef.current = getDataUrl; }, [getDataUrl]);

  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [aiState, setAIState] = useState<AIState>("idle");
  const [timer, setTimer] = useState(ROUND_DURATION);
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => { guessesRef.current = guesses; }, [guesses]);

  const finish = useCallback((correct: boolean) => {
    if (doneRef.current) return;
    doneRef.current = true;
    clearInterval(intervalId.current);
    timeoutIds.current.forEach(clearTimeout);
    const dataUrl = getDataUrlRef.current();
    const aiGuess = guessesRef.current[0]?.word ?? "nothing";
    const timeTaken = Math.max(1, ROUND_DURATION - timerVal.current);
    onEndRef.current({ correct, aiGuess, timeTaken, dataUrl });
  }, []);

  // Countdown timer.
  useEffect(() => {
    intervalId.current = setInterval(() => {
      setTimer(prev => {
        const next = prev - 1;
        timerVal.current = next;
        if (next <= 0) finish(false);
        return Math.max(0, next);
      });
    }, 1000);
    return () => clearInterval(intervalId.current);
  }, [finish]);

  // Scripted AI guesses.
  useEffect(() => {
    const prog = getProgression(word);
    timeoutIds.current = prog.map(({ delay, guesses: g }) =>
      setTimeout(() => {
        setGuesses(g);
        guessesRef.current = g;
        const top = g[0]?.confidence ?? 0;
        setAIState(top >= 0.9 ? "correct" : top >= 0.5 ? "excited" : "thinking");
        if (top >= 0.9) {
          setCelebrate(true);
          setTimeout(() => finish(true), 1500);
        }
      }, delay),
    );
    return () => timeoutIds.current.forEach(clearTimeout);
  }, [word, finish]);

  const skip = useCallback(() => finish(false), [finish]);

  return { timer, guesses, aiState, celebrate, skip };
}
