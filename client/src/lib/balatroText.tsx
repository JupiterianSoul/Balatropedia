import { Fragment, type ReactNode } from "react";
import JOKER_VALUES from "@/data/joker_values.json";

const VALUES: Record<string, string[]> = JOKER_VALUES as Record<string, string[]>;

type TokenLang = "en" | "fr" | "es";
const NAMED_TOKENS: Record<TokenLang, Record<string, string>> = {
  en: {},
  fr: {
    "Pair": "Paire",
    "Three of a Kind": "Brelan",
    "Four of a Kind": "Carr\u00e9",
    "Two Pair": "Double Paire",
    "Straight": "Suite",
    "Flush": "Couleur",
    "Straight Flush": "Quinte Flush",
    "Diamond": "Carreau",
    "Diamonds": "Carreaux",
    "Heart": "C\u0153ur",
    "Hearts": "C\u0153urs",
    "Spade": "Pique",
    "Spades": "Piques",
    "Club": "Tr\u00e8fle",
    "Clubs": "Tr\u00e8fles",
    "Double Tag": "Double Tag",
    "[suit]": "[couleur]",
    "[hand]": "[main]",
    "[rank]": "[rang]",
    "[deck size]": "[taille de paquet]",
  },
  es: {
    "Pair": "Pareja",
    "Three of a Kind": "Trio",
    "Four of a Kind": "Poker",
    "Two Pair": "Doble Pareja",
    "Straight": "Escalera",
    "Flush": "Color",
    "Straight Flush": "Escalera de Color",
    "Diamond": "Diamante",
    "Diamonds": "Diamantes",
    "Heart": "Coraz\u00f3n",
    "Hearts": "Corazones",
    "Spade": "Pica",
    "Spades": "Picas",
    "Club": "Tr\u00e9bol",
    "Clubs": "Tr\u00e9boles",
    "Double Tag": "Etiqueta Doble",
    "[suit]": "[palo]",
    "[hand]": "[mano]",
    "[rank]": "[rango]",
    "[deck size]": "[tama\u00f1o de mazo]",
  },
};

function substitutePlaceholders(s: string, id?: string, lang?: TokenLang): string {
  const vals = id ? VALUES[id] : undefined;
  const tokenMap = lang ? NAMED_TOKENS[lang] : undefined;
  let out = s.replace(/#(\d+)#/g, (_, idx) => {
    if (!vals) return "";
    const i = parseInt(idx, 10) - 1;
    if (i < 0 || i >= vals.length) return "";
    const raw = vals[i];
    if (tokenMap && tokenMap[raw]) return tokenMap[raw];
    return raw;
  });

  out = out.replace(/\s{2,}/g, " ").trim();

  out = out.replace(/\$ /g, "$");
  return out;
}

type Token = { type: "text" | "mult" | "chips" | "money" | "chance" | "tag" | "reroll" | "hand"; text: string; tag?: string };

const COLORS: Record<Exclude<Token["type"], "text">, string> = {
  // Julie's semantic-color spec:
  //   $ = gold, +/X Mult = red, Chips = blue, Reroll = green, hand types = yellow.
  // bal-money is the same warm gold the game uses for $ values.
  mult: "hsl(var(--bal-mult))",
  chips: "hsl(var(--bal-chip))",
  money: "hsl(var(--bal-gold))",
  chance: "hsl(var(--bal-green))",
  reroll: "hsl(var(--bal-green))",
  hand: "hsl(var(--bal-gold))",
  tag: "hsl(var(--bal-purple))",
};

// Localized hand-type strings. We treat ALL of these as yellow.
const HAND_TYPE_PATTERNS: RegExp[] = [
  /\bFlush Five\b/g,
  /\bFlush House\b/g,
  /\bFive of a Kind\b/g,
  /\bRoyal Flush\b/g,
  /\bStraight Flush\b/g,
  /\bFour of a Kind\b/g,
  /\bFull House\b/g,
  /\bThree of a Kind\b/g,
  /\bTwo Pair\b/g,
  /\bHigh Card\b/g,
  /\bStraight\b/g,
  /\bFlush\b/g,
  /\bPair\b/g,
  // French equivalents from NAMED_TOKENS above.
  /\bQuinte Flush Royale\b/gi,
  /\bQuinte Flush\b/gi,
  /\bCarr\u00e9\b/g,
  /\bDouble Paire\b/gi,
  /\bBrelan\b/gi,
  /\bPaire\b/gi,
  /\bCouleur\b/gi,
  /\bSuite\b/gi,
  /\bCarte Haute\b/gi,
  // Spanish equivalents.
  /\bEscalera de Color Real\b/gi,
  /\bEscalera de Color\b/gi,
  /\bDoble Pareja\b/gi,
  /\bPareja\b/gi,
  /\bTrio\b/gi,
  /\bP\u00f3ker\b/gi,
  /\bColor\b/g,
  /\bEscalera\b/gi,
  /\bCarta Alta\b/gi,
];

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

export function tokenizeBalatroText(raw: string, id?: string, lang?: TokenLang): Token[] {
  const text = substitutePlaceholders(raw, id, lang);
  if (!text) return [];

  const patterns: { re: RegExp; type: Token["type"]; getText?: (m: RegExpExecArray) => string; tag?: (m: RegExpExecArray) => string }[] = [

    { re: /\b[Xx]\s*\d*(?:\.\d+)?\s*Mult\b/g, type: "mult" },

    { re: /×\s*\d*(?:\.\d+)?\s*Mult\b/g, type: "mult" },

    { re: /[+\-]\s*\d*(?:\.\d+)?\s*Mult\b/g, type: "mult" },

    { re: /\bMult\b/g, type: "mult" },

    { re: /[+\-]\s*\d*(?:\.\d+)?\s*Chips\b/g, type: "chips" },

    { re: /\bChips\b/g, type: "chips" },

    { re: /-?\$\s*\d*(?:\.\d+)?/g, type: "money" },

    { re: /\b\d*\s*in\s*\d*\s*chance\b/gi, type: "chance" },

    // Reroll / re-roll, plus FR "relance(r)" and ES "relanzar/reroll" — Julie's spec: green.
    { re: /\b(?:re-?rolls?|rerolling|relances?|relancer|relanzar|reanudar)\b/gi, type: "reroll" },

    ...HAND_TYPE_PATTERNS.map((re) => ({ re, type: "hand" as const })),

    {
      re: /\b(Jokers?|Tarots?|Spectrals?|Planets?|Hearts?|Diamonds?|Spades?|Clubs?|Gold|Steel|Glass|Stone)\b/g,
      type: "tag",
      tag: (m) => {
        const w = m[1];

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

  matches.sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start));

  const picked: Match[] = [];
  let cursor = 0;
  for (const m of matches) {
    if (m.start < cursor) continue;
    picked.push(m);
    cursor = m.end;
  }

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

export function FormattedBalatroText({
  text,
  className,
  id,
  lang,
}: {
  text: string;
  className?: string;

  id?: string;

  lang?: TokenLang;
}) {
  const tokens = tokenizeBalatroText(text, id, lang);
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

export function formattedBalatroNodes(text: string, id?: string, lang?: TokenLang): ReactNode {
  return <FormattedBalatroText text={text} id={id} lang={lang} />;
}

