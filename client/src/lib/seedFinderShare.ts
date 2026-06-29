// Encode / decode a Seed Finder search to a base64url-encoded JSON string
// suitable for stuffing in a URL query param. Keeps the full V2 surface:
// jokers + vouchers + tags + bosses + standard cards + deck/stake/version.

import type {
  JokerConstraint, VoucherConstraint, TagConstraint, BossConstraint,
  StandardCardConstraint,
} from "./seedFinder";

export interface ShareableFinderConfig {
  jokerConstraints?: JokerConstraint[];
  voucherConstraints?: VoucherConstraint[];
  tagConstraints?: TagConstraint[];
  bossConstraints?: BossConstraint[];
  standardCardConstraints?: StandardCardConstraint[];
  deck?: string;
  stake?: string;
  version?: string;
}

function b64urlEncode(s: string): string {
  // btoa expects latin1; JSON content is ASCII for our shapes (joker names
  // are ASCII), so this round-trips safely. If a future field has non-ASCII
  // text, swap for TextEncoder + manual base64.
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function b64urlDecode(s: string): string {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  return atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
}

// Drop empty / default fields to keep URLs short.
function clean(c: ShareableFinderConfig): ShareableFinderConfig {
  const out: ShareableFinderConfig = {};
  if (c.jokerConstraints && c.jokerConstraints.length) {
    out.jokerConstraints = c.jokerConstraints.map(j => {
      const x: any = { joker: j.joker, maxAnte: j.maxAnte };
      if (j.edition) x.edition = j.edition;
      if (j.sticker) x.sticker = j.sticker;
      if (j.source) x.source = j.source;
      if (j.slot !== undefined && j.slot !== 255) x.slot = j.slot;
      return x;
    });
  }
  if (c.voucherConstraints?.length) out.voucherConstraints = c.voucherConstraints;
  if (c.tagConstraints?.length) {
    out.tagConstraints = c.tagConstraints.map(t => {
      const x: any = { tag: t.tag, maxAnte: t.maxAnte };
      if (t.position) x.position = t.position;
      return x;
    });
  }
  if (c.bossConstraints?.length) out.bossConstraints = c.bossConstraints;
  if (c.standardCardConstraints?.length) {
    out.standardCardConstraints = c.standardCardConstraints.map(s => {
      const x: any = { maxAnte: s.maxAnte };
      if (s.suit) x.suit = s.suit;
      if (s.rank) x.rank = s.rank;
      if (s.base) x.base = s.base;
      if (s.enhancement) x.enhancement = s.enhancement;
      if (s.edition) x.edition = s.edition;
      if (s.seal) x.seal = s.seal;
      return x;
    });
  }
  if (c.deck) out.deck = c.deck;
  if (c.stake) out.stake = c.stake;
  if (c.version) out.version = c.version;
  return out;
}

export function encodeFinderConfig(c: ShareableFinderConfig): string {
  const json = JSON.stringify(clean(c));
  return b64urlEncode(json);
}

export function decodeFinderConfig(s: string): ShareableFinderConfig | null {
  try {
    const json = b64urlDecode(s);
    const obj = JSON.parse(json);
    if (typeof obj !== "object" || obj === null || Array.isArray(obj)) return null;
    return obj as ShareableFinderConfig;
  } catch {
    return null;
  }
}
