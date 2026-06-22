// Balatro Joker Synergy Explorer — curated dataset
// Schema is intentionally flat & JSON-serializable so it can be exported to a static file later.

export type Role =
  | "chips" | "flat_mult" | "xmult" | "retrigger" | "economy" | "consistency"
  | "discard_support" | "hand_size" | "held_in_hand" | "suit_support"
  | "rank_face_support" | "deck_manipulation" | "deck_growth"
  | "enhancement_interaction" | "destroy_value" | "scaling_engine"
  | "payoff" | "enabler" | "pivot";

export type Archetype =
  | "flush" | "straight" | "high_card" | "pair" | "two_pair"
  | "three_of_a_kind" | "four_of_a_kind" | "face_card" | "held_in_hand"
  | "steel" | "glass" | "discard" | "deck_growth" | "economy_snowball"
  | "retrigger_engine";

export type HandType =
  | "high_card" | "pair" | "two_pair" | "three_of_a_kind" | "straight"
  | "flush" | "full_house" | "four_of_a_kind" | "straight_flush" | "any";

export type Scaling = "static" | "linear" | "multiplicative" | "exponential" | "conditional";
export type Stage = "early" | "mid" | "late";
export type Level = "low" | "med" | "high";

export type Rarity = "common" | "uncommon" | "rare" | "legendary";

export interface Joker {
  id: string;
  name: string;
  rarity?: Rarity;
  summary: string;
  mainRole: Role;
  secondaryRole?: Role;
  tags: Role[];
  trigger: string;
  scaling: Scaling;
  hands: HandType[];
  archetypes: Archetype[];
  stage: Stage[];
  economy: Level;
  consistency: Level;
  partners: string[];      // joker ids
  antiSynergies: string[]; // joker ids
  setupDifficulty: Level;
  risk: Level;
  notes: string;
  beginner: string;
}

export const JOKERS: Joker[] = [
  // ════════════════════════════════════════════════════════════════
  // COMMON (61)
  // ════════════════════════════════════════════════════════════════
  // ── 1. Joker ──────────────────────────────────────────────────────────────
  {
    id: "joker",
    name: "Joker",
    rarity: "common",
    summary: "+4 Mult.",
    mainRole: "flat_mult",
    tags: ["flat_mult", "enabler"],
    trigger: "every scored hand",
    scaling: "static",
    hands: ["any"], archetypes: ["high_card", "pair", "two_pair"], stage: ["early"],
    economy: "low", consistency: "high",
    partners: ["mime", "blueprint", "brainstorm", "cavendish"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "Baseline floor value. Buy early when nothing better is available; sell freely once a real engine materialises.",
    beginner: "Gives a small flat mult on every hand. Cheap and safe — replace it when you find something stronger."
  },

  // ── 2. Greedy Joker ───────────────────────────────────────────────────────
  {
    id: "greedy_joker",
    name: "Greedy Joker",
    rarity: "common",
    summary: "Played cards with Diamond suit give +3 Mult when scored.",
    mainRole: "flat_mult",
    secondaryRole: "suit_support",
    tags: ["flat_mult", "suit_support", "payoff"],
    trigger: "scored Diamond card",
    scaling: "linear",
    hands: ["flush", "pair", "two_pair", "any"], archetypes: ["flush"], stage: ["early", "mid"],
    economy: "low", consistency: "med",
    partners: ["smeared_joker", "the_idol", "driver_gloves", "lusty_joker"],
    antiSynergies: ["pareidolia"],
    setupDifficulty: "low", risk: "low",
    notes: "Strong inside mono-Diamond or merged-suit flush decks. Combine with Smeared Joker to double the qualifying cards.",
    beginner: "Score Diamond cards to get extra mult. Easy and consistent in flush builds."
  },

  // ── 3. Lusty Joker ────────────────────────────────────────────────────────
  {
    id: "lusty_joker",
    name: "Lusty Joker",
    rarity: "common",
    summary: "Played cards with Heart suit give +3 Mult when scored.",
    mainRole: "flat_mult",
    secondaryRole: "suit_support",
    tags: ["flat_mult", "suit_support", "payoff"],
    trigger: "scored Heart card",
    scaling: "linear",
    hands: ["flush", "pair", "two_pair", "any"], archetypes: ["flush"], stage: ["early", "mid"],
    economy: "low", consistency: "med",
    partners: ["smeared_joker", "the_idol", "driver_gloves", "greedy_joker"],
    antiSynergies: ["pareidolia"],
    setupDifficulty: "low", risk: "low",
    notes: "Mirror of Greedy Joker for Hearts. Pair with Smeared to merge Hearts+Diamonds and run both suit Jokers simultaneously.",
    beginner: "Score Heart cards to get extra mult. Works exactly like Greedy Joker but for Hearts."
  },

  // ── 4. Wrathful Joker ─────────────────────────────────────────────────────
  {
    id: "wrathful_joker",
    name: "Wrathful Joker",
    rarity: "common",
    summary: "Played cards with Spade suit give +3 Mult when scored.",
    mainRole: "flat_mult",
    secondaryRole: "suit_support",
    tags: ["flat_mult", "suit_support", "payoff"],
    trigger: "scored Spade card",
    scaling: "linear",
    hands: ["flush", "pair", "two_pair", "any"], archetypes: ["flush"], stage: ["early", "mid"],
    economy: "low", consistency: "med",
    partners: ["smeared_joker", "the_idol", "gluttonous_joker"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "Mirror of Greedy for Spades. Pair with Smeared to merge Spades+Clubs for easy flush coverage.",
    beginner: "Score Spade cards to get extra mult. Same idea as Greedy Joker, just for Spades."
  },

  // ── 5. Gluttonous Joker ───────────────────────────────────────────────────
  {
    id: "gluttonous_joker",
    name: "Gluttonous Joker",
    rarity: "common",
    summary: "Played cards with Club suit give +3 Mult when scored.",
    mainRole: "flat_mult",
    secondaryRole: "suit_support",
    tags: ["flat_mult", "suit_support", "payoff"],
    trigger: "scored Club card",
    scaling: "linear",
    hands: ["flush", "pair", "two_pair", "any"], archetypes: ["flush"], stage: ["early", "mid"],
    economy: "low", consistency: "med",
    partners: ["smeared_joker", "the_idol", "wrathful_joker"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "Fourth of the suit quartet. Best when Smeared merges Clubs with Spades — run both for double payout per scored card.",
    beginner: "Score Club cards to get extra mult. Pair with Smeared Joker and Wrathful Joker for big flush payoffs."
  },

  // ── 6. Jolly Joker ────────────────────────────────────────────────────────
  {
    id: "jolly_joker",
    name: "Jolly Joker",
    rarity: "common",
    summary: "+8 Mult if played hand contains a Pair.",
    mainRole: "flat_mult",
    tags: ["flat_mult", "consistency", "payoff"],
    trigger: "hand contains a Pair",
    scaling: "conditional",
    hands: ["pair", "two_pair", "full_house", "four_of_a_kind"], archetypes: ["pair", "two_pair"], stage: ["early", "mid"],
    economy: "low", consistency: "high",
    partners: ["sly_joker", "blueprint", "brainstorm", "the_duo"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "Fires on any hand containing a Pair — including Two Pair, Full House, Four of a Kind. Easy condition to meet.",
    beginner: "Play any hand with a Pair to get +8 Mult. Reliable and beginner-friendly."
  },

  // ── 7. Zany Joker ─────────────────────────────────────────────────────────
  {
    id: "zany_joker",
    name: "Zany Joker",
    rarity: "common",
    summary: "+12 Mult if played hand contains a Three of a Kind.",
    mainRole: "flat_mult",
    tags: ["flat_mult", "payoff"],
    trigger: "hand contains a Three of a Kind",
    scaling: "conditional",
    hands: ["three_of_a_kind", "full_house", "four_of_a_kind"], archetypes: ["three_of_a_kind"], stage: ["early", "mid"],
    economy: "low", consistency: "med",
    partners: ["wily_joker", "blueprint", "brainstorm", "the_trio"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "Higher mult than Jolly, lower consistency. Stack with Wily Joker for chip+mult coverage on the same hand condition.",
    beginner: "Play a Three of a Kind (or better) to get +12 Mult. Pairs well with Wily Joker."
  },

  // ── 8. Mad Joker ──────────────────────────────────────────────────────────
  {
    id: "mad_joker",
    name: "Mad Joker",
    rarity: "common",
    summary: "+10 Mult if played hand contains a Two Pair.",
    mainRole: "flat_mult",
    tags: ["flat_mult", "payoff"],
    trigger: "hand contains a Two Pair",
    scaling: "conditional",
    hands: ["two_pair", "full_house"], archetypes: ["two_pair"], stage: ["early", "mid"],
    economy: "low", consistency: "med",
    partners: ["clever_joker", "spare_trousers", "blueprint", "brainstorm"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "Fires on Two Pair and Full House. Combine with Clever Joker for dual chip+mult on the same Two Pair trigger.",
    beginner: "Play a Two Pair or Full House to activate. Combine with Clever Joker for chip coverage."
  },

  // ── 9. Crazy Joker ────────────────────────────────────────────────────────
  {
    id: "crazy_joker",
    name: "Crazy Joker",
    rarity: "common",
    summary: "+12 Mult if played hand contains a Straight.",
    mainRole: "flat_mult",
    tags: ["flat_mult", "payoff"],
    trigger: "hand contains a Straight",
    scaling: "conditional",
    hands: ["straight", "straight_flush"], archetypes: ["straight"], stage: ["early", "mid"],
    economy: "low", consistency: "med",
    partners: ["devious_joker", "runner", "blueprint", "brainstorm", "drunkard"],
    antiSynergies: [],
    setupDifficulty: "med", risk: "low",
    notes: "Strong in straight builds; pair with Devious Joker to double-dip chips and mult. Drunkard helps assemble the Straight consistently.",
    beginner: "Play a Straight to get +12 Mult. Takes a little setup but consistent once you commit to straights."
  },

  // ── 10. Droll Joker ───────────────────────────────────────────────────────
  {
    id: "droll_joker",
    name: "Droll Joker",
    rarity: "common",
    summary: "+10 Mult if played hand contains a Flush.",
    mainRole: "flat_mult",
    tags: ["flat_mult", "payoff"],
    trigger: "hand contains a Flush",
    scaling: "conditional",
    hands: ["flush", "straight_flush"], archetypes: ["flush"], stage: ["early", "mid"],
    economy: "low", consistency: "med",
    partners: ["crafty_joker", "smeared_joker", "blueprint", "brainstorm"],
    antiSynergies: [],
    setupDifficulty: "med", risk: "low",
    notes: "Flush-condition mult. Combine with Crafty Joker so one flush hand delivers both chips and mult. Smeared Joker makes flushes far easier to assemble.",
    beginner: "Play a Flush to get +10 Mult. Very strong with Crafty Joker and Smeared Joker."
  },

  // ── 11. Sly Joker ─────────────────────────────────────────────────────────
  {
    id: "sly_joker",
    name: "Sly Joker",
    rarity: "common",
    summary: "+50 Chips if played hand contains a Pair.",
    mainRole: "chips",
    tags: ["chips", "payoff"],
    trigger: "hand contains a Pair",
    scaling: "conditional",
    hands: ["pair", "two_pair", "full_house", "four_of_a_kind"], archetypes: ["pair", "two_pair"], stage: ["early", "mid"],
    economy: "low", consistency: "high",
    partners: ["jolly_joker", "blueprint", "brainstorm"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "Chip companion to Jolly Joker. Together they cover both scoring axes for Pair-based hands throughout the early game.",
    beginner: "Play any Pair hand for +50 Chips. Easy and works with Jolly Joker at the same time."
  },

  // ── 12. Wily Joker ────────────────────────────────────────────────────────
  {
    id: "wily_joker",
    name: "Wily Joker",
    rarity: "common",
    summary: "+100 Chips if played hand contains a Three of a Kind.",
    mainRole: "chips",
    tags: ["chips", "payoff"],
    trigger: "hand contains a Three of a Kind",
    scaling: "conditional",
    hands: ["three_of_a_kind", "full_house", "four_of_a_kind"], archetypes: ["three_of_a_kind"], stage: ["early", "mid"],
    economy: "low", consistency: "med",
    partners: ["zany_joker", "blueprint", "brainstorm"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "Large chip burst on Three of a Kind. Pair with Zany Joker to cover both scoring axes for a single hand type.",
    beginner: "Get +100 Chips for playing a Three of a Kind. Works great alongside Zany Joker."
  },

  // ── 13. Clever Joker ──────────────────────────────────────────────────────
  {
    id: "clever_joker",
    name: "Clever Joker",
    rarity: "common",
    summary: "+80 Chips if played hand contains a Two Pair.",
    mainRole: "chips",
    tags: ["chips", "payoff"],
    trigger: "hand contains a Two Pair",
    scaling: "conditional",
    hands: ["two_pair", "full_house"], archetypes: ["two_pair"], stage: ["early", "mid"],
    economy: "low", consistency: "med",
    partners: ["mad_joker", "spare_trousers", "blueprint", "brainstorm"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "Solid chip support for Two Pair builds. Stack with Mad Joker and Spare Trousers for a strong Two Pair package.",
    beginner: "Play a Two Pair or Full House to get +80 Chips. Easy to combine with Mad Joker."
  },

  // ── 14. Devious Joker ─────────────────────────────────────────────────────
  {
    id: "devious_joker",
    name: "Devious Joker",
    rarity: "common",
    summary: "+100 Chips if played hand contains a Straight.",
    mainRole: "chips",
    tags: ["chips", "payoff"],
    trigger: "hand contains a Straight",
    scaling: "conditional",
    hands: ["straight", "straight_flush"], archetypes: ["straight"], stage: ["early", "mid"],
    economy: "low", consistency: "med",
    partners: ["crazy_joker", "runner", "blueprint", "brainstorm"],
    antiSynergies: [],
    setupDifficulty: "med", risk: "low",
    notes: "Chip side of the Straight package. Pair with Crazy Joker for dual scoring; Runner provides growing chip scaling as the run progresses.",
    beginner: "Play a Straight to get +100 Chips. Combine with Crazy Joker and Runner."
  },

  // ── 15. Crafty Joker ──────────────────────────────────────────────────────
  {
    id: "crafty_joker",
    name: "Crafty Joker",
    rarity: "common",
    summary: "+80 Chips if played hand contains a Flush.",
    mainRole: "chips",
    tags: ["chips", "payoff"],
    trigger: "hand contains a Flush",
    scaling: "conditional",
    hands: ["flush", "straight_flush"], archetypes: ["flush"], stage: ["early", "mid"],
    economy: "low", consistency: "med",
    partners: ["droll_joker", "smeared_joker", "blueprint", "brainstorm"],
    antiSynergies: [],
    setupDifficulty: "med", risk: "low",
    notes: "Chip half of the Flush pair. Run alongside Droll Joker so a single flush hand yields substantial chips and mult. Smeared Joker raises flush hit rate.",
    beginner: "Play a Flush to get +80 Chips. Very effective when paired with Droll Joker."
  },

  // ── 16. Half Joker ────────────────────────────────────────────────────────
  {
    id: "half_joker",
    name: "Half Joker",
    rarity: "common",
    summary: "+20 Mult if played hand contains 3 or fewer cards.",
    mainRole: "flat_mult",
    tags: ["flat_mult", "payoff", "consistency"],
    trigger: "hand played with ≤3 cards",
    scaling: "conditional",
    hands: ["high_card", "pair", "three_of_a_kind"], archetypes: ["high_card", "pair"], stage: ["early", "mid"],
    economy: "low", consistency: "med",
    partners: ["blueprint", "brainstorm", "stuntman", "raised_fist"],
    antiSynergies: [],
    setupDifficulty: "med", risk: "low",
    notes: "Large flat mult that rewards minimal-card plays. Works best with High Card or Pair on a tight hand, and scales well once levelled.",
    beginner: "Play 3 or fewer cards at once to get +20 Mult. High Card or single Pair are your best options."
  },

  // ── 17. Credit Card ───────────────────────────────────────────────────────
  {
    id: "credit_card",
    name: "Credit Card",
    rarity: "common",
    summary: "Go up to −$20 in debt.",
    mainRole: "economy",
    tags: ["economy", "enabler"],
    trigger: "passive (allows negative balance)",
    scaling: "static",
    hands: ["any"], archetypes: ["economy_snowball"], stage: ["early", "mid"],
    economy: "high", consistency: "high",
    partners: ["golden_joker", "satellite", "delayed_gratification", "bull"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "med",
    notes: "Lets you spend beyond your balance to snap up key shop pieces. Pay back the debt before the next shop or you forgo interest.",
    beginner: "Lets you go $20 into debt when shopping. Great for grabbing a must-have Joker you can't quite afford."
  },

  // ── 18. Banner ────────────────────────────────────────────────────────────
  {
    id: "banner",
    name: "Banner",
    rarity: "common",
    summary: "+30 Chips for each remaining discard.",
    mainRole: "chips",
    secondaryRole: "discard_support",
    tags: ["chips", "discard_support", "consistency"],
    trigger: "every scored hand",
    scaling: "linear",
    hands: ["any"], archetypes: ["discard", "high_card"], stage: ["early", "mid"],
    economy: "low", consistency: "high",
    partners: ["drunkard", "mystic_summit", "blueprint", "brainstorm"],
    antiSynergies: ["green_joker"],
    setupDifficulty: "low", risk: "low",
    notes: "Free chip scaling for every discard you don't spend. Drunkard gives an extra discard, inflating Banner's baseline every round.",
    beginner: "Unused discards give you extra chips. Save discards when you have a good hand already."
  },

  // ── 19. Mystic Summit ─────────────────────────────────────────────────────
  {
    id: "mystic_summit",
    name: "Mystic Summit",
    rarity: "common",
    summary: "+15 Mult when 0 discards remaining.",
    mainRole: "flat_mult",
    secondaryRole: "discard_support",
    tags: ["flat_mult", "discard_support", "payoff"],
    trigger: "0 discards remaining this round",
    scaling: "conditional",
    hands: ["any"], archetypes: ["discard", "high_card"], stage: ["early", "mid"],
    economy: "low", consistency: "med",
    partners: ["banner", "blueprint", "brainstorm", "drunkard"],
    antiSynergies: ["mail_in_rebate", "faceless_joker"],
    setupDifficulty: "low", risk: "low",
    notes: "Complements Banner: spend all discards for Mystic Summit, or keep them for Banner — choose one strategy per round. Anti-synergises with discard-economy Jokers that reward spending discards.",
    beginner: "Use all your discards before your final play to get +15 Mult. Works opposite to Banner — pick one."
  },

  // ── 20. 8 Ball ────────────────────────────────────────────────────────────
  {
    id: "eight_ball",
    name: "8 Ball",
    rarity: "common",
    summary: "1 in 4 chance for each played 8 to create a Tarot card when scored (must have room).",
    mainRole: "economy",
    secondaryRole: "deck_manipulation",
    tags: ["economy", "deck_manipulation", "enabler"],
    trigger: "scored 8",
    scaling: "conditional",
    hands: ["any"], archetypes: ["economy_snowball", "pair"], stage: ["early", "mid"],
    economy: "med", consistency: "med",
    partners: ["oops_all_6s", "fortune_teller", "perkeo", "superposition"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "Free Tarots fund enhancements and Planet upgrades. Oops! All 6s doubles the trigger chance. Keep a consumable slot open to capture procs.",
    beginner: "Each 8 you play has a 25% chance to give you a free Tarot card. Play 8s as often as possible."
  },

  // ── 21. Misprint ──────────────────────────────────────────────────────────
  {
    id: "misprint",
    name: "Misprint",
    rarity: "common",
    summary: "+0 to +23 Mult.",
    mainRole: "flat_mult",
    tags: ["flat_mult"],
    trigger: "every scored hand (random amount)",
    scaling: "static",
    hands: ["any"], archetypes: ["high_card", "pair"], stage: ["early"],
    economy: "low", consistency: "low",
    partners: ["blueprint", "brainstorm"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "high",
    notes: "Pure variance. Average payout is ~11.5 Mult. Avoid in high-stakes runs; fine as slot filler if nothing better is available.",
    beginner: "Gives you a random amount of Mult — anywhere from 0 to 23. Very inconsistent; replace it when you can."
  },

  // ── 22. Raised Fist ───────────────────────────────────────────────────────
  {
    id: "raised_fist",
    name: "Raised Fist",
    rarity: "common",
    summary: "Adds double the rank of lowest ranked card held in hand to Mult.",
    mainRole: "flat_mult",
    secondaryRole: "held_in_hand",
    tags: ["flat_mult", "held_in_hand", "payoff"],
    trigger: "held-in-hand phase",
    scaling: "linear",
    hands: ["any"], archetypes: ["held_in_hand"], stage: ["early", "mid"],
    economy: "low", consistency: "high",
    partners: ["mime", "baron", "stuntman"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "Hold one low card (Ace = 1) for reliable flat mult. Mime doubles the trigger, giving 2× that mult for free.",
    beginner: "Keep a low-rank card in your hand to turn its rank into Mult. An Ace gives +2 Mult; a 2 gives +4."
  },

  // ── 23. Chaos the Clown ───────────────────────────────────────────────────
  {
    id: "chaos_the_clown",
    name: "Chaos the Clown",
    rarity: "common",
    summary: "1 free Reroll per shop.",
    mainRole: "consistency",
    tags: ["consistency", "economy", "enabler"],
    trigger: "each shop visit",
    scaling: "static",
    hands: ["any"], archetypes: ["economy_snowball"], stage: ["early", "mid"],
    economy: "med", consistency: "high",
    partners: ["golden_joker", "satellite", "flash_card"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "One guaranteed free reroll per shop dramatically improves Joker hit rate over the run. Pairs with Flash Card whose mult grows per paid reroll.",
    beginner: "You get one free reroll each shop visit. Use it to hunt for the Joker you need."
  },

  // ── 24. Scary Face ────────────────────────────────────────────────────────
  {
    id: "scary_face",
    name: "Scary Face",
    rarity: "common",
    summary: "Played face cards give +30 Chips when scored.",
    mainRole: "chips",
    secondaryRole: "rank_face_support",
    tags: ["chips", "rank_face_support", "payoff"],
    trigger: "scored face card",
    scaling: "linear",
    hands: ["any"], archetypes: ["face_card"], stage: ["early", "mid"],
    economy: "low", consistency: "med",
    partners: ["pareidolia", "sock_and_buskin", "smiley_face", "photograph"],
    antiSynergies: ["ride_the_bus"],
    setupDifficulty: "low", risk: "low",
    notes: "Chip foundation for face-card builds. With Pareidolia every scored card yields +30 chips — pairs naturally with the face-card mult package.",
    beginner: "Face cards (J, Q, K) give +30 Chips each. Stack with Smiley Face for both chips and mult on the same cards."
  },

  // ── 25. Abstract Joker ────────────────────────────────────────────────────
  {
    id: "abstract_joker",
    name: "Abstract Joker",
    rarity: "common",
    summary: "+3 Mult for each Joker card you own.",
    mainRole: "flat_mult",
    secondaryRole: "scaling_engine",
    tags: ["flat_mult", "scaling_engine"],
    trigger: "every scored hand",
    scaling: "linear",
    hands: ["any"], archetypes: ["high_card", "pair"], stage: ["early", "mid"],
    economy: "low", consistency: "high",
    partners: ["riff_raff", "blueprint", "brainstorm"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "Scales with Joker count — 5 Jokers gives +15 Mult. Riff-Raff injects free Common Jokers each blind and amplifies this every time.",
    beginner: "Gives +3 Mult per Joker you own. Fill your Joker slots to maximise it."
  },

  // ── 26. Delayed Gratification ─────────────────────────────────────────────
  {
    id: "delayed_gratification",
    name: "Delayed Gratification",
    rarity: "common",
    summary: "Earn $2 per discard if no discards are used by end of the round.",
    mainRole: "economy",
    secondaryRole: "discard_support",
    tags: ["economy", "discard_support"],
    trigger: "end of round (no discards used)",
    scaling: "linear",
    hands: ["any"], archetypes: ["economy_snowball", "discard"], stage: ["early", "mid"],
    economy: "high", consistency: "med",
    partners: ["drunkard", "golden_joker", "mystic_summit", "banner"],
    antiSynergies: ["mail_in_rebate", "faceless_joker"],
    setupDifficulty: "med", risk: "low",
    notes: "Best with Drunkard — more discards held in reserve equals more money if you play cleanly. Conflicts with discard-economy Jokers that require you to actually use discards.",
    beginner: "If you avoid discarding all round, earn $2 per discard you had. Drunkard makes this more valuable."
  },

  // ── 27. Gros Michel ───────────────────────────────────────────────────────
  {
    id: "gros_michel",
    name: "Gros Michel",
    rarity: "common",
    summary: "+15 Mult. 1 in 6 chance this is destroyed at the end of round.",
    mainRole: "flat_mult",
    tags: ["flat_mult", "payoff"],
    trigger: "every scored hand",
    scaling: "static",
    hands: ["any"], archetypes: ["high_card", "pair", "flush"], stage: ["early", "mid"],
    economy: "low", consistency: "med",
    partners: ["blueprint", "brainstorm", "cavendish"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "med",
    notes: "Great flat mult with a real destruction risk. When it dies it unlocks Cavendish — a vastly superior X3 Mult. Plan the transition.",
    beginner: "Gives +15 Mult but has a 1 in 6 chance to disappear each round. When it dies it lets Cavendish show up."
  },

  // ── 28. Even Steven ───────────────────────────────────────────────────────
  {
    id: "even_steven",
    name: "Even Steven",
    rarity: "common",
    summary: "Played cards with even rank give +4 Mult when scored (10, 8, 6, 4, 2).",
    mainRole: "flat_mult",
    secondaryRole: "rank_face_support",
    tags: ["flat_mult", "rank_face_support", "payoff"],
    trigger: "scored even-rank card",
    scaling: "linear",
    hands: ["pair", "two_pair", "flush", "straight", "any"], archetypes: ["pair", "two_pair", "straight"], stage: ["early", "mid"],
    economy: "low", consistency: "high",
    partners: ["blueprint", "brainstorm", "walkie_talkie", "hack"],
    antiSynergies: ["pareidolia", "odd_todd"],
    setupDifficulty: "low", risk: "low",
    notes: "High-coverage rank payoff — nearly every common hand has even cards. Walkie Talkie (10 and 4) is a direct overlap partner.",
    beginner: "Scoring even-ranked cards (2, 4, 6, 8, 10) gives extra mult. Easy to trigger in most hands."
  },

  // ── 29. Odd Todd ──────────────────────────────────────────────────────────
  {
    id: "odd_todd",
    name: "Odd Todd",
    rarity: "common",
    summary: "Played cards with odd rank give +31 Chips when scored (A, 9, 7, 5, 3).",
    mainRole: "chips",
    secondaryRole: "rank_face_support",
    tags: ["chips", "rank_face_support", "payoff"],
    trigger: "scored odd-rank card",
    scaling: "linear",
    hands: ["pair", "two_pair", "flush", "straight", "any"], archetypes: ["pair", "high_card", "straight"], stage: ["early", "mid"],
    economy: "low", consistency: "high",
    partners: ["blueprint", "brainstorm", "scholar"],
    antiSynergies: ["pareidolia", "even_steven"],
    setupDifficulty: "low", risk: "low",
    notes: "Strong chip filler on odd-rank hands. Scholar overlaps on Aces for combined chips+mult. Avoid stacking Even Steven alongside it.",
    beginner: "Odd-ranked cards (A, 3, 5, 7, 9) give +31 Chips each when scored. Aces double as Scholar fuel."
  },

  // ── 30. Scholar ───────────────────────────────────────────────────────────
  {
    id: "scholar",
    name: "Scholar",
    rarity: "common",
    summary: "Played Aces give +20 Chips and +4 Mult when scored.",
    mainRole: "flat_mult",
    secondaryRole: "chips",
    tags: ["flat_mult", "chips", "rank_face_support"],
    trigger: "scored Ace",
    scaling: "linear",
    hands: ["pair", "flush", "straight", "any"], archetypes: ["pair", "straight", "high_card"], stage: ["early", "mid"],
    economy: "low", consistency: "med",
    partners: ["odd_todd", "superposition", "blueprint", "brainstorm"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "Dual payout per Ace: chips and mult in one card. Best in Ace-heavy decks. Superposition also wants Aces in straights for Tarot generation.",
    beginner: "Each Ace you score gives +20 Chips and +4 Mult. Load up on Aces for consistent value."
  },

  // ── 31. Business Card ─────────────────────────────────────────────────────
  {
    id: "business_card",
    name: "Business Card",
    rarity: "common",
    summary: "Played face cards have a 1 in 2 chance to give $2 when scored.",
    mainRole: "economy",
    secondaryRole: "rank_face_support",
    tags: ["economy", "rank_face_support"],
    trigger: "scored face card (50% chance)",
    scaling: "linear",
    hands: ["any"], archetypes: ["face_card", "economy_snowball"], stage: ["early", "mid"],
    economy: "high", consistency: "med",
    partners: ["pareidolia", "midas_mask", "reserved_parking", "golden_joker"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "Passive face-card income that stacks with Midas Mask. Pareidolia makes every scored card eligible, turning it into a consistent money printer.",
    beginner: "Face cards you play have a 50% chance to pay you $2. More face cards = more money."
  },

  // ── 32. Supernova ─────────────────────────────────────────────────────────
  {
    id: "supernova",
    name: "Supernova",
    rarity: "common",
    summary: "Adds the number of times the played poker hand has been played this run to Mult.",
    mainRole: "flat_mult",
    secondaryRole: "scaling_engine",
    tags: ["flat_mult", "scaling_engine"],
    trigger: "every scored hand",
    scaling: "linear",
    hands: ["any"], archetypes: ["high_card", "pair", "flush", "straight"], stage: ["mid", "late"],
    economy: "low", consistency: "high",
    partners: ["blueprint", "brainstorm", "space_joker"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "Rewards hand specialisation — the more you lean into one hand type, the larger Supernova gets. Play the same hand consistently for best value.",
    beginner: "Every time you play your favourite poker hand, this Joker's bonus grows. Stick to one hand type."
  },

  // ── 33. Ride the Bus ──────────────────────────────────────────────────────
  {
    id: "ride_the_bus",
    name: "Ride the Bus",
    rarity: "common",
    summary: "This Joker gains +1 Mult per consecutive hand played without a scoring face card.",
    mainRole: "flat_mult",
    secondaryRole: "scaling_engine",
    tags: ["flat_mult", "scaling_engine"],
    trigger: "no face cards scored in played hand",
    scaling: "linear",
    hands: ["high_card", "straight", "flush"], archetypes: ["high_card", "straight", "flush"], stage: ["early", "mid"],
    economy: "low", consistency: "med",
    partners: ["blueprint", "brainstorm"],
    antiSynergies: ["triboulet", "pareidolia", "sock_and_buskin", "smiley_face", "scary_face"],
    setupDifficulty: "med", risk: "high",
    notes: "Resets to zero the moment a face card scores. Conflicts hard with face-card builds. Best in pure low-card flush or straight strategies.",
    beginner: "Avoid face cards to keep this growing. One face card scored and it resets to zero."
  },

  // ── 34. Egg ───────────────────────────────────────────────────────────────
  {
    id: "egg",
    name: "Egg",
    rarity: "common",
    summary: "Gains $3 of sell value at end of round.",
    mainRole: "economy",
    tags: ["economy", "scaling_engine"],
    trigger: "end of round",
    scaling: "linear",
    hands: ["any"], archetypes: ["economy_snowball"], stage: ["early", "mid"],
    economy: "high", consistency: "high",
    partners: ["golden_joker", "swashbuckler", "gift_card"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "Sell it at the right time for a burst of income. Swashbuckler counts sell value as Mult — letting Egg sit inflates Swashbuckler for free.",
    beginner: "This Joker's sell price goes up $3 every round. Hold it until you need a cash injection, then sell."
  },

  // ── 35. Runner ────────────────────────────────────────────────────────────
  {
    id: "runner",
    name: "Runner",
    rarity: "common",
    summary: "Gains +15 Chips if played hand contains a Straight.",
    mainRole: "chips",
    secondaryRole: "scaling_engine",
    tags: ["chips", "scaling_engine"],
    trigger: "hand contains a Straight",
    scaling: "linear",
    hands: ["straight", "straight_flush"], archetypes: ["straight"], stage: ["mid", "late"],
    economy: "low", consistency: "med",
    partners: ["crazy_joker", "devious_joker", "blueprint", "brainstorm"],
    antiSynergies: [],
    setupDifficulty: "med", risk: "low",
    notes: "Permanent chip scaling on every Straight. Over a run the chips compound; combine with Crazy/Devious for a complete Straight package.",
    beginner: "Each Straight you play adds +15 Chips permanently. It keeps growing over the run."
  },

  // ── 36. Ice Cream ─────────────────────────────────────────────────────────
  {
    id: "ice_cream",
    name: "Ice Cream",
    rarity: "common",
    summary: "+100 Chips. Loses −5 Chips for every hand played.",
    mainRole: "chips",
    tags: ["chips", "payoff"],
    trigger: "every scored hand",
    scaling: "static",
    hands: ["any"], archetypes: ["high_card", "pair"], stage: ["early", "mid"],
    economy: "low", consistency: "med",
    partners: ["blueprint", "brainstorm", "juggler"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "med",
    notes: "Powerful chip floor early but depletes over 20 hands. Best in short rounds or when you can clear blinds quickly. Sell before it bottoms out.",
    beginner: "Starts at +100 Chips but loses 5 Chips for every hand you play. Sell it before it empties."
  },

  // ── 37. Splash ────────────────────────────────────────────────────────────
  {
    id: "splash",
    name: "Splash",
    rarity: "common",
    summary: "Every played card counts in scoring.",
    mainRole: "enabler",
    secondaryRole: "chips",
    tags: ["enabler", "chips", "consistency"],
    trigger: "passive",
    scaling: "static",
    hands: ["any"], archetypes: ["high_card", "flush", "straight"], stage: ["early", "mid"],
    economy: "low", consistency: "high",
    partners: ["odd_todd", "even_steven", "scholar", "walkie_talkie"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "Unlocks every played card as a scoring card — massive with per-card payoffs like Even Steven, Odd Todd, or suit Jokers. Essentially free chip+mult amplification.",
    beginner: "All cards you play score, not just the hand itself. Great with Jokers that pay per card (e.g., Even Steven)."
  },

  // ── 38. Blue Joker ────────────────────────────────────────────────────────
  {
    id: "blue_joker",
    name: "Blue Joker",
    rarity: "common",
    summary: "+2 Chips for each remaining card in your full deck.",
    mainRole: "chips",
    secondaryRole: "deck_manipulation",
    tags: ["chips", "deck_manipulation", "scaling_engine"],
    trigger: "every scored hand",
    scaling: "linear",
    hands: ["any"], archetypes: ["deck_growth", "high_card"], stage: ["early", "mid"],
    economy: "low", consistency: "high",
    partners: ["blueprint", "brainstorm", "stuntman"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "Starts at +104 Chips with a standard 52-card deck. Avoid thinning if Blue Joker is a pillar; conversely, thin aggressively to raise chip density elsewhere.",
    beginner: "Gives +2 Chips per card in your deck. A fresh 52-card deck gives +104 Chips — huge for early scaling."
  },

  // ── 39. Faceless Joker ────────────────────────────────────────────────────
  {
    id: "faceless_joker",
    name: "Faceless Joker",
    rarity: "common",
    summary: "Earn $5 if 3 or more face cards are discarded at the same time.",
    mainRole: "economy",
    secondaryRole: "discard_support",
    tags: ["economy", "discard_support"],
    trigger: "discard of 3+ face cards simultaneously",
    scaling: "linear",
    hands: ["any"], archetypes: ["discard", "economy_snowball", "face_card"], stage: ["early", "mid"],
    economy: "high", consistency: "med",
    partners: ["drunkard", "mail_in_rebate", "pareidolia"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "Steady income with no opportunity cost beyond the discard. Pareidolia trivialises the face-card requirement by making every card qualify.",
    beginner: "Discard 3 or more face cards at once to earn $5. Easy money in face-heavy decks."
  },

  // ── 40. Green Joker ───────────────────────────────────────────────────────
  {
    id: "green_joker",
    name: "Green Joker",
    rarity: "common",
    summary: "+1 Mult per hand played, −1 Mult per discard.",
    mainRole: "flat_mult",
    secondaryRole: "scaling_engine",
    tags: ["flat_mult", "scaling_engine"],
    trigger: "every hand played / every discard used",
    scaling: "linear",
    hands: ["any"], archetypes: ["high_card", "pair"], stage: ["early", "mid"],
    economy: "low", consistency: "high",
    partners: ["blueprint", "brainstorm"],
    antiSynergies: ["drunkard", "mail_in_rebate", "faceless_joker"],
    setupDifficulty: "low", risk: "med",
    notes: "Punishes discard-heavy strategies. Maximize value in low-discard discipline runs. Don't pair with Drunkard or any discard-economy Joker.",
    beginner: "Grows every hand you play but shrinks whenever you discard. Avoid discarding to keep it large."
  },

  // ── 41. Superposition ────────────────────────────────────────────────────
  {
    id: "superposition",
    name: "Superposition",
    rarity: "common",
    summary: "Create a Tarot card if poker hand contains an Ace and a Straight (must have room).",
    mainRole: "deck_manipulation",
    secondaryRole: "economy",
    tags: ["deck_manipulation", "economy", "enabler"],
    trigger: "hand is a Straight containing an Ace",
    scaling: "conditional",
    hands: ["straight", "straight_flush"], archetypes: ["straight", "economy_snowball"], stage: ["mid"],
    economy: "med", consistency: "med",
    partners: ["scholar", "drunkard", "eight_ball", "fortune_teller"],
    antiSynergies: [],
    setupDifficulty: "med", risk: "low",
    notes: "Ace-straight hands generate free Tarots every time. Combine with Scholar so the Ace also delivers chips and mult on the same play.",
    beginner: "Play a Straight that includes an Ace to generate a free Tarot card. Good for upgrading your deck for free."
  },

  // ── 42. To Do List ────────────────────────────────────────────────────────
  {
    id: "to_do_list",
    name: "To Do List",
    rarity: "common",
    summary: "Earn $4 if poker hand matches the current target hand. Target changes each round.",
    mainRole: "economy",
    tags: ["economy", "consistency"],
    trigger: "played hand matches rotating target",
    scaling: "conditional",
    hands: ["any"], archetypes: ["economy_snowball"], stage: ["early", "mid"],
    economy: "high", consistency: "med",
    partners: ["golden_joker", "satellite", "chaos_the_clown"],
    antiSynergies: [],
    setupDifficulty: "med", risk: "low",
    notes: "Reliable income when the target aligns with your build. Chaos the Clown rerolls help bridge rounds where the target diverges from your hand preference.",
    beginner: "Earn $4 whenever you play the target hand. The target changes each round — play flexibly to catch it often."
  },

  // ── 43. Cavendish ─────────────────────────────────────────────────────────
  {
    id: "cavendish",
    name: "Cavendish",
    rarity: "common",
    summary: "X3 Mult. 1 in 1000 chance to be destroyed at the end of round.",
    mainRole: "xmult",
    tags: ["xmult", "payoff"],
    trigger: "every scored hand",
    scaling: "static",
    hands: ["any"], archetypes: ["high_card", "face_card", "flush"], stage: ["mid", "late"],
    economy: "low", consistency: "high",
    partners: ["blueprint", "brainstorm", "hologram"],
    antiSynergies: [],
    setupDifficulty: "high", risk: "med",
    notes: "Unlocks only after Gros Michel has been destroyed in the run. Cheap premium X3 Mult with near-zero destruction risk — always keep it.",
    beginner: "Massive X3 multiplier that almost never breaks. Available only after Gros Michel dies in your run."
  },

  // ── 44. Red Card ─────────────────────────────────────────────────────────
  {
    id: "red_card",
    name: "Red Card",
    rarity: "common",
    summary: "This Joker gains +3 Mult when any Booster Pack is skipped.",
    mainRole: "flat_mult",
    secondaryRole: "scaling_engine",
    tags: ["flat_mult", "scaling_engine"],
    trigger: "Booster Pack skipped",
    scaling: "linear",
    hands: ["any"], archetypes: ["high_card", "economy_snowball"], stage: ["mid", "late"],
    economy: "low", consistency: "med",
    partners: ["blueprint", "brainstorm"],
    antiSynergies: [],
    setupDifficulty: "med", risk: "low",
    notes: "Skip Booster Packs you don't need to stack Mult cheaply. Grows reliably in money-hungry runs where budget is tight and packs would be wasteful.",
    beginner: "Every time you skip a Booster Pack in the shop, this gains +3 Mult. Skip packs you don't need."
  },

  // ── 45. Square Joker ──────────────────────────────────────────────────────
  {
    id: "square_joker",
    name: "Square Joker",
    rarity: "common",
    summary: "This Joker gains +4 Chips if played hand has exactly 4 cards.",
    mainRole: "chips",
    secondaryRole: "scaling_engine",
    tags: ["chips", "scaling_engine"],
    trigger: "hand played with exactly 4 cards",
    scaling: "linear",
    hands: ["high_card", "pair", "two_pair", "three_of_a_kind", "flush", "straight"], archetypes: ["high_card", "straight"], stage: ["mid", "late"],
    economy: "low", consistency: "med",
    partners: ["blueprint", "brainstorm", "half_joker"],
    antiSynergies: [],
    setupDifficulty: "med", risk: "low",
    notes: "Rewards exact 4-card plays permanently. Half Joker rewards ≤3-card plays so they conflict; pick one card-count strategy.",
    beginner: "Play exactly 4 cards each hand to grow this Joker's chips. Consistent in Four Fingers builds."
  },

  // ── 46. Riff-Raff ────────────────────────────────────────────────────────
  {
    id: "riff_raff",
    name: "Riff-Raff",
    rarity: "common",
    summary: "When Blind is selected, create 2 Common Jokers (must have room).",
    mainRole: "deck_growth",
    secondaryRole: "economy",
    tags: ["deck_growth", "economy", "enabler"],
    trigger: "blind selected",
    scaling: "conditional",
    hands: ["any"], archetypes: ["economy_snowball"], stage: ["early", "mid"],
    economy: "med", consistency: "high",
    partners: ["abstract_joker", "chaos_the_clown", "showman"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "Free Joker slots are the scarcest resource in the game. Riff-Raff fills them without spending money; pairs with Abstract Joker whose mult scales with Joker count.",
    beginner: "Generates 2 free Common Jokers every time you enter a Blind. Keep Joker slots open to catch them."
  },

  // ── 47. Photograph ────────────────────────────────────────────────────────
  {
    id: "photograph",
    name: "Photograph",
    rarity: "common",
    summary: "First played face card gives X2 Mult when scored.",
    mainRole: "xmult",
    secondaryRole: "rank_face_support",
    tags: ["xmult", "rank_face_support", "payoff"],
    trigger: "first scored face card per hand",
    scaling: "conditional",
    hands: ["any"], archetypes: ["face_card"], stage: ["early", "mid"],
    economy: "low", consistency: "med",
    partners: ["pareidolia", "sock_and_buskin", "triboulet", "hanging_chad"],
    antiSynergies: ["ride_the_bus"],
    setupDifficulty: "low", risk: "low",
    notes: "Fires once per hand but X2 is a strong early multiplier. Sock and Buskin retriggers the same face card, letting Photograph proc a second time via the retrigger.",
    beginner: "The first face card you score each hand gives X2 Mult. Cheap XMult boost in any face-card build."
  },

  // ── 48. Reserved Parking ─────────────────────────────────────────────────
  {
    id: "reserved_parking",
    name: "Reserved Parking",
    rarity: "common",
    summary: "Each face card held in hand has a 1 in 2 chance to give $1.",
    mainRole: "economy",
    secondaryRole: "rank_face_support",
    tags: ["economy", "rank_face_support", "held_in_hand"],
    trigger: "held-in-hand phase (face cards)",
    scaling: "linear",
    hands: ["any"], archetypes: ["face_card", "economy_snowball", "held_in_hand"], stage: ["early", "mid"],
    economy: "high", consistency: "med",
    partners: ["pareidolia", "business_card", "midas_mask", "golden_joker"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "Passive face-card income from held cards — the bigger your hand and the more face cards you hold, the more it pays. Best with Pareidolia.",
    beginner: "Face cards you hold (not play) have a 50% chance to give you $1 each. Hold more face cards."
  },

  // ── 49. Mail-In Rebate ────────────────────────────────────────────────────
  {
    id: "mail_in_rebate",
    name: "Mail-In Rebate",
    rarity: "common",
    summary: "Earn $5 for each discarded card of a specific rank. Rank changes every round.",
    mainRole: "economy",
    secondaryRole: "discard_support",
    tags: ["economy", "discard_support"],
    trigger: "discard matching rank",
    scaling: "linear",
    hands: ["any"], archetypes: ["discard", "economy_snowball"], stage: ["early", "mid"],
    economy: "high", consistency: "med",
    partners: ["drunkard", "faceless_joker", "delayed_gratification"],
    antiSynergies: ["green_joker", "mystic_summit"],
    setupDifficulty: "low", risk: "low",
    notes: "The rank resets each round, so income consistency depends on deck composition. Drunkard adds extra discards for more income triggers. Conflicts with discard-averse builds.",
    beginner: "Discarding the target rank earns $5 per card. More discards = more money."
  },

  // ── 50. Hallucination ────────────────────────────────────────────────────
  {
    id: "hallucination",
    name: "Hallucination",
    rarity: "common",
    summary: "1 in 2 chance to create a Tarot card when any Booster Pack is opened (must have room).",
    mainRole: "economy",
    secondaryRole: "deck_manipulation",
    tags: ["economy", "deck_manipulation", "enabler"],
    trigger: "Booster Pack opened (50% chance)",
    scaling: "conditional",
    hands: ["any"], archetypes: ["economy_snowball", "deck_growth"], stage: ["early", "mid"],
    economy: "med", consistency: "med",
    partners: ["eight_ball", "fortune_teller", "perkeo", "superposition"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "Free Tarots on every pack opening effectively add value to every pack purchase. Synergises with Fortune Teller whose mult grows per Tarot used.",
    beginner: "Opening any Booster Pack has a 50% chance to give you a free Tarot card. Buy packs more often."
  },

  // ── 51. Fortune Teller ────────────────────────────────────────────────────
  {
    id: "fortune_teller",
    name: "Fortune Teller",
    rarity: "common",
    summary: "+1 Mult per Tarot card used this run.",
    mainRole: "flat_mult",
    secondaryRole: "scaling_engine",
    tags: ["flat_mult", "scaling_engine"],
    trigger: "every scored hand",
    scaling: "linear",
    hands: ["any"], archetypes: ["economy_snowball", "deck_growth"], stage: ["mid", "late"],
    economy: "low", consistency: "high",
    partners: ["hallucination", "eight_ball", "superposition", "perkeo"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "Permanent flat mult from natural Tarot usage. Pairs with any Tarot generation source. In Tarot-heavy runs this easily reaches +20 or more Mult.",
    beginner: "Every Tarot card you use permanently adds +1 Mult. Use lots of Tarots to make it grow."
  },

  // ── 52. Juggler ───────────────────────────────────────────────────────────
  {
    id: "juggler",
    name: "Juggler",
    rarity: "common",
    summary: "+1 hand size.",
    mainRole: "hand_size",
    tags: ["hand_size", "enabler", "consistency"],
    trigger: "passive",
    scaling: "static",
    hands: ["any"], archetypes: ["held_in_hand", "flush", "straight"], stage: ["early", "mid"],
    economy: "low", consistency: "high",
    partners: ["baron", "mime", "shoot_the_moon", "troubadour"],
    antiSynergies: ["stuntman"],
    setupDifficulty: "low", risk: "low",
    notes: "Extra hand size improves every held-in-hand build and raises flush/straight assembly odds. Stacks with Troubadour but conflicts with Stuntman.",
    beginner: "Gives you one extra card each hand. Helps you find better hands and holds for in-hand Jokers."
  },

  // ── 53. Drunkard ──────────────────────────────────────────────────────────
  {
    id: "drunkard",
    name: "Drunkard",
    rarity: "common",
    summary: "+1 discard each round.",
    mainRole: "discard_support",
    tags: ["discard_support", "enabler"],
    trigger: "passive",
    scaling: "static",
    hands: ["any"], archetypes: ["discard", "flush", "straight"], stage: ["early", "mid"],
    economy: "low", consistency: "high",
    partners: ["faceless_joker", "mail_in_rebate", "green_joker", "banner", "delayed_gratification"],
    antiSynergies: ["green_joker"],
    setupDifficulty: "low", risk: "low",
    notes: "Cheap enabler for every discard-based strategy. Note the antiSynergy with Green Joker only applies if you actually use the extra discard — Delayed Gratification flips this.",
    beginner: "Gives you one more discard every round. Helps you find the cards you need."
  },

  // ── 54. Golden Joker ──────────────────────────────────────────────────────
  {
    id: "golden_joker",
    name: "Golden Joker",
    rarity: "common",
    summary: "Earn $4 at end of round.",
    mainRole: "economy",
    tags: ["economy", "consistency"],
    trigger: "end of round",
    scaling: "static",
    hands: ["any"], archetypes: ["economy_snowball"], stage: ["early", "mid", "late"],
    economy: "high", consistency: "high",
    partners: ["midas_mask", "faceless_joker", "mail_in_rebate", "satellite", "to_the_moon"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "Steady passive income every round. Helps maintain interest cap and funds the rest of the economy cluster.",
    beginner: "Earns you $4 at the end of every round automatically. One of the safest Jokers in the game."
  },

  // ── 55. Popcorn ───────────────────────────────────────────────────────────
  {
    id: "popcorn",
    name: "Popcorn",
    rarity: "common",
    summary: "+20 Mult. Loses −4 Mult per round played.",
    mainRole: "flat_mult",
    tags: ["flat_mult", "payoff"],
    trigger: "every scored hand",
    scaling: "static",
    hands: ["any"], archetypes: ["high_card", "pair", "flush"], stage: ["early", "mid"],
    economy: "low", consistency: "high",
    partners: ["blueprint", "brainstorm"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "med",
    notes: "Strong early mult that decays 4 per round — sell or replace when it falls below your next option. At 5 rounds it drops to 0 and becomes dead weight.",
    beginner: "Starts at +20 Mult but drops by 4 each round. Sell it before it runs out."
  },

  // ── 56. Walkie Talkie ────────────────────────────────────────────────────
  {
    id: "walkie_talkie",
    name: "Walkie Talkie",
    rarity: "common",
    summary: "Each played 10 or 4 gives +10 Chips and +4 Mult when scored.",
    mainRole: "flat_mult",
    secondaryRole: "chips",
    tags: ["flat_mult", "chips", "rank_face_support"],
    trigger: "scored 10 or 4",
    scaling: "linear",
    hands: ["pair", "two_pair", "flush", "straight", "any"], archetypes: ["pair", "straight"], stage: ["early", "mid"],
    economy: "low", consistency: "high",
    partners: ["even_steven", "splash", "blueprint", "brainstorm"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "Dual chip+mult on two common ranks. Stacks very well with Even Steven (which covers 10 and 4) and Splash (all played cards score).",
    beginner: "10s and 4s give you both Chips and Mult when scored. Load up on 10s and 4s."
  },

  // ── 57. Smiley Face ───────────────────────────────────────────────────────
  {
    id: "smiley_face",
    name: "Smiley Face",
    rarity: "common",
    summary: "Played face cards give +5 Mult when scored.",
    mainRole: "flat_mult",
    secondaryRole: "rank_face_support",
    tags: ["flat_mult", "rank_face_support", "payoff"],
    trigger: "scored face card",
    scaling: "linear",
    hands: ["any"], archetypes: ["face_card"], stage: ["early", "mid"],
    economy: "low", consistency: "med",
    partners: ["pareidolia", "sock_and_buskin", "scary_face", "photograph"],
    antiSynergies: ["ride_the_bus"],
    setupDifficulty: "low", risk: "low",
    notes: "Mult companion to Scary Face. With Pareidolia active every scored card yields +5 Mult — the face-card package becomes a reliable mult engine.",
    beginner: "Face cards give +5 Mult each when scored. Pair with Scary Face for both Chips and Mult on face cards."
  },

  // ── 58. Golden Ticket ────────────────────────────────────────────────────
  {
    id: "golden_ticket",
    name: "Golden Ticket",
    rarity: "common",
    summary: "Played Gold cards earn $4 when scored.",
    mainRole: "economy",
    secondaryRole: "enhancement_interaction",
    tags: ["economy", "enhancement_interaction"],
    trigger: "scored Gold card",
    scaling: "linear",
    hands: ["any"], archetypes: ["economy_snowball", "face_card"], stage: ["early", "mid"],
    economy: "high", consistency: "med",
    partners: ["midas_mask", "golden_joker", "pareidolia", "business_card"],
    antiSynergies: [],
    setupDifficulty: "med", risk: "low",
    notes: "Midas Mask converts every scored face card to Gold, turning Golden Ticket into passive income that fires with every face card you play. Requires Gold cards in the deck.",
    beginner: "Gold cards you play earn $4. Combine with Midas Mask which turns face cards into Gold as you play them."
  },

  // ── 59. Swashbuckler ─────────────────────────────────────────────────────
  {
    id: "swashbuckler",
    name: "Swashbuckler",
    rarity: "common",
    summary: "Adds the sell value of all other owned Jokers to Mult.",
    mainRole: "flat_mult",
    secondaryRole: "scaling_engine",
    tags: ["flat_mult", "scaling_engine", "economy"],
    trigger: "every scored hand",
    scaling: "linear",
    hands: ["any"], archetypes: ["economy_snowball", "high_card"], stage: ["mid", "late"],
    economy: "low", consistency: "high",
    partners: ["egg", "gift_card", "blueprint", "brainstorm"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "Converts Joker sell value directly into Mult. Egg's growing sell value and Gift Card's cumulative value increases make Swashbuckler scale passively over the run.",
    beginner: "Converts the combined sell value of your other Jokers into flat Mult. Hold Egg to inflate it."
  },

  // ── 60. Hanging Chad ──────────────────────────────────────────────────────
  {
    id: "hanging_chad",
    name: "Hanging Chad",
    rarity: "common",
    summary: "Retrigger first played card used in scoring 2 additional times.",
    mainRole: "retrigger",
    tags: ["retrigger", "scaling_engine"],
    trigger: "first scored card of the hand",
    scaling: "linear",
    hands: ["any"], archetypes: ["retrigger_engine", "face_card"], stage: ["mid", "late"],
    economy: "low", consistency: "high",
    partners: ["sock_and_buskin", "the_idol", "triboulet", "blueprint", "brainstorm"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "Triples the first scoring card's payoff — arrange your hand so the highest-payoff card leads. If that card is an Idol target it fires three X2 procs.",
    beginner: "Your first scoring card activates three times instead of once. Put your best card first."
  },

  // ── 61. Shoot the Moon ────────────────────────────────────────────────────
  {
    id: "shoot_the_moon",
    name: "Shoot the Moon",
    rarity: "common",
    summary: "Each Queen held in hand gives +13 Mult.",
    mainRole: "flat_mult",
    secondaryRole: "held_in_hand",
    tags: ["flat_mult", "held_in_hand", "payoff"],
    trigger: "held-in-hand phase",
    scaling: "linear",
    hands: ["any"], archetypes: ["held_in_hand", "face_card"], stage: ["mid"],
    economy: "low", consistency: "med",
    partners: ["mime", "baron", "midas_mask", "triboulet"],
    antiSynergies: [],
    setupDifficulty: "med", risk: "low",
    notes: "Best as support in Baron builds where Queens are already held. Mime doubles the Queen trigger, giving +26 Mult per held Queen.",
    beginner: "Every Queen you keep in hand (don't play) gives +13 Mult. Hold Queens, play everything else."
  },

  // ════════════════════════════════════════════════════════════════
  // UNCOMMON (64)
  // ════════════════════════════════════════════════════════════════
  // ── 1 ──────────────────────────────────────────────────────────────────────
  {
    id: "joker_stencil",
    name: "Joker Stencil",
    rarity: "uncommon",
    summary: "X1 Mult for each empty Joker slot (Joker Stencil included).",
    mainRole: "xmult",
    secondaryRole: "enabler",
    tags: ["xmult", "enabler", "payoff"],
    trigger: "every scored hand",
    scaling: "conditional",
    hands: ["any"], archetypes: ["economy_snowball", "high_card"], stage: ["early", "mid"],
    economy: "low", consistency: "med",
    partners: ["blueprint", "brainstorm", "diet_cola"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "med",
    notes: "Paradoxical: it rewards having fewer Jokers. Running a lean 1-Joker setup (Stencil alone) gives X5; every additional Joker drops the multiplier. Best used as a powerful early piece before the build is assembled, then sold once slots fill.",
    beginner: "The fewer Jokers you have, the bigger the multiplier. Strong when you're still building your deck."
  },
  // ── 2 ──────────────────────────────────────────────────────────────────────
  {
    id: "four_fingers",
    name: "Four Fingers",
    rarity: "uncommon",
    summary: "All Flushes and Straights can be made with 4 cards.",
    mainRole: "enabler",
    secondaryRole: "consistency",
    tags: ["enabler", "consistency", "suit_support"],
    trigger: "passive",
    scaling: "static",
    hands: ["flush", "straight", "straight_flush"], archetypes: ["flush", "straight"], stage: ["early", "mid", "late"],
    economy: "low", consistency: "high",
    partners: ["smeared_joker", "shortcut", "hack", "blueprint", "brainstorm"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "Fundamentally alters hand construction. Combines devastatingly with Shortcut (4-card gapped straights) and Smeared (4-card flushes from two-suit decks). Frees a hand slot for a held-in-hand piece.",
    beginner: "Makes flushes and straights with only 4 cards. Opens up more options for every hand."
  },
  // ── 3 ──────────────────────────────────────────────────────────────────────
  {
    id: "mime",
    name: "Mime",
    rarity: "uncommon",
    summary: "Retrigger all card held in hand abilities.",
    mainRole: "retrigger",
    secondaryRole: "held_in_hand",
    tags: ["retrigger", "held_in_hand", "scaling_engine"],
    trigger: "held-in-hand phase",
    scaling: "linear",
    hands: ["any"], archetypes: ["held_in_hand", "steel", "retrigger_engine"], stage: ["mid", "late"],
    economy: "low", consistency: "high",
    partners: ["baron", "steel_joker", "raised_fist", "shoot_the_moon"],
    antiSynergies: ["stuntman"],
    setupDifficulty: "med", risk: "low",
    notes: "Core of every Baron + Steel build. Doubles every in-hand effect — each held King pays X2.25 instead of X1.5, each Steel card delivers X2.25 instead of X1.5.",
    beginner: "Makes cards you keep in your hand trigger twice. Huge with Steel cards and Baron."
  },
  // ── 4 ──────────────────────────────────────────────────────────────────────
  {
    id: "ceremonial_dagger",
    name: "Ceremonial Dagger",
    rarity: "uncommon",
    summary: "When Blind is selected, destroy the Joker to the right and permanently add double its sell value to Mult.",
    mainRole: "flat_mult",
    secondaryRole: "destroy_value",
    tags: ["flat_mult", "destroy_value", "scaling_engine"],
    trigger: "blind selection",
    scaling: "linear",
    hands: ["any"], archetypes: ["economy_snowball", "high_card"], stage: ["early", "mid"],
    economy: "low", consistency: "med",
    partners: ["egg", "swashbuckler", "blueprint", "campfire"],
    antiSynergies: [],
    setupDifficulty: "med", risk: "med",
    notes: "Position Ceremonial Dagger to the left of a Joker you plan to cycle (e.g., Egg, a cheap filler). Each consumed Joker's sell value doubles before conversion — Egg yields +$6 Mult per blind. Plan the sacrifice deliberately.",
    beginner: "Destroys the Joker to its right and adds double its value as flat Mult. Feed it cheap or expired Jokers."
  },
  // ── 5 ──────────────────────────────────────────────────────────────────────
  {
    id: "marble_joker",
    name: "Marble Joker",
    rarity: "uncommon",
    summary: "Adds one Stone card to the deck when Blind is selected.",
    mainRole: "deck_manipulation",
    secondaryRole: "enhancement_interaction",
    tags: ["deck_manipulation", "enhancement_interaction", "deck_growth"],
    trigger: "blind selection",
    scaling: "linear",
    hands: ["any"], archetypes: ["deck_growth", "high_card"], stage: ["mid", "late"],
    economy: "low", consistency: "high",
    partners: ["stone_joker", "driver_gloves", "blueprint", "brainstorm"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "Slowly inflates Stone count — every blind (including skipped) adds one. Stone cards contribute +25 Chips to Stone Joker and count toward Driver's License thresholds. Passive and low-maintenance.",
    beginner: "Adds a Stone card to your deck every blind. Fuels Stone Joker chip builds passively."
  },
  // ── 6 ──────────────────────────────────────────────────────────────────────
  {
    id: "loyalty_card",
    name: "Loyalty Card",
    rarity: "uncommon",
    summary: "X4 Mult every 6 hands played.",
    mainRole: "xmult",
    secondaryRole: "payoff",
    tags: ["xmult", "payoff", "consistency"],
    trigger: "every 6th hand played",
    scaling: "multiplicative",
    hands: ["any"], archetypes: ["high_card", "flush", "straight"], stage: ["mid", "late"],
    economy: "low", consistency: "med",
    partners: ["blueprint", "brainstorm", "green_joker", "acrobat"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "med",
    notes: "Requires a patience cycle — 5 dry hands then one massive X4. Track the counter and time your hands-per-round so the payoff fires on your hardest hand. Blueprint can copy the X4 on the trigger turn.",
    beginner: "Every 6th hand gives a giant X4 multiplier. Plan your plays so the big hand lands on a tough blind."
  },
  // ── 7 ──────────────────────────────────────────────────────────────────────
  {
    id: "dusk",
    name: "Dusk",
    rarity: "uncommon",
    summary: "Retrigger all played cards in the final hand of the round.",
    mainRole: "retrigger",
    secondaryRole: "payoff",
    tags: ["retrigger", "payoff", "scaling_engine"],
    trigger: "final hand of round",
    scaling: "conditional",
    hands: ["any"], archetypes: ["retrigger_engine", "face_card", "flush"], stage: ["mid", "late"],
    economy: "low", consistency: "high",
    partners: ["the_idol", "triboulet", "sock_and_buskin", "blueprint", "brainstorm"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "Effectively a one-shot Seltzer on demand each round. Best in builds that need only a single explosive hand rather than sustained output — play defensively first, then unleash on the final hand.",
    beginner: "Your last hand each round triggers every card twice. Save your best hand for last."
  },
  // ── 8 ──────────────────────────────────────────────────────────────────────
  {
    id: "fibonacci",
    name: "Fibonacci",
    rarity: "uncommon",
    summary: "Each played Ace, 2, 3, 5, or 8 gives +8 Mult when scored.",
    mainRole: "flat_mult",
    secondaryRole: "rank_face_support",
    tags: ["flat_mult", "rank_face_support", "payoff"],
    trigger: "scored rank match",
    scaling: "linear",
    hands: ["pair", "two_pair", "straight", "flush"], archetypes: ["straight", "high_card"], stage: ["early", "mid"],
    economy: "low", consistency: "high",
    partners: ["hack", "blueprint", "brainstorm", "seltzer"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "Free flat mult on five common ranks that span most hand types. Hack doubles triggers on 2, 3, and 5 — those three overlap perfectly. Consistent throughout the run.",
    beginner: "Common low-rank cards give extra Mult. Hard to go wrong early."
  },
  // ── 9 ──────────────────────────────────────────────────────────────────────
  {
    id: "steel_joker",
    name: "Steel Joker",
    rarity: "uncommon",
    summary: "Gives X0.2 Mult for each Steel card in your full deck.",
    mainRole: "xmult",
    secondaryRole: "enhancement_interaction",
    tags: ["xmult", "enhancement_interaction", "scaling_engine"],
    trigger: "every scored hand",
    scaling: "exponential",
    hands: ["any"], archetypes: ["steel", "held_in_hand"], stage: ["mid", "late"],
    economy: "low", consistency: "high",
    partners: ["mime", "baron", "stone_joker", "blueprint", "brainstorm"],
    antiSynergies: ["vampire"],
    setupDifficulty: "med", risk: "low",
    notes: "Counts Steel cards even if they're held in hand during scoring. Stack Steel via Tarots; 5 Steel cards = X2 Mult which is already a strong floor, with no cap.",
    beginner: "Steel cards in your deck multiply your score. Add as many as possible via Tarot cards."
  },
  // ── 10 ─────────────────────────────────────────────────────────────────────
  {
    id: "hack",
    name: "Hack",
    rarity: "uncommon",
    summary: "Retrigger each played 2, 3, 4, or 5.",
    mainRole: "retrigger",
    secondaryRole: "rank_face_support",
    tags: ["retrigger", "rank_face_support"],
    trigger: "scored low rank",
    scaling: "linear",
    hands: ["any"], archetypes: ["straight", "glass", "retrigger_engine"], stage: ["mid"],
    economy: "low", consistency: "med",
    partners: ["fibonacci", "glass_joker", "blueprint", "brainstorm", "four_fingers"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "Doubles low-card payoffs and breaks Glass twice as fast. Three of five Fibonacci ranks (2, 3, 5) overlap with Hack, making the pairing one of the most efficient in the game.",
    beginner: "Low cards (2–5) trigger twice. Combine with Glass to crack faster."
  },
  // ── 11 ─────────────────────────────────────────────────────────────────────
  {
    id: "pareidolia",
    name: "Pareidolia",
    rarity: "uncommon",
    summary: "All cards are considered face cards.",
    mainRole: "enabler",
    secondaryRole: "rank_face_support",
    tags: ["enabler", "rank_face_support"],
    trigger: "passive",
    scaling: "static",
    hands: ["any"], archetypes: ["face_card"], stage: ["mid", "late"],
    economy: "low", consistency: "high",
    partners: ["sock_and_buskin", "triboulet", "midas_mask"],
    antiSynergies: ["greedy_joker", "wrathful_joker", "ride_the_bus"],
    setupDifficulty: "med", risk: "med",
    notes: "Breaks face-card builds wide open but hard-blocks suit-specific Jokers by flooding everything into face-card status. Midas Mask becomes perpetual income since every scored card turns Gold.",
    beginner: "Treats every card as a face card. Massive face-card payoffs become trivial — but drop Greedy/Wrathful first."
  },
  // ── 12 ─────────────────────────────────────────────────────────────────────
  {
    id: "space_joker",
    name: "Space Joker",
    rarity: "uncommon",
    summary: "1 in 4 chance to upgrade level of played poker hand.",
    mainRole: "consistency",
    secondaryRole: "scaling_engine",
    tags: ["consistency", "scaling_engine", "enabler"],
    trigger: "every scored hand (probabilistic)",
    scaling: "linear",
    hands: ["any"], archetypes: ["flush", "straight", "high_card"], stage: ["early", "mid"],
    economy: "low", consistency: "med",
    partners: ["constellation", "satellite", "astronomer", "oops_all_6s"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "Free hand-level upgrades accelerate chip/mult base values independent of shop. Oops! All 6s doubles this to 50% chance per hand, making Space Joker a reliable levelling engine.",
    beginner: "25% chance each hand to level up your poker hand for free. Just keep playing."
  },
  // ── 13 ─────────────────────────────────────────────────────────────────────
  {
    id: "burglar",
    name: "Burglar",
    rarity: "uncommon",
    summary: "When Blind is selected, gain +3 Hands and lose all discards.",
    mainRole: "hand_size",
    secondaryRole: "discard_support",
    tags: ["hand_size", "discard_support", "pivot"],
    trigger: "blind selection",
    scaling: "static",
    hands: ["any"], archetypes: ["flush", "straight", "high_card"], stage: ["early", "mid"],
    economy: "low", consistency: "high",
    partners: ["green_joker", "loyalty_card", "acrobat", "mystic_summit"],
    antiSynergies: ["drunkard", "merry_andy", "mail_in_rebate"],
    setupDifficulty: "low", risk: "med",
    notes: "Trading discards for hands rewards builds that play clean — Green Joker thrives since discards penalise it, and extra hands let Loyalty Card's counter tick faster. Mystic Summit fires immediately since you start with zero discards.",
    beginner: "You get 3 extra hands each blind but no discards. Great if you rarely discard anyway."
  },
  // ── 14 ─────────────────────────────────────────────────────────────────────
  {
    id: "blackboard",
    name: "Blackboard",
    rarity: "uncommon",
    summary: "X3 Mult if all cards held in hand are Spades or Clubs.",
    mainRole: "xmult",
    secondaryRole: "held_in_hand",
    tags: ["xmult", "held_in_hand", "payoff", "suit_support"],
    trigger: "held-in-hand phase when condition met",
    scaling: "conditional",
    hands: ["any"], archetypes: ["held_in_hand", "flush"], stage: ["mid", "late"],
    economy: "low", consistency: "med",
    partners: ["smeared_joker", "blueprint", "brainstorm", "arrowhead", "onyx_agate"],
    antiSynergies: [],
    setupDifficulty: "med", risk: "med",
    notes: "Smeared Joker is the critical unlock — it merges Spades and Clubs, allowing Blackboard's X3 to fire with any dark-suit hand. Thin Hearts and Diamonds from your deck to maximise reliability.",
    beginner: "Massive X3 if every card in your hand is black-suited. Run only Spades and Clubs."
  },
  // ── 15 ─────────────────────────────────────────────────────────────────────
  {
    id: "sixth_sense",
    name: "Sixth Sense",
    rarity: "uncommon",
    summary: "If the first hand of round is a single 6, destroy it and create a Spectral card.",
    mainRole: "deck_manipulation",
    secondaryRole: "consistency",
    tags: ["deck_manipulation", "consistency", "enabler"],
    trigger: "first hand single 6",
    scaling: "static",
    hands: ["high_card"], archetypes: ["deck_growth", "discard"], stage: ["early", "mid"],
    economy: "low", consistency: "med",
    partners: ["perkeo", "dna", "blueprint", "showman"],
    antiSynergies: [],
    setupDifficulty: "med", risk: "low",
    notes: "A consistent Spectral factory across the run — one per round if you can lead with a 6. Removes the 6 from your deck, thinning it while generating Spectrals. Showman lets Spectrals appear in duplicate.",
    beginner: "Play a single 6 as your first hand to destroy it and get a Spectral card. Thins your deck too."
  },
  // ── 16 ─────────────────────────────────────────────────────────────────────
  {
    id: "constellation",
    name: "Constellation",
    rarity: "uncommon",
    summary: "This Joker gains X0.1 Mult every time a Planet card is used.",
    mainRole: "xmult",
    secondaryRole: "scaling_engine",
    tags: ["xmult", "scaling_engine"],
    trigger: "planet used",
    scaling: "exponential",
    hands: ["any"], archetypes: ["retrigger_engine", "flush"], stage: ["mid", "late"],
    economy: "low", consistency: "high",
    partners: ["blueprint", "brainstorm", "satellite", "astronomer", "astronomer"],
    antiSynergies: [],
    setupDifficulty: "med", risk: "low",
    notes: "Quiet engine that compounds across the run. Buy every Planet you see; Astronomer makes them free and Planet Merchant doubles their appearance. Late-game Constellation values of X3–X6 are common in dedicated builds.",
    beginner: "Using Planet cards permanently boosts this. Hoard Planets and it snowballs."
  },
  // ── 17 ─────────────────────────────────────────────────────────────────────
  {
    id: "hiker",
    name: "Hiker",
    rarity: "uncommon",
    summary: "Every played card permanently gains +5 Chips when scored.",
    mainRole: "chips",
    secondaryRole: "deck_growth",
    tags: ["chips", "deck_growth", "scaling_engine"],
    trigger: "every scored card",
    scaling: "linear",
    hands: ["flush", "straight", "any"], archetypes: ["deck_growth", "high_card"], stage: ["mid", "late"],
    economy: "low", consistency: "high",
    partners: ["blueprint", "brainstorm", "dna", "seltzer"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "Permanently upgrades your entire deck's chip value over time. Plays well alongside high-frequency hand types that score many cards per hand (Flush, Straight). DNA duplication makes the permanent buff apply to both copies.",
    beginner: "Every card you score gets +5 chips forever. Plays more hands = permanently bigger deck."
  },
  // ── 18 ─────────────────────────────────────────────────────────────────────
  {
    id: "card_sharp",
    name: "Card Sharp",
    rarity: "uncommon",
    summary: "X3 Mult if the played poker hand has already been played this round.",
    mainRole: "xmult",
    secondaryRole: "payoff",
    tags: ["xmult", "payoff", "consistency"],
    trigger: "repeated hand type this round",
    scaling: "conditional",
    hands: ["flush", "straight", "pair", "two_pair", "full_house"], archetypes: ["flush", "straight", "pair"], stage: ["mid", "late"],
    economy: "low", consistency: "high",
    partners: ["blueprint", "brainstorm", "loyalty_card", "green_joker", "acrobat"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "Once you play a hand twice in the same round, all subsequent same-hand plays get X3. The condition is trivially met in 3-hand rounds. Works best with builds that always repeat the same hand type (Flush, Pair).",
    beginner: "Play the same hand type twice in a round and the second time onwards gets X3 Mult. Easy to trigger."
  },
  // ── 19 ─────────────────────────────────────────────────────────────────────
  {
    id: "madness",
    name: "Madness",
    rarity: "uncommon",
    summary: "When Small or Big Blind is selected, gain X0.5 Mult and destroy a random Joker.",
    mainRole: "xmult",
    secondaryRole: "destroy_value",
    tags: ["xmult", "destroy_value", "scaling_engine"],
    trigger: "small/big blind selection",
    scaling: "multiplicative",
    hands: ["any"], archetypes: ["high_card", "flush", "economy_snowball"], stage: ["mid", "late"],
    economy: "low", consistency: "med",
    partners: ["blueprint", "brainstorm", "joker_stencil"],
    antiSynergies: [],
    setupDifficulty: "med", risk: "high",
    notes: "Grows X0.5 per non-boss blind but randomly destroys one of your other Jokers each time. Keep your Joker slot count low (2–3 total) so you control the selection pool; Joker Stencil becomes explosive once slots empty.",
    beginner: "Gets stronger each blind but destroys a random Joker. Keep fewer Jokers to stay in control."
  },
  // ── 20 ─────────────────────────────────────────────────────────────────────
  {
    id: "seance",
    name: "Séance",
    rarity: "uncommon",
    summary: "If poker hand is a Straight Flush, create a random Spectral card.",
    mainRole: "deck_manipulation",
    secondaryRole: "consistency",
    tags: ["deck_manipulation", "consistency", "enabler"],
    trigger: "Straight Flush scored",
    scaling: "static",
    hands: ["straight_flush"], archetypes: ["straight", "flush", "deck_growth"], stage: ["mid", "late"],
    economy: "low", consistency: "med",
    partners: ["four_fingers", "smeared_joker", "shortcut", "blueprint", "showman"],
    antiSynergies: [],
    setupDifficulty: "high", risk: "med",
    notes: "Straight Flush is hard to hit naturally, but Four Fingers + Shortcut reduces it to a 4-card gapped hand. Once enabled, Séance generates powerful Spectrals every round, potentially including Wraith (Negative Joker copies).",
    beginner: "Score a Straight Flush to get a free Spectral card. Use Four Fingers to make it easier."
  },
  // ── 21 ─────────────────────────────────────────────────────────────────────
  {
    id: "vampire",
    name: "Vampire",
    rarity: "uncommon",
    summary: "This Joker gains X0.1 Mult per scoring Enhanced card played, removes card Enhancement.",
    mainRole: "xmult",
    secondaryRole: "destroy_value",
    tags: ["xmult", "destroy_value", "enhancement_interaction", "scaling_engine"],
    trigger: "scored enhanced card",
    scaling: "exponential",
    hands: ["any"], archetypes: ["deck_growth", "steel", "glass"], stage: ["mid", "late"],
    economy: "low", consistency: "med",
    partners: ["smeared_joker", "hack", "blueprint", "brainstorm"],
    antiSynergies: ["steel_joker", "stone_joker", "glass_joker", "driver_gloves"],
    setupDifficulty: "med", risk: "high",
    notes: "Eats your own enhancements to grow. Conflicts badly with any Joker that scales off maintained enhancements. Commit fully — load the deck with cheap Mult/Bonus enhancements, let Vampire devour them, then coast on the accumulated XMult.",
    beginner: "Consumes enhanced cards to grow bigger. Don't pair with Steel/Glass/Stone payoff Jokers."
  },
  // ── 22 ─────────────────────────────────────────────────────────────────────
  {
    id: "shortcut",
    name: "Shortcut",
    rarity: "uncommon",
    summary: "Allows Straights to be made with gaps of 1 rank (e.g. 10 8 6 5 3).",
    mainRole: "enabler",
    secondaryRole: "consistency",
    tags: ["enabler", "consistency", "suit_support"],
    trigger: "passive",
    scaling: "static",
    hands: ["straight", "straight_flush"], archetypes: ["straight"], stage: ["early", "mid", "late"],
    economy: "low", consistency: "high",
    partners: ["four_fingers", "seance", "drunkard", "blueprint", "brainstorm"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "Dramatically lowers the assembly cost for Straights. Combined with Four Fingers (4-card hands), nearly any four consecutive-ish cards form a straight. Enables Séance reliably when paired with Four Fingers.",
    beginner: "Gaps in your Straight are fine now. Much easier to hit than normal Straights."
  },
  // ── 23 ─────────────────────────────────────────────────────────────────────
  {
    id: "hologram",
    name: "Hologram",
    rarity: "uncommon",
    summary: "This Joker gains X0.25 Mult every time a playing card is added to your deck.",
    mainRole: "xmult",
    secondaryRole: "deck_growth",
    tags: ["xmult", "scaling_engine", "deck_growth"],
    trigger: "card added to deck",
    scaling: "exponential",
    hands: ["any"], archetypes: ["deck_growth"], stage: ["mid", "late"],
    economy: "low", consistency: "high",
    partners: ["dna", "cavendish", "blueprint", "brainstorm", "perkeo"],
    antiSynergies: [],
    setupDifficulty: "med", risk: "low",
    notes: "Loves DNA and Standard packs. Every pack opened pushes the XMult higher. DNA duplication adds two cards per round (original + clone) and is easily the fastest Hologram accelerant available.",
    beginner: "Adding any playing card to your deck pumps this. Open lots of packs."
  },
  // ── 24 ─────────────────────────────────────────────────────────────────────
  {
    id: "cloud_9",
    name: "Cloud 9",
    rarity: "uncommon",
    summary: "Earn $1 for each 9 in your full deck at end of round.",
    mainRole: "economy",
    secondaryRole: "rank_face_support",
    tags: ["economy", "rank_face_support", "scaling_engine"],
    trigger: "end of round",
    scaling: "linear",
    hands: ["any"], archetypes: ["economy_snowball"], stage: ["early", "mid"],
    economy: "high", consistency: "high",
    partners: ["to_the_moon", "satellite", "golden_joker", "blueprint", "showman"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "Scales with deck density of 9s. A standard 52-card deck has four 9s for $4/round, but Standard packs and DNA can push this higher. Pairs cleanly with any economy engine since it fires passively.",
    beginner: "Pays you $1 per 9 in your deck every round. Add 9s to your deck for more income."
  },
  // ── 25 ─────────────────────────────────────────────────────────────────────
  {
    id: "rocket",
    name: "Rocket",
    rarity: "uncommon",
    summary: "Earn $1 at end of round. Payout increases by $2 when Boss Blind is defeated.",
    mainRole: "economy",
    secondaryRole: "scaling_engine",
    tags: ["economy", "scaling_engine"],
    trigger: "end of round / boss blind defeated",
    scaling: "linear",
    hands: ["any"], archetypes: ["economy_snowball"], stage: ["mid", "late"],
    economy: "high", consistency: "high",
    partners: ["to_the_moon", "golden_joker", "satellite", "blueprint"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "Starts small but becomes a reliable late-game income source. By Ante 8, each Boss blind beaten pushes payout to $15+. Compounds best with interest builds — use the cash to stay at the interest cap.",
    beginner: "Makes more money every time you beat a boss blind. Keep it and watch it grow."
  },
  // ── 26 ─────────────────────────────────────────────────────────────────────
  {
    id: "midas_mask",
    name: "Midas Mask",
    rarity: "uncommon",
    summary: "All played face cards become Gold cards when scored.",
    mainRole: "economy",
    secondaryRole: "enhancement_interaction",
    tags: ["economy", "enhancement_interaction", "rank_face_support"],
    trigger: "scored face card",
    scaling: "linear",
    hands: ["any"], archetypes: ["face_card", "economy_snowball"], stage: ["mid"],
    economy: "high", consistency: "med",
    partners: ["pareidolia", "sock_and_buskin", "triboulet", "golden_joker"],
    antiSynergies: [],
    setupDifficulty: "med", risk: "low",
    notes: "Converts face-card pressure into snowball income. Best with Pareidolia since every scored card qualifies. Golden Ticket Joker also pays out on Gold cards, but Midas is the simpler route to passive income.",
    beginner: "Played face cards turn Gold and pay you. Money on top of damage."
  },
  // ── 27 ─────────────────────────────────────────────────────────────────────
  {
    id: "luchador",
    name: "Luchador",
    rarity: "uncommon",
    summary: "Sell this card to disable the current Boss Blind ability.",
    mainRole: "consistency",
    secondaryRole: "pivot",
    tags: ["consistency", "pivot"],
    trigger: "sold",
    scaling: "static",
    hands: ["any"], archetypes: ["high_card", "flush"], stage: ["mid", "late"],
    economy: "low", consistency: "high",
    partners: ["blueprint", "brainstorm", "gift_card"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "One-shot Boss Blind neutraliser. Invaluable against debilitating bosses (Psychic, Needle, Cerulean Bell). Blueprint copies Luchador before selling to get the effect for free. Gift Card raises sell value, but the effect itself is the real payoff.",
    beginner: "Sell it right before a scary Boss Blind to remove its negative effect. One-time lifesaver."
  },
  // ── 28 ─────────────────────────────────────────────────────────────────────
  {
    id: "gift_card",
    name: "Gift Card",
    rarity: "uncommon",
    summary: "Add $1 of sell value to every Joker and Consumable card at end of round.",
    mainRole: "economy",
    secondaryRole: "scaling_engine",
    tags: ["economy", "scaling_engine"],
    trigger: "end of round",
    scaling: "linear",
    hands: ["any"], archetypes: ["economy_snowball"], stage: ["mid", "late"],
    economy: "high", consistency: "high",
    partners: ["luchador", "swashbuckler", "egg", "golden_joker", "satellite"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "Silent engine that inflates every Joker's sell value each round. Swashbuckler converts accumulated sell value directly into Mult. Luchador's sell becomes worth far more after Gift Card stacks for several rounds.",
    beginner: "All your Jokers get worth more each round. Sell them later for big money or combo with Swashbuckler."
  },
  // ── 29 ─────────────────────────────────────────────────────────────────────
  {
    id: "turtle_bean",
    name: "Turtle Bean",
    rarity: "uncommon",
    summary: "+5 hand size, reduces by 1 each round.",
    mainRole: "hand_size",
    secondaryRole: "consistency",
    tags: ["hand_size", "consistency", "enabler"],
    trigger: "passive (degrades per round)",
    scaling: "conditional",
    hands: ["flush", "straight", "full_house", "four_of_a_kind"], archetypes: ["flush", "straight", "held_in_hand"], stage: ["early", "mid"],
    economy: "low", consistency: "high",
    partners: ["mime", "baron", "blueprint", "brainstorm"],
    antiSynergies: ["stuntman"],
    setupDifficulty: "low", risk: "med",
    notes: "Exceptional early-game hand-size burst that self-liquidates. Best acquired early so you benefit from the full 5 rounds of expanded hand — use the time to set up flush/held-in-hand builds that need the extra cards.",
    beginner: "Big extra hand size that shrinks each round. Great early to help you hit flushes and big hands."
  },
  // ── 30 ─────────────────────────────────────────────────────────────────────
  {
    id: "erosion",
    name: "Erosion",
    rarity: "uncommon",
    summary: "+4 Mult for each card below the deck's starting size in your full deck.",
    mainRole: "flat_mult",
    secondaryRole: "deck_manipulation",
    tags: ["flat_mult", "deck_manipulation", "scaling_engine"],
    trigger: "every scored hand",
    scaling: "linear",
    hands: ["any"], archetypes: ["high_card", "discard"], stage: ["mid", "late"],
    economy: "low", consistency: "high",
    partners: ["trading_card", "sixth_sense", "blueprint", "brainstorm"],
    antiSynergies: ["hologram", "marble_joker"],
    setupDifficulty: "med", risk: "med",
    notes: "Rewards deck thinning — every card removed permanently grows Mult by +4. Trading Card and Sixth Sense destroy cards on demand. Avoid deck-growth Jokers (Hologram, Marble) that work against the shrink.",
    beginner: "Remove cards from your deck to grow this. Thin aggressively and enjoy free Mult."
  },
  // ── 31 ─────────────────────────────────────────────────────────────────────
  {
    id: "to_the_moon",
    name: "To the Moon",
    rarity: "uncommon",
    summary: "Earn an extra $1 of interest for every $5 you have at end of round.",
    mainRole: "economy",
    secondaryRole: "scaling_engine",
    tags: ["economy", "scaling_engine"],
    trigger: "end of round",
    scaling: "linear",
    hands: ["any"], archetypes: ["economy_snowball"], stage: ["mid", "late"],
    economy: "high", consistency: "high",
    partners: ["golden_joker", "satellite", "cloud_9", "rocket", "bootstraps"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "Raises the effective interest cap — normally capped at $25 ($5/round), To the Moon adds +$1 per $5 on top, so holding $50 yields $10 more per round. Stack with all passive income Jokers for runaway money.",
    beginner: "Gives you extra interest based on how much money you have. The richer you are, the more you earn."
  },
  // ── 32 ─────────────────────────────────────────────────────────────────────
  {
    id: "stone_joker",
    name: "Stone Joker",
    rarity: "uncommon",
    summary: "+25 Chips for each Stone card in your full deck.",
    mainRole: "chips",
    secondaryRole: "enhancement_interaction",
    tags: ["chips", "enhancement_interaction", "scaling_engine"],
    trigger: "every scored hand",
    scaling: "linear",
    hands: ["any"], archetypes: ["deck_growth", "high_card"], stage: ["mid", "late"],
    economy: "low", consistency: "high",
    partners: ["stuntman", "marble_joker", "driver_gloves", "blueprint", "brainstorm"],
    antiSynergies: [],
    setupDifficulty: "med", risk: "low",
    notes: "Loves Stone-card-heavy decks. Stone cards have no rank or suit so they contribute nothing to hand construction — they're pure chip fuel. Marble Joker adds Stones passively; combine for effortless chip walls.",
    beginner: "More Stone cards = more chips. Convert junk cards to Stone cards."
  },
  // ── 33 ─────────────────────────────────────────────────────────────────────
  {
    id: "lucky_cat",
    name: "Lucky Cat",
    rarity: "uncommon",
    summary: "This Joker gains X0.25 Mult every time a Lucky card successfully triggers.",
    mainRole: "xmult",
    secondaryRole: "enhancement_interaction",
    tags: ["xmult", "enhancement_interaction", "scaling_engine"],
    trigger: "Lucky card proc",
    scaling: "exponential",
    hands: ["any"], archetypes: ["deck_growth", "flush"], stage: ["mid", "late"],
    economy: "low", consistency: "med",
    partners: ["oops_all_6s", "blueprint", "brainstorm", "seltzer"],
    antiSynergies: [],
    setupDifficulty: "med", risk: "med",
    notes: "Lucky cards trigger on a 1 in 5 chance. Oops! All 6s doubles that to 2 in 5 (40%), dramatically raising Lucky Cat's growth rate. Seltzer retriggers scored cards, giving multiple Lucky proc chances per card per hand.",
    beginner: "Lucky cards in your deck have a chance to boost this. Use Oops! All 6s to trigger more often."
  },
  // ── 34 ─────────────────────────────────────────────────────────────────────
  {
    id: "bull",
    name: "Bull",
    rarity: "uncommon",
    summary: "+2 Chips for each $1 you have.",
    mainRole: "chips",
    secondaryRole: "economy",
    tags: ["chips", "economy", "scaling_engine"],
    trigger: "every scored hand",
    scaling: "linear",
    hands: ["any"], archetypes: ["economy_snowball", "high_card"], stage: ["mid", "late"],
    economy: "med", consistency: "high",
    partners: ["to_the_moon", "golden_joker", "satellite", "bootstraps", "blueprint"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "Converts your cash reserves directly into chips on every scored hand. Holding $30 contributes +60 Chips, which is substantial mid-game. Bootstraps also scales off cash but via Mult — the two cover different scoring dimensions.",
    beginner: "Every dollar you have gives +2 chips every hand. Don't spend money right before scoring."
  },
  // ── 35 ─────────────────────────────────────────────────────────────────────
  {
    id: "diet_cola",
    name: "Diet Cola",
    rarity: "uncommon",
    summary: "Sell this card to create a free Double Tag.",
    mainRole: "deck_manipulation",
    secondaryRole: "economy",
    tags: ["deck_manipulation", "economy", "pivot"],
    trigger: "sold",
    scaling: "static",
    hands: ["any"], archetypes: ["economy_snowball", "deck_growth"], stage: ["early", "mid"],
    economy: "med", consistency: "high",
    partners: ["blueprint", "showman", "gift_card"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "One-shot tag generator. A Double Tag is worth whatever its contents are — an XMult Joker or two of the same consumable. Blueprint can copy the sell effect before selling to effectively produce two Double Tags from one.",
    beginner: "Sell it to get a free Double Tag (two of the same item). Time it with a great shop selection."
  },
  // ── 36 ─────────────────────────────────────────────────────────────────────
  {
    id: "trading_card",
    name: "Trading Card",
    rarity: "uncommon",
    summary: "If the first discard of round has only 1 card, destroy it and earn $3.",
    mainRole: "economy",
    secondaryRole: "deck_manipulation",
    tags: ["economy", "deck_manipulation", "discard_support"],
    trigger: "single-card first discard",
    scaling: "linear",
    hands: ["any"], archetypes: ["economy_snowball", "discard"], stage: ["early", "mid"],
    economy: "high", consistency: "high",
    partners: ["erosion", "drunkard", "mail_in_rebate", "blueprint"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "Consistently earns $3 per round while also thinning the deck one card at a time. Erosion gains +4 Mult per removed card, making Trading Card a dual-benefit play every round. Drunkard provides extra discards so you can still dig for the hand after the sacrifice.",
    beginner: "Discard exactly 1 card first to destroy it and earn $3. Easy money and deck improvement."
  },
  // ── 37 ─────────────────────────────────────────────────────────────────────
  {
    id: "flash_card",
    name: "Flash Card",
    rarity: "uncommon",
    summary: "This Joker gains +2 Mult per reroll in the shop.",
    mainRole: "flat_mult",
    secondaryRole: "economy",
    tags: ["flat_mult", "scaling_engine", "economy"],
    trigger: "shop reroll",
    scaling: "linear",
    hands: ["any"], archetypes: ["high_card", "economy_snowball"], stage: ["mid", "late"],
    economy: "med", consistency: "high",
    partners: ["chaos_the_clown", "blueprint", "brainstorm", "showman"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "Scales naturally with any reroll-heavy shopping style. Chaos the Clown gives a free reroll each shop, effectively a free +2 Mult per round. No cap — heavy rerollers routinely push Flash Card to +40–60 Mult by mid-run.",
    beginner: "Reroll in the shop to add +2 Mult each time. Reroll freely and this snowballs."
  },
  // ── 38 ─────────────────────────────────────────────────────────────────────
  {
    id: "spare_trousers",
    name: "Spare Trousers",
    rarity: "uncommon",
    summary: "This Joker gains +2 Mult if played hand contains a Two Pair.",
    mainRole: "flat_mult",
    secondaryRole: "scaling_engine",
    tags: ["flat_mult", "scaling_engine", "payoff"],
    trigger: "Two Pair scored",
    scaling: "linear",
    hands: ["two_pair", "full_house"], archetypes: ["two_pair", "pair"], stage: ["early", "mid"],
    economy: "low", consistency: "high",
    partners: ["blueprint", "brainstorm", "dna", "the_duo"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "Steady accumulator in Two Pair builds. Every hand with Two Pair (including Full House) ticks it up. Pairs cleanly with DNA to flood the deck with a target rank, guaranteeing Two Pair on nearly every hand.",
    beginner: "Two Pair hands permanently add Mult to this. Just keep playing Two Pairs."
  },
  // ── 39 ─────────────────────────────────────────────────────────────────────
  {
    id: "ramen",
    name: "Ramen",
    rarity: "uncommon",
    summary: "X2 Mult, loses X0.01 Mult per card discarded.",
    mainRole: "xmult",
    secondaryRole: "discard_support",
    tags: ["xmult", "payoff", "discard_support"],
    trigger: "every scored hand",
    scaling: "conditional",
    hands: ["any"], archetypes: ["high_card", "flush", "straight"], stage: ["early", "mid"],
    economy: "low", consistency: "med",
    partners: ["green_joker", "burglar", "mystic_summit", "blueprint"],
    antiSynergies: ["drunkard", "merry_andy", "mail_in_rebate"],
    setupDifficulty: "low", risk: "med",
    notes: "Starts at X2 and erodes with every discard. Protect it by minimising discards — Burglar sacrifices discards for extra hands. At 200 total discards it hits X0, so treat it as a long-duration temporary buff.",
    beginner: "Starts at X2 but each discard shrinks it. Play with fewer discards to keep it powerful."
  },
  // ── 40 ─────────────────────────────────────────────────────────────────────
  {
    id: "seltzer",
    name: "Seltzer",
    rarity: "uncommon",
    summary: "Retrigger all cards played for the next 10 hands.",
    mainRole: "retrigger",
    secondaryRole: "payoff",
    tags: ["retrigger", "scaling_engine"],
    trigger: "scored card while active",
    scaling: "linear",
    hands: ["any"], archetypes: ["retrigger_engine"], stage: ["mid"],
    economy: "low", consistency: "med",
    partners: ["fibonacci", "the_idol", "triboulet", "blueprint", "brainstorm"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "high",
    notes: "Timer-limited: expires after 10 hands, then self-destructs. Plan to acquire and peak during boss blind phases. Blueprint can copy the retrigger the same turn it fires, effectively consuming two of the 10 hands at maximum value.",
    beginner: "Doubles every card for 10 hands then vanishes. Use during tough boss rounds."
  },
  // ── 41 ─────────────────────────────────────────────────────────────────────
  {
    id: "castle",
    name: "Castle",
    rarity: "uncommon",
    summary: "This Joker gains +3 Chips per discarded card of a rotating suit.",
    mainRole: "chips",
    secondaryRole: "discard_support",
    tags: ["chips", "discard_support", "scaling_engine"],
    trigger: "discarded card of active suit",
    scaling: "linear",
    hands: ["any"], archetypes: ["discard", "flush", "high_card"], stage: ["mid", "late"],
    economy: "low", consistency: "high",
    partners: ["drunkard", "merry_andy", "smeared_joker", "blueprint"],
    antiSynergies: ["green_joker"],
    setupDifficulty: "low", risk: "low",
    notes: "The suit rotates every round, so you need deck balance to hit it consistently. Smeared Joker merges two suits' coverage, doubling reliability. Merry Andy's +3 discards dramatically accelerates chip accumulation.",
    beginner: "Discard cards of the right suit to add chips. Suits rotate each round, so keep diverse cards."
  },
  // ── 42 ─────────────────────────────────────────────────────────────────────
  {
    id: "satellite",
    name: "Satellite",
    rarity: "uncommon",
    summary: "Earn $1 at end of round per unique Planet card used this run.",
    mainRole: "economy",
    secondaryRole: "scaling_engine",
    tags: ["economy", "scaling_engine"],
    trigger: "end of round",
    scaling: "linear",
    hands: ["any"], archetypes: ["economy_snowball"], stage: ["mid", "late"],
    economy: "high", consistency: "high",
    partners: ["constellation", "astronomer", "golden_joker", "astronomer"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "Compounds with any Planet-heavy run. Free money for natural shop behaviour — using Planets levels hands and grows Constellation simultaneously. With all 11 unique Planets used, Satellite yields $11/round.",
    beginner: "Every Planet you use pays you each round. Use lots of Planets."
  },
  // ── 43 ─────────────────────────────────────────────────────────────────────
  {
    id: "acrobat",
    name: "Acrobat",
    rarity: "uncommon",
    summary: "X3 Mult on the final hand of the round.",
    mainRole: "xmult",
    secondaryRole: "payoff",
    tags: ["xmult", "payoff"],
    trigger: "final hand of round",
    scaling: "conditional",
    hands: ["any"], archetypes: ["high_card", "flush", "straight"], stage: ["mid", "late"],
    economy: "low", consistency: "high",
    partners: ["dusk", "blueprint", "brainstorm", "loyalty_card", "card_sharp"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "Reliable X3 every round if you can manage hand count. Best paired with Dusk for retrigger on the same final hand — the combo produces devastating burst. Keep enough hands to reach the final comfortably.",
    beginner: "Your last hand of the round gets X3. Save your biggest play for last."
  },
  // ── 44 ─────────────────────────────────────────────────────────────────────
  {
    id: "sock_and_buskin",
    name: "Sock and Buskin",
    rarity: "uncommon",
    summary: "Retrigger all played face cards.",
    mainRole: "retrigger",
    secondaryRole: "rank_face_support",
    tags: ["retrigger", "rank_face_support", "scaling_engine"],
    trigger: "scored face card",
    scaling: "linear",
    hands: ["any"], archetypes: ["face_card", "retrigger_engine"], stage: ["mid", "late"],
    economy: "low", consistency: "high",
    partners: ["triboulet", "pareidolia", "midas_mask", "hanging_chad", "the_idol"],
    antiSynergies: [],
    setupDifficulty: "med", risk: "low",
    notes: "Doubles every face card payoff — mandatory in face-card decks. Pairs with Hanging Chad so the lead face card fires three times, then Sock doubles all subsequent face cards in the same hand.",
    beginner: "Every face card scores twice. Insane with Triboulet."
  },
  // ── 45 ─────────────────────────────────────────────────────────────────────
  {
    id: "troubadour",
    name: "Troubadour",
    rarity: "uncommon",
    summary: "+2 hand size, -1 hand per round.",
    mainRole: "hand_size",
    secondaryRole: "consistency",
    tags: ["hand_size", "consistency", "held_in_hand"],
    trigger: "passive",
    scaling: "static",
    hands: ["flush", "full_house", "four_of_a_kind", "any"], archetypes: ["held_in_hand", "flush"], stage: ["early", "mid"],
    economy: "low", consistency: "high",
    partners: ["mime", "baron", "blueprint", "brainstorm"],
    antiSynergies: ["stuntman", "acrobat"],
    setupDifficulty: "low", risk: "med",
    notes: "The hand-size gain is generous for held-in-hand builds but the -1 hand per round is a steep tax. Avoid in builds relying on Acrobat or Dusk (fewer hands = less flexibility). Best in single-hand-clearing builds.",
    beginner: "Bigger hand size but one fewer hand per round. Good if you clear blinds in fewer plays."
  },
  // ── 46 ─────────────────────────────────────────────────────────────────────
  {
    id: "certificate",
    name: "Certificate",
    rarity: "uncommon",
    summary: "When round begins, add a random playing card with a random seal to your hand.",
    mainRole: "deck_manipulation",
    secondaryRole: "consistency",
    tags: ["deck_manipulation", "consistency", "enabler"],
    trigger: "round start",
    scaling: "static",
    hands: ["any"], archetypes: ["deck_growth", "flush", "held_in_hand"], stage: ["early", "mid"],
    economy: "low", consistency: "high",
    partners: ["blueprint", "mime", "steel_joker", "hologram"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "Delivers a free sealed card each round — Gold Seals generate money, Red Seals retrigger on scoring, Blue Seals create Planet cards. The randomness averages to strong value over a run. Hologram gains from the added card immediately.",
    beginner: "Free card with a seal each round. Keep whichever seals give you money or planets."
  },
  // ── 47 ─────────────────────────────────────────────────────────────────────
  {
    id: "smeared_joker",
    name: "Smeared Joker",
    rarity: "uncommon",
    summary: "Hearts and Diamonds count as the same suit; Spades and Clubs count as the same suit.",
    mainRole: "enabler",
    secondaryRole: "consistency",
    tags: ["enabler", "suit_support", "consistency"],
    trigger: "passive",
    scaling: "static",
    hands: ["flush"], archetypes: ["flush"], stage: ["mid"],
    economy: "low", consistency: "high",
    partners: ["greedy_joker", "wrathful_joker", "the_idol", "vampire", "blackboard"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "The glue piece of suit-based builds. Halves the effective suit pool, making flushes trivial and doubling suit Joker coverage. Blackboard becomes nearly unconditional with Smeared merging Spades and Clubs.",
    beginner: "Treats two suits as one. Makes flushes way easier to hit."
  },
  // ── 48 ─────────────────────────────────────────────────────────────────────
  {
    id: "throwback",
    name: "Throwback",
    rarity: "uncommon",
    summary: "X0.25 Mult for each Blind skipped this run.",
    mainRole: "xmult",
    secondaryRole: "economy",
    tags: ["xmult", "scaling_engine", "economy"],
    trigger: "passive (scales off skipped blinds)",
    scaling: "linear",
    hands: ["any"], archetypes: ["economy_snowball", "high_card"], stage: ["mid", "late"],
    economy: "med", consistency: "med",
    partners: ["credit_card", "blueprint", "brainstorm", "diet_cola"],
    antiSynergies: [],
    setupDifficulty: "med", risk: "med",
    notes: "Rewards running a skip-tag strategy. Each skipped blind adds X0.25 — skipping 8 Small Blinds over a run yields X3 Mult. Credit Card enables going into debt to skip without being cash-locked. Works retroactively from the start of the run.",
    beginner: "Skip more blinds earlier to power this up. Get a skip tag whenever you can."
  },
  // ── 49 ─────────────────────────────────────────────────────────────────────
  {
    id: "rough_gem",
    name: "Rough Gem",
    rarity: "uncommon",
    summary: "Played cards with Diamond suit earn $1 when scored.",
    mainRole: "economy",
    secondaryRole: "suit_support",
    tags: ["economy", "suit_support"],
    trigger: "scored Diamond card",
    scaling: "linear",
    hands: ["flush", "pair", "any"], archetypes: ["economy_snowball", "flush"], stage: ["early", "mid"],
    economy: "high", consistency: "high",
    partners: ["smeared_joker", "greedy_joker", "the_idol", "cloud_9"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "Economy layer that stacks cleanly with Diamond suit synergies. Smeared Joker doubles its coverage by unifying Hearts and Diamonds. In Diamond-flush builds the income per round is substantial — 5 Diamonds in a flush nets $5.",
    beginner: "Scoring Diamond cards earns you money. Build toward Diamond flushes for best results."
  },
  // ── 50 ─────────────────────────────────────────────────────────────────────
  {
    id: "bloodstone",
    name: "Bloodstone",
    rarity: "uncommon",
    summary: "1 in 2 chance for played Heart cards to give X1.5 Mult when scored.",
    mainRole: "xmult",
    secondaryRole: "suit_support",
    tags: ["xmult", "suit_support", "payoff"],
    trigger: "scored Heart card (probabilistic)",
    scaling: "multiplicative",
    hands: ["flush", "pair", "any"], archetypes: ["flush"], stage: ["mid", "late"],
    economy: "low", consistency: "med",
    partners: ["smeared_joker", "oops_all_6s", "the_idol", "blueprint", "brainstorm"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "med",
    notes: "Probabilistic XMult that averages X1.5 per 2 Hearts. Oops! All 6s raises it to 100% (guaranteed X1.5 per Heart). In Heart-flush builds with Smeared, nearly every scored card procs it.",
    beginner: "Heart cards have a 50% chance to multiply your score. Use Oops! All 6s to guarantee it."
  },
  // ── 51 ─────────────────────────────────────────────────────────────────────
  {
    id: "arrowhead",
    name: "Arrowhead",
    rarity: "uncommon",
    summary: "Played cards with Spade suit give +50 Chips when scored.",
    mainRole: "chips",
    secondaryRole: "suit_support",
    tags: ["chips", "suit_support", "payoff"],
    trigger: "scored Spade card",
    scaling: "linear",
    hands: ["flush", "pair", "any"], archetypes: ["flush", "high_card"], stage: ["early", "mid"],
    economy: "low", consistency: "high",
    partners: ["smeared_joker", "onyx_agate", "blackboard", "blueprint", "brainstorm"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "+50 Chips per Spade is enormous — five Spades in a flush yields +250 Chips per hand on top of base values. Smeared merges Spades with Clubs for double coverage. Pairs with Onyx Agate for a chip+mult Spade/Club axis.",
    beginner: "Score Spades to get +50 chips each. Massive chip bonus in Spade-heavy decks."
  },
  // ── 52 ─────────────────────────────────────────────────────────────────────
  {
    id: "onyx_agate",
    name: "Onyx Agate",
    rarity: "uncommon",
    summary: "Played cards with Club suit give +7 Mult when scored.",
    mainRole: "flat_mult",
    secondaryRole: "suit_support",
    tags: ["flat_mult", "suit_support", "payoff"],
    trigger: "scored Club card",
    scaling: "linear",
    hands: ["flush", "pair", "any"], archetypes: ["flush", "high_card"], stage: ["early", "mid"],
    economy: "low", consistency: "high",
    partners: ["smeared_joker", "arrowhead", "blackboard", "blueprint", "brainstorm"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "+7 Mult per Club is a strong flat Mult source. A 5-Club flush generates +35 flat Mult, rivalling many conditional Jokers. Smeared Joker merges Clubs with Spades; Arrowhead covers the chip side of the same suits.",
    beginner: "Score Clubs for +7 Mult each. Strong flat mult in Club-heavy decks."
  },
  // ── 53 ─────────────────────────────────────────────────────────────────────
  {
    id: "glass_joker",
    name: "Glass Joker",
    rarity: "uncommon",
    summary: "This Joker gains X0.75 Mult for every Glass card that is destroyed.",
    mainRole: "xmult",
    secondaryRole: "enhancement_interaction",
    tags: ["xmult", "enhancement_interaction", "scaling_engine", "destroy_value"],
    trigger: "glass destroyed",
    scaling: "exponential",
    hands: ["any"], archetypes: ["glass"], stage: ["mid", "late"],
    economy: "low", consistency: "med",
    partners: ["hack", "blueprint", "brainstorm", "seltzer"],
    antiSynergies: ["vampire"],
    setupDifficulty: "high", risk: "high",
    notes: "Cracks one shard at a time for permanent X0.75 gains. Hack retriggers 2–5s, doubling Glass proc chances on those ranks. After ~8 Glass destructions you reach X7 Mult — one of the highest single-Joker ceilings in the game.",
    beginner: "Break Glass cards to permanently buff this. Risky but explosive late game."
  },
  // ── 54 ─────────────────────────────────────────────────────────────────────
  {
    id: "showman",
    name: "Showman",
    rarity: "uncommon",
    summary: "Joker, Tarot, Planet, and Spectral cards may appear multiple times in the shop.",
    mainRole: "enabler",
    secondaryRole: "consistency",
    tags: ["enabler", "consistency", "deck_manipulation"],
    trigger: "passive (shop generation)",
    scaling: "static",
    hands: ["any"], archetypes: ["economy_snowball", "deck_growth"], stage: ["early", "mid"],
    economy: "med", consistency: "high",
    partners: ["blueprint", "brainstorm", "constellation", "perkeo"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "Lifts the uniqueness constraint on shop offerings. Particularly valuable for Spectral hunting (Wraith, Ankh) and for constellating duplicate Jokers. Removes the bottleneck in single-Joker-focused strategies.",
    beginner: "Same Jokers and consumables can now appear multiple times in the shop. Great for duplicating key pieces."
  },
  // ── 55 ─────────────────────────────────────────────────────────────────────
  {
    id: "flower_pot",
    name: "Flower Pot",
    rarity: "uncommon",
    summary: "X3 Mult if poker hand contains a Diamond, Club, Heart, and Spade card.",
    mainRole: "xmult",
    secondaryRole: "payoff",
    tags: ["xmult", "payoff", "suit_support"],
    trigger: "four-suit hand scored",
    scaling: "conditional",
    hands: ["flush", "straight", "full_house", "two_pair", "four_of_a_kind"], archetypes: ["flush", "straight"], stage: ["mid", "late"],
    economy: "low", consistency: "med",
    partners: ["smeared_joker", "four_fingers", "blueprint", "brainstorm"],
    antiSynergies: ["smeared_joker"],
    setupDifficulty: "med", risk: "med",
    notes: "Requires all four suits in one hand — contradicts Smeared Joker (which merges suits). Natural in balanced decks; harder in suit-focused builds. Four Fingers helps by requiring only 4 cards while still needing 4 suits.",
    beginner: "X3 if you score all four suits at once. Keep a balanced deck across all suits."
  },
  // ── 56 ─────────────────────────────────────────────────────────────────────
  {
    id: "merry_andy",
    name: "Merry Andy",
    rarity: "uncommon",
    summary: "+3 discards each round, -1 hand size.",
    mainRole: "discard_support",
    secondaryRole: "consistency",
    tags: ["discard_support", "consistency", "hand_size"],
    trigger: "passive",
    scaling: "static",
    hands: ["flush", "straight", "high_card"], archetypes: ["discard", "flush", "straight"], stage: ["early", "mid"],
    economy: "low", consistency: "high",
    partners: ["drunkard", "castle", "mail_in_rebate", "faceless_joker"],
    antiSynergies: ["green_joker", "ramen", "mime", "baron"],
    setupDifficulty: "low", risk: "med",
    notes: "Enormous discard economy but the -1 hand size is a real tax on held-in-hand builds. Discard-economy Jokers (Castle, Mail-in Rebate, Faceless) absorb the extra discards for passive income. Avoid in Baron/Mime lines.",
    beginner: "Lots of extra discards but a smaller hand. Ideal for builds that use discards to search for cards."
  },
  // ── 57 ─────────────────────────────────────────────────────────────────────
  {
    id: "oops_all_6s",
    name: "Oops! All 6s",
    rarity: "uncommon",
    summary: "Doubles all listed probabilities (e.g. 1 in 3 → 2 in 3).",
    mainRole: "enabler",
    secondaryRole: "consistency",
    tags: ["enabler", "consistency", "scaling_engine"],
    trigger: "passive",
    scaling: "static",
    hands: ["any"], archetypes: ["flush", "glass", "economy_snowball"], stage: ["early", "mid"],
    economy: "low", consistency: "high",
    partners: ["bloodstone", "lucky_cat", "space_joker", "blueprint", "brainstorm"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "Globally doubles every probabilistic effect — Bloodstone (1in2→guaranteed), Lucky Cat triggers, Glass shatter rate, 8 Ball Tarot rate, Mystic Summit conditions. Single-handedly converts marginal procs into near-certainties.",
    beginner: "Doubles every random chance in the game. Huge with Glass cards, Lucky cards, and Bloodstone."
  },
  // ── 58 ─────────────────────────────────────────────────────────────────────
  {
    id: "the_idol",
    name: "The Idol",
    rarity: "uncommon",
    summary: "Each played card of a chosen rank and suit gives X2 Mult when scored. Card changes every round.",
    mainRole: "xmult",
    secondaryRole: "rank_face_support",
    tags: ["xmult", "payoff", "suit_support", "rank_face_support"],
    trigger: "scored card matches target",
    scaling: "multiplicative",
    hands: ["flush", "pair", "two_pair", "four_of_a_kind"], archetypes: ["flush", "face_card"], stage: ["mid", "late"],
    economy: "low", consistency: "med",
    partners: ["smeared_joker", "blueprint", "brainstorm", "dna", "sock_and_buskin", "hanging_chad"],
    antiSynergies: [],
    setupDifficulty: "med", risk: "med",
    notes: "X2 per match — exponential when stacked with DNA (flood deck with target) or retriggers. The rotating card changes each round so Smeared Joker is key to halving the effective target pool.",
    beginner: "Pick a rank and suit; each matching card multiplies your score. Aim for face-card targets."
  },
  // ── 59 ─────────────────────────────────────────────────────────────────────
  {
    id: "seeing_double",
    name: "Seeing Double",
    rarity: "uncommon",
    summary: "X2 Mult if played hand has a scoring Club card and a scoring card of any other suit.",
    mainRole: "xmult",
    secondaryRole: "suit_support",
    tags: ["xmult", "payoff", "suit_support"],
    trigger: "mixed-suit scoring condition",
    scaling: "conditional",
    hands: ["flush", "straight", "pair", "any"], archetypes: ["flush", "straight"], stage: ["mid", "late"],
    economy: "low", consistency: "high",
    partners: ["smeared_joker", "blueprint", "brainstorm", "onyx_agate", "arrowhead"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "Trivially triggered in any non-mono-Club hand — just include one Club. Unlike Flower Pot (four suits), this is one of the easiest conditional X2s in the game. Stack with Onyx Agate for +7 Mult per Club on top.",
    beginner: "X2 if you score at least one Club alongside any other suit. Extremely easy to trigger."
  },
  // ── 60 ─────────────────────────────────────────────────────────────────────
  {
    id: "matador",
    name: "Matador",
    rarity: "uncommon",
    summary: "Earn $8 if played hand triggers the Boss Blind ability.",
    mainRole: "economy",
    secondaryRole: "consistency",
    tags: ["economy", "consistency"],
    trigger: "boss blind ability triggered",
    scaling: "static",
    hands: ["any"], archetypes: ["economy_snowball"], stage: ["mid", "late"],
    economy: "high", consistency: "med",
    partners: ["to_the_moon", "golden_joker", "satellite", "blueprint"],
    antiSynergies: ["luchador"],
    setupDifficulty: "med", risk: "low",
    notes: "Earns $8 each hand the boss effect triggers (up to once per hand played). Some bosses trigger every hand (The Wall, The Flint) — those are goldmines. Conflicts philosophically with Luchador, which disables the boss entirely.",
    beginner: "Earn $8 by intentionally setting off the Boss Blind's effect. Know which bosses trigger repeatedly."
  },
  // ── 61 ─────────────────────────────────────────────────────────────────────
  {
    id: "cartomancer",
    name: "Cartomancer",
    rarity: "uncommon",
    summary: "Create a Tarot card when Blind is selected (must have room).",
    mainRole: "deck_manipulation",
    secondaryRole: "consistency",
    tags: ["deck_manipulation", "consistency", "enabler"],
    trigger: "blind selection",
    scaling: "static",
    hands: ["any"], archetypes: ["deck_growth", "economy_snowball"], stage: ["early", "mid"],
    economy: "med", consistency: "high",
    partners: ["perkeo", "showman", "blueprint", "fortune_teller"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "Free Tarot every blind selection is extraordinary long-term value — Tarots enhance cards, Perkeo duplicates them, and Fortune Teller scales off total Tarot usage. Showman lifts the uniqueness restriction.",
    beginner: "Free Tarot card every time you enter a blind. Use Tarots to enhance your cards."
  },
  // ── 62 ─────────────────────────────────────────────────────────────────────
  {
    id: "astronomer",
    name: "Astronomer",
    rarity: "uncommon",
    summary: "All Planet cards and Celestial Packs in the shop are free.",
    mainRole: "economy",
    secondaryRole: "scaling_engine",
    tags: ["economy", "scaling_engine", "enabler"],
    trigger: "passive (shop discount)",
    scaling: "static",
    hands: ["any"], archetypes: ["economy_snowball", "flush"], stage: ["mid", "late"],
    economy: "high", consistency: "high",
    partners: ["constellation", "satellite", "astronomer", "perkeo"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "Makes Constellation's growth engine free to fuel. Every Planet you'd normally spend $3 on now costs $0 — redirect that money into Joker upgrades. Planet Merchant + Astronomer = free Planets in every shop.",
    beginner: "All Planets and Celestial Packs cost nothing. Buy every single one — free hand levels forever."
  },
  // ── 63 ─────────────────────────────────────────────────────────────────────
  {
    id: "bootstraps",
    name: "Bootstraps",
    rarity: "uncommon",
    summary: "+2 Mult for every $5 you have.",
    mainRole: "flat_mult",
    secondaryRole: "economy",
    tags: ["flat_mult", "scaling_engine", "economy"],
    trigger: "every scored hand",
    scaling: "linear",
    hands: ["any"], archetypes: ["economy_snowball", "high_card"], stage: ["mid", "late"],
    economy: "med", consistency: "high",
    partners: ["to_the_moon", "golden_joker", "satellite", "cloud_9", "bull"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "Converts cash reserves into flat Mult on every scored hand. Holding $40 nets +16 Mult — meaningful flat mult alongside economy engines. Bull covers the chip side of the same cash-scaling axis.",
    beginner: "More money in your pocket = more Mult. Save up cash and this grows naturally."
  },
  // ── 64 ──────────────────────────────────────────────────────────────────────
  {
    id: "mr_bones",
    name: "Mr. Bones",
    rarity: "uncommon",
    summary: "Prevents Death if chips scored are at least 25% of required chips. Self destructs.",
    mainRole: "consistency",
    secondaryRole: "pivot",
    tags: ["consistency", "pivot"],
    trigger: "round loss prevention",
    scaling: "static",
    hands: ["any"], archetypes: ["high_card", "glass"], stage: ["mid", "late"],
    economy: "low", consistency: "high",
    partners: ["luchador", "glass_joker", "blueprint"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "Insurance against rough boss blinds. Sells itself after one save — treat it as a single-use lifeline. Pairs with Luchador for double boss-safety coverage.",
    beginner: "Saves you from one losing round if you score at least 25% of what's required. One-time use."
  },

  // ════════════════════════════════════════════════════════════════
  // RARE (20)
  // ════════════════════════════════════════════════════════════════
  // ── 1. DNA ─────────────────────────────────────────────────────────────────
  {
    id: "dna",
    name: "DNA",
    rarity: "rare",
    summary: "If the first hand of round has only 1 card, add a permanent copy to deck and draw it to hand.",
    mainRole: "deck_manipulation",
    secondaryRole: "deck_growth",
    tags: ["deck_manipulation", "deck_growth", "scaling_engine"],
    trigger: "first hand condition — single card played",
    scaling: "linear",
    hands: ["high_card"],
    archetypes: ["deck_growth", "flush", "face_card"],
    stage: ["early", "mid"],
    economy: "low",
    consistency: "med",
    partners: ["the_idol", "cavendish", "blueprint", "brainstorm", "hack", "hologram"],
    antiSynergies: [],
    setupDifficulty: "high",
    risk: "med",
    notes: "Requires strict hand-size discipline to single-play first each round; pairs explosively with The Idol to stack X2-target copies. Best combined with Hologram since each clone also bumps its XMult.",
    beginner: "Play one card alone to permanently copy it into your deck. Do this early and often with your best card."
  },

  // ── 2. Vagabond ────────────────────────────────────────────────────────────
  {
    id: "vagabond",
    name: "Vagabond",
    rarity: "rare",
    summary: "Create a Tarot card if hand is played with $4 or less.",
    mainRole: "economy",
    secondaryRole: "consistency",
    tags: ["economy", "consistency", "discard_support"],
    trigger: "hand played while holding $4 or less",
    scaling: "linear",
    hands: ["any"],
    archetypes: ["economy_snowball", "discard"],
    stage: ["early", "mid"],
    economy: "high",
    consistency: "med",
    partners: ["constellation", "perkeo", "satellite", "hologram"],
    antiSynergies: [],
    setupDifficulty: "med",
    risk: "med",
    notes: "Demands deliberate cash-drain positioning — spend down to ≤$4 before playing a hand to generate free Tarots. Pairs with Constellation and Perkeo that thrive on consumable volume.",
    beginner: "Spend your money down to $4 or less before a hand to get a free Tarot card. Plan purchases around this."
  },

  // ── 3. Baron ───────────────────────────────────────────────────────────────
  {
    id: "baron",
    name: "Baron",
    rarity: "rare",
    summary: "Each King held in hand gives X1.5 Mult.",
    mainRole: "xmult",
    secondaryRole: "held_in_hand",
    tags: ["xmult", "held_in_hand", "payoff", "scaling_engine"],
    trigger: "held-in-hand phase",
    scaling: "multiplicative",
    hands: ["any"],
    archetypes: ["held_in_hand", "face_card", "retrigger_engine"],
    stage: ["mid", "late"],
    economy: "low",
    consistency: "med",
    partners: ["mime", "raised_fist", "shoot_the_moon", "blueprint", "brainstorm", "midas_mask"],
    antiSynergies: ["pareidolia", "stuntman"],
    setupDifficulty: "high",
    risk: "med",
    notes: "Multiplicative stacking with no cap — four Kings held give X5.06. Needs hand-size support and King density; Mime doubles every held-King tick for free.",
    beginner: "Every King you keep in your hand (don't play) multiplies your score. Fill your deck with Kings."
  },

  // ── 4. Obelisk ─────────────────────────────────────────────────────────────
  {
    id: "obelisk",
    name: "Obelisk",
    rarity: "rare",
    summary: "Gains X0.2 Mult per consecutive hand played without your most-played poker hand.",
    mainRole: "xmult",
    secondaryRole: "scaling_engine",
    tags: ["xmult", "scaling_engine"],
    trigger: "off-most-played hand scored",
    scaling: "exponential",
    hands: ["any"],
    archetypes: ["retrigger_engine", "flush"],
    stage: ["late"],
    economy: "low",
    consistency: "med",
    partners: ["blueprint", "brainstorm", "the_idol", "acrobat"],
    antiSynergies: [],
    setupDifficulty: "high",
    risk: "high",
    notes: "Discipline-intensive — a single lapse onto your dominant hand resets the counter entirely. Park it on an off-type hand at high ante and Blueprint can copy the ballooned XMult.",
    beginner: "Avoid playing your most-used hand to make this grow. Risky discipline play that pays off late."
  },

  // ── 5. Ancient Joker ──────────────────────────────────────────────────────────
  {
    id: "ancient_joker",
    name: "Ancient Joker",
    rarity: "rare",
    summary: "Each played card with [suit] gives X1.5 Mult when scored, suit changes at end of round.",
    mainRole: "xmult",
    secondaryRole: "suit_support",
    tags: ["xmult", "suit_support", "payoff", "scaling_engine"],
    trigger: "scored card matches active suit",
    scaling: "conditional",
    hands: ["flush", "straight_flush", "any"],
    archetypes: ["flush", "retrigger_engine", "high_card"],
    stage: ["mid", "late"],
    economy: "low",
    consistency: "med",
    partners: ["smeared_joker", "four_fingers", "blueprint", "brainstorm", "seltzer", "hanging_chad"],
    antiSynergies: [],
    setupDifficulty: "high",
    risk: "med",
    notes: "The rotating suit punishes mono-suit rigid builds but rewards flexible decks that cover multiple suits — Smeared Joker collapses suits together so at least half your cards always qualify. Four Fingers makes any 4-card flush hit, dramatically increasing the number of scored cards that trigger the X1.5 each play.",
    beginner: "Every card matching the current suit multiplies your score. The suit changes each round, so keep a flexible deck with multiple suits."
  },

  // ── 6. Driver's License ────────────────────────────────────────────────────
  {
    id: "driver_gloves",
    name: "Driver's License",
    rarity: "rare",
    summary: "X3 Mult if you have at least 16 Enhanced cards in your full deck.",
    mainRole: "xmult",
    secondaryRole: "enhancement_interaction",
    tags: ["xmult", "enhancement_interaction", "payoff"],
    trigger: "every scored hand when threshold met",
    scaling: "static",
    hands: ["any"],
    archetypes: ["deck_growth", "steel", "glass"],
    stage: ["late"],
    economy: "low",
    consistency: "high",
    partners: ["steel_joker", "stone_joker", "glass_joker", "blueprint", "brainstorm"],
    antiSynergies: ["vampire"],
    setupDifficulty: "high",
    risk: "med",
    notes: "Enhancement-spam decks snap this on like a switch — Stone, Steel, and Glass cards all count. Vampire is a direct anti-synergy since it strips enhancements, dropping you below the threshold.",
    beginner: "Add 16 enhanced cards (Steel, Glass, Stone) to your deck to turn on a permanent X3 multiplier."
  },

  // ── 7. Campfire ────────────────────────────────────────────────────────────
  {
    id: "campfire",
    name: "Campfire",
    rarity: "rare",
    summary: "Gains X0.25 Mult for each card sold, resets when Boss Blind is defeated.",
    mainRole: "scaling_engine",
    secondaryRole: "xmult",
    tags: ["scaling_engine", "xmult", "economy"],
    trigger: "any card sold",
    scaling: "linear",
    hands: ["any"],
    archetypes: ["economy_snowball", "deck_growth"],
    stage: ["mid", "late"],
    economy: "med",
    consistency: "med",
    partners: ["blueprint", "brainstorm", "perkeo", "invisible_joker"],
    antiSynergies: [],
    setupDifficulty: "med",
    risk: "med",
    notes: "Snowballs every ante by selling excess consumables, weak Jokers, and unwanted vouchers before each Boss Blind; resets cleanly at Boss defeat so the next ante cycle begins fresh. Invisible Joker's duplication offsets selling Jokers for fuel.",
    beginner: "Sell junk cards and spare consumables to grow this before the boss fight. It resets after you win each boss."
  },

  // ── 8. Baseball Card ─────────────────────────────────────────────────────────
  {
    id: "baseball_card",
    name: "Baseball Card",
    rarity: "rare",
    summary: "Uncommon Jokers each give X1.5 Mult.",
    mainRole: "xmult",
    secondaryRole: "payoff",
    tags: ["xmult", "payoff", "scaling_engine"],
    trigger: "passive — per Uncommon Joker owned",
    scaling: "multiplicative",
    hands: ["any"],
    archetypes: ["retrigger_engine", "economy_snowball", "flush"],
    stage: ["mid", "late"],
    economy: "low",
    consistency: "med",
    partners: ["joker_stencil", "blueprint", "brainstorm", "invisible_joker", "hologram", "constellation"],
    antiSynergies: [],
    setupDifficulty: "high",
    risk: "med",
    notes: "Payoff scales multiplicatively with every Uncommon in your lineup — four Uncommons yield X1.5⁴ ≈ X5.06 for free. The risk is that chasing Uncommons crowds out better Jokers, so aim for Uncommons that are strong independently (Constellation, Hologram, Brainstorm) so each slot earns double duty.",
    beginner: "Every Uncommon Joker you own multiplies your score. Fill your Joker slots with Uncommon cards to stack free multipliers."
  },

  // ── 9. Blueprint ──────────────────────────────────────────────────────────────
  {
    id: "blueprint",
    name: "Blueprint",
    rarity: "rare",
    summary: "Copies ability of Joker to the right.",
    mainRole: "payoff",
    secondaryRole: "scaling_engine",
    tags: ["payoff", "scaling_engine", "pivot"],
    trigger: "passive copy — Joker to the right",
    scaling: "conditional",
    hands: ["any"],
    archetypes: ["retrigger_engine", "flush", "face_card", "held_in_hand"],
    stage: ["mid", "late"],
    economy: "low",
    consistency: "med",
    partners: ["brainstorm", "the_idol", "baron", "triboulet", "constellation", "cavendish"],
    antiSynergies: [],
    setupDifficulty: "med",
    risk: "low",
    notes: "Position is everything — Blueprint must sit immediately left of the Joker you want copied, so plan your Joker slot order before every hand. When chained with Brainstorm (Brainstorm copies Blueprint, Blueprint copies the target), you effectively triple a single payoff engine at zero additional cost.",
    beginner: "Copies whatever Joker is directly to its right. Always place it next to your strongest Joker."
  },

  // ── 10. Wee Joker ───────────────────────────────────────────────────────────
  {
    id: "wee_joker",
    name: "Wee Joker",
    rarity: "rare",
    summary: "This Joker gains +8 Chips when each played 2 is scored.",
    mainRole: "scaling_engine",
    secondaryRole: "chips",
    tags: ["scaling_engine", "chips", "payoff"],
    trigger: "scored 2 card",
    scaling: "linear",
    hands: ["any"],
    archetypes: ["high_card", "pair", "retrigger_engine", "deck_growth"],
    stage: ["early", "mid", "late"],
    economy: "low",
    consistency: "med",
    partners: ["hack", "seltzer", "blueprint", "brainstorm", "smeared_joker", "stone_joker"],
    antiSynergies: [],
    setupDifficulty: "med",
    risk: "low",
    notes: "Each scored 2 permanently adds +8 Chips, so Hack's retrigger of 2s means every 2 in a hand contributes +16 per round rather than +8. Stone Joker compounds the chip stack since the growing base chips make it increasingly effective — stack DNA or Certificate seals on 2s to maximize density.",
    beginner: "Play lots of 2s to permanently grow this Joker's chip bonus. Use Hack to double the growth each round."
  },

  // ── 13. Hit the Road ───────────────────────────────────────────────────────
  {
    id: "hit_the_road",
    name: "Hit the Road",
    rarity: "rare",
    summary: "Gains X0.5 Mult for every Jack discarded this round.",
    mainRole: "scaling_engine",
    secondaryRole: "xmult",
    tags: ["scaling_engine", "xmult", "discard_support"],
    trigger: "Jack discarded",
    scaling: "exponential",
    hands: ["any"],
    archetypes: ["discard", "high_card"],
    stage: ["mid", "late"],
    economy: "low",
    consistency: "med",
    partners: ["blueprint", "brainstorm", "drunkard", "faceless_joker"],
    antiSynergies: [],
    setupDifficulty: "med",
    risk: "med",
    notes: "Resets each round — so re-loading Jacks through DNA or Certificate seals matters. Drunkard gives extra discard attempts, and four Jacks discarded in one round is X3 alone.",
    beginner: "Discard Jacks every round to build up a big multiplier. Works best when you have lots of discards."
  },

  // ── 14. The Duo ────────────────────────────────────────────────────────────
  {
    id: "the_duo",
    name: "The Duo",
    rarity: "rare",
    summary: "X2 Mult if played hand contains a Pair.",
    mainRole: "xmult",
    secondaryRole: "payoff",
    tags: ["xmult", "payoff"],
    trigger: "hand contains a Pair",
    scaling: "conditional",
    hands: ["pair", "two_pair", "full_house", "four_of_a_kind"],
    archetypes: ["pair", "two_pair"],
    stage: ["mid", "late"],
    economy: "low",
    consistency: "high",
    partners: ["blueprint", "brainstorm", "the_idol", "dna"],
    antiSynergies: [],
    setupDifficulty: "low",
    risk: "low",
    notes: "The simplest of the conditional XMult series — Pairs are the most common hand, making this nearly always live. Blueprint next to it doubles the X2 to X4 for minimal effort.",
    beginner: "Play any hand with a pair in it to get a free X2. Almost always active."
  },

  // ── 15. The Trio ───────────────────────────────────────────────────────────
  {
    id: "the_trio",
    name: "The Trio",
    rarity: "rare",
    summary: "X3 Mult if played hand contains a Three of a Kind.",
    mainRole: "xmult",
    secondaryRole: "payoff",
    tags: ["xmult", "payoff"],
    trigger: "hand contains a Three of a Kind",
    scaling: "conditional",
    hands: ["three_of_a_kind", "full_house", "four_of_a_kind"],
    archetypes: ["three_of_a_kind"],
    stage: ["mid", "late"],
    economy: "low",
    consistency: "med",
    partners: ["blueprint", "brainstorm", "dna", "the_idol"],
    antiSynergies: [],
    setupDifficulty: "med",
    risk: "low",
    notes: "X3 is stronger than The Duo but requires three-of-a-kind presence; DNA duplication of a target rank makes the condition reliable. Full House also satisfies it.",
    beginner: "Score a Three of a Kind (or Full House) to activate the X3. Duplicate ranks with DNA to hit this more often."
  },

  // ── 16. The Family ─────────────────────────────────────────────────────────
  {
    id: "the_family",
    name: "The Family",
    rarity: "rare",
    summary: "X4 Mult if played hand contains a Four of a Kind.",
    mainRole: "xmult",
    secondaryRole: "payoff",
    tags: ["xmult", "payoff"],
    trigger: "hand contains a Four of a Kind",
    scaling: "conditional",
    hands: ["four_of_a_kind"],
    archetypes: ["four_of_a_kind"],
    stage: ["late"],
    economy: "low",
    consistency: "low",
    partners: ["blueprint", "brainstorm", "dna", "the_idol"],
    antiSynergies: [],
    setupDifficulty: "high",
    risk: "low",
    notes: "Highest payoff in the conditional XMult series at X4, but four-of-a-kind is the hardest hand to hit — DNA is nearly mandatory to ensure rank saturation. Blueprint next to it delivers X16.",
    beginner: "Score a Four of a Kind to get X4. You'll need DNA or rank duplication to hit this consistently."
  },

  // ── 17. The Order ──────────────────────────────────────────────────────────
  {
    id: "the_order",
    name: "The Order",
    rarity: "rare",
    summary: "X3 Mult if played hand contains a Straight.",
    mainRole: "xmult",
    secondaryRole: "payoff",
    tags: ["xmult", "payoff"],
    trigger: "hand contains a Straight",
    scaling: "conditional",
    hands: ["straight", "straight_flush"],
    archetypes: ["straight"],
    stage: ["mid", "late"],
    economy: "low",
    consistency: "med",
    partners: ["blueprint", "brainstorm", "drunkard", "the_idol"],
    antiSynergies: [],
    setupDifficulty: "med",
    risk: "low",
    notes: "Straight builds using Shortcut or extra discards keep this reliably live. Combine with The Tribe in a Straight Flush build for a stacked X3×X2 = X6 from two Jokers.",
    beginner: "Score a Straight hand to activate the X3. Use extra discards to find the cards you need."
  },

  // ── 18. The Tribe ──────────────────────────────────────────────────────────
  {
    id: "the_tribe",
    name: "The Tribe",
    rarity: "rare",
    summary: "X2 Mult if played hand contains a Flush.",
    mainRole: "xmult",
    secondaryRole: "payoff",
    tags: ["xmult", "payoff", "suit_support"],
    trigger: "hand contains a Flush",
    scaling: "conditional",
    hands: ["flush", "straight_flush"],
    archetypes: ["flush"],
    stage: ["mid", "late"],
    economy: "low",
    consistency: "med",
    partners: ["blueprint", "brainstorm", "smeared_joker", "the_idol"],
    antiSynergies: [],
    setupDifficulty: "med",
    risk: "low",
    notes: "Flush builds already run Smeared Joker for consistency, making this free X2 on every hand. Pair with The Order in Straight Flush runs for compounding conditional bonuses.",
    beginner: "Score a Flush to get X2 mult. Smeared Joker makes flushes easier and this almost always active."
  },

  // ── 19. Stuntman ───────────────────────────────────────────────────────────
  {
    id: "stuntman",
    name: "Stuntman",
    rarity: "rare",
    summary: "+250 Chips. Hand size −2.",
    mainRole: "chips",
    secondaryRole: "hand_size",
    tags: ["chips", "hand_size", "payoff"],
    trigger: "every scored hand",
    scaling: "static",
    hands: ["any"],
    archetypes: ["high_card", "held_in_hand"],
    stage: ["mid", "late"],
    economy: "low",
    consistency: "high",
    partners: ["stone_joker", "blueprint", "brainstorm"],
    antiSynergies: ["mime", "baron", "raised_fist"],
    setupDifficulty: "low",
    risk: "med",
    notes: "Massive chip floor but the hand-size penalty cripples held-in-hand builds. Avoid pairing with Baron or Mime — the math inverts fast.",
    beginner: "Huge chip boost at the cost of a smaller hand. Keep away from builds that rely on holding cards."
  },

  // ── 20. Invisible Joker ────────────────────────────────────────────────────
  {
    id: "invisible_joker",
    name: "Invisible Joker",
    rarity: "rare",
    summary: "After 2 rounds, sell this card to duplicate a random Joker (removes Negative from copy).",
    mainRole: "deck_manipulation",
    secondaryRole: "scaling_engine",
    tags: ["deck_manipulation", "scaling_engine", "payoff"],
    trigger: "sold after 2 rounds charge",
    scaling: "linear",
    hands: ["any"],
    archetypes: ["deck_growth", "economy_snowball"],
    stage: ["mid", "late"],
    economy: "med",
    consistency: "med",
    partners: ["campfire", "blueprint", "brainstorm", "cavendish", "swashbuckler"],
    antiSynergies: [],
    setupDifficulty: "med",
    risk: "med",
    notes: "The duplicated Joker is random, so plan around your strongest Joker being the likely pick. Selling into Campfire spike before a Boss is a classic combo.",
    beginner: "Hold this for 2 rounds then sell it to copy a random Joker. Try to have one really good Joker when you cash out."
  },

  // ── 19. Burnt Joker ─────────────────────────────────────────────────────────
  {
    id: "burnt_joker",
    name: "Burnt Joker",
    rarity: "rare",
    summary: "Upgrade level of the first discarded poker hand each round.",
    mainRole: "scaling_engine",
    secondaryRole: "discard_support",
    tags: ["scaling_engine", "discard_support", "enabler"],
    trigger: "first discard of each round",
    scaling: "linear",
    hands: ["any"],
    archetypes: ["discard", "deck_growth", "economy_snowball"],
    stage: ["early", "mid", "late"],
    economy: "low",
    consistency: "high",
    partners: ["mail_in_rebate", "faceless_joker", "drunkard", "burglar", "blueprint", "brainstorm"],
    antiSynergies: ["green_joker"],
    setupDifficulty: "low",
    risk: "low",
    notes: "Pivotal in discard builds — each round's first discard permanently levels up a hand type, compounding base chips and mult over the run without any additional cost. Pair with Faceless Joker and Mail-In Rebate for maximum discard economy so the free level-up each round never conflicts with scoring resources.",
    beginner: "Discard cards each round to permanently level up a poker hand. Do it every single round for massive long-term gains."
  },

  // ── 21. Brainstorm ─────────────────────────────────────────────────────────
  {
    id: "brainstorm",
    name: "Brainstorm",
    rarity: "rare",
    summary: "Copies the ability of the leftmost Joker.",
    mainRole: "payoff",
    secondaryRole: "scaling_engine",
    tags: ["payoff", "scaling_engine", "pivot"],
    trigger: "passive copy",
    scaling: "conditional",
    hands: ["any"],
    archetypes: ["retrigger_engine", "flush", "face_card", "held_in_hand"],
    stage: ["mid", "late"],
    economy: "low",
    consistency: "med",
    partners: ["blueprint", "the_idol", "baron", "triboulet", "constellation", "cavendish"],
    antiSynergies: [],
    setupDifficulty: "med",
    risk: "med",
    notes: "Pairs with Blueprint to triple a single XMult engine — position-locked so always plan slot order before the hand. Free value as long as the leftmost Joker is a payoff piece.",
    beginner: "Always copies the Joker on the far left of your row. Combine with Blueprint to triple your best Joker."
  },

  // ════════════════════════════════════════════════════════════════
  // LEGENDARY (5)
  // ════════════════════════════════════════════════════════════════
  // ── 1. Canio ───────────────────────────────────────────────────────────────
  {
    id: "canio",
    name: "Canio",
    rarity: "legendary",
    summary: "Gains X1 Mult each time a face card is destroyed.",
    mainRole: "scaling_engine",
    secondaryRole: "xmult",
    tags: ["scaling_engine", "xmult", "destroy_value", "payoff"],
    trigger: "face card destroyed",
    scaling: "exponential",
    hands: ["any"],
    archetypes: ["face_card", "glass", "deck_growth"],
    stage: ["mid", "late"],
    economy: "low",
    consistency: "med",
    partners: ["blueprint", "brainstorm", "glass_joker", "hack", "triboulet", "pareidolia"],
    antiSynergies: [],
    setupDifficulty: "high",
    risk: "high",
    notes: "Every destroyed face card permanently adds X1 to Canio's multiplier — Glass face cards cracking under Hack retriggers are the fastest path to enormous stacks. Pareidolia dramatically expands the pool of destruction-eligible cards, and Triboulet turns remaining face cards into immediate scoring on top of the accumulated XMult. The ceiling is practically unlimited but demands accepting irreversible card loss as the price of power.",
    beginner: "Destroy face cards (especially Glass ones) to permanently multiply your score. Risky but eventually unstoppable."
  },

  // ── 2. Triboulet ───────────────────────────────────────────────────────────
  {
    id: "triboulet",
    name: "Triboulet",
    rarity: "legendary",
    summary: "Played Kings and Queens give X2 Mult when scored.",
    mainRole: "xmult",
    secondaryRole: "rank_face_support",
    tags: ["xmult", "payoff", "rank_face_support"],
    trigger: "scored face card — King or Queen",
    scaling: "multiplicative",
    hands: ["pair", "two_pair", "four_of_a_kind"],
    archetypes: ["face_card"],
    stage: ["late"],
    economy: "low",
    consistency: "high",
    partners: ["blueprint", "brainstorm", "sock_and_buskin", "pareidolia", "midas_mask", "hanging_chad"],
    antiSynergies: [],
    setupDifficulty: "med",
    risk: "low",
    notes: "The flagship legendary — each scored King or Queen independently multiplies the running total, so a hand with two Queens and a King yields X2×X2×X2 = X8 before any retrigger. Sock and Buskin retriggers face cards, effectively doubling every X2 application, while Brainstorm positioned on the left copies the full effect. Blueprint stacked next to Brainstorm can triple the per-card multiplier, making Triboulet the definitive endgame payoff engine.",
    beginner: "Every King or Queen you play multiplies your score. Pack your deck with face cards and watch the numbers explode."
  },

  // ── 3. Yorick ──────────────────────────────────────────────────────────────
  {
    id: "yorick",
    name: "Yorick",
    rarity: "legendary",
    summary: "Gains X1 Mult every 23 cards discarded.",
    mainRole: "scaling_engine",
    secondaryRole: "xmult",
    tags: ["scaling_engine", "xmult", "discard_support"],
    trigger: "every 23 cards discarded",
    scaling: "exponential",
    hands: ["any"],
    archetypes: ["discard", "economy_snowball"],
    stage: ["mid", "late"],
    economy: "low",
    consistency: "med",
    partners: ["blueprint", "brainstorm", "drunkard", "faceless_joker", "hit_the_road", "merry_andy"],
    antiSynergies: [],
    setupDifficulty: "high",
    risk: "low",
    notes: "Patient scaling engine that rewards discard-heavy builds across the entire run — every 23 cards binned permanently adds X1, with no cap and no reset. Drunkard and Merry Andy accelerate the discard count, and Hit the Road synergizes beautifully since both reward discard volume. By the final antes, Yorick routinely sits at X5–X10 in discard-dedicated builds, making Blueprint or Brainstorm copy its value one of the highest-return plays in the game.",
    beginner: "Discard cards as often as possible throughout the run. After every 23 discards this gets permanently stronger. Pair it with Jokers that give you extra discards."
  },

  // ── 4. Chicot ──────────────────────────────────────────────────────────────
  {
    id: "chicot",
    name: "Chicot",
    rarity: "legendary",
    summary: "Disables the effect of every Boss Blind.",
    mainRole: "pivot",
    secondaryRole: "consistency",
    tags: ["pivot", "consistency"],
    trigger: "passive — Boss Blind selected",
    scaling: "static",
    hands: ["any"],
    archetypes: ["high_card", "flush", "face_card"],
    stage: ["mid", "late"],
    economy: "low",
    consistency: "high",
    partners: ["blueprint", "brainstorm", "luchador", "mr_bones", "vagabond"],
    antiSynergies: [],
    setupDifficulty: "low",
    risk: "low",
    notes: "A generalist legendary that functions as unconditional insurance against every Boss Blind debuff for the rest of the run — no more The Hook destroying your held cards, no The Wall blocking your Flush, no The Eye banning your primary hand. This fundamentally changes build construction by removing the defensive tax: you no longer need to waste Joker slots hedging against bosses, freeing space for pure scaling engines. Stack alongside Luchador if you want complete immunity layers.",
    beginner: "Turns off all Boss Blind effects permanently. You can now play your best strategy every round without worrying about the boss."
  },

  // ── 5. Perkeo ──────────────────────────────────────────────────────────────
  {
    id: "perkeo",
    name: "Perkeo",
    rarity: "legendary",
    summary: "Creates a Negative copy of 1 random consumable in your possession at the end of each shop.",
    mainRole: "economy",
    secondaryRole: "consistency",
    tags: ["economy", "consistency", "scaling_engine"],
    trigger: "end of shop — consumable duplicated as Negative",
    scaling: "linear",
    hands: ["any"],
    archetypes: ["economy_snowball", "deck_growth"],
    stage: ["late"],
    economy: "high",
    consistency: "high",
    partners: ["hologram", "constellation", "satellite", "blueprint", "brainstorm", "vagabond"],
    antiSynergies: [],
    setupDifficulty: "med",
    risk: "low",
    notes: "Each shop visit permanently doubles your consumable output for free — Negative copies don't use a consumable slot, so a single Planet or Tarot effectively fires twice per purchase. This makes Constellation scaling nearly twice as fast (every Planet used is a Perkeo-cloned Planet used too), Hologram jumps per cloned Standard pack card, and Vagabond Tarot generation becomes a firehose of deck manipulation. The compounding effect of two free consumables per shop visit across a full run is one of the most powerful economy engines in the game.",
    beginner: "Duplicates a consumable every time you leave the shop. More Planets, more Tarots, more everything — without spending extra money."
  },
];

// ------------------------------------------------------------------
// SYNERGIES — 25+ explicit relationships with categorized reasoning
// ------------------------------------------------------------------

export type SynergyKind =
  | "core_pair" | "strong_support" | "conditional"
  | "archetype_only" | "risky_explosive" | "trap_unless_enabled";

export interface Synergy {
  a: string; b: string;
  kind: SynergyKind;
  engine: "retrigger" | "xmult_stack" | "deck_manipulation" | "consistency"
        | "economy" | "face_card" | "discard_volume" | "enhancement"
        | "suit_unification" | "scaling";
  why: string;
}

export const SYNERGIES: Synergy[] = [
  { a: "blueprint", b: "brainstorm", kind: "core_pair", engine: "xmult_stack",
    why: "Position-locked copy pair. Stack them around your strongest XMult engine to multiply its output three times in the same scoring pass." },
  { a: "blueprint", b: "the_idol", kind: "core_pair", engine: "xmult_stack",
    why: "Each Idol match is X2 — Blueprint doubles the dip on the same scored hand, turning matched cards into X4-per-card scaling." },
  { a: "brainstorm", b: "triboulet", kind: "core_pair", engine: "xmult_stack",
    why: "Position Triboulet far-left so Brainstorm copies it. Every King and Queen scored applies two stacked X2 multipliers." },
  { a: "mime", b: "baron", kind: "core_pair", engine: "retrigger",
    why: "Baron's X1.5 per held King is re-applied by Mime in the held-in-hand phase, turning each King into X2.25." },
  { a: "mime", b: "steel_joker", kind: "core_pair", engine: "retrigger",
    why: "Steel cards trigger their X1.5 once in held-in-hand. Mime re-triggers, doubling Steel pressure for free." },
  { a: "sock_and_buskin", b: "triboulet", kind: "core_pair", engine: "retrigger",
    why: "Sock retriggers every scored face card, and each retrigger re-applies Triboulet's X2 — the canonical face-card scaling loop." },
  { a: "pareidolia", b: "triboulet", kind: "strong_support", engine: "face_card",
    why: "Pareidolia makes every scored card count as a face card, so Triboulet's X2 fires on the whole hand instead of just Kings and Queens." },
  { a: "pareidolia", b: "midas_mask", kind: "strong_support", engine: "economy",
    why: "Midas turns scored face cards into Gold; Pareidolia means every card qualifies, snowballing income each hand." },
  { a: "smeared_joker", b: "greedy_joker", kind: "strong_support", engine: "suit_unification",
    why: "Smeared merges Diamonds with Hearts, doubling the count of cards that proc Greedy's +4 Mult." },
  { a: "smeared_joker", b: "the_idol", kind: "strong_support", engine: "suit_unification",
    why: "Halves the effective suit pool, so Idol's rank+suit target shows up roughly twice as often per shuffle." },
  { a: "hack", b: "glass_joker", kind: "risky_explosive", engine: "retrigger",
    why: "Hack retriggers low cards twice, doubling chances of cracking Glass each hand and accelerating Glass Joker's permanent X0.75 stacks." },
  { a: "hack", b: "fibonacci", kind: "strong_support", engine: "retrigger",
    why: "2, 3, and 5 are both Fibonacci ranks and Hack ranks — every Fibonacci proc fires twice." },
  { a: "raised_fist", b: "mime", kind: "strong_support", engine: "retrigger",
    why: "Mime re-triggers the held-in-hand phase, so Raised Fist's flat mult applies twice from a single low card kept in hand." },
  { a: "hanging_chad", b: "the_idol", kind: "strong_support", engine: "retrigger",
    why: "Lead with the Idol-target card: Hanging Chad triggers it three times, stacking three X2 multiplications from one scored card." },
  { a: "dna", b: "the_idol", kind: "conditional", engine: "deck_manipulation",
    why: "DNA permanently duplicates whatever you single-play. Pick an Idol-target card and farm its X2 procs by stacking the deck." },
  { a: "dna", b: "hologram", kind: "strong_support", engine: "deck_manipulation",
    why: "Every DNA-cloned card grows Hologram by X0.25 — a free XMult scaling loop." },
  { a: "constellation", b: "astronomer", kind: "archetype_only", engine: "scaling",
    why: "Planet Merchant doubles Planet shop rate; every Planet bought pumps Constellation's XMult. Pure Planet-economy axis." },
  { a: "satellite", b: "astronomer", kind: "archetype_only", engine: "economy",
    why: "Satellite scales income with unique Planets used; Planet Merchant guarantees you see more Planet variety." },
  { a: "drunkard", b: "mail_in_rebate", kind: "strong_support", engine: "discard_volume",
    why: "Extra discards mean more chances to dump rebate-target ranks for money each round." },
  { a: "drunkard", b: "faceless_joker", kind: "strong_support", engine: "discard_volume",
    why: "More discards make hitting the 3-face-card threshold easier, especially in face-heavy decks." },
  { a: "stuntman", b: "baron", kind: "trap_unless_enabled", engine: "consistency",
    why: "Stuntman cuts hand size by 2, gutting Baron's per-King multiplier. Only run together if you patch hand size aggressively." },
  { a: "ride_the_bus", b: "triboulet", kind: "trap_unless_enabled", engine: "face_card",
    why: "Ride the Bus resets on any scored face card — Triboulet wants to score face cards. They actively cancel each other." },
  { a: "green_joker", b: "drunkard", kind: "trap_unless_enabled", engine: "discard_volume",
    why: "Green Joker loses mult per discard, undoing Drunkard's whole purpose. Pick one direction." },
  { a: "vampire", b: "steel_joker", kind: "trap_unless_enabled", engine: "enhancement",
    why: "Vampire eats enhancements off your cards. Every card it consumes lowers Steel Joker's permanent stack." },
  { a: "pareidolia", b: "greedy_joker", kind: "trap_unless_enabled", engine: "face_card",
    why: "Once everything is a face card, suit-specific Jokers like Greedy stop differentiating their bonus reliably in mixed builds." },
  { a: "perkeo", b: "constellation", kind: "strong_support", engine: "scaling",
    why: "Perkeo duplicates Planet consumables as Negative copies; Constellation rides the extra Planet plays for free XMult." },
  { a: "seltzer", b: "triboulet", kind: "risky_explosive", engine: "retrigger",
    why: "Seltzer doubles every scored card for 10 hands. Spike Triboulet during boss blinds, then pivot when it expires." },
  { a: "midas_mask", b: "golden_joker", kind: "strong_support", engine: "economy",
    why: "Two stacked income sources — Midas converts face cards to gold while Golden Joker pays passive end-of-round interest support." },
  { a: "stone_joker", b: "driver_gloves", kind: "strong_support", engine: "enhancement",
    why: "Stones count as Enhanced cards toward Driver's License threshold and individually pump Stone Joker chips. Two payoffs from one conversion." },
  { a: "obelisk", b: "blueprint", kind: "conditional", engine: "scaling",
    why: "Once Obelisk has parked a huge XMult, Blueprint copies it — but only commit when you've truly stopped playing your most-played hand." },

  // ════════ EXPANDED — 150-Joker pool ════════
  // ─── RETRIGGER (12) ──────────────────────────────────────────────────────────

  // Sock and Buskin × Photograph
  {
    a: "sock_and_buskin", b: "photograph",
    kind: "strong_support", engine: "retrigger",
    why: "Sock and Buskin retriggers every scored face card; Photograph procs on the FIRST face card — after the retrigger, Photograph's trigger window fires again, delivering two X2 ticks from a single face card."
  },
  // Sock and Buskin × Smiley Face
  {
    a: "sock_and_buskin", b: "smiley_face",
    kind: "strong_support", engine: "retrigger",
    why: "Each retrigger by Sock and Buskin replays the scored face card in full, doubling every per-face-card flat-mult Joker including Smiley Face's +5 Mult — five face cards in a flush become +50 Mult instead of +25."
  },
  // Sock and Buskin × Scary Face
  {
    a: "sock_and_buskin", b: "scary_face",
    kind: "strong_support", engine: "retrigger",
    why: "Sock and Buskin retriggers every face card; each retrigger also doubles Scary Face's +30 Chips chip bonus, covering the chip side that Sock's face-card mult engine typically lacks."
  },
  // Dusk × The Idol
  {
    a: "dusk", b: "the_idol",
    kind: "core_pair", engine: "retrigger",
    why: "Dusk retriggers every scored card on the final hand of the round; if the Idol-target card is in that hand, each retrigger fires another X2, stacking multiplicatively on a hand already delivering the burst payoff."
  },
  // Dusk × Acrobat
  {
    a: "dusk", b: "acrobat",
    kind: "core_pair", engine: "retrigger",
    why: "Both effects trigger on the final hand of the round — Acrobat contributes X3 and Dusk retriggers every played card, letting Acrobat's X3 apply to a doubled scoring pass on the same hand."
  },
  // Hanging Chad × Triboulet
  {
    a: "hanging_chad", b: "triboulet",
    kind: "strong_support", engine: "retrigger",
    why: "Hanging Chad triggers the lead scoring card three times total; if that card is a King or Queen, Triboulet applies its X2 three times in sequence — X2×X2×X2 = X8 from one well-placed face card."
  },
  // Hack × Wee Joker
  {
    a: "hack", b: "wee_joker",
    kind: "core_pair", engine: "retrigger",
    why: "Hack retriggers every played 2 once extra; each retrigger counts as an additional scored 2, doubling Wee Joker's permanent +8 Chips accumulation per 2 scored — one played 2 yields +16 Chips of permanent growth instead of +8."
  },
  // Hack × Even Steven
  {
    a: "hack", b: "even_steven",
    kind: "strong_support", engine: "retrigger",
    why: "2 and 4 are both Even Steven ranks and Hack ranks — every played 2 or 4 fires Even Steven's +4 Mult twice, effectively +8 Mult per low even card scored."
  },
  // Seltzer × The Idol
  {
    a: "seltzer", b: "the_idol",
    kind: "risky_explosive", engine: "retrigger",
    why: "Seltzer retriggers every scored card for 10 hands; each retrigger re-fires The Idol's X2 on matching cards, turning a single Idol-target card into X4 per triggered copy for the Seltzer window."
  },
  // Mime × Shoot the Moon
  {
    a: "mime", b: "shoot_the_moon",
    kind: "strong_support", engine: "retrigger",
    why: "Shoot the Moon gives +13 Mult per Queen held in hand during the held-in-hand phase; Mime re-triggers that phase, giving +26 Mult per held Queen for free from a single held-hand phase."
  },
  // Mime × Reserved Parking
  {
    a: "mime", b: "reserved_parking",
    kind: "strong_support", engine: "retrigger",
    why: "Reserved Parking triggers per held face card in the held-in-hand phase; Mime re-triggers the held-in-hand phase, doubling each face card's 1-in-2 income roll and roughly doubling the passive money earned."
  },
  // Hanging Chad × Photograph
  {
    a: "hanging_chad", b: "photograph",
    kind: "strong_support", engine: "retrigger",
    why: "Photograph fires once per hand on the first face card scored; Hanging Chad retriggers the first scored card two extra times — if the lead card is a face card, Photograph's X2 applies on all three passes."
  },

  // ─── XMULT_STACK (7) ─────────────────────────────────────────────────────────

  // Blueprint × Triboulet
  {
    a: "blueprint", b: "triboulet",
    kind: "core_pair", engine: "xmult_stack",
    why: "Blueprint copies the Joker to its right; positioned immediately left of Triboulet it fires Triboulet's X2-per-King/Queen a second time on the same scoring pass, turning each face card into X4 per trigger."
  },
  // Brainstorm × The Idol
  {
    a: "brainstorm", b: "the_idol",
    kind: "core_pair", engine: "xmult_stack",
    why: "Position The Idol leftmost; Brainstorm copies it, applying X2 per matching card twice in the same scoring pass — one Idol-target card goes from X2 to X4 at zero extra cost."
  },
  // The Duo × Blueprint
  {
    a: "the_duo", b: "blueprint",
    kind: "strong_support", engine: "xmult_stack",
    why: "The Duo applies X2 whenever a Pair appears in the hand; Blueprint copies it to deliver a second X2 on the same hand, making every Pair-containing hand a free X4 XMult stack."
  },
  // The Tribe × The Order
  {
    a: "the_tribe", b: "the_order",
    kind: "core_pair", engine: "xmult_stack",
    why: "Both conditional XMult Jokers fire simultaneously on Straight Flush hands — The Tribe contributes X2 and The Order contributes X3, stacking to X6 on every Straight Flush scored."
  },
  // Ancient Joker × Smeared Joker
  {
    a: "ancient_joker", b: "smeared_joker",
    kind: "strong_support", engine: "xmult_stack",
    why: "Ancient Joker applies X1.5 per scored card of the active suit; Smeared Joker collapses four suits to two, so roughly half your deck triggers X1.5 on any hand regardless of suit rotation."
  },
  // Bloodstone × Oops All 6s
  {
    a: "bloodstone", b: "oops_all_6s",
    kind: "core_pair", engine: "xmult_stack",
    why: "Oops! All 6s doubles Bloodstone's 1-in-2 Heart proc to guaranteed — every scored Heart card becomes a certain X1.5 tick, turning Heart flushes into a reliable X1.5-per-card multiplicative engine."
  },
  // Baseball Card × Constellation
  {
    a: "baseball_card", b: "constellation",
    kind: "strong_support", engine: "xmult_stack",
    why: "Baseball Card gives X1.5 Mult per Uncommon Joker owned; Constellation is Uncommon and one of the strongest XMult scalers in the game — owning both gives X1.5 from Baseball Card for Constellation's presence, while Constellation independently compounds via Planets."
  },

  // ─── DECK_MANIPULATION (6) ───────────────────────────────────────────────────

  // DNA × Cavendish
  {
    a: "dna", b: "cavendish",
    kind: "conditional", engine: "deck_manipulation",
    why: "DNA single-play duplication can target any card — cloning an Ace into a deck stacked with four copies guarantees consistent high-value hands while Cavendish provides the X3 payoff on every scored hand that emerges."
  },
  // Marble Joker × Stone Joker
  {
    a: "marble_joker", b: "stone_joker",
    kind: "core_pair", engine: "deck_manipulation",
    why: "Marble Joker adds one Stone card to the deck every blind; each added Stone grows Stone Joker by +25 Chips per scored hand — passive blind-count scaling delivers a free chip engine with no per-hand effort required."
  },
  // Sixth Sense × Perkeo
  {
    a: "sixth_sense", b: "perkeo",
    kind: "strong_support", engine: "deck_manipulation",
    why: "Sixth Sense produces a Spectral card each round by sacrificing a 6; Perkeo duplicates a random consumable each shop — holding the Spectral across shop visits guarantees a free Negative Spectral copy, effectively doubling every Sixth Sense proc over the run."
  },
  // Cartomancer × Fortune Teller
  {
    a: "cartomancer", b: "fortune_teller",
    kind: "strong_support", engine: "deck_manipulation",
    why: "Cartomancer creates a free Tarot every blind selection; each Tarot used permanently adds +1 Mult to Fortune Teller — the two form a closed loop where Tarot generation directly translates into permanent flat mult."
  },
  // Certificate × Steel Joker
  {
    a: "certificate", b: "steel_joker",
    kind: "strong_support", engine: "deck_manipulation",
    why: "Certificate adds a sealed random card to your hand each round start; when those added cards carry Purple Seals or are manually enhanced to Steel, Steel Joker's XMult grows for free each round without Tarot expenditure."
  },
  // Trading Card × Erosion
  {
    a: "trading_card", b: "erosion",
    kind: "strong_support", engine: "deck_manipulation",
    why: "Trading Card destroys the first single-discard card each round and earns $3; each destroyed card permanently grows Erosion by +4 Mult — free passive mult scaling every round that also provides income."
  },

  // ─── CONSISTENCY (5) ─────────────────────────────────────────────────────────

  // Four Fingers × Smeared Joker
  {
    a: "four_fingers", b: "smeared_joker",
    kind: "core_pair", engine: "consistency",
    why: "Four Fingers reduces flush requirement to 4 cards; Smeared Joker halves the suit pool — together nearly any four cards from a two-suit deck form a flush, making 5-card flush builds nearly unconditional."
  },
  // Shortcut × Four Fingers
  {
    a: "shortcut", b: "four_fingers",
    kind: "core_pair", engine: "consistency",
    why: "Shortcut allows gapped straights; Four Fingers reduces the count to 4 — any four roughly sequential cards form a straight, unlocking Straight Flush as a nearly-free hand type when combined with Smeared."
  },
  // Burglar × Mystic Summit
  {
    a: "burglar", b: "mystic_summit",
    kind: "core_pair", engine: "consistency",
    why: "Burglar eliminates all discards at blind start; Mystic Summit requires exactly 0 remaining discards for its +15 Mult bonus — Burglar guarantees Mystic Summit fires every single hand without any discipline overhead."
  },
  // Loyalty Card × Card Sharp
  {
    a: "loyalty_card", b: "card_sharp",
    kind: "trap_unless_enabled", engine: "consistency",
    why: "Loyalty Card wants you to play every 6th hand big; Card Sharp gives X3 on repeated hand-type plays — they create cycle tension where the X4 Loyalty trigger forces a hand choice that might reset or conflict with Card Sharp's same-hand bonus."
  },
  // Space Joker × Oops All 6s
  {
    a: "space_joker", b: "oops_all_6s",
    kind: "strong_support", engine: "consistency",
    why: "Space Joker's 1-in-4 free hand-level upgrade doubles to 2-in-4 (50%) via Oops! All 6s, turning passive hand-levelling into a near-reliable engine that grows base chips and mult every other hand."
  },

  // ─── ECONOMY (8) ─────────────────────────────────────────────────────────────

  // To the Moon × Bull
  {
    a: "to_the_moon", b: "bull",
    kind: "core_pair", engine: "economy",
    why: "To the Moon raises the effective interest cap, letting you hold more money profitably; Bull converts each held dollar into +2 Chips per scored hand — the same cash reserve that earns more interest also delivers more chips every hand."
  },
  // Cloud 9 × Rocket
  {
    a: "cloud_9", b: "rocket",
    kind: "strong_support", engine: "economy",
    why: "Both are end-of-round passive income sources that stack independently — Cloud 9 scales with 9-density while Rocket scales with Boss blinds defeated, covering early and late phases of the run with distinct income curves."
  },
  // Golden Joker × Delayed Gratification
  {
    a: "golden_joker", b: "delayed_gratification",
    kind: "strong_support", engine: "economy",
    why: "Delayed Gratification pays $2 per unspent discard if no discards are used; Golden Joker's end-of-round $4 stacks on top — running both in a clean no-discard build generates $4 + (discards × $2) passively every round."
  },
  // Rough Gem × Greedy Joker
  {
    a: "rough_gem", b: "greedy_joker",
    kind: "strong_support", engine: "economy",
    why: "Rough Gem earns $1 for each scored Diamond; Greedy Joker earns +3 Mult per scored Diamond — every Diamond card scored simultaneously advances both income and scoring, a rare dual-payoff per card."
  },
  // Midas Mask × Golden Ticket
  {
    a: "midas_mask", b: "golden_ticket",
    kind: "core_pair", engine: "economy",
    why: "Midas Mask converts scored face cards to Gold permanently; Golden Ticket earns $4 each time a Gold card is scored — once face cards are converted, every face card scored returns $4 on top of its scoring contribution."
  },
  // Business Card × Pareidolia
  {
    a: "business_card", b: "pareidolia",
    kind: "strong_support", engine: "economy",
    why: "Business Card has a 1-in-2 chance to pay $2 per scored face card; Pareidolia makes every card a face card — in a 5-card hand, expected income per hand jumps from 1-2 cards qualifying to all 5, roughly tripling Business Card's income."
  },
  // Gift Card × Swashbuckler
  {
    a: "gift_card", b: "swashbuckler",
    kind: "strong_support", engine: "economy",
    why: "Gift Card adds $1 of sell value to every Joker each round; Swashbuckler converts total Joker sell value into flat Mult — Gift Card passively inflates Swashbuckler's Mult by $1 per Joker per round, compounding multiplicatively over the run."
  },
  // Vagabond × Perkeo
  {
    a: "vagabond", b: "perkeo",
    kind: "strong_support", engine: "economy",
    why: "Vagabond creates a Tarot whenever you play with ≤$4; Perkeo duplicates a random consumable at end of shop — deliberately spending to the Vagabond threshold before shopping then triggers Perkeo on the generated Tarot, effectively producing two Tarots for the cost of one planned low-balance hand."
  },

  // ─── FACE_CARD (6) ───────────────────────────────────────────────────────────

  // Pareidolia × Sock and Buskin
  {
    a: "pareidolia", b: "sock_and_buskin",
    kind: "core_pair", engine: "face_card",
    why: "Pareidolia makes every card a face card; Sock and Buskin retriggers every scored face card — the combination retriggers every single card played in any hand, effectively doubling all per-card scoring contributions."
  },
  // Pareidolia × Scary Face
  {
    a: "pareidolia", b: "scary_face",
    kind: "strong_support", engine: "face_card",
    why: "With Pareidolia active every scored card qualifies for Scary Face's +30 Chips, turning a 5-card hand into a guaranteed +150 Chips chip floor on top of base hand chips — a consistent chip foundation for any build."
  },
  // Pareidolia × Smiley Face
  {
    a: "pareidolia", b: "smiley_face",
    kind: "strong_support", engine: "face_card",
    why: "Pareidolia makes every card a face card, so Smiley Face's +5 Mult fires on each of the five scored cards — +25 flat Mult baseline on any hand, stacking with suit Jokers and hand-levelling as a reliable floor."
  },
  // Canio × Pareidolia
  {
    a: "canio", b: "pareidolia",
    kind: "risky_explosive", engine: "face_card",
    why: "Canio gains X1 Mult permanently each time a face card is destroyed; Pareidolia makes every card a face card — any card that gets destroyed (Glass cracking, Sixth Sense consuming a 6, trading card kills) now advances Canio's multiplier, drastically expanding the pool of destruction-eligible cards."
  },
  // Triboulet × Dusk
  {
    a: "triboulet", b: "dusk",
    kind: "strong_support", engine: "face_card",
    why: "Dusk retriggers all scored cards on the final hand; Triboulet fires X2 per King or Queen scored — the final-hand retrigger doubles every Triboulet X2 application, turning a two-King final hand from X4 to X8 at no extra cost."
  },
  // Hit the Road × Drunkard
  {
    a: "hit_the_road", b: "drunkard",
    kind: "strong_support", engine: "face_card",
    why: "Hit the Road gains X0.5 Mult per discarded Jack each round; Drunkard gives +1 discard per round — the extra discard enables one more Jack discard opportunity, consistently pushing Hit the Road's per-round growth from X1.5 to X2 per 3-Jack deck."
  },

  // ─── DISCARD_VOLUME (5) ──────────────────────────────────────────────────────

  // Yorick × Merry Andy
  {
    a: "yorick", b: "merry_andy",
    kind: "strong_support", engine: "discard_volume",
    why: "Yorick gains X1 Mult per 23 cards discarded; Merry Andy adds +3 discards per round — the extra discards across a full run compress Yorick's 23-card threshold from ~6 rounds to ~4 rounds, accelerating its permanent XMult stack."
  },
  // Castle × Drunkard
  {
    a: "castle", b: "drunkard",
    kind: "strong_support", engine: "discard_volume",
    why: "Castle gains +3 Chips per discarded card of its rotating suit; Drunkard adds +1 discard per round — each extra discard generates an additional chip-scaling opportunity every round if the discarded card matches the active Castle suit."
  },
  // Burnt Joker × Faceless Joker
  {
    a: "burnt_joker", b: "faceless_joker",
    kind: "strong_support", engine: "discard_volume",
    why: "Burnt Joker upgrades the discarded poker hand type each round as a free hand-level boost; Faceless Joker pays $5 for discarding 3+ face cards simultaneously — both rewards fire off the same discard action without competing for resources."
  },
  // Yorick × Hit the Road
  {
    a: "yorick", b: "hit_the_road",
    kind: "strong_support", engine: "discard_volume",
    why: "Both Jokers scale their XMult from discard volume — Yorick permanently accumulates across the run while Hit the Road resets each round but pays off quickly within a single round's discard budget, covering both long-game and burst-scaling axes."
  },
  // Ramen × Mystic Summit
  {
    a: "ramen", b: "mystic_summit",
    kind: "strong_support", engine: "discard_volume",
    why: "Ramen loses X0.01 Mult per discard and Mystic Summit only activates at zero discards — running both enforces a no-discard discipline that preserves Ramen's X2 cap and guarantees Mystic Summit's +15 Mult fires every hand the round."
  },

  // ─── ENHANCEMENT (6) ─────────────────────────────────────────────────────────

  // Vampire × Hack
  {
    a: "vampire", b: "hack",
    kind: "strong_support", engine: "enhancement",
    why: "Hack retriggers every played 2–5; if any of those low cards are enhanced, each retrigger counts as an additional enhanced card trigger for Vampire's XMult accumulation, doubling Vampire's growth rate on low-rank enhanced cards."
  },
  // Driver's License × Marble Joker
  {
    a: "driver_gloves", b: "marble_joker",
    kind: "strong_support", engine: "enhancement",
    why: "Marble Joker adds a Stone card to the deck each blind — Stone cards count as Enhanced cards toward Driver's License's 16-card threshold; together they passively reach the X3 threshold without any Tarot expenditure."
  },
  // Glass Joker × Seltzer
  {
    a: "glass_joker", b: "seltzer",
    kind: "risky_explosive", engine: "enhancement",
    why: "Seltzer retriggers every played card for 10 hands; Glass cards have their destruction chance applied on each retrigger — each Seltzer-active hand roughly doubles the number of Glass shatters, accelerating Glass Joker's permanent XMult stack in a concentrated burst."
  },
  // Lucky Cat × Oops All 6s
  {
    a: "lucky_cat", b: "oops_all_6s",
    kind: "strong_support", engine: "enhancement",
    why: "Lucky Cat grows X0.25 Mult per Lucky card proc; Oops! All 6s doubles the 1-in-5 trigger chance to 2-in-5 — nearly doubling average Lucky Cat growth per round and converting it from a slow scaler into a mid-game XMult engine."
  },
  // Steel Joker × Driver's License
  {
    a: "steel_joker", b: "driver_gloves",
    kind: "strong_support", engine: "enhancement",
    why: "Steel cards counted by Steel Joker for XMult also count toward Driver's License's 16-enhanced-card threshold — stacking Steel enhancements simultaneously grows the XMult engine and unlocks the flat X3, two payoffs from one enhancement campaign."
  },
  // Vampire × Smeared Joker
  {
    a: "vampire", b: "smeared_joker",
    kind: "conditional", engine: "enhancement",
    why: "Vampire grows from scored enhanced cards and doesn't care about suit — Smeared Joker has no direct interaction, but in flush builds Smeared increases the number of cards scored per hand, indirectly raising the number of enhanced card triggers per round."
  },

  // ─── SUIT_UNIFICATION (6) ────────────────────────────────────────────────────

  // Smeared Joker × Lusty Joker
  {
    a: "smeared_joker", b: "lusty_joker",
    kind: "strong_support", engine: "suit_unification",
    why: "Smeared Joker merges Hearts with Diamonds; Lusty Joker rewards scored Heart cards — every Diamond in the hand now counts as a Heart, doubling the number of cards that trigger Lusty's +3 Mult in Heart-Diamond flush builds."
  },
  // Smeared Joker × Gluttonous Joker
  {
    a: "smeared_joker", b: "gluttonous_joker",
    kind: "strong_support", engine: "suit_unification",
    why: "Smeared Joker merges Clubs with Spades; Gluttonous Joker rewards Club cards — every Spade card now triggers Gluttonous's +3 Mult, effectively doubling dark-suit payoffs across Spade/Club flush builds."
  },
  // Smeared Joker × Blackboard
  {
    a: "smeared_joker", b: "blackboard",
    kind: "core_pair", engine: "suit_unification",
    why: "Blackboard gives X3 Mult when all held cards are Spades or Clubs; Smeared merges Spades and Clubs into one effective suit — any hand composed of dark-suit cards now satisfies Blackboard unconditionally."
  },
  // Smeared Joker × Wrathful Joker
  {
    a: "smeared_joker", b: "wrathful_joker",
    kind: "strong_support", engine: "suit_unification",
    why: "Smeared merges Spades and Clubs; Wrathful rewards scored Spades — every Club now counts as Spade, doubling the number of Wrathful +3 Mult triggers in Club/Spade builds and making Wrathful viable alongside Gluttonous."
  },
  // Flower Pot × Four Fingers
  {
    a: "flower_pot", b: "four_fingers",
    kind: "strong_support", engine: "suit_unification",
    why: "Flower Pot requires all four suits in one hand for X3; Four Fingers reduces the hand size requirement to 4 cards — a 4-card hand containing one card of each suit satisfies Flower Pot, and the freed fifth slot can hold a key card for another payoff."
  },
  // Ancient Joker × The Idol
  {
    a: "ancient_joker", b: "the_idol",
    kind: "conditional", engine: "suit_unification",
    why: "Ancient Joker rotates its active suit each round; The Idol rotates its target rank+suit each round — when they align on the same suit in the same round, the matching card delivers both X1.5 from Ancient and X2 from Idol for a X3 per-card burst."
  },

  // ─── SCALING (5) ─────────────────────────────────────────────────────────────

  // Hologram × Marble Joker
  {
    a: "hologram", b: "marble_joker",
    kind: "strong_support", engine: "scaling",
    why: "Marble Joker adds one Stone card to the deck each blind; every added card grows Hologram by X0.25 — without spending a cent or opening packs, Marble drives Hologram's XMult upward by X0.25 every blind."
  },
  // Constellation × Astronomer
  {
    a: "constellation", b: "astronomer",
    kind: "core_pair", engine: "scaling",
    why: "Astronomer makes all Planet cards and Celestial Packs free; every free Planet fuels Constellation's X0.1-per-use XMult accumulation — the two convert saved money into free exponential scaling across the run."
  },
  // Obelisk × Acrobat
  {
    a: "obelisk", b: "acrobat",
    kind: "conditional", engine: "scaling",
    why: "Obelisk builds XMult by avoiding your most-played hand; Acrobat provides X3 on the final hand per round — in a parked Obelisk build where you always play an off-type final hand, Acrobat's X3 fires exactly when Obelisk's accumulated XMult is highest."
  },
  // Green Joker × Burglar
  {
    a: "green_joker", b: "burglar",
    kind: "strong_support", engine: "scaling",
    why: "Burglar removes all discards at blind start; Green Joker grows per hand and shrinks per discard — Burglar guarantees no discards are ever spent, protecting Green Joker's scaling from erosion while providing extra hands for faster growth."
  },
  // Supernova × Blueprint
  {
    a: "supernova", b: "blueprint",
    kind: "strong_support", engine: "scaling",
    why: "Supernova adds Mult equal to the number of times the current hand type has been played this run; Blueprint copies it, applying that same Mult bonus a second time — late in a specialised run this doubles a potentially massive accumulated count."
  },

  // ─── ARCHETYPE-ONLY / TRAPS (5) ──────────────────────────────────────────────

  // Joker Stencil × Swashbuckler
  {
    a: "joker_stencil", b: "swashbuckler",
    kind: "archetype_only", engine: "xmult_stack",
    why: "Joker Stencil rewards empty Joker slots with XMult; Swashbuckler converts other Jokers' sell value into flat Mult — the two build from opposite directions and only coexist in a lean high-value Joker build where every slot earns maximum sell value."
  },
  // Madness × Riff-Raff
  {
    a: "madness", b: "riff_raff",
    kind: "risky_explosive", engine: "xmult_stack",
    why: "Madness destroys a random Joker each non-boss blind for X0.5 XMult gain; Riff-Raff generates two Common Jokers every blind — Riff-Raff's output feeds Madness's destruction engine so your valuable Jokers are protected by disposable Commons taking the hit."
  },
  // Madness × Joker Stencil
  {
    a: "madness", b: "joker_stencil",
    kind: "trap_unless_enabled", engine: "xmult_stack",
    why: "Madness destroys Jokers (reducing your count) which increases Joker Stencil's XMult — but Madness picks randomly and could destroy Stencil itself or your other engines; only viable in a tightly controlled 2-Joker setup where you accept the risk."
  },
  // Showman × Riff-Raff
  {
    a: "showman", b: "riff_raff",
    kind: "archetype_only", engine: "deck_manipulation",
    why: "Showman allows duplicate Jokers in the shop; Riff-Raff generates Common Jokers on blind entry — combined with Abstract Joker or Brainstorm, the duplicate-enablement can produce multiple copies of a key Common Joker for a stacking payoff."
  },
  // Throwback × Credit Card
  {
    a: "throwback", b: "credit_card",
    kind: "conditional", engine: "scaling",
    why: "Throwback gains X0.25 Mult per skipped blind; Credit Card allows going $20 into debt — the debt room lets you buy key pieces without cash, enabling you to skip marginally beneficial blinds and harvest Throwback stacks even on cash-tight early antes."
  },

];


// ------------------------------------------------------------------
// COMBO CARDS — curated combos with strategic writeups
// ------------------------------------------------------------------

export interface Combo {
  id: string;
  title: string;
  archetype: Archetype;
  core: string[];        // joker ids
  optional: string[];    // joker ids
  conditions: string[];
  risks: string[];
  why: string;
  pivotOut: string;
}

export const COMBOS: Combo[] = [
  {
    id: "face_card_engine",
    title: "Face Card Mult Engine",
    archetype: "face_card",
    core: ["triboulet","sock_and_buskin","pareidolia"],
    optional: ["midas_mask","blueprint","brainstorm","hanging_chad"],
    conditions: ["Face-card density of 30%+ in deck","Tarots used to convert low cards into face cards"],
    risks: ["Slow to come online before all three core pieces land","Bricks if Triboulet never appears"],
    why: "Pareidolia makes every scored card a face. Sock & Buskin re-triggers each one. Triboulet applies X2 per face-card trigger. The result is multiplicative scaling that scales linearly with hand size.",
    pivotOut: "If Triboulet hasn't appeared by Ante 5, pivot into a flat-mult + XMult shell (Cavendish, Blueprint) and treat the face-card pieces as filler."
  },
  {
    id: "held_in_hand_steel",
    title: "Baron Steel Held-in-Hand",
    archetype: "held_in_hand",
    core: ["baron","mime","steel_joker"],
    optional: ["raised_fist","shoot_the_moon","blueprint","brainstorm"],
    conditions: ["Hand-size buffs (Stuntman avoided)","Steel-enhancement tarots accessible"],
    risks: ["Slow scaling without Tarot access","Steel Joker fizzles if shop denies enhancements"],
    why: "Mime doubles Baron's X1.5 per held King and Steel cards' X1.5 — every held King and Steel card pays out twice during the held-in-hand phase, stacking multiplicatively.",
    pivotOut: "Drop Steel Joker if enhancements never show; keep Baron + Mime + Raised Fist as a pure held-in-hand line."
  },
  {
    id: "retrigger_idol",
    title: "Idol Retrigger Burst",
    archetype: "retrigger_engine",
    core: ["the_idol","hanging_chad","sock_and_buskin"],
    optional: ["blueprint","brainstorm","dna","smeared_joker"],
    conditions: ["Pick Idol target you can find (face card + common suit)","Lead the chosen card first when scoring"],
    risks: ["Idol target may not be a face card — pick a King or Queen of the same suit","Single-card dependency"],
    why: "Hanging Chad triggers the lead card three times. If the lead is Idol's target, that's three X2s — and Sock doubles again when face. One card carries the whole hand.",
    pivotOut: "If you can't find a face-card Idol target, switch to a flat-mult shell built around Fibonacci."
  },
  {
    id: "flush_mono",
    title: "Mono-Suit Flush Stack",
    archetype: "flush",
    core: ["smeared_joker","greedy_joker","the_idol"],
    optional: ["wrathful_joker","drunkard","blueprint","brainstorm"],
    conditions: ["Two suits funneled into one via Smeared","Flush hand levelled 3+"],
    risks: ["Without Smeared, suit conflicts cap flush reliability","Idol target rank must overlap with deck"],
    why: "Smeared cuts your effective suit count in half. Greedy and Wrathful gain +4 Mult per card of the merged suit, and Idol fires on every match. Flushes become five-card multiplier dumps.",
    pivotOut: "If Smeared never drops, accept inconsistent flushes and pivot toward Fibonacci high-card scaling."
  },
  {
    id: "straight_train",
    title: "Straight Through Discards",
    archetype: "straight",
    core: ["drunkard","fibonacci","hack"],
    optional: ["blueprint","brainstorm","green_joker"],
    conditions: ["Straight hand levelled","Discards available to find the straight"],
    risks: ["Green Joker conflicts with discard reliance","Fibonacci covers low/mid cards but not 6, 7, J, Q, K"],
    why: "Drunkard gives extra discards to assemble straights. Fibonacci pays +8 Mult per scored Ace/2/3/5/8. Hack doubles 2/3/4/5 triggers, so Fibonacci's payoff fires twice on overlapping ranks.",
    pivotOut: "If straights stop showing, redirect Fibonacci into a high-card or two-pair line where its rank coverage is still relevant."
  },
  {
    id: "discard_economy",
    title: "Discard Income Snowball",
    archetype: "discard",
    core: ["drunkard","mail_in_rebate","faceless_joker"],
    optional: ["golden_joker","midas_mask","perkeo"],
    conditions: ["Pick a Mail-in Rebate rank you draw often","Avoid Green Joker"],
    risks: ["Pure economy; needs a damage shell beside it","Boss blinds that block discards crush this line"],
    why: "Three independent income hooks fire every round: end-of-round interest, discard-based rebates, and face-card discard bonuses. Compounds via interest cap into runaway shop power.",
    pivotOut: "When interest is capped and shop is built out, drop economy pieces for late-game XMult payoffs."
  },
  {
    id: "scaling_snowball",
    title: "Hologram Deck Growth",
    archetype: "deck_growth",
    core: ["hologram","dna"],
    optional: ["constellation","perkeo","blueprint","brainstorm"],
    conditions: ["Open every Standard pack","Single-play first hand for DNA"],
    risks: ["Slow start — needs many rounds to compound","Bricks if Standard packs never appear"],
    why: "Every card added to the deck pumps Hologram. DNA duplicates a card each round. Constellation scales off Planet usage. All three quietly accumulate XMult with no per-hand effort.",
    pivotOut: "If pack flow is poor, sell Hologram and consolidate into a payoff shell (Cavendish + Blueprint)."
  },
  {
    id: "retrigger_engine_general",
    title: "Generic Retrigger Engine",
    archetype: "retrigger_engine",
    core: ["sock_and_buskin","hanging_chad","mime"],
    optional: ["seltzer","triboulet","the_idol","baron"],
    conditions: ["Some flat or X payoff Joker to amplify","Mix of scored and held-in-hand phases"],
    risks: ["Without a real payoff, retriggers triple nothing","Stuntman's hand-size cut hurts Mime"],
    why: "Three retrigger sources cover all three phases — scored face cards (Sock), lead scored card (Chad), held-in-hand (Mime). Slot any payoff Joker and it fires 2–3× per round.",
    pivotOut: "If no payoff Joker appears by Ante 6, drop Mime and pick a static XMult Joker like Cavendish as a safety net."
  },
  {
    id: "glass_loop",
    title: "Glass Joker Crack Loop",
    archetype: "glass",
    core: ["glass_joker","hack"],
    optional: ["seltzer","blueprint","brainstorm","vampire"],
    conditions: ["Glass enhancements applied via Tarots","Run defensive shell to survive variance"],
    risks: ["Glass cards permanently lost when they crack","Tail risk of bricking critical scoring cards"],
    why: "Hack retriggers low cards twice, doubling Glass shatter chance per scoring round. Each shatter grants permanent +X0.75 Mult to Glass Joker. Long-term, the line outscales most XMult competitors.",
    pivotOut: "If Glass shards run out or scoring becomes too unreliable, pivot to a deck-growth line where deck attrition isn't a downside."
  },
  {
    id: "high_card_fib",
    title: "Fibonacci High Card",
    archetype: "high_card",
    core: ["fibonacci","green_joker","ride_the_bus"],
    optional: ["blueprint","brainstorm","cavendish"],
    conditions: ["Avoid face cards in scoring","High-card hand levelled"],
    risks: ["Ride the Bus resets on any face card","Caps lower than face-card engines late"],
    why: "All three Jokers reward staying off face cards. Fibonacci pays flat mult on common low ranks, Green Joker grows per hand, Ride the Bus grows per face-less hand. Triple scaling from clean discipline.",
    pivotOut: "If you accidentally need face cards to clear a blind, drop Ride the Bus and accept the consistency hit."
  },
  {
    id: "economy_planet",
    title: "Planet Economy",
    archetype: "economy_snowball",
    core: ["astronomer","satellite","constellation"],
    optional: ["golden_joker","perkeo","blueprint","brainstorm"],
    conditions: ["Money available to buy every Planet","Hand-level scaling matters more than per-card Mult"],
    risks: ["No damage payoff on its own","Requires shop luck for Planet density"],
    why: "Planet Merchant doubles Planet rates. Satellite pays $1 per unique Planet used. Constellation gains X0.1 per Planet used. One axis pays you, levels your hands, and scales XMult — three returns on every Planet bought.",
    pivotOut: "Once Constellation is large enough to carry rounds alone, sell Satellite and Planet Merchant for premium late-game Jokers."
  },
  {
    id: "stone_chip_wall",
    title: "Stone Wall Chips",
    archetype: "deck_growth",
    core: ["stone_joker","stuntman"],
    optional: ["driver_gloves","steel_joker","blueprint","brainstorm"],
    conditions: ["Convert junk cards into Stones via Tarots","Patch hand size if pairing with held-in-hand"],
    risks: ["Stuntman + Mime/Baron is a trap","Chips alone insufficient at high antes"],
    why: "Stone Joker turns each Stone card into +25 chips per scored hand. Stuntman gives +250 chips floor. Combined chip totals comfortably hit blind requirements while any XMult Joker carries the mult side.",
    pivotOut: "Sell Stuntman the moment you commit to a held-in-hand build; keep Stone Joker as a chip wall."
  },

  // ════════ EXPANDED — 150-Joker pool ════════
  // ── 1. Economy Pure ──────────────────────────────────────────────────────────
  {
    id: "economy_pure",
    title: "Interest Snowball",
    archetype: "economy_snowball",
    core: ["cloud_9", "rocket", "to_the_moon", "golden_joker", "bull"],
    optional: ["satellite", "gift_card", "bootstraps", "blueprint"],
    conditions: [
      "Hold $30+ cash reserve before each blind",
      "Buy every 9 you see in Standard packs to grow Cloud 9",
      "Defeat Boss Blinds consistently to ramp Rocket payout",
      "Maintain interest cap via To the Moon (+$1 per $5)"
    ],
    risks: [
      "Pure economy generates no damage until a payoff Joker is slotted",
      "Bootstraps/Bull only deliver value if cash stays unspent",
      "Boss Blinds that force spending kill Rocket ramp timing"
    ],
    why: "Cloud 9 pays per 9 in the deck, Rocket grows per Boss Blind defeated, and To the Moon breaks the normal interest ceiling. Bull converts the held cash into chips each hand while Bootstraps handles flat Mult from the same reserve. All five income hooks are passive and compound — by Ante 6 the build runs $20–$30 per round in passive income while Bull and Bootstraps jointly cover both scoring axes from the same wallet.",
    pivotOut: "Once interest is capped and shop is saturated, sell Cloud 9 or Rocket for a premium late-game XMult Joker like Cavendish or Triboulet."
  },

  // ── 2. Bootstraps Broke Build ─────────────────────────────────────────────
  {
    id: "bootstraps_broke",
    title: "Broke Bootstraps",
    archetype: "economy_snowball",
    core: ["bootstraps", "vagabond", "mystic_summit", "banner"],
    optional: ["drunkard", "delayed_gratification", "bull", "blueprint"],
    conditions: [
      "Spend down to $4 before each hand to trigger Vagabond Tarot generation",
      "Keep discard count at 0 for Mystic Summit +15 Mult",
      "Let Banner's chip bonus from unused discards stack with Mystic Summit"
    ],
    risks: [
      "Requires staying near-broke intentionally, limiting shop options",
      "Vagabond Tarot generation only fires when ≤$4 — mismanaging cash blocks it",
      "Mystic Summit and discard-economy Jokers are mutually exclusive"
    ],
    why: "Bootstraps provides +2 Mult per $5 held, but Vagabond forces you toward broke — the tension resolves by cycling: spend to ≤$4 to trigger Vagabond's free Tarot, then use that Tarot for enhancement or Planet value before the end of round. Mystic Summit rewards reaching 0 discards. Banner rewards holding discards. Choose one discard axis per run — zero-discard lines stack both Mystic Summit and Banner's held-discard bonus simultaneously.",
    pivotOut: "If Vagabond never appears, replace it with Satellite or Golden Joker and run a standard economy shell with Bootstraps and Bull."
  },

  // ── 3. Hand-Only Discipline ───────────────────────────────────────────────
  {
    id: "hand_only_discipline",
    title: "Iron Fist (No Discard)",
    archetype: "high_card",
    core: ["mystic_summit", "burglar", "ramen", "banner"],
    optional: ["green_joker", "acrobat", "blueprint", "brainstorm"],
    conditions: [
      "Never use any discards — Burglar eliminates them, ensuring Mystic Summit always fires",
      "Ramen starts at X2 and never decays when discards are 0",
      "Banner gives +30 Chips per discard remaining — Burglar's +3 hands keeps Banner pool full"
    ],
    risks: [
      "No discard access means hand consistency depends entirely on draw luck and hand size",
      "Burglar's −1 hand count per blind conflicts with high-hand-count strategies",
      "Ramen's X2 floor is powerful early but does not scale late — needs another XMult piece"
    ],
    why: "Burglar converts discards into 3 extra hands each blind, ensuring you always have plays available without ever discarding. Mystic Summit's +15 Mult fires every hand since discards are always 0. Ramen never decays since no discards occur. Banner collects chips from the 3-discard-equivalent the game credits at blind start. Green Joker accrues +1 Mult per hand played and never loses value. Together the build scores through a clean, high-hand-count loop with no discard-economy conflicts.",
    pivotOut: "If Ramen falls below X1.5 from accidental discards, sell it and slot Cavendish or The Trio for a static XMult floor."
  },

  // ── 4. Joker Stencil Empty Slot ───────────────────────────────────────────
  {
    id: "joker_stencil_empty",
    title: "Lean Stencil Build",
    archetype: "high_card",
    core: ["joker_stencil", "swashbuckler", "brainstorm"],
    optional: ["blueprint", "madness", "egg", "gift_card"],
    conditions: [
      "Keep total Joker count at 3 (Stencil + 2 others) for X2 Stencil minimum",
      "High sell-value Jokers (Egg, Gift Card accumulation) inflate Swashbuckler",
      "Brainstorm copies the leftmost Joker for free XMult duplication"
    ],
    risks: [
      "Stencil rewards fewer Jokers — every additional slot purchased reduces XMult",
      "Madness randomly destroys Jokers, potentially hitting Stencil itself",
      "Swashbuckler's Mult depends on held Joker sell value — selling them for cash drops Mult"
    ],
    why: "Joker Stencil gives X1 Mult per empty Joker slot including itself — a 3-Joker setup with 2 empty slots yields X2. Swashbuckler converts the sell value of the two held Jokers (Stencil + Brainstorm) into flat Mult. Brainstorm copies Stencil for a second X2, producing X4 total from a lean 3-Joker lineup. Egg's growing sell value inflates Swashbuckler passively even while sitting unused.",
    pivotOut: "Once you've found a premium second Joker (Cavendish, Triboulet), add it and accept the Stencil decay — the net scoring gain from the new Joker exceeds the lost XMult."
  },

  // ── 5. Pair Specialist ────────────────────────────────────────────────────
  {
    id: "pair_specialist",
    title: "Pair Payoff Engine",
    archetype: "pair",
    core: ["the_duo", "sly_joker", "jolly_joker", "photograph"],
    optional: ["hanging_chad", "dna", "blueprint", "spare_trousers"],
    conditions: [
      "Fill deck with high face-card density (Kings, Queens) for Photograph + The Duo overlap",
      "Lead the face card as the first scored card for Hanging Chad + Photograph triple proc",
      "DNA can duplicate the Pair target rank for near-guaranteed Pair hands"
    ],
    risks: [
      "Photograph only fires once per hand on the first face card — sort hand carefully",
      "Sly and Jolly are flat Mult/chips only; without The Duo's X2 the ceiling is low",
      "Spare Trousers requires Two Pair, not plain Pair — runs on a distinct hand type"
    ],
    why: "The Duo supplies X2 on any Pair-containing hand — nearly always live. Jolly Joker adds +8 Mult and Sly Joker adds +50 Chips on the same trigger condition. Photograph applies X2 to the first face card, so a King-pair leads with Hanging Chad for three X2 procs from a single card before The Duo fires. The Duo + Photograph alone produces X4 from one Pair hand with a face-card lead.",
    pivotOut: "If face-card density is insufficient for Photograph, replace it with The Tribe and transition to a Flush-Pair hybrid using Four Fingers."
  },

  // ── 6. Three of a Kind Specialist ─────────────────────────────────────────
  {
    id: "three_of_a_kind_specialist",
    title: "The Trio Engine",
    archetype: "three_of_a_kind",
    core: ["the_trio", "zany_joker", "wily_joker"],
    optional: ["dna", "the_idol", "blueprint", "brainstorm"],
    conditions: [
      "Use DNA to stack a single rank to 8+ copies for guaranteed Three of a Kind",
      "The Idol target rank must overlap with the duplicated rank for X2 per matched card",
      "Level Three of a Kind hand via Planet cards — high base chips make Wily's +100 decisive"
    ],
    risks: [
      "Without DNA, Three of a Kind is inconsistent in a 52-card deck",
      "Full House satisfies The Trio but dilutes DNA-targeting strategy",
      "The Idol's rank+suit rotates — it won't always align with the tripled rank"
    ],
    why: "The Trio delivers X3 on Three of a Kind and Full House — firing alongside Zany Joker's +12 Mult and Wily Joker's +100 Chips creates a comprehensive three-axis scoring package from one hand type. DNA ensures the chosen rank floods the deck, making Three of a Kind trivially consistent. The Idol stacked on top converts each matched card into additional X2 procs, and Blueprint next to The Trio doubles the X3 to X9 when positioned correctly.",
    pivotOut: "If DNA is unavailable, replace Wily Joker with Hanging Chad and pivot to a face-card Pair build where the rank overlap requirement is less rigid."
  },

  // ── 7. Straight Flush Endgame ─────────────────────────────────────────────
  {
    id: "straight_flush_endgame",
    title: "Straight Flush Endgame",
    archetype: "straight",
    core: ["four_fingers", "shortcut", "smeared_joker", "seance"],
    optional: ["the_order", "the_tribe", "blueprint", "crazy_joker"],
    conditions: [
      "Four Fingers + Shortcut reduces Straight Flush to any 4 roughly-sequential cards",
      "Smeared Joker collapses the suit requirement to 2 effective suits",
      "Séance generates a Spectral card each Straight Flush — use for Wraith/Ankh copies",
      "Level Straight Flush hand via Celestial Packs"
    ],
    risks: [
      "Requires three specific enabler Jokers before the engine is live",
      "Séance generates random Spectrals — may not always hit Wraith or useful cards",
      "The Order and The Tribe both require their respective hand types, but Straight Flush satisfies both"
    ],
    why: "Four Fingers + Shortcut converts Straight Flush from a rare lucky hand into a near-guaranteed 4-card play. Smeared Joker doubles the card availability by merging suits. Séance turns every Straight Flush into a free Spectral — over a full run this generates 5–10+ powerful Spectrals. The Order (X3) and The Tribe (X2) both fire on Straight Flush simultaneously for a free X6 base XMult before any other Jokers contribute.",
    pivotOut: "If Séance never appears, use the enabler trio (Four Fingers + Shortcut + Smeared) to run a pure Flush build with The Tribe and Ancient Joker instead."
  },

  // ── 8. Steel + Marble Chip Wall ───────────────────────────────────────────
  {
    id: "steel_marble_chip_wall",
    title: "Steel-Marble Wall",
    archetype: "steel",
    core: ["marble_joker", "stone_joker", "stuntman", "steel_joker"],
    optional: ["driver_gloves", "mime", "blueprint", "brainstorm"],
    conditions: [
      "Marble Joker adds Stone cards passively each blind — aim for 10+ Stones for Stone Joker",
      "Steel cards applied via Tarots to held cards — Steel Joker counts them all",
      "Stuntman provides +250 Chips floor; avoid Mime/Baron pairings (hand size conflict)",
      "Driver's License unlocks X3 once 16+ enhanced cards are in the deck"
    ],
    risks: [
      "Stuntman reduces hand size by 2, conflicting with held-in-hand pieces like Mime",
      "Marble Joker grows deck size, increasing draw variance",
      "Driver's License requires 16 enhanced cards — slow to enable without Tarot density"
    ],
    why: "Marble Joker passively builds Stone count toward Stone Joker's chip scaling, while Steel cards added via Tarots grow Steel Joker's XMult. Stuntman adds a +250 chip floor. Driver's License flips on when both Stone and Steel enhancements reach the 16-card threshold. The build needs no per-hand conditions — it accumulates chips and XMult passively across blinds while Tarots convert the deck.",
    pivotOut: "If Tarot access is poor and Driver's License threshold is unreachable, sell Stuntman and focus purely on Stone Joker + Marble Joker + Blueprint for a chip-dominant but simpler line."
  },

  // ── 9. Sixth Sense Spectral Loop ──────────────────────────────────────────
  {
    id: "sixth_sense_spectral_loop",
    title: "Spectral Economy Loop",
    archetype: "deck_growth",
    core: ["sixth_sense", "cartomancer", "perkeo", "certificate"],
    optional: ["fortune_teller", "hallucination", "blueprint", "showman"],
    conditions: [
      "Lead each round with a single 6 play for Sixth Sense's Spectral generation",
      "Cartomancer creates a Tarot every blind start — keep a consumable slot open",
      "Perkeo duplicates a consumable each shop — hold Tarots/Planets across the shop",
      "Certificate adds a sealed card each round — Red Seal retriggers, Gold Seal earns money"
    ],
    risks: [
      "Requires tight consumable slot management — at most 2 slots available",
      "Sixth Sense needs a 6 available in hand as the first play every round",
      "Fortune Teller's Mult scales only with Tarots used, not Spectrals"
    ],
    why: "Sixth Sense generates one Spectral per round by destroying a 6, simultaneously thinning the deck. Cartomancer adds a Tarot every blind entry. Perkeo duplicates a random consumable at shop end, turning one Tarot or Planet into two. Certificate provides a free sealed card each round. Over a run, this generates 20+ consumables — enough to fully enhance the deck, max Fortune Teller's Mult, and repeatedly use Planets to feed Constellation.",
    pivotOut: "If Sixth Sense is unavailable, replace it with Hallucination (50% Tarot on every pack opened) and run a Cartomancer + Perkeo + Fortune Teller triple-Tarot line."
  },

  // ── 10. Wee Joker Scaling ─────────────────────────────────────────────────
  {
    id: "wee_joker_scaling",
    title: "Wee Joker Chip Engine",
    archetype: "deck_growth",
    core: ["wee_joker", "hack", "seltzer", "blueprint"],
    optional: ["stone_joker", "stuntman", "brainstorm", "dna"],
    conditions: [
      "Maximise 2s in the deck — DNA duplication of 2s is ideal",
      "Hack retriggers each played 2, doubling Wee Joker growth to +16 Chips per 2",
      "Seltzer active window doubles all card triggers for 10 hands — maximise 2s during Seltzer",
      "Blueprint copies Wee Joker, doubling chip accumulation speed"
    ],
    risks: [
      "Wee Joker is chip-scaling only — needs an XMult source to convert large chips into damage",
      "Seltzer is timer-limited (10 hands); time acquisition near boss blinds for maximum value",
      "DNA single-play requirement conflicts with scoring hands — plan the duplication round carefully"
    ],
    why: "Each played 2 permanently adds +8 Chips to Wee Joker. Hack retriggers every 2 once extra, making each 2 add +16 per round. Blueprint copies Wee Joker, doubling the accumulation rate to +32 per 2 per hand. Seltzer's 10-hand window retriggers every card including 2s, compressing months of growth into a short burst. With 4+ 2s in a hand under Seltzer + Hack + Blueprint, Wee Joker can gain hundreds of chips in a single round.",
    pivotOut: "Once Wee Joker's chip base is large enough to carry blinds on chips alone, sell Seltzer and replace it with Stone Joker or Stuntman to harden the chip foundation."
  },

  // ── 11. Madness Sacrifice ─────────────────────────────────────────────────
  {
    id: "madness_sacrifice",
    title: "Sacrifice Engine",
    archetype: "high_card",
    core: ["madness", "riff_raff", "ceremonial_dagger"],
    optional: ["abstract_joker", "blueprint", "campfire", "egg"],
    conditions: [
      "Riff-Raff generates 2 Common Jokers each blind — they populate the random Madness sacrifice pool",
      "Ceremonial Dagger positioned left of a Riff-Raff Common feeds on those Commons for double sell-value Mult",
      "Keep total Joker count low (3–4) so Madness sacrifices Riff-Raff Commons, not engines",
      "Campfire grows X0.25 per sold Joker — combine with pre-boss Joker sales for burst"
    ],
    risks: [
      "Madness sacrifice is random — Ceremonial Dagger, Blueprint, or Madness itself could be targeted",
      "Riff-Raff Commons need a free Joker slot to spawn; Madness consumption creates this slot naturally",
      "Campfire resets at Boss Blind defeat — timing the pre-boss sale spike is essential"
    ],
    why: "Riff-Raff floods the Joker roster with free Commons each blind. Madness consumes a random Joker for X0.5 XMult gain — the Riff-Raff Commons serve as disposable fuel, absorbing Madness's random destruction. Ceremonial Dagger sacrifices the Riff-Raff Common to its right for double-sell-value flat Mult each blind. Together the three form a self-replenishing sacrifice loop: Riff-Raff creates fuel, Ceremonial Dagger burns it for Mult, Madness converts random deaths into XMult stacks.",
    pivotOut: "If Madness destroys a key engine Joker twice, sell Madness and run Ceremonial Dagger + Riff-Raff alone as a stable flat-Mult scaling line."
  },

  // ── 12. Ancient Joker Suit Rotation ──────────────────────────────────────
  {
    id: "ancient_joker_suit_rotation",
    title: "Ancient Suit Rotate",
    archetype: "flush",
    core: ["ancient_joker", "smeared_joker", "four_fingers", "the_idol"],
    optional: ["bloodstone", "blueprint", "seltzer", "hanging_chad"],
    conditions: [
      "Smeared Joker collapses Ancient's rotating suit from 1-in-4 to 1-in-2 coverage",
      "Four Fingers reduces flush to 4 cards, ensuring scored cards match Ancient's active suit more often",
      "The Idol's rotating target occasionally aligns with Ancient's suit for X1.5 × X2 = X3 per card",
      "Bloodstone adds probabilistic X1.5 on Heart cards — pairs with Smeared's Heart-Diamond merge"
    ],
    risks: [
      "Ancient Joker's suit rotates each round — rounds where your deck skews against the active suit lose value",
      "The Idol alignment with Ancient is occasional, not guaranteed",
      "Smeared conflicts with Flower Pot (which needs all four suits) — cannot run both"
    ],
    why: "Ancient Joker applies X1.5 per scored card of the active suit, but the rotating nature punishes mono-suit decks. Smeared Joker collapses four suits to two, guaranteeing roughly 50% of scored cards trigger X1.5 on any given round. Four Fingers increases the average number of scored cards per hand in flush builds, directly multiplying Ancient's output. When The Idol's rotating target matches Ancient's active suit, each matching card hits X1.5 × X2 = X3 — a free double-dip that rewards flexible suit coverage.",
    pivotOut: "If The Idol's rotation is too unreliable to align with Ancient, replace it with The Tribe for a flat X2 on every Flush hand, keeping the Smeared + Four Fingers consistency core intact."
  },

];


// ------------------------------------------------------------------
// ARCHETYPES — 14 build summaries
// ------------------------------------------------------------------

export interface ArchetypeSummary {
  id: Archetype;
  name: string;
  wants: string;
  enablers: string[];
  scalers: string[];
  bait: string[];
  oftenLacks: string;
}

export const ARCHETYPES: ArchetypeSummary[] = [
  { id: "flush", name: "Flush",
    wants: "Five-of-a-suit consistency every hand. Levels Flush hand high and stacks suit payoffs.",
    enablers: ["smeared_joker","drunkard","astronomer"],
    scalers: ["greedy_joker","wrathful_joker","the_idol","constellation"],
    bait: ["pareidolia","stuntman","green_joker"],
    oftenLacks: "Raw XMult without Idol. Add Cavendish or Blueprint+Idol to unlock late-game ceiling."
  },
  { id: "straight", name: "Straight",
    wants: "Run consistency. Discard-fueled hand-finding plus rank-spanning payoffs.",
    enablers: ["drunkard"],
    scalers: ["fibonacci","hack","green_joker"],
    bait: ["pareidolia","triboulet"],
    oftenLacks: "Top-end XMult. Bolt on Cavendish or Driver's License once enhancements are in the deck."
  },
  { id: "high_card", name: "High Card",
    wants: "Single-card scoring with massive flat and X mult on one or two payoff cards.",
    enablers: ["dna","raised_fist"],
    scalers: ["fibonacci","green_joker","ride_the_bus"],
    bait: ["triboulet","sock_and_buskin"],
    oftenLacks: "Consistency. Add hand-size or retrigger pieces so the single scored card pays repeatedly."
  },
  { id: "pair", name: "Pair",
    wants: "Reliable two-card payoffs with rank or face-card synergies.",
    enablers: ["dna"],
    scalers: ["triboulet","the_idol","fibonacci"],
    bait: ["ride_the_bus"],
    oftenLacks: "Hand levels. Use Planets aggressively or pivot to two-pair to scale chip output."
  },
  { id: "two_pair", name: "Two Pair",
    wants: "Four-card scoring. Pairs well with rank-specific payoffs and discards to assemble both pairs.",
    enablers: ["drunkard","dna"],
    scalers: ["the_idol","triboulet","fibonacci"],
    bait: ["green_joker"],
    oftenLacks: "Mult scaling. Slot a multiplicative payoff like Idol or Cavendish."
  },
  { id: "three_of_a_kind", name: "Three of a Kind",
    wants: "Three matching ranks per hand. Strong with rank-specific multipliers and retriggers.",
    enablers: ["dna","drunkard"],
    scalers: ["the_idol","triboulet","sock_and_buskin"],
    bait: ["ride_the_bus"],
    oftenLacks: "Setup speed. Often slow to hit consistently without DNA-style duplication."
  },
  { id: "four_of_a_kind", name: "Four of a Kind",
    wants: "Big payoff hand with rank density. Combines best with rank-targeted Jokers.",
    enablers: ["dna"],
    scalers: ["the_idol","triboulet"],
    bait: ["ride_the_bus","green_joker"],
    oftenLacks: "Reliability — hard to assemble naturally. DNA + hand-size makes it sustainable."
  },
  { id: "face_card", name: "Face Card",
    wants: "Face-card density that synergizes with payoff and retrigger Jokers.",
    enablers: ["pareidolia"],
    scalers: ["triboulet","sock_and_buskin","midas_mask","hanging_chad"],
    bait: ["ride_the_bus","greedy_joker","wrathful_joker"],
    oftenLacks: "Chips. Add Stone Joker or a +Chips Joker so face-card mult has something to multiply."
  },
  { id: "held_in_hand", name: "Held-in-Hand",
    wants: "Cards held during scoring trigger held-in-hand bonuses. Hand size is the resource.",
    enablers: ["mime"],
    scalers: ["baron","raised_fist","shoot_the_moon","steel_joker"],
    bait: ["stuntman"],
    oftenLacks: "Hand size. Aggressively buy hand-size vouchers and avoid hand-size penalties."
  },
  { id: "steel", name: "Steel",
    wants: "Many Steel cards in deck so X1.5 per Steel held-in-hand stacks up.",
    enablers: ["mime"],
    scalers: ["steel_joker","baron","driver_gloves"],
    bait: ["vampire"],
    oftenLacks: "Tarot access. Without consistent Tarots, Steel count plateaus too low."
  },
  { id: "glass", name: "Glass",
    wants: "Crack Glass cards to permanently grow Glass Joker. High-variance scaling.",
    enablers: ["hack"],
    scalers: ["glass_joker","driver_gloves"],
    bait: ["vampire","stuntman"],
    oftenLacks: "Defensive stability. Run consistency pieces so shattered scoring cards don't tank a round."
  },
  { id: "discard", name: "Discard",
    wants: "More discards to find hands and to monetize discards as economy.",
    enablers: ["drunkard"],
    scalers: ["mail_in_rebate","faceless_joker"],
    bait: ["green_joker"],
    oftenLacks: "Damage payoff. Pure discard is economy — pair with an XMult engine to actually clear blinds."
  },
  { id: "deck_growth", name: "Deck Growth",
    wants: "Permanently add cards (often enhanced) to grow scaling Jokers.",
    enablers: ["dna"],
    scalers: ["hologram","stone_joker","steel_joker","driver_gloves"],
    bait: ["vampire"],
    oftenLacks: "Tempo. Early antes feel slow; commit only when economy supports buying every pack."
  },
  { id: "economy_snowball", name: "Economy Snowball",
    wants: "Maximize income to flood the shop with Jokers and upgrades.",
    enablers: ["astronomer"],
    scalers: ["golden_joker","satellite","faceless_joker","mail_in_rebate","midas_mask","perkeo"],
    bait: ["stuntman"],
    oftenLacks: "Damage payoff. Slot one premium XMult Joker (Cavendish, Triboulet) once interest is capped."
  },
  { id: "retrigger_engine", name: "Retrigger Engine",
    wants: "Multiple retrigger sources stacked so each scored card fires 2–3 times.",
    enablers: ["sock_and_buskin","hanging_chad","mime"],
    scalers: ["the_idol","triboulet","baron","seltzer"],
    bait: ["stuntman"],
    oftenLacks: "Base payoff. Retriggers multiply existing effects — without a real payoff, you're tripling zero."
  }
];


// ------------------------------------------------------------------
// GLOSSARY
// ------------------------------------------------------------------

export const GLOSSARY: { term: string; def: string }[] = [
  { term: "Chips", def: "The blue number — flat additive score before mult is applied. Hand types and scored cards contribute chips." },
  { term: "Mult", def: "The red number — flat additive multiplier. Final score = chips × mult." },
  { term: "XMult", def: "A multiplicative multiplier applied to the mult value. Two X2 sources stack as X4 (multiplicatively), not as X3 (additively)." },
  { term: "Retrigger", def: "Cause a card or effect to apply more than once in a single scoring pass. Often the highest-leverage scaling type in the game." },
  { term: "Scaling", def: "Any source of growth that increases over a run, either per-hand (linear) or compounding (exponential). Engines that scale outpace static Jokers late." },
  { term: "Consistency", def: "How often a build hits its target hand or condition. Discards, hand size, and deck thinning raise consistency." },
  { term: "Economy", def: "Money generation. Interest, shop discounts, end-of-round income, and gold cards. Funds upgrades that translate into damage later." },
  { term: "Held-in-Hand", def: "The phase after scoring where cards still in your hand can trigger effects (Baron's Kings, Steel cards' X1.5)." },
  { term: "Thinning", def: "Removing weak or junk cards from your deck to draw your important cards more often. Tarots and Spectrals are the main tools." },
  { term: "Pivot", def: "Switch your build's primary scaling axis mid-run, usually when a key Joker fails to appear or a better one shows up in the shop." },
  { term: "Payoff", def: "A Joker that converts an enabler condition into real score (e.g., Triboulet converting face cards into XMult). Payoffs need enablers to function." },
  { term: "Enabler", def: "A Joker or card that makes a condition reliable (e.g., Pareidolia enabling face-card payoffs on every card). Enablers without payoffs do nothing alone." },
  { term: "Tempo", def: "How quickly a build comes online relative to ante difficulty. Slow-scaling builds need defensive shells to survive early antes." }
];


// ------------------------------------------------------------------
// JOKER LOOKUP HELPERS
// ------------------------------------------------------------------
export const JOKER_MAP: Record<string, Joker> = Object.fromEntries(JOKERS.map(j => [j.id, j]));
