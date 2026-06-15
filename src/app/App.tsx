import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trash2, Undo2, Camera, CameraOff, ChevronRight, RotateCcw, Images, Star } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

type Screen = "welcome" | "countdown" | "drawing" | "result" | "gallery";
type CameraState = "idle" | "requesting" | "granted" | "denied" | "error";
type AIState = "idle" | "thinking" | "excited" | "correct";

interface Point { x: number; y: number }
interface Stroke { points: Point[]; color: string }
interface Guess { id: string; word: string; confidence: number }
interface RoundResult { correct: boolean; aiGuess: string; timeTaken: number; dataUrl: string }
interface GalleryItem extends RoundResult { id: string; word: string }

// ─── Constants ──────────────────────────────────────────────────────────────

const WORDS = [
  "cat", "sun", "tree", "house", "fish",
  "bird", "rocket", "flower", "star", "pizza",
  "boat", "hat", "moon", "heart", "elephant",
];
const ROUND_DURATION = 60;
const CW = 800;
const CH = 600;
const ACCENT = "#FF5533";
const PALETTE = ["#1C1B20", "#FF5533", "#3B7DD8", "#2BAA72", "#F5A623", "#9B59B6"];
const CONF_COLORS = [ACCENT, "#3B7DD8", "#F5A623", "#2BAA72", "#9B59B6", "#FFD700"];

const DISTRACTORS: Record<string, [string, string, string]> = {
  cat:      ["dog", "rabbit", "fox"],
  sun:      ["circle", "star", "light"],
  tree:     ["plant", "broccoli", "bush"],
  house:    ["building", "shed", "barn"],
  fish:     ["whale", "shark", "animal"],
  bird:     ["plane", "bat", "butterfly"],
  rocket:   ["missile", "pencil", "tower"],
  flower:   ["plant", "pinwheel", "star"],
  star:     ["sparkle", "sun", "shape"],
  pizza:    ["pie", "clock", "wheel"],
  boat:     ["ship", "surfboard", "bridge"],
  hat:      ["mushroom", "cone", "crown"],
  moon:     ["banana", "crescent", "boomerang"],
  heart:    ["shape", "butterfly", "leaf"],
  elephant: ["hippo", "rhino", "whale"],
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function getProgression(word: string): Array<{ delay: number; guesses: Guess[] }> {
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

function getPoint(e: { clientX: number; clientY: number }, canvas: HTMLCanvasElement): Point {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) / r.width)  * CW,
    y: ((e.clientY - r.top)  / r.height) * CH,
  };
}

function renderCanvas(
  ctx: CanvasRenderingContext2D,
  committed: Stroke[],
  live: Point[],
  color: string,
) {
  ctx.clearRect(0, 0, CW, CH);
  const all = live.length > 1 ? [...committed, { points: live, color }] : committed;
  for (const s of all) {
    if (s.points.length < 2) continue;
    ctx.beginPath();
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.moveTo(s.points[0].x, s.points[0].y);
    for (let i = 1; i < s.points.length; i++) ctx.lineTo(s.points[i].x, s.points[i].y);
    ctx.stroke();
  }
}

// ─── FloatBg ────────────────────────────────────────────────────────────────

const BG = [
  { x: "8%",  y: "18%", r: 110, c: "rgba(255,85,51,0.055)",  d: 9,  dl: 0   },
  { x: "78%", y: "12%", r: 75,  c: "rgba(59,125,216,0.045)", d: 11, dl: 1.5 },
  { x: "88%", y: "60%", r: 150, c: "rgba(255,85,51,0.038)",  d: 13, dl: 0.7 },
  { x: "3%",  y: "68%", r: 95,  c: "rgba(245,166,35,0.05)",  d: 10, dl: 2   },
  { x: "48%", y: "78%", r: 60,  c: "rgba(43,170,114,0.04)",  d: 12, dl: 0.5 },
  { x: "30%", y: "7%",  r: 85,  c: "rgba(155,89,182,0.04)",  d: 14, dl: 1   },
];

function FloatBg() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>
      {BG.map((s, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{ left: s.x, top: s.y, width: s.r * 2, height: s.r * 2, background: s.c }}
          animate={{ y: [0, -26, 0], x: [0, 14, 0] }}
          transition={{ duration: s.d, delay: s.dl, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 900 600" aria-hidden>
        <motion.path
          d="M80 300 Q220 110 360 300 Q500 490 640 300 Q780 110 870 300"
          fill="none"
          stroke={ACCENT}
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: [0, 1, 1, 0], opacity: [0, 0.055, 0.055, 0] }}
          transition={{ duration: 5.5, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
        />
      </svg>
    </div>
  );
}

// ─── Confetti ───────────────────────────────────────────────────────────────

function Confetti() {
  const pieces = Array.from({ length: 48 }, (_, i) => ({
    id: i,
    x:     Math.random() * 100,
    dx:    (Math.random() - 0.5) * 70,
    color: CONF_COLORS[i % CONF_COLORS.length],
    w:     8 + Math.random() * 10,
    h:     5 + Math.random() * 7,
    rot:   Math.random() * 360,
    delay: Math.random() * 0.5,
    dur:   2.2 + Math.random() * 1.3,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50" aria-hidden>
      {pieces.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          style={{ left: `${p.x}%`, top: "-4%", width: p.w, height: p.h, background: p.color }}
          animate={{
            y:       ["0vh", "108vh"],
            x:       [0, p.dx],
            rotate:  [p.rot, p.rot + (Math.random() > 0.5 ? 540 : -540)],
            opacity: [1, 1, 0.2],
          }}
          transition={{ duration: p.dur, delay: p.delay, ease: "easeIn" }}
        />
      ))}
    </div>
  );
}

// ─── GuessBubble ─────────────────────────────────────────────────────────────

function GuessBubble({ guess, rank }: { guess: Guess; rank: number }) {
  const pct = Math.round(guess.confidence * 100);
  const top = rank === 0;
  return (
    <motion.div
      layout
      layoutId={guess.id}
      initial={{ opacity: 0, x: 28, scale: 0.88 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -20, scale: 0.88 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className={`rounded-2xl p-3.5 ${top ? "bg-white border border-border shadow-sm" : "bg-background"}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className={`font-semibold capitalize text-sm ${top ? "text-foreground" : "text-muted-foreground"}`}
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          {guess.word}
        </span>
        <span
          className="text-xs font-medium tabular-nums"
          style={{ fontFamily: "'DM Mono', monospace", color: top ? ACCENT : "#B0ADA8" }}
        >
          {pct}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: top ? ACCENT : "#D0CCC6" }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </motion.div>
  );
}

// ─── AIPanel ─────────────────────────────────────────────────────────────────

const AI_MSGS: Record<AIState, string> = {
  idle:    "Waiting for your drawing...",
  thinking: "Hmm, let me see...",
  excited:  "Oh! I think I know this...",
  correct:  "Yes! I got it!",
};
const AI_DOT: Record<AIState, string> = {
  idle:    "#C0BDB8",
  thinking: "#3B7DD8",
  excited:  "#F5A623",
  correct:  "#2BAA72",
};

function AIPanel({ state, guesses }: { state: AIState; guesses: Guess[] }) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2 mb-0.5">
        <motion.div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ background: AI_DOT[state] }}
          animate={state !== "idle" ? { scale: [1, 1.45, 1] } : { scale: 1 }}
          transition={{ duration: 0.85, repeat: state !== "idle" ? Infinity : 0 }}
        />
        <AnimatePresence mode="wait">
          <motion.span
            key={state}
            className="text-sm text-muted-foreground font-medium"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
          >
            {AI_MSGS[state]}
          </motion.span>
        </AnimatePresence>
      </div>

      <AnimatePresence mode="popLayout">
        {guesses.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-dashed border-border p-5 text-center"
          >
            <p className="text-sm text-muted-foreground">Guesses appear as you draw...</p>
          </motion.div>
        ) : (
          guesses.map((g, i) => <GuessBubble key={g.id} guess={g} rank={i} />)
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── TimerRing ──────────────────────────────────────────────────────────────

function TimerRing({ value }: { value: number }) {
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

// ─── CameraView ──────────────────────────────────────────────────────────────

function CameraView({
  videoRef,
  state,
  onRequest,
}: {
  videoRef: React.MutableRefObject<HTMLVideoElement | null>;
  state: CameraState;
  onRequest: () => void;
}) {
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

// ─── Onboarding ──────────────────────────────────────────────────────────────

function Onboarding({ onDismiss }: { onDismiss: () => void }) {
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

// ─── WelcomeScreen ───────────────────────────────────────────────────────────

function WelcomeScreen({ onStart }: { onStart: () => void }) {
  const examples = [
    { emoji: "🐱", name: "cat" },
    { emoji: "🌳", name: "tree" },
    { emoji: "🚀", name: "rocket" },
  ];
  return (
    <motion.div
      className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -28 }}
      transition={{ duration: 0.38 }}
    >
      <FloatBg />
      <div className="relative z-10 flex flex-col items-center text-center gap-9 max-w-md w-full">

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4"
        >
          <div className="flex items-center justify-center gap-3">
            <motion.span
              className="text-4xl select-none"
              animate={{ rotate: [0, 14, -7, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, repeatDelay: 3 }}
            >
              ✋
            </motion.span>
            <h1
              className="text-6xl md:text-7xl font-black tracking-tight"
              style={{ fontFamily: "'Nunito', sans-serif", color: ACCENT }}
            >
              AirDraw
            </h1>
          </div>
          <p
            className="text-lg text-muted-foreground font-medium leading-relaxed max-w-xs mx-auto"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Draw in the air — your AI companion guesses what you&apos;re making in real time
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.48 }}
          className="flex flex-col items-center gap-3"
        >
          <motion.button
            onClick={onStart}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="px-12 py-4 rounded-2xl text-lg font-bold text-white"
            style={{
              background: ACCENT,
              fontFamily: "'Nunito', sans-serif",
              boxShadow: `0 10px 34px ${ACCENT}44`,
            }}
          >
            Start drawing
          </motion.button>
          <p className="text-xs text-muted-foreground">Camera optional — mouse and touch work too</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.45 }}
          className="flex items-center justify-center gap-6 bg-card border border-border rounded-3xl px-8 py-5 shadow-sm"
        >
          {examples.map(({ emoji, name }) => (
            <div key={name} className="flex flex-col items-center gap-2">
              <span className="text-3xl">{emoji}</span>
              <span
                className="text-xs text-muted-foreground font-medium"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                {name}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─── CountdownScreen ─────────────────────────────────────────────────────────

function CountdownScreen({ word, onDone }: { word: string; onDone: () => void }) {
  const [phase, setPhase] = useState<"word" | "count">("word");
  const [count, setCount] = useState(3);

  useEffect(() => {
    const t = setTimeout(() => setPhase("count"), 2000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase !== "count") return;
    if (count === 0) {
      const t = setTimeout(onDone, 420);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setCount(c => c - 1), 820);
    return () => clearTimeout(t);
  }, [count, phase, onDone]);

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <AnimatePresence mode="wait">
        {phase === "word" ? (
          <motion.div
            key="word"
            className="text-center px-6"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -32 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
          >
            <p
              className="text-xl text-muted-foreground font-medium mb-3"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Draw a...
            </p>
            <h2
              className="text-7xl md:text-9xl font-black capitalize leading-none"
              style={{ fontFamily: "'Nunito', sans-serif", color: ACCENT }}
            >
              {word}
            </h2>
          </motion.div>
        ) : (
          <motion.div
            key={`n${count}`}
            className="select-none leading-none"
            initial={{ scale: 1.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.45, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 26 }}
            style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: "clamp(7rem, 18vw, 14rem)",
              fontWeight: 900,
              color: count === 0 ? ACCENT : "#1C1B20",
            }}
          >
            {count === 0 ? "Go!" : count}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── DrawingScreen ────────────────────────────────────────────────────────────

function DrawingScreen({
  word,
  onRoundEnd,
}: {
  word: string;
  onRoundEnd: (r: RoundResult) => void;
}) {
  const canvasRef  = useRef<HTMLCanvasElement | null>(null);
  const videoRef   = useRef<HTMLVideoElement | null>(null);
  const streamRef  = useRef<MediaStream | null>(null);
  const intervalId = useRef<ReturnType<typeof setInterval>>();
  const timeoutIds = useRef<ReturnType<typeof setTimeout>[]>([]);
  const doneRef    = useRef(false);
  const timerVal   = useRef(ROUND_DURATION);
  const guessesRef = useRef<Guess[]>([]);
  const onEndRef   = useRef(onRoundEnd);
  useEffect(() => { onEndRef.current = onRoundEnd; }, [onRoundEnd]);

  const [strokes,   setStrokes]   = useState<Stroke[]>([]);
  const [live,      setLive]      = useState<Point[]>([]);
  const [pressing,  setPressing]  = useState(false);
  const [color,     setColor]     = useState(PALETTE[0]);
  const [camState,  setCamState]  = useState<CameraState>("idle");
  const [guesses,   setGuesses]   = useState<Guess[]>([]);
  const [aiState,   setAIState]   = useState<AIState>("idle");
  const [timer,     setTimer]     = useState(ROUND_DURATION);
  const [onboarding, setOnboarding] = useState(true);
  const [cursor,    setCursor]    = useState<Point | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => { guessesRef.current = guesses; }, [guesses]);

  // Canvas redraw
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) renderCanvas(ctx, strokes, live, color);
  }, [strokes, live, color]);

  const finish = useCallback((correct: boolean) => {
    if (doneRef.current) return;
    doneRef.current = true;
    clearInterval(intervalId.current);
    timeoutIds.current.forEach(clearTimeout);
    const dataUrl  = canvasRef.current?.toDataURL() ?? "";
    const aiGuess  = guessesRef.current[0]?.word ?? "nothing";
    const timeTaken = Math.max(1, ROUND_DURATION - timerVal.current);
    onEndRef.current({ correct, aiGuess, timeTaken, dataUrl });
  }, []);

  // Timer
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

  // AI progression
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
      }, delay)
    );
    return () => timeoutIds.current.forEach(clearTimeout);
  }, [word, finish]);

  // Camera
  const requestCamera = useCallback(async () => {
    setCamState("requesting");
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = s;
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        await videoRef.current.play();
      }
      setCamState("granted");
    } catch (e: unknown) {
      const name = (e as { name?: string })?.name;
      setCamState(name === "NotAllowedError" ? "denied" : "error");
    }
  }, []);

  useEffect(() => {
    requestCamera();
    return () => streamRef.current?.getTracks().forEach(t => t.stop());
  }, [requestCamera]);

  // Pointer handlers
  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (onboarding) setOnboarding(false);
    setPressing(true);
    const p = getPoint(e.nativeEvent, canvasRef.current!);
    setLive([p]);
    setCursor(p);
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = getPoint(e.nativeEvent, canvasRef.current!);
    setCursor(p);
    if (!pressing) return;
    setLive(prev => [...prev, p]);
  };
  const onUp = () => {
    if (live.length > 0) setStrokes(prev => [...prev, { points: live, color }]);
    setLive([]);
    setPressing(false);
  };

  return (
    <motion.div
      className="flex flex-col relative"
      style={{ minHeight: "100dvh" }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28 }}
    >
      {/* Top bar */}
      <div className="flex-none flex items-center justify-between px-4 md:px-7 py-3 border-b border-border bg-card/90 backdrop-blur-sm z-10">
        <span
          className="text-xl font-black"
          style={{ fontFamily: "'Nunito', sans-serif", color: ACCENT }}
        >
          AirDraw
        </span>
        <div className="flex items-center gap-3">
          <span className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground">
            Draw:&nbsp;
            <span className="font-bold text-foreground capitalize">{word}</span>
          </span>
          <TimerRing value={timer} />
          <button
            onClick={() => finish(false)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-xl hover:bg-muted font-medium"
          >
            Skip
          </button>
        </div>
      </div>

      {/* Mobile word */}
      <div className="sm:hidden flex-none text-center py-2 bg-secondary/50 text-sm font-semibold border-b border-border">
        Draw a&nbsp;
        <span className="capitalize" style={{ color: ACCENT }}>{word}</span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col md:flex-row gap-4 p-4 md:p-5 overflow-hidden min-h-0">

        {/* Canvas column */}
        <div className="flex flex-col gap-3 flex-1 min-h-0 overflow-hidden">
          <div
            className="relative rounded-3xl overflow-hidden border border-border bg-white shadow-sm"
            style={{ flex: "1 1 auto", minHeight: "clamp(200px, 44vh, 600px)" }}
          >
            <canvas
              ref={canvasRef}
              width={CW}
              height={CH}
              className="absolute inset-0 w-full h-full touch-none cursor-none"
              style={{ display: "block" }}
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerLeave={onUp}
            />

            {/* Cursor dot */}
            {cursor && (
              <div
                className="absolute pointer-events-none"
                style={{
                  left: `${(cursor.x / CW) * 100}%`,
                  top:  `${(cursor.y / CH) * 100}%`,
                  transform: "translate(-50%,-50%)",
                }}
              >
                <motion.div
                  animate={{ scale: pressing ? 1.35 : 1 }}
                  transition={{ duration: 0.08 }}
                  className="rounded-full"
                  style={{
                    width:     pressing ? 20 : 13,
                    height:    pressing ? 20 : 13,
                    background: pressing ? color : ACCENT,
                    boxShadow: `0 0 0 ${pressing ? 6 : 3}px ${(pressing ? color : ACCENT)}28`,
                  }}
                />
              </div>
            )}

            {/* Empty hint */}
            {strokes.length === 0 && live.length === 0 && !onboarding && (
              <div className="absolute inset-0 flex items-end justify-center pb-10 pointer-events-none">
                <p className="text-muted-foreground/25 text-base font-medium select-none">
                  Start drawing here...
                </p>
              </div>
            )}

            <AnimatePresence>
              {onboarding && <Onboarding onDismiss={() => setOnboarding(false)} />}
            </AnimatePresence>
          </div>

          {/* Toolbar */}
          <div className="flex-none flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-2 bg-card border border-border rounded-2xl p-2 shadow-sm">
              {PALETTE.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  aria-label={`Color ${c}`}
                  className="rounded-full transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    width:     26,
                    height:    26,
                    background: c,
                    transform: color === c ? "scale(1.25)" : undefined,
                    boxShadow: color === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : undefined,
                  }}
                />
              ))}
            </div>
            <button
              onClick={() => setStrokes(prev => prev.slice(0, -1))}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-card border border-border text-sm font-medium hover:bg-muted transition-colors shadow-sm"
            >
              <Undo2 size={14} /> Undo
            </button>
            <button
              onClick={() => { setStrokes([]); setLive([]); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-card border border-border text-sm font-medium hover:bg-muted transition-colors text-muted-foreground shadow-sm"
            >
              <Trash2 size={14} /> Clear
            </button>
          </div>
        </div>

        {/* AI sidebar — row on mobile, column on desktop */}
        <div className="flex flex-row md:flex-col gap-3 w-full md:w-72 lg:w-80 shrink-0 overflow-hidden">
          <div className="w-28 md:w-full">
            <CameraView videoRef={videoRef} state={camState} onRequest={requestCamera} />
          </div>
          <div className="flex-1 min-w-0 overflow-y-auto md:overflow-visible">
            <div className="flex items-center gap-1.5 mb-2.5">
              <Star size={11} style={{ color: ACCENT }} fill={ACCENT} />
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                AI Guesses
              </span>
            </div>
            <AIPanel state={aiState} guesses={guesses} />
          </div>
        </div>
      </div>

      {/* Celebration overlay */}
      <AnimatePresence>
        {celebrate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 pointer-events-none z-40"
          >
            <Confetti />
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                initial={{ scale: 0.4, opacity: 0, rotate: -10 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 460, damping: 22 }}
                className="bg-white rounded-3xl px-10 py-7 shadow-2xl text-center border border-border"
              >
                <div className="text-5xl mb-2">🎉</div>
                <p
                  className="text-3xl font-black capitalize"
                  style={{ fontFamily: "'Nunito', sans-serif", color: ACCENT }}
                >
                  {word}!
                </p>
                <p className="text-sm text-muted-foreground mt-1 font-medium">The AI got it!</p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── ResultScreen ─────────────────────────────────────────────────────────────

function ResultScreen({
  word, aiGuess, correct, timeTaken, dataUrl, onNext, onGallery,
}: {
  word: string; aiGuess: string; correct: boolean;
  timeTaken: number; dataUrl: string;
  onNext: () => void; onGallery: () => void;
}) {
  return (
    <motion.div
      className="relative flex flex-col items-center justify-center min-h-screen px-6 py-12 overflow-hidden"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
    >
      {correct && <Confetti />}

      <div className="w-full max-w-sm space-y-5 relative z-10">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0, rotate: -18 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.08, type: "spring", stiffness: 480, damping: 20 }}
            className="text-6xl mb-3"
          >
            {correct ? "🎉" : "🤔"}
          </motion.div>
          <h2
            className="text-4xl font-black"
            style={{ fontFamily: "'Nunito', sans-serif", color: correct ? ACCENT : "#1C1B20" }}
          >
            {correct ? "Got it!" : "Almost!"}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {correct
              ? "The AI guessed your drawing correctly!"
              : "The AI couldn't quite figure this one out."}
          </p>
        </div>

        <div className="bg-card rounded-3xl border border-border p-5 space-y-4 shadow-sm">
          {dataUrl && (
            <div className="w-full aspect-video rounded-2xl overflow-hidden bg-muted">
              <img
                src={dataUrl}
                alt={`Drawing of ${word}`}
                className="w-full h-full object-contain"
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-secondary rounded-2xl p-3.5 text-center">
              <p className="text-xs text-muted-foreground mb-1 font-medium">You drew</p>
              <p
                className="font-black capitalize text-base"
                style={{ fontFamily: "'Nunito', sans-serif" }}
              >
                {word}
              </p>
            </div>
            <div className="bg-secondary rounded-2xl p-3.5 text-center">
              <p className="text-xs text-muted-foreground mb-1 font-medium">AI guessed</p>
              <p
                className="font-black capitalize text-base"
                style={{ fontFamily: "'Nunito', sans-serif", color: correct ? ACCENT : undefined }}
              >
                {aiGuess}
              </p>
            </div>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Solved in&nbsp;
            <span
              className="font-semibold text-foreground"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              {timeTaken}s
            </span>
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onGallery}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-border bg-card font-semibold text-sm hover:bg-muted transition-colors"
          >
            <Images size={15} /> Gallery
          </button>
          <motion.button
            onClick={onNext}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm text-white"
            style={{ background: ACCENT }}
          >
            Next round <ChevronRight size={15} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── GalleryScreen ────────────────────────────────────────────────────────────

function GalleryScreen({ items, onBack }: { items: GalleryItem[]; onBack: () => void }) {
  return (
    <motion.div
      className="flex flex-col min-h-screen"
      initial={{ opacity: 0, x: 32 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -32 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="flex items-center gap-4 px-5 md:px-8 py-4 border-b border-border bg-card/90 backdrop-blur-sm">
        <button
          onClick={onBack}
          className="p-2 rounded-xl hover:bg-muted transition-colors"
          aria-label="Back"
        >
          <RotateCcw size={17} />
        </button>
        <h2
          className="text-2xl font-black"
          style={{ fontFamily: "'Nunito', sans-serif" }}
        >
          Your Gallery
        </h2>
        <span className="text-sm text-muted-foreground ml-auto font-medium">
          {items.length} drawing{items.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="flex-1 p-5 md:p-8 overflow-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center gap-4">
            <span className="text-7xl opacity-20 select-none">🖼️</span>
            <p className="text-muted-foreground font-medium">No drawings yet.</p>
            <p className="text-sm text-muted-foreground">Complete a round to see your drawings here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.045, type: "spring", stiffness: 300, damping: 28 }}
                className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="aspect-video bg-muted">
                  <img
                    src={item.dataUrl}
                    alt={`Drawing of ${item.word}`}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold capitalize text-sm">{item.word}</span>
                    <span
                      className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                      style={
                        item.correct
                          ? { background: "#2BAA7218", color: "#2BAA72" }
                          : { background: "#F5A62318", color: "#C07F00" }
                      }
                    >
                      {item.correct ? "✓ Correct" : "✗ Missed"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground capitalize">
                    AI: &ldquo;{item.aiGuess}&rdquo;
                  </p>
                  <p
                    className="text-xs text-muted-foreground mt-0.5"
                    style={{ fontFamily: "'DM Mono', monospace" }}
                  >
                    {item.timeTaken}s
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────

interface RoundState { id: number; word: string }

export default function App() {
  const [screen,     setScreen]     = useState<Screen>("welcome");
  const [round,      setRound]      = useState<RoundState | null>(null);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  const [gallery,    setGallery]    = useState<GalleryItem[]>([]);

  const startRound = useCallback(() => {
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    setRound({ id: Date.now(), word });
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
