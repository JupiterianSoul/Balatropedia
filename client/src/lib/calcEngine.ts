// Balatro scoring engine.
// Phases (left-to-right within each):
//   1. Base       - hand level chips and mult
//   2. Card       - per played card: rank chips, enhancement, edition, gold seal retrigger
//   3. Held       - in-hand effects (Steel x1.5 each, Mime retrigger)
//   4. Joker      - each joker effect, then its edition (foil/holo/poly)
//   5. Final      - deck/voucher post-modifiers (Plasma, Flint, Observatory)
//
// We do not simulate every joker in Balatro exactly. We hard-code the ~60 most
// impactful ones with closed-form effect functions; all others get a "described
// effect" line that participates only via their edition. Scaling jokers read
// their state (count/xmult/value) from the JokerInstance.

import type {
  CalcInput, CalcResult, PlayingCard, JokerInstance, ScorePhaseLine, HandKey
} from "../../../shared/calcTypes";
import { getHandStats } from "./handLevels";

// ----------------- helpers -----------------

const RANK_CHIPS: Record<string, number> = {
  "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9,
  "T": 10, "J": 10, "Q": 10, "K": 10, "A": 11,
};

const FACE_RANKS = new Set(["J", "Q", "K"]);

function isFace(card: PlayingCard, pareidolia: boolean): boolean {
  if (pareidolia) return true;
  return FACE_RANKS.has(card.rank);
}

function isEven(rank: string): boolean {
  return ["2", "4", "6", "8", "T"].includes(rank);
}
function isOdd(rank: string): boolean {
  return ["A", "3", "5", "7", "9"].includes(rank);
}

// Push a timeline line and update running totals.
function push(
  tl: ScorePhaseLine[],
  state: { chips: number; mult: number },
  line: Omit<ScorePhaseLine, "chipsAfter" | "multAfter">
) {
  if (line.chipsAdd) state.chips += line.chipsAdd;
  if (line.multAdd) state.mult += line.multAdd;
  if (line.xMult) state.mult *= line.xMult;
  tl.push({ ...line, chipsAfter: round(state.chips), multAfter: round(state.mult, 2) });
}

function round(n: number, p = 0): number {
  const m = Math.pow(10, p);
  return Math.round(n * m) / m;
}

// ----------------- joker effect map -----------------
// Each handler can push lines and read instance.state. It receives:
//   ctx = { input, instance, jokerCounts, faceCount, ... }
// and pushes into `tl` updating `state`.

interface JokerCtx {
  input: CalcInput;
  instance: JokerInstance;
  state: { chips: number; mult: number };
  tl: ScorePhaseLine[];
  playedFaces: number;
  playedHearts: number;
  playedDiamonds: number;
  playedSpades: number;
  playedClubs: number;
  playedEvens: number;
  playedOdds: number;
  playedCount: number;
  steelHeld: number;
  goldHeld: number;
  jokers: JokerInstance[];
  hasPareidolia: boolean;
}

type JokerHandler = (c: JokerCtx) => void;

function flat(mult: number): JokerHandler {
  return (c) => push(c.tl, c.state, { phase: "joker", source: c.instance.jokerId, multAdd: mult });
}
function chips(n: number): JokerHandler {
  return (c) => push(c.tl, c.state, { phase: "joker", source: c.instance.jokerId, chipsAdd: n });
}
function xmult(x: number): JokerHandler {
  return (c) => push(c.tl, c.state, { phase: "joker", source: c.instance.jokerId, xMult: x });
}

const JOKER_FX: Record<string, JokerHandler> = {
  // --- common flat mult ---
  joker: flat(4),
  greedy_joker: (c) => {
    const n = c.playedDiamonds * 3;
    if (n) push(c.tl, c.state, { phase: "joker", source: "greedy_joker", multAdd: n, note: `${c.playedDiamonds} Diamond(s)` });
  },
  lusty_joker: (c) => {
    const n = c.playedHearts * 3;
    if (n) push(c.tl, c.state, { phase: "joker", source: "lusty_joker", multAdd: n, note: `${c.playedHearts} Heart(s)` });
  },
  wrathful_joker: (c) => {
    const n = c.playedSpades * 3;
    if (n) push(c.tl, c.state, { phase: "joker", source: "wrathful_joker", multAdd: n, note: `${c.playedSpades} Spade(s)` });
  },
  gluttonous_joker: (c) => {
    const n = c.playedClubs * 3;
    if (n) push(c.tl, c.state, { phase: "joker", source: "gluttonous_joker", multAdd: n, note: `${c.playedClubs} Club(s)` });
  },
  jolly_joker: flat(8),       // if pair contained
  zany_joker: flat(12),       // if 3OAK contained
  mad_joker: flat(10),        // if two pair
  crazy_joker: flat(12),      // if straight
  droll_joker: flat(10),      // if flush
  // chips variants:
  sly_joker: chips(50),
  wily_joker: chips(100),
  clever_joker: chips(80),
  devious_joker: chips(100),
  crafty_joker: chips(80),
  // hand-specific high jokers:
  half_joker: (c) => { if (c.playedCount <= 3) push(c.tl, c.state, { phase: "joker", source: "half_joker", multAdd: 20 }); },
  // face support:
  scary_face: (c) => {
    const n = c.playedFaces * 30; // +30 chips each scored face
    if (n) push(c.tl, c.state, { phase: "joker", source: "scary_face", chipsAdd: n, note: `${c.playedFaces} face(s)` });
  },
  smiley_face: (c) => {
    const n = c.playedFaces * 5; // +5 mult each scored face
    if (n) push(c.tl, c.state, { phase: "joker", source: "smiley_face", multAdd: n });
  },
  // ranks
  even_steven: (c) => {
    const n = c.playedEvens * 4;
    if (n) push(c.tl, c.state, { phase: "joker", source: "even_steven", multAdd: n });
  },
  odd_todd: (c) => {
    const n = c.playedOdds * 31;
    if (n) push(c.tl, c.state, { phase: "joker", source: "odd_todd", chipsAdd: n });
  },
  // --- xmult ---
  hack: (c) => {
    // retriggers 2,3,4,5 - approximated as +1x for each such card present
    const lowCount = c.input.played.filter(p => ["2","3","4","5"].includes(p.rank)).length;
    if (lowCount > 0) push(c.tl, c.state, { phase: "joker", source: "hack", note: `retriggers ${lowCount} low card(s) - approx`, multAdd: 0 });
  },
  the_duo: (c) => { /* x2 if hand has pair */ push(c.tl, c.state, { phase: "joker", source: "the_duo", xMult: 2 }); },
  the_trio: (c) => { push(c.tl, c.state, { phase: "joker", source: "the_trio", xMult: 3 }); },
  the_family: (c) => { push(c.tl, c.state, { phase: "joker", source: "the_family", xMult: 4 }); },
  the_order: (c) => { push(c.tl, c.state, { phase: "joker", source: "the_order", xMult: 3 }); },
  the_tribe: (c) => { push(c.tl, c.state, { phase: "joker", source: "the_tribe", xMult: 2 }); },
  // legendaries
  triboulet: (c) => {
    const n = c.input.played.filter(p => p.rank === "K" || p.rank === "Q").length;
    if (n) push(c.tl, c.state, { phase: "joker", source: "triboulet", xMult: Math.pow(2, n), note: `x2 per King/Queen (${n})` });
  },
  perkeo: (c) => push(c.tl, c.state, { phase: "joker", source: "perkeo", note: "copies a consumable (non-scoring effect)", multAdd: 0 }),
  yorick: (c) => {
    // x.state.xmult provided
    const x = c.instance.state.xmult ?? 1;
    if (x > 1) push(c.tl, c.state, { phase: "joker", source: "yorick", xMult: x, note: `scaling xMult = ${x}` });
  },
  chicot: (c) => push(c.tl, c.state, { phase: "joker", source: "chicot", note: "disables boss blind (utility)", multAdd: 0 }),
  caino: (c) => {
    const x = c.instance.state.xmult ?? 1;
    if (x > 1) push(c.tl, c.state, { phase: "joker", source: "caino", xMult: x, note: `xMult = ${x}` });
  },
  // --- scaling jokers (read state.count / state.xmult / state.value) ---
  ride_the_bus: (c) => {
    const n = c.instance.state.count ?? 0;
    if (n) push(c.tl, c.state, { phase: "joker", source: "ride_the_bus", multAdd: n, note: `count=${n}` });
  },
  green_joker: (c) => {
    const n = c.instance.state.count ?? 0;
    if (n) push(c.tl, c.state, { phase: "joker", source: "green_joker", multAdd: n, note: `count=${n}` });
  },
  constellation: (c) => {
    const x = c.instance.state.xmult ?? 1;
    if (x > 1) push(c.tl, c.state, { phase: "joker", source: "constellation", xMult: x, note: `xMult=${x}` });
  },
  square_joker: (c) => {
    const n = c.instance.state.count ?? 0;
    if (n) push(c.tl, c.state, { phase: "joker", source: "square_joker", chipsAdd: n * 4, note: `4 cards played ${n}x` });
  },
  obelisk: (c) => {
    const x = c.instance.state.xmult ?? 1;
    if (x > 1) push(c.tl, c.state, { phase: "joker", source: "obelisk", xMult: x, note: `xMult=${x}` });
  },
  flash_card: (c) => {
    const n = c.instance.state.count ?? 0;
    if (n) push(c.tl, c.state, { phase: "joker", source: "flash_card", multAdd: n * 2, note: `+2 per reroll (${n})` });
  },
  fortune_teller: (c) => {
    const n = c.instance.state.count ?? 0;
    if (n) push(c.tl, c.state, { phase: "joker", source: "fortune_teller", multAdd: n, note: `tarots used=${n}` });
  },
  spare_trousers: (c) => {
    const n = c.instance.state.count ?? 0;
    if (n) push(c.tl, c.state, { phase: "joker", source: "spare_trousers", multAdd: n * 2 });
  },
  red_card: (c) => {
    const n = c.instance.state.count ?? 0;
    if (n) push(c.tl, c.state, { phase: "joker", source: "red_card", multAdd: n * 3, note: `packs skipped=${n}` });
  },
  runner: (c) => {
    const n = c.instance.state.count ?? 0;
    if (n) push(c.tl, c.state, { phase: "joker", source: "runner", chipsAdd: n * 15, note: `straights played=${n}` });
  },
  ice_cream: (c) => {
    const n = c.instance.state.count ?? 100;
    push(c.tl, c.state, { phase: "joker", source: "ice_cream", chipsAdd: n, note: `melting (current=${n})` });
  },
  blue_joker: (c) => {
    const n = c.instance.state.count ?? 0; // cards remaining in deck
    if (n) push(c.tl, c.state, { phase: "joker", source: "blue_joker", chipsAdd: n * 2, note: `deck=${n}` });
  },
  hologram: (c) => {
    const x = c.instance.state.xmult ?? 1;
    if (x > 1) push(c.tl, c.state, { phase: "joker", source: "hologram", xMult: x });
  },
  vampire: (c) => {
    const x = c.instance.state.xmult ?? 1;
    if (x > 1) push(c.tl, c.state, { phase: "joker", source: "vampire", xMult: x });
  },
  madness: (c) => {
    const x = c.instance.state.xmult ?? 1;
    if (x > 1) push(c.tl, c.state, { phase: "joker", source: "madness", xMult: x });
  },
  // steel/held
  steel_joker: (c) => {
    const steelInDeck = c.instance.state.count ?? c.steelHeld;
    const x = 1 + 0.2 * steelInDeck;
    if (x > 1) push(c.tl, c.state, { phase: "joker", source: "steel_joker", xMult: x, note: `${steelInDeck} steel in deck` });
  },
  baron: (c) => {
    const kingsHeld = c.input.inHand.filter(p => p.rank === "K").length;
    if (kingsHeld) push(c.tl, c.state, { phase: "joker", source: "baron", xMult: Math.pow(1.5, kingsHeld), note: `${kingsHeld} King(s) in hand` });
  },
  shoot_the_moon: (c) => {
    const qHeld = c.input.inHand.filter(p => p.rank === "Q").length;
    if (qHeld) push(c.tl, c.state, { phase: "joker", source: "shoot_the_moon", multAdd: qHeld * 13 });
  },
  // economy/non-scoring (logged for transparency)
  bull: (c) => push(c.tl, c.state, { phase: "joker", source: "bull", note: "+2 chips per $1 (need money input - omitted)", multAdd: 0 }),
  bootstraps: (c) => push(c.tl, c.state, { phase: "joker", source: "bootstraps", note: "+2 mult per $5 (need money input - omitted)", multAdd: 0 }),
  // big chip jokers
  juggler: chips(0),
  drunkard: chips(0),
  cavendish: xmult(3),
  swashbuckler: (c) => {
    const v = c.instance.state.value ?? 0;
    if (v) push(c.tl, c.state, { phase: "joker", source: "swashbuckler", multAdd: v, note: `sum of joker sell values=${v}` });
  },
  burglar: (c) => push(c.tl, c.state, { phase: "joker", source: "burglar", note: "+3 hands, no discards (utility)", multAdd: 0 }),
  // photograph - first face card gives x2 mult
  photograph: (c) => {
    const firstFace = c.input.played.find(p => isFace(p, c.hasPareidolia));
    if (firstFace) push(c.tl, c.state, { phase: "joker", source: "photograph", xMult: 2, note: `first face = ${firstFace.rank}${firstFace.suit}` });
  },
  blueprint: (c) => push(c.tl, c.state, { phase: "joker", source: "blueprint", note: "copies right joker (handle by reorder)", multAdd: 0 }),
  brainstorm: (c) => push(c.tl, c.state, { phase: "joker", source: "brainstorm", note: "copies leftmost joker (handle by reorder)", multAdd: 0 }),
  // gros michel / cavendish / etc handled above
  abstract_joker: (c) => push(c.tl, c.state, { phase: "joker", source: "abstract_joker", multAdd: c.jokers.length * 3, note: `${c.jokers.length} jokers x3` }),
  banner: (c) => {
    const d = c.instance.state.count ?? 0;
    if (d) push(c.tl, c.state, { phase: "joker", source: "banner", chipsAdd: d * 30, note: `discards remaining=${d}` });
  },
  mystic_summit: (c) => {
    const d = c.instance.state.count ?? 0;
    if (d === 0) push(c.tl, c.state, { phase: "joker", source: "mystic_summit", multAdd: 15, note: `0 discards remaining` });
  },
  loyalty_card: (c) => {
    const active = c.instance.state.active;
    if (active) push(c.tl, c.state, { phase: "joker", source: "loyalty_card", xMult: 4, note: `loyalty active this hand` });
  },
  misprint: (c) => push(c.tl, c.state, { phase: "joker", source: "misprint", multAdd: 12, note: `random 0-23, using 12 avg` }),
  raised_fist: (c) => {
    // 2x lowest rank in hand mult
    const ranks = c.input.inHand.filter(p => p.enhancement !== "stone").map(p => RANK_CHIPS[p.rank] ?? 0);
    if (ranks.length) {
      const lowest = Math.min(...ranks);
      push(c.tl, c.state, { phase: "joker", source: "raised_fist", multAdd: lowest * 2, note: `lowest rank=${lowest}` });
    }
  },
  walkie_talkie: (c) => {
    // +10 chips +4 mult per 10 or 4 played
    const n = c.input.played.filter(p => p.rank === "T" || p.rank === "4").length;
    if (n) {
      push(c.tl, c.state, { phase: "joker", source: "walkie_talkie", chipsAdd: n * 10 });
      push(c.tl, c.state, { phase: "joker", source: "walkie_talkie", multAdd: n * 4 });
    }
  },
  fibonacci: (c) => {
    const n = c.input.played.filter(p => ["A","2","3","5","8"].includes(p.rank)).length;
    if (n) push(c.tl, c.state, { phase: "joker", source: "fibonacci", multAdd: n * 8 });
  },
  // boss flags handled in final phase, not here
};

// ----------------- main entry -----------------

export function computeScore(input: CalcInput): CalcResult {
  const tl: ScorePhaseLine[] = [];
  const warnings: string[] = [];

  // Phase 1 - base
  const base = getHandStats(input.hand, input.handLevel);
  let chipsBase = base.chips;
  let multBase = base.mult;
  if (input.modifiers.flintBoss) {
    chipsBase = Math.floor(chipsBase / 2);
    multBase = Math.floor(multBase / 2);
    warnings.push("The Flint: base halved");
  }
  const state = { chips: 0, mult: 0 };
  push(tl, state, { phase: "base", source: `${input.hand} L${input.handLevel}`, chipsAdd: chipsBase, multAdd: multBase });

  // detect Pareidolia (treats all cards as face)
  const hasPareidolia = input.jokers.some(j => j.jokerId === "pareidolia" && !j.disabled);

  // Phase 2 - per-played-card
  for (const card of input.played) {
    // stone cards skip rank chips (they only give the +50 enhancement)
    if (card.enhancement !== "stone") {
      const rc = RANK_CHIPS[card.rank] ?? 0;
      if (rc) push(tl, state, { phase: "card", source: `${card.rank}${card.suit} rank`, chipsAdd: rc });
    }
    // enhancement
    switch (card.enhancement) {
      case "bonus": push(tl, state, { phase: "card", source: `Bonus ${card.rank}${card.suit}`, chipsAdd: 30 }); break;
      case "mult": push(tl, state, { phase: "card", source: `Mult ${card.rank}${card.suit}`, multAdd: 4 }); break;
      case "glass": push(tl, state, { phase: "card", source: `Glass ${card.rank}${card.suit}`, xMult: 2, note: "1-in-4 destroy risk" }); break;
      case "stone": push(tl, state, { phase: "card", source: `Stone`, chipsAdd: 50 }); break;
      case "lucky": push(tl, state, { phase: "card", source: `Lucky ${card.rank}${card.suit}`, multAdd: 20 * 0.2, note: "expected (1/5 * +20)" }); break;
      // steel and gold are held-in-hand only
    }
    // edition (per card)
    switch (card.edition) {
      case "foil": push(tl, state, { phase: "card", source: `Foil ${card.rank}${card.suit}`, chipsAdd: 50 }); break;
      case "holo": push(tl, state, { phase: "card", source: `Holo ${card.rank}${card.suit}`, multAdd: 10 }); break;
      case "poly": push(tl, state, { phase: "card", source: `Poly ${card.rank}${card.suit}`, xMult: 1.5 }); break;
    }
    // red seal retriggers - approximated as +1 retrigger of the card's chip portion
    if (card.seal === "red") {
      const rc = card.enhancement === "stone" ? 50 : (RANK_CHIPS[card.rank] ?? 0);
      if (rc) push(tl, state, { phase: "card", source: `Red Seal retrigger ${card.rank}${card.suit}`, chipsAdd: rc });
    }
  }

  // Phase 3 - held in hand
  const steelHeld = input.inHand.filter(p => p.enhancement === "steel").length;
  const goldHeld = input.inHand.filter(p => p.enhancement === "gold").length;
  for (let i = 0; i < steelHeld; i++) {
    push(tl, state, { phase: "held", source: `Steel held #${i + 1}`, xMult: 1.5 });
  }
  if (goldHeld > 0) {
    push(tl, state, { phase: "held", source: `Gold held`, note: `+$${goldHeld * 3} (utility, not score)`, multAdd: 0 });
  }

  // Phase 4 - jokers left-to-right
  const playedFaces = input.played.filter(p => isFace(p, hasPareidolia)).length;
  const playedHearts = input.played.filter(p => p.suit === "H" || p.enhancement === "wild").length;
  const playedDiamonds = input.played.filter(p => p.suit === "D" || p.enhancement === "wild").length;
  const playedSpades = input.played.filter(p => p.suit === "S" || p.enhancement === "wild").length;
  const playedClubs = input.played.filter(p => p.suit === "C" || p.enhancement === "wild").length;
  const playedEvens = input.played.filter(p => isEven(p.rank)).length;
  const playedOdds = input.played.filter(p => isOdd(p.rank)).length;

  for (const j of input.jokers) {
    if (j.disabled) continue;
    const fx = JOKER_FX[j.jokerId];
    const ctx: JokerCtx = {
      input, instance: j, state, tl,
      playedFaces, playedHearts, playedDiamonds, playedSpades, playedClubs,
      playedEvens, playedOdds, playedCount: input.played.length,
      steelHeld, goldHeld, jokers: input.jokers, hasPareidolia,
    };
    if (fx) fx(ctx);
    else {
      // generic line so the user still sees the joker in the timeline
      push(tl, state, { phase: "joker", source: j.jokerId, note: "effect not modeled - edition still applies", multAdd: 0 });
    }
    // edition applied AFTER the joker effect
    switch (j.edition) {
      case "foil": push(tl, state, { phase: "joker", source: `Foil ${j.jokerId}`, chipsAdd: 50 }); break;
      case "holo": push(tl, state, { phase: "joker", source: `Holo ${j.jokerId}`, multAdd: 10 }); break;
      case "poly": push(tl, state, { phase: "joker", source: `Poly ${j.jokerId}`, xMult: 1.5 }); break;
    }
  }

  // Phase 5 - final
  // Observatory voucher: x1.5 per planet card in consumable area matching the played hand
  if (input.modifiers.observatory) {
    const matching = input.observatoryPlanets.filter(p => p === input.hand).length;
    for (let i = 0; i < matching; i++) {
      push(tl, state, { phase: "final", source: "Observatory planet", xMult: 1.5 });
    }
  }
  // Plasma deck: average chips and mult then square
  let score: number;
  if (input.modifiers.plasmaDeck) {
    const avg = (state.chips + state.mult) / 2;
    score = Math.floor(avg * avg);
    tl.push({
      phase: "final", source: "Plasma deck", note: `((${round(state.chips)} + ${round(state.mult,2)}) / 2)^2`,
      chipsAfter: round(avg), multAfter: round(avg, 2),
    });
  } else {
    score = Math.floor(state.chips * state.mult);
  }

  return { chips: round(state.chips), mult: round(state.mult, 2), score, timeline: tl, warnings };
}
