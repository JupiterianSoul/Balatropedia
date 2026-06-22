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

/**
 * Returns the proxied sprite URL for a phase-3 entity, or undefined if absent.
 *
 * Mirrors the joker sprite proxy pattern (see lib/sprites.ts): raw wikia URLs
 * are blocked for cross-origin <img> loads, so they're routed through the app's
 * own same-origin `/api/sprite?url=...` proxy. API_BASE carries the
 * `__PORT_5000__` rewrite so it resolves both locally and when deployed.
 */
export function getPhase3Sprite(category: Phase3Category, id: string): string | undefined {
  const raw = SPRITES[category]?.[id];
  if (!raw) return undefined;
  return `${API_BASE}/api/sprite?url=${encodeURIComponent(raw)}`;
}
