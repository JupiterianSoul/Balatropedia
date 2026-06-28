// Tier List domain types.
export type ItemPool = 'jokers' | 'vouchers' | 'tarots' | 'planets' | 'spectrals';

export interface Tier {
  id: string;
  label: string;
  color: string;
  itemIds: string[];
}

export interface TierList {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  tiers: Tier[];
  itemPool: ItemPool;
}

export const DEFAULT_TIER_COLORS: Record<string, string> = {
  S: 'hsl(0 60% 45%)',
  A: 'hsl(28 70% 45%)',
  B: 'hsl(45 65% 45%)',
  C: 'hsl(145 40% 35%)',
  D: 'hsl(210 35% 40%)',
};

export const TIER_COLOR_PRESETS: { label: string; value: string }[] = [
  { label: 'Red',    value: 'hsl(0 60% 45%)' },
  { label: 'Orange', value: 'hsl(28 70% 45%)' },
  { label: 'Yellow', value: 'hsl(45 65% 45%)' },
  { label: 'Green',  value: 'hsl(145 40% 35%)' },
  { label: 'Blue',   value: 'hsl(210 35% 40%)' },
  { label: 'Purple', value: 'hsl(270 40% 40%)' },
  { label: 'Pink',   value: 'hsl(330 50% 45%)' },
  { label: 'Teal',   value: 'hsl(180 40% 35%)' },
  { label: 'Gold',   value: 'hsl(40 80% 45%)' },
  { label: 'Grey',   value: 'hsl(220 10% 40%)' },
];

export function makeDefaultTiers(): Tier[] {
  return ['S', 'A', 'B', 'C', 'D'].map((label) => ({
    id: `tier-${label.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    label,
    color: DEFAULT_TIER_COLORS[label] ?? 'hsl(220 10% 40%)',
    itemIds: [],
  }));
}
