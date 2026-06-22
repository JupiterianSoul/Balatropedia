import spriteData from "@/data/phase3/sprites.json";
import { API_BASE } from "@/lib/queryClient";

export type Phase3Category =
  | "decks"
  | "stakes"
  | "tarots"
  | "planets"
  | "spectrals"
  | "vouchers"
  | "enhancements"
  | "editions"
  | "seals"
  | "tags";

const SPRITES = spriteData as Record<Phase3Category, Record<string, string>>;

export function getPhase3Sprite(category: Phase3Category, id: string): string | undefined {
  const raw = SPRITES[category]?.[id];
  if (!raw) return undefined;
  return `${API_BASE}/api/sprite?url=${encodeURIComponent(raw)}`;
}

