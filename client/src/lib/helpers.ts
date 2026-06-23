import {
  JOKERS, SYNERGIES, COMBOS, ARCHETYPES, GLOSSARY, JOKER_MAP,
  Joker, Role, Scaling, Stage, Level, SynergyKind, Archetype, HandType, Synergy, Rarity,
} from "@/data/jokers";

export { JOKERS, SYNERGIES, COMBOS, ARCHETYPES, GLOSSARY, JOKER_MAP };
export type { Popularity, Difficulty } from "@/data/jokers";
export type { Joker, Role, Scaling, Stage, Level, SynergyKind, Archetype, HandType, Synergy, Rarity };

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

export const ALL_RARITIES: Rarity[] = ["common", "uncommon", "rare", "legendary"];

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

/** Reverse lookup: joker display name -> id (for sprite/JOKER_MAP). */
export const NAME_TO_ID: Record<string, string> = Object.fromEntries(JOKERS.map(j => [j.name, j.id]));
export function jokerIdFromName(name: string): string | undefined {
  return NAME_TO_ID[name];
}

export function jokerName(id: string): string {
  return JOKER_MAP[id]?.name ?? id;
}

const comboAppearances: Record<string, number> = {};
for (const c of COMBOS) {
  for (const id of [...c.core, ...c.optional]) {
    comboAppearances[id] = (comboAppearances[id] ?? 0) + 1;
  }
}
export function synergyDensity(j: Joker): number {
  return j.partners.length + (comboAppearances[j.id] ?? 0);
}

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

  const score = LEVEL_RANK[j.consistency] - (LEVEL_RANK[j.setupDifficulty] - 1);
  if (score >= 2) return "high";
  if (score <= 0) return "low";
  return "med";
}

export function beginnerScore(j: Joker): number {
  const setup = { low: 0, med: 2, high: 4 }[j.setupDifficulty];
  const risk = { low: 0, med: 1, high: 3 }[j.risk];
  const scalingMap: Record<Scaling, number> = {
    static: 0,
    linear: 0,
    conditional: 1,
    multiplicative: 2,
    exponential: 3,
  };
  const scaling = scalingMap[j.scaling];

  const consistencyPenalty = 2 - LEVEL_RANK[j.consistency];
  const rarityMap: Record<Rarity, number> = {
    common: 0,
    uncommon: 1,
    rare: 2,
    legendary: 3,
  };
  const rarity = j.rarity ? rarityMap[j.rarity] : 0;
  return setup + risk + scaling + consistencyPenalty + rarity;
}

export interface SynergyConnection {
  partnerId: string;
  kind: SynergyKind;
  engine: Synergy["engine"];
  why: string;
  a: string;
  b: string;
  sources?: Synergy["sources"];
  popularity?: Synergy["popularity"];
  difficulty?: Synergy["difficulty"];
}

export function synergiesFor(id: string): SynergyConnection[] {
  const out: SynergyConnection[] = [];
  for (const s of SYNERGIES) {
    if (s.a === id) out.push({ partnerId: s.b, kind: s.kind, engine: s.engine, why: s.why, a: s.a, b: s.b, sources: s.sources, popularity: s.popularity, difficulty: s.difficulty });
    else if (s.b === id) out.push({ partnerId: s.a, kind: s.kind, engine: s.engine, why: s.why, a: s.a, b: s.b, sources: s.sources, popularity: s.popularity, difficulty: s.difficulty });
  }
  return out;
}

export function synergyKey(a: string, b: string): string {
  return [a, b].sort().join("__");
}

export function antiSynergyReason(a: string, b: string): string | null {
  for (const s of SYNERGIES) {
    const match = (s.a === a && s.b === b) || (s.a === b && s.b === a);
    if (match && (s.kind === "trap_unless_enabled" || s.kind === "risky_explosive")) {
      return s.why;
    }
  }
  return null;
}

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

export interface UseCaseRule {
  rule: "early_pickup" | "endgame_payoff" | "pivot_piece" | "economy_snowball" | "late_commit" | "pairs_partners";
  role?: Role;
  partners?: number;
}

export function exampleUseCaseRules(j: Joker): UseCaseRule[] {
  const out: UseCaseRule[] = [];
  if (j.stage.includes("early")) out.push({ rule: "early_pickup", role: j.mainRole });
  if (j.mainRole === "payoff") out.push({ rule: "endgame_payoff" });
  if (j.tags.includes("pivot")) out.push({ rule: "pivot_piece" });
  if (j.mainRole === "economy") out.push({ rule: "economy_snowball" });
  if (out.length === 0) {
    if (j.stage.includes("late")) out.push({ rule: "late_commit" });
    out.push({ rule: "pairs_partners", partners: j.partners.length });
  }
  return out.slice(0, 3);
}

export function exampleUseCases(j: Joker): string[] {
  return exampleUseCaseRules(j).map((r) => {
    switch (r.rule) {
      case "early_pickup":
        return `Early-game pickup: a low-cost ${ROLE_LABELS[r.role!].toLowerCase()} piece to stabilize your score while you assemble a real engine.`;
      case "endgame_payoff":
        return "Endgame multiplier engine when its enabling condition is reliably met every scored hand.";
      case "pivot_piece":
        return "Pivot piece when your primary scaling axis bricks; slot it in to redirect the build.";
      case "economy_snowball":
        return "Economy snowball: bank the extra income early, then reinvest it into your win condition.";
      case "late_commit":
        return "Late-game commitment: bring it online once the supporting pieces are in place.";
      case "pairs_partners":
        return `Pairs naturally with ${r.partners} curated partners; see Best Partners below.`;
    }
  });
}

export interface WhyBullet {
  text: string;
  rule: string;
}

export interface WhyRule {
  rule: "core_role" | "best_partners" | "fits_archetypes" | "setup_risk" | "anti_warning";
  role?: Role;
  scaling?: Scaling;
  partnerIds?: string[];
  archetypeIds?: Archetype[];
  setup?: Level;
  risk?: Level;
  antiIds?: string[];
}

export function whyPlayThisRules(j: Joker): WhyRule[] {
  const out: WhyRule[] = [];
  out.push({ rule: "core_role", role: j.mainRole, scaling: j.scaling });
  const partnerIds = j.partners.slice(0, 3);
  if (partnerIds.length > 0) out.push({ rule: "best_partners", partnerIds });
  const fitIds = ARCHETYPES.filter(
    (a) => a.enablers.includes(j.id) || a.scalers.includes(j.id) || (j.archetypes as string[]).includes(a.id),
  ).map((a) => a.id);
  const uniqueFits = Array.from(new Set(fitIds));
  if (uniqueFits.length > 0) out.push({ rule: "fits_archetypes", archetypeIds: uniqueFits.slice(0, 4) });
  out.push({ rule: "setup_risk", setup: j.setupDifficulty, risk: j.risk });
  if (j.antiSynergies.length > 0) out.push({ rule: "anti_warning", antiIds: j.antiSynergies });
  return out;
}

export function whyPlayThis(j: Joker): WhyBullet[] {
  return whyPlayThisRules(j).map((r) => {
    switch (r.rule) {
      case "core_role":
        return { text: `Core role: ${ROLE_LABELS[r.role!]}. Scales by ${SCALING_LABELS[r.scaling!].toLowerCase()}.`, rule: "from mainRole + scaling" };
      case "best_partners":
        return { text: `Best partners: ${r.partnerIds!.map(jokerName).join(", ")}.`, rule: "top 3 from partners" };
      case "fits_archetypes":
        return { text: `Fits archetypes: ${r.archetypeIds!.map((id) => ARCHETYPE_LABELS[id] ?? id).join(", ")}.`, rule: "archetypes containing this joker" };
      case "setup_risk":
        return { text: `Setup: ${LEVEL_LABELS[r.setup!]}. Risk: ${LEVEL_LABELS[r.risk!]}.`, rule: "from setupDifficulty + risk" };
      case "anti_warning":
        return { text: `Watch out for: ${r.antiIds!.map(jokerName).join(", ")}.`, rule: "from antiSynergies" };
    }
  });
}

export interface ActiveSynergy {
  a: string;
  b: string;
  kind: SynergyKind;
  engine: Synergy["engine"];
  why: string;
}

export function activeSynergies(selection: string[]): ActiveSynergy[] {
  const set = new Set(selection);
  return SYNERGIES.filter((s) => set.has(s.a) && set.has(s.b)).map((s) => ({
    a: s.a, b: s.b, kind: s.kind, engine: s.engine, why: s.why,
  }));
}

export interface ImpliedArchetype {
  id: Archetype;
  name: string;
  matched: string[];
}

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

export function suggestedArchetypes(selection: string[]): ImpliedArchetype[] {
  if (selection.length === 0) return [];
  const counts: Record<string, string[]> = {};
  for (const id of selection) {
    const j = JOKER_MAP[id];
    if (!j) continue;
    for (const arch of j.archetypes) {
      (counts[arch] ??= []).push(id);
    }
  }
  const threshold = selection.length >= 2 ? 2 : 1;
  const out: ImpliedArchetype[] = [];
  for (const a of ARCHETYPES) {
    const matched = counts[a.id];
    if (matched && matched.length >= threshold) {
      out.push({ id: a.id, name: a.name, matched });
    }
  }

  return out.sort((x, y) => y.matched.length - x.matched.length);
}

export interface HeuristicSynergy {
  a: string;
  b: string;
  reasonKey: "partner" | "archetype" | "tag";
  detail: string;
  score: number;
}

export function heuristicSynergies(selection: string[]): HeuristicSynergy[] {
  if (selection.length < 2) return [];
  const out: HeuristicSynergy[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < selection.length; i++) {
    for (let j = i + 1; j < selection.length; j++) {
      const idA = selection[i];
      const idB = selection[j];
      if (idA === idB) continue;
      const key = [idA, idB].sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);

      if (synergyPairs.has(key)) continue;
      const a = JOKER_MAP[idA];
      const b = JOKER_MAP[idB];
      if (!a || !b) continue;

      if (a.antiSynergies.includes(idB) || b.antiSynergies.includes(idA)) continue;

      if (a.partners.includes(idB) || b.partners.includes(idA)) {
        out.push({ a: idA, b: idB, reasonKey: "partner", detail: "", score: 3 });
        continue;
      }

      const sharedArch = a.archetypes.filter((x) => b.archetypes.includes(x));
      if (sharedArch.length > 0) {
        out.push({ a: idA, b: idB, reasonKey: "archetype", detail: sharedArch.join(","), score: 2 + sharedArch.length });
        continue;
      }

      const sharedTags = a.tags.filter((x) => b.tags.includes(x));
      if (sharedTags.length >= 2) {
        out.push({ a: idA, b: idB, reasonKey: "tag", detail: sharedTags.slice(0, 3).join(","), score: 1 + sharedTags.length * 0.5 });
      }
    }
  }

  return out.sort((x, y) => y.score - x.score).slice(0, 12);
}

export interface AntiWarning {
  a: string;
  b: string;
  why: string;
  fromSynergy: boolean;
}

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
        const fromSynergy = antiSynergyReason(idA, idB);
        const why = fromSynergy ?? `${jokerName(idA)} undercuts or competes with ${jokerName(idB)}.`;
        out.push({ a: idA, b: idB, why, fromSynergy: fromSynergy != null });
      }
    }
  }
  return out;
}

const synergyPairs = new Set<string>();
for (const s of SYNERGIES) {
  synergyPairs.add([s.a, s.b].sort().join("|"));
}

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

