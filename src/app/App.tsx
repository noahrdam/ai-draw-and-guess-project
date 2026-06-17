import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import { WORDS } from "@/lib/constants";
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
  const [winStreak, setWinStreak] = useState(0);
  const [highStreak, setHighStreak] = useState(() => Number(localStorage.getItem("highStreak") ?? 0));
  const [musicPlaying, setMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio("/mondamusic-retro-arcade-game-music-512837.mp3");
    audio.loop = true;
    audio.volume = 0.5;
    audioRef.current = audio;
    const unlock = () => {
      audio.play().then(() => audio.pause()).catch(() => {});
    };
    document.addEventListener("pointerdown", unlock, { once: true });
    return () => {
      audio.pause();
      audio.src = "";
      document.removeEventListener("pointerdown", unlock);
    };
  }, []);

  const toggleMusic = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => {});
      setMusicPlaying(true);
    } else {
      audio.pause();
      setMusicPlaying(false);
    }
  }, []);

  const startRound = useCallback(() => {
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    setRound({ id: Date.now(), word });
    setScreen("countdown");
  }, []);

  const handleRoundEnd = useCallback((result: RoundResult, word: string) => {
    setLastResult(result);
    setGallery(prev => [{ ...result, id: String(Date.now()), word }, ...prev]);
    setWinStreak(prev => {
      const next = result.correct ? prev + 1 : 0;
      setHighStreak(best => {
        if (next > best) {
          localStorage.setItem("highStreak", String(next));
          return next;
        }
        return best;
      });
      return next;
    });
    setScreen("result");
  }, []);

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <AnimatePresence mode="wait">
        {screen === "welcome" && (
          <WelcomeScreen key="welcome" highStreak={highStreak} onStart={startRound} />
        )}
        {screen === "countdown" && round && (
          <CountdownScreen
            key="countdown"
            word={round.word}
            winStreak={winStreak}
            onDone={() => setScreen("drawing")}
          />
        )}
        {screen === "drawing" && round && (
          <DrawingScreen
            key={`draw-${round.id}`}
            word={round.word}
            winStreak={winStreak}
            highStreak={highStreak}
            musicPlaying={musicPlaying}
            onToggleMusic={toggleMusic}
            onRoundEnd={(r) => handleRoundEnd(r, round.word)}
          />
        )}
        {screen === "result" && lastResult && round && (
          <ResultScreen
            key="result"
            word={round.word}
            aiGuess={lastResult.aiGuess}
            aiGuessConfidence={lastResult.aiGuessConfidence}
            correct={lastResult.correct}
            timeTaken={lastResult.timeTaken}
            dataUrl={lastResult.dataUrl}
            winStreak={winStreak}
            highStreak={highStreak}
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
