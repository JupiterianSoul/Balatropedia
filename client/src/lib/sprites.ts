import spriteData from "@/data/joker_sprites.json";
import { API_BASE } from "@/lib/queryClient";

const SPRITES = spriteData as Record<string, string>;

/**
 * Returns the sprite URL for a joker id, or undefined if not present.
 *
 * The raw wikia URLs are blocked for cross-origin <img> loads (wikia returns
 * 404 when an Origin header is present), so we route them through the app's
 * own same-origin `/api/sprite` proxy. API_BASE carries the `__PORT_5000__`
 * rewrite so the proxy resolves correctly both locally and when deployed.
 */
export function getSpriteUrl(jokerId: string): string | undefined {
  const raw = SPRITES[jokerId];
  if (!raw) return undefined;
  return `${API_BASE}/api/sprite?url=${encodeURIComponent(raw)}`;
}
