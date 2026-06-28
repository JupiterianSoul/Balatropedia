/**
 * SeedGuideTab — general rules + per-seed recipes for Balatro seed strategy.
 *
 * Content is curated for educational/community use. All rules are derived
 * from publicly documented Balatro mechanics (deck/ante/stake structure,
 * shop slot generation, voucher tiers, boss blind effects, joker rarity
 * weights). No source code from the original game is included.
 */

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, BookOpen, Search, Sparkles, Dice5, ExternalLink, Copy, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Section {
  id: string;
  title: string;
  body: (string | { kind: "list"; items: string[] } | { kind: "code"; code: string })[];
}

interface Recipe {
  id: string;
  name: string;
  archetype: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  goal: string;
  ante1Plan: string[];
  ante2Plan: string[];
  midGamePlan: string[];
  endGameGoal: string;
  failureModes: string[];
  exampleSeeds?: { seed: string; deck: string; stake: string; note: string }[];
}

const GENERAL_RULES: Section[] = [
  {
    id: "shop-structure",
    title: "Shop structure & roll economy",
    body: [
      "Every ante's shop has two reroll-able slots by default (three with Overstock, four with Overstock Plus). Each slot independently rolls from the joker / consumable / voucher / pack pool.",
      "Rerolls cost $5 initially. Reroll Surplus (-$2) and Reroll Glut (-$2 stacked) bring this down to $1. The cost reset every ante, so spend rerolls *late* in the ante after you've banked interest.",
      "Banked cash earns interest of $1 per $5 capped at $5 (i.e. holding $25+ gives $5/ante). Spending below $25 to chase a 1-ante reroll is usually a losing trade unless it directly unlocks a scaling engine.",
      { kind: "list", items: [
        "Default shop = 2 joker/consumable slots + 1 voucher slot + 2 booster pack slots.",
        "Booster packs reroll only on shop reroll, never on partial purchase. Skipping packs is fine if they don't fit your build.",
        "The 'shop pool' for jokers is weighted by rarity: ~70% common / ~25% uncommon / ~5% rare. Legendary jokers only spawn from Soul tarots.",
      ] },
    ],
  },
  {
    id: "ante-rhythm",
    title: "Ante-by-ante pacing",
    body: [
      "Antes 1-2: Establish a base. Aim for one scaling joker (Green Joker, Ride the Bus, Constellation, etc.) and one immediate-value joker (Mult-flat, suit/rank payoff). Buy Overstock if you see it; otherwise prefer rerolls to fill these slots.",
      "Antes 3-4: Pivot. By now you know if your scaling engine is online. If yes, double down on retriggers (Hanging Chad, Sock and Buskin, Mime) and copies (Blueprint, Brainstorm). If no, pivot to an economy engine (Credit Card, Cloud 9, Money Tree) and accept a slower curve.",
      "Antes 5-6: Tune. Replace dead-weight commons with rares. Plan voucher purchases around your scaling: Telescope/Observatory for Planet decks, Petroglyph for stake-locked runs, Magic Trick for pivot saves.",
      "Antes 7-8: Survive. Boss blinds get nasty. Have a face-card or held-in-hand backup for The Wheel / The Plant. Stockpile Spectrals (Hex, Trance, Black Hole) for emergency edition copies.",
    ],
  },
  {
    id: "stake-modifiers",
    title: "Stake modifiers & their seed impact",
    body: [
      "Stakes are cumulative — each higher stake inherits all prior stake effects. Plan your seed search around the highest impact modifier.",
      { kind: "list", items: [
        "White: baseline.",
        "Red: small blind no longer give skip tags. Boss blinds reroll less generously.",
        "Green: required score scales 1.5x on big blinds.",
        "Black: eternal jokers appear (cannot be sold or destroyed) — these compound your win condition but can lock you out of pivots.",
        "Blue: -1 discard. Discard-heavy archetypes (Greedy Joker, Madness, deck thinning) suffer.",
        "Purple: required score 2x. Demands a true scaling engine by ante 4.",
        "Orange: booster packs cost +1. Pack-heavy strategies lose tempo.",
        "Gold: -1 hand. Combine with Blue stake's -1 discard and you have 3 hands + 2 discards per blind. Plan accordingly.",
      ] },
      "When seed-searching for high stakes, prioritize: (1) an early Blueprint or Brainstorm spawn in shop ante 1-3, (2) Negative or Polychrome edition on a scaling joker, (3) a Soul tarot in the first or second arcana pack.",
    ],
  },
  {
    id: "boss-blinds",
    title: "Boss blinds: what to expect when",
    body: [
      "Boss blinds appear at fixed antes per run. Some are deck-archetype destroyers; recognizing them early saves runs.",
      { kind: "list", items: [
        "The Wheel — face cards deactivate. Bring at least one non-face payoff (Triboulet exception).",
        "The Plant — face cards score nothing. Same defense as The Wheel — keep a held-in-hand or steel-card backup.",
        "The Pillar — random card debuffed each hand. Marble or Stone joker shrugs this off.",
        "The Needle — only one hand allowed. Maximize per-hand output (Hologram, Photograph, Erosion).",
        "The House — first hand revealed. Plan the first hand to be your highest-mult, not your scaling setup.",
        "The Hook — discards 2 random cards each hand. Eternal hand-size jokers (Stuntman, Hack) reduce the damage.",
        "Verdant Leaf — all cards debuffed until you play a flush. Always have a flush enabler (Smeared, Four Fingers, Shortcut).",
      ] },
    ],
  },
  {
    id: "voucher-priority",
    title: "Voucher priority order",
    body: [
      "Voucher slot rolls once per ante. The voucher tiers are: tier-1 (entry) and tier-2 (requires its tier-1 prerequisite already owned).",
      { kind: "list", items: [
        "Overstock → Overstock Plus: tempo. Worth $20 nearly every run.",
        "Reroll Surplus → Reroll Glut: snowball. Pair with any scaling joker for explosive ante 4-5.",
        "Telescope → Observatory: required for Planet-deck builds.",
        "Hieroglyph → Petroglyph: skip-ante economy. High-skill only — you lose blind score progression.",
        "Magic Trick → Illusion: enhancement insurance for face-card decks.",
        "Crystal Ball → Omen Globe: tarot-engine multiplier. Wasted without a deck full of tarot synergies.",
        "Grabber → Nacho Tong: free hand size, always good unless Gold stake.",
        "Wasteful → Recyclomancy: free discard, mandatory on Blue+ stakes.",
        "Tarot Merchant → Tarot Tycoon: doubles tarot pack frequency. Pairs with Cartomancer.",
        "Planet Merchant → Planet Tycoon: same idea for planet packs.",
      ] },
    ],
  },
  {
    id: "seed-string",
    title: "How to read a Balatro seed",
    body: [
      "Balatro seeds are 8-character base-26 alphanumeric strings (e.g. 'BLAKMETL'). Each character contributes ~4.7 bits of entropy.",
      "A single seed deterministically produces an entire run: every shop roll, pack contents, voucher offering, boss blind sequence, and tag appearance is fixed given (seed, deck, stake).",
      "Changing deck or stake on the same seed produces an entirely different sequence — the seed is xor-ed with deck+stake hashes during RNG init.",
      "When using the in-app Seed Finder, set both deck and stake explicitly before searching; otherwise results are not reproducible.",
    ],
  },
  {
    id: "search-strategy",
    title: "Seed-search strategy",
    body: [
      "Most 'good seeds' from the community are filtered for one specific outcome (e.g. Blueprint ante 1, Negative legendary in pack 1). Don't expect a seed to be good for every archetype.",
      "Search throughput rough numbers: pure-JS finder ~5k-15k seeds/sec; WASM finder ~50k-200k seeds/sec depending on device. Plan search depth around expected hit rate.",
      "Expected hit rates (Blue stake, max ante 4):",
      { kind: "list", items: [
        "Specific common joker in ante 1 shop: ~1 in 30 seeds.",
        "Specific uncommon joker in ante 1-2 shop: ~1 in 80 seeds.",
        "Specific rare joker in ante 1-3 shop: ~1 in 250 seeds.",
        "Any Soul tarot in ante 1-3 packs: ~1 in 25 seeds.",
        "Specific legendary joker from Soul in ante 1-3: ~1 in 130 seeds (5 legendaries, 1-in-5 from soul).",
        "Negative edition on a specific joker: ~1 in 800 seeds (combine ~1 in 30 base × ~1 in 27 negative chance).",
      ] },
      "For combined constraints, multiply the independent rates. 'Blueprint + Brainstorm both in ante 1-3': ~1 in ~25k. Plan ~5-15 minute search at 50k seeds/sec.",
    ],
  },
];

const RECIPES: Recipe[] = [
  {
    id: "blueprint-engine",
    name: "Blueprint XMult stack",
    archetype: "xmult_stack",
    difficulty: "Beginner",
    goal: "Stack Blueprint + Brainstorm around a single high-XMult joker for 3x-multiplied scoring every hand.",
    ante1Plan: [
      "Buy any flat-mult or scaling joker as a placeholder (Jolly Joker, Sly Joker, Ride the Bus).",
      "Don't reroll below $4 — you need interest scaling.",
      "Skip arcana packs unless they contain The Devil or The Tower (rank/enhancement upgrades).",
    ],
    ante2Plan: [
      "Search shop for a real XMult engine: Hologram, Constellation, Lucky Cat, or Glass Joker.",
      "If you see Blueprint, buy immediately even if you don't have a target yet — its position-locked copy lets you reorder later.",
      "Voucher priority: Overstock > Reroll Surplus > anything else.",
    ],
    midGamePlan: [
      "By ante 4 you want: [scaling engine] [Blueprint] [Brainstorm] in that physical joker order.",
      "Brainstorm copies the leftmost joker; Blueprint copies the joker to its right. Position is everything.",
      "Replace placeholder jokers with retriggers (Hanging Chad, Sock and Buskin) to multiply each copied trigger.",
    ],
    endGameGoal: "Ante 8 boss blind solved by 1 hand: scaling engine triggers, both copies fire, retriggers multiply. Common scores: 1e9 - 1e15.",
    failureModes: [
      "Buying Blueprint before having any XMult engine to copy — sells for $1.50, big tempo loss.",
      "Wrong physical position. Drag-rearrange before scoring.",
      "Losing your scaling engine to Eternal-stake Black blinds — keep a Magic Trick / Illusion handy.",
    ],
  },
  {
    id: "constellation-planet",
    name: "Constellation + Telescope",
    archetype: "planet_deck",
    difficulty: "Intermediate",
    goal: "Use Telescope/Observatory to redirect Planet upgrades into one hand type that Constellation then XMults.",
    ante1Plan: [
      "Open with Constellation if it appears in shop. Otherwise buy any planet-pack-friendly placeholder.",
      "Always buy arcana packs if they contain The Magician or The Wheel of Fortune (enhancement insurance for late stake).",
    ],
    ante2Plan: [
      "Buy Telescope voucher. Pick a hand type — usually Pair (most consistent) or Full House (highest base).",
      "Skip Planet packs that don't contain your chosen hand's planet card.",
    ],
    midGamePlan: [
      "By ante 4: Constellation at +2.0 XMult and growing. Stack with Hologram or Smiley Face for additive Mult.",
      "Upgrade to Observatory ASAP — doubles the planet-Mult on every play.",
      "Add Cartomancer to guarantee a tarot per pack open; tarot tags are now a windfall.",
    ],
    endGameGoal: "Ante 8: Constellation at 4.0-6.0 XMult, Pair planet at level 8+, two copies via Blueprint/Brainstorm.",
    failureModes: [
      "Buying Telescope without committing to a hand type — wastes Planet upgrades.",
      "Constellation only triggers on Planet card *use*; just holding the joker doesn't scale it. Open every Planet pack.",
    ],
  },
  {
    id: "economy-snowball",
    name: "Credit Card + Cloud 9 economy",
    archetype: "economy_snowball",
    difficulty: "Intermediate",
    goal: "Build a $100+ bankroll by ante 4, then convert it into +Mult through Money Tree or Bull jokers.",
    ante1Plan: [
      "Buy Cloud 9 if it appears (every 9 in deck = +$1 at end of round).",
      "Buy Credit Card (allow $20 debt). Use it to over-purchase early antes.",
      "Pass on flashy jokers — economy is your scaling.",
    ],
    ante2Plan: [
      "Buy Business Card or Egg if seen.",
      "Voucher: Seed Money ($10 -> $15 max interest cap) > Money Tree later.",
    ],
    midGamePlan: [
      "Ante 4-5: Bull joker (1 Mult per $) and Bootstraps (XMult per $5) should now be in shop pool. Buy both.",
      "Round economy to maximize the $5/round interest cap: keep $25 minimum.",
      "Sell Cloud 9 only if you find a better scaler — usually keep it for the perpetual income.",
    ],
    endGameGoal: "Ante 8: $200+ stockpile + Bull + Bootstraps = ~500 Mult and 3x-5x XMult before any hand-level multipliers.",
    failureModes: [
      "Overspending early in chase rerolls and entering ante 3 with $0.",
      "Not selling Credit Card before ante 8 (the -$20 debt hurts your Bull/Bootstraps multipliers).",
    ],
  },
  {
    id: "discard-glass",
    name: "Madness + Glass deck discard engine",
    archetype: "discard_engine",
    difficulty: "Advanced",
    goal: "Use unused discards to compound Madness (XMult) while a Glass-enhanced deck builds a Glass Joker scaler.",
    ante1Plan: [
      "Open Glass packs / Wraith spectral packs aggressively. Need ~6-8 Glass cards by ante 4.",
      "Madness appears in shop ante 1-3 fairly often; buy on sight.",
    ],
    ante2Plan: [
      "Avoid Blue stake on this archetype (-1 discard cripples Madness).",
      "Buy Wasteful → Recyclomancy as your voucher priority.",
    ],
    midGamePlan: [
      "Each unused discard at end of round increments Madness by 0.5 XMult, permanently.",
      "Glass Joker gains 0.75 XMult per Glass card destroyed — so play hands that *use* Glass cards.",
      "Stuntman adds +300 chips and -2 hand size — only buy if you've thinned the deck below 40 cards.",
    ],
    endGameGoal: "Madness at 8.0+ XMult, Glass Joker at 6.0+ XMult, plus a Hanging Chad retrigger = explosive scoring.",
    failureModes: [
      "Playing too many discards in early antes — each one missed never comes back.",
      "Forgetting that Madness ticks at end of round, not end of hand. Plan to leave 1-2 discards unused per blind.",
    ],
  },
  {
    id: "soul-rush",
    name: "Soul rush legendary",
    archetype: "legendary_chase",
    difficulty: "Advanced",
    goal: "Open every spectral pack to fish for The Soul tarot, then convert it into a specific legendary (Perkeo, Triboulet, Yorick, Chicot, Canio).",
    ante1Plan: [
      "Save $8+ for the first spectral pack appearance.",
      "Buy Cartomancer if seen — guarantees a tarot per pack open, doesn't directly help Soul rate but compounds for later.",
    ],
    ante2Plan: [
      "Open every Arcana and Spectral pack. The Soul has ~1/300 base rate but each pack rolls 2-5 cards independently.",
      "If you find The Soul, hold it (or play immediately if Showman is in your deck) — the legendary spawn is randomized from the 5 base pool.",
    ],
    midGamePlan: [
      "If you got Perkeo: every consumable becomes Negative on round end. Stockpile Spectrals.",
      "If Triboulet: Kings and Queens become x1.5 Mult. Pivot to face-card deck.",
      "If Yorick: scaling per discarded card. Discard-engine build (see Madness recipe).",
      "If Chicot: bosses disabled. Hardest stakes become manageable.",
      "If Canio: scaling on face-card destruction. Pair with Glass + Hanging Chad.",
    ],
    endGameGoal: "Legendary as your core scaling engine. Blueprint+Brainstorm position-stacked behind it.",
    failureModes: [
      "Buying jokers instead of packs in ante 1-2 — Soul rate drops to near-zero if you only open 2 packs total.",
      "Triboulet on a non-face deck = wasted slot. Read the legendary before committing.",
    ],
  },
];

function CollapsibleSection({ section }: { section: Section }) {
  const [open, setOpen] = useState(true);
  return (
    <section className="rounded-lg border border-border bg-card/50">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left font-semibold text-sm hover:bg-card/70 rounded-t-lg"
      >
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        {section.title}
      </button>
      {open && (
        <div className="px-4 py-3 space-y-2 text-sm leading-relaxed border-t border-border/60">
          {section.body.map((block, i) => {
            if (typeof block === "string") return <p key={i} className="text-foreground/90">{block}</p>;
            if (block.kind === "list") {
              return (
                <ul key={i} className="list-disc list-outside ml-5 space-y-1 text-foreground/85">
                  {block.items.map((it, j) => <li key={j}>{it}</li>)}
                </ul>
              );
            }
            return (
              <pre key={i} className="text-xs bg-background/60 border border-border rounded p-2 overflow-x-auto">
                <code>{block.code}</code>
              </pre>
            );
          })}
        </div>
      )}
    </section>
  );
}

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  function copySeed(seed: string) {
    navigator.clipboard?.writeText(seed).then(() => {
      setCopied(seed);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  const diffColor = {
    Beginner: "hsl(145 50% 45%)",
    Intermediate: "hsl(45 75% 50%)",
    Advanced: "hsl(0 65% 50%)",
  }[recipe.difficulty];

  return (
    <div className="rounded-lg border border-border bg-card/50">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start gap-2 px-3 py-2.5 text-left hover:bg-card/70 rounded-t-lg"
      >
        {open ? <ChevronDown className="h-4 w-4 mt-0.5 shrink-0" /> : <ChevronRight className="h-4 w-4 mt-0.5 shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="font-semibold text-sm">{recipe.name}</div>
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide"
              style={{ background: `${diffColor}22`, color: diffColor }}
            >
              {recipe.difficulty}
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">{recipe.goal}</div>
        </div>
      </button>
      {open && (
        <div className="px-4 py-3 space-y-3 text-sm border-t border-border/60">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-accent mb-1">Ante 1</div>
            <ul className="list-disc list-outside ml-5 space-y-1 text-foreground/85">
              {recipe.ante1Plan.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-accent mb-1">Ante 2</div>
            <ul className="list-disc list-outside ml-5 space-y-1 text-foreground/85">
              {recipe.ante2Plan.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-accent mb-1">Mid-game (antes 3-6)</div>
            <ul className="list-disc list-outside ml-5 space-y-1 text-foreground/85">
              {recipe.midGamePlan.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-accent mb-1">End-game goal</div>
            <p className="text-foreground/85">{recipe.endGameGoal}</p>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-[hsl(0_65%_60%)] mb-1">Common failure modes</div>
            <ul className="list-disc list-outside ml-5 space-y-1 text-foreground/85">
              {recipe.failureModes.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
          {recipe.exampleSeeds && recipe.exampleSeeds.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wide text-accent mb-1">Example seeds</div>
              <div className="space-y-1">
                {recipe.exampleSeeds.map((s) => (
                  <div key={s.seed} className="flex items-center gap-2 text-xs bg-background/60 border border-border rounded px-2 py-1">
                    <code className="font-mono font-bold">{s.seed}</code>
                    <span className="text-muted-foreground">{s.deck} · {s.stake}</span>
                    <span className="flex-1 truncate">{s.note}</span>
                    <Button size="sm" variant="ghost" className="h-6 px-1.5" onClick={() => copySeed(s.seed)}>
                      {copied === s.seed ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function SeedGuideTab() {
  const [view, setView] = useState<"rules" | "recipes">("rules");
  const [search, setSearch] = useState("");

  const filteredRules = useMemo(() => {
    const t = search.trim().toLowerCase();
    if (!t) return GENERAL_RULES;
    return GENERAL_RULES.filter((s) => {
      if (s.title.toLowerCase().includes(t)) return true;
      return s.body.some((b) => {
        if (typeof b === "string") return b.toLowerCase().includes(t);
        if (b.kind === "list") return b.items.some((i) => i.toLowerCase().includes(t));
        return false;
      });
    });
  }, [search]);

  const filteredRecipes = useMemo(() => {
    const t = search.trim().toLowerCase();
    if (!t) return RECIPES;
    return RECIPES.filter((r) => {
      const haystack = [r.name, r.goal, r.archetype, r.endGameGoal, ...r.ante1Plan, ...r.ante2Plan, ...r.midGamePlan, ...r.failureModes]
        .join(" ")
        .toLowerCase();
      return haystack.includes(t);
    });
  }, [search]);

  return (
    <div className="p-3 sm:p-4 space-y-3" data-testid="seed-guide">
      <div className="flex flex-wrap items-center gap-2">
        <BookOpen className="h-4 w-4 text-accent" />
        <h2 className="text-base font-semibold">Seed Guide</h2>
        <div className="flex-1" />
        <div className="inline-flex rounded-md border border-border bg-card/50 p-0.5">
          <button
            onClick={() => setView("rules")}
            className={`px-3 py-1 text-xs font-medium rounded ${view === "rules" ? "bg-accent text-accent-foreground" : ""}`}
            data-testid="tab-rules"
          >
            <Sparkles className="h-3 w-3 inline mr-1" /> General rules
          </button>
          <button
            onClick={() => setView("recipes")}
            className={`px-3 py-1 text-xs font-medium rounded ${view === "recipes" ? "bg-accent text-accent-foreground" : ""}`}
            data-testid="tab-recipes"
          >
            <Dice5 className="h-3 w-3 inline mr-1" /> Per-seed recipes
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={view === "rules" ? "Search rules…" : "Search recipes (e.g. Blueprint, economy, Madness)…"}
          className="pl-7 h-9"
        />
      </div>

      {view === "rules" ? (
        <div className="space-y-2">
          {filteredRules.length === 0 ? (
            <div className="text-sm text-muted-foreground p-6 text-center">No rules match this search.</div>
          ) : (
            filteredRules.map((s) => <CollapsibleSection key={s.id} section={s} />)
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredRecipes.length === 0 ? (
            <div className="text-sm text-muted-foreground p-6 text-center">No recipes match this search.</div>
          ) : (
            filteredRecipes.map((r) => <RecipeCard key={r.id} recipe={r} />)
          )}
          <div className="rounded-lg border border-dashed border-border bg-card/30 p-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 mb-1">
              <ExternalLink className="h-3 w-3" />
              <span className="font-semibold">Tip</span>
            </div>
            Use the Seed Finder tab to search seeds that match a recipe's prerequisites. For Blueprint XMult stack, search for "Blueprint in ante 1-3 shop"; for Soul rush, search for "any Soul tarot in ante 1-3 packs".
          </div>
        </div>
      )}
    </div>
  );
}
