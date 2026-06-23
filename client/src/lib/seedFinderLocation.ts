// seedFinderLocation.ts - Pretty-format JokerLocation into human-readable strings.
//
// Balatro maps:
//   Shop slot 1..N      -> 3 shop visits per ante (after Small / Big / Boss).
//                         Default queue length = 15 (ante 1), +5/ante. We
//                         assume 5 items per visit and label accordingly.
//   Pack index 1..M     -> Packs are opened in the same 3 shop visits.
//                         4 packs/ante on ante 1 (2 per shop), 6/ante after
//                         (2 per shop).
//
// We expose:
//   formatShopSlot(slot, anteShopQueueLen)    -> "After Small Blind, item 3"
//   formatPackSlot(packIdx, ante)             -> "After Big Blind, 2nd booster"
//   formatPackType(packName)                  -> "Mega Buffoon Pack" (already is)

export type Blind = "Small" | "Big" | "Boss";

export interface ShopSlotInfo {
  blind: Blind;
  positionInShop: number;     // 1..5
  blindLabel: string;         // "After Small Blind"
  full: string;               // "After Small Blind, shop item 3"
}

export function describeShopSlot(slot: number, ante: number): ShopSlotInfo {
  // Ante 1: 15 items = 5 / shop * 3 shops. Later antes get +5 per ante,
  // but those extras are reroll fodder beyond the 3 visits -- still 5 base
  // items per shop visit before rerolls.
  const perShop = 5;
  const visitIndex = Math.min(2, Math.floor((slot - 1) / perShop));  // 0,1,2
  const blind: Blind = visitIndex === 0 ? "Small" : visitIndex === 1 ? "Big" : "Boss";
  const pos = ((slot - 1) % perShop) + 1;
  return {
    blind,
    positionInShop: pos,
    blindLabel: `After ${blind} Blind`,
    full: `After ${blind} Blind, shop item ${pos}`,
  };
}

export interface PackSlotInfo {
  blind: Blind;
  positionInShop: number;     // 1 or 2
  blindLabel: string;
  full: string;
}

export function describePackSlot(packIdx: number, ante: number): PackSlotInfo {
  // 4 packs ante 1 (2 / shop, 2 shops -- the boss-blind shop is the
  // "free" one, no packs on ante 1). 6 packs ante 2+ (2 per shop, 3 shops).
  const perShop = 2;
  const visitIndex = Math.min(2, Math.floor((packIdx - 1) / perShop));  // 0,1,2
  const blind: Blind = visitIndex === 0 ? "Small" : visitIndex === 1 ? "Big" : "Boss";
  const pos = ((packIdx - 1) % perShop) + 1;
  const ordinal = pos === 1 ? "1st" : "2nd";
  return {
    blind,
    positionInShop: pos,
    blindLabel: `After ${blind} Blind`,
    full: `After ${blind} Blind, ${ordinal} booster`,
  };
}

/** Returns true if the pack name matches a Buffoon pack family. */
export function isBuffoonPack(name: string): boolean {
  return name.includes("Buffoon");
}
