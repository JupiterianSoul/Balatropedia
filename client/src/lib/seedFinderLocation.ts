
export type Blind = "Small" | "Big" | "Boss";

export interface ShopSlotInfo {
  blind: Blind;
  positionInShop: number;
  blindLabel: string;
  full: string;
  /** True when the engine didn't pin a specific slot (slot <= 0). */
  unspecified: boolean;
}

/**
 * 1-based slot → (blind, position-in-shop).
 * Shop visits per ante: 5 items each at Small, Big, Boss → slots 1..15.
 * slot <= 0 means "unspecified"; returns `unspecified: true` so callers
 * can render "any shop" instead of bogus Boss/slot 0.
 */
export function describeShopSlot(slot: number, ante: number): ShopSlotInfo {
  if (!Number.isFinite(slot) || slot <= 0) {
    return {
      blind: "Small",
      positionInShop: 0,
      blindLabel: "In the ante's shops",
      full: "In the ante's shops (slot unspecified)",
      unspecified: true,
    };
  }
  const perShop = 5;
  const clamped = Math.min(15, slot);
  const visitIndex = Math.min(2, Math.floor((clamped - 1) / perShop));
  const blind: Blind = visitIndex === 0 ? "Small" : visitIndex === 1 ? "Big" : "Boss";
  const pos = ((clamped - 1) % perShop) + 1;
  return {
    blind,
    positionInShop: pos,
    blindLabel: `After ${blind} Blind`,
    full: `After ${blind} Blind, shop item ${pos}`,
    unspecified: false,
  };
}

export interface PackSlotInfo {
  blind: Blind;
  positionInShop: number;
  blindLabel: string;
  full: string;
  unspecified: boolean;
}

/**
 * 1-based pack index → (blind, position-in-shop).
 * 2 packs per shop visit, 3 visits per ante → indexes 1..6.
 * packIdx <= 0 means "unspecified".
 */
export function describePackSlot(packIdx: number, ante: number): PackSlotInfo {
  if (!Number.isFinite(packIdx) || packIdx <= 0) {
    return {
      blind: "Small",
      positionInShop: 0,
      blindLabel: "In any of the ante's booster packs",
      full: "In any of the ante's booster packs (slot unspecified)",
      unspecified: true,
    };
  }
  const perShop = 2;
  const clamped = Math.min(6, packIdx);
  const visitIndex = Math.min(2, Math.floor((clamped - 1) / perShop));
  const blind: Blind = visitIndex === 0 ? "Small" : visitIndex === 1 ? "Big" : "Boss";
  const pos = ((clamped - 1) % perShop) + 1;
  const ordinal = pos === 1 ? "1st" : "2nd";
  return {
    blind,
    positionInShop: pos,
    blindLabel: `After ${blind} Blind`,
    full: `After ${blind} Blind, ${ordinal} booster`,
    unspecified: false,
  };
}

export function isBuffoonPack(name: string): boolean {
  return name.includes("Buffoon");
}
