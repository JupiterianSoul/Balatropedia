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

export interface Joker {
  id: string;
  name: string;
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
  {
    id: "joker",
    name: "Joker",
    summary: "+4 Mult.",
    mainRole: "flat_mult",
    tags: ["flat_mult", "enabler"],
    trigger: "every scored hand",
    scaling: "static",
    hands: ["any"], archetypes: ["high_card","pair","two_pair"], stage: ["early"],
    economy: "low", consistency: "high",
    partners: ["mime","blueprint","brainstorm"],
    antiSynergies: [],
    setupDifficulty: "low", risk: "low",
    notes: "Filler value early. Sell once real engines come online.",
    beginner: "A safe +Mult floor. Cheap and works on any hand. Replace it later."
  },
  {
    id: "greedy_joker",
    name: "Greedy Joker",
    summary: "+4 Mult per scored Diamond.",
    mainRole: "flat_mult", secondaryRole: "suit_support",
    tags: ["flat_mult","suit_support","payoff"],
    trigger: "scored card of suit",
    scaling: "linear",
    hands: ["flush","pair","two_pair"], archetypes: ["flush"], stage: ["early","mid"],
    economy: "low", consistency: "med",
    partners: ["smeared_joker","the_idol","driver_gloves"],
    antiSynergies: ["pareidolia"],
    setupDifficulty: "low", risk: "low",
    notes: "Strong inside mono-Diamond decks. Combine with Smeared to unify suits.",
    beginner: "Score Diamonds → get extra mult. Easy and reliable in flush builds."
  },
  {
    id: "wrathful_joker",
    name: "Wrathful Joker",
    summary: "+4 Mult per scored Spade.",
    mainRole: "flat_mult", secondaryRole: "suit_support",
    tags: ["flat_mult","suit_support","payoff"],
    trigger: "scored card of suit",
    scaling: "linear",
    hands: ["flush","pair"], archetypes: ["flush"], stage: ["early","mid"],
    economy: "low", consistency: "med",
    partners: ["smeared_joker","the_idol"],
    antiSynergies: [], setupDifficulty: "low", risk: "low",
    notes: "Mirror of Greedy for Spades. Pair with Smeared to keep suits flexible.",
    beginner: "Plays the same way as Greedy but rewards Spades instead."
  },
  {
    id: "smeared_joker",
    name: "Smeared Joker",
    summary: "Hearts and Diamonds count as the same suit; Spades and Clubs count as the same suit.",
    mainRole: "enabler", secondaryRole: "consistency",
    tags: ["enabler","suit_support","consistency"],
    trigger: "passive",
    scaling: "static",
    hands: ["flush"], archetypes: ["flush"], stage: ["mid"],
    economy: "low", consistency: "high",
    partners: ["greedy_joker","wrathful_joker","the_idol","vampire"],
    antiSynergies: [], setupDifficulty: "low", risk: "low",
    notes: "The glue piece of suit-based builds. Unlocks consistent flushes from a 4-suit deck.",
    beginner: "Treats two suits as one. Makes flushes way easier to hit."
  },
  {
    id: "blueprint",
    name: "Blueprint",
    summary: "Copies the ability of the Joker to the right.",
    mainRole: "payoff", secondaryRole: "scaling_engine",
    tags: ["payoff","scaling_engine","pivot"],
    trigger: "passive copy",
    scaling: "conditional",
    hands: ["any"], archetypes: ["retrigger_engine","flush","face_card","held_in_hand"], stage: ["mid","late"],
    economy: "low", consistency: "med",
    partners: ["brainstorm","the_idol","baron","triboulet","dna"],
    antiSynergies: [], setupDifficulty: "med", risk: "med",
    notes: "Double-dips a real engine. Order matters: always place Blueprint left of the target.",
    beginner: "Acts as a second copy of the Joker on its right. Put it next to your best one."
  },
  {
    id: "brainstorm",
    name: "Brainstorm",
    summary: "Copies the ability of the leftmost Joker.",
    mainRole: "payoff", secondaryRole: "scaling_engine",
    tags: ["payoff","scaling_engine","pivot"],
    trigger: "passive copy",
    scaling: "conditional",
    hands: ["any"], archetypes: ["retrigger_engine","flush","face_card","held_in_hand"], stage: ["mid","late"],
    economy: "low", consistency: "med",
    partners: ["blueprint","the_idol","baron","triboulet","constellation"],
    antiSynergies: [], setupDifficulty: "med", risk: "med",
    notes: "Pairs with Blueprint to triple a single XMult engine. Position-locked.",
    beginner: "Always copies the Joker on the far left. Combine with Blueprint for big spikes."
  },
  {
    id: "mime",
    name: "Mime",
    summary: "Retrigger all cards held in hand abilities.",
    mainRole: "retrigger", secondaryRole: "held_in_hand",
    tags: ["retrigger","held_in_hand","scaling_engine"],
    trigger: "held-in-hand phase",
    scaling: "linear",
    hands: ["any"], archetypes: ["held_in_hand","steel","retrigger_engine"], stage: ["mid","late"],
    economy: "low", consistency: "high",
    partners: ["baron","steel_joker","raised_fist","shoot_the_moon"],
    antiSynergies: [], setupDifficulty: "med", risk: "low",
    notes: "Core of every Baron + Steel build. Doubles every in-hand effect.",
    beginner: "Makes cards you keep in your hand trigger twice. Huge with Steel cards."
  },
  {
    id: "baron",
    name: "Baron",
    summary: "Each King held in hand gives X1.5 Mult.",
    mainRole: "xmult", secondaryRole: "held_in_hand",
    tags: ["xmult","held_in_hand","payoff","scaling_engine"],
    trigger: "held-in-hand phase",
    scaling: "multiplicative",
    hands: ["any"], archetypes: ["held_in_hand","face_card","retrigger_engine"], stage: ["mid","late"],
    economy: "low", consistency: "med",
    partners: ["mime","raised_fist","shoot_the_moon","blueprint","brainstorm","midas_mask"],
    antiSynergies: ["pareidolia"],
    setupDifficulty: "high", risk: "med",
    notes: "Multiplicative scaling with no cap. Needs many Kings + hand-size support.",
    beginner: "Every King you hold (don't play) multiplies your score. Stack Kings."
  },
  {
    id: "raised_fist",
    name: "Raised Fist",
    summary: "Adds double the rank of lowest card held in hand as Mult.",
    mainRole: "flat_mult", secondaryRole: "held_in_hand",
    tags: ["flat_mult","held_in_hand","payoff"],
    trigger: "held-in-hand phase",
    scaling: "linear",
    hands: ["any"], archetypes: ["held_in_hand"], stage: ["early","mid"],
    economy: "low", consistency: "high",
    partners: ["mime","baron","stuntman"],
    antiSynergies: [], setupDifficulty: "low", risk: "low",
    notes: "Strong early. Keep one Ace or low card in hand for big Mult.",
    beginner: "Hold a low-rank card to convert it into mult. Free value."
  },
  {
    id: "shoot_the_moon",
    name: "Shoot the Moon",
    summary: "Each Queen held in hand gives +13 Mult.",
    mainRole: "flat_mult", secondaryRole: "held_in_hand",
    tags: ["flat_mult","held_in_hand","payoff"],
    trigger: "held-in-hand phase",
    scaling: "linear",
    hands: ["any"], archetypes: ["held_in_hand","face_card"], stage: ["mid"],
    economy: "low", consistency: "med",
    partners: ["mime","baron","midas_mask","triboulet"],
    antiSynergies: [], setupDifficulty: "med", risk: "low",
    notes: "Best as Baron support. Queen-density matters.",
    beginner: "Holding Queens adds flat mult. Good companion to Baron decks."
  },
  {
    id: "the_idol",
    name: "The Idol",
    summary: "Each played card of a chosen rank and suit gives X2 Mult when scored.",
    mainRole: "xmult", secondaryRole: "rank_face_support",
    tags: ["xmult","payoff","suit_support","rank_face_support"],
    trigger: "scored card matches",
    scaling: "multiplicative",
    hands: ["flush","pair","two_pair","four_of_a_kind"], archetypes: ["flush","face_card"], stage: ["mid","late"],
    economy: "low", consistency: "med",
    partners: ["smeared_joker","blueprint","brainstorm","dna","sock_and_buskin"],
    antiSynergies: [], setupDifficulty: "med", risk: "med",
    notes: "X2 per match — exponential when stacked with DNA or retriggers.",
    beginner: "Pick a rank and suit; matching cards multiply your score."
  },
  {
    id: "triboulet",
    name: "Triboulet",
    summary: "Played Kings and Queens give X2 Mult when scored.",
    mainRole: "xmult", secondaryRole: "rank_face_support",
    tags: ["xmult","payoff","rank_face_support"],
    trigger: "scored face card",
    scaling: "multiplicative",
    hands: ["pair","two_pair","four_of_a_kind"], archetypes: ["face_card"], stage: ["late"],
    economy: "low", consistency: "high",
    partners: ["blueprint","brainstorm","sock_and_buskin","pareidolia","midas_mask"],
    antiSynergies: [], setupDifficulty: "med", risk: "low",
    notes: "Legendary face-card payoff. Trivializes most stakes once stacked.",
    beginner: "Kings and Queens you play multiply your score. Get more face cards."
  },
  {
    id: "sock_and_buskin",
    name: "Sock and Buskin",
    summary: "Retrigger all played face cards.",
    mainRole: "retrigger", secondaryRole: "rank_face_support",
    tags: ["retrigger","rank_face_support","scaling_engine"],
    trigger: "scored face card",
    scaling: "linear",
    hands: ["any"], archetypes: ["face_card","retrigger_engine"], stage: ["mid","late"],
    economy: "low", consistency: "high",
    partners: ["triboulet","pareidolia","midas_mask","hanging_chad"],
    antiSynergies: [], setupDifficulty: "med", risk: "low",
    notes: "Doubles every face card payoff. Mandatory in face-card decks.",
    beginner: "Every face card scores twice. Insane with Triboulet."
  },
  {
    id: "pareidolia",
    name: "Pareidolia",
    summary: "All cards are considered face cards.",
    mainRole: "enabler", secondaryRole: "rank_face_support",
    tags: ["enabler","rank_face_support"],
    trigger: "passive",
    scaling: "static",
    hands: ["any"], archetypes: ["face_card"], stage: ["mid","late"],
    economy: "low", consistency: "high",
    partners: ["sock_and_buskin","triboulet","midas_mask"],
    antiSynergies: ["greedy_joker","wrathful_joker"],
    setupDifficulty: "med", risk: "med",
    notes: "Breaks face-card builds wide open but blocks suit-specific Jokers like Greedy.",
    beginner: "Treats every card as a face card. Massive face-card payoffs become trivial."
  },
  {
    id: "midas_mask",
    name: "Midas Mask",
    summary: "All played face cards become Gold cards when scored.",
    mainRole: "economy", secondaryRole: "enhancement_interaction",
    tags: ["economy","enhancement_interaction","rank_face_support"],
    trigger: "scored face card",
    scaling: "linear",
    hands: ["any"], archetypes: ["face_card","economy_snowball"], stage: ["mid"],
    economy: "high", consistency: "med",
    partners: ["pareidolia","sock_and_buskin","triboulet","golden_joker"],
    antiSynergies: [], setupDifficulty: "med", risk: "low",
    notes: "Converts face-card pressure into snowball income. Best with Pareidolia.",
    beginner: "Played face cards turn gold and pay you. Money on top of damage."
  },
  {
    id: "dna",
    name: "DNA",
    summary: "If the first hand of round has only 1 card, add a permanent copy to deck and draw to hand.",
    mainRole: "deck_manipulation", secondaryRole: "deck_growth",
    tags: ["deck_manipulation","deck_growth","scaling_engine"],
    trigger: "first hand condition",
    scaling: "linear",
    hands: ["high_card"], archetypes: ["deck_growth","flush","face_card"], stage: ["early","mid"],
    economy: "low", consistency: "med",
    partners: ["the_idol","cavendish","blueprint","brainstorm","hack"],
    antiSynergies: [], setupDifficulty: "high", risk: "med",
    notes: "Requires hand-size and discipline to single-play. Pairs nuts with The Idol target.",
    beginner: "Play one card alone first to duplicate it. Build a stacked deck over time."
  },
  {
    id: "constellation",
    name: "Constellation",
    summary: "Gains X0.1 Mult per Planet card used.",
    mainRole: "xmult", secondaryRole: "scaling_engine",
    tags: ["xmult","scaling_engine"],
    trigger: "planet used",
    scaling: "exponential",
    hands: ["any"], archetypes: ["retrigger_engine","flush"], stage: ["mid","late"],
    economy: "low", consistency: "high",
    partners: ["blueprint","brainstorm","satellite","planet_merchant"],
    antiSynergies: [], setupDifficulty: "med", risk: "low",
    notes: "Quiet engine that compounds across the run. Buy every Planet you see.",
    beginner: "Using Planet cards permanently boosts this. Hoard Planets."
  },
  {
    id: "hologram",
    name: "Hologram",
    summary: "Gains X0.25 Mult per playing card added to deck.",
    mainRole: "xmult", secondaryRole: "deck_growth",
    tags: ["xmult","scaling_engine","deck_growth"],
    trigger: "card added to deck",
    scaling: "exponential",
    hands: ["any"], archetypes: ["deck_growth"], stage: ["mid","late"],
    economy: "low", consistency: "high",
    partners: ["dna","cavendish","blueprint","brainstorm","perkeo"],
    antiSynergies: [], setupDifficulty: "med", risk: "low",
    notes: "Loves DNA and Standard packs. Buy packs aggressively.",
    beginner: "Adding any playing card to your deck pumps this. Open lots of packs."
  },
  {
    id: "obelisk",
    name: "Obelisk",
    summary: "Gains X0.2 Mult per consecutive hand played without your most-played poker hand.",
    mainRole: "xmult", secondaryRole: "scaling_engine",
    tags: ["xmult","scaling_engine"],
    trigger: "off-most-played hand",
    scaling: "exponential",
    hands: ["any"], archetypes: ["retrigger_engine","flush"], stage: ["late"],
    economy: "low", consistency: "med",
    partners: ["blueprint","brainstorm","the_idol"],
    antiSynergies: [], setupDifficulty: "high", risk: "high",
    notes: "Discipline-heavy. Resets if you slip. Insane payoff once parked.",
    beginner: "Avoid playing your favorite hand to make this grow. Risky discipline play."
  },
  {
    id: "fibonacci",
    name: "Fibonacci",
    summary: "Each played Ace, 2, 3, 5, or 8 gives +8 Mult when scored.",
    mainRole: "flat_mult", secondaryRole: "rank_face_support",
    tags: ["flat_mult","rank_face_support","payoff"],
    trigger: "scored rank match",
    scaling: "linear",
    hands: ["pair","two_pair","straight","flush"], archetypes: ["straight","high_card"], stage: ["early","mid"],
    economy: "low", consistency: "high",
    partners: ["blueprint","brainstorm","seltzer"],
    antiSynergies: [], setupDifficulty: "low", risk: "low",
    notes: "Free flat mult on common ranks. Strong early; consistent through mid.",
    beginner: "Reliable mult on common card ranks. Hard to go wrong."
  },
  {
    id: "seltzer",
    name: "Seltzer",
    summary: "Retrigger all cards played for the next 10 hands.",
    mainRole: "retrigger", secondaryRole: "payoff",
    tags: ["retrigger","scaling_engine"],
    trigger: "scored card while active",
    scaling: "linear",
    hands: ["any"], archetypes: ["retrigger_engine"], stage: ["mid"],
    economy: "low", consistency: "med",
    partners: ["fibonacci","the_idol","triboulet","blueprint","brainstorm"],
    antiSynergies: [], setupDifficulty: "low", risk: "high",
    notes: "Timer-limited. Plan to peak during boss blinds.",
    beginner: "Doubles every card for 10 hands then vanishes. Use during tough rounds."
  },
  {
    id: "stuntman",
    name: "Stuntman",
    summary: "+250 Chips. Hand size −2.",
    mainRole: "chips", secondaryRole: "hand_size",
    tags: ["chips","hand_size","payoff"],
    trigger: "every scored hand",
    scaling: "static",
    hands: ["any"], archetypes: ["high_card","held_in_hand"], stage: ["mid","late"],
    economy: "low", consistency: "high",
    partners: ["stone_joker","blueprint","brainstorm"],
    antiSynergies: ["mime","baron"],
    setupDifficulty: "low", risk: "med",
    notes: "Massive chip floor but hand-size loss hurts held-in-hand builds.",
    beginner: "Huge chip boost at the cost of smaller hand size. Don't pair with held-in-hand."
  },
  {
    id: "stone_joker",
    name: "Stone Joker",
    summary: "+25 Chips per Stone card in your full deck.",
    mainRole: "chips", secondaryRole: "enhancement_interaction",
    tags: ["chips","enhancement_interaction","scaling_engine"],
    trigger: "every scored hand",
    scaling: "linear",
    hands: ["any"], archetypes: ["deck_growth","high_card"], stage: ["mid","late"],
    economy: "low", consistency: "high",
    partners: ["stuntman","steel_joker","blueprint","brainstorm"],
    antiSynergies: [], setupDifficulty: "med", risk: "low",
    notes: "Loves Stone-card-heavy decks. Stones don't have rank/suit, freeing slots.",
    beginner: "More Stone cards = more chips. Convert junk cards to Stone."
  },
  {
    id: "steel_joker",
    name: "Steel Joker",
    summary: "Gives X0.2 Mult per Steel card in your full deck.",
    mainRole: "xmult", secondaryRole: "enhancement_interaction",
    tags: ["xmult","enhancement_interaction","scaling_engine"],
    trigger: "every scored hand",
    scaling: "exponential",
    hands: ["any"], archetypes: ["steel","held_in_hand"], stage: ["mid","late"],
    economy: "low", consistency: "high",
    partners: ["mime","baron","stone_joker","blueprint","brainstorm"],
    antiSynergies: [], setupDifficulty: "med", risk: "low",
    notes: "Counts Steel cards even in held hand. Stack Steel via Tarots.",
    beginner: "Steel cards in your deck multiply your score. Add as many as possible."
  },
  {
    id: "glass_joker",
    name: "Glass Joker",
    summary: "Gains X0.75 Mult when a Glass card is destroyed.",
    mainRole: "xmult", secondaryRole: "enhancement_interaction",
    tags: ["xmult","enhancement_interaction","scaling_engine","destroy_value"],
    trigger: "glass destroyed",
    scaling: "exponential",
    hands: ["any"], archetypes: ["glass"], stage: ["mid","late"],
    economy: "low", consistency: "med",
    partners: ["hack","blueprint","brainstorm","seltzer"],
    antiSynergies: [], setupDifficulty: "high", risk: "high",
    notes: "Cracks one shard at a time. Hack accelerates the loop.",
    beginner: "Break Glass cards to permanently buff this. Risky but explosive."
  },
  {
    id: "hack",
    name: "Hack",
    summary: "Retrigger each played 2, 3, 4, or 5.",
    mainRole: "retrigger", secondaryRole: "rank_face_support",
    tags: ["retrigger","rank_face_support"],
    trigger: "scored low rank",
    scaling: "linear",
    hands: ["any"], archetypes: ["straight","glass","retrigger_engine"], stage: ["mid"],
    economy: "low", consistency: "med",
    partners: ["fibonacci","glass_joker","blueprint","brainstorm"],
    antiSynergies: [], setupDifficulty: "low", risk: "low",
    notes: "Doubles low-card payoffs and breaks Glass twice as fast.",
    beginner: "Low cards trigger twice. Combine with Glass to crack faster."
  },
  {
    id: "hanging_chad",
    name: "Hanging Chad",
    summary: "Retrigger first played card used in scoring 2 additional times.",
    mainRole: "retrigger",
    tags: ["retrigger","scaling_engine"],
    trigger: "first scored card",
    scaling: "linear",
    hands: ["any"], archetypes: ["retrigger_engine","face_card"], stage: ["mid","late"],
    economy: "low", consistency: "high",
    partners: ["sock_and_buskin","the_idol","triboulet","blueprint","brainstorm"],
    antiSynergies: [], setupDifficulty: "low", risk: "low",
    notes: "Triples a single payoff card. Sort hands so your best card comes first.",
    beginner: "Triggers your first scoring card three times. Lead with your best card."
  },
  {
    id: "drunkard",
    name: "Drunkard",
    summary: "+1 discard each round.",
    mainRole: "discard_support",
    tags: ["discard_support","enabler"],
    trigger: "passive",
    scaling: "static",
    hands: ["any"], archetypes: ["discard","flush","straight"], stage: ["early","mid"],
    economy: "low", consistency: "high",
    partners: ["faceless_joker","mail_in_rebate","green_joker"],
    antiSynergies: [], setupDifficulty: "low", risk: "low",
    notes: "Cheap enabler for discard-economy and flush builds.",
    beginner: "Gives you one more discard per round. Helps you find the cards you want."
  },
  {
    id: "faceless_joker",
    name: "Faceless Joker",
    summary: "Earn $5 if discard contains 3+ face cards.",
    mainRole: "economy", secondaryRole: "discard_support",
    tags: ["economy","discard_support"],
    trigger: "discard condition",
    scaling: "linear",
    hands: ["any"], archetypes: ["discard","economy_snowball","face_card"], stage: ["early","mid"],
    economy: "high", consistency: "med",
    partners: ["drunkard","mail_in_rebate","pareidolia"],
    antiSynergies: [], setupDifficulty: "low", risk: "low",
    notes: "Steady income while still playing the game. Pareidolia trivializes the condition.",
    beginner: "Discard 3+ face cards for $5. Easy money in face-heavy decks."
  },
  {
    id: "mail_in_rebate",
    name: "Mail-in Rebate",
    summary: "Earn $5 for each discarded card of a specific rank.",
    mainRole: "economy", secondaryRole: "discard_support",
    tags: ["economy","discard_support"],
    trigger: "discard condition",
    scaling: "linear",
    hands: ["any"], archetypes: ["discard","economy_snowball"], stage: ["early","mid"],
    economy: "high", consistency: "med",
    partners: ["drunkard","faceless_joker"],
    antiSynergies: [], setupDifficulty: "low", risk: "low",
    notes: "Pure economy. Funds upgrades in the early game.",
    beginner: "Discarding a target rank pays you. Free money if you draw them."
  },
  {
    id: "green_joker",
    name: "Green Joker",
    summary: "+1 Mult per hand played, −1 Mult per discard.",
    mainRole: "flat_mult", secondaryRole: "scaling_engine",
    tags: ["flat_mult","scaling_engine"],
    trigger: "every hand / every discard",
    scaling: "linear",
    hands: ["any"], archetypes: ["high_card","pair"], stage: ["early","mid"],
    economy: "low", consistency: "high",
    partners: ["blueprint","brainstorm","fibonacci"],
    antiSynergies: ["drunkard","mail_in_rebate"],
    setupDifficulty: "low", risk: "med",
    notes: "Punishes discard-heavy strategies. Best in stingy play.",
    beginner: "Grows when you play hands. Don't discard much, or it shrinks."
  },
  {
    id: "ride_the_bus",
    name: "Ride the Bus",
    summary: "+1 Mult per consecutive hand played without a face card.",
    mainRole: "flat_mult", secondaryRole: "scaling_engine",
    tags: ["flat_mult","scaling_engine"],
    trigger: "no face cards scored",
    scaling: "linear",
    hands: ["any"], archetypes: ["high_card","straight","flush"], stage: ["early","mid"],
    economy: "low", consistency: "med",
    partners: ["blueprint","brainstorm","fibonacci"],
    antiSynergies: ["triboulet","pareidolia","sock_and_buskin"],
    setupDifficulty: "med", risk: "high",
    notes: "Resets on any face card. Conflicts with face-card builds.",
    beginner: "Avoid face cards to grow it. One slip resets it to zero."
  },
  {
    id: "golden_joker",
    name: "Golden Joker",
    summary: "Earn $4 at end of round.",
    mainRole: "economy",
    tags: ["economy","consistency"],
    trigger: "end of round",
    scaling: "static",
    hands: ["any"], archetypes: ["economy_snowball"], stage: ["early","mid","late"],
    economy: "high", consistency: "high",
    partners: ["midas_mask","faceless_joker","mail_in_rebate"],
    antiSynergies: [], setupDifficulty: "low", risk: "low",
    notes: "Pure interest support. Snowballs through interest cap.",
    beginner: "Pays you every round. Helps you keep interest maxed."
  },
  {
    id: "satellite",
    name: "Satellite",
    summary: "Earn $1 at end of round per unique Planet card used this run.",
    mainRole: "economy", secondaryRole: "scaling_engine",
    tags: ["economy","scaling_engine"],
    trigger: "end of round",
    scaling: "linear",
    hands: ["any"], archetypes: ["economy_snowball"], stage: ["mid","late"],
    economy: "high", consistency: "high",
    partners: ["constellation","planet_merchant","golden_joker"],
    antiSynergies: [], setupDifficulty: "low", risk: "low",
    notes: "Compounds with any Planet-heavy run. Free money for natural shop behavior.",
    beginner: "Every Planet you use pays you each round. Use lots of Planets."
  },
  {
    id: "planet_merchant",
    name: "Planet Merchant",
    summary: "Planet cards appear 2X more often in the shop.",
    mainRole: "enabler", secondaryRole: "economy",
    tags: ["enabler","economy"],
    trigger: "shop generation",
    scaling: "static",
    hands: ["any"], archetypes: ["economy_snowball","flush"], stage: ["mid"],
    economy: "med", consistency: "high",
    partners: ["constellation","satellite"],
    antiSynergies: [], setupDifficulty: "low", risk: "low",
    notes: "Plumbing for Constellation + Satellite axis.",
    beginner: "Shop sees more Planets. Helps you scale hand levels."
  },
  {
    id: "driver_gloves",
    name: "Driver's License",
    summary: "X3 Mult if you have at least 16 Enhanced cards in your full deck.",
    mainRole: "xmult", secondaryRole: "enhancement_interaction",
    tags: ["xmult","enhancement_interaction","payoff"],
    trigger: "every scored hand",
    scaling: "static",
    hands: ["any"], archetypes: ["deck_growth","steel","glass"], stage: ["late"],
    economy: "low", consistency: "high",
    partners: ["steel_joker","stone_joker","glass_joker","blueprint","brainstorm"],
    antiSynergies: [], setupDifficulty: "high", risk: "med",
    notes: "Pairs with enhancement-spam decks. Big flat X3 once unlocked.",
    beginner: "Add lots of enhancements (Steel, Glass, Stone) to switch on a big X3."
  },
  {
    id: "cavendish",
    name: "Cavendish",
    summary: "X3 Mult. 1 in 1000 chance to be destroyed at end of round.",
    mainRole: "xmult",
    tags: ["xmult","payoff"],
    trigger: "every scored hand",
    scaling: "static",
    hands: ["any"], archetypes: ["high_card","face_card","flush"], stage: ["mid","late"],
    economy: "low", consistency: "high",
    partners: ["blueprint","brainstorm","hologram"],
    antiSynergies: [], setupDifficulty: "high", risk: "med",
    notes: "Rare unlock. Cheap, premium, near-zero downside.",
    beginner: "Massive multiplier that almost never breaks. Always keep it."
  },
  {
    id: "perkeo",
    name: "Perkeo",
    summary: "Creates a Negative copy of 1 random consumable in your possession at the end of each shop.",
    mainRole: "economy", secondaryRole: "consistency",
    tags: ["economy","consistency","scaling_engine"],
    trigger: "end of shop",
    scaling: "linear",
    hands: ["any"], archetypes: ["economy_snowball","deck_growth"], stage: ["late"],
    economy: "high", consistency: "high",
    partners: ["hologram","constellation","satellite","blueprint","brainstorm"],
    antiSynergies: [], setupDifficulty: "med", risk: "low",
    notes: "Doubles your consumable economy. Best with Negative-friendly engines.",
    beginner: "Duplicates a consumable each shop. Frees consumable slots forever."
  },
  {
    id: "vampire",
    name: "Vampire",
    summary: "Gains X0.1 Mult per played Enhanced card, removing the enhancement.",
    mainRole: "xmult", secondaryRole: "destroy_value",
    tags: ["xmult","destroy_value","enhancement_interaction","scaling_engine"],
    trigger: "scored enhanced card",
    scaling: "exponential",
    hands: ["any"], archetypes: ["deck_growth","steel","glass"], stage: ["mid","late"],
    economy: "low", consistency: "med",
    partners: ["smeared_joker","hack","blueprint","brainstorm"],
    antiSynergies: ["steel_joker","stone_joker","glass_joker","driver_gloves"],
    setupDifficulty: "med", risk: "high",
    notes: "Eats your own enhancements. Conflicts with passive-enhancement Jokers.",
    beginner: "Consumes enhanced cards to grow. Don't pair with Steel/Glass/Stone payoff Jokers."
  }
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
  { a: "constellation", b: "planet_merchant", kind: "archetype_only", engine: "scaling",
    why: "Planet Merchant doubles Planet shop rate; every Planet bought pumps Constellation's XMult. Pure Planet-economy axis." },
  { a: "satellite", b: "planet_merchant", kind: "archetype_only", engine: "economy",
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
    why: "Once Obelisk has parked a huge XMult, Blueprint copies it — but only commit when you've truly stopped playing your most-played hand." }
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
    core: ["planet_merchant","satellite","constellation"],
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
  }
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
    enablers: ["smeared_joker","drunkard","planet_merchant"],
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
    enablers: ["planet_merchant"],
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
