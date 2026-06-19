import { WORDS } from "@/lib/constants";

/**
 * Serves drawing words so the same word never appears twice in a row.
 *
 * We shuffle WORDS into a "deck" and deal one word per round. Once the deck is
 * empty we reshuffle, but ensure the first word of the new deck isn't the same
 * as the last one dealt — so there's no repeat across the reshuffle boundary.
 */
let deck: string[] = [];
let lastWord: string | null = null;

function shuffle(words: string[]): string[] {
  const out = [...words];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function nextWord(): string {
  if (deck.length === 0) {
    deck = shuffle(WORDS);
    // Avoid repeating the last word of the previous deck (only possible with >1 word).
    if (lastWord !== null && deck.length > 1 && deck[0] === lastWord) {
      [deck[0], deck[1]] = [deck[1], deck[0]];
    }
  }
  lastWord = deck.shift()!;
  return lastWord;
}
