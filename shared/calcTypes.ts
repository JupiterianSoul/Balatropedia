// Comprehensive scoring types for the Score Calculator.
// Mirrors Balatro's actual scoring model: cards have ranks/suits/enhancements/seals/editions,
// jokers fire in left-to-right order each phase, scaling jokers carry stateful values.

export type Suit = "S" | "H" | "D" | "C"; // Spades Hearts Diamonds Clubs
export type Rank =
  | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "T" | "J" | "Q" | "K" | "A";

export type CardEnhancement =
  | "none" | "bonus" | "mult" | "wild" | "glass" | "steel" | "stone" | "gold" | "lucky";

export type CardEdition = "none" | "foil" | "holo" | "poly" | "negative";
export type CardSeal = "none" | "red" | "blue" | "gold" | "purple";

export interface PlayingCard {
  id: string;
  rank: Rank;
  suit: Suit;
  enhancement: CardEnhancement;
  edition: CardEdition;
  seal: CardSeal;
  selected: boolean; // is it in the played set (vs in hand)
}

export type JokerEdition = "none" | "foil" | "holo" | "poly" | "negative";

// State payload for scaling jokers (e.g., Ride the Bus count, Constellation count, Green Joker count).
// Each scaling joker exposes one or more state fields; the engine reads them when computing the joker's contribution.
export interface JokerInstance {
  uid: string;             // unique slot id
  jokerId: string;         // references JOKERS[].id
  edition: JokerEdition;
  state: {
    count?: number;        // generic counter (Ride the Bus, Green Joker, Constellation, Square, Obelisk, etc.)
    xmult?: number;        // accumulated xmult (Hologram, Glass, Caino)
    value?: number;        // accumulated value (Madness +0.5x, Stuntman... )
    sellValue?: number;    // not used in scoring but kept for completeness
    active?: boolean;      // toggle for conditional effects (e.g. "if odd hand", debuffed via Pareidolia/Eye)
  };
  disabled: boolean;       // boss "disable joker" effect / The Eye etc.
}

export type HandKey =
  | "high_card" | "pair" | "two_pair" | "three_of_a_kind" | "straight" | "flush"
  | "full_house" | "four_of_a_kind" | "straight_flush" | "royal_flush"
  | "five_of_a_kind" | "flush_house" | "flush_five";

export interface RunModifiers {
  // Deck-driven flags
  plasmaDeck: boolean;          // Plasma: final score = ((c+m)/2)^2  -- chips and mult are equalized then squared
  abandonedDeck: boolean;       // no face cards (affects probability + some jokers)
  ghostDeck: boolean;           // spectral cards may appear
  observatory: boolean;         // x1.5 mult per planet card in consumable area for its matching hand
  // Voucher-driven
  honeMult: number;             // 1 (no), 1.5 (hone... actually shop frequency, not scoring) - kept for note display
  // Boss-driven
  eyeBoss: boolean;             // can't repeat hand types — display only here
  flintBoss: boolean;           // base chips and mult halved
}

export interface CalcInput {
  hand: HandKey;
  handLevel: number;            // 1-15
  played: PlayingCard[];        // length 1-5
  inHand: PlayingCard[];        // not played but still in hand (for Steel x1.5, Gold $3 etc.)
  jokers: JokerInstance[];      // ordered left-to-right
  modifiers: RunModifiers;
  observatoryPlanets: HandKey[]; // planets currently in consumable area
}

export interface ScorePhaseLine {
  phase: "base" | "card" | "held" | "joker" | "final";
  source: string;               // e.g. "Joker (Ride the Bus)", "King of Spades", "Foil edition"
  chipsAdd?: number;
  multAdd?: number;
  xMult?: number;
  chipsAfter: number;
  multAfter: number;
  note?: string;
}

export interface CalcResult {
  chips: number;
  mult: number;
  score: number;
  timeline: ScorePhaseLine[];
  warnings: string[];
}
