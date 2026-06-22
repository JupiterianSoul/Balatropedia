/**
 * Formats Balatro joker/consumable text by:
 *  - Stripping the `#N#` numeric placeholders (we don't track per-joker values)
 *  - Colorizing common scoring tokens with the authentic Balatro palette:
 *      +N Mult / +Mult       → red    (var(--bal-mult))
 *      XN Mult / ×N Mult     → red    (var(--bal-mult))
 *      +N Chips / +Chips     → blue   (var(--bal-chip))
 *      $N / -$N              → gold   (var(--bal-money))
 *      N in N chance         → green  (var(--bal-green))
 *      "Joker"               → red
 *      "Tarot"               → purple
 *      "Spectral"            → cyan-ish (planet)
 *      "Planet"              → blue-ish
 *      Suits (Heart, Diamond, Spade, Club) → suit color
 */
import { Fragment, type ReactNode } from "react";

/** Strip "#N#" placeholders → empty (caller usually handles surrounding spaces). */
function stripPlaceholders(s: string): string {
  // Replace "#N#" with a generic glyph; we don't know the value.
  // Most strings already include a sign (+/-/X/$) right before #N#, so just drop the #...#.
  // Example: "+#1# Mult" → "+ Mult" → we then collapse extra spaces.
  return s.replace(/#\d+#/g, "").replace(/\s{2,}/g, " ").trim();
}

type Token = { type: "text" | "mult" | "chips" | "money" | "chance" | "tag"; text: string; tag?: string };

const COLORS: Record<Exclude<Token["type"], "text">, string> = {
  mult: "hsl(var(--bal-mult))",
  chips: "hsl(var(--bal-chip))",
  money: "hsl(var(--bal-money))",
  chance: "hsl(var(--bal-green))",
  tag: "hsl(var(--bal-purple))",
};

const TAG_COLORS: Record<string, string> = {
  Joker: "hsl(var(--bal-mult))",
  Tarot: "hsl(var(--bal-purple))",
  Spectral: "hsl(var(--bal-chip))",
  Planet: "hsl(var(--bal-chip))",
  Heart: "hsl(var(--bal-mult))",
  Hearts: "hsl(var(--bal-mult))",
  Diamond: "hsl(var(--bal-orange))",
  Diamonds: "hsl(var(--bal-orange))",
  Spade: "hsl(var(--bal-purple))",
  Spades: "hsl(var(--bal-purple))",
  Club: "hsl(var(--bal-pale-green))",
  Clubs: "hsl(var(--bal-pale-green))",
  Gold: "hsl(var(--bal-gold))",
  Steel: "hsl(var(--bal-joker-grey))",
  Glass: "hsl(var(--bal-chip))",
  Stone: "hsl(var(--bal-grey))",
};

/**
 * Tokenize the text into colored spans.
 * Strategy: run a series of ordered regexes; each match is captured as a colored token.
 * Anything in-between stays as plain text.
 */
export function tokenizeBalatroText(raw: string): Token[] {
  const text = stripPlaceholders(raw);
  if (!text) return [];

  // Patterns are tried in this order; first match wins for a given position.
  // We use a unified scan: collect all matches with their indices, sort by start,
  // resolve overlaps by keeping earliest then longest.
  const patterns: { re: RegExp; type: Token["type"]; getText?: (m: RegExpExecArray) => string; tag?: (m: RegExpExecArray) => string }[] = [
    // X N Mult or XN Mult  → red. Example: "X3 Mult", "X Mult" (after strip).
    { re: /\b[Xx]\s*\d*(?:\.\d+)?\s*Mult\b/g, type: "mult" },
    // ×N Mult
    { re: /×\s*\d*(?:\.\d+)?\s*Mult\b/g, type: "mult" },
    // +/- N Mult  → red
    { re: /[+\-]\s*\d*(?:\.\d+)?\s*Mult\b/g, type: "mult" },
    // bare "Mult" (e.g. "added to Mult") → red
    { re: /\bMult\b/g, type: "mult" },

    // +/- N Chips → blue
    { re: /[+\-]\s*\d*(?:\.\d+)?\s*Chips\b/g, type: "chips" },
    // bare "Chips" → blue
    { re: /\bChips\b/g, type: "chips" },

    // -$N or $N → gold
    { re: /-?\$\s*\d*(?:\.\d+)?/g, type: "money" },

    // "N in N chance"  → green
    { re: /\b\d*\s*in\s*\d*\s*chance\b/gi, type: "chance" },

    // Named tags: Joker / Tarot / Spectral / Planet / Hearts / Diamond etc.
    {
      re: /\b(Jokers?|Tarots?|Spectrals?|Planets?|Hearts?|Diamonds?|Spades?|Clubs?|Gold|Steel|Glass|Stone)\b/g,
      type: "tag",
      tag: (m) => {
        const w = m[1];
        // normalize plural
        const key = w.replace(/s$/, "");
        return key;
      },
    },
  ];

  type Match = { start: number; end: number; type: Token["type"]; text: string; tag?: string };
  const matches: Match[] = [];

  for (const p of patterns) {
    let m: RegExpExecArray | null;
    p.re.lastIndex = 0;
    while ((m = p.re.exec(text))) {
      const start = m.index;
      const end = m.index + m[0].length;
      matches.push({ start, end, type: p.type, text: m[0], tag: p.tag?.(m) });
      if (m.index === p.re.lastIndex) p.re.lastIndex++;
    }
  }

  // Resolve overlaps: sort by start ASC, then by length DESC (prefer longer match).
  matches.sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start));

  const picked: Match[] = [];
  let cursor = 0;
  for (const m of matches) {
    if (m.start < cursor) continue;
    picked.push(m);
    cursor = m.end;
  }

  // Build tokens by walking the string with picked matches.
  const tokens: Token[] = [];
  let i = 0;
  for (const m of picked) {
    if (m.start > i) {
      tokens.push({ type: "text", text: text.slice(i, m.start) });
    }
    tokens.push({ type: m.type, text: m.text, tag: m.tag });
    i = m.end;
  }
  if (i < text.length) {
    tokens.push({ type: "text", text: text.slice(i) });
  }

  return tokens;
}

/** Render a Balatro effect string into colored React nodes. */
export function FormattedBalatroText({ text, className }: { text: string; className?: string }) {
  const tokens = tokenizeBalatroText(text);
  if (!tokens.length) return null;
  return (
    <span className={className}>
      {tokens.map((tok, idx) => {
        if (tok.type === "text") {
          return <Fragment key={idx}>{tok.text}</Fragment>;
        }
        let color: string | undefined;
        if (tok.type === "tag" && tok.tag && TAG_COLORS[tok.tag]) {
          color = TAG_COLORS[tok.tag];
        } else if (tok.type !== "tag") {
          color = COLORS[tok.type];
        }
        return (
          <span
            key={idx}
            style={color ? { color, fontWeight: 600 } : undefined}
            data-bal-token={tok.type}
          >
            {tok.text}
          </span>
        );
      })}
    </span>
  );
}

/** Convenience: returns nodes only (no wrapping span). */
export function formattedBalatroNodes(text: string): ReactNode {
  return <FormattedBalatroText text={text} />;
}
