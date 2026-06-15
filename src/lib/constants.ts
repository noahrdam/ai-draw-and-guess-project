/**
 * Round words. Every entry must exactly match a label in the recognition
 * model's class list (public/model/class_names.txt) so a correct drawing can
 * actually be recognised.
 */
export const WORDS = [
  "cat", "sun", "tree", "house", "fish",
  "bird", "butterfly", "flower", "star", "pizza",
  "umbrella", "hat", "moon", "car", "elephant",
];

export const ROUND_DURATION = 60;

/** Recognition model (doodleNet, 345 QuickDraw classes) served from /public. */
export const MODEL_URL = "/model/model.json";
export const LABELS_URL = "/model/class_names.txt";

/** How often (ms) we run the drawing through the model while the round is live. */
export const INFER_INTERVAL = 600;
/** Top-1 confidence (and label === word) at which the AI "gets it". */
export const WIN_CONFIDENCE = 0.5;
/** Top-1 confidence above which the AI looks excited (but not yet certain). */
export const EXCITED_CONFIDENCE = 0.4;

/** Show the live 28x28 model-input preview while drawing (debugging/tuning). */
export const SHOW_DEBUG = true;

/** Internal canvas resolution (drawing coordinates are normalised to this). */
export const CW = 800;
export const CH = 600;

export const ACCENT = "#FF5533";
export const PALETTE = ["#1C1B20", "#FF5533", "#3B7DD8", "#2BAA72", "#F5A623", "#9B59B6"];
export const CONF_COLORS = [ACCENT, "#3B7DD8", "#F5A623", "#2BAA72", "#9B59B6", "#FFD700"];
