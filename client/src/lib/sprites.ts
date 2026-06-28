import spriteData from "@/data/joker_sprites.json";
import localManifest from "@/data/local_sprites.json";
import { API_BASE } from "@/lib/queryClient";
import { IS_LOCAL } from "@/lib/localAdapter";

const SPRITES = spriteData as Record<string, string>;
const LOCAL = localManifest as {
  logo: string;
  jokers: Record<string, string>;
  phase3: Record<string, Record<string, string>>;
};

// Local sprites are copied verbatim from client/public/sprites/ into the
// Vite build, so a "./sprites/<file>" URL works in both web and Capacitor.
function localUrl(file: string): string {
  return `./sprites/${file}`;
}

export function getSpriteUrl(jokerId: string): string | undefined {
  if (IS_LOCAL) {
    const file = LOCAL.jokers[jokerId];
    return file ? localUrl(file) : undefined;
  }
  const raw = SPRITES[jokerId];
  if (!raw) return undefined;
  return `${API_BASE}/api/sprite?url=${encodeURIComponent(raw)}`;
}

export function getLogoUrl(): string {
  // New Balatropedia logo (red/blue blurred joker card). Bundled locally,
  // works in both web and APK builds.
  return "/balatropedia-logo.png";
}
