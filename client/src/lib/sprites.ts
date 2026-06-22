import spriteData from "@/data/joker_sprites.json";
import { API_BASE } from "@/lib/queryClient";

const SPRITES = spriteData as Record<string, string>;

export function getSpriteUrl(jokerId: string): string | undefined {
  const raw = SPRITES[jokerId];
  if (!raw) return undefined;
  return `${API_BASE}/api/sprite?url=${encodeURIComponent(raw)}`;
}

