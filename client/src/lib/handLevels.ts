/**
 * Balatro hand base stats per level.
 *
 * Each hand has a base (chips, mult) at level 1 and a per-level delta.
 * The level-up cost (planet card) increases each level by (chipsPerLevel,
 * multPerLevel). Values come from the public Balatro Hands Reference.
 *
 * "any" is not a real Balatro hand - it's only used by the joker dataset to
 * indicate hand-agnostic effects.
 */
export type HandKey =
  | "high_card"
  | "pair"
  | "two_pair"
  | "three_of_a_kind"
  | "straight"
  | "flush"
  | "full_house"
  | "four_of_a_kind"
  | "straight_flush"
  | "royal_flush"
  | "five_of_a_kind"
  | "flush_house"
  | "flush_five";

export interface HandStats {
  key: HandKey;
  label: string;
  baseChips: number;
  baseMult: number;
  chipsPerLevel: number;
  multPerLevel: number;
}

export const HAND_LEVELS: Record<HandKey, HandStats> = {
  high_card:       { key: "high_card",       label: "High Card",        baseChips: 5,   baseMult: 1,  chipsPerLevel: 10, multPerLevel: 1 },
  pair:            { key: "pair",            label: "Pair",             baseChips: 10,  baseMult: 2,  chipsPerLevel: 15, multPerLevel: 1 },
  two_pair:        { key: "two_pair",        label: "Two Pair",         baseChips: 20,  baseMult: 2,  chipsPerLevel: 20, multPerLevel: 1 },
  three_of_a_kind: { key: "three_of_a_kind", label: "Three of a Kind",  baseChips: 30,  baseMult: 3,  chipsPerLevel: 20, multPerLevel: 2 },
  straight:        { key: "straight",        label: "Straight",         baseChips: 30,  baseMult: 4,  chipsPerLevel: 30, multPerLevel: 3 },
  flush:           { key: "flush",           label: "Flush",            baseChips: 35,  baseMult: 4,  chipsPerLevel: 15, multPerLevel: 2 },
  full_house:      { key: "full_house",      label: "Full House",       baseChips: 40,  baseMult: 4,  chipsPerLevel: 25, multPerLevel: 2 },
  four_of_a_kind:  { key: "four_of_a_kind",  label: "Four of a Kind",   baseChips: 60,  baseMult: 7,  chipsPerLevel: 30, multPerLevel: 3 },
  straight_flush:  { key: "straight_flush",  label: "Straight Flush",   baseChips: 100, baseMult: 8,  chipsPerLevel: 40, multPerLevel: 4 },
  royal_flush:     { key: "royal_flush",     label: "Royal Flush",      baseChips: 100, baseMult: 8,  chipsPerLevel: 40, multPerLevel: 4 },
  five_of_a_kind:  { key: "five_of_a_kind",  label: "Five of a Kind",   baseChips: 120, baseMult: 12, chipsPerLevel: 35, multPerLevel: 3 },
  flush_house:     { key: "flush_house",     label: "Flush House",      baseChips: 140, baseMult: 14, chipsPerLevel: 40, multPerLevel: 4 },
  flush_five:      { key: "flush_five",      label: "Flush Five",       baseChips: 160, baseMult: 16, chipsPerLevel: 50, multPerLevel: 3 },
};

export const ALL_HANDS: HandKey[] = [
  "high_card", "pair", "two_pair", "three_of_a_kind", "straight",
  "flush", "full_house", "four_of_a_kind", "straight_flush", "royal_flush",
  "five_of_a_kind", "flush_house", "flush_five",
];

/** Returns (chips, mult) for a hand at the given level (1-indexed, clamped 1..50). */
export function getHandStats(hand: HandKey, level: number): { chips: number; mult: number } {
  const stats = HAND_LEVELS[hand];
  const lvl = Math.max(1, Math.min(50, Math.floor(level)));
  const steps = lvl - 1;
  return {
    chips: stats.baseChips + stats.chipsPerLevel * steps,
    mult: stats.baseMult + stats.multPerLevel * steps,
  };
}

/**
 * Standard 5-card poker probabilities (52-card deck, no jokers).
 * Used by the hand-probability panel. Values are percentages.
 * Note: Balatro hands are computed from up to 5 played cards in an 8-card hand,
 * not from drawing 5 - so these are reference baselines, not exact in-game odds.
 */
export const HAND_PROBABILITY_PCT: Record<HandKey, number> = {
  high_card: 50.12,
  pair: 42.26,
  two_pair: 4.75,
  three_of_a_kind: 2.11,
  straight: 0.39,
  flush: 0.20,
  full_house: 0.14,
  four_of_a_kind: 0.024,
  straight_flush: 0.0014,
  royal_flush: 0.000154,
  // Balatro-exclusive hands need enhancements/wild cards to appear naturally.
  five_of_a_kind: 0,
  flush_house: 0,
  flush_five: 0,
};
