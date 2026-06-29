import spriteData from "@/data/phase3/sprites.json";
import localManifest from "@/data/local_sprites.json";
import { API_BASE } from "@/lib/queryClient";
import { IS_LOCAL } from "@/lib/localAdapter";

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
const LOCAL = localManifest as {
  phase3: Record<Phase3Category, Record<string, string>>;
};

export function getPhase3Sprite(category: Phase3Category, id: string): string | undefined {
  // Prefer LOCAL sprites first (cleaner; Decks/Stakes wiki PNGs have wide blue
  // Balatro deck-select backgrounds we don't want). Fall back to remote only
  // when no local copy exists.
  const localFile = LOCAL.phase3?.[category]?.[id];
  if (localFile) {
    return IS_LOCAL ? `./sprites/${localFile}` : `/sprites/${localFile}`;
  }
  if (IS_LOCAL) return undefined;
  const raw = SPRITES[category]?.[id];
  if (!raw) return undefined;
  return `${API_BASE}/api/sprite?url=${encodeURIComponent(raw)}`;
}
