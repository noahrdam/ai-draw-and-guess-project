# AirDraw — air-drawing draw & guess

To try out the game we have deployed it on Render here: https://airdraw-6yxg.onrender.com/

AirDraw is a browser prototype where you **draw in the air with your hand** in
front of the webcam, and an AI tries to guess what you're drawing in real time —
inspired by Google's *Quick, Draw!*, with no mouse or touchscreen required.

Built as the interactive deliverable for the *Interactive Design & Development*
course. The whole pipeline runs **client-side in the browser** — no backend, no
data leaves the device.

## How it works

The data flows in one direction, from camera to feedback:

```
webcam (getUserMedia)
   → hand landmarks (MediaPipe HandLandmarker)
   → gesture: fingertip position + pinch detection
   → drawing strokes on the canvas (React state)
   → sketch recognition (TensorFlow.js, doodleNet)
   → live guesses, AI mood & round result (UI + Motion animations)
```

- **Move your index finger** to move the cursor.
- **Pinch** thumb + index together to put the "pen" down and draw; **open your
  hand** to lift it.
- Mouse / touch still works as a fallback if the camera is unavailable.

## Tech stack

| Concern            | Library                                             |
| ------------------ | --------------------------------------------------- |
| UI / prototyping   | React 18 + Vite + Tailwind CSS 4                    |
| Animation          | Motion for React                                    |
| Webcam             | WebRTC `getUserMedia`                               |
| Hand tracking      | MediaPipe Tasks Vision (`HandLandmarker`)           |
| Sketch recognition | TensorFlow.js + [doodleNet] (345-class QuickDraw)   |

[doodleNet]: https://github.com/yining1023/doodleNet

## Getting started

```bash
npm install      # install dependencies
npm run dev      # start the dev server 
npm run build    # production build to dist/
npm run typecheck
```

Open the dev URL, start a round, and **allow camera access** when prompted. The
recognition model (~2 MB) and the MediaPipe hand model load on first use.

### Requirements

- A modern desktop browser with WebGL and webcam support (Chrome/Edge work best).
- The page must be served over `localhost` or HTTPS — browsers only grant camera
  access in a secure context.

## Project structure

```
src/
  app/App.tsx              Screen router & top-level state
  components/
    screens/               welcome · countdown · drawing · result · gallery
    game/                  canvas, camera view, AI panel, guess bubbles, debug
    effects/               confetti, animated background
  hooks/
    useCamera.ts           getUserMedia lifecycle (permission/error states)
    useHandTracking.ts     MediaPipe loop → per-frame {point, pinching}
    useDrawing.ts          stroke state; shared mouse + hand drawing API
    useRound.ts            timer + live recognition loop + AI state
  lib/
    hand.ts                landmark math: pinch ratio, fingertip → canvas
    recognizer.ts          TF.js model load, stroke rasterization, classify
    canvas.ts              stroke rendering
    constants.ts           words, thresholds & tuning knobs
    types.ts               shared types
public/model/              vendored doodleNet model (model.json + weights + labels)
```

## Recognition & words

The recognizer uses the **doodleNet** model (345 QuickDraw categories), bundled
locally under [`public/model/`](public/model/) so it works offline. Drawings are
rasterized to the 28×28 grayscale input the model expects (cropped to the
drawing, centered, bold ink, inverted & normalized).

Every word in `WORDS` ([src/lib/constants.ts](src/lib/constants.ts)) **must match
a label** in [`public/model/class_names.txt`](public/model/class_names.txt) — only
then can a correct drawing actually be recognized.

### Tuning knobs

All in [src/lib/constants.ts](src/lib/constants.ts) unless noted:

| Constant            | Purpose                                                   |
| ------------------- | -------------------------------------------------------- |
| `WORDS`             | The pool of round words (must exist in the model labels) |
| `ROUND_DURATION`    | Seconds per round                                        |
| `INFER_INTERVAL`    | How often (ms) the drawing is classified                 |
| `WIN_CONFIDENCE`    | Top-1 confidence at which the AI "gets it"               |
| `EXCITED_CONFIDENCE`| Confidence at which the AI looks excited                 |
| `SHOW_DEBUG`        | Show the live 28×28 model-input preview (off for demos)  |
| `PINCH_ON`/`PINCH_OFF` | Pinch sensitivity (in [src/lib/hand.ts](src/lib/hand.ts)) |

## Debug view

With `SHOW_DEBUG = true`, a small overlay in the drawing screen shows the exact
28×28 image the model receives plus the live top guess and confidence — handy for
tuning preprocessing and gestures. Turn it off for screenshots and the demo.

## Known limitations

- Recognition accuracy is bounded by doodleNet — clear, complete, centered
  doodles work best; very sparse sketches score low.
- Hand tracking follows one hand and needs reasonable lighting.
- The production bundle includes TensorFlow.js (~2 MB); fine for a prototype.

---


