// Balatropedia — parse `inspect_seed` clause-detail strings into structured
// JokerLocation / VoucherLocation / TagLocation records.
//
// The Rust WASM engine's `inspect_seed(filter_json, seed, deck_idx, stake_idx)`
// returns JSON of the form:
//
//   {
//     "ok": true,
//     "seed": "ABCDEFGH",
//     "clauses": [
//       { "index": 0, "matched": true, "detail": "ante 3 · shop slot 7 [Foil]" },
//       { "index": 1, "matched": true, "detail": "ante 2 pack #1 (Buffoon Pack) contains Blueprint" },
//       { "index": 2, "matched": true, "detail": "ante 4 pack #3 (Arcana Pack) · Soul → Triboulet" },
//       ...
//     ],
//     "matched": 3,
//     "total": 3
//   }
//
// `any_of` clauses prefix with `any_of[i]: <inner>`. We strip that prefix and
// recurse.
//
// Pack index → blind / packPosition mapping (the engine emits packs in order):
//   pack #0 = Small blind, position 1
//   pack #1 = Small blind, position 2
//   pack #2 = Big   blind, position 1
//   pack #3 = Big   blind, position 2
//   pack #4 = Boss  blind, position 1
//   pack #5 = Boss  blind, position 2
//
// Shop slot 0..14 mapping (5 items per blind):
//   slot 0..4   = Small blind shop, position 1..5
//   slot 5..9   = Big   blind shop, position 1..5
//   slot 10..14 = Boss  blind shop, position 1..5

import type { JokerLocation } from "./seedFinder";

export interface InspectClause {
  index: number;
  matched: boolean;
  detail: string;
}

export interface InspectResult {
  ok: boolean;
  seed: string;
  clauses: InspectClause[];
  matched: number;
  total: number;
  error?: string;
}

/** Parse the raw JSON string returned from wasm `inspect_seed`. */
export function parseInspectJson(raw: string): InspectResult | null {
  try {
    return JSON.parse(raw) as InspectResult;
  } catch {
    return null;
  }
}

/** Strip leading "any_of[N]: " wrappers (clauses can nest one level deep). */
function stripAnyOfPrefix(detail: string): string {
  return detail.replace(/^any_of\[\d+\]:\s*/, "");
}

interface ParsedShop {
  kind: "shop";
  ante: number;
  slot: number;     // 0..14 (engine-native)
  edition?: string; // "Foil" | "Holographic" | "Polychrome" | "Negative"
  eternal?: boolean;
  perishable?: boolean;
  rental?: boolean;
}

interface ParsedPackContains {
  kind: "pack-contains";
  ante: number;
  packIndex: number; // 0..5
  packName: string;
  card: string;
}

interface ParsedSoul {
  kind: "soul";
  ante: number;
  packIndex: number;
  packName: string;
  joker: string;
}

interface ParsedWraith {
  kind: "wraith";
  ante: number;
  packIndex: number;
  packName: string;
  joker: string;
}

interface ParsedStandard {
  kind: "standard";
  ante: number;
  packIndex: number;
  packName: string;
  cardIndex: number;
  base: string;
}

type Parsed =
  | ParsedShop
  | ParsedPackContains
  | ParsedSoul
  | ParsedWraith
  | ParsedStandard;

/**
 * Parse a single clause detail string into structured form.
 * Returns null if the string doesn't match any known shape (e.g. tag/boss/voucher
 * clauses, which the SeedMatch payload tracks separately or doesn't need
 * fine-grained mapping for).
 */
export function parseClauseDetail(rawDetail: string): Parsed | null {
  const detail = stripAnyOfPrefix(rawDetail);

  // Shop slot: "ante N · shop slot S [Edition] [Eternal] ..."
  const shopMatch = detail.match(/^ante\s+(\d+)\s+·\s+shop slot\s+(\d+)(.*)$/);
  if (shopMatch) {
    const ante = parseInt(shopMatch[1], 10);
    const slot = parseInt(shopMatch[2], 10);
    const tail = shopMatch[3] || "";
    const out: ParsedShop = { kind: "shop", ante, slot };
    const editionMatch = tail.match(/\[(Foil|Holographic|Polychrome|Negative)\]/);
    if (editionMatch) out.edition = editionMatch[1];
    if (/\[Eternal\]/.test(tail)) out.eternal = true;
    if (/\[Perishable\]/.test(tail)) out.perishable = true;
    if (/\[Rental\]/.test(tail)) out.rental = true;
    return out;
  }

  // Soul: "ante N pack #I (PackName) · Soul → Joker"
  const soulMatch = detail.match(/^ante\s+(\d+)\s+pack\s+#(\d+)\s+\(([^)]+)\)\s+·\s+Soul\s+→\s+(.+?)\s*$/);
  if (soulMatch) {
    return {
      kind: "soul",
      ante: parseInt(soulMatch[1], 10),
      packIndex: parseInt(soulMatch[2], 10),
      packName: soulMatch[3],
      joker: soulMatch[4],
    };
  }

  // Wraith: "ante N pack #I (PackName) · Wraith → Joker"
  const wraithMatch = detail.match(/^ante\s+(\d+)\s+pack\s+#(\d+)\s+\(([^)]+)\)\s+·\s+Wraith\s+→\s+(.+?)\s*$/);
  if (wraithMatch) {
    return {
      kind: "wraith",
      ante: parseInt(wraithMatch[1], 10),
      packIndex: parseInt(wraithMatch[2], 10),
      packName: wraithMatch[3],
      joker: wraithMatch[4],
    };
  }

  // Standard pack card: "ante N pack #I (PackName) · card CI = Base"
  const stdMatch = detail.match(/^ante\s+(\d+)\s+pack\s+#(\d+)\s+\(([^)]+)\)\s+·\s+card\s+(\d+)\s+=\s+(.+?)\s*$/);
  if (stdMatch) {
    return {
      kind: "standard",
      ante: parseInt(stdMatch[1], 10),
      packIndex: parseInt(stdMatch[2], 10),
      packName: stdMatch[3],
      cardIndex: parseInt(stdMatch[4], 10),
      base: stdMatch[5],
    };
  }

  // Pack contains (Buffoon / Arcana etc.): "ante N pack #I (PackName) contains Joker"
  const packMatch = detail.match(/^ante\s+(\d+)\s+pack\s+#(\d+)\s+\(([^)]+)\)\s+contains\s+(.+?)\s*$/);
  if (packMatch) {
    return {
      kind: "pack-contains",
      ante: parseInt(packMatch[1], 10),
      packIndex: parseInt(packMatch[2], 10),
      packName: packMatch[3],
      card: packMatch[4],
    };
  }

  return null;
}

/** 5 shop items per blind: slot 0..4 = Small (positions 1..5), 5..9 = Big, 10..14 = Boss. */
export function shopSlotToBlindAndPosition(slot: number): { blind: "Small" | "Big" | "Boss"; positionInShop: number } {
  if (slot < 0) return { blind: "Small", positionInShop: 1 };
  const blindIdx = Math.min(2, Math.floor(slot / 5));
  const positionInShop = (slot % 5) + 1;
  const blind = (["Small", "Big", "Boss"] as const)[blindIdx];
  return { blind, positionInShop };
}

/** 2 packs per blind: pack #0/1 = Small, #2/3 = Big, #4/5 = Boss. */
export function packIndexToBlindAndPosition(packIndex: number): { blind: "Small" | "Big" | "Boss"; positionInShop: number } {
  if (packIndex < 0) return { blind: "Small", positionInShop: 1 };
  const blindIdx = Math.min(2, Math.floor(packIndex / 2));
  const positionInShop = (packIndex % 2) + 1;
  const blind = (["Small", "Big", "Boss"] as const)[blindIdx];
  return { blind, positionInShop };
}

export interface JokerConstraintLite {
  joker: string;
  source?: string;
  edition?: string;
  sticker?: string;
  slot?: number;
  maxAnte: number;
}

/**
 * Build a JokerLocation from a parsed clause detail.
 * The constraint is needed to know which `source` enum value to emit, which
 * edition/sticker the user asked for, and to detect inconsistencies.
 */
export function locationFromParsed(parsed: Parsed, jc: JokerConstraintLite): JokerLocation | null {
  if (parsed.kind === "shop") {
    return {
      joker: jc.joker,
      edition: parsed.edition ?? jc.edition ?? "",
      source: "shop",
      ante: parsed.ante,
      // Engine slot is 0..14 but downstream code expects 1-indexed (slot+1) when
      // it really means a specific shop position. We carry the raw engine slot
      // here; describeShopSlot handles >0 correctly.
      slot: parsed.slot + 1,
      packName: "",
      packPosition: 0,
      eternal: parsed.eternal ?? (jc.sticker === "eternal"),
      perishable: parsed.perishable ?? (jc.sticker === "perishable"),
      rental: parsed.rental ?? (jc.sticker === "rental"),
    };
  }
  if (parsed.kind === "pack-contains") {
    // The engine resolved a specific pack #. Map back to (blind, packPosition).
    const { positionInShop } = packIndexToBlindAndPosition(parsed.packIndex);
    // For pack-contains, packPosition refers to the position OF THE CARD inside
    // the pack — we don't know that from `pack-contains` (we only know the pack
    // contains it). Default to 0 and the UI will say "in the pack" without a
    // card #.
    return {
      joker: jc.joker,
      edition: jc.edition ?? "",
      source: "buffoon-pack",
      ante: parsed.ante,
      // We encode the booster pack ORDINAL (1 or 2 for that blind) into slot
      // using the convention packSlot = blindIdx*2 + (positionInShop-1) ... but
      // describePackSlot expects raw packIndex, so we pass packIndex+1.
      slot: parsed.packIndex + 1,
      packName: parsed.packName,
      packPosition: 0,
      eternal: jc.sticker === "eternal",
      perishable: jc.sticker === "perishable",
      rental: jc.sticker === "rental",
    };
  }
  if (parsed.kind === "soul") {
    const isArcana = /Arcana/i.test(parsed.packName);
    return {
      joker: jc.joker,
      edition: jc.edition ?? "",
      source: isArcana ? "arcana-soul" : "spectral-soul",
      ante: parsed.ante,
      slot: parsed.packIndex + 1,
      packName: parsed.packName,
      packPosition: 0,
      eternal: jc.sticker === "eternal",
      perishable: jc.sticker === "perishable",
      rental: jc.sticker === "rental",
    };
  }
  if (parsed.kind === "wraith") {
    return {
      joker: jc.joker,
      edition: jc.edition ?? "",
      source: "spectral-wraith",
      ante: parsed.ante,
      slot: parsed.packIndex + 1,
      packName: parsed.packName,
      packPosition: 0,
      eternal: jc.sticker === "eternal",
      perishable: jc.sticker === "perishable",
      rental: jc.sticker === "rental",
    };
  }
  return null;
}
