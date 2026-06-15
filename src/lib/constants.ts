export const WORDS = [
  "cat", "sun", "tree", "house", "fish",
  "bird", "rocket", "flower", "star", "pizza",
  "boat", "hat", "moon", "heart", "elephant",
];

export const ROUND_DURATION = 60;

/** Internal canvas resolution (drawing coordinates are normalised to this). */
export const CW = 800;
export const CH = 600;

export const ACCENT = "#FF5533";
export const PALETTE = ["#1C1B20", "#FF5533", "#3B7DD8", "#2BAA72", "#F5A623", "#9B59B6"];
export const CONF_COLORS = [ACCENT, "#3B7DD8", "#F5A623", "#2BAA72", "#9B59B6", "#FFD700"];

/** Plausible wrong guesses the fake AI cycles through before landing on the word. */
export const DISTRACTORS: Record<string, [string, string, string]> = {
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
