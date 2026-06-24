
export type Blind = "Small" | "Big" | "Boss";

export interface ShopSlotInfo {
  blind: Blind;
  positionInShop: number;
  blindLabel: string;
  full: string;
}

export function describeShopSlot(slot: number, ante: number): ShopSlotInfo {
  const perShop = 5;
  const visitIndex = Math.min(2, Math.floor((slot - 1) / perShop));
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
  positionInShop: number;
  blindLabel: string;
  full: string;
}

export function describePackSlot(packIdx: number, ante: number): PackSlotInfo {
  const perShop = 2;
  const visitIndex = Math.min(2, Math.floor((packIdx - 1) / perShop));
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

export function isBuffoonPack(name: string): boolean {
  return name.includes("Buffoon");
}
