
export type Suit = "S" | "H" | "D" | "C";
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
  selected: boolean;
}

export type JokerEdition = "none" | "foil" | "holo" | "poly" | "negative";

export interface JokerInstance {
  uid: string;
  jokerId: string;
  edition: JokerEdition;
  state: {
    count?: number;
    xmult?: number;
    value?: number;
    sellValue?: number;
    active?: boolean;
  };
  disabled: boolean;
}

export type HandKey =
  | "high_card" | "pair" | "two_pair" | "three_of_a_kind" | "straight" | "flush"
  | "full_house" | "four_of_a_kind" | "straight_flush" | "royal_flush"
  | "five_of_a_kind" | "flush_house" | "flush_five";

export interface RunModifiers {
  plasmaDeck: boolean;
  abandonedDeck: boolean;
  ghostDeck: boolean;
  observatory: boolean;
  honeMult: number;
  eyeBoss: boolean;
  flintBoss: boolean;
}

export interface CalcInput {
  hand: HandKey;
  handLevel: number;
  played: PlayingCard[];
  inHand: PlayingCard[];
  jokers: JokerInstance[];
  modifiers: RunModifiers;
  observatoryPlanets: HandKey[];
}

export interface ScorePhaseLine {
  phase: "base" | "card" | "held" | "joker" | "final";
  source: string;
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
