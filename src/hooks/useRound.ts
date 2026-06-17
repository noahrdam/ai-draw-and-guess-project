import { useCallback, useEffect, useRef, useState } from "react";
import { EXCITED_CONFIDENCE, INFER_INTERVAL, ROUND_DURATION, WIN_CONFIDENCE } from "@/lib/constants";
import { classify, loadRecognizer } from "@/lib/recognizer";
import type { AIState, Guess, RoundResult, Stroke } from "@/lib/types";

/**
 * Drives a single drawing round: the countdown timer and the live recognition
 * loop. Every INFER_INTERVAL it runs the current drawing through the model,
 * updates the ranked guesses and AI mood, and ends the round when the model
 * confidently names the target word (or the timer runs out / the player skips).
 * Calls `onRoundEnd` exactly once.
 */
export function useRound(
  word: string,
  getStrokes: () => Stroke[],
  getDataUrl: () => string,
  onRoundEnd: (result: RoundResult) => void,
) {
  const intervalId = useRef<ReturnType<typeof setInterval>>();
  const inferId = useRef<ReturnType<typeof setInterval>>();
  const doneRef = useRef(false);
  const busyRef = useRef(false);
  const timerVal = useRef(ROUND_DURATION);
  const guessesRef = useRef<Guess[]>([]);

  // Keep mutable callbacks fresh without retriggering the timing effects.
  const onEndRef = useRef(onRoundEnd);
  const getDataUrlRef = useRef(getDataUrl);
  const getStrokesRef = useRef(getStrokes);
  useEffect(() => { onEndRef.current = onRoundEnd; }, [onRoundEnd]);
  useEffect(() => { getDataUrlRef.current = getDataUrl; }, [getDataUrl]);
  useEffect(() => { getStrokesRef.current = getStrokes; }, [getStrokes]);

  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [aiState, setAIState] = useState<AIState>("idle");
  const [timer, setTimer] = useState(ROUND_DURATION);
  const [celebrate, setCelebrate] = useState(false);

  const finish = useCallback((correct: boolean) => {
    if (doneRef.current) return;
    doneRef.current = true;
    clearInterval(intervalId.current);
    clearInterval(inferId.current);
    const dataUrl = getDataUrlRef.current();
    const winGuess = correct
      ? guessesRef.current.find(g => g.id === word)
      : guessesRef.current[0];
    const aiGuess = winGuess?.word ?? "nothing";
    const aiGuessConfidence = winGuess?.confidence ?? 0;
    const timeTaken = Math.max(1, ROUND_DURATION - timerVal.current);
    onEndRef.current({ correct, aiGuess, aiGuessConfidence, timeTaken, dataUrl });
  }, [word]);

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

  // Live recognition loop.
  useEffect(() => {
    loadRecognizer().catch(() => {/* surfaced in console; round still works on timer */});

    inferId.current = setInterval(async () => {
      if (doneRef.current || busyRef.current) return;
      const strokes = getStrokesRef.current();
      if (strokes.length === 0) {
        setGuesses([]);
        guessesRef.current = [];
        setAIState("idle");
        return;
      }

      busyRef.current = true;
      try {
        const ranked = await classify(strokes);
        if (doneRef.current || ranked.length === 0) return;

        setGuesses(ranked);
        guessesRef.current = ranked;

        const top = ranked[0];
        const won = ranked.some(g => g.id === word && g.confidence >= WIN_CONFIDENCE);
        setAIState(won ? "correct" : top.confidence >= EXCITED_CONFIDENCE ? "excited" : "thinking");

        if (won) {
          setCelebrate(true);
          setTimeout(() => finish(true), 1500);
        }
      } finally {
        busyRef.current = false;
      }
    }, INFER_INTERVAL);

    return () => clearInterval(inferId.current);
  }, [word, finish]);

  const skip = useCallback(() => finish(false), [finish]);

  return { timer, guesses, aiState, celebrate, skip };
}
