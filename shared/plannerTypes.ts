// Run Planner types - shared between client and (potentially) server
import type { HandKey } from "../client/src/lib/handLevels";

export type Edition = "none" | "foil" | "holo" | "poly" | "negative";

export interface PlannerSlot {
  jokerId: string | null;
  edition: Edition;
  addChips: number;   // additional flat chips this joker contributes
  addMult: number;    // additional flat mult this joker contributes
  xMult: number;      // multiplicative mult from this joker (1 = none)
}

export type ConsumableKind = "tarot" | "planet" | "spectral";

export interface ConsumableSlot {
  kind: ConsumableKind;
  id: string | null;
}

export interface PlannerState {
  hand: HandKey;
  handLevel: number; // 1-10
  slots: PlannerSlot[]; // length 5 (or 6 with Negative)
  // Played card modifiers
  steelCards: number;       // each ×1.5
  glassCards: number;       // each ×2
  redSealRetriggers: number; // additional retriggers from red seal
  // Flat chip bonus from enhancements (Bonus +30, Stone +50 etc.) batched
  enhancementChips: number;
  // Multiplicative bonus separate from joker xMult products (e.g. external sources)
  externalXMult: number;
  // Build context
  deckId: string | null;
  stakeId: string | null;
  ante: number;             // 1-8
  voucherIds: (string | null)[]; // length 2
  consumables: ConsumableSlot[]; // length 4
  notes: string;
}

export interface ScoreBreakdownLine {
  label: string;
  chips?: number;
  mult?: number;
  xMult?: number;
  note?: string;
}

export interface ScoreResult {
  chips: number;
  mult: number;
  score: number;
  breakdown: ScoreBreakdownLine[];
}

export interface SavedBuild {
  id: string;
  name: string;
  state: PlannerState;
  savedAt: number;
}

export const EMPTY_SLOT: PlannerSlot = {
  jokerId: null,
  edition: "none",
  addChips: 0,
  addMult: 0,
  xMult: 1,
};

export function makeDefaultState(): PlannerState {
  return {
    hand: "high_card",
    handLevel: 1,
    slots: Array.from({ length: 5 }, () => ({ ...EMPTY_SLOT })),
    steelCards: 0,
    glassCards: 0,
    redSealRetriggers: 0,
    enhancementChips: 0,
    externalXMult: 1,
    deckId: null,
    stakeId: null,
    ante: 1,
    voucherIds: [null, null],
    consumables: Array.from({ length: 4 }, () => ({ kind: "tarot" as const, id: null })),
    notes: "",
  };
}
