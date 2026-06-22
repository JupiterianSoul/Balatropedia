export type Planet = {
  id: string;
  name: string;
  hand: string;
  chipsPerLevel: number;
  multPerLevel: number;
  scalingNotes: string;
  bestWith: string[];
  deepStrategy?: string[];
  bestTimingNotes?: string;
  commonMistakes?: string[];
  comboIdeas?: string[];
};

export const PLANETS: Planet[] = [
  {
    id: "pluto",
    name: "Pluto",
    hand: "High Card",
    chipsPerLevel: 10,
    multPerLevel: 1,
    scalingNotes: "High Card starts weak (5 chips, 1 mult) but Pluto is easy to stack; each level adds 10 chips. Best used when High Card jokers compound each level.",
    bestWith: ["high_card", "castle", "scary_face"],
    deepStrategy: [
      "Pluto's +10 chips/+1 mult per level is low raw value but High Card plays frequently; levels accumulate fast.",
      "castle joker gains chips each time High Card is played; Pluto's chip levels stack additively with castle's growth.",
      "scary_face gives +30 chips when a face card is scored in High Card hands; Pluto raises the chip baseline further.",
      "Use Telescope voucher with a High Card focus to guarantee Pluto appears in Celestial packs.",
      "High Card build relies on deck-thinning + face cards; Pluto is cheap in Celestial packs and worth stacking freely.",
    ],
    bestTimingNotes: "Stack Pluto aggressively if running a dedicated High Card build. Even 5-6 levels (+50 chips, +5 mult) meaningfully shifts scoring in low-stake runs.",
    commonMistakes: [
      "Leveling Pluto when you rarely play High Card; levels only benefit the hand you're actually scoring with.",
      "Ignoring Pluto entirely; in High Card builds it's the primary scaling source and cannot be overlooked.",
    ],
    comboIdeas: [
      "castle joker: stacks chips per High Card play; Pluto levels multiply that base independently.",
      "scary_face: each face card scored in High Card gets +30 chips; Pluto raises the baseline on top of that.",
      "Telescope voucher: guarantees Pluto in Celestial packs when High Card is most-played; efficient level farming.",
    ],
  },
  {
    id: "mercury",
    name: "Mercury",
    hand: "Pair",
    chipsPerLevel: 15,
    multPerLevel: 1,
    scalingNotes: "Pair is one of the most consistent hands to play. Mercury levels up quickly in runs where Pairs appear frequently, and 15 chips/level accumulates fast.",
    bestWith: ["pair", "spare_trousers", "even_steven"],
    deepStrategy: [
      "Pair is one of the easiest hands to construct; Mercury levels accumulate faster than most other planets.",
      "spare_trousers gains +2 mult per Pair played; Mercury's chip levels compound with trousers' growing mult.",
      "even_steven gives +4 mult for even-ranked cards scored; even-rank pairs double-dip chip and mult synergies.",
      "+15 chips per level means Level 10 Pair starts at 155 chips; solid baseline before any mult jokers fire.",
      "Blue Seal on a Pair card generates Mercury on discard-out, passively leveling Pair each round.",
    ],
    bestTimingNotes: "Stack Mercury consistently whenever you play Pairs. Level 5-8 Pair is competitive even without dedicated mult jokers.",
    commonMistakes: [
      "Investing Mercury in a run pivoting to higher hands; if you've moved to Full Houses, Mercury levels are wasted.",
      "Skipping Mercury in Celestial packs when Pair is your current scoring hand; missed free levels.",
    ],
    comboIdeas: [
      "spare_trousers + Mercury: Pair played earns +2 mult and levels Mercury simultaneously; self-reinforcing scaling.",
      "even_steven: even pairs get +4 mult from even_steven; Mercury raises the chip base so mult multiplies more chips.",
      "Blue Seal on paired card: generates Mercury passively each round you hold the sealed card in hand.",
    ],
  },
  {
    id: "uranus",
    name: "Uranus",
    hand: "Two Pair",
    chipsPerLevel: 20,
    multPerLevel: 1,
    scalingNotes: "Two Pair benefits from 20 chips/level. Combine with Two Pair jokers to ensure consistent play and maximize level investment.",
    bestWith: ["two_pair", "spare_trousers", "sly_joker"],
    deepStrategy: [
      "Two Pair occurs naturally in Pair-heavy decks; +20 chips per level gives Level 8 Two Pair a 180-chip base.",
      "spare_trousers gains +2 mult per Pair played; Two Pair counts as playing 2 Pairs, giving +4 mult per play.",
      "sly_joker gives +50 chips per Two Pair played; stacks directly with Uranus' chip levels for linear chip growth.",
      "Two Pair + Uranus is a reliable mid-game scaling path before access to rare xmult jokers.",
      "Telescope voucher with Two Pair as most-played guarantees Uranus in Celestial packs each shop cycle.",
    ],
    bestTimingNotes: "Use Uranus consistently in Two Pair builds. By ante 5-6, Level 8-10 Two Pair with sly_joker provides a solid chip-mult foundation.",
    commonMistakes: [
      "Over-investing Uranus when transitioning to Full House or Four of a Kind in late antes.",
      "Playing Two Pair builds without sly_joker; without chip jokers, Uranus levels alone can't carry late-game scoring.",
    ],
    comboIdeas: [
      "sly_joker + Uranus: sly_joker's flat +50 chips per Two Pair + Uranus chip levels = high-chip low-mult entry point.",
      "spare_trousers: Two Pair fires trousers twice per hand (+4 mult total); Uranus chip levels make those mult points count.",
      "Telescope: lock Uranus as the most-played hand's planet for guaranteed Celestial pack drops.",
    ],
  },
  {
    id: "venus",
    name: "Venus",
    hand: "Three of a Kind",
    chipsPerLevel: 20,
    multPerLevel: 2,
    scalingNotes: "Three of a Kind gains 2 mult/level making Venus strong in mult-heavy builds. Synergizes with retriggering jokers to maximize the hand's mult ceiling.",
    bestWith: ["three_of_a_kind", "sock_and_buskin", "hanging_chad"],
    deepStrategy: [
      "+2 mult per level is twice Mercury's rate; Venus levels have compounding multiplicative impact when xmult jokers are present.",
      "Three of a Kind draws frequently enough to level Venus quickly in a rank-heavy deck.",
      "sock_and_buskin retriggers face cards in Three of a Kind; each retrigger fires all enhancements twice.",
      "hanging_chad retriggers the first scored card; place a Glass or Mult Card first for double enhancement procs.",
      "Venus Level 10 gives Three of a Kind 220 base chips and 20 mult; strong mid-game floor for xmult scaling.",
    ],
    bestTimingNotes: "Venus is most valuable mid-run when Three of a Kind is your established hand. Stack it consistently; the +2 mult/level returns compound faster than chip-only planets.",
    commonMistakes: [
      "Leveling Venus while running a Flush or Straight build; Three of a Kind levels don't transfer.",
      "Underestimating +2 mult/level; at Level 10 that's +20 mult baseline, equivalent to 5 Jokers at their base +4 mult each.",
    ],
    comboIdeas: [
      "sock_and_buskin + Venus: retrigger face cards in Three of a Kind; each retrigger adds another mult-scaling activation.",
      "hanging_chad: first card retrigger fires Glass/Mult Card effects twice; Venus raises the mult baseline both effects apply to.",
      "glass cards in Three of a Kind: x2 mult per Glass Card scored; Venus raises the running mult that Glass multiplies.",
    ],
  },
  {
    id: "saturn",
    name: "Saturn",
    hand: "Straight",
    chipsPerLevel: 30,
    multPerLevel: 3,
    scalingNotes: "Straight gets the highest chips+mult rate per level among the common hands. Each Saturn use is high value; level 5+ Straight becomes a serious scorer.",
    bestWith: ["straight", "shortcut", "four_fingers"],
    deepStrategy: [
      "Saturn's +30 chips +3 mult per level is the best raw stat-per-level of any non-secret planet card.",
      "shortcut joker allows Straights with gaps; dramatically improves Straight consistency in unoptimized decks.",
      "four_fingers joker allows 4-card Straights and Flushes; Straights become easier to construct, more Venus activations.",
      "Level 5 Straight via Saturn: 205 chips and 15 mult before jokers; already competitive with higher hands at L1.",
      "runner joker scales +15 chips per Straight played lifetime; Saturn + runner creates a self-reinforcing chip wall.",
    ],
    bestTimingNotes: "Saturn is worth prioritizing any time Straight is your primary hand. Even 3-4 levels meaningfully spike your score ceiling before boss blinds.",
    commonMistakes: [
      "Building Straights without shortcut or four_fingers in a standard 52-card deck; Straight consistency drops sharply.",
      "Skipping Saturn in packs when Straight is your scoring hand; it's the strongest stat/level planet in the non-secret pool.",
    ],
    comboIdeas: [
      "shortcut + Saturn: shortcut makes Straights trivially consistent; Saturn levels make each one score massive points.",
      "four_fingers + Saturn: 4-card Straights possible; more frequent straights = faster Saturn level accrual.",
      "runner joker: gains +15 chips per Straight played; Saturn levels add base chips that runner's total multiplies against.",
    ],
  },
  {
    id: "jupiter",
    name: "Jupiter",
    hand: "Flush",
    chipsPerLevel: 15,
    multPerLevel: 2,
    scalingNotes: "Flush is the dominant hand type in many runs; Jupiter consistently delivers value. Stacks naturally with Astronomer and Constellation jokers.",
    bestWith: ["flush", "four_fingers", "smeared_joker"],
    deepStrategy: [
      "Flush is the easiest 5-card hand to build consistently; Jupiter levels accumulate with minimal deck engineering.",
      "constellation gains +0.1x mult per planet used; Jupiter uses directly scale constellation's xmult.",
      "four_fingers enables 4-card Flush plays, dramatically improving Flush frequency and Jupiter level accumulation.",
      "smeared_joker makes Hearts/Diamonds and Spades/Clubs count together, enabling Flush with mixed-suit draws.",
      "Level 8 Flush: 175 chips, 18 mult; a solid foundation before suit jokers (arrowhead, bloodstone) amplify it.",
    ],
    bestTimingNotes: "Jupiter is the most broadly useful planet for non-specialized runs. Stack it whenever Flush is your most-played hand; the 15 chips + 2 mult per level return is consistent.",
    commonMistakes: [
      "Investing Jupiter while accidentally running a Straight build; check your Run Info most-played hand before leveling.",
      "Not using Telescope voucher when Flush is most-played; Telescope guarantees Jupiter in every Celestial pack.",
    ],
    comboIdeas: [
      "constellation + Jupiter: every Jupiter use adds +0.1x mult to constellation permanently; level often.",
      "four_fingers: 4-card Flushes speed up Jupiter leveling; combine with smeared_joker for maximum Flush frequency.",
      "astronomer voucher: reduces planet costs to $0; Jupiter use costs nothing, enabling unlimited leveling from Celestial packs.",
    ],
  },
  {
    id: "earth",
    name: "Earth",
    hand: "Full House",
    chipsPerLevel: 25,
    multPerLevel: 2,
    scalingNotes: "Full House offers chip-heavy scaling at 25/level. Use in dedicated Full House builds that can reliably construct the hand each round.",
    bestWith: ["shoot_the_moon", "raised_fist", "hologram"],
    deepStrategy: [
      "Full House requires a Triple + Pair; a moderately demanding construction but reliable in rank-heavy decks.",
      "raise_fist gives +2 mult per lowest-rank card scored; Full House scores all 5 cards including the pair's low cards.",
      "hologram gains +0.25x mult per card added to hand; Full House builds that draw full 5-card hands benefit.",
      "shoot_the_moon gives +13 mult for each Queen held; hold Queens outside the Full House for passive mult.",
      "Earth Level 8: 230 chips, 20 mult; chip-heavy foundation ideal for xmult jokers to exponentially amplify.",
    ],
    bestTimingNotes: "Earth is worth investing in once you have a stable Full House construction engine. Ante 4-6 setup pays dividends through the final antes.",
    commonMistakes: [
      "Building Earth in a run where Full House is inconsistent; if you miss the hand more than 30% of rounds, respecialize.",
      "Ignoring that Earth's +25 chips/level is a strong chip foundation; pair with hologram or raised_fist for mult coverage.",
    ],
    comboIdeas: [
      "raised_fist + Earth: each Full House scores the pair's low cards; raised_fist's +2 mult per low card adds up.",
      "hologram + Earth: Full House scores 5 cards; hologram scales xmult as hands drawn toward Full House add to hand.",
      "shoot_the_moon: Queens held passively add mult; play Full Houses that don't include Queens to maximize both effects.",
    ],
  },
  {
    id: "mars",
    name: "Mars",
    hand: "Four of a Kind",
    chipsPerLevel: 30,
    multPerLevel: 3,
    scalingNotes: "Four of a Kind is hard to construct consistently but each Mars is extremely rewarding. Pair with jokers that manipulate card ranks for reliable access.",
    bestWith: ["four_of_a_kind", "hanging_chad", "sock_and_buskin"],
    deepStrategy: [
      "+30 chips +3 mult per level matches Saturn; Four of a Kind starts strong (60 chips, 7 mult) and scales brutally.",
      "Four of a Kind requires 4 same-rank cards; Strength Tarot + Death duplication makes this achievable mid-run.",
      "hanging_chad retriggers the first scored card; in Four of a Kind that card fires its enhancement effects twice.",
      "sock_and_buskin retriggers face cards in Four of a Kind; face card quads with Glass/Mult enhancements explode.",
      "Level 6 Four of a Kind: 240 chips, 25 mult; extremely powerful for a hand that scores less frequently than Flush.",
    ],
    bestTimingNotes: "Mars is only worth investing in if you can hit Four of a Kind reliably. Once established, every Mars level pushes the already-high base stats to game-winning levels.",
    commonMistakes: [
      "Leveling Mars without a rank-manipulation strategy; Four of a Kind in a standard deck is too inconsistent to invest in.",
      "Not using Strength + Death to create rank consistency early; these are prerequisites before Mars becomes viable.",
    ],
    comboIdeas: [
      "hanging_chad: first card in Four of a Kind retriggers; Glass or Mult Card in position 1 fires twice per hand.",
      "sock_and_buskin: retriggers face card quads; face card Four of a Kind with Mars levels = enormous mult scaling.",
      "Strength Tarot + Death: push cards to same rank, Death duplicate; build Four of a Kind sets, then level Mars freely.",
    ],
  },
  {
    id: "neptune",
    name: "Neptune",
    hand: "Straight Flush",
    chipsPerLevel: 40,
    multPerLevel: 4,
    scalingNotes: "Straight Flush starts strong (100 chips, 8 mult) and Neptune pushes it to extreme levels fast. A few Neptune uses make Straight Flush runs nearly unbeatable.",
    bestWith: ["straight_flush_endgame", "four_fingers", "shortcut"],
    deepStrategy: [
      "+40 chips +4 mult per level is the highest non-secret planet stat rate; each Neptune use is exceptional value.",
      "Straight Flush starts at 100 chips / 8 mult (the highest base); Level 5 via Neptune: 300 chips, 28 mult baseline.",
      "four_fingers enables 4-card Straight Flush; dramatically increases frequency while Neptune accelerates per-play value.",
      "shortcut allows gaps in Straights; combined with same-suit cards or Wild Cards, Straight Flush rate improves.",
      "Straight Flush is relatively rare; focus the entire run on enabling it rather than leveling multiple hands.",
    ],
    bestTimingNotes: "Neptune is a game-changer once Straight Flush is reliable. Even 2-3 levels (300 chips, 20 mult base) pushes scores into ranges most chip/mult jokers struggle to match solo.",
    commonMistakes: [
      "Investing Neptune without reliable Straight Flush construction; Straight Flush is the hardest natural hand.",
      "Not using four_fingers or shortcut; without enablers, Straight Flush rate is too low to justify Neptune investment.",
    ],
    comboIdeas: [
      "four_fingers + Neptune: 4-card Straight Flush possible; Neptune levels make each one wildly high-scoring.",
      "shortcut + four_fingers: gaps allowed + 4-card window = Straight Flush in nearly every hand draw.",
      "Wild Cards: a single Wild Card in a near-Flush hand enables Straight Flush far more consistently than pure luck.",
    ],
  },
  {
    id: "planet_x",
    name: "Planet X",
    hand: "Five of a Kind",
    chipsPerLevel: 35,
    multPerLevel: 3,
    scalingNotes: "Five of a Kind is only achievable with Wild Cards or special jokers, but Planet X delivers massive base values. Each level meaningfully pushes already-huge scores higher.",
    bestWith: ["smeared_joker", "four_fingers", "oops_all_6s"],
    deepStrategy: [
      "Five of a Kind requires 5 same-rank cards; Wild Cards count as all ranks, so 4 same-rank + Wild = Five of a Kind.",
      "Planet X is a secret planet (very rare in Celestial packs); every use is exceptionally valuable.",
      "oops_all_6s joker: if all 6s in deck, play five 6s for guaranteed Five of a Kind access without Wild Cards.",
      "+35 chips +3 mult per level makes each Planet X use equal to a full Saturn use on a more powerful hand.",
      "Death Tarot + Five of a Kind builds: copy a Wild Card 4 times, then add 1 target rank card for consistent five-of-a-kind.",
    ],
    bestTimingNotes: "Use Planet X immediately upon finding it; Five of a Kind builds are endgame-oriented and every level compounds. Don't save it; the scoring ceiling is the final boss.",
    commonMistakes: [
      "Attempting Five of a Kind without Wild Cards or oops_all_6s; a standard deck has only 4 of each rank.",
      "Skipping Planet X in packs when not currently running Five of a Kind; even 1-2 levels are massive if the hand is later enabled.",
    ],
    comboIdeas: [
      "oops_all_6s: gives a free 6 of each suit per round; five 6s = Five of a Kind; Planet X turns this into a chip/mult monster.",
      "smeared_joker: broadens suit interpretation; combine with Wild Cards for more consistent Five of a Kind access.",
      "four_fingers + Wild Card: 4-card Five of a Kind possible in theory; Wild Card fills any rank/suit gap.",
    ],
  },
  {
    id: "ceres",
    name: "Ceres",
    hand: "Flush House",
    chipsPerLevel: 40,
    multPerLevel: 4,
    scalingNotes: "Flush House is a rare secret hand combining Full House and Flush requirements. Ceres is a secret planet card; use with Wild Cards or suit-manipulation jokers to reliably hit this hand.",
    bestWith: ["smeared_joker", "four_fingers", "flower_pot"],
    deepStrategy: [
      "Flush House = Full House where all 5 cards share the same suit; requires rank clustering AND suit homogeneity.",
      "Wild Cards satisfy both suit AND rank simultaneously; add 1-2 Wild Cards to a Full House build for Flush House access.",
      "smeared_joker counts Hearts/Diamonds and Spades/Clubs as the same; effectively halves the suit requirements.",
      "+40 chips +4 mult per level ties Neptune as the best-scaling planet; each Ceres is enormously valuable.",
      "Suit-conversion Tarots (Star, Moon, Sun, World) convert Full House hands to a single suit for Flush House.",
    ],
    bestTimingNotes: "Ceres is a secret planet; finding it in a pack is rare. Use it every time to accelerate an already-established Flush House strategy. Don't wait for setup; start enabling Flush House immediately.",
    commonMistakes: [
      "Attempting Flush House without suit conversion tools; standard Full House hands rarely share all 5 cards' suits.",
      "Hoarding Ceres hoping for 'the right moment'; use it on discovery; Flush House is too RNG-reliant without immediate leveling.",
    ],
    comboIdeas: [
      "smeared_joker: reduces effective suit count to 2; Flush House becomes achievable with any same-color Full House.",
      "four_fingers: 4-card Flush House (4-card Full House + flush in 4) expands the hand construction window.",
      "Suit Tarots (Star + Moon): convert your Full House's cards to one suit in 2 Tarot uses; straightforward Flush House setup.",
    ],
  },
  {
    id: "eris",
    name: "Eris",
    hand: "Flush Five",
    chipsPerLevel: 50,
    multPerLevel: 3,
    scalingNotes: "Flush Five requires five of the same rank and suit; the rarest hand. Eris is a secret planet; each use yields 50 chips/level making it the highest chip-gain per-level planet in the game.",
    bestWith: ["smeared_joker", "oops_all_6s", "four_fingers"],
    deepStrategy: [
      "Flush Five = Five of a Kind where all 5 cards share the same suit; the hardest hand in the game to construct.",
      "+50 chips per level is the highest in the game; even 3 Eris uses at Level 4 = 200 chips baseline.",
      "Wild Cards count as all suits AND all ranks; 5 Wild Cards = automatic Flush Five.",
      "oops_all_6s gives six 6-variants per round; combine with suit conversion for Flush Five 6s.",
      "Death Tarot: copy a Wild Card 4 times to fill your hand with 5 Wild Cards for guaranteed Flush Five each hand.",
    ],
    bestTimingNotes: "Eris is extremely rare. Use immediately and build the entire strategy around enabling Flush Five. Every level is game-altering; 5 levels = 350 chips base for a single hand.",
    commonMistakes: [
      "Discarding Eris from a Celestial pack without a plan; even 1 Eris level at low antes is worth taking for future Flush Five builds.",
      "Attempting Flush Five with only rank consolidation; suit homogeneity is equally required; neglecting it wastes Eris levels.",
    ],
    comboIdeas: [
      "oops_all_6s: 6-rank cards available freely; suit-convert them all to one suit with Star/Moon/etc. for Flush Five.",
      "smeared_joker + Wild Cards: smeared halves suit requirements, Wild Cards handle rank and suit gaps simultaneously.",
      "Death Tarot on Wild Card: 5 Wild Cards = Flush Five guaranteed every hand; Eris turns this into a game-winning ceiling.",
    ],
  },
];

