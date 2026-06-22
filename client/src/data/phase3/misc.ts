export type Enhancement = {
  id: string;
  name: string;
  effect: string;
  deepStrategy?: string[];
  bestTimingNotes?: string;
  commonMistakes?: string[];
  comboIdeas?: string[];
};

export type Edition = {
  id: string;
  name: string;
  effect: string;
  mult?: string;
  deepStrategy?: string[];
  bestTimingNotes?: string;
  commonMistakes?: string[];
  comboIdeas?: string[];
};

export type Seal = {
  id: string;
  name: string;
  effect: string;
  deepStrategy?: string[];
  bestTimingNotes?: string;
  commonMistakes?: string[];
  comboIdeas?: string[];
};

export type Tag = {
  id: string;
  name: string;
  effect: string;
  trigger: string;
  deepStrategy?: string[];
  bestTimingNotes?: string;
  commonMistakes?: string[];
  comboIdeas?: string[];
};

export const ENHANCEMENTS: Enhancement[] = [
  {
    id: "bonus",
    name: "Bonus Card",
    effect: "Gives +30 Chips when this card is scored as part of a played hand.",
    deepStrategy: [
      "Apply to cards that appear in every hand you play; +30 chips per card per hand accumulates quickly.",
      "Multiple Bonus Cards create a chip floor that scales multiplicatively when xmult jokers are active.",
      "Scholar joker gives +20 chips per Ace scored; Bonus-enhanced Aces contribute +50 chips total per Ace.",
      "In large-hand builds (7-8 cards), multiple Bonus Cards can contribute +150-240 chips before any joker fires.",
      "Hierophant Tarot is the main source; pair with walkie_talkie for 10s that contribute +40 chips and +4 mult.",
    ],
    bestTimingNotes: "Bonus Cards are most impactful early-to-mid run as a chip foundation before xmult jokers come online. Late-run they remain useful as multiplied chip sources.",
    commonMistakes: [
      "Applying Bonus to cards that only sometimes score (Flush kickers, extra Pair cards); inconsistent triggers reduce average value.",
      "Undervaluing Bonus late-run; +30 chips per card when multiplied by x10-x20 joker mult = +300-600 effective chips.",
    ],
    comboIdeas: [
      "walkie_talkie: 10s with Bonus = +40 chips and +4 mult per hand; double-resource per card scored.",
      "scholar: Ace Bonus Cards give +50 chips per Ace scored; high-frequency Aces make this the best chip enhancement.",
      "stone_joker + Bonus: stone_joker gives +25 chips per Stone Card; Bonus on other cards provides chip density alongside it.",
    ],
  },
  {
    id: "mult",
    name: "Mult Card",
    effect: "Gives +4 Mult when this card is scored as part of a played hand.",
    deepStrategy: [
      "+4 flat mult per card is additive; multiply 4 Mult Cards in a hand = +16 mult before any joker triggers.",
      "Retrigger effects (Red Seal, sock_and_buskin) double the +4 per retrigger; a retriggered Mult Card gives +8 effective.",
      "Mult Cards are most impactful early run when flat mult is scarce and before xmult jokers dominate.",
      "Empress Tarot applies to 2 cards per use; 3 Empress uses creates 6 Mult Cards for a +24 mult baseline.",
      "Combine with Glass Cards in the same hand: Glass xmult multiplies the accumulated flat mult including from Mult Cards.",
    ],
    bestTimingNotes: "Mult Cards are most effective early-to-mid run. In late-run builds dominated by xmult jokers, their additive +4 becomes proportionally less impactful but still positive.",
    commonMistakes: [
      "Applying Mult to rarely-scored cards; like Bonus, Mult Cards only trigger on scoring, not holding.",
      "Over-stacking Mult Cards without xmult; 10 Mult Cards is only +40 flat mult; xmult is needed to make that meaningful.",
    ],
    comboIdeas: [
      "sock_and_buskin: retriggers face Mult Cards for +8 effective mult per face card per hand.",
      "hanging_chad: first card retrigger; Mult Card in position 1 fires +8 mult (base + retrigger) each hand.",
      "glass_joker: Glass Cards multiply running mult; Mult Cards build the flat mult total that Glass then amplifies.",
    ],
  },
  {
    id: "wild",
    name: "Wild Card",
    effect: "This card counts as every suit simultaneously, enabling Flushes and suit-based Jokers.",
    deepStrategy: [
      "Wild Cards satisfy all 4 suits simultaneously; one Wild in a near-Flush hand can guarantee Flush every draw.",
      "flower_pot requires one card of each suit scored; a single Wild Card satisfies all 4 suit requirements alone.",
      "Wild Cards still have their original rank; they enhance suit flexibility without sacrificing rank contributions.",
      "Be cautious: Wild Cards are still affected by Boss Blinds that negate specific suits (e.g., The Head nixes Hearts).",
      "In Five of a Kind builds, Wild Cards count as any rank too; 4 same-rank cards + Wild = Five of a Kind.",
    ],
    bestTimingNotes: "Wild Cards are most valuable in Flush and suit-specific joker builds. Apply them early so they contribute to suit consistency across the entire run.",
    commonMistakes: [
      "Applying Wild to a Stone Card; Stone Cards have no suit regardless; Wild enhancement is wasted.",
      "Over-relying on Wild Cards when Boss Blinds target suits; Wild doesn't bypass suit-negation Blinds.",
    ],
    comboIdeas: [
      "flower_pot: one Wild Card in the scored hand satisfies all 4-suit requirements; guaranteed flower_pot trigger.",
      "smeared_joker + Wild: Wild counts as all 4, smeared merges pairs; maximum suit synergy with minimal card slots.",
      "Five of a Kind builds: Wild fills the 5th same-rank slot; combine with Death Tarot to duplicate Wilds across the deck.",
    ],
  },
  {
    id: "glass",
    name: "Glass Card",
    effect: "Gives X2 Mult when scored, but has a 1 in 4 chance of being destroyed after scoring.",
    deepStrategy: [
      "x2 mult per Glass Card per hand is multiplicative; 3 Glass Cards in a hand = x8 mult from enhancements alone.",
      "glass_joker scales +0.75x mult per Glass Card in deck; more Glass Cards passively raise the joker's xmult floor.",
      "Use Cryptid Spectral on a Glass Card: 2 additional copies mean glass_joker gains +1.5x extra and you have 3 Glass Cards.",
      "1-in-4 destruction means expect ~3-4 plays before a card breaks; maintain Glass count via Death and Cryptid.",
      "Retriggers (Red Seal, sock_and_buskin) fire the x2 independently per retrigger; a retriggered Glass Card = x4 expected.",
    ],
    bestTimingNotes: "Glass Cards are mid-to-late run upgrades when your hand is stable. Early Glass Cards break before contributing enough cumulative xmult to justify the investment.",
    commonMistakes: [
      "Stacking Glass without replacement plans; cards break at 25% rate; have Death or Cryptid ready to replenish.",
      "Ignoring position: Glass Cards in position 1 with hanging_chad = double x2 = x4 mult per hand effectively.",
    ],
    comboIdeas: [
      "glass_joker: each additional Glass Card in deck raises glass_joker's passive xmult by +0.75x permanently.",
      "sock_and_buskin: retriggers Glass face cards; each retrigger is another independent x2 mult roll.",
      "Cryptid Spectral: duplicate a Glass Card twice; adds 2 glass_joker scaling units + 2 more scoring xmult sources.",
    ],
  },
  {
    id: "steel",
    name: "Steel Card",
    effect: "Gives X1.5 Mult for each scoring hand while this card remains held in hand (unplayed).",
    deepStrategy: [
      "x1.5 per Steel Card HELD (not played); stack 4 Steel Cards in hand for x1.5^4 = x5.06 passive mult.",
      "steel_joker scales +0.2x per Steel Card in deck; Chariot Tarot creates Steel Cards feeding this scalar.",
      "Steel Cards are best on cards you never need to play: Kings (for baron synergy), Aces, or off-suit cards.",
      "baron gives +0.75 mult per King held; a Steel King gives BOTH +0.75 mult and x1.5 mult while held.",
      "mime joker retriggers held-in-hand effects; Steel + mime effectively = x1.5 × x1.5 = x2.25 per Steel Card.",
    ],
    bestTimingNotes: "Steel Cards compound multiplicatively; the more you hold, the greater the scaling. Prioritize creating Steel Cards early so they contribute passive xmult across the full run.",
    commonMistakes: [
      "Playing Steel Cards when you mean to hold them; the x1.5 only fires while the card remains UNPLAYED in hand.",
      "Applying Steel to a card you need for a Flush or Straight; Steel Cards must be held back, reducing hand construction flexibility.",
    ],
    comboIdeas: [
      "baron + Steel on Kings: each Steel King held gives both +0.75 flat mult AND x1.5 xmult simultaneously.",
      "steel_joker: each Steel Card in deck raises steel_joker's xmult scalar; build both simultaneously for compounding returns.",
      "mime: retriggers held-in-hand effects; each Steel Card held effectively becomes x2.25 mult per hand with mime active.",
    ],
  },
  {
    id: "stone",
    name: "Stone Card",
    effect: "Always scores +50 Chips regardless of the hand played; has no rank or suit.",
    deepStrategy: [
      "+50 chips per Stone Card per hand; in a chip-heavy build with many Stone Cards, the chip floor is massive.",
      "stone_joker gives +25 chips per Stone Card in deck; each Tower Tarot use adds +25 chips to stone_joker permanently.",
      "Stone Cards have NO rank or suit; they cannot be used for Flush, Straight, or suit-specific joker triggers.",
      "blue_joker gains +2 chips per remaining card in deck; Stone Cards contribute to deck count while adding +50 chips.",
      "In a hand where not all 5 cards score (e.g., High Card only scores the highest), Stone Cards still contribute +50.",
    ],
    bestTimingNotes: "Stone Cards are best in dedicated chip builds. Apply early so they contribute chip accumulation across the full run.",
    commonMistakes: [
      "Creating Stone Cards in a Flush or suit-joker build; Stone Cards lose their suit, breaking suit requirements.",
      "Forgetting Stone Cards score +50 even in hands where they'd normally be a 'kicker' not scoring; always positive.",
    ],
    comboIdeas: [
      "stone_joker: each Stone Card adds +25 chips to stone_joker's base; Tower Tarot directly feeds this scaling.",
      "blue_joker: scales with deck card count; Stone Cards maintain deck size while maximizing chip density.",
      "square_joker: gains +4 chips per hand played; Stone Cards ensure hands always have chip contributors for square_joker.",
    ],
  },
  {
    id: "gold",
    name: "Gold Card",
    effect: "Earns $3 at the end of the round if this card is held in hand when the blind is beaten.",
    deepStrategy: [
      "Gold Cards earn $3 per round when HELD in hand (not played) at round end; passive economy with zero scoring cost.",
      "Combine with golden_ticket joker: golden_ticket multiplies Gold Card income further for compounding economy.",
      "Multiple Gold Cards = $9-$15+ per round passive income; viable economy engine without discarding economy jokers.",
      "Apply to high-rank cards you intentionally hold back (Kings for baron, Aces for held-Ace builds).",
      "Gold Card income is round-based, not hand-based; it doesn't matter how many hands you play, just beat the blind.",
    ],
    bestTimingNotes: "Apply Gold Cards to bench cards early for maximum rounds of passive income. A Gold Card from Ante 1 earns ~$21+ by Ante 8.",
    commonMistakes: [
      "Applying Gold to a card you consistently play; Gold only earns when the card is HELD at round end.",
      "Confusing Gold Card (held income) with Gold Seal (scoring income); they trigger in completely different ways.",
    ],
    comboIdeas: [
      "golden_ticket + Gold Card: golden_ticket amplifies Gold Card income; multiple held Gold Cards = strong economy.",
      "baron joker: Kings held for baron also earn Gold Card income if Gold-enhanced; double passive benefit.",
      "to_the_moon: Gold Card income feeds purchasing more Planets for to_the_moon's interest scaling.",
    ],
  },
  {
    id: "lucky",
    name: "Lucky Card",
    effect: "1 in 5 chance to give +20 Mult when scored; 1 in 15 chance to win $20 when scored.",
    deepStrategy: [
      "20% chance for +20 mult on scoring; expected value of +4 mult per scoring activation, same as a Mult Card.",
      "Retrigger effects make Lucky Cards shine: each retrigger is an independent 1-in-5 roll; doubled expected value.",
      "eight_ball joker increases chance of getting more Lucky Cards from packs; self-reinforcing synergy.",
      "fortune_teller doesn't directly interact, but Lucky Cards are obtained via Magician Tarot which counts as Tarot usage.",
      "bloodstone gives 1-in-2 chance for x1.5 mult per Heart scored; Lucky Cards on Hearts combine both RNG procs.",
    ],
    bestTimingNotes: "Lucky Cards are excellent early-mid run when variance is acceptable and retrigger jokers exist. Late-run, consistent xmult jokers outperform RNG-based Lucky Cards for final blinds.",
    commonMistakes: [
      "Applying Lucky to cards you rarely score; expected value of +4 mult per activation requires frequent scoring to accumulate.",
      "Overvaluing the $20 trigger: 1-in-15 means it fires rarely; don't build an economy strategy around Lucky Card $20 procs.",
    ],
    comboIdeas: [
      "eight_ball: Lucky Cards increase eight_ball's pack-pull probability; snowballing Lucky Card count over the run.",
      "sock_and_buskin: retriggers face Lucky Cards; each retrigger is a new 1-in-5 roll for +20 mult.",
      "bloodstone on Hearts: a Lucky Heart in a Heart build fires both Lucky and bloodstone independently; RNG storm.",
    ],
  },
];

export const EDITIONS: Edition[] = [
  {
    id: "foil",
    name: "Foil",
    effect: "Gives +50 Chips when the card or Joker triggers.",
    mult: "+50 chips",
    deepStrategy: [
      "+50 flat chips per trigger; on a Joker that triggers every hand, Foil adds a consistent chip floor.",
      "On playing cards, Foil fires each time the card scores; high-frequency Flush/Straight scoring maximizes Foil value.",
      "Foil on a Stone Card: +50 edition chips + +50 Stone enhancement = +100 chips per Stone Card per hand.",
      "Foil is the weakest edition multiplicatively but most reliable; no RNG, no conditions, always fires.",
      "In a chip-scaling build (blue_joker, stone_joker), Foil's flat +50 multiplied by even x10 joker mult = +500 effective.",
    ],
    bestTimingNotes: "Foil is most valuable in chip-centric builds where the +50 gets multiplied. In pure mult builds, Holographic or Polychrome generally provide more relative impact.",
    commonMistakes: [
      "Undervaluing Foil in late-run chip builds; +50 chips × x20 joker mult = +1000 effective chips per trigger.",
      "Applying Foil to cards that rarely trigger; Foil on an unused kicker card contributes nothing.",
    ],
    comboIdeas: [
      "stone_joker: Foil on Stone Cards adds +50 chips on top of Stone's +50 and stone_joker's +25/Stone in deck.",
      "blue_joker scales chips with deck size; Foil on every deck card raises the per-card chip average.",
      "Foil on a scored Joker like walkie_talkie: +50 chips per hand played on top of walkie_talkie's rank-based bonus.",
    ],
  },
  {
    id: "holographic",
    name: "Holographic",
    effect: "Gives +10 Mult when the card or Joker triggers.",
    mult: "+10 mult",
    deepStrategy: [
      "+10 flat mult per trigger; equivalent to 2.5 Mult Card enhancements but on a Joker (which fires every hand).",
      "Holographic Jokers are strongest on jokers that already provide flat mult; the +10 stacks additively with their base.",
      "hologram gains +0.25x mult per card added to hand; a Holographic hologram = both +10 flat mult AND xmult scaling.",
      "On playing cards, Holographic adds +10 mult each time that card scores; retrigger doubles it to +20.",
      "Wheel of Fortune has 1-in-4 chance of adding Holographic, Foil, or Polychrome to a random Joker; target Holo for flat mult builds.",
    ],
    bestTimingNotes: "Holographic is strongest on Jokers that trigger reliably every hand. On playing cards, it's most valuable on frequently-scored, retrigger-eligible cards.",
    commonMistakes: [
      "Confusing Holographic's +10 flat mult with Polychrome's x1.5 mult; Holo is additive, Poly is multiplicative.",
      "Applying Holographic to a held-in-hand Joker like steel_joker or mime; Holo only fires when the Joker triggers.",
    ],
    comboIdeas: [
      "hologram joker: Holographic hologram = +10 flat mult + xmult scaling per hand card added; multiplicative combo.",
      "flash_card: gains +2 mult per shop reroll; Holographic on flash_card = +10 flat mult bonus on an already-scaling joker.",
      "Wheel of Fortune: if Wheel triggers Holographic on your best flat-mult joker, it's a significant mult increase.",
    ],
  },
  {
    id: "polychrome",
    name: "Polychrome",
    effect: "Gives X1.5 Mult (multiplicative) when the card or Joker triggers.",
    mult: "x1.5 mult",
    deepStrategy: [
      "x1.5 multiplicative mult per trigger is the strongest edition type; it multiplies ALL accumulated mult so far.",
      "Position matters: Polychrome Jokers at the END of your joker row multiply the highest accumulated total.",
      "Two Polychrome Jokers: x1.5 × x1.5 = x2.25 mult applied after flat mult jokers; exponential scaling.",
      "Aura Spectral and Wheel of Fortune are the main ways to add Polychrome; Aura targets playing cards, Wheel targets jokers.",
      "Polychrome on a Glass playing card: x2 (Glass) then x1.5 (Polychrome) = x3 mult from one scored card.",
    ],
    bestTimingNotes: "Polychrome is most impactful late-run when accumulated mult is already high. x1.5 on x100 mult = x50 more than x1.5 on x10 mult; delay Polychrome application for maximum impact.",
    commonMistakes: [
      "Placing Polychrome Jokers early in the joker row; they should come last to multiply the largest accumulated total.",
      "Stacking Polychrome effects before building a mult base; x1.5 on x5 mult is only +2.5; build mult first.",
    ],
    comboIdeas: [
      "Glass Card with Polychrome: x2 mult (Glass) followed by x1.5 (Polychrome) = x3 effective mult per card per hand.",
      "Hex Spectral targets a random joker for Polychrome; sell all but best joker first so Hex hits the right target.",
      "blueprint + Polychrome: blueprint copies the joker to its right; Polychrome blueprint applies x1.5 to every copy interaction.",
    ],
  },
  {
    id: "negative",
    name: "Negative",
    effect: "Adds +1 Joker slot permanently when applied to a Joker; adds +1 consumable slot on playing cards.",
    deepStrategy: [
      "Negative on a Joker is the most impactful edition in the game; it expands joker capacity permanently.",
      "A Negative joker effectively pays for its own slot: buying a Negative joker costs money but adds a free slot.",
      "Ectoplasm Spectral adds Negative to a random joker at -1 hand size cost; trade-off requires evaluation.",
      "Negative Tag in the shop converts the first base-edition Joker to Negative for free; highest-EV tag use.",
      "Negative on a playing card adds +1 consumable slot; useful in consumable-heavy builds (cartomancer, fortune_teller).",
    ],
    bestTimingNotes: "Negative Jokers are most valuable early-run when joker slots are the primary bottleneck. Late-run when all slots are full, a Negative Joker unlocks the entire next joker slot permanently.",
    commonMistakes: [
      "Confusing Negative Joker (+1 joker slot) with Negative playing card (+1 consumable slot); they expand different resources.",
      "Using Ectoplasm for Negative without accounting for the -1 hand size penalty; evaluate whether the slot is worth the reduction.",
    ],
    comboIdeas: [
      "Ectoplasm Spectral: first use adds Negative to a random joker at -1 hand size; sell unwanted jokers first for targeting.",
      "Negative Tag: converts first shop joker to Negative + free; best tag for joker-slot-limited builds.",
      "blueprint/brainstorm with Negative: extra joker slot from Negative blueprint enables stacking more copy-chain jokers.",
    ],
  },
];

export const SEALS: Seal[] = [
  {
    id: "red_seal",
    name: "Red Seal",
    effect: "Retriggers this card once, applying all of its scoring effects a second time when played or held.",
    deepStrategy: [
      "Red Seal doubles all scoring effects on that card; enhancements, editions, chip values all fire twice.",
      "A Red-Sealed Glass Card fires x2 mult twice per hand; expected x4 mult from one card (assuming no break).",
      "Red Seal retriggers counting for joker conditions: sock_and_buskin retrigger + Red Seal = 3 total activations.",
      "Apply Red Seal to the card with the most valuable enhancement (Glass, Polychrome, Steel) for maximum return.",
      "Red Seal also retriggers held-in-hand effects: a Red-Sealed Steel Card gives x1.5 × x1.5 = x2.25 while held.",
    ],
    bestTimingNotes: "Red Seal is strongest on your most-enhanced card. Apply via Deja Vu Spectral to the card with Glass, Polychrome, or Lucky enhancement for maximum per-hand value.",
    commonMistakes: [
      "Applying Red Seal to a plain base card; retriggerring base chip/rank values is low value vs applying to an enhanced card.",
      "Forgetting Red Seal retriggers held effects; Steel Cards with Red Seals are passive xmult doublers, not just scoring boosts.",
    ],
    comboIdeas: [
      "Glass + Red Seal: x2 mult fires twice per hand = x4 expected mult; each play amplifies the already-powerful Glass effect.",
      "sock_and_buskin: face cards retrigger once via s&b, once via Red Seal; total 3 activations per face card scored.",
      "Gold Seal + Red Seal on same card: Red Seal retriggers Gold Seal's $3 = $6 per hand from one dual-sealed card.",
    ],
  },
  {
    id: "blue_seal",
    name: "Blue Seal",
    effect: "Creates the Planet card matching the final poker hand played in the round if held in hand at end of round (requires consumable space).",
    deepStrategy: [
      "Blue Seal generates the Planet for your final played hand; keep 1 consumable slot open each round to capture it.",
      "Apply Blue Seal to a card you never play: a Steel Card, Gold Card, or intentionally-benched Ace.",
      "constellation gains +0.1x mult per planet used; Blue Seal passively feeds constellation every round.",
      "Multiple Blue-Sealed held cards = multiple Planet cards per round; stack Trance Spectral on 2-3 bench cards.",
      "astronomer voucher makes all planets free; Blue Seal generated planets cost $0 to use; free hand leveling.",
    ],
    bestTimingNotes: "Apply Blue Seal to a card you consistently hold out of your scoring hand. The passive Planet generation compounds significantly over a long run.",
    commonMistakes: [
      "Applying Blue Seal to a card you always play; the card must be HELD at round end to trigger; playing it voids the planet.",
      "Forgetting to keep consumable slots open; Blue Seal planet generation is silently lost when slots are full.",
    ],
    comboIdeas: [
      "constellation: Blue Seal feeds free planet uses each round; constellation's xmult scales from each planet use.",
      "astronomer: Blue Seal planets are free to use; passive generation + free activation = unlimited hand leveling per round.",
      "satellite joker: gains chips per level of most-played hand; Blue Seal accelerates those levels for free each round.",
    ],
  },
  {
    id: "gold_seal",
    name: "Gold Seal",
    effect: "Earns $3 when this card is played and scored as part of a hand.",
    deepStrategy: [
      "Gold Seal earns $3 per hand the sealed card is played and scored; high-frequency scoring maximizes income.",
      "Unlike Gold Card (held income), Gold Seal requires the card to actively score; put it on a consistently played card.",
      "Red Seal + Gold Seal on the same card: Red Seal retriggers scoring = 2 Gold Seal procs = $6 per hand.",
      "Talisman Spectral applies Gold Seal; use on the card with the most hands-per-run scoring frequency.",
      "Multiple Gold Seals across several cards: 3 Gold-Sealed scored cards = $9/hand; strong passive economy.",
    ],
    bestTimingNotes: "Apply Gold Seal early to maximize total hands of income. A Gold Seal on Ante 1 scoring card can generate $30-60+ over a full run.",
    commonMistakes: [
      "Confusing Gold Seal (scoring income) with Gold Card enhancement (held income); completely different triggers.",
      "Applying Gold Seal to a card that doesn't consistently score in your hand type; inconsistent scoring wastes the seal.",
    ],
    comboIdeas: [
      "Red Seal + Gold Seal: retrigger fires $3 twice per hand = $6 per card per hand; dual seal economy engine.",
      "golden_ticket joker: further multiplies Gold Card/Seal income; combine for maximum per-hand cash generation.",
      "to_the_moon: Gold Seal income funds Planet purchases; to_the_moon converts purchases to interest income.",
    ],
  },
  {
    id: "purple_seal",
    name: "Purple Seal",
    effect: "Creates a Tarot card when this card is discarded (requires consumable space).",
    deepStrategy: [
      "Purple Seal generates a Tarot each time the sealed card is discarded; requires active discarding to trigger.",
      "Apply to your most expendable card: a low-rank kicker you regularly discard to improve your hand composition.",
      "fortune_teller gains permanent mult per Tarot used; Purple Seal passively generates fortune_teller scaling each discard.",
      "Medium Spectral applies Purple Seal; the card chosen should be one you discard at least once per blind.",
      "Multiple Purple Seals + high-discard build: 3-5 Tarots per ante generated passively from discard cycles.",
    ],
    bestTimingNotes: "Apply Purple Seal to a card you reliably discard each round. In high-discard builds (vagabond, fortune_teller), multiple Purple Seals can generate enough Tarots to sustain a full enhancement engine.",
    commonMistakes: [
      "Applying Purple Seal to a card you rarely or never discard; the generation requires active discarding; no discards = no Tarots.",
      "Not having consumable slots open during discards; generated Tarots are lost silently when slots are full.",
    ],
    comboIdeas: [
      "fortune_teller: Purple Seal generates Tarots used to trigger fortune_teller's lifetime counter for permanent mult.",
      "cartomancer joker: generates Tarots on hand plays; Purple Seal adds Tarots on discards; dual-source Tarot flooding.",
      "vagabond joker: generates Tarots at ≤$4; Purple Seal provides additional Tarot throughput for the same low-cash window.",
    ],
  },
];

export const TAGS: Tag[] = [
  {
    id: "uncommon_tag",
    name: "Uncommon Tag",
    effect: "The next shop will contain a free Uncommon Joker as an extra guaranteed slot.",
    trigger: "Activates in the next Shop visit after the blind is skipped.",
    deepStrategy: [
      "Guarantees a free Uncommon Joker in the next shop; strong early-run value when joker slots are tight.",
      "Skip a Small Blind with Uncommon Tag to get a free joker and the blind's reward; double economy.",
    ],
    bestTimingNotes: "Most valuable early-run when any joker is an upgrade. Late-run use is situational if you have an open slot.",
    commonMistakes: [
      "Skipping when your joker bar is full; you can't pick up the free Uncommon if all slots are taken.",
    ],
    comboIdeas: [
      "Pair with Negative Tag in the same run: Negative upgrades the free Uncommon to Negative edition for a free joker slot expansion.",
    ],
  },
  {
    id: "rare_tag",
    name: "Rare Tag",
    effect: "The next shop will contain a free Rare Joker as an extra guaranteed slot.",
    trigger: "Activates in the next Shop visit after the blind is skipped.",
    deepStrategy: [
      "Free Rare Joker; one of the highest-tier tags in the game given Rare jokers' raw power level.",
      "Skip any blind (even Big Blind) for a Rare Tag; the free Rare Joker often outvalues the blind's reward.",
    ],
    bestTimingNotes: "Always take Rare Tag unless you have zero joker slots AND cannot make room. The value floor of a free Rare Joker is extremely high.",
    commonMistakes: [
      "Not making room for the free Rare Joker; sell a low-value joker before visiting the shop if slots are full.",
    ],
    comboIdeas: [
      "showman joker allows duplicate jokers; Rare Tag + showman lets you pick up a Rare you already own for doubled effect.",
    ],
  },
  {
    id: "negative_tag",
    name: "Negative Tag",
    effect: "The next base-edition Joker found in a Shop becomes Negative (+1 Joker slot) and is free.",
    trigger: "Activates when a base-edition Joker is encountered in the next Shop.",
    deepStrategy: [
      "Converts and gives for free the first base-edition joker in the next shop; +1 joker slot at zero cost.",
      "Negative Tag on a cheap/weak Joker is still excellent; you gain the joker slot regardless of the joker's quality.",
    ],
    bestTimingNotes: "One of the most powerful tags; prioritize shops with base-edition jokers (not foil/holo/poly already). The earlier you expand joker slots the more runs you can pivot.",
    commonMistakes: [
      "Skipping Negative Tag late-run when joker slots are full; even late, a new Negative joker slot can fit a key pickup.",
    ],
    comboIdeas: [
      "Combine with Rare Tag: get a free Rare Joker AND a free Negative Joker in consecutive shop visits for two-slot expansion.",
    ],
  },
  {
    id: "foil_tag",
    name: "Foil Tag",
    effect: "The next base-edition Joker found in a Shop becomes Foil (+50 Chips) and is free.",
    trigger: "Activates when a base-edition Joker is encountered in the next Shop.",
    deepStrategy: [
      "Converts first base-edition shop joker to Foil and gives it free; good in chip-scaling builds.",
      "Best when targeting a chip-focused joker (blue_joker, walkie_talkie) where +50 chips/trigger is meaningful.",
    ],
    bestTimingNotes: "Strong mid-run in chip builds; weaker in pure mult builds where Holographic or Polychrome Tags would be better.",
    commonMistakes: [
      "Taking Foil Tag when your build is mult-heavy; +50 chips adds less relative impact than Holographic's +10 mult in high-mult runs.",
    ],
    comboIdeas: [
      "stone_joker build: Foil on stone_joker adds +50 chips per hand on top of its per-Stone bonus.",
    ],
  },
  {
    id: "holographic_tag",
    name: "Holographic Tag",
    effect: "The next base-edition Joker found in a Shop becomes Holographic (+10 Mult) and is free.",
    trigger: "Activates when a base-edition Joker is encountered in the next Shop.",
    deepStrategy: [
      "Converts first base-edition shop joker to Holographic and gives it free; excellent in flat-mult or xmult builds.",
      "Best when applied to a joker that triggers every hand; +10 mult/hand compounds significantly over a run.",
    ],
    bestTimingNotes: "Higher value than Foil Tag in most builds since +10 mult is more widely scaling than +50 chips.",
    commonMistakes: [
      "Applying Holographic Tag when Polychrome Tag is available; x1.5 mult is usually stronger than +10 flat mult late-run.",
    ],
    comboIdeas: [
      "hologram joker: Holographic hologram = +10 flat mult AND hologram's xmult scaling; excellent double-layer synergy.",
    ],
  },
  {
    id: "polychrome_tag",
    name: "Polychrome Tag",
    effect: "The next base-edition Joker found in a Shop becomes Polychrome (X1.5 Mult) and is free.",
    trigger: "Activates when a base-edition Joker is encountered in the next Shop.",
    deepStrategy: [
      "The most powerful edition tag; x1.5 mult per hand on a free joker is potentially run-winning.",
      "Target the most frequently triggering joker in the next shop for Polychrome conversion.",
    ],
    bestTimingNotes: "Always take Polychrome Tag over Foil or Holographic Tags. x1.5 multiplicative mult compounds with every other source; highest expected value of any edition tag.",
    commonMistakes: [
      "Wasting Polychrome Tag on a joker that rarely triggers (situational or conditional jokers); target consistently-active jokers.",
    ],
    comboIdeas: [
      "blueprint + Polychrome Tag: Polychrome blueprint fires x1.5 mult AND copies an adjacent joker every hand.",
    ],
  },
  {
    id: "investment_tag",
    name: "Investment Tag",
    effect: "Gain $25 after defeating the next Boss Blind.",
    trigger: "Activates upon defeating the next Boss Blind.",
    deepStrategy: [
      "$25 delayed payout after Boss Blind; plan purchases around the timing, not the skip.",
      "Best when you're already on track to beat the Boss Blind; the $25 bonus funds the next ante's shopping cycle.",
    ],
    bestTimingNotes: "Take Investment Tag when confident you'll beat the upcoming Boss Blind. The $25 delayed payout is weaker if you might lose before it activates.",
    commonMistakes: [
      "Taking Investment Tag when Economy Tag is available; Economy Tag's immediate $40 doubling is often more impactful.",
    ],
    comboIdeas: [
      "Pair with a Boss Tag skip to reroll to an easier Boss, then beat it for Investment Tag's $25 with lower risk.",
    ],
  },
  {
    id: "voucher_tag",
    name: "Voucher Tag",
    effect: "Adds a random Voucher to the next Shop for free.",
    trigger: "Activates in the next Shop visit; added vouchers do not carry over to later shops.",
    deepStrategy: [
      "Free random Voucher in the next shop; if it's Telescope or Clearance Sale, this is one of the best tags.",
      "Vouchers are always useful regardless of which one appears; any free Voucher is positive economy.",
    ],
    bestTimingNotes: "Take Voucher Tag whenever available early-run; Vouchers provide permanent run-wide upgrades that compound over time.",
    commonMistakes: [
      "Expecting a specific Voucher; the outcome is random; evaluate Voucher Tag by the average expected value, not best-case.",
    ],
    comboIdeas: [
      "Voucher Tag + Economy Tag combo: Voucher Tag funds a permanent upgrade while Economy Tag restores cash; net positive both ways.",
    ],
  },
  {
    id: "boss_tag",
    name: "Boss Tag",
    effect: "Re-rolls the next Boss Blind to a different one.",
    trigger: "Activates immediately before the next Boss Blind is revealed.",
    deepStrategy: [
      "Rerolls the upcoming Boss Blind; use when facing a Boss that specifically counters your build (e.g., The Flint halves base chips).",
      "Cannot choose the new Boss; still random, but removes the specific counter-Boss you're avoiding.",
    ],
    bestTimingNotes: "Most valuable when you know the current Boss Blind hard-counters your strategy. Use Boss Tag proactively when stakes are high (ante 7-8).",
    commonMistakes: [
      "Using Boss Tag on a manageable Boss; save it for run-threatening Boss Blinds (The Needle, The Wall) rather than minor inconveniences.",
    ],
    comboIdeas: [
      "Director's Cut voucher rerolls Boss Blind too; Boss Tag + Director's Cut = two chances to avoid a hard counter.",
    ],
  },
  {
    id: "standard_tag",
    name: "Standard Tag",
    effect: "Immediately opens a free Mega Standard Pack.",
    trigger: "Activates instantly upon earning the tag by skipping a blind.",
    deepStrategy: [
      "Mega Standard Pack (4 cards, pick 1) immediately; excellent for targeted deck manipulation.",
      "Standard Packs can provide enhanced, sealed, or edited playing cards; useful for deck modification mid-run.",
    ],
    bestTimingNotes: "Most useful when you need specific card enhancements or deck-thinning opportunities. Skip Small Blinds for Standard Tag in early-run deck-construction phases.",
    commonMistakes: [
      "Taking Standard Tag when Buffoon or Meteor Tags are available; Joker and Planet packs are generally higher priority.",
    ],
    comboIdeas: [
      "dna joker: opening Standard Tag for specific rank cards lets dna copy them at round start for faster rank consolidation.",
    ],
  },
  {
    id: "charm_tag",
    name: "Charm Tag",
    effect: "Immediately opens a free Mega Arcana Pack.",
    trigger: "Activates instantly upon earning the tag by skipping a blind.",
    deepStrategy: [
      "Mega Arcana Pack (4 Tarots, pick 2) immediately; excellent for deck manipulation or economy Tarots.",
      "Arcana packs contain the most impactful deck-modification tools: Death, Hanged Man, Judgement, suit-converts.",
    ],
    bestTimingNotes: "Take Charm Tag whenever you need deck manipulation or have a fortune_teller scaling strategy active.",
    commonMistakes: [
      "Ignoring Charm Tag when fortune_teller is active; each Tarot used from the pack increases fortune_teller's permanent mult.",
    ],
    comboIdeas: [
      "fortune_teller + Charm Tag: free Arcana pack generates 2 more Tarots used toward fortune_teller's mult scaling.",
    ],
  },
  {
    id: "meteor_tag",
    name: "Meteor Tag",
    effect: "Immediately opens a free Mega Celestial Pack.",
    trigger: "Activates instantly upon earning the tag by skipping a blind.",
    deepStrategy: [
      "Mega Celestial Pack (4 Planets, pick 2) immediately; top-tier tag for any build relying on hand leveling.",
      "2 free planet levels for your primary hand type is substantial mid-run scaling at zero cost.",
    ],
    bestTimingNotes: "Meteor Tag is highest value in planet-scaling builds (constellation, astronomer, satellite) or when Telescope voucher is active.",
    commonMistakes: [
      "Taking Meteor Tag with no hand specialization; random planets are wasted if you don't play a focused hand type.",
    ],
    comboIdeas: [
      "Telescope + Meteor Tag: Telescope guarantees the most-played hand's planet in packs; Meteor Tag opens 2 free levels of it.",
    ],
  },
  {
    id: "buffoon_tag",
    name: "Buffoon Tag",
    effect: "Immediately opens a free Mega Buffoon Pack.",
    trigger: "Activates instantly upon earning the tag by skipping a blind.",
    deepStrategy: [
      "Mega Buffoon Pack (4 Jokers, pick 2) immediately; one of the strongest tags for build acceleration.",
      "Free Joker acquisition midgame is exceptional value; Buffoon Pack joker selection directly shapes your run's direction.",
    ],
    bestTimingNotes: "Buffoon Tag is among the top 3 tags to prioritize; free joker selection is core to any run's power level.",
    commonMistakes: [
      "Not having joker slots ready; ensure at least 1 open slot before the Buffoon pack activates.",
    ],
    comboIdeas: [
      "Negative Tag + Buffoon Tag: get a free Negative Joker AND free Buffoon pack = potentially 3 new jokers from 2 tags.",
    ],
  },
  {
    id: "handy_tag",
    name: "Handy Tag",
    effect: "Gain $1 for each hand played so far this run.",
    trigger: "Activates instantly upon earning the tag; counts all hands played across the entire run.",
    deepStrategy: [
      "$1 per lifetime hand played; early-run use yields $10-20; late-run yield can reach $50+.",
      "Most valuable when skipping blinds late (ante 5-8) after playing many hands; timing is everything.",
    ],
    bestTimingNotes: "Hold Handy Tag for late-run skips when lifetime hands played is maximized. Early skipping for Handy Tag yields poor returns.",
    commonMistakes: [
      "Taking Handy Tag early in a run when few hands have been played; you'll earn $5-10 vs $40+ late-run.",
    ],
    comboIdeas: [
      "Economy Tag comparison: Handy Tag beats Economy Tag when lifetime hands × $1 exceeds 40% of current balance.",
    ],
  },
  {
    id: "garbage_tag",
    name: "Garbage Tag",
    effect: "Gain $1 for each unused discard so far this run.",
    trigger: "Activates instantly upon earning the tag; counts all unused discards across the entire run.",
    deepStrategy: [
      "$1 per total unused discard across the run; in discard-minimizing builds this can pay $30-60+ late-run.",
      "Synergizes with banner (chips per unused discard per hand) and restraint joker strategies where discards are hoarded.",
    ],
    bestTimingNotes: "Value peaks in no-discard or low-discard runs. Evaluate current unused discard count before skipping; late-run timing is critical.",
    commonMistakes: [
      "Taking Garbage Tag in a high-discard build when unused discards are zero; yields nothing.",
    ],
    comboIdeas: [
      "banner joker rewards unused discards per hand; Garbage Tag rewards total unused discards; both incentivize discard conservation.",
    ],
  },
  {
    id: "ethereal_tag",
    name: "Ethereal Tag",
    effect: "Immediately opens a free Spectral Pack.",
    trigger: "Activates instantly upon earning the tag by skipping a blind.",
    deepStrategy: [
      "Free Spectral Pack (2 spectrals, pick 1); access to Cryptid, Black Hole, The Soul, Ankh, Hex without cost.",
      "Spectral Pack contains some of the most run-defining cards in the game; Ethereal Tag has enormous ceiling value.",
    ],
    bestTimingNotes: "Ethereal Tag has the highest upside of any pack tag due to Spectral card power level. Prioritize when you have run-defining setups that spectrals can amplify.",
    commonMistakes: [
      "Taking Ethereal Tag without understanding spectral risk; Wraith, Ankh, Hex, Ouija can hurt badly in wrong contexts.",
    ],
    comboIdeas: [
      "Ethereal Tag + strong solo joker: Ankh or Hex from the spectral pack double/polish that joker; high-power combo.",
    ],
  },
  {
    id: "coupon_tag",
    name: "Coupon Tag",
    effect: "In the next Shop, all initial Jokers, Consumable cards, and Booster Packs are free ($0).",
    trigger: "Activates in the next Shop visit; rerolled items and Vouchers keep their usual costs.",
    deepStrategy: [
      "Entire initial shop inventory (jokers, consumables, packs) at $0; the highest raw economy tag in the game.",
      "Buy everything in the shop on Coupon Tag visit; remaining gold funds rerolls for more free-at-$0 items.",
    ],
    bestTimingNotes: "Coupon Tag is most impactful at expensive ante shops (5-8) where jokers cost $8-12 each. Always skip for Coupon Tag when ante pricing is high.",
    commonMistakes: [
      "Not spending everything available in the Coupon Tag shop; initial stock is $0 but rerolled items cost normal prices.",
    ],
    comboIdeas: [
      "D6 Tag + Coupon Tag in sequence: Coupon Tag empties the shop for free, then D6 Tag gives $0 rerolls for more free items.",
    ],
  },
  {
    id: "double_tag",
    name: "Double Tag",
    effect: "Grants a copy of the next Tag selected (excluding other Double Tags).",
    trigger: "Activates when the next non-Double Tag is collected, duplicating it.",
    deepStrategy: [
      "Doubles the next non-Double Tag collected; pair with the highest-value tag you can find for maximum return.",
      "Two Rare Tags, two Coupon Tags, or two Meteor Tags from one Double Tag is among the best run-accelerating events.",
    ],
    bestTimingNotes: "Hold Double Tag patiently until a Rare, Polychrome, Coupon, or Meteor Tag appears. Never trigger it on a weak tag (Juggle, Garbage) when better tags are imminent.",
    commonMistakes: [
      "Triggering Double Tag on a mediocre tag (Juggle, Handy early-run) because it's available; wait for a premium tag.",
    ],
    comboIdeas: [
      "Double Tag + Rare Tag = two free Rare Jokers in successive shops; potentially the strongest 2-tag combo in the game.",
    ],
  },
  {
    id: "juggle_tag",
    name: "Juggle Tag",
    effect: "Grants +3 Hand Size for the next round only.",
    trigger: "Activates at the start of the next round; effect expires after that round ends.",
    deepStrategy: [
      "+3 hand size for one round; situationally powerful for a boss blind where you need to hit a specific hand type.",
      "Best used before a difficult Boss Blind where your normal hand size barely achieves the required hand.",
    ],
    bestTimingNotes: "Most valuable directly before a hard Boss Blind where extra cards dramatically improve your hand options.",
    commonMistakes: [
      "Wasting Juggle Tag on a Small Blind where extra hand size provides minimal benefit.",
    ],
    comboIdeas: [
      "Juggle Tag before a Four of a Kind or Flush Five blind: extra cards dramatically raise the probability of hitting the target hand.",
    ],
  },
  {
    id: "d6_tag",
    name: "D6 Tag",
    effect: "In the next Shop, Rerolls start at $0 (price increases by $1 per reroll as normal).",
    trigger: "Activates in the next Shop visit; only the starting reroll cost is reset to $0.",
    deepStrategy: [
      "$0 first reroll in the next shop; in a joker-hungry run, free rerolls early expose far more options per gold.",
      "With enough gold, D6 Tag enables 5-10+ rerolls in one shop visit for the cost of $0+1+2+3... = marginal early rerolls.",
    ],
    bestTimingNotes: "Most valuable at high-gold shop visits. $0 starting reroll + $20 gold = 5 rerolls (0+1+2+3+4=$10) at half the normal cost.",
    commonMistakes: [
      "Using D6 Tag at $5-$10; few rerolls are possible; save D6 Tag for shops where you have $20+ to exploit the $0 start.",
    ],
    comboIdeas: [
      "Coupon Tag shop + D6 Tag next shop: buy everything free then reroll cheaply; two consecutive powerful shops.",
    ],
  },
  {
    id: "top_up_tag",
    name: "Top-up Tag",
    effect: "Creates up to 2 Common Jokers immediately, filling any open Joker slots.",
    trigger: "Activates instantly upon earning the tag; only fills empty Joker slots.",
    deepStrategy: [
      "2 free Common Jokers immediately; best early-run when any joker is a scaling improvement.",
      "Common Jokers include consistently useful options (Joker base, Greedy/Crafty/etc.); free is still free.",
    ],
    bestTimingNotes: "Take Top-up Tag early run when joker slots are open. Late-run with a full bar it does nothing.",
    commonMistakes: [
      "Taking Top-up Tag with a full joker bar; always check available slots; the tag is useless with no open slots.",
    ],
    comboIdeas: [
      "showman joker allows duplicates; Top-up Tag can refill with jokers you already own if showman is active.",
    ],
  },
  {
    id: "speed_tag",
    name: "Speed Tag",
    effect: "Gives $5 for each blind skipped so far this run (minimum $5, including the current skip).",
    trigger: "Activates instantly upon earning the tag; counts all blinds skipped across the run.",
    deepStrategy: [
      "$5 × skipped blinds; in skip-heavy runs (4-6 blinds skipped) yields $20-$30 immediately.",
      "Speed Tag rewards consistent skip strategies; combine with other skip-reward tags for compounding income.",
    ],
    bestTimingNotes: "Speed Tag value scales with your skip count. First skip yields $5; 6th skip yields $30. Plan skip-heavy runs around Speed Tag.",
    commonMistakes: [
      "Taking Speed Tag on first skip with 0 prior skips; yields only $5 minimum vs Economy Tag's much higher potential.",
    ],
    comboIdeas: [
      "Garbage Tag in skip-heavy runs: both Garbage and Speed Tag scale with conservative play (skips + held discards).",
    ],
  },
  {
    id: "orbital_tag",
    name: "Orbital Tag",
    effect: "Upgrades a random Poker Hand by 3 levels immediately.",
    trigger: "Activates instantly upon earning the tag; can select a secret hand if previously played.",
    deepStrategy: [
      "+3 levels to a random poker hand; equivalent to 3 free Planet uses, but the hand is random.",
      "If your primary hand gets chosen, Orbital Tag is exceptional; 3 levels in one tag is enormous.",
    ],
    bestTimingNotes: "Orbital Tag is RNG-dependent. In a focused single-hand build, there's a ~1-in-9 chance it hits your primary hand; accept variance and take it anyway for the floor value.",
    commonMistakes: [
      "Expecting Orbital Tag to hit your primary hand; it's random; treat 3 levels to any hand as baseline value.",
    ],
    comboIdeas: [
      "Telescope voucher + Orbital Tag: Telescope ensures future Celestial packs contain your primary hand's planet; Orbital is a bonus level spike.",
    ],
  },
  {
    id: "economy_tag",
    name: "Economy Tag",
    effect: "Doubles your current money, up to a maximum gain of $40.",
    trigger: "Activates instantly upon earning the tag; has no effect if balance is negative.",
    deepStrategy: [
      "Doubles current cash up to $40 gain; at $40 you gain $40 (cap); at $20 you gain $20; strongest at $40+.",
      "Unlike Hermit Tarot (max $20 gain), Economy Tag doubles up to $40; twice the maximum income.",
    ],
    bestTimingNotes: "Maximize Economy Tag by having $40+ in the bank when the tag fires. Skip blinds strategically to accumulate $40 before using Economy Tag.",
    commonMistakes: [
      "Taking Economy Tag while at $5-$10; at $10 you gain only $10; save it until balance is at least $25+ for meaningful returns.",
    ],
    comboIdeas: [
      "Investment Tag in sequence: beat Boss Blind for $25 from Investment Tag, then Economy Tag doubles that plus base savings.",
    ],
  },
];

