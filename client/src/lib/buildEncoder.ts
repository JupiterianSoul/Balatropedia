// Compact base64 encoding of PlannerState for URL sharing.
// Strategy: JSON.stringify, then base64url encode. Short keys keep it small.
import type { PlannerState } from "../../../shared/plannerTypes";
import { makeDefaultState } from "../../../shared/plannerTypes";

const KEY_MAP: Record<string, string> = {
  hand: "h",
  handLevel: "l",
  slots: "s",
  steelCards: "st",
  glassCards: "gl",
  redSealRetriggers: "rs",
  enhancementChips: "ec",
  externalXMult: "ex",
  deckId: "d",
  stakeId: "k",
  ante: "a",
  voucherIds: "v",
  consumables: "c",
  notes: "n",
  jokerId: "j",
  edition: "e",
  addChips: "ac",
  addMult: "am",
  xMult: "xm",
  kind: "kd",
  id: "i",
};

const INV_KEY_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(KEY_MAP).map(([k, v]) => [v, k])
);

function shrink(obj: any): any {
  if (Array.isArray(obj)) return obj.map(shrink);
  if (obj && typeof obj === "object") {
    const out: any = {};
    for (const [k, v] of Object.entries(obj)) {
      out[KEY_MAP[k] ?? k] = shrink(v);
    }
    return out;
  }
  return obj;
}

function expand(obj: any): any {
  if (Array.isArray(obj)) return obj.map(expand);
  if (obj && typeof obj === "object") {
    const out: any = {};
    for (const [k, v] of Object.entries(obj)) {
      out[INV_KEY_MAP[k] ?? k] = expand(v);
    }
    return out;
  }
  return obj;
}

function b64urlEncode(s: string): string {
  return btoa(unescape(encodeURIComponent(s)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function b64urlDecode(s: string): string {
  const pad = s.length % 4 === 0 ? 0 : 4 - (s.length % 4);
  const norm = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad);
  return decodeURIComponent(escape(atob(norm)));
}

export function encodeBuild(state: PlannerState): string {
  return b64urlEncode(JSON.stringify(shrink(state)));
}

export function decodeBuild(encoded: string): PlannerState | null {
  try {
    const raw = JSON.parse(b64urlDecode(encoded));
    const expanded = expand(raw);
    // Merge with defaults to backfill any missing fields
    const def = makeDefaultState();
    return { ...def, ...expanded };
  } catch {
    return null;
  }
}
