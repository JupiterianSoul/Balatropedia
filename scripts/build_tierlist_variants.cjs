#!/usr/bin/env node
// Build per-stake / per-deck tier list variants by perturbing the default ranking
// using known game-mechanic effects. Output replaces client/src/data/tierlist.json.
//
// Strategy: maintain default S-A-B-C-D buckets, then for each variant apply
// per-joker rank deltas (negative = better tier, positive = worse tier).
// Re-bucket while preserving relative within-tier ordering.

const fs = require("fs");
const path = require("path");

const TIERLIST_PATH = path.resolve(__dirname, "..", "client", "src", "data", "tierlist.json");
const data = JSON.parse(fs.readFileSync(TIERLIST_PATH, "utf8"));

const RANKS = ["S", "A", "B", "C", "D"];
function tierIndexOf(tierData, id) {
  for (let i = 0; i < RANKS.length; i++) {
    if (tierData[RANKS[i]].includes(id)) return i;
  }
  return RANKS.length - 1;
}

// ---------------- Joker tag taxonomy ----------------
// IDs are taken from the default tier list (all 150). We classify each by
// the gameplay levers it cares about. Multiple tags per joker are fine.

// Hand-size dependent (Baron, Raised Fist, etc.)
const HAND_SIZE = new Set([
  "baron", "raised_fist", "shoot_the_moon", "mime", "joker_stencil",
]);

// Discard-dependent (cards discarded fuel scaling, or needs many discards)
const DISCARD = new Set([
  "green_joker", "ride_the_bus", "spare_trousers", "trading_card",
  "burnt_joker", "matador", "hit_the_road", "yorick", "wee_joker",
  "castle", "constellation", "luchador",
]);

// Hand-count dependent (each hand played = scaling)
const HAND_PLAYED = new Set([
  "obelisk", "fibonacci", "supernova", "vampire", "campfire",
  "to_the_moon", "rocket", "throwback", "loyalty_card", "runner",
]);

// Money/economy (interest, money gains)
const ECONOMY = new Set([
  "to_the_moon", "rocket", "delayed_gratification", "credit_card",
  "bootstraps", "business_card", "egg", "gift_card", "swashbuckler",
  "matador", "midas_mask", "golden_joker", "satellite", "to_do_list",
  "cloud_9", "bull", "reserved_parking", "fortune_teller",
]);

// Face-card dependent
const FACE_CARD = new Set([
  "scary_face", "smiley_face", "triboulet", "sock_and_buskin", "pareidolia",
  "business_card", "midas_mask", "reserved_parking",
]);

// Flush-build pieces
const FLUSH = new Set([
  "smeared_joker", "drunkard", "astronomer", "greedy_joker",
  "wrathful_joker", "lusty_joker", "gluttonous_joker", "the_idol", "fortune_teller",
]);

// Straight-build pieces
const STRAIGHT = new Set([
  "drunkard", "hack", "even_steven", "odd_todd", "spaceman", "ramen",
]);

// Pair / multi-of-a-kind pieces
const PAIR_KIND = new Set([
  "dna", "fibonacci", "the_idol", "the_duo", "the_trio", "the_family",
  "the_order", "the_tribe", "ancient_joker",
]);

// Mult / XMult scalers (raw scoring)
const XMULT_SCALER = new Set([
  "blueprint", "brainstorm", "canio", "perkeo", "chicot", "yorick",
  "the_duo", "the_trio", "the_family", "the_order", "the_tribe",
  "hologram", "constellation", "campfire", "vampire", "obelisk",
  "madness", "lucky_cat", "ride_the_bus", "green_joker", "spare_trousers",
  "rocket", "to_the_moon", "supernova", "stuntman",
]);

// Glass / steel / lucky enhancement engines
const ENHANCE_ENG = new Set([
  "lucky_cat", "bloodstone", "glass_joker", "steel_joker",
  "stone_joker", "marble_joker", "burnt_joker",
]);

// Spectral / tarot / planet engines (consumable scaling)
const CONSUMABLE_ENG = new Set([
  "vagabond", "fortune_teller", "astronomer", "spaceman",
  "constellation", "satellite", "burnt_joker", "cartomancer", "seance",
  "perkeo", "campfire", "sixth_sense", "superposition",
]);

// Tag-using
const TAG_USE = new Set([
  "campfire", "luchador",
]);

// Probability / luck (Oops!, Lucky, Bloodstone)
const LUCK = new Set([
  "lucky_cat", "bloodstone", "8_ball", "oops_all_6s", "space_joker",
  "swashbuckler", "gros_michel", "cavendish", "wee_joker",
]);

// Eternal-safe (cheap commons that still work as Eternals on Black Stake)
const ETERNAL_SAFE = new Set([
  "joker", "greedy_joker", "lusty_joker", "wrathful_joker", "gluttonous_joker",
  "jolly_joker", "zany_joker", "mad_joker", "crazy_joker", "droll_joker",
  "sly_joker", "wily_joker", "clever_joker", "devious_joker", "crafty_joker",
  "half_joker", "joker_stencil", "scary_face", "smiley_face", "shoot_the_moon",
  "even_steven", "odd_todd", "mime", "to_do_list", "hack", "credit_card",
  "abstract_joker", "delayed_gratification", "ceremonial_dagger", "marble_joker",
  "loyalty_card", "8_ball",
]);

// Late-game crit jokers needing setup
const LATE_GAME = new Set([
  "blueprint", "brainstorm", "yorick", "chicot", "perkeo", "canio",
  "triboulet", "the_idol", "constellation", "hologram", "obelisk",
  "stuntman", "baron", "campfire",
]);

// Boss-blind dependent
const BOSS_DEP = new Set([
  "rough_gem", "arrowhead", "onyx_agate", "bloodstone",
  "fortune_teller", "matador", "luchador",
]);

// Helper to apply a delta map to default tier ranks
function buildVariant(deltaMap) {
  // Start by giving each joker its default rank
  const rankFor = {};
  for (let i = 0; i < RANKS.length; i++) {
    for (const id of data.default[RANKS[i]]) rankFor[id] = i;
  }
  // Apply delta
  for (const [id, d] of Object.entries(deltaMap)) {
    if (rankFor[id] == null) continue;
    rankFor[id] = Math.max(0, Math.min(RANKS.length - 1, rankFor[id] + d));
  }
  // Build buckets, preserving the relative ordering from default within each
  // new bucket. We do this by walking the default ranking and placing each
  // joker into its new bucket.
  const out = { S: [], A: [], B: [], C: [], D: [] };
  for (const k of RANKS) {
    for (const id of data.default[k]) {
      out[RANKS[rankFor[id]]].push(id);
    }
  }
  return out;
}

// ---------------- Stake deltas ----------------
// White: identical (= default)
// Red: small_blinds_no_skip — slightly punishes long-setup builds.
function redStake() {
  const d = {};
  for (const id of LATE_GAME) d[id] = (d[id] || 0) + 1;
  return d;
}
// Green: +0.5 mult per ante boss — flat-add jokers slightly worse, scalers better.
function greenStake() {
  const d = {};
  for (const id of XMULT_SCALER) d[id] = (d[id] || 0) - 1;
  for (const id of ECONOMY) d[id] = (d[id] || 0) + 1;
  return d;
}
// Black: every joker chosen is Eternal → cheap commons that scale stay relevant,
// fragile late-game crits that you can't sell get punished.
function blackStake() {
  const d = {};
  for (const id of ETERNAL_SAFE) d[id] = (d[id] || 0) - 1;
  for (const id of LATE_GAME) d[id] = (d[id] || 0) + 1;
  for (const id of LUCK) d[id] = (d[id] || 0) + 1;
  return d;
}
// Blue: -1 discard → discard-dependent jokers down, hand-played up
function blueStake() {
  const d = {};
  for (const id of DISCARD) d[id] = (d[id] || 0) + 1;
  for (const id of HAND_PLAYED) d[id] = (d[id] || 0) - 1;
  return d;
}
// Purple: -1 hand → hand-played jokers down, discard up
function purpleStake() {
  const d = {};
  for (const id of HAND_PLAYED) d[id] = (d[id] || 0) + 1;
  for (const id of DISCARD) d[id] = (d[id] || 0) - 1;
  return d;
}
// Orange: booster cost x2 → consumable engines down (tarot/planet are pricier)
function orangeStake() {
  const d = {};
  for (const id of CONSUMABLE_ENG) d[id] = (d[id] || 0) + 1;
  for (const id of XMULT_SCALER) d[id] = (d[id] || 0) - 1;
  return d;
}
// Gold: -1 hand size + Perishable jokers in shops → hand-size dependent jokers down,
// any joker that needs time to scale gets punished.
function goldStake() {
  const d = {};
  for (const id of HAND_SIZE) d[id] = (d[id] || 0) + 2;
  for (const id of LATE_GAME) d[id] = (d[id] || 0) + 1;
  for (const id of ETERNAL_SAFE) d[id] = (d[id] || 0) - 1;
  // Boss-dependent jokers more reliable late
  for (const id of BOSS_DEP) d[id] = (d[id] || 0) - 1;
  return d;
}

// ---------------- Deck deltas ----------------
// Red Deck: +1 discard → discard scalers up
function redDeck() {
  const d = {};
  for (const id of DISCARD) d[id] = (d[id] || 0) - 1;
  return d;
}
// Blue Deck: +1 hand → hand-played scalers up
function blueDeck() {
  const d = {};
  for (const id of HAND_PLAYED) d[id] = (d[id] || 0) - 1;
  return d;
}
// Yellow Deck: starts with $10 → no major rank shift; tiny tilt vs Black Stake
function yellowDeck() {
  return {};
}
// Green Deck: +$2/round, no interest → interest economy jokers DOWN, flat-add ok
function greenDeck() {
  const d = {};
  for (const id of ECONOMY) d[id] = (d[id] || 0) + 1;
  return d;
}
// Black Deck: +1 joker slot, -1 hand → joker-count plays up, hand-size down
function blackDeck() {
  const d = {};
  for (const id of HAND_PLAYED) d[id] = (d[id] || 0) + 1;
  // joker-count benefit: anything XMult-scaler / brain blueprint loves more slots
  for (const id of XMULT_SCALER) d[id] = (d[id] || 0) - 1;
  return d;
}
// Magic Deck: starts Crystal Ball + 2 Fool → tarot / consumable scalers up
function magicDeck() {
  const d = {};
  for (const id of CONSUMABLE_ENG) d[id] = (d[id] || 0) - 1;
  return d;
}
// Nebula Deck: starts with Telescope, -1 consumable slot → planet plays up,
// consumable engines slightly worse (less slot to chain)
function nebulaDeck() {
  const d = {};
  d["astronomer"] = -1;
  d["satellite"] = -1;
  d["constellation"] = -1;
  for (const id of CONSUMABLE_ENG) d[id] = (d[id] || 0) + 1;
  return d;
}
// Ghost Deck: spectral cards drop → glass / spectral engines up
function ghostDeck() {
  const d = {};
  for (const id of ENHANCE_ENG) d[id] = (d[id] || 0) - 1;
  d["seance"] = -1;
  d["sixth_sense"] = -1;
  d["superposition"] = -1;
  return d;
}
// Abandoned Deck: no face cards → face-card jokers DOWN HARD
function abandonedDeck() {
  const d = {};
  for (const id of FACE_CARD) d[id] = (d[id] || 0) + 2;
  return d;
}
// Checkered Deck: only spades/hearts → flush builds easier
function checkeredDeck() {
  const d = {};
  for (const id of FLUSH) d[id] = (d[id] || 0) - 1;
  return d;
}
// Zodiac Deck: starts with Tarot+Planet+Spectral merchant → consumable engines up
function zodiacDeck() {
  const d = {};
  for (const id of CONSUMABLE_ENG) d[id] = (d[id] || 0) - 1;
  for (const id of ENHANCE_ENG) d[id] = (d[id] || 0) - 1;
  return d;
}
// Painted Deck: +2 hand size, -1 joker slot
function paintedDeck() {
  const d = {};
  for (const id of HAND_SIZE) d[id] = (d[id] || 0) - 2;
  // -1 joker slot punishes joker-stacking builds
  for (const id of XMULT_SCALER) d[id] = (d[id] || 0) + 1;
  return d;
}
// Anaglyph: double tag on boss defeat → tag-users up + general economy up
function anaglyphDeck() {
  const d = {};
  for (const id of TAG_USE) d[id] = (d[id] || 0) - 1;
  return d;
}
// Plasma: chips & mult balanced (average then multiplied) → flat-add chips
// jokers worse, anything that pumps XMult or chips equally is great
function plasmaDeck() {
  const d = {};
  for (const id of XMULT_SCALER) d[id] = (d[id] || 0) - 1;
  // Cards with raw +chips less valuable
  return d;
}
// Erratic: random ranks/suits → consistency-dependent builds (straights especially)
// get more painful; flush-anywhere doesn't care
function erraticDeck() {
  const d = {};
  for (const id of STRAIGHT) d[id] = (d[id] || 0) + 1;
  for (const id of PAIR_KIND) d[id] = (d[id] || 0) + 1;
  for (const id of LUCK) d[id] = (d[id] || 0) - 1;
  return d;
}

// ---------------- Build all variants ----------------
data.byStake = {
  white: buildVariant({}), // identical to default
  red: buildVariant(redStake()),
  green: buildVariant(greenStake()),
  black: buildVariant(blackStake()),
  blue: buildVariant(blueStake()),
  purple: buildVariant(purpleStake()),
  orange: buildVariant(orangeStake()),
  gold: buildVariant(goldStake()),
};
data.byDeck = {
  red: buildVariant(redDeck()),
  blue: buildVariant(blueDeck()),
  yellow: buildVariant(yellowDeck()),
  green: buildVariant(greenDeck()),
  black: buildVariant(blackDeck()),
  magic: buildVariant(magicDeck()),
  nebula: buildVariant(nebulaDeck()),
  ghost: buildVariant(ghostDeck()),
  abandoned: buildVariant(abandonedDeck()),
  checkered: buildVariant(checkeredDeck()),
  zodiac: buildVariant(zodiacDeck()),
  painted: buildVariant(paintedDeck()),
  anaglyph: buildVariant(anaglyphDeck()),
  plasma: buildVariant(plasmaDeck()),
  erratic: buildVariant(erraticDeck()),
};

// Update notes to reflect the new methodology
data.notes = [
  "Default ranking is community-aggregated from multiple public tier-list sources.",
  "Per-stake variants apply known stake modifiers (eternal jokers, -hand, -discard, -hand-size, etc.) as small rank shifts on top of the default ranking.",
  "Per-deck variants reflect each deck's starting bonus (extra hand/discard, no face cards, suit bias, free consumables, joker-slot tradeoffs, etc.).",
  "Shifts are intentionally conservative (±1-2 buckets) and preserve the default within-bucket ordering. The default ranking is still the safest reference.",
];

fs.writeFileSync(TIERLIST_PATH, JSON.stringify(data, null, 2) + "\n");
console.log("Wrote", TIERLIST_PATH);

// Sanity counts
function counts(td) {
  return RANKS.map((k) => k + ":" + td[k].length).join(" ");
}
console.log("default", counts(data.default));
for (const [k, v] of Object.entries(data.byStake)) console.log("stake:" + k, counts(v));
for (const [k, v] of Object.entries(data.byDeck)) console.log("deck:" + k, counts(v));
