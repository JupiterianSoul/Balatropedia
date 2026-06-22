export type Stake = {
  id: string;
  name: string;
  color: string;
  modifiers: string[];
  watchOut: string;
  difficulty: "low" | "medium" | "high" | "extreme";
  deepStrategy?: string[];
  bestTimingNotes?: string;
  commonMistakes?: string[];
  comboIdeas?: string[];
};

export const STAKES: Stake[] = [
  {
    id: "white_stake",
    name: "White Stake",
    color: "#ffffff",
    modifiers: [
      "Base difficulty; no extra modifiers applied.",
    ],
    watchOut: "No additional modifiers, but scoring requirements still exist. Build your fundamentals here before tackling higher stakes.",
    difficulty: "low",
    deepStrategy: [
      "Use White Stake runs to experiment with unfamiliar decks; there is no mechanical punishment for sub-optimal builds.",
      "Practice reading the shop efficiently; identify which Joker to buy first and which to skip without money pressure.",
      "Learn boss blind patterns here; memorize which blinds (e.g., The Eye, The Mouth) shut down specific hand types.",
      "Experiment with economy strategies (To the Moon, Bull) to learn their break-even points before higher stakes punish mistakes.",
      "Try both Tarot-heavy and Planet-heavy strategies to understand which consumable type your preferred deck amplifies most.",
    ],
    bestTimingNotes: "White Stake is the learning environment. Use every run to test a different synergy archetype rather than repeating the same safe strategy.",
    commonMistakes: [
      "Playing too conservatively and not testing risky high-ceiling combos; White Stake is the time to learn failure modes.",
      "Skipping Small Blinds reflexively without understanding what the tag offers vs. the lost income.",
    ],
    comboIdeas: [
      "Try blueprint + brainstorm copying chains here with no stake pressure to learn the interaction limits.",
      "Test joker_stencil with Black Deck on White Stake to understand empty-slot Xmult math before Black Stake locks bad Jokers.",
    ],
  },
  {
    id: "red_stake",
    name: "Red Stake",
    color: "#fe5f55",
    modifiers: [
      "Small Blind gives no reward money.",
    ],
    watchOut: "Skipping Small Blinds for tags becomes riskier since you now lose potential income either way. Economy Jokers and interest accumulation become even more critical.",
    difficulty: "low",
    deepStrategy: [
      "Skipping Small Blind now costs you the $3-4 reward; only skip for a tag worth more than that (Negative or Rare Joker tags).",
      "Compensate for lost Small Blind income by prioritizing interest Jokers (to_the_moon, golden_joker) even more aggressively.",
      "Economy is tighter in Antes 1-2; avoid overspending on packs and save cash for Jokers that generate passive income.",
      "Bull and bootstraps become more valuable; they scale with held cash and you\\'ll hold more by necessity at Red Stake.",
      "Use the Golden Seal on a key scoring card to generate $3/round from hands played, compensating for the lost blind reward.",
    ],
    bestTimingNotes: "Treat Small Blind income as gone and plan economy around Big Blind and Boss Blind rewards only. Adapt your voucher priority toward Seed Money earlier than usual.",
    commonMistakes: [
      "Skipping Small Blinds purely for habit; at Red Stake the default tag is often not worth the $3-4 income loss.",
      "Ignoring golden_joker or golden_ticket: passive income Jokers compensate for the missing Small Blind money precisely.",
    ],
    comboIdeas: [
      "golden_joker + seed_money voucher: flat $4/round + doubled interest cap covers the Small Blind income loss efficiently.",
      "bull + Red Stake: keeping more cash earns more Chips from bull, partially replacing the income from skipped Small Blinds.",
    ],
  },
  {
    id: "green_stake",
    name: "Green Stake",
    color: "#4bc292",
    modifiers: [
      "Required score scales faster for each Ante.",
    ],
    watchOut: "Score requirements ramp sharply from Ante 5 onward. You must have a scaling Joker engine online by Ante 3 or you will brick on the mid-game boss blinds.",
    difficulty: "medium",
    deepStrategy: [
      "Your Joker engine must be assembled by Ante 3; identify your win condition (scaling type) by Ante 2 and commit.",
      "Prioritize Xmult Jokers over flat +Mult; flat additions fall behind the score curve by Ante 5 without an Xmult foundation.",
      "Buy Planet cards aggressively in Antes 2-4; base hand Chips and Mult from leveling scale proportionally with requirements.",
      "Do not hoard money past $25 at Green Stake; buying a scaling Joker in Ante 3 beats earning $1-2 extra interest.",
      "Boss blind rerolls (directors_cut) become much more valuable; one bad boss can end a run that would have been fine at lower stakes.",
      "The score multiplier roughly doubles between Ante 4 and Ante 8; plan your Joker selling strategy around upgrading, not banking.",
    ],
    bestTimingNotes: "Green Stake\\'s score ramp becomes punishing after Ante 4. If your build isn\\'t snowballing by mid-Ante 3, sell mediocre Jokers and buy anything with Xmult potential.",
    commonMistakes: [
      "Relying solely on flat +Mult Jokers past Ante 4; the score curve requires multiplicative scaling to keep pace.",
      "Spending $10 on a voucher in Ante 3 instead of a scaling Joker; at Green Stake, a good Joker beats a voucher early.",
    ],
    comboIdeas: [
      "constellation + observatory + Green Stake: each Planet card stacks X0.1 and X1.5 Mult; the combo outpaces score scaling through Ante 8.",
      "campfire + sell chains: sell low-tier Jokers each ante to keep campfire\\'s Xmult climbing ahead of score requirements.",
    ],
  },
  {
    id: "black_stake",
    name: "Black Stake",
    color: "#4f6367",
    modifiers: [
      "30% chance for Jokers in shops or booster packs to have an Eternal sticker (cannot be sold or destroyed).",
    ],
    watchOut: "Buying a mediocre Joker with an Eternal sticker locks your slot permanently. Never purchase an Eternal Joker unless it directly fits your build; you cannot recover that slot.",
    difficulty: "medium",
    deepStrategy: [
      "Read the Eternal sticker before every Joker purchase; an Eternal Common Joker in slot 5 can end a run by Ante 6.",
      "Eternal Jokers work best when your build is already defined; do not buy an Eternal Joker in Ante 1 before you know your strategy.",
      "blueprint and brainstorm are excellent Eternal candidates; copying another Joker\\'s ability makes them useful in any build context.",
      "If you have an empty slot and only Eternal Jokers are available, strongly consider passing and waiting for the next shop.",
      "campfire loses value at Black Stake since selling Eternal Jokers is impossible; avoid campfire unless you have non-eternal Jokers to sell.",
      "ceremonial_dagger requires sacrificing a Joker; Eternal blocks this; never pair them unless you have a confirmed non-eternal target.",
    ],
    bestTimingNotes: "In Antes 1-2, reject most Eternal Jokers unless they are Rare or Legendary and directly synergize with your hand type. The earlier you lock a bad Eternal, the fewer recoveries you have.",
    commonMistakes: [
      "Buying an Eternal Common Joker to fill a slot quickly; losing that slot to a mediocre Eternal is worse than an empty slot.",
      "Picking campfire expecting to sell Jokers for Xmult when most good Jokers are Eternal; campfire needs non-eternal sellable Jokers.",
    ],
    comboIdeas: [
      "blueprint (Eternal) + any strong Joker: Eternal blueprint copying your best Joker is always beneficial and never a wasted slot.",
      "Avoid ceremonial_dagger if your best Jokers are Eternal; no sacrifice targets makes dagger unscalable.",
    ],
  },
  {
    id: "blue_stake",
    name: "Blue Stake",
    color: "#4090e0",
    modifiers: [
      "−1 Discard per round (most decks go from 3 to 2; Red Deck goes from 4 to 3).",
    ],
    watchOut: "Discard-fishing strategies become far less reliable. Builds relying on Burnt Joker, Faceless Joker, or heavy discarding must compensate with Wasteful/Recyclomancy vouchers.",
    difficulty: "high",
    deepStrategy: [
      "Treat discards as a premium resource; only discard when you have a clear path to a better hand, not speculatively.",
      "wasteful voucher directly negates the −1 discard penalty; buying it restores your baseline and is often the right Ante 1 choice.",
      "banner rewards unplayed discards; with only 2 discards, saving both gives +2 Mult bonus per unused discard; much easier to maintain.",
      "Builds that don\\'t rely on discarding (held-card Jokers, one-hand strategies) have a significant Blue Stake advantage.",
      "Red Deck\\'s built-in +1 discard specifically counters the Blue Stake penalty, making Red Deck the easiest Blue Stake deck.",
      "Hit_the_road stacks +4 Mult per discarded Jack; with only 2 discards, you must be selective but the bonus per discard is still worth it.",
    ],
    bestTimingNotes: "Reassess every discard-synergy Joker you would normally take; burnt_joker requires discarding every round; with 2 discards available, the opportunity cost is much higher.",
    commonMistakes: [
      "Taking burnt_joker and planning to trigger it every round; 2 discards makes this costly against consistency Jokers.",
      "Not buying wasteful in Ante 1-2 when your build uses discards; the permanent +1 discard is almost always worth $10.",
    ],
    comboIdeas: [
      "banner + Blue Stake: only 2 discards means it\\'s easy to keep both unused for the full +2 Mult bonus each hand.",
      "wasteful + recyclomancy: buy both vouchers to fully counteract Blue Stake and gain a net +1 discard over baseline.",
    ],
  },
  {
    id: "purple_stake",
    name: "Purple Stake",
    color: "#8867a5",
    modifiers: [
      "Required score scales even faster for each Ante (additional multiplier on top of Green Stake scaling).",
    ],
    watchOut: "This is the largest single difficulty spike in the game. Score demands roughly double compared to Green Stake by Ante 8. Your Joker synergy must be fully assembled by Ante 4.",
    difficulty: "high",
    deepStrategy: [
      "At Purple Stake, aim for an infinite or near-infinite scaling combo; linear Jokers cannot keep pace with Ante 8 requirements.",
      "Xmult chains (Glass cards X2, Polychrome X1.5, Idol X2) multiply together; build the chain as early as possible.",
      "Sell and upgrade Jokers aggressively by Ante 5; a Rare Joker that scales beats a Common that doesn\\'t every time.",
      "directors_cut and retcon vouchers are near-mandatory; one wrong boss blind can end a run before you reach your win condition.",
      "Planet card investment must be maximized; higher hand levels provide Chips and Mult that scale absolutely with the requirement curve.",
      "By Ante 6, you should have at least one Xmult source; if not, hard-reset the shop via reroll to find one before continuing.",
    ],
    bestTimingNotes: "Purple Stake is won or lost in Antes 3-5. If by mid-Ante 4 your best hand isn\\'t clearing blinds with multiple hands to spare, buy Xmult Jokers at any cost; you need them before Ante 6.",
    commonMistakes: [
      "Treating Purple Stake like Green Stake with slightly higher scores; the curve is qualitatively different; flat scaling fails.",
      "Not using retcon to dodge catastrophic boss blinds; at Purple Stake, one build-breaking blind can be game over.",
    ],
    comboIdeas: [
      "the_idol + blueprint + Polychrome edition: idol doubles triggered suit, blueprint copies idol; multiplicative chains reach millions.",
      "observatory + constellation + planet_tycoon: layered Planet Xmult from held + gained sources; viable through Ante 8 Purple.",
    ],
  },
  {
    id: "orange_stake",
    name: "Orange Stake",
    color: "#f5a623",
    modifiers: [
      "30% chance for Jokers in shops or booster packs to have a Perishable sticker (Joker becomes debuffed after 5 rounds).",
    ],
    watchOut: "Key Jokers can expire mid-run, gutting a build you've invested in. Prioritize Jokers with immediate or early-game value and plan for replacements as runs approach Ante 6+.",
    difficulty: "high",
    deepStrategy: [
      "Count Perishable timers: a Joker with 5 rounds left bought in Ante 3 expires during Ante 4; plan replacements proactively.",
      "Perishable Jokers in Antes 1-3 can still deliver their value before expiring; don\\'t avoid them entirely, just budget around expiry.",
      "Permanent-effect Jokers (hiker, flash_card, wee_joker that add permanent buffs) retain their accumulated effect even after debuff.",
      "blueprint and brainstorm copying a Perishable Joker extends its effective lifespan by duplicating the effect while it lasts.",
      "Never buy a Perishable Joker as your primary win-condition carrier; if it expires at Ante 6 you need a fallback ready.",
      "The 30% Perishable rate means ~1-2 Perishable Jokers per run on average; budget for one slot that will need cycling.",
    ],
    bestTimingNotes: "Check Perishable timers every shop visit. A Perishable Joker hitting 0 at Ante 7 or 8 is fine if you have other scaling; hitting 0 at Ante 5 with no backup is a run-killer.",
    commonMistakes: [
      "Building your entire strategy around a Perishable Joker without a backup plan; it will expire exactly when you need it most.",
      "Discarding Perishable Jokers immediately without extracting value; they have 5 rounds of useful life; use them efficiently.",
    ],
    comboIdeas: [
      "hiker (Perishable) + Orange Stake: hiker permanently upgrades played cards even after expiring; its debuff doesn\\'t erase the upgrades.",
      "flash_card (Perishable): each use permanently adds Mult to the Joker; Perishable debuff doesn\\'t remove accumulated permanent bonuses.",
    ],
  },
  {
    id: "gold_stake",
    name: "Gold Stake",
    color: "#f0c040",
    modifiers: [
      "30% chance for Jokers in shops or booster packs to have a Rental sticker (costs $3 per round to keep; can be purchased for $1).",
    ],
    watchOut: "Rental Jokers drain economy every round. Early-game rounds with two or three Rental Jokers can bankrupt you before Ante 3. Only buy Rental Jokers when their value clearly exceeds their upkeep cost.",
    difficulty: "extreme",
    deepStrategy: [
      "Calculate Rental ROI before buying: a Rental Joker costing $3/round must generate more than $3 of equivalent value per round.",
      "Rental Jokers that give money (golden_joker, golden_ticket) nearly self-fund; a Rental golden_joker costs $3 but earns $4 = net +$1.",
      "Sell Rental Jokers as soon as their value drops below their upkeep; carrying dead Rentals bankrupts runs by Ante 5.",
      "retcon is near-mandatory at Gold Stake; dodging economy-destroying boss blinds (The Ox) is critical when cash is already tight.",
      "Keep a cash buffer of $12+ at all times; two Rental Jokers draining $6/round plus shop purchases requires room to maneuver.",
      "The $1 purchase-to-own option is often worth it: if a Rental Joker will stay in your build for 2+ more rounds, buying removes the drain.",
    ],
    bestTimingNotes: "Before each blind, tally total Rental costs for the round. If Rental drain exceeds $6/round and your income doesn\\'t cover it, sell the weakest Rental immediately; do not enter the blind broke.",
    commonMistakes: [
      "Keeping two or three Rental Jokers in early Antes; $6-9/round drain before Ante 3 income is established is nearly always fatal.",
      "Forgetting to use the $1 purchase option on a Rental Joker you plan to keep; it pays off within 2 rounds of upkeep savings.",
      "Not selling Rental Jokers when their synergy no longer justifies $3/round; sunk cost fallacy kills more Gold Stake runs than bad plays.",
    ],
    comboIdeas: [
      "golden_joker (Rental) + Gold Stake: $4 income minus $3 rental = net +$1/round; the only Rental that reliably self-funds.",
      "green_deck + Gold Stake: Green Deck\\'s per-hand income provides a non-Rental cash stream to afford Rental upkeep costs.",
      "retcon + Gold Stake: boss blind rerolling is essential to avoid The Ox (reset money to $0) which would instantly end a Rental-heavy run.",
    ],
  },
];

