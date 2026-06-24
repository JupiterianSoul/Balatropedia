
import type {
  CalcInput, CalcResult, PlayingCard, JokerInstance, ScorePhaseLine, HandKey, Rank, Suit,
} from "../../../shared/calcTypes";
import { getHandStats } from "./handLevels";

const RANK_CHIPS: Record<Rank, number> = {
  "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9,
  "T": 10, "J": 10, "Q": 10, "K": 10, "A": 11,
};

const FACE_RANKS = new Set<Rank>(["J", "Q", "K"]);

function isFace(card: PlayingCard, pareidolia: boolean): boolean {
  if (pareidolia) return true;
  return FACE_RANKS.has(card.rank);
}

function isEven(rank: Rank): boolean {
  return rank === "2" || rank === "4" || rank === "6" || rank === "8" || rank === "T";
}
function isOdd(rank: Rank): boolean {
  return rank === "A" || rank === "3" || rank === "5" || rank === "7" || rank === "9";
}

function suitOf(card: PlayingCard, wantedSuit: Suit): boolean {
  if (card.enhancement === "wild") return true;
  if (card.enhancement === "stone") return false;
  return card.suit === wantedSuit;
}

function round(n: number, p = 0): number {
  const m = Math.pow(10, p);
  return Math.round(n * m) / m;
}

function push(
  tl: ScorePhaseLine[],
  st: { chips: number; mult: number },
  line: Omit<ScorePhaseLine, "chipsAfter" | "multAfter">
) {
  if (line.chipsAdd) st.chips += line.chipsAdd;
  if (line.multAdd) st.mult += line.multAdd;
  if (line.xMult) st.mult *= line.xMult;
  tl.push({ ...line, chipsAfter: round(st.chips), multAfter: round(st.mult, 2) });
}

function scoreOneCard(
  card: PlayingCard,
  tl: ScorePhaseLine[],
  st: { chips: number; mult: number },
  ctx: CardCtx,
  triggerLabel: string,
) {
  const label = `${card.rank}${card.suit}`;
  if (card.enhancement !== "stone") {
    const rc = RANK_CHIPS[card.rank];
    if (rc) push(tl, st, { phase: "card", source: `${triggerLabel} ${label} rank`, chipsAdd: rc });
  }
  switch (card.enhancement) {
    case "bonus": push(tl, st, { phase: "card", source: `${triggerLabel} Bonus ${label}`, chipsAdd: 30 }); break;
    case "mult":  push(tl, st, { phase: "card", source: `${triggerLabel} Mult ${label}`, multAdd: 4 }); break;
    case "glass": push(tl, st, { phase: "card", source: `${triggerLabel} Glass ${label}`, xMult: 2, note: "1-in-4 destroy risk" }); break;
    case "stone": push(tl, st, { phase: "card", source: `${triggerLabel} Stone ${label}`, chipsAdd: 50 }); break;
    case "lucky": push(tl, st, { phase: "card", source: `${triggerLabel} Lucky ${label}`, multAdd: 4, note: "expected (1/5 * +20 mult)" }); break;
  }
  switch (card.edition) {
    case "foil": push(tl, st, { phase: "card", source: `${triggerLabel} Foil ${label}`, chipsAdd: 50 }); break;
    case "holo": push(tl, st, { phase: "card", source: `${triggerLabel} Holo ${label}`, multAdd: 10 }); break;
    case "poly": push(tl, st, { phase: "card", source: `${triggerLabel} Poly ${label}`, xMult: 1.5 }); break;
  }
  for (const j of ctx.jokers) {
    if (j.disabled) continue;
    const fn = PER_CARD_FX[j.jokerId];
    if (fn) fn(card, j, tl, st, ctx, triggerLabel);
  }
  if (card.seal === "gold") {
    push(tl, st, { phase: "card", source: `${triggerLabel} Gold Seal ${label}`, note: "+$3 (utility)", multAdd: 0 });
  }
}

interface CardCtx {
  input: CalcInput;
  jokers: JokerInstance[];
  pareidolia: boolean;
}

type PerCardFx = (
  card: PlayingCard,
  j: JokerInstance,
  tl: ScorePhaseLine[],
  st: { chips: number; mult: number },
  ctx: CardCtx,
  label: string,
) => void;

const PER_CARD_FX: Record<string, PerCardFx> = {
  fibonacci: (c, _j, tl, st, _ctx, lbl) => {
    if (["A", "2", "3", "5", "8"].includes(c.rank)) {
      push(tl, st, { phase: "card", source: `${lbl} Fibonacci on ${c.rank}${c.suit}`, multAdd: 8 });
    }
  },
  scary_face: (c, _j, tl, st, ctx, lbl) => {
    if (isFace(c, ctx.pareidolia)) push(tl, st, { phase: "card", source: `${lbl} Scary Face on ${c.rank}${c.suit}`, chipsAdd: 30 });
  },
  smiley_face: (c, _j, tl, st, ctx, lbl) => {
    if (isFace(c, ctx.pareidolia)) push(tl, st, { phase: "card", source: `${lbl} Smiley Face on ${c.rank}${c.suit}`, multAdd: 5 });
  },
  greedy_joker: (c, _j, tl, st, _ctx, lbl) => {
    if (suitOf(c, "D")) push(tl, st, { phase: "card", source: `${lbl} Greedy on ${c.rank}${c.suit}`, multAdd: 3 });
  },
  lusty_joker: (c, _j, tl, st, _ctx, lbl) => {
    if (suitOf(c, "H")) push(tl, st, { phase: "card", source: `${lbl} Lusty on ${c.rank}${c.suit}`, multAdd: 3 });
  },
  wrathful_joker: (c, _j, tl, st, _ctx, lbl) => {
    if (suitOf(c, "S")) push(tl, st, { phase: "card", source: `${lbl} Wrathful on ${c.rank}${c.suit}`, multAdd: 3 });
  },
  gluttonous_joker: (c, _j, tl, st, _ctx, lbl) => {
    if (suitOf(c, "C")) push(tl, st, { phase: "card", source: `${lbl} Gluttonous on ${c.rank}${c.suit}`, multAdd: 3 });
  },
  even_steven: (c, _j, tl, st, _ctx, lbl) => {
    if (isEven(c.rank)) push(tl, st, { phase: "card", source: `${lbl} Even Steven on ${c.rank}${c.suit}`, multAdd: 4 });
  },
  odd_todd: (c, _j, tl, st, _ctx, lbl) => {
    if (isOdd(c.rank)) push(tl, st, { phase: "card", source: `${lbl} Odd Todd on ${c.rank}${c.suit}`, chipsAdd: 31 });
  },
  walkie_talkie: (c, _j, tl, st, _ctx, lbl) => {
    if (c.rank === "T" || c.rank === "4") {
      push(tl, st, { phase: "card", source: `${lbl} Walkie Talkie on ${c.rank}${c.suit}`, chipsAdd: 10 });
      push(tl, st, { phase: "card", source: `${lbl} Walkie Talkie on ${c.rank}${c.suit}`, multAdd: 4 });
    }
  },
  hiker: (c, _j, tl, st, _ctx, lbl) => {
    push(tl, st, { phase: "card", source: `${lbl} Hiker stamp on ${c.rank}${c.suit}`, chipsAdd: 5, note: "permanent +5 chip mark" });
  },
  business_card: (c, _j, tl, st, ctx, lbl) => {
    if (isFace(c, ctx.pareidolia)) push(tl, st, { phase: "card", source: `${lbl} Business Card on ${c.rank}${c.suit}`, note: "1/2 chance of $2", multAdd: 0 });
  },
  triboulet: (c, _j, tl, st, _ctx, lbl) => {
    if (c.rank === "K" || c.rank === "Q") push(tl, st, { phase: "card", source: `${lbl} Triboulet on ${c.rank}${c.suit}`, xMult: 2 });
  },
  photograph: (c, _j, tl, st, ctx, lbl) => {
    const marker = "__photo_fired__";
    if (!(j_marker as any)[marker] && isFace(c, ctx.pareidolia)) {
      (j_marker as any)[marker] = true;
      push(tl, st, { phase: "card", source: `${lbl} Photograph on ${c.rank}${c.suit}`, xMult: 2, note: "first face card" });
    }
  },
};

const j_marker = {} as { __photo_fired__?: boolean };

interface JokerCtx {
  input: CalcInput;
  instance: JokerInstance;
  state: { chips: number; mult: number };
  tl: ScorePhaseLine[];
  jokers: JokerInstance[];
  pareidolia: boolean;
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
  unscoredCount: number;
}

type JokerHandler = (c: JokerCtx) => void;

function flatMult(n: number, src: string): JokerHandler {
  return (c) => push(c.tl, c.state, { phase: "joker", source: src, multAdd: n });
}
function flatChips(n: number, src: string): JokerHandler {
  return (c) => push(c.tl, c.state, { phase: "joker", source: src, chipsAdd: n });
}
function xMult(n: number, src: string): JokerHandler {
  return (c) => push(c.tl, c.state, { phase: "joker", source: src, xMult: n });
}

function handContainsPair(input: CalcInput): boolean {
  return ["pair","two_pair","three_of_a_kind","four_of_a_kind","five_of_a_kind","full_house","flush_house","flush_five"].includes(input.hand);
}
function handContainsThreeOAK(input: CalcInput): boolean {
  return ["three_of_a_kind","four_of_a_kind","five_of_a_kind","full_house","flush_house","flush_five"].includes(input.hand);
}
function handContainsFourOAK(input: CalcInput): boolean {
  return ["four_of_a_kind","five_of_a_kind","flush_five"].includes(input.hand);
}
function handContainsTwoPair(input: CalcInput): boolean {
  return ["two_pair","full_house","flush_house"].includes(input.hand);
}
function handContainsStraight(input: CalcInput): boolean {
  return ["straight","straight_flush","royal_flush"].includes(input.hand);
}
function handContainsFlush(input: CalcInput): boolean {
  return ["flush","straight_flush","royal_flush","flush_house","flush_five"].includes(input.hand);
}
function handContainsFullHouse(input: CalcInput): boolean {
  return ["full_house","flush_house"].includes(input.hand);
}

const JOKER_FX: Record<string, JokerHandler> = {
  joker: flatMult(4, "Joker"),
  jolly_joker: (c) => { if (handContainsPair(c.input)) push(c.tl, c.state, { phase: "joker", source: "Jolly Joker", multAdd: 8 }); },
  zany_joker: (c) => { if (handContainsThreeOAK(c.input)) push(c.tl, c.state, { phase: "joker", source: "Zany Joker", multAdd: 12 }); },
  mad_joker: (c) => { if (handContainsTwoPair(c.input)) push(c.tl, c.state, { phase: "joker", source: "Mad Joker", multAdd: 10 }); },
  crazy_joker: (c) => { if (handContainsStraight(c.input)) push(c.tl, c.state, { phase: "joker", source: "Crazy Joker", multAdd: 12 }); },
  droll_joker: (c) => { if (handContainsFlush(c.input)) push(c.tl, c.state, { phase: "joker", source: "Droll Joker", multAdd: 10 }); },
  sly_joker: (c) => { if (handContainsPair(c.input)) push(c.tl, c.state, { phase: "joker", source: "Sly Joker", chipsAdd: 50 }); },
  wily_joker: (c) => { if (handContainsThreeOAK(c.input)) push(c.tl, c.state, { phase: "joker", source: "Wily Joker", chipsAdd: 100 }); },
  clever_joker: (c) => { if (handContainsTwoPair(c.input)) push(c.tl, c.state, { phase: "joker", source: "Clever Joker", chipsAdd: 80 }); },
  devious_joker: (c) => { if (handContainsStraight(c.input)) push(c.tl, c.state, { phase: "joker", source: "Devious Joker", chipsAdd: 100 }); },
  crafty_joker: (c) => { if (handContainsFlush(c.input)) push(c.tl, c.state, { phase: "joker", source: "Crafty Joker", chipsAdd: 80 }); },
  half_joker: (c) => { if (c.playedCount <= 3) push(c.tl, c.state, { phase: "joker", source: "Half Joker", multAdd: 20 }); },
  banner: (c) => {
    const d = c.instance.state.count ?? 0;
    if (d > 0) push(c.tl, c.state, { phase: "joker", source: "Banner", chipsAdd: d * 30, note: `${d} discards remaining` });
  },
  mystic_summit: (c) => {
    const d = c.instance.state.count ?? 0;
    if (d === 0) push(c.tl, c.state, { phase: "joker", source: "Mystic Summit", multAdd: 15, note: "0 discards remaining" });
  },
  loyalty_card: (c) => {
    if (c.instance.state.active) push(c.tl, c.state, { phase: "joker", source: "Loyalty Card", xMult: 4 });
  },
  misprint: (c) => push(c.tl, c.state, { phase: "joker", source: "Misprint", multAdd: 12, note: "expected (0-23 random, avg 11.5)" }),
  yorick: (c) => {
    const x = c.instance.state.xmult ?? 1;
    if (x > 1) push(c.tl, c.state, { phase: "joker", source: "Yorick", xMult: x, note: `xMult = ${x}` });
  },
  caino: (c) => {
    const x = c.instance.state.xmult ?? 1;
    if (x > 1) push(c.tl, c.state, { phase: "joker", source: "Caino", xMult: x, note: `xMult = ${x}` });
  },
  chicot: (c) => push(c.tl, c.state, { phase: "joker", source: "Chicot", note: "disables boss blind (utility)", multAdd: 0 }),
  perkeo: (c) => push(c.tl, c.state, { phase: "joker", source: "Perkeo", note: "copies a consumable (utility)", multAdd: 0 }),
  the_duo: (c) => { if (handContainsPair(c.input)) push(c.tl, c.state, { phase: "joker", source: "The Duo", xMult: 2 }); },
  the_trio: (c) => { if (handContainsThreeOAK(c.input)) push(c.tl, c.state, { phase: "joker", source: "The Trio", xMult: 3 }); },
  the_family: (c) => { if (handContainsFourOAK(c.input)) push(c.tl, c.state, { phase: "joker", source: "The Family", xMult: 4 }); },
  the_order: (c) => { if (handContainsStraight(c.input)) push(c.tl, c.state, { phase: "joker", source: "The Order", xMult: 3 }); },
  the_tribe: (c) => { if (handContainsFlush(c.input)) push(c.tl, c.state, { phase: "joker", source: "The Tribe", xMult: 2 }); },
  the_duo_2: (c) => { if (handContainsFullHouse(c.input)) push(c.tl, c.state, { phase: "joker", source: "The Duo (full house)", xMult: 2 }); },
  ride_the_bus: (c) => {
    const n = c.instance.state.count ?? 0;
    if (n) push(c.tl, c.state, { phase: "joker", source: "Ride the Bus", multAdd: n, note: `count = ${n}` });
  },
  green_joker: (c) => {
    const n = c.instance.state.count ?? 0;
    if (n) push(c.tl, c.state, { phase: "joker", source: "Green Joker", multAdd: n, note: `count = ${n}` });
  },
  constellation: (c) => {
    const x = c.instance.state.xmult ?? 1;
    if (x > 1) push(c.tl, c.state, { phase: "joker", source: "Constellation", xMult: x, note: `xMult = ${x}` });
  },
  square_joker: (c) => {
    const n = c.instance.state.count ?? 0;
    if (n) push(c.tl, c.state, { phase: "joker", source: "Square Joker", chipsAdd: n * 4, note: `${n} stamps of +4 chips` });
  },
  obelisk: (c) => {
    const x = c.instance.state.xmult ?? 1;
    if (x > 1) push(c.tl, c.state, { phase: "joker", source: "Obelisk", xMult: x, note: `xMult = ${x}` });
  },
  flash_card: (c) => {
    const n = c.instance.state.count ?? 0;
    if (n) push(c.tl, c.state, { phase: "joker", source: "Flash Card", multAdd: n * 2, note: `${n} rerolls` });
  },
  fortune_teller: (c) => {
    const n = c.instance.state.count ?? 0;
    if (n) push(c.tl, c.state, { phase: "joker", source: "Fortune Teller", multAdd: n, note: `${n} tarots used` });
  },
  spare_trousers: (c) => {
    const n = c.instance.state.count ?? 0;
    if (n) push(c.tl, c.state, { phase: "joker", source: "Spare Trousers", multAdd: n * 2, note: `${n} two-pair hands` });
  },
  red_card: (c) => {
    const n = c.instance.state.count ?? 0;
    if (n) push(c.tl, c.state, { phase: "joker", source: "Red Card", multAdd: n * 3, note: `${n} packs skipped` });
  },
  runner: (c) => {
    const n = c.instance.state.count ?? 0;
    if (n) push(c.tl, c.state, { phase: "joker", source: "Runner", chipsAdd: n, note: `${n} permanent chips` });
  },
  ice_cream: (c) => {
    const n = c.instance.state.count ?? 100;
    push(c.tl, c.state, { phase: "joker", source: "Ice Cream", chipsAdd: n, note: `melting (current ${n})` });
  },
  blue_joker: (c) => {
    const n = c.instance.state.count ?? 0;
    if (n) push(c.tl, c.state, { phase: "joker", source: "Blue Joker", chipsAdd: n * 2, note: `${n} cards remaining in deck` });
  },
  hologram: (c) => {
    const x = c.instance.state.xmult ?? 1;
    if (x > 1) push(c.tl, c.state, { phase: "joker", source: "Hologram", xMult: x });
  },
  vampire: (c) => {
    const x = c.instance.state.xmult ?? 1;
    if (x > 1) push(c.tl, c.state, { phase: "joker", source: "Vampire", xMult: x });
  },
  madness: (c) => {
    const x = c.instance.state.xmult ?? 1;
    if (x > 1) push(c.tl, c.state, { phase: "joker", source: "Madness", xMult: x });
  },
  campfire: (c) => {
    const x = c.instance.state.xmult ?? 1;
    if (x > 1) push(c.tl, c.state, { phase: "joker", source: "Campfire", xMult: x });
  },
  glass_joker: (c) => {
    const x = c.instance.state.xmult ?? 1;
    if (x > 1) push(c.tl, c.state, { phase: "joker", source: "Glass Joker", xMult: x });
  },
  throwback: (c) => {
    const x = c.instance.state.xmult ?? 1;
    if (x > 1) push(c.tl, c.state, { phase: "joker", source: "Throwback", xMult: x, note: `${(x - 1) / 0.25} blinds skipped` });
  },
  to_the_moon: (c) => push(c.tl, c.state, { phase: "joker", source: "To the Moon", note: "$1 per $5 (utility)", multAdd: 0 }),
  abstract_joker: (c) => push(c.tl, c.state, { phase: "joker", source: "Abstract Joker", multAdd: c.jokers.length * 3, note: `${c.jokers.length} jokers x3` }),
  cavendish: xMult(3, "Cavendish"),
  gros_michel: flatMult(15, "Gros Michel"),
  steel_joker: (c) => {
    const inDeck = c.instance.state.count ?? c.steelHeld;
    const x = 1 + 0.2 * inDeck;
    if (x > 1) push(c.tl, c.state, { phase: "joker", source: "Steel Joker", xMult: x, note: `${inDeck} steel in deck` });
  },
  stone_joker: (c) => {
    const inDeck = c.instance.state.count ?? c.input.played.filter(p => p.enhancement === "stone").length;
    if (inDeck) push(c.tl, c.state, { phase: "joker", source: "Stone Joker", chipsAdd: inDeck * 25, note: `${inDeck} stone in deck` });
  },
  golden_ticket: (c) => push(c.tl, c.state, { phase: "joker", source: "Golden Ticket", note: "$4 per Gold scored (utility)", multAdd: 0 }),
  swashbuckler: (c) => {
    const v = c.instance.state.value ?? 0;
    if (v) push(c.tl, c.state, { phase: "joker", source: "Swashbuckler", multAdd: v, note: `sum sell value = ${v}` });
  },
  burglar: (c) => push(c.tl, c.state, { phase: "joker", source: "Burglar", note: "+3 hands, no discards (utility)", multAdd: 0 }),
  splash: (c) => push(c.tl, c.state, { phase: "joker", source: "Splash", note: "every played card scores", multAdd: 0 }),
  blueprint: (c) => push(c.tl, c.state, { phase: "joker", source: "Blueprint", note: "copies right joker (handled by COPY logic)", multAdd: 0 }),
  brainstorm: (c) => push(c.tl, c.state, { phase: "joker", source: "Brainstorm", note: "copies leftmost joker (handled by COPY logic)", multAdd: 0 }),
  bull: (c) => push(c.tl, c.state, { phase: "joker", source: "Bull", note: "+2 chips per $1 (money input needed)", multAdd: 0 }),
  bootstraps: (c) => push(c.tl, c.state, { phase: "joker", source: "Bootstraps", note: "+2 mult per $5 (money input needed)", multAdd: 0 }),
  egg: (c) => push(c.tl, c.state, { phase: "joker", source: "Egg", note: "+$3 sell value per round (utility)", multAdd: 0 }),
  delayed_gratification: (c) => push(c.tl, c.state, { phase: "joker", source: "Delayed Gratification", note: "$2 per discard saved (utility)", multAdd: 0 }),
  stuntman: (c) => push(c.tl, c.state, { phase: "joker", source: "Stuntman", chipsAdd: 250, note: "-2 hand size" }),
  drivers_license: (c) => {
    const enh = c.instance.state.count ?? 0;
    if (enh >= 16) push(c.tl, c.state, { phase: "joker", source: "Driver's License", xMult: 3, note: `${enh} enhanced cards in deck` });
  },
  raised_fist: (c) => {
    const ranks = c.input.inHand.filter(p => p.enhancement !== "stone").map(p => RANK_CHIPS[p.rank as Rank] ?? 0);
    if (ranks.length) {
      const lowest = Math.min(...ranks);
      push(c.tl, c.state, { phase: "joker", source: "Raised Fist", multAdd: lowest * 2, note: `2x lowest held rank = ${lowest}` });
    }
  },
  baron: (c) => {
    const kings = c.input.inHand.filter(p => p.rank === "K").length;
    if (kings) push(c.tl, c.state, { phase: "joker", source: "Baron", xMult: Math.pow(1.5, kings), note: `${kings} King(s) in hand` });
  },
  shoot_the_moon: (c) => {
    const queens = c.input.inHand.filter(p => p.rank === "Q").length;
    if (queens) push(c.tl, c.state, { phase: "joker", source: "Shoot the Moon", multAdd: queens * 13, note: `${queens} Queen(s) in hand` });
  },
  arrowhead: (c) => {
    const spades = c.input.played.filter(p => suitOf(p, "S")).length;
    if (spades) push(c.tl, c.state, { phase: "joker", source: "Arrowhead", chipsAdd: spades * 50, note: `${spades} Spade(s) scored` });
  },
  onyx_agate: (c) => {
    const clubs = c.input.played.filter(p => suitOf(p, "C")).length;
    if (clubs) push(c.tl, c.state, { phase: "joker", source: "Onyx Agate", multAdd: clubs * 7 });
  },
  bloodstone: (c) => {
    const hearts = c.input.played.filter(p => suitOf(p, "H")).length;
    if (hearts) push(c.tl, c.state, { phase: "joker", source: "Bloodstone", xMult: 1 + 0.5 * hearts, note: `1/2 chance per Heart, ${hearts} Heart(s)` });
  },
  rough_gem: (c) => push(c.tl, c.state, { phase: "joker", source: "Rough Gem", note: "$1 per Diamond scored (utility)", multAdd: 0 }),
  wee_joker: (c) => {
    const twos = c.input.played.filter(p => p.rank === "2").length;
    const stored = c.instance.state.count ?? twos * 8;
    push(c.tl, c.state, { phase: "joker", source: "Wee Joker", chipsAdd: stored, note: `stored = ${stored}` });
  },
  castle: (c) => {
    const n = c.instance.state.count ?? 0;
    if (n) push(c.tl, c.state, { phase: "joker", source: "Castle", chipsAdd: n, note: `chips stored = ${n}` });
  },
  ancient_joker: (c) => {
    const matched = c.input.played.filter(p => p.suit === c.input.played[0]?.suit).length;
    if (matched > 1) push(c.tl, c.state, { phase: "joker", source: "Ancient Joker", xMult: Math.pow(1.5, matched - 1), note: `${matched} of same suit` });
  },
  smeared_joker: (c) => push(c.tl, c.state, { phase: "joker", source: "Smeared Joker", note: "Hearts=Diamonds, Spades=Clubs (utility)", multAdd: 0 }),
  showman: (c) => push(c.tl, c.state, { phase: "joker", source: "Showman", note: "duplicate consumables (utility)", multAdd: 0 }),
  acrobat: (c) => {
    const handsLeft = c.instance.state.count ?? 0;
    if (handsLeft === 0) push(c.tl, c.state, { phase: "joker", source: "Acrobat", xMult: 3, note: "final hand" });
  },
  bull_2: flatMult(4, "Bull (alt)"),
  joker_stencil: (c) => {
    const empty = c.instance.state.count ?? 0;
    if (empty) push(c.tl, c.state, { phase: "joker", source: "Joker Stencil", xMult: 1 + empty, note: `${empty} empty joker slots` });
  },
  banner_2: flatChips(0, "Banner"),
};

function extraTriggersFor(card: PlayingCard, j: JokerInstance, ctx: CardCtx, idx: number, total: number): number {
  if (j.disabled) return 0;
  switch (j.jokerId) {
    case "hack":
      return ["2","3","4","5"].includes(card.rank) ? 1 : 0;
    case "sock_and_buskin":
      return isFace(card, ctx.pareidolia) ? 1 : 0;
    case "hanging_chad":
      return idx === 0 ? 2 : 0;
    case "seltzer":
      return 5;
    case "dusk":
      return j.state.active ? 1 : 0;
    default:
      return 0;
  }
}

export function computeScore(input: CalcInput): CalcResult {
  const tl: ScorePhaseLine[] = [];
  const warnings: string[] = [];
  delete j_marker.__photo_fired__;

  const preScoring: string[] = [];
  for (const j of input.jokers) {
    if (j.disabled) continue;
    if (j.jokerId === "ride_the_bus" && !["pair","two_pair","three_of_a_kind","four_of_a_kind","five_of_a_kind","full_house","flush_house","flush_five"].includes(input.hand)) {
      preScoring.push("Ride the Bus would increment (no pair this hand)");
    }
    if (j.jokerId === "runner" && ["straight","straight_flush","royal_flush"].includes(input.hand)) {
      preScoring.push("Runner would gain +15 chips (straight detected)");
    }
    if (j.jokerId === "green_joker") {
      preScoring.push("Green Joker would increment (+1 mult)");
    }
    if (j.jokerId === "square_joker" && input.played.length === 4) {
      preScoring.push("Square Joker would stamp (+4 chips, 4-card hand)");
    }
  }

  const base = getHandStats(input.hand, input.handLevel);
  let chipsBase = base.chips;
  let multBase = base.mult;
  if (input.modifiers.flintBoss) {
    chipsBase = Math.floor(chipsBase / 2);
    multBase = Math.floor(multBase / 2);
    warnings.push("The Flint: base chips and mult halved");
  }
  const state = { chips: 0, mult: 0 };
  push(tl, state, { phase: "base", source: `${input.hand} L${input.handLevel}`, chipsAdd: chipsBase, multAdd: multBase });

  const pareidolia = input.jokers.some(j => j.jokerId === "pareidolia" && !j.disabled);
  const ctx: CardCtx = { input, jokers: input.jokers, pareidolia };

  const scored = input.played.filter(p => p.selected !== false);
  for (let i = 0; i < scored.length; i++) {
    const card = scored[i];
    scoreOneCard(card, tl, state, ctx, "card");

    if (card.seal === "gold") {
      scoreOneCard(card, tl, state, ctx, "Gold Seal retrigger");
    }
    if (card.seal === "red") {
      scoreOneCard(card, tl, state, ctx, "Red Seal retrigger");
    }
    for (const j of input.jokers) {
      const extra = extraTriggersFor(card, j, ctx, i, scored.length);
      for (let k = 0; k < extra; k++) {
        scoreOneCard(card, tl, state, ctx, `${j.jokerId} retrigger`);
      }
    }
  }

  const steelHeld = input.inHand.filter(p => p.enhancement === "steel").length;
  const goldHeld = input.inHand.filter(p => p.enhancement === "gold").length;
  const hasMime = input.jokers.some(j => j.jokerId === "mime" && !j.disabled);

  for (const card of input.inHand) {
    if (card.enhancement === "steel") {
      push(tl, state, { phase: "held", source: `Steel ${card.rank}${card.suit}`, xMult: 1.5 });
      if (hasMime) push(tl, state, { phase: "held", source: `Mime retrigger Steel ${card.rank}${card.suit}`, xMult: 1.5 });
      if (card.seal === "red") push(tl, state, { phase: "held", source: `Red Seal Steel ${card.rank}${card.suit}`, xMult: 1.5 });
    }
  }
  if (goldHeld > 0) {
    push(tl, state, { phase: "held", source: `Gold held`, note: `+$${goldHeld * 3} (utility, not score)`, multAdd: 0 });
  }
  for (const j of input.jokers) {
    if (j.disabled) continue;
    if (j.jokerId === "baron" || j.jokerId === "shoot_the_moon" || j.jokerId === "raised_fist") {
      const fx = JOKER_FX[j.jokerId];
      if (fx) {
        const jctx = buildJokerCtx(input, j, state, tl, steelHeld, goldHeld, pareidolia);
        fx(jctx);
        if (hasMime) {
          push(tl, state, { phase: "held", source: `Mime retrigger ${j.jokerId}`, note: "in-hand effect re-fires", multAdd: 0 });
          fx(jctx);
        }
      }
    }
  }

  for (const j of input.jokers) {
    if (j.disabled) continue;
    if (j.jokerId === "baron" || j.jokerId === "shoot_the_moon" || j.jokerId === "raised_fist") continue;
    if (j.edition === "foil") push(tl, state, { phase: "joker", source: `Foil ${j.jokerId}`, chipsAdd: 50 });
    if (j.edition === "holo") push(tl, state, { phase: "joker", source: `Holo ${j.jokerId}`, multAdd: 10 });
    const fx = JOKER_FX[j.jokerId];
    const jctx = buildJokerCtx(input, j, state, tl, steelHeld, goldHeld, pareidolia);
    if (fx) {
      fx(jctx);
    } else {
      push(tl, state, { phase: "joker", source: j.jokerId, note: "effect not modelled (edition still applies)", multAdd: 0 });
    }
    if (j.edition === "poly") push(tl, state, { phase: "joker", source: `Poly ${j.jokerId}`, xMult: 1.5 });
  }

  if (input.modifiers.observatory) {
    const matching = input.observatoryPlanets.filter(p => p === input.hand).length;
    for (let i = 0; i < matching; i++) {
      push(tl, state, { phase: "final", source: "Observatory planet", xMult: 1.5 });
    }
  }
  let score: number;
  if (input.modifiers.plasmaDeck) {
    const avg = (state.chips + state.mult) / 2;
    score = Math.floor(avg * avg);
    tl.push({
      phase: "final",
      source: "Plasma deck",
      note: `((${round(state.chips)} + ${round(state.mult, 2)}) / 2)^2 = ${Math.floor(avg * avg).toLocaleString()}`,
      chipsAfter: round(avg),
      multAfter: round(avg, 2),
    });
  } else {
    score = Math.floor(state.chips * state.mult);
  }

  if (preScoring.length) {
    for (const note of preScoring) warnings.push(note);
  }

  return {
    chips: round(state.chips),
    mult: round(state.mult, 2),
    score,
    timeline: tl,
    warnings,
  };
}

function buildJokerCtx(
  input: CalcInput, j: JokerInstance, state: { chips: number; mult: number }, tl: ScorePhaseLine[],
  steelHeld: number, goldHeld: number, pareidolia: boolean,
): JokerCtx {
  const playedFaces = input.played.filter(p => isFace(p, pareidolia)).length;
  const playedHearts = input.played.filter(p => suitOf(p, "H")).length;
  const playedDiamonds = input.played.filter(p => suitOf(p, "D")).length;
  const playedSpades = input.played.filter(p => suitOf(p, "S")).length;
  const playedClubs = input.played.filter(p => suitOf(p, "C")).length;
  const playedEvens = input.played.filter(p => isEven(p.rank)).length;
  const playedOdds = input.played.filter(p => isOdd(p.rank)).length;
  return {
    input, instance: j, state, tl,
    jokers: input.jokers, pareidolia,
    playedFaces, playedHearts, playedDiamonds, playedSpades, playedClubs,
    playedEvens, playedOdds, playedCount: input.played.length,
    steelHeld, goldHeld, unscoredCount: 0,
  };
}

export function detectHand(played: PlayingCard[]): HandKey {
  if (played.length === 0) return "high_card";
  const scored = played.filter(p => p.enhancement !== "stone");
  if (scored.length === 0) return "high_card";

  const ranks = scored.map(p => p.rank);
  const counts = new Map<Rank, number>();
  for (const r of ranks) counts.set(r, (counts.get(r) ?? 0) + 1);
  const countVals = Array.from(counts.values()).sort((a, b) => b - a);

  const suitCounts = new Map<Suit, number>();
  for (const p of scored) {
    if (p.enhancement === "wild") {
      for (const s of ["S","H","D","C"] as Suit[]) suitCounts.set(s, (suitCounts.get(s) ?? 0) + 1);
    } else {
      suitCounts.set(p.suit, (suitCounts.get(p.suit) ?? 0) + 1);
    }
  }
  const maxSuit = Math.max(0, ...Array.from(suitCounts.values()));
  const isFlush = scored.length === 5 && maxSuit === 5;

  const rankOrder: Record<Rank, number> = {
    "A": 14, "K": 13, "Q": 12, "J": 11, "T": 10, "9": 9, "8": 8, "7": 7, "6": 6, "5": 5, "4": 4, "3": 3, "2": 2,
  };
  const nums = Array.from(new Set(ranks.map(r => rankOrder[r]))).sort((a, b) => a - b);
  let isStraight = false;
  let isRoyal = false;
  if (nums.length === 5) {
    if (nums[4] - nums[0] === 4) isStraight = true;
    if (nums.join(",") === "2,3,4,5,14") isStraight = true;
    if (nums.join(",") === "10,11,12,13,14") { isStraight = true; isRoyal = true; }
  }

  if (countVals[0] === 5 && isFlush) return "flush_five";
  if (countVals[0] === 5) return "five_of_a_kind";
  if (countVals[0] === 3 && countVals[1] === 2 && isFlush) return "flush_house";
  if (isStraight && isFlush) return isRoyal ? "royal_flush" : "straight_flush";
  if (countVals[0] === 4) return "four_of_a_kind";
  if (countVals[0] === 3 && countVals[1] === 2) return "full_house";
  if (isFlush) return "flush";
  if (isStraight) return "straight";
  if (countVals[0] === 3) return "three_of_a_kind";
  if (countVals[0] === 2 && countVals[1] === 2) return "two_pair";
  if (countVals[0] === 2) return "pair";
  return "high_card";
}

export function optimizeJokerOrder(input: CalcInput): { best: JokerInstance[]; baseScore: number; bestScore: number } {
  if (input.jokers.length <= 1) {
    const r = computeScore(input);
    return { best: input.jokers, baseScore: r.score, bestScore: r.score };
  }
  const base = computeScore(input).score;
  let best = input.jokers.slice();
  let bestScore = base;
  const indices = input.jokers.map((_, i) => i);
  const perms: number[][] = [];
  function permute(arr: number[], prefix: number[] = []) {
    if (arr.length === 0) { perms.push(prefix); return; }
    for (let i = 0; i < arr.length; i++) {
      const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
      permute(rest, [...prefix, arr[i]]);
    }
  }
  permute(indices);
  for (const perm of perms) {
    const trial = perm.map((i: number) => input.jokers[i]);
    const r = computeScore({ ...input, jokers: trial }).score;
    if (r > bestScore) { bestScore = r; best = trial; }
  }
  return { best, baseScore: base, bestScore };
}
