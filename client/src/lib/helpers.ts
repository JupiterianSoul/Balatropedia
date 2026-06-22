import {
  JOKERS, SYNERGIES, COMBOS, ARCHETYPES, GLOSSARY, JOKER_MAP,
  Joker, Role, Scaling, Stage, Level, SynergyKind, Archetype, HandType, Synergy, Rarity,
} from "@/data/jokers";

export { JOKERS, SYNERGIES, COMBOS, ARCHETYPES, GLOSSARY, JOKER_MAP };
export type { Joker, Role, Scaling, Stage, Level, SynergyKind, Archetype, HandType, Synergy, Rarity };

// ---- Human-readable labels ----
export const ROLE_LABELS: Record<Role, string> = {
  chips: "Chips",
  flat_mult: "Flat Mult",
  xmult: "XMult",
  retrigger: "Retrigger",
  economy: "Economy",
  consistency: "Consistency",
  discard_support: "Discard Support",
  hand_size: "Hand Size",
  held_in_hand: "Held in Hand",
  suit_support: "Suit Support",
  rank_face_support: "Rank / Face",
  deck_manipulation: "Deck Manipulation",
  deck_growth: "Deck Growth",
  enhancement_interaction: "Enhancement",
  destroy_value: "Destroy Value",
  scaling_engine: "Scaling Engine",
  payoff: "Payoff",
  enabler: "Enabler",
  pivot: "Pivot",
};

export const SCALING_LABELS: Record<Scaling, string> = {
  static: "Static",
  linear: "Linear",
  multiplicative: "Multiplicative",
  exponential: "Exponential",
  conditional: "Conditional",
};

export const HAND_LABELS: Record<HandType, string> = {
  high_card: "High Card",
  pair: "Pair",
  two_pair: "Two Pair",
  three_of_a_kind: "Three of a Kind",
  straight: "Straight",
  flush: "Flush",
  full_house: "Full House",
  four_of_a_kind: "Four of a Kind",
  straight_flush: "Straight Flush",
  any: "Any",
};

export const STAGE_LABELS: Record<Stage, string> = { early: "Early", mid: "Mid", late: "Late" };
export const LEVEL_LABELS: Record<Level, string> = { low: "Low", med: "Med", high: "High" };

export const RARITY_LABELS: Record<Rarity, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  legendary: "Legendary",
};
// Filter pill order (ascending rarity)
export const ALL_RARITIES: Rarity[] = ["common", "uncommon", "rare", "legendary"];
// Sort rank: legendary first → rare → uncommon → common
export const RARITY_SORT_RANK: Record<Rarity, number> = {
  legendary: 0, rare: 1, uncommon: 2, common: 3,
};

export const SYNERGY_KIND_LABELS: Record<SynergyKind, string> = {
  core_pair: "Core Pair",
  strong_support: "Strong Support",
  conditional: "Conditional",
  archetype_only: "Archetype Only",
  risky_explosive: "Risky but Explosive",
  trap_unless_enabled: "Trap unless Enabled",
};

export const SYNERGY_KIND_ORDER: SynergyKind[] = [
  "core_pair", "strong_support", "conditional",
  "archetype_only", "risky_explosive", "trap_unless_enabled",
];

export const ENGINE_LABELS: Record<Synergy["engine"], string> = {
  retrigger: "retrigger",
  xmult_stack: "xmult stack",
  deck_manipulation: "deck manipulation",
  consistency: "consistency",
  economy: "economy",
  face_card: "face card",
  discard_volume: "discard volume",
  enhancement: "enhancement",
  suit_unification: "suit unification",
  scaling: "scaling",
};

export const ARCHETYPE_LABELS: Record<Archetype, string> = ARCHETYPES.reduce((acc, a) => {
  acc[a.id] = a.name;
  return acc;
}, {} as Record<Archetype, string>);

export const ALL_ROLES = Object.keys(ROLE_LABELS) as Role[];
export const ALL_HANDS = Object.keys(HAND_LABELS) as HandType[];
export const ALL_SCALINGS = Object.keys(SCALING_LABELS) as Scaling[];
export const ALL_STAGES: Stage[] = ["early", "mid", "late"];
export const ALL_LEVELS: Level[] = ["low", "med", "high"];

export function jokerName(id: string): string {
  return JOKER_MAP[id]?.name ?? id;
}

// ---- Synergy density: partners + appearances in combos ----
const comboAppearances: Record<string, number> = {};
for (const c of COMBOS) {
  for (const id of [...c.core, ...c.optional]) {
    comboAppearances[id] = (comboAppearances[id] ?? 0) + 1;
  }
}
export function synergyDensity(j: Joker): number {
  return j.partners.length + (comboAppearances[j.id] ?? 0);
}

// ---- Derived metrics for Compare view ----
const LEVEL_RANK: Record<Level, number> = { low: 0, med: 1, high: 2 };

export function earlyGameValue(j: Joker): Level {
  return j.stage.includes("early") ? "high" : j.stage.includes("mid") ? "med" : "low";
}
export function lateGameCeiling(j: Joker): Level {
  if (j.scaling === "exponential" || j.scaling === "multiplicative") return "high";
  if (j.scaling === "linear" || j.scaling === "conditional") return "med";
  return "low";
}
export function reliability(j: Joker): Level {
  // higher consistency + lower setup difficulty = more reliable
  const score = LEVEL_RANK[j.consistency] - (LEVEL_RANK[j.setupDifficulty] - 1);
  if (score >= 2) return "high";
  if (score <= 0) return "low";
  return "med";
}

// ---- Synergy lookups ----
export function synergiesFor(id: string): { partnerId: string; kind: SynergyKind; engine: Synergy["engine"]; why: string }[] {
  const out: { partnerId: string; kind: SynergyKind; engine: Synergy["engine"]; why: string }[] = [];
  for (const s of SYNERGIES) {
    if (s.a === id) out.push({ partnerId: s.b, kind: s.kind, engine: s.engine, why: s.why });
    else if (s.b === id) out.push({ partnerId: s.a, kind: s.kind, engine: s.engine, why: s.why });
  }
  return out;
}

// Find a "why" explaining an anti-synergy pair, if present in SYNERGIES.
export function antiSynergyReason(a: string, b: string): string | null {
  for (const s of SYNERGIES) {
    const match = (s.a === a && s.b === b) || (s.a === b && s.b === a);
    if (match && (s.kind === "trap_unless_enabled" || s.kind === "risky_explosive")) {
      return s.why;
    }
  }
  return null;
}

// ---- Partner categorization by partner mainRole ----
export type PartnerCategory = "Enablers" | "Scalers" | "Payoffs" | "Consistency fixes" | "Economy support" | "Other";

export function partnerCategory(p: Joker): PartnerCategory {
  if (p.mainRole === "enabler") return "Enablers";
  if (["xmult", "scaling_engine", "flat_mult", "chips"].includes(p.mainRole)) return "Scalers";
  if (p.mainRole === "payoff") return "Payoffs";
  if (["consistency", "deck_manipulation", "retrigger"].includes(p.mainRole)) return "Consistency fixes";
  if (p.mainRole === "economy") return "Economy support";
  return "Other";
}

export const PARTNER_CATEGORY_ORDER: PartnerCategory[] = [
  "Enablers", "Scalers", "Payoffs", "Consistency fixes", "Economy support", "Other",
];

export function groupedPartners(j: Joker): Record<PartnerCategory, Joker[]> {
  const out = {} as Record<PartnerCategory, Joker[]>;
  for (const cat of PARTNER_CATEGORY_ORDER) out[cat] = [];
  for (const pid of j.partners) {
    const p = JOKER_MAP[pid];
    if (!p) continue;
    out[partnerCategory(p)].push(p);
  }
  return out;
}

// ---- Example use cases derived from stage / role / tags ----
export function exampleUseCases(j: Joker): string[] {
  const out: string[] = [];
  if (j.stage.includes("early")) {
    out.push(`Early-game pickup: a low-cost ${ROLE_LABELS[j.mainRole].toLowerCase()} piece to stabilize your score while you assemble a real engine.`);
  }
  if (j.mainRole === "payoff") {
    out.push("Endgame multiplier engine when its enabling condition is reliably met every scored hand.");
  }
  if (j.tags.includes("pivot")) {
    out.push("Pivot piece when your primary scaling axis bricks — slot it in to redirect the build.");
  }
  if (j.mainRole === "economy") {
    out.push("Economy snowball: bank the extra income early, then reinvest it into your win condition.");
  }
  if (out.length === 0) {
    if (j.stage.includes("late")) out.push("Late-game commitment: bring it online once the supporting pieces are in place.");
    out.push(`Pairs naturally with ${j.partners.length} curated partners — see Best Partners below.`);
  }
  return out.slice(0, 3);
}

// ---- "Why play this?" rule-based reasoning ----
export interface WhyBullet {
  text: string;
  rule: string; // subtler caption: which rule produced this
}

export function whyPlayThis(j: Joker): WhyBullet[] {
  const out: WhyBullet[] = [];

  // Core role + scaling
  out.push({
    text: `Core role: ${ROLE_LABELS[j.mainRole]}. Scales by ${SCALING_LABELS[j.scaling].toLowerCase()}.`,
    rule: "from mainRole + scaling",
  });

  // Best partners — top 3 from joker.partners mapped to names
  const partnerNames = j.partners.slice(0, 3).map((id) => jokerName(id)).filter(Boolean);
  if (partnerNames.length > 0) {
    out.push({
      text: `Best partners: ${partnerNames.join(", ")}.`,
      rule: "top 3 from partners",
    });
  }

  // Fits archetypes — ARCHETYPES whose coreJokers/scalers/enablers include this joker
  const fits = ARCHETYPES.filter(
    (a) =>
      a.enablers.includes(j.id) ||
      a.scalers.includes(j.id) ||
      (j.archetypes as string[]).includes(a.id),
  ).map((a) => a.name);
  const uniqueFits = Array.from(new Set(fits));
  if (uniqueFits.length > 0) {
    out.push({
      text: `Fits archetypes: ${uniqueFits.slice(0, 4).join(", ")}.`,
      rule: "archetypes containing this joker",
    });
  }

  // Setup + risk
  out.push({
    text: `Setup: ${LEVEL_LABELS[j.setupDifficulty]}. Risk: ${LEVEL_LABELS[j.risk]}.`,
    rule: "from setupDifficulty + risk",
  });

  // Anti-synergies watch out
  if (j.antiSynergies.length > 0) {
    const antiNames = j.antiSynergies.map((id) => jokerName(id));
    out.push({
      text: `Watch out for: ${antiNames.join(", ")}.`,
      rule: "from antiSynergies",
    });
  }

  return out;
}

// ---- Run analysis (My Run tab) ----
export interface ActiveSynergy {
  a: string;
  b: string;
  kind: SynergyKind;
  engine: Synergy["engine"];
  why: string;
}

// SYNERGIES whose participating jokers are a subset of the active selection.
export function activeSynergies(selection: string[]): ActiveSynergy[] {
  const set = new Set(selection);
  return SYNERGIES.filter((s) => set.has(s.a) && set.has(s.b)).map((s) => ({
    a: s.a, b: s.b, kind: s.kind, engine: s.engine, why: s.why,
  }));
}

export interface ImpliedArchetype {
  id: Archetype;
  name: string;
  matched: string[]; // joker ids from selection in this archetype's core (enablers+scalers)
}

// Archetypes where >= 2 of the selection are in its core (enablers + scalers).
export function impliedArchetypes(selection: string[]): ImpliedArchetype[] {
  const set = new Set(selection);
  const out: ImpliedArchetype[] = [];
  for (const a of ARCHETYPES) {
    const core = [...a.enablers, ...a.scalers];
    const matched = core.filter((id) => set.has(id));
    if (matched.length >= 2) out.push({ id: a.id, name: a.name, matched });
  }
  return out;
}

export interface AntiWarning {
  a: string; // joker that lists b as anti
  b: string;
  why: string;
}

// Any pair in the selection where one lists the other in antiSynergies.
export function antiSynergyWarnings(selection: string[]): AntiWarning[] {
  const out: AntiWarning[] = [];
  const seen = new Set<string>();
  for (const idA of selection) {
    const ja = JOKER_MAP[idA];
    if (!ja) continue;
    for (const idB of selection) {
      if (idA === idB) continue;
      if (ja.antiSynergies.includes(idB)) {
        const key = [idA, idB].sort().join("|");
        if (seen.has(key)) continue;
        seen.add(key);
        const why = antiSynergyReason(idA, idB) ?? `${jokerName(idA)} undercuts or competes with ${jokerName(idB)}.`;
        out.push({ a: idA, b: idB, why });
      }
    }
  }
  return out;
}

// ---- Heatmap pair scoring ----
// +3 if appears together in a SYNERGY; +2 if same archetype core;
// +1 if shared tag; -3 if in each other's antiSynergies.
const synergyPairs = new Set<string>();
for (const s of SYNERGIES) {
  synergyPairs.add([s.a, s.b].sort().join("|"));
}

// Map of joker id -> set of archetype ids it cores (enablers+scalers).
const archetypeCoreOf: Record<string, Set<string>> = {};
for (const a of ARCHETYPES) {
  for (const id of [...a.enablers, ...a.scalers]) {
    (archetypeCoreOf[id] ??= new Set()).add(a.id);
  }
}

export function pairScore(aId: string, bId: string): number {
  if (aId === bId) return 0;
  const a = JOKER_MAP[aId];
  const b = JOKER_MAP[bId];
  if (!a || !b) return 0;
  let score = 0;
  if (synergyPairs.has([aId, bId].sort().join("|"))) score += 3;
  const acA = archetypeCoreOf[aId];
  const acB = archetypeCoreOf[bId];
  if (acA && acB) {
    if (Array.from(acA).some((id) => acB.has(id))) score += 2;
  }
  if (a.tags.some((t) => b.tags.includes(t))) score += 1;
  if (a.antiSynergies.includes(bId) || b.antiSynergies.includes(aId)) score -= 3;
  return score;
}

export interface HeatmapEntry {
  id: string;
  name: string;
  score: number;
}

export function heatmapFor(jokerId: string): HeatmapEntry[] {
  return JOKERS.filter((j) => j.id !== jokerId).map((j) => ({
    id: j.id,
    name: j.name,
    score: pairScore(jokerId, j.id),
  }));
}

// ---- Build skeleton engine categories ----
export interface EngineCategory {
  key: string;
  label: string;
  matches: (j: Joker) => boolean;
}

export const ENGINE_CATEGORIES: EngineCategory[] = [
  { key: "chips", label: "Chips source", matches: (j) => j.mainRole === "chips" || j.tags.includes("chips") },
  { key: "flat_mult", label: "Flat Mult source", matches: (j) => j.mainRole === "flat_mult" || j.tags.includes("flat_mult") },
  { key: "xmult", label: "XMult source", matches: (j) => j.mainRole === "xmult" || j.tags.includes("xmult") || j.mainRole === "scaling_engine" || j.tags.includes("scaling_engine") },
  { key: "retrigger", label: "Retrigger", matches: (j) => j.mainRole === "retrigger" || j.tags.includes("retrigger") },
  { key: "economy", label: "Economy", matches: (j) => j.mainRole === "economy" || j.tags.includes("economy") },
  { key: "consistency", label: "Consistency / Enabler", matches: (j) => j.mainRole === "consistency" || j.mainRole === "enabler" || j.tags.includes("consistency") || j.tags.includes("enabler") || j.tags.includes("deck_manipulation") },
];
