import { JOKER_MAP } from "@/lib/helpers";
import { TAROTS } from "@/data/phase3/tarots";
import { PLANETS } from "@/data/phase3/planets";
import { SPECTRALS } from "@/data/phase3/spectrals";
import { VOUCHERS } from "@/data/phase3/vouchers";
import { DECKS } from "@/data/phase3/decks";
import { STAKES } from "@/data/phase3/stakes";
import { ENHANCEMENTS, EDITIONS, SEALS, TAGS } from "@/data/phase3/misc";

export type EntityKind =
  | "joker"
  | "tarot"
  | "planet"
  | "spectral"
  | "voucher"
  | "deck"
  | "stake"
  | "enhancement"
  | "edition"
  | "seal"
  | "tag";

export const KIND_TO_SPRITE_CATEGORY: Record<Exclude<EntityKind, "joker">, string> = {
  tarot: "tarots",
  planet: "planets",
  spectral: "spectrals",
  voucher: "vouchers",
  deck: "decks",
  stake: "stakes",
  enhancement: "enhancements",
  edition: "editions",
  seal: "seals",
  tag: "tags",
};

export const KIND_TO_I18N_CATEGORY: Record<EntityKind, string> = {
  joker: "jokers",
  tarot: "tarots",
  planet: "planets",
  spectral: "spectrals",
  voucher: "vouchers",
  deck: "decks",
  stake: "stakes",
  enhancement: "enhancements",
  edition: "editions",
  seal: "seals",
  tag: "tags",
};

export interface NormalizedEntity {
  kind: EntityKind;
  id: string;
  name: string;

  effect: string;

  meta: { label: string; value: string }[];

  strategy?: string;

  whenToUse?: string;

  bestWith: string[];
  deepStrategy?: string[];
  bestTimingNotes?: string;
  commonMistakes?: string[];
  comboIdeas?: string[];
}

function byId<T extends { id: string }>(arr: T[], id: string): T | undefined {
  return arr.find((e) => e.id === id);
}

export function resolveEntity(kind: EntityKind, id: string): NormalizedEntity | null {
  switch (kind) {
    case "joker": {
      const j = JOKER_MAP[id];
      if (!j) return null;
      return {
        kind, id, name: j.name, effect: j.summary, meta: [], strategy: j.notes,
        bestWith: j.partners ?? [], deepStrategy: undefined,
      };
    }
    case "tarot": {
      const e = byId(TAROTS, id);
      if (!e) return null;
      return {
        kind, id, name: e.name, effect: e.effect, meta: [],
        whenToUse: e.whenToUse, bestWith: e.bestWith ?? [],
        deepStrategy: e.deepStrategy, bestTimingNotes: e.bestTimingNotes,
        commonMistakes: e.commonMistakes, comboIdeas: e.comboIdeas,
      };
    }
    case "planet": {
      const e = byId(PLANETS, id);
      if (!e) return null;
      return {
        kind, id, name: e.name, effect: `Levels up ${e.hand}.`,
        meta: [
          { label: "Hand", value: e.hand },
          { label: "Per level", value: `+${e.chipsPerLevel} chips · +${e.multPerLevel} mult` },
        ],
        strategy: e.scalingNotes, bestWith: e.bestWith ?? [],
        deepStrategy: e.deepStrategy, bestTimingNotes: e.bestTimingNotes,
        commonMistakes: e.commonMistakes, comboIdeas: e.comboIdeas,
      };
    }
    case "spectral": {
      const e = byId(SPECTRALS, id);
      if (!e) return null;
      return {
        kind, id, name: e.name, effect: e.effect,
        meta: e.risk ? [{ label: "Risk", value: e.risk }] : [],
        whenToUse: e.sequencing, bestWith: e.bestWith ?? [],
        deepStrategy: e.deepStrategy, bestTimingNotes: e.bestTimingNotes,
        commonMistakes: e.commonMistakes, comboIdeas: e.comboIdeas,
      };
    }
    case "voucher": {
      const e = byId(VOUCHERS, id);
      if (!e) return null;
      return {
        kind, id, name: e.name, effect: e.effect,
        meta: [
          { label: "Tier", value: `T${e.tier}` },
          { label: "Value", value: e.valueTier },
        ],
        strategy: e.notes, bestWith: [],
        deepStrategy: e.deepStrategy, bestTimingNotes: e.bestTimingNotes,
        commonMistakes: e.commonMistakes, comboIdeas: e.comboIdeas,
      };
    }
    case "deck": {
      const e = byId(DECKS, id);
      if (!e) return null;
      return {
        kind, id, name: e.name, effect: e.effect, meta: [],
        strategy: e.strategy, bestWith: e.recommendedJokers ?? [],
        deepStrategy: e.deepStrategy, bestTimingNotes: e.bestTimingNotes,
        commonMistakes: e.commonMistakes, comboIdeas: e.comboIdeas,
      };
    }
    case "stake": {
      const e = byId(STAKES, id);
      if (!e) return null;
      return {
        kind, id, name: e.name, effect: e.modifiers.join(" "),
        meta: [], strategy: e.watchOut, bestWith: [],
        deepStrategy: e.deepStrategy, bestTimingNotes: e.bestTimingNotes,
        commonMistakes: e.commonMistakes, comboIdeas: e.comboIdeas,
      };
    }
    case "enhancement": {
      const e = byId(ENHANCEMENTS, id);
      if (!e) return null;
      return { kind, id, name: e.name, effect: e.effect, meta: [], bestWith: [] };
    }
    case "edition": {
      const e = byId(EDITIONS, id);
      if (!e) return null;
      return { kind, id, name: e.name, effect: e.effect, meta: [], bestWith: [] };
    }
    case "seal": {
      const e = byId(SEALS, id);
      if (!e) return null;
      return { kind, id, name: e.name, effect: e.effect, meta: [], bestWith: [] };
    }
    case "tag": {
      const e = byId(TAGS, id);
      if (!e) return null;
      return {
        kind, id, name: e.name, effect: e.effect,
        meta: e.trigger ? [{ label: "Trigger", value: e.trigger }] : [],
        bestWith: [],
      };
    }
    default:
      return null;
  }
}

export const KNOWN_JOKER_IDS: string[] = Object.keys(JOKER_MAP);

