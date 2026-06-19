import { useCallback, useState } from "react";
import { AnimatePresence } from "motion/react";
import { nextWord } from "@/lib/wordPicker";
import type { GalleryItem, RoundResult, Screen } from "@/lib/types";
import { WelcomeScreen } from "@/components/screens/WelcomeScreen";
import { CountdownScreen } from "@/components/screens/CountdownScreen";
import { DrawingScreen } from "@/components/screens/DrawingScreen";
import { ResultScreen } from "@/components/screens/ResultScreen";
import { GalleryScreen } from "@/components/screens/GalleryScreen";

interface RoundState {
  id: number;
  word: string;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [round, setRound] = useState<RoundState | null>(null);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);

  const startRound = useCallback(() => {
    setRound({ id: Date.now(), word: nextWord() });
    setScreen("countdown");
  }, []);

  const handleRoundEnd = useCallback((result: RoundResult, word: string) => {
    setLastResult(result);
    setGallery(prev => [{ ...result, id: String(Date.now()), word }, ...prev]);
    setScreen("result");
  }, []);

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <AnimatePresence mode="wait">
        {screen === "welcome" && (
          <WelcomeScreen key="welcome" onStart={startRound} />
        )}
        {screen === "countdown" && round && (
          <CountdownScreen
            key="countdown"
            word={round.word}
            onDone={() => setScreen("drawing")}
          />
        )}
        {screen === "drawing" && round && (
          <DrawingScreen
            key={`draw-${round.id}`}
            word={round.word}
            onRoundEnd={(r) => handleRoundEnd(r, round.word)}
          />
        )}
        {screen === "result" && lastResult && round && (
          <ResultScreen
            key="result"
            word={round.word}
            aiGuess={lastResult.aiGuess}
            correct={lastResult.correct}
            timeTaken={lastResult.timeTaken}
            dataUrl={lastResult.dataUrl}
            onNext={startRound}
            onGallery={() => setScreen("gallery")}
          />
        )}
        {screen === "gallery" && (
          <GalleryScreen
            key="gallery"
            items={gallery}
            onBack={() => setScreen("welcome")}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
