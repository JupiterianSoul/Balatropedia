export interface BossBlind {
  id: string;
  name: string;
  anteRange: string;
  effect: string;
  counters: string[];
  counterJokers: string[];
}

export const BOSSES: BossBlind[] = [
  {
    id: "the_hook",
    name: "The Hook",
    anteRange: "Ante 1+",
    effect: "Discards 2 random cards from your hand after every played hand.",
    counters: [
      "Lead with your scoring cards so the forced discards hit dead cards.",
      "Run a larger hand size so the loss matters less.",
    ],
    counterJokers: ["juggler", "turtle_bean", "stuntman"],
  },
  {
    id: "the_ox",
    name: "The Ox",
    anteRange: "Ante 6+",
    effect: "Playing your most-played poker hand sets your money to $0.",
    counters: [
      "Switch to a different hand type for this blind if your economy matters.",
      "If you don't rely on interest, just play through it.",
    ],
    counterJokers: ["egg", "to_the_moon", "bull"],
  },
  {
    id: "the_house",
    name: "The House",
    anteRange: "Ante 2+",
    effect: "The first hand of the round is drawn face down.",
    counters: [
      "Play a throwaway exploratory hand first, then commit once cards are revealed.",
      "Discard-heavy decks can fish blindly with less risk.",
    ],
    counterJokers: ["pareidolia", "marble_joker", "burglar"],
  },
  {
    id: "the_wall",
    name: "The Wall",
    anteRange: "Ante 2+",
    effect: "Extra-large blind; roughly double the usual chip requirement.",
    counters: [
      "Bring a real multiplier engine online before facing it.",
      "Bank a strong leveled hand and high-mult jokers.",
    ],
    counterJokers: ["blueprint", "brainstorm", "the_idol"],
  },
  {
    id: "the_wheel",
    name: "The Wheel",
    anteRange: "Ante 2+",
    effect: "1 in 7 cards are drawn face down each hand.",
    counters: [
      "Favor consistency pieces that don't depend on exact cards.",
      "Keep hand-finding flexible so a hidden card isn't fatal.",
    ],
    counterJokers: ["pareidolia", "oops_all_6s", "stuntman"],
  },
  {
    id: "the_arm",
    name: "The Arm",
    anteRange: "Ante 2+",
    effect: "Decreases the level of the poker hand you play by 1.",
    counters: [
      "Play your strongest leveled hand so a single level drop still clears it.",
      "Over-level a backup hand with extra Planet cards.",
    ],
    counterJokers: ["burnt_joker", "constellation", "space_joker"],
  },
  {
    id: "the_club",
    name: "The Club",
    anteRange: "Ante 1+",
    effect: "All Club cards are debuffed (score nothing).",
    counters: [
      "Avoid leaning on Clubs; lead with other suits.",
      "Smeared Joker can merge suits to dodge the penalty in flush builds.",
    ],
    counterJokers: ["smeared_joker", "pareidolia"],
  },
  {
    id: "the_fish",
    name: "The Fish",
    anteRange: "Ante 2+",
    effect: "Cards are drawn face down after each hand played.",
    counters: [
      "Play fewer, bigger hands to minimize how many cards get hidden.",
      "Consistent engines beat card-specific payoffs here.",
    ],
    counterJokers: ["stuntman", "blueprint", "ride_the_bus"],
  },
  {
    id: "the_psychic",
    name: "The Psychic",
    anteRange: "Ante 1+",
    effect: "You must play exactly 5 cards each hand.",
    counters: [
      "Build hands that score on 5 cards (flush, straight, full house).",
      "Pad single-card payoffs with filler that still triggers your jokers.",
    ],
    counterJokers: ["the_idol", "smeared_joker", "sock_and_buskin"],
  },
  {
    id: "the_goad",
    name: "The Goad",
    anteRange: "Ante 1+",
    effect: "All Spade cards are debuffed (score nothing).",
    counters: [
      "Pivot away from Spades for this blind.",
      "Smeared Joker merges suits so Spade-debuff bites less.",
    ],
    counterJokers: ["smeared_joker", "pareidolia"],
  },
  {
    id: "the_water",
    name: "The Water",
    anteRange: "Ante 2+",
    effect: "Start the round with 0 discards.",
    counters: [
      "Lean on hand-finding jokers and high consistency.",
      "Avoid builds that need to sculpt the hand via discards.",
    ],
    counterJokers: ["blueprint", "the_idol", "stuntman"],
  },
  {
    id: "the_window",
    name: "The Window",
    anteRange: "Ante 1+",
    effect: "All Diamond cards are debuffed (score nothing).",
    counters: [
      "Drop Diamond reliance for the blind.",
      "Smeared Joker can fold Diamonds into another scoring suit.",
    ],
    counterJokers: ["smeared_joker", "pareidolia"],
  },
  {
    id: "the_manacle",
    name: "The Manacle",
    anteRange: "Ante 1+",
    effect: "Reduces your hand size by 1 for the round.",
    counters: [
      "Run hand-size jokers to offset the squeeze.",
      "Tighter builds that don't need wide hands are fine.",
    ],
    counterJokers: ["turtle_bean", "juggler", "stuntman"],
  },
  {
    id: "the_eye",
    name: "The Eye",
    anteRange: "Ante 3+",
    effect: "No poker hand type can be played more than once this round.",
    counters: [
      "Bring a deck flexible enough to make many different hand types.",
      "Score-anything jokers (flat/XMult on any hand) shine here.",
    ],
    counterJokers: ["joker", "blueprint", "ride_the_bus"],
  },
  {
    id: "the_mouth",
    name: "The Mouth",
    anteRange: "Ante 2+",
    effect: "Only one poker hand type may be played the entire round.",
    counters: [
      "Pick your strongest reliable hand and commit fully.",
      "Make sure your jokers fire on that single hand type.",
    ],
    counterJokers: ["the_idol", "blueprint", "sock_and_buskin"],
  },
  {
    id: "the_plant",
    name: "The Plant",
    anteRange: "Ante 4+",
    effect: "All face cards are debuffed (score nothing).",
    counters: [
      "Avoid face-card engines for this blind.",
      "Pareidolia interaction is risky; lean on number-card scaling instead.",
    ],
    counterJokers: ["fibonacci", "the_idol", "smeared_joker"],
  },
  {
    id: "the_serpent",
    name: "The Serpent",
    anteRange: "Ante 5+",
    effect: "After each hand or discard, always draw exactly 3 cards.",
    counters: [
      "Keep hand size modest and plan around the fixed draw.",
      "Consistent jokers beat hand-sculpting strategies.",
    ],
    counterJokers: ["blueprint", "stuntman", "ride_the_bus"],
  },
  {
    id: "the_pillar",
    name: "The Pillar",
    anteRange: "Ante 1+",
    effect: "Cards played earlier this Ante are debuffed.",
    counters: [
      "Hold back fresh cards to play against the boss.",
      "Wide decks have plenty of un-played cards to fall back on.",
    ],
    counterJokers: ["marble_joker", "burglar", "pareidolia"],
  },
  {
    id: "the_needle",
    name: "The Needle",
    anteRange: "Ante 2+",
    effect: "You only get one hand for the entire round.",
    counters: [
      "Set up a single devastating hand; over-level and stack XMult.",
      "Make sure discards have arranged the perfect hand first.",
    ],
    counterJokers: ["the_idol", "blueprint", "brainstorm"],
  },
  {
    id: "the_head",
    name: "The Head",
    anteRange: "Ante 1+",
    effect: "All Heart cards are debuffed (score nothing).",
    counters: [
      "Avoid Hearts for the blind.",
      "Smeared Joker can merge Hearts into another scoring suit.",
    ],
    counterJokers: ["smeared_joker", "pareidolia"],
  },
  {
    id: "the_tooth",
    name: "The Tooth",
    anteRange: "Ante 3+",
    effect: "Lose $1 for every card played this round.",
    counters: [
      "Play fewer, larger-scoring hands to limit the bleed.",
      "Strong economy or interest cushions the loss.",
    ],
    counterJokers: ["bull", "to_the_moon", "egg"],
  },
  {
    id: "the_flint",
    name: "The Flint",
    anteRange: "Ante 2+",
    effect: "Base Chips and Mult are halved for the round.",
    counters: [
      "Multiplicative XMult jokers ignore the halving better than flat sources.",
      "Bring your biggest scaling engine online before facing it.",
    ],
    counterJokers: ["the_idol", "blueprint", "brainstorm"],
  },
  {
    id: "the_mark",
    name: "The Mark",
    anteRange: "Ante 2+",
    effect: "All face cards are drawn face down.",
    counters: [
      "Don't depend on seeing face cards; play around hidden royals.",
      "Pareidolia turns everything into a face card, complicating this; plan accordingly.",
    ],
    counterJokers: ["sock_and_buskin", "the_idol", "stuntman"],
  },
  {
    id: "the_tribe",
    name: "The Tribe",
    anteRange: "Ante 5+",
    effect: "Increased blind size (large chip requirement).",
    counters: [
      "Have a real scaling win condition ready.",
      "Level your main hand heavily before the blind.",
    ],
    counterJokers: ["blueprint", "the_idol", "constellation"],
  },
  {
    id: "the_final_acorn",
    name: "The Final Acorn",
    anteRange: "Ante 8 only",
    effect: "Flips one random Joker face down after each played hand, disabling it until the round ends.",
    counters: [
      "Spread your power across several jokers so losing one isn't fatal.",
      "Front-load damage before too many jokers get flipped.",
    ],
    counterJokers: ["blueprint", "brainstorm", "joker"],
  },
  {
    id: "the_final_heart",
    name: "The Final Heart",
    anteRange: "Ante 8 only",
    effect: "Debuffs 1 random card from your hand each hand played.",
    counters: [
      "Run consistency so a single dead card doesn't break the hand.",
      "Wide scoring (flush/straight) tolerates one debuffed card.",
    ],
    counterJokers: ["the_idol", "blueprint", "smeared_joker"],
  },
  {
    id: "the_final_vessel",
    name: "The Final Vessel",
    anteRange: "Ante 8 only",
    effect: "Very large blind with base Chips and Mult heavily reduced.",
    counters: [
      "Only a fully online XMult engine reliably clears this.",
      "Stack multiplicative jokers; flat mult won't cut it.",
    ],
    counterJokers: ["the_idol", "blueprint", "brainstorm"],
  },
  {
    id: "the_final_leaf",
    name: "The Final Leaf",
    anteRange: "Ante 8 only",
    effect: "All cards are debuffed until you play a hand of a specific required suit.",
    counters: [
      "Force the required suit early to lift the debuff, then score.",
      "Smeared Joker keeps suit options open under pressure.",
    ],
    counterJokers: ["smeared_joker", "pareidolia", "the_idol"],
  },
];

