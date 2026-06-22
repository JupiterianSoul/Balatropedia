export type Voucher = {
  id: string;
  name: string;
  tier: 1 | 2;
  prerequisite?: string;   // voucher id required for tier-2
  effect: string;
  valueTier: "S" | "A" | "B" | "C";
  notes: string;           // ≤ 200 chars
  deepStrategy?: string[];
  bestTimingNotes?: string;
  commonMistakes?: string[];
  comboIdeas?: string[];
};

export const VOUCHERS: Voucher[] = [
  // --- Overstock pair ---
  {
    id: "overstock",
    name: "Overstock",
    tier: 1,
    effect: "+1 card slot available in the shop (from 2 to 3 slots).",
    valueTier: "A",
    notes: "More shop slots means more Joker and consumable options each ante. Essential for builds that rely on finding specific Jokers early.",
    deepStrategy: [
      "Three shop slots raises average Jokers-per-roll from ~1.43 to ~1.53; over 8 antes this adds roughly one extra Joker appearance.",
      "More slots directly increase the chance of a Spectral or Planet card appearing alongside a Joker; key for Ghost/Nebula decks.",
      "On Zodiac Deck, Overstock is free from the start; upgrade to Overstock Plus immediately as your first voucher purchase.",
      "Buy Overstock before any hand-quality vouchers if you\\'re struggling to find specific Jokers; more options beats one better option.",
    ],
    bestTimingNotes: "Best purchased in Antes 1-2 when every additional shop slot has maximum compounding time over the run. Late purchases still help but return less total value.",
    commonMistakes: [
      "Skipping Overstock for a minor stat voucher; more shop slots consistently delivers more value over a full run.",
      "Not upgrading to Overstock Plus when available; the +1 free restock on purchase alone nearly covers the $10 cost.",
    ],
    comboIdeas: [
      "overstock + ghost_deck: more shop slots = more chances for the rare Spectral cards to appear in each shop visit.",
      "overstock + reroll_glut: cheap rerolls plus more slots per roll makes finding specific Jokers significantly faster.",
    ],
  },
  {
    id: "overstock_plus",
    name: "Overstock Plus",
    tier: 2,
    prerequisite: "overstock",
    effect: "+1 additional card slot in the shop (from 3 to 4 slots); also immediately restocks any empty card slots when purchased.",
    valueTier: "S",
    notes: "Four shop slots massively increases the odds of finding the Jokers you need. The instant restock on purchase gives a bonus item for free.",
    deepStrategy: [
      "Four shop slots yields ~1.64 Jokers per roll; over 8 antes this is roughly two extra Joker appearances vs. base.",
      "The instant restock on purchase is often worth $4-6 of free shop items; try to buy Overstock Plus with empty slots showing.",
      "With 4 slots, the chance of any single shop containing your target Joker or consumable is dramatically higher.",
      "On Zodiac Deck, Overstock Plus should be first upgrade; combined with free Overstock start, this is cheapest S-tier voucher available.",
    ],
    bestTimingNotes: "Buy Overstock Plus in Ante 2-3 to maximize the number of 4-slot shop rolls you see. Buying it in Ante 6+ wastes a majority of the compounding benefit.",
    commonMistakes: [
      "Buying Overstock Plus with all slots full; you miss the free restock value; wait until at least one slot is empty.",
      "Prioritizing other Tier 2 vouchers over this when your build struggles to find key Jokers; more slots fixes that problem directly.",
    ],
    comboIdeas: [
      "overstock_plus + zodiac_deck: Zodiac starts with Overstock free, so Overstock Plus immediately gives 4 shop slots from run start.",
      "overstock_plus + reroll_glut: 4 slots + $1 rerolls = extreme Joker search efficiency, ideal for specific-Joker-dependent builds.",
    ],
  },

  // --- Clearance Sale pair ---
  {
    id: "clearance_sale",
    name: "Clearance Sale",
    tier: 1,
    effect: "All cards and packs in the shop are 25% off.",
    valueTier: "A",
    notes: "Compresses economy hard; every shop visit buys roughly one extra item per four purchases. Pairs well with high-spend strategies.",
    deepStrategy: [
      "25% off saves roughly $2-3 per major purchase; over 8 antes of heavy shopping this adds up to $15-25 in effective savings.",
      "Pairs optimally with reroll_surplus; cheaper cards AND cheaper rerolls means every dollar of economy goes further.",
      "Most impactful on runs that buy many packs; pack discounts are proportionally larger savings than single-card discounts.",
      "On Green Deck, the no-interest rule makes every saved dollar more valuable; buy clearance_sale as a first voucher.",
    ],
    bestTimingNotes: "Buy in Ante 1-2 to maximize total spending it discounts. In mid-to-late run purchases, the savings window is too short for strong ROI.",
    commonMistakes: [
      "Buying Clearance Sale in Ante 5+; you\\'ve already spent most of your run money; savings window is too narrow.",
      "Ignoring that packs are also discounted; plan to buy more Celestial and Arcana packs when this voucher is active.",
    ],
    comboIdeas: [
      "clearance_sale + reroll_surplus: both reduce shop costs; stacked they make aggressive shop cycling very affordable.",
      "clearance_sale + campfire: cheaper packs means more sellable consumables to fuel campfire\\'s Xmult accumulation.",
    ],
  },
  {
    id: "liquidation",
    name: "Liquidation",
    tier: 2,
    prerequisite: "clearance_sale",
    effect: "All cards and packs in the shop are 50% off; also reduces the sell value of your current Jokers.",
    valueTier: "A",
    notes: "Prices are rounded half-down. The Joker sell value penalty is minor compared to halved shop costs. Extremely strong in high-spend runs.",
    deepStrategy: [
      "50% off means a $6 pack costs $3 and an $8 Joker costs $4; in a typical Ante your shop budget effectively doubles.",
      "The sell value reduction is roughly −25% on Jokers; with most Jokers worth $3-4 this penalty is only $1 per Joker sold.",
      "Liquidation enables buying both shop Jokers and packs in the same Ante without going broke; huge flexibility increase.",
      "Combine with reroll_glut for $1 rerolls and 50% off items; you can fish for specific Jokers almost indefinitely with good economy.",
    ],
    bestTimingNotes: "Buy Liquidation as early as Ante 3 if you have clearance_sale already; every subsequent shop visit returns double value. The sell-value penalty is a trivial one-time cost.",
    commonMistakes: [
      "Hesitating over the sell-value penalty; the discount on future purchases vastly outweighs the small reduction in Joker sell values.",
      "Not upgrading from clearance_sale to liquidation when you can afford it; the step up from 25% to 50% is a significant power spike.",
    ],
    comboIdeas: [
      "liquidation + reroll_glut: $1 rerolls + 50% off items = essentially unlimited shop cycling with decent economy.",
      "liquidation + campfire: cheap packs yield more consumables to sell between antes, keeping campfire\\'s Xmult growing fast.",
    ],
  },

  // --- Hone pair ---
  {
    id: "hone",
    name: "Hone",
    tier: 1,
    effect: "Foil, Holographic, and Polychrome cards appear 2× more often.",
    valueTier: "B",
    notes: "Doubles your odds of finding edition Jokers. Most valuable when building around Holographic or Polychrome multipliers.",
    deepStrategy: [
      "Edition Jokers have baseline ~4% chance per shop slot; Hone raises this to ~8%; roughly one edition Joker per 2 antes.",
      "Polychrome Jokers (X1.5 Mult) are the highest-value edition; Hone\\'s 2× doubles their appearance vs. base rate.",
      "Most impactful on builds that rely on stacking multiple edition Jokers for exponential Xmult layering.",
      "Buy Hone before Ante 3 to allow enough shop visits to capitalize on the doubled edition frequency.",
    ],
    bestTimingNotes: "Hone pays dividends over the back half of the run when you have more Joker slots filled and edition upgrades matter most. Buy by Ante 2 for maximum benefit.",
    commonMistakes: [
      "Buying Hone late in the run when there are only 2-3 shops remaining; not enough shops to benefit from doubled edition frequency.",
      "Prioritizing Hone over stronger economy or slot vouchers on non-Xmult builds where editions are secondary.",
    ],
    comboIdeas: [
      "hone + glass_joker: more Holographic Jokers means glass_joker\\'s Xmult from broken Glass cards gets a Holographic bonus too.",
      "hone + ghost_deck: Ghost Deck\\'s starting Hex targets a Joker for Polychrome; Hone makes Polychrome Jokers appear naturally after.",
    ],
  },
  {
    id: "glow_up",
    name: "Glow Up",
    tier: 2,
    prerequisite: "hone",
    effect: "Foil, Holographic, and Polychrome cards appear 4× more often (Polychrome Jokers appear 7× more often).",
    valueTier: "A",
    notes: "Near-guarantees edition Jokers appearing regularly. Polychrome specifically gets a disproportionate boost; a strong pick for Xmult builds.",
    deepStrategy: [
      "Polychrome at 7× base rate means nearly every other shop has at least one Polychrome Joker; build around Xmult freely.",
      "With Glow Up active, consider replacing non-edition Jokers with edition versions as they appear throughout the run.",
      "Foil Jokers (+50 Chips) are less impactful than Polychrome but still useful for Chip-focused strategies on Plasma Deck.",
      "Holographic Jokers (+10 Mult) chain additively; with Glow Up, stacking 3-4 Holographic Jokers adds +30-40 Mult passively.",
    ],
    bestTimingNotes: "Glow Up is best purchased in Ante 3-4 when you have most Joker slots filled and can replace non-edition slots with the now-abundant edition Jokers appearing.",
    commonMistakes: [
      "Buying Glow Up on a non-Xmult build; Polychrome\\'s 7× rate boost is wasted if you\\'re playing a flat +Chips strategy.",
      "Not replacing non-edition Jokers with Polychrome equivalents after buying Glow Up; the voucher\\'s value is in using the editions.",
    ],
    comboIdeas: [
      "glow_up + joker_stencil: stencil copies are also editions; Polychrome stencil gives X1.5 × its copied effect.",
      "glow_up + perkeo: perkeo duplicates consumables; with abundant Polychrome Jokers, duplicate the consumable that targets them.",
    ],
  },

  // --- Reroll Surplus pair ---
  {
    id: "reroll_surplus",
    name: "Reroll Surplus",
    tier: 1,
    effect: "Rerolls cost $2 less.",
    valueTier: "B",
    notes: "Reduces reroll cost from $5 to $3. Enables more aggressive shop fishing when you have economy to spare.",
    deepStrategy: [
      "$3 rerolls let you cycle the shop 2-3 times per ante on a decent economy, tripling Joker exposure per run.",
      "Most impactful in Antes 3-5 when you need specific Jokers and have accumulated enough economy to roll repeatedly.",
      "On Zodiac or Yellow Deck with strong interest economy, $3 rerolls pay for themselves within one or two good finds.",
      "chaos_the_clown gives a free reroll per ante; paired with reroll_surplus that\\'s effectively $3 saved before you even pay.",
    ],
    bestTimingNotes: "Buy in Ante 2-3 when your economy is established enough to afford extra rolls. Buying in Ante 1 wastes it when you don\\'t have spare cash for rolls yet.",
    commonMistakes: [
      "Buying reroll_surplus in Ante 1 before establishing economy; you need $15+ before rerolls are cost-effective.",
      "Rerolling aggressively at $3 each without a clear target Joker in mind; rolling for anything is expensive even at $3.",
    ],
    comboIdeas: [
      "reroll_surplus + chaos_the_clown: one free reroll per round + $3 paid rerolls = aggressive shop cycling for minimal cost.",
      "reroll_surplus + clearance_sale: shop items 25% cheaper AND rerolls 40% cheaper; every dollar of economy goes further.",
    ],
  },
  {
    id: "reroll_glut",
    name: "Reroll Glut",
    tier: 2,
    prerequisite: "reroll_surplus",
    effect: "Rerolls cost an additional $2 less (total $4 reduction, rerolls cost $1).",
    valueTier: "A",
    notes: "$1 rerolls let you cycle the shop repeatedly when flush with cash. Synergizes heavily with Director's Cut for boss blind rerolls too.",
    deepStrategy: [
      "$1 rerolls combined with directors_cut makes boss blind rerolls effectively free; you can pick your boss blind every ante.",
      "With reroll_glut and $20+ economy, you can cycle the shop 15-20 times per ante to find any Joker in the game.",
      "Most powerful on builds with strong passive income (to_the_moon, golden_joker) that can fund constant rolling.",
      "Use $1 rerolls to find consumables too; Planet and Tarot cards in the shop become findable on demand with good economy.",
    ],
    bestTimingNotes: "Reroll Glut is most powerful from Ante 4 onward when you have the income to roll repeatedly. Buying it before your economy is established wastes the potential.",
    commonMistakes: [
      "Buying reroll_glut with poor economy; $1 rerolls are only valuable if you can afford 10+ rolls per ante.",
      "Rolling aimlessly without knowing which Jokers you\\'re looking for; define your target before rolling or you\\'ll drain cash fast.",
    ],
    comboIdeas: [
      "reroll_glut + directors_cut: $1 shop rerolls + $10 boss rerolls = full shop and blind control with moderate economy.",
      "reroll_glut + to_the_moon: interest income funds constant $1 rerolls; by Ante 5 you can roll 15-20 times per ante.",
    ],
  },

  // --- Crystal Ball pair ---
  {
    id: "crystal_ball",
    name: "Crystal Ball",
    tier: 1,
    effect: "+1 consumable slot (default 2 → 3).",
    valueTier: "A",
    notes: "Holding an extra consumable card gives more flexibility to chain Tarot or Planet effects. Essential for consumable-heavy strategies.",
    deepStrategy: [
      "Three consumable slots let you hold a Planet, a Tarot, and a free slot simultaneously; no more forced-use situations.",
      "Magic Deck starts with Crystal Ball free; upgrade to omen_globe immediately for mixed Spectral/Tarot Arcana Packs.",
      "With 3 slots, perkeo can copy one consumable while you still hold two others; enables powerful chain reactions.",
      "observatory requires holding a Planet card; Crystal Ball\\'s 3rd slot means you can hold one Observatory Planet plus two others.",
    ],
    bestTimingNotes: "Buy Crystal Ball in Ante 1-2 on consumable-heavy strategies. Later purchase means fewer rounds to benefit from the extra slot flexibility.",
    commonMistakes: [
      "Buying Crystal Ball on a build that uses very few consumables; the slot is wasted if you rarely hold more than one.",
      "Not upgrading to omen_globe on Ghost Deck or consumable-heavy runs; 20% Spectral chance in Arcana Packs is strong value.",
    ],
    comboIdeas: [
      "crystal_ball + perkeo: hold 3 consumables; perkeo duplicates one while you keep the other two intact.",
      "crystal_ball + observatory: hold a Planet card in the extra slot for its X1.5 Mult bonus while keeping two other consumables.",
    ],
  },
  {
    id: "omen_globe",
    name: "Omen Globe",
    tier: 2,
    prerequisite: "crystal_ball",
    effect: "Spectral cards have a 20% chance to appear in place of each Tarot card in Arcana Packs.",
    valueTier: "A",
    notes: "Transforms Arcana Packs into mixed Tarot/Spectral sources. Dramatically increases Spectral card access without needing Ghost Deck.",
    deepStrategy: [
      "With 3 Tarot cards in an Arcana Pack, omen_globe gives roughly 50% chance of at least one Spectral appearing per pack.",
      "High-value Spectrals like Cryptid and Ouija are otherwise rare; omen_globe makes them accessible on any deck.",
      "Pair with Tarot Merchant for more Arcana Packs available; more packs bought means more omen_globe opportunities.",
      "On Magic Deck with Crystal Ball\\'s free 3rd slot, omen_globe is often the best first Tier 2 upgrade available.",
    ],
    bestTimingNotes: "Buy omen_globe when you have Crystal Ball active and regularly purchase Arcana Packs. Worthless if you never open Arcana Packs.",
    commonMistakes: [
      "Buying omen_globe without buying Arcana Packs regularly; the effect only triggers inside packs, not the main shop.",
      "Expecting Soul or Black Hole from omen_globe; those only appear in Booster Packs, not from omen_globe\\'s conversion.",
    ],
    comboIdeas: [
      "omen_globe + tarot_merchant + cartomancer: every hand generates a Tarot; tarot_merchant floods the shop; omen_globe converts some to Spectrals.",
      "omen_globe + perkeo: when a Spectral appears in a pack, buy it, then perkeo duplicates it for double effect.",
    ],
  },

  // --- Telescope pair ---
  {
    id: "telescope",
    name: "Telescope",
    tier: 1,
    effect: "Celestial Packs always contain the Planet card for your most played poker hand.",
    valueTier: "S",
    notes: "Eliminates Planet pack variance for your primary hand. Guarantees efficient hand level scaling every Celestial Pack you open.",
    deepStrategy: [
      "Commit to one hand type in Ante 1 and never deviate; every Celestial Pack becomes a guaranteed level-up for that hand.",
      "Buy every Celestial Pack you see after acquiring Telescope; guaranteed right Planet means the $4 is almost always correct.",
      "Nebula Deck starts with Telescope free; the first voucher purchase should always be observatory to compound the X1.5 Mult.",
      "With astronomer making Planets free, Telescope + Astronomer = unlimited free guaranteed hand-level scaling.",
    ],
    bestTimingNotes: "Commit your primary hand type before buying Telescope. If you change your main hand after, Telescope\\'s guarantee shifts to the new hand; make the switch deliberately.",
    commonMistakes: [
      "Playing multiple hand types after buying Telescope; the most-played hand changes and Telescope\\'s benefit becomes diluted.",
      "Not buying every Celestial Pack after Telescope is active; even at $4, a guaranteed level-up for your primary hand is correct.",
    ],
    comboIdeas: [
      "telescope + observatory: guaranteed Planet in every Celestial Pack feeds the observatory X1.5 Mult per Planet held.",
      "telescope + astronomer + constellation: free guaranteed Planets + X0.1 Mult per Planet used = rapidly scaling Xmult.",
    ],
  },
  {
    id: "observatory",
    name: "Observatory",
    tier: 2,
    prerequisite: "telescope",
    effect: "Planet cards in your consumable area give ×1.5 Mult for their specified poker hand while held.",
    valueTier: "S",
    notes: "Each Planet card held is a permanent ×1.5 Mult multiplier. Holding two gives ×2.25 total; a cornerstone of Planet-based scaling builds.",
    deepStrategy: [
      "Never use a Planet card from your consumable slot unless forced; each one held is a permanent X1.5 Mult every hand.",
      "With Crystal Ball\\'s 3 slots, hold two Planets for X2.25 Mult baseline; equivalent to a mid-tier Xmult Joker for free.",
      "perkeo duplicates a Planet in your consumable slot; start of round you can hold two copies for X2.25 from one Planet.",
      "On Nebula Deck with −1 consumable slot, observatory is harder to use; prioritize perkeo to extend the single slot\\'s value.",
    ],
    bestTimingNotes: "Buy observatory as soon as Telescope is active and you regularly open Celestial Packs. The X1.5 Mult compounds every hand; earlier is dramatically better.",
    commonMistakes: [
      "Using Planet cards immediately after getting observatory; you\\'re removing X1.5 Mult from your scoring permanently.",
      "Forgetting that observatory only gives X1.5 Mult for the Planet\\'s specified hand; holding Jupiter (Full House) during Flush hands does nothing.",
    ],
    comboIdeas: [
      "observatory + telescope + perkeo: Telescope guarantees the right Planet, perkeo duplicates it for double X1.5 = X2.25 from two copies.",
      "observatory + crystal_ball: hold two different Planet cards for X2.25 baseline Mult while still using your third slot for Tarots.",
    ],
  },

  // --- Grabber pair ---
  {
    id: "grabber",
    name: "Grabber",
    tier: 1,
    effect: "Permanently gain +1 hand per round.",
    valueTier: "S",
    notes: "Permanent hand increases compound with Blue Deck. Pairs with scaling Jokers (Green Joker, Ride the Bus) for an enormous scoring boost.",
    deepStrategy: [
      "Grabber directly negates Black Deck\\'s −1 hand penalty, making it the first voucher to consider on Black Deck runs.",
      "green_joker gains +1 Mult per hand played; +1 permanent hand from Grabber adds ~8 more Mult per run than without it.",
      "Extra hands increase end-of-round income (unused hands = $1 each); on Green Deck, Grabber provides both income and scoring.",
      "On Blue Stake, Grabber combined with the Blue Deck\\'s starting +1 hand gives 6 hands/round; massive scoring window.",
    ],
    bestTimingNotes: "Buy Grabber in Ante 1-2 when hand-scaling Jokers are already in play. Every round after purchase adds an extra scoring hand; earlier means more total benefit.",
    commonMistakes: [
      "Buying Grabber on a build that wins in 1-2 hands regardless; extra hands only matter if you use or benefit from them.",
      "Not combining Grabber with green_joker or supernova; passive hand scalers multiply the value of every extra hand enormously.",
    ],
    comboIdeas: [
      "grabber + nacho_tong: stack both for +2 permanent hands; with green_joker that\\'s +2 Mult per round on top of the scoring.",
      "grabber + black_deck: Grabber restores the lost hand and the 6th Joker slot remains; best of both worlds.",
    ],
  },
  {
    id: "nacho_tong",
    name: "Nacho Tong",
    tier: 2,
    prerequisite: "grabber",
    effect: "Permanently gain an additional +1 hand per round (+2 total from this pair).",
    valueTier: "S",
    notes: "With Grabber, grants +2 permanent hands. Combined with Blue Deck and hand-scaling Jokers, can provide several extra scoring opportunities each round.",
    deepStrategy: [
      "+2 permanent hands means 6 hands/round baseline; combined with Blue Deck you reach 7 hands; extraordinary scoring window.",
      "supernova\\'s Mult = times your primary hand type has been played this round; more hands accelerates this counter dramatically.",
      "The $1 per unused hand stacks multiplicatively with income Jokers; 7 hands with 2-3 unused = $2-3 extra per round from payout.",
      "More hands mean more opportunities for conditional Jokers (loyalty_card, merry_andy) to trigger within a single round.",
    ],
    bestTimingNotes: "Buy Nacho Tong immediately after Grabber whenever possible. The compounding value of +2 permanent hands is strongest with the most remaining antes.",
    commonMistakes: [
      "Buying Nacho Tong late in the run with only 2-3 antes remaining; the cumulative value is too small to justify $10.",
      "Not reassessing which hand type to play after gaining +2 hands; more hands lets you play sub-optimal hand types exploratorily.",
    ],
    comboIdeas: [
      "nacho_tong + grabber + green_joker: 6-hand rounds with green_joker means ~6+ extra Mult per round from the Joker alone.",
      "nacho_tong + blue_deck: 7 hands/round; pair with ride_the_bus to maintain High Card streaks across many hands per round.",
    ],
  },

  // --- Wasteful pair ---
  {
    id: "wasteful",
    name: "Wasteful",
    tier: 1,
    effect: "Permanently gain +1 discard per round.",
    valueTier: "A",
    notes: "Mitigates Blue Stake's −1 Discard penalty. Increases deck-filtering speed and feeds discard-synergy Jokers like Burnt Joker.",
    deepStrategy: [
      "At Blue Stake, Wasteful is often the first voucher to buy; it fully restores the −1 discard penalty imposed by the stake.",
      "banner rewards unplayed discards; +1 permanent discard means one more discard you can hold unplayed for Mult bonus.",
      "burnt_joker gains a bonus ability when any discard occurs; more discards per round means more trigger opportunities.",
      "hit_the_road stacks +4 Mult per discarded Jack; +1 permanent discard = one more potential hit_the_road trigger per round.",
    ],
    bestTimingNotes: "Buy Wasteful in Ante 1-2 at Blue Stake to restore your discard count immediately. On lower stakes, still buy early if your build is discard-reliant.",
    commonMistakes: [
      "Not buying Wasteful at Blue Stake when running a discard build; losing one discard per round permanently cripples discard Jokers.",
      "Buying Wasteful on builds that never use discards; the extra discard has zero value if your strategy doesn\\'t use them.",
    ],
    comboIdeas: [
      "wasteful + recyclomancy: +2 total permanent discards fully counters Blue Stake and enables active discard strategies.",
      "wasteful + burnt_joker + hit_the_road: 4 discards/round means 3-4 burnt_joker triggers and 3-4 hit_the_road Jack checks.",
    ],
  },
  {
    id: "recyclomancy",
    name: "Recyclomancy",
    tier: 2,
    prerequisite: "wasteful",
    effect: "Permanently gain an additional +1 discard per round (+2 total from this pair).",
    valueTier: "A",
    notes: "+2 total discards stacks with deck and stake modifiers. Fully counteracts Blue Stake and enables aggressive discard-looping strategies.",
    deepStrategy: [
      "+2 permanent discards on Red Deck means 6 total discards/round; essentially endless hand-cycling capability.",
      "yorick requires discarding 25+ cards before activating; with +2 permanent discards, yorick activates roughly 2-3 antes earlier.",
      "castle accumulates Chips per suit discarded; 5-6 discards/round with Recyclomancy makes castle scale explosively fast.",
      "Combine with Recyclomancy and hit_the_road for a nearly guaranteed +4 Mult per round from Jack discards alone.",
    ],
    bestTimingNotes: "Buy Recyclomancy in Ante 2-3 when your discard engine is established. Buying it in Ante 5+ limits the compounding benefit of the extra discard count.",
    commonMistakes: [
      "Buying Recyclomancy without any discard-synergy Jokers; extra discards with nothing to trigger them are wasted.",
      "Not tracking that Recyclomancy + Wasteful + Red Deck gives 6 discards/round; plan hand cycling around this volume.",
    ],
    comboIdeas: [
      "recyclomancy + yorick: +2 discards/round cuts yorick\\'s 25-discard unlock threshold by ~2 full antes.",
      "recyclomancy + castle + Red Deck: 6 discards/round with castle accumulating per suit = 6+ Chips per round passively.",
    ],
  },

  // --- Tarot Merchant pair ---
  {
    id: "tarot_merchant",
    name: "Tarot Merchant",
    tier: 1,
    effect: "Tarot cards appear 2× more frequently in the shop.",
    valueTier: "B",
    notes: "Doubles shop Tarot frequency. Core voucher for Fortune Teller and consumable-chaining strategies that rely on many Tarots per run.",
    deepStrategy: [
      "fortune_teller gains +1 Mult per Tarot used lifetime; Tarot Merchant doubles your Tarot exposure, doubling fortune_teller\\'s Mult rate.",
      "On Ghost Deck, Tarot Merchant dilutes shop pool weight and reduces Spectral card frequency; avoid it unless playing Tarot builds.",
      "cartomancer generates a Tarot on each played hand; Tarot Merchant ensures additional Tarots appear in the shop for chaining.",
      "Zodiac Deck starts with Tarot Merchant; upgrade to tarot_tycoon immediately to amplify the effect further.",
    ],
    bestTimingNotes: "Best in Ante 2-3 on Tarot-reliant builds. Don\\'t buy on Ghost Deck unless you want to dilute your Spectral probability intentionally.",
    commonMistakes: [
      "Buying Tarot Merchant on Ghost Deck; it raises total shop weight and reduces the chance of Spectrals appearing.",
      "Buying Tarot Merchant without any Tarot-scaling Jokers; doubled Tarots provide little value without fortune_teller or similar.",
    ],
    comboIdeas: [
      "tarot_merchant + fortune_teller: doubled Tarot frequency means fortune_teller hits its scaling targets 2x faster.",
      "tarot_merchant + omen_globe: more Arcana Packs with Tarots means more omen_globe conversions to Spectral cards.",
    ],
  },
  {
    id: "tarot_tycoon",
    name: "Tarot Tycoon",
    tier: 2,
    prerequisite: "tarot_merchant",
    effect: "Tarot cards appear 4× more frequently in the shop.",
    valueTier: "A",
    notes: "Near-guarantees a Tarot in every shop visit. Amplifies Fortune Teller and any Joker that scales with Tarot usage dramatically.",
    deepStrategy: [
      "4× Tarot frequency means almost every shop roll shows at least one Tarot; use them for deck modification, not just fortune_teller.",
      "With Tarot Tycoon, The World/Sun/Star (suit conversion Tarots) appear regularly; use them to fix deck composition cheaply.",
      "The Empress (enhance 2 cards to Mult) becomes reliable enough to upgrade key scoring cards throughout the run.",
      "On Zodiac Deck with free Tarot Merchant, tarot_tycoon is the first-priority Tier 2 upgrade for Tarot-based builds.",
    ],
    bestTimingNotes: "Buy in Ante 2-3 after establishing a Tarot-scaling Joker. Pure Tarot utility without fortune_teller or equivalent diminishes tarot_tycoon\\'s ROI.",
    commonMistakes: [
      "Buying tarot_tycoon without any Tarot-scaling Joker; 4× Tarots are useful but the real power requires fortune_teller or similar.",
      "Wasting Tarots on minor enhancements; at 4× frequency, save strong Tarots (Judgement, Hermit) and use weak ones for deck work.",
    ],
    comboIdeas: [
      "tarot_tycoon + fortune_teller + zodiac_deck: 4× Tarots from two sources; fortune_teller reaches 20+ Mult mid-run.",
      "tarot_tycoon + cartomancer + hallucination: Tarots generated every hand + 4× shop Tarots + 50% Tarot-to-Planet chance.",
    ],
  },

  // --- Planet Merchant pair ---
  {
    id: "planet_merchant",
    name: "Planet Merchant",
    tier: 1,
    effect: "Planet cards appear 2× more frequently in the shop.",
    valueTier: "B",
    notes: "Doubles shop Planet frequency. Pairs with Telescope/Observatory for consistent hand-level scaling and Astronomer for zero-cost Planets.",
    deepStrategy: [
      "With Telescope active, doubled Planet frequency means doubled guaranteed correct-Planet appearances in Celestial Packs.",
      "constellation gains X0.1 Mult per Planet used; planet_merchant doubles the rate of constellation\\'s scaling.",
      "satellite earns $1 per unique Planet used lifetime; planet_merchant ensures all 12 Planet types appear regularly.",
      "Zodiac Deck starts with planet_merchant; upgrade to planet_tycoon early to maximize Celestial Pack availability.",
    ],
    bestTimingNotes: "Buy planet_merchant in Ante 2 on Planet-scaling builds. On any build with Telescope, doubled Planet frequency pays off from the first Celestial Pack opened.",
    commonMistakes: [
      "Buying planet_merchant without Telescope; without guaranteed correct Planets, doubled frequency helps but doesn\\'t guarantee hand-level efficiency.",
      "Skipping planet_tycoon upgrade when available; 4× Planet frequency is a significant upgrade from 2× on Planet-heavy strategies.",
    ],
    comboIdeas: [
      "planet_merchant + astronomer + telescope: free Planets + doubled frequency + guaranteed correct Planet = unlimited hand-level scaling.",
      "planet_merchant + constellation + satellite: more Planets in shop means more unique types used, scaling both Jokers faster.",
    ],
  },
  {
    id: "planet_tycoon",
    name: "Planet Tycoon",
    tier: 2,
    prerequisite: "planet_merchant",
    effect: "Planet cards appear 4× more frequently in the shop.",
    valueTier: "A",
    notes: "4× Planet frequency means your primary hand levels up rapidly. Combine with Observatory for ×1.5 Mult per Planet held in hand.",
    deepStrategy: [
      "4× Planet frequency with astronomer means most shops contain a free Planet; your primary hand levels up nearly every ante.",
      "With observatory active, more Planets in shop means more opportunities to hold them for X1.5 Mult stacking.",
      "At 4× frequency, all 12 Planet types will appear multiple times per run; satellite maxes out its income bonus reliably.",
      "On Nebula Deck with free Telescope, planet_tycoon is the highest-priority Tier 2 upgrade for consistent Planet scaling.",
    ],
    bestTimingNotes: "Buy planet_tycoon by Ante 3 on Planet-heavy builds. The ROI is proportional to how many antes remain to benefit from 4× Planet frequency.",
    commonMistakes: [
      "Buying planet_tycoon without a Planet-scaling strategy; 4× Planets without constellation, observatory, or satellite provides only modest hand leveling.",
      "Holding Planet cards in consumable slots carelessly; with 4× frequency you can afford to use Planets, but observatory rewards holding them.",
    ],
    comboIdeas: [
      "planet_tycoon + observatory + crystal_ball: hold 2 Planets at once from abundant supply for X2.25 baseline Mult.",
      "planet_tycoon + astronomer + nebula_deck: nearly every shop has a free correct Planet; hand levels fast through Ante 8.",
    ],
  },

  // --- Seed Money pair ---
  {
    id: "seed_money",
    name: "Seed Money",
    tier: 1,
    effect: "Raises the cap on interest earned per round from $5 to $10.",
    valueTier: "A",
    notes: "Doubles max interest income per round. Essential for economy snowball strategies; pairs well with To the Moon and money-scaling Jokers.",
    deepStrategy: [
      "With $50 saved, seed_money raises interest from $5 to $10/round; adds $5 per round, paying for itself in 2 rounds.",
      "to_the_moon raises the interest cap by $1 per $5 held; seed_money raises the effective ceiling for to_the_moon\\'s bonus.",
      "buy seed_money before banking $50; the interest cap raise applies immediately and you\\'ll hit the cap faster.",
      "On Green Deck, seed_money earns $0 because Green Deck generates no interest; never buy it on Green Deck.",
    ],
    bestTimingNotes: "Buy seed_money in Ante 2-3 when you start approaching $25 in savings. Earlier than that and you won\\'t have enough cash to benefit from the higher cap.",
    commonMistakes: [
      "Buying seed_money on Green Deck; Green Deck earns no interest; seed_money does literally nothing on this deck.",
      "Buying seed_money without building savings; $10 interest requires $50 held cash; if you\\'re always broke, the cap is irrelevant.",
    ],
    comboIdeas: [
      "seed_money + to_the_moon + money_tree: three-layer interest scaling; $20/round interest by Ante 5 with good economy.",
      "seed_money + bull: higher cash balance (maintained for interest) means bull\\'s Chip bonus scales simultaneously.",
    ],
  },
  {
    id: "money_tree",
    name: "Money Tree",
    tier: 2,
    prerequisite: "seed_money",
    effect: "Raises the cap on interest earned per round from $10 to $20.",
    valueTier: "S",
    notes: "Up to $20 interest per round is a game-warping economy advantage. Enables high-reroll and buy-everything strategies. Has no effect on Green Deck.",
    deepStrategy: [
      "With $100 saved and to_the_moon, interest can reach $20/round; $160 total income over 8 antes from interest alone.",
      "money_tree + reroll_glut enables rolling every shop 15-20 times per ante; economy becomes essentially unlimited.",
      "Combine with bootstraps and bull; both scale with held cash; higher interest cap means higher cash baseline for both.",
      "On Yellow Deck\\'s $10 head-start, money_tree compounds faster since you reach the $100 cash threshold earlier.",
    ],
    bestTimingNotes: "Buy money_tree in Ante 3-4 after seed_money is established and you consistently hold $50+. Buying too early before economy is established delays the ROI.",
    commonMistakes: [
      "Buying money_tree on Green Deck; no interest is earned regardless; this is a complete waste of $10.",
      "Not saving enough cash to benefit from the $20 cap; money_tree requires $100 held to reach maximum interest.",
    ],
    comboIdeas: [
      "money_tree + to_the_moon + yellow_deck: starting $10 + to_the_moon interest raises + money_tree cap = $20/round by Ante 4.",
      "money_tree + reroll_glut + bootstraps: $20/round income funds constant $1 rerolls while bootstraps scales on the cash reserve.",
    ],
  },

  // --- Blank pair ---
  {
    id: "blank",
    name: "Blank",
    tier: 1,
    effect: "Does nothing.",
    valueTier: "C",
    notes: "Intentionally useless on its own, but buying it 10 times across runs unlocks Antimatter. A long-term unlock investment, not a run benefit.",
    deepStrategy: [
      "Blank\\'s only value is as a path to antimatter; buy it once per run until the 10-purchase unlock threshold is reached.",
      "Never buy Blank if it competes with a useful voucher in the same shop slot; antimatter unlock is a long-term meta goal.",
      "After unlocking antimatter, Blank remains worthless; skip it in every subsequent run without hesitation.",
      "On Gold Stake where economy is tight, never buy Blank; the $10 is too costly for zero run benefit.",
    ],
    bestTimingNotes: "Buy Blank only when you have excess money and no better voucher options available. Prioritize it in early antes on easy stakes where $10 is trivial.",
    commonMistakes: [
      "Buying Blank over any functional voucher; even C-tier vouchers provide more run value than Blank.",
      "Buying Blank repeatedly in the same run; it only counts once per run toward the unlock; multiple purchases are wasted.",
    ],
    comboIdeas: [
      "blank (10 runs) → antimatter unlock: the payoff is +1 Joker slot in future runs; invaluable for Black Deck and any Joker-dense build.",
    ],
  },
  {
    id: "antimatter",
    name: "Antimatter",
    tier: 2,
    prerequisite: "blank",
    effect: "+1 Joker slot.",
    valueTier: "S",
    notes: "One of the most powerful vouchers in the game. An extra permanent Joker slot gives enormous build flexibility. Always displayed as Negative edition.",
    deepStrategy: [
      "+1 Joker slot stacks with Black Deck\\'s built-in +1 slot; 7 total Joker slots enables Joker density no other setup can match.",
      "joker_stencil with antimatter active can reach X7 Xmult if all other slots are empty; the highest possible stencil multiplier.",
      "abstract_joker gains +3 Mult per filled Joker slot; with 7 slots filled that\\'s +21 Mult from one Joker.",
      "On Painted Deck (−1 Joker slot), antimatter perfectly restores 5 slots; best of both worlds: large hand size and full Joker capacity.",
    ],
    bestTimingNotes: "Buy antimatter as early as it appears; +1 Joker slot has maximum value when you have the most remaining antes to fill and use the slot.",
    commonMistakes: [
      "Treating antimatter as a late-game purchase; the slot bonus compounds over antes; buying early and filling the slot quickly maximizes ROI.",
      "Not using the 6th slot immediately after buying antimatter; an empty slot is wasted potential every round.",
    ],
    comboIdeas: [
      "antimatter + black_deck: 7 Joker slots total; stencil gets X7, abstract_joker gets +21 Mult, baseball_card covers more Uncommon slots.",
      "antimatter + painted_deck: painted_deck\\'s −1 slot + antimatter\\'s +1 = full 5 slots with +2 hand size bonus intact.",
    ],
  },

  // --- Magic Trick pair ---
  {
    id: "magic_trick",
    name: "Magic Trick",
    tier: 1,
    effect: "Playing cards can be purchased from the shop.",
    valueTier: "B",
    notes: "Lets you buy specific ranks or suits to fix your deck composition. Invaluable for builds that need a precise card (e.g., Ace-heavy or single-suit Flush decks).",
    deepStrategy: [
      "Use magic_trick to buy Aces for raised_fist or scholar builds; guaranteed Ace procurement fixes early deck inconsistency.",
      "Buy the specific suit you need for Checkered-adjacent builds; if smeared_joker is active, buying Hearts doubles as Diamonds.",
      "On Abandoned Deck, buying a specific low rank (2, 3, 5) to feed fibonacci builds ensures rank clusters your strategy needs.",
      "Cards in shop refresh each ante; if your target card doesn\\'t appear this ante, buy something else and check next ante.",
    ],
    bestTimingNotes: "Buy magic_trick in Ante 2-3 when you know exactly which card types your deck needs. Buying it in Ante 1 before your strategy is defined often yields sub-optimal purchases.",
    commonMistakes: [
      "Buying random shop cards without a plan; magic_trick\\'s value is in targeted deck construction, not bulk card buying.",
      "Forgetting to check the shop for playable cards every ante after buying magic_trick; the cards refresh but must be manually noticed.",
    ],
    comboIdeas: [
      "magic_trick + illusion: buy playing cards with Glass or Steel enhancements for immediate deck improvement.",
      "magic_trick + checkered_deck: buy Spades or Hearts to reinforce the two-suit composition against added-card pollution.",
    ],
  },
  {
    id: "illusion",
    name: "Illusion",
    tier: 2,
    prerequisite: "magic_trick",
    effect: "Playing cards in the shop may have an Enhancement and/or Edition.",
    valueTier: "A",
    notes: "Combine deck-fixing with Glass, Steel, or Foil enhancements. Note: Seals on shop cards are currently bugged. Synergizes well with Glass Joker.",
    deepStrategy: [
      "Glass cards (X2 Mult when scoring) from the shop via illusion are extremely powerful; buy every Glass card you see.",
      "Steel cards give X1.5 Mult while held in hand; buy Steel Aces for raised_fist builds for both Chip and Mult bonuses.",
      "Foil-enhanced shop cards (+50 Chips each) are efficient Chip boosters; useful on Plasma Deck where Chips equal Mult in value.",
      "With illusion active, the shop becomes a source of enhanced cards alongside Jokers; plan shop budget to accommodate both.",
    ],
    bestTimingNotes: "Buy illusion when your deck construction goal is clear. Best in Ante 3-4 when you know your hand type and which enhancements complement it.",
    commonMistakes: [
      "Buying Illusion without a clear enhancement target; buying random enhanced cards without synergy wastes the voucher\\'s potential.",
      "Ignoring Steel cards if baron or mime are active; Steel Aces or Kings held in hand provide Xmult on top of their held-card synergies.",
    ],
    comboIdeas: [
      "illusion + glass_joker: Glass cards from shop each destroyed during the run gives glass_joker +X0.75 per break.",
      "illusion + steel cards + mime: buy Steel Kings from shop; mime retriggers held-card effects including Steel X1.5 Mult.",
    ],
  },

  // --- Hieroglyph pair ---
  {
    id: "hieroglyph",
    name: "Hieroglyph",
    tier: 1,
    effect: "−1 Ante and −1 hand per round.",
    valueTier: "A",
    notes: "Reduces the run from 8 Antes to 7, drastically cutting total score requirements. The lost hand is significant; compensate with high-efficiency hand types.",
    deepStrategy: [
      "Skipping Ante 8 removes the highest-score-requirement blinds from the run; huge relief on Purple+ stakes.",
      "The −1 hand forces you toward high-efficiency hand types like Flush or Straight that win in 2-3 hands consistently.",
      "grabber voucher directly counteracts the −1 hand penalty from hieroglyph; buy grabber after hieroglyph to restore your hand count.",
      "On builds that regularly win in 1-2 hands anyway, hieroglyph\\'s −1 hand penalty is negligible while the ante reduction is enormous.",
    ],
    bestTimingNotes: "Buy hieroglyph in Ante 2-3 after your scoring engine is established. Buying it in Ante 1 before you can handle −1 hand per round risks bricking early blinds.",
    commonMistakes: [
      "Buying hieroglyph with a slow build that needs 4+ hands per blind; losing a hand before your engine is online can end runs.",
      "Not buying grabber after hieroglyph when economy allows; the combination gives a shorter run without the hand penalty.",
    ],
    comboIdeas: [
      "hieroglyph + petroglyph: 6-ante run; requires a near-complete engine by Ante 2 but dramatically reduces total score requirements.",
      "hieroglyph + grabber: ante reduced by 1, hand penalty negated by grabber; shorter run with full hand count.",
    ],
  },
  {
    id: "petroglyph",
    name: "Petroglyph",
    tier: 2,
    prerequisite: "hieroglyph",
    effect: "−1 Ante and −1 discard per round.",
    valueTier: "A",
    notes: "Combined with Hieroglyph, reduces the run to 6 Antes. Losing both a hand and a discard is brutal; only viable with very strong Joker engines already in place.",
    deepStrategy: [
      "6-ante run requires you to be fully scaled by Ante 3; this combo is for players with complete Joker engines early.",
      "The −1 discard from petroglyph stacks on top of Blue Stake\\'s −1 discard; combine only if you have wasteful/recyclomancy active.",
      "On builds that never discard (Green Deck efficiency runs, held-card builds), petroglyph\\'s penalty is virtually zero.",
      "Buy petroglyph only when you have 5+ Jokers and are confidently clearing blinds in 1-2 hands; don\\'t rush this combo.",
    ],
    bestTimingNotes: "Only buy petroglyph in Ante 4+ when you are cleanly winning every blind and want to end the run faster. Buying it too early risks not having enough hands or discards to survive.",
    commonMistakes: [
      "Buying petroglyph before being fully scaled; combining −1 hand and −1 discard with an incomplete engine is run-ending.",
      "Taking petroglyph on a discard-heavy build (yorick, castle) without wasteful to compensate; you need discards to scale those Jokers.",
    ],
    comboIdeas: [
      "hieroglyph + petroglyph + grabber + wasteful: buy all four; net result is 6-ante run with full hand count and normal discards.",
      "petroglyph + green_deck: Green Deck never uses discards for income; −1 discard from petroglyph costs nothing in this context.",
    ],
  },

  // --- Director's Cut pair ---
  {
    id: "directors_cut",
    name: "Director's Cut",
    tier: 1,
    effect: "Reroll the Boss Blind once per Ante for $10.",
    valueTier: "A",
    notes: "A single boss reroll per Ante is often enough to dodge a catastrophic blind. Huge value against blinds that would completely shut down your current build.",
    deepStrategy: [
      "One reroll is usually enough; the worst boss blind pool has 3-4 truly catastrophic options; a single roll often clears them.",
      "Save the $10 for antes where your build has a clear weakness (e.g., The Eye on multi-hand-type builds, The Wall on low-Chip builds).",
      "On Gold Stake, directors_cut is near-essential; boss blinds like The Ox can reset your cash and end a Rental Joker run.",
      "If the rerolled blind is still bad, you\\'ve spent $10 for no benefit; know your build\\'s blind weaknesses before spending.",
    ],
    bestTimingNotes: "Buy directors_cut in Ante 2-3 before the mid-game boss blinds become dangerous. Having it available for Antes 4-6 boss blinds provides the most insurance.",
    commonMistakes: [
      "Rerolling a mild boss blind that you could have beaten; save the $10 for truly threatening bosses.",
      "Not buying directors_cut at Purple Stake or above; high-stake boss blinds with no reroll option can single-handedly end strong runs.",
    ],
    comboIdeas: [
      "directors_cut + retcon: one free reroll upgrades to unlimited boss blind rerolls with $10 each; full blind control.",
      "directors_cut + reroll_glut: boss blind rerolling ($10 each) plus $1 shop rerolls = complete run control on good economy.",
    ],
  },
  {
    id: "retcon",
    name: "Retcon",
    tier: 2,
    prerequisite: "directors_cut",
    effect: "Reroll the Boss Blind unlimited times per Ante for $10 per roll.",
    valueTier: "S",
    notes: "Essentially lets you choose your Boss Blind each Ante if you have the money. Near-mandatory on Gold Stake where boss blinds can brick entire runs.",
    deepStrategy: [
      "With retcon, roll boss blinds until you see The Needle (single hand only) or another blind your build wins cleanly; $20-30 total.",
      "On Gold Stake, retcon prevents The Ox (reset cash to $0) from destroying Rental Joker economy; worth $10-30 every ante.",
      "Combine retcon with strong passive income (to_the_moon, golden_joker) to afford 2-4 boss rerolls per ante comfortably.",
      "Retcon fundamentally changes run planning; you\\'re no longer constrained by boss blinds; build around scoring, not blind avoidance.",
    ],
    bestTimingNotes: "Buy retcon as soon as directors_cut is active and your economy can absorb $20-30 per ante for boss rerolls. Antes 3-4 is the ideal window.",
    commonMistakes: [
      "Not rerolling expensive boss blinds when you can afford to; The Pillar and The Window can end runs; spend the $10.",
      "Rolling blind without a specific target in mind; know which boss blinds your build handles well to stop rolling efficiently.",
    ],
    comboIdeas: [
      "retcon + money_tree + reroll_glut: $20/round interest + $1 shop rerolls + unlimited boss rerolls = total run control.",
      "retcon + gold_stake + any build: eliminating The Ox and The Arm from boss blind pool alone justifies retcon on Gold Stake.",
    ],
  },

  // --- Paint Brush pair ---
  {
    id: "paint_brush",
    name: "Paint Brush",
    tier: 1,
    effect: "+1 hand size.",
    valueTier: "A",
    notes: "Larger hands improve access to complex poker hands (Full House, Straight) and synergize with held-card Jokers. Permanent and deck-wide.",
    deepStrategy: [
      "+1 hand size makes Full House significantly more consistent; in 6 cards, Full House appears roughly 3× more often than in 5.",
      "shoot_the_moon and baron both care about held Queens/Kings; larger hand size means more held face cards per play.",
      "stuntman reduces hand size by 2 but paint_brush partially absorbs the penalty, leaving you at a 5-card hand instead of 4.",
      "On Black Deck with −1 hand per round, paint_brush doesn\\'t restore hands but improves quality of the fewer hands you have.",
    ],
    bestTimingNotes: "Buy paint_brush in Ante 1-2 when hand quality is causing missed scoring opportunities. Earlier investment compounds across more rounds of improved draw quality.",
    commonMistakes: [
      "Skipping paint_brush in favor of minor economy vouchers; permanent hand size improvement typically outvalues small income boosts.",
      "Not reconsidering hand types after buying paint_brush; at 6 cards, Full House and Flush become significantly more consistent.",
    ],
    comboIdeas: [
      "paint_brush + palette: +2 total hand size gives 7 cards; Flush Five becomes reliable without any additional setup.",
      "paint_brush + baron + shoot_the_moon: hold 2-3 face cards in the 6-card hand while playing Flush for passive held-card bonuses.",
    ],
  },
  {
    id: "palette",
    name: "Palette",
    tier: 2,
    prerequisite: "paint_brush",
    effect: "+1 additional hand size (+2 total from this pair).",
    valueTier: "A",
    notes: "Combined with Paint Brush gives a 7-card hand. At 7 cards, Flush Five and Royal Flush become reliably achievable without Four Fingers.",
    deepStrategy: [
      "7-card hand makes Flush Five (5 cards same rank and suit) legitimately achievable without Polychrome special setups.",
      "With palette + painted_deck, you reach a 9-card hand; drawing 9 cards virtually guarantees any 5-card hand type each time.",
      "baron and shoot_the_moon at 7-card hands can hold 4+ face cards while playing a 5-card poker hand; enormous passive Xmult.",
      "At 7 cards, the variance of high-requirement hands (Straight Flush) drops dramatically; you see more options each draw.",
    ],
    bestTimingNotes: "Buy palette in Ante 3-4 after paint_brush is active. At 7 cards, your hand type selection completely opens up; reassess your strategy after purchase.",
    commonMistakes: [
      "Not updating your Joker strategy after reaching 7-card hands; held-card Jokers become disproportionately powerful and should be prioritized.",
      "Ignoring that 7-card Flush hands are now almost automatic with two-suit decks; Checkered Deck + palette = every draw is a Flush.",
    ],
    comboIdeas: [
      "palette + painted_deck + baron + mime: 9-card hand holds 4-5 Kings; mime retriggers baron for each King held multiple times.",
      "palette + four_fingers: 7 cards + 4-card Flush/Straight requirement = even more reliable access to high-scoring hands.",
    ],
  },
];
