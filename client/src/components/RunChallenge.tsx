import { useMemo, useState } from "react";
import { Dices, RefreshCw, Target, Swords, Shield, Lightbulb, Skull } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ARCHETYPES, COMBOS, JOKER_MAP, ARCHETYPE_LABELS, type Archetype,
} from "@/lib/helpers";
import { DECKS } from "@/data/phase3/decks";
import { STAKES } from "@/data/phase3/stakes";
import { JokerSprite } from "@/components/JokerSprite";
import { useApp } from "@/lib/appContext";
import { useT, useLabels, useI18n, useGameText } from "@/lib/i18n";
import { FormattedBalatroText } from "@/lib/balatroText";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------------ *
 * Run Challenge generator
 *
 * Goal: feel like a *mission briefing* a player can actually try.
 * - Named build with a flavor adjective (e.g. "Hot-Pursuit Flush Five")
 * - Concrete win condition (Ante target + hand target)
 * - Prioritized joker pool (must-have / fill-in)
 * - Run modifiers (Deck + Stake) with explicit difficulty estimate
 * - 2-3 razor-sharp tactical tips, plus one explicit "watch-out"
 *
 * Determinism: a seed drives mulberry32 so the same number always rebuilds
 * the same brief (Reroll picks a fresh seed).
 * ------------------------------------------------------------------------ */

interface Challenge {
  name: string;
  archetypeId: string;
  comboId: string | null;
  mustHave: string[]; // up to 3 core jokers
  fillIn: string[]; // up to 3 secondary
  deckId: string;
  stakeId: string;
  goal: string; // win condition narrative
  consumableHint: string;
  tips: string[]; // 2-3 lines
  watchOut: string;
  difficulty: "Easy" | "Medium" | "Hard" | "Brutal";
}

// Flavor prefixes - applied to the archetype label to form a build name
const FLAVORS = [
  "Hot-Pursuit", "Cold-Steel", "Razor-Edge", "Iron-Cradle", "Bone-Deep",
  "Pocket-Aces", "Ghost-Hand", "Lucky-Seven", "Crimson", "Velvet",
  "Quicksilver", "Slow-Burn", "Bare-Knuckle", "Glass-Cannon", "Tightrope",
  "Last-Call", "Stone-Cold", "Wildcard", "Knife-Fight", "Bankroll",
];

// Per-archetype goal narratives - explicit win condition the player can chase
const GOALS: Record<string, string> = {
  flush: "Beat Ante 8 by scoring at least one $200+ Flush.",
  flush_five: "Land a single Flush Five worth $1500+ before Ante 8.",
  high_card: "Win Ante 8 playing nothing but High Card hands.",
  pair_focused: "Beat Ante 8 with Pair as your most-played hand.",
  three_of_a_kind: "Survive to Ante 8 using Three of a Kind as your scorer.",
  four_of_a_kind: "Score a Four of a Kind worth $500+ before Ante 7.",
  straight: "Beat Ante 8 with Straight as your primary scoring hand.",
  full_house: "Beat Ante 8 keeping Full House at >50% of plays.",
  flush_house: "Land a Flush House for $1000+ in Ante 6 or later.",
  five_of_a_kind: "Score a Five of a Kind worth $800+ before Ante 8.",
  straight_flush: "Land a single Straight Flush worth $2000+ before Ante 8.",
  bloodstone_lucky: "Reach Ante 8 with Bloodstone scaling X3 Mult or higher.",
  canio_destruction: "Reach Ante 7 with Canio at +30 Mult or higher.",
  low_card_count: "Beat Ante 8 with a deck of 25 cards or fewer.",
  no_discard: "Win Ante 8 without using a single discard the whole run.",
  tarot_engine: "Beat Ante 7 having used 30+ Tarot cards in the run.",
  two_pair_scaling: "Reach Ante 8 with Two Pair as your top scorer.",
  vampire_enhancement: "Beat Ante 7 with Vampire reaching X4 Mult or higher.",
  rank_focused: "Win Ante 8 with one rank making up 40%+ of your deck.",
  suit_focused: "Win Ante 8 with one suit making up 60%+ of your deck.",
  scaling_engine: "Reach Ante 8 with a single Joker breaking X10 Mult.",
  combo_engine: "Beat Ante 8 chaining at least 3 Jokers in your scoring loop.",
  economy: "Reach Ante 8 with $200+ cash on hand at any blind.",
};
const GOAL_FALLBACK = "Beat Ante 8 with this build's signature hand as your scorer.";

// Consumable strategy hints per archetype
const CONSUMABLES: Record<string, string> = {
  flush: "Hierophant for pair fills, The World to unify suits, Tower for filler bricks.",
  flush_five: "Smeared is mandatory. Cryptid + 2x Strength makes Flush Fives trivial.",
  high_card: "Devil for Gold cards, Hermit when economy slips, Vagabond as a panic button.",
  pair_focused: "Strength bumps duplicate ranks; Empress for +2 Mult on pair plays.",
  three_of_a_kind: "Hierophant on duplicates; Lovers turns one card into a 2-Pair branch.",
  four_of_a_kind: "Justice on your scaling Joker; Wheel of Fortune at full coverage.",
  straight: "Magician for Lucky cards (Bloodstone fuel); The World to swap suits in.",
  full_house: "Empress on each pair; Justice on Vampire/Constellation if you ran one.",
  flush_house: "Tower bricks + Smeared = guaranteed Flush House from Full-House line.",
  five_of_a_kind: "Death merges ranks; Hanged Man clears blockers; Strength to climb.",
  straight_flush: "The World for suit unification; Hermit funds Hieroglyph rerolls.",
  bloodstone_lucky: "Magician spam to convert cards to Lucky; Bloodstone target = Hearts.",
  canio_destruction: "Cryptid the Canio you want; Negative slots are gold here.",
  low_card_count: "Death to merge unwanted cards out; Hermit if economy slips.",
  no_discard: "Banner is the payoff; never play a hand with unused discards.",
  tarot_engine: "Fool spam in shops; Tarot Merchant + Sixth Sense if you see them.",
  two_pair_scaling: "Empress + Hierophant on your pair ranks; lock two pair anchors.",
  vampire_enhancement: "Enhance with Hierophant/Magician first, then Vampire strips them.",
  rank_focused: "Death to consolidate ranks; Hierophant + Empress to triple-stack.",
  suit_focused: "Smeared + The World to merge two suits into one mega-suit.",
  scaling_engine: "Cryptid your engine Joker; Negative slot pickups are gold here.",
  combo_engine: "Hierophant + Justice on enablers; Wheel after lock-in for foil/holo/poly.",
  economy: "Hermit early; Vagabond mid-run; Devil to convert into Gold cards.",
};
const CONSUMABLE_FALLBACK =
  "Use Tarots/Spectrals that match your archetype's hand; rerolls beat buys when the shop is cold.";

// Per-archetype tactical tips (3-line punch list)
const TIPS_BY_ARCH: Record<string, string[]> = {
  flush: [
    "Skip any shop without a flush enabler in Ante 1-2.",
    "Refuse Smeared until you have 3+ suits represented.",
    "Buy Negative voucher slots over single jokers in late shops.",
  ],
  flush_five: [
    "Don't play a single hand until Smeared is in.",
    "Stockpile Death/Strength for the ranks you don't yet have 5 of.",
    "Skip Vampire - it strips your enhancements.",
  ],
  high_card: [
    "Sell any Joker that requires Pair+ payoff.",
    "Vagabond is non-negotiable for $-economy.",
    "Boss blind on Ante 5: pre-buy a hand re-roll voucher.",
  ],
  three_of_a_kind: [
    "Hold one discard floor of 1; otherwise convert duplicates.",
    "Sock Buffer + Pareidolia together is the auto-include combo.",
    "Don't sell Hierophant before Ante 6.",
  ],
  straight: [
    "Stuteley/Four Fingers first - without it the deck stalls.",
    "Refuse rank-deletion bosses by burning a card in Ante 4.",
    "Lock in The World tarot for suit pivots if shop offers it.",
  ],
  flush_house: [
    "Plan: Tower bricks → Smeared → Flush House lines.",
    "Skip pair scalers; you only care about full-house structure.",
    "Burn 1 discard per round to hold pair shape for next play.",
  ],
  five_of_a_kind: [
    "Death is mandatory; skip any Ante 3 shop without one.",
    "Don't sell Showman, even if dead - it removes ceiling caps.",
    "Boss blind that destroys jokers = full reroll the shop.",
  ],
  straight_flush: [
    "First Ante goal: lock Four Fingers + Smeared together.",
    "Don't waste discards on suits - discard ranks instead.",
    "Hieroglyph after Ante 5 = guaranteed straight flush window.",
  ],
  canio_destruction: [
    "Get Canio + Cryptid before Ante 5 or fold the run.",
    "Negative slots > scalers from Ante 4 onwards.",
    "Hold a Spectral pack reserve for Canio enhancement.",
  ],
  no_discard: [
    "Sell ANY Joker that triggers on discard.",
    "Banner is the win condition - buy at any price.",
    "Boss blind that forces a discard: panic-sell and reroll.",
  ],
  tarot_engine: [
    "Fool spam - every shop, every reroll.",
    "Tarot Merchant is the build's heart; skip without it.",
    "Don't play a hand if a Tarot pack is offered next blind.",
  ],
};
const TIPS_FALLBACK = [
  "Lock in your scaling Joker by Ante 5 or fold the run.",
  "Refuse shops without a single archetype piece.",
  "Save 1 discard for boss-blind pivots.",
];

// Deck difficulty modifier (cheap heuristic; could be data-driven)
const DECK_DIFFICULTY: Record<string, number> = {
  red: 0, blue: 0, yellow: 0, black: 1, magic: 1, nebula: 1, ghost: 1,
  abandoned: 1, checkered: 0, zodiac: 1, painted: 1, anaglyph: 1,
  plasma: 2, erratic: 2, green: 0,
};
const STAKE_DIFFICULTY: Record<string, number> = {
  white: 0, red: 1, green: 1, black: 2, blue: 2, purple: 3, orange: 3, gold: 4,
};

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}
function shuffle<T>(rng: () => number, arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function buildChallenge(seed: number, archLabel: (id: string) => string): Challenge {
  const rng = mulberry32(seed);

  const archsWithCombos = ARCHETYPES.filter((a) =>
    COMBOS.some((c) => c.archetype === a.id),
  );
  const arch = pick(rng, archsWithCombos.length ? archsWithCombos : ARCHETYPES);

  const archCombos = COMBOS.filter((c) => c.archetype === arch.id);
  const combo = archCombos.length ? pick(rng, archCombos) : null;

  // Must-have: combo core (up to 3) OR archetype enablers (up to 3)
  const mustPool = combo
    ? combo.core
    : arch.enablers.slice(0, 4);
  const mustHave = shuffle(rng, mustPool).slice(0, 3);

  // Fill-in: combo optional + arch scalers + arch enablers we didn't already use
  const fillPool = Array.from(
    new Set([
      ...(combo?.optional ?? []),
      ...arch.scalers,
      ...arch.enablers,
    ].filter((id) => !mustHave.includes(id))),
  );
  const fillIn = shuffle(rng, fillPool).slice(0, 3);

  const deck = pick(rng, DECKS);
  const stake = pick(rng, STAKES);

  const flavor = pick(rng, FLAVORS);
  const archDisplay = archLabel(arch.id);
  const name = `${flavor} ${archDisplay}`;

  const goal = GOALS[arch.id] ?? GOAL_FALLBACK;
  const consumableHint = CONSUMABLES[arch.id] ?? CONSUMABLE_FALLBACK;
  const tips = TIPS_BY_ARCH[arch.id] ?? TIPS_FALLBACK;

  const watchOut =
    combo?.risks?.[0] ??
    arch.oftenLacks ??
    "Don't lock in too early; keep one flex slot for unexpected boss blinds.";

  // Difficulty estimate
  const dScore =
    (DECK_DIFFICULTY[deck.id] ?? 0) +
    (STAKE_DIFFICULTY[stake.id] ?? 0) +
    (combo ? 0 : 1);
  const difficulty: Challenge["difficulty"] =
    dScore <= 1 ? "Easy" : dScore <= 3 ? "Medium" : dScore <= 5 ? "Hard" : "Brutal";

  return {
    name,
    archetypeId: arch.id,
    comboId: combo?.id ?? null,
    mustHave,
    fillIn,
    deckId: deck.id,
    stakeId: stake.id,
    goal,
    consumableHint,
    tips,
    watchOut,
    difficulty,
  };
}

const DIFFICULTY_TONE: Record<Challenge["difficulty"], string> = {
  Easy: "bg-[hsl(145_45%_25%)] text-[hsl(145_60%_85%)] border-[hsl(145_45%_45%)]",
  Medium: "bg-[hsl(45_45%_25%)] text-[hsl(45_70%_85%)] border-[hsl(45_55%_50%)]",
  Hard: "bg-[hsl(20_55%_28%)] text-[hsl(20_80%_85%)] border-[hsl(20_65%_55%)]",
  Brutal: "bg-[hsl(0_55%_25%)] text-[hsl(0_75%_85%)] border-[hsl(0_60%_55%)]",
};

function JokerPick({ id, onClick }: { id: string; onClick: (id: string) => void }) {
  const name = useGameText("jokers", id);
  const displayName = name.name ?? JOKER_MAP[id]?.name ?? id;
  return (
    <button
      onClick={() => onClick(id)}
      title={displayName}
      className="group flex items-center gap-2 rounded-md border border-border bg-card/60 px-2 py-1.5 text-left transition-colors hover:border-accent/60 hover:bg-card"
      data-testid={`challenge-joker-${id}`}
    >
      <JokerSprite jokerId={id} name={displayName} size={28} className="h-7 w-7 shrink-0" />
      <span className="truncate text-[12px] font-medium text-foreground/90 group-hover:text-accent">
        {displayName}
      </span>
    </button>
  );
}

/**
 * Inline panel - designed to live inside MyRunTab next to slot management.
 * Renders the whole brief flat (no dialog wrapper). Pass `compact` for the
 * pared-down version used inside sidebars.
 */
export function RunChallengePanel() {
  const t = useT();
  const labels = useLabels();
  const { lang } = useI18n();
  const { openJokerDetail } = useApp();
  const [seed, setSeed] = useState(() => Date.now() & 0x7fffffff);

  // Resolve archetype label outside of the closure so it picks up i18n
  const resolveArchLabel = (id: string) =>
    labels.archetype[id as Archetype] ??
    ARCHETYPE_LABELS[id as Archetype] ??
    ARCHETYPES.find((a) => a.id === id)?.name ??
    id;

  const ch = useMemo(() => buildChallenge(seed, resolveArchLabel), [seed, labels]);
  const deck = DECKS.find((d) => d.id === ch.deckId);
  const stake = STAKES.find((s) => s.id === ch.stakeId);
  const combo = ch.comboId ? COMBOS.find((c) => c.id === ch.comboId) : null;

  return (
    <div
      className="casino-card overflow-hidden border-l-4 border-l-accent p-0"
      data-testid="panel-run-challenge"
    >
      {/* Header strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black bg-[hsl(150_16%_10%)] px-4 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <Dices className="h-4 w-4 shrink-0 text-accent" strokeWidth={2.5} />
          <span className="font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
            {t("ui.challenge.title")}
          </span>
          <span
            className={cn(
              "shrink-0 rounded-sm border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              DIFFICULTY_TONE[ch.difficulty],
            )}
            data-testid="badge-challenge-difficulty"
          >
            {ch.difficulty}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSeed((Date.now() ^ (Math.random() * 0xffffffff)) >>> 0)}
          className="h-7 gap-1.5 text-xs"
          data-testid="button-reroll-challenge"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {t("ui.challenge.reroll")}
        </Button>
      </div>

      <div className="space-y-4 p-4">
        {/* Mission name + goal */}
        <div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            {t("ui.challenge.mission")}
          </div>
          <h3
            className="mt-0.5 font-display text-xl font-bold leading-tight text-accent break-words"
            data-testid="text-challenge-name"
          >
            {ch.name}
          </h3>
          <div className="mt-2 flex items-start gap-2 rounded-md border border-accent/30 bg-accent/[0.06] p-2.5">
            <Target className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={2.5} />
            <p className="text-sm leading-snug text-foreground/90">
              <FormattedBalatroText text={ch.goal} lang={lang} />
            </p>
          </div>
          {combo && (
            <p className="mt-2 text-[11px] italic text-muted-foreground">
              {t("ui.challenge.with_combo")}:{" "}
              <span className="font-semibold not-italic text-foreground/80">
                {combo.title}
              </span>
            </p>
          )}
        </div>

        {/* Must-have jokers */}
        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground/80">
            <Swords className="h-3.5 w-3.5 text-[hsl(0_75%_70%)]" strokeWidth={2.5} />
            {t("ui.challenge.must_have")}
          </div>
          <div className="grid gap-1.5 sm:grid-cols-3">
            {ch.mustHave.length === 0 ? (
              <span className="text-xs italic text-muted-foreground">
                {t("ui.challenge.no_core")}
              </span>
            ) : (
              ch.mustHave.map((id) => (
                <JokerPick key={id} id={id} onClick={openJokerDetail} />
              ))
            )}
          </div>
        </div>

        {/* Fill-in jokers */}
        {ch.fillIn.length > 0 && (
          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {t("ui.challenge.fill_in")}
            </div>
            <div className="grid gap-1.5 sm:grid-cols-3">
              {ch.fillIn.map((id) => (
                <JokerPick key={id} id={id} onClick={openJokerDetail} />
              ))}
            </div>
          </div>
        )}

        {/* Run modifiers: Deck + Stake */}
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-md border border-border bg-card/40 p-2.5">
            <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              {t("ui.challenge.deck")}
            </div>
            <div className="mt-0.5 font-display text-sm font-semibold text-foreground">
              {deck?.name ?? ch.deckId}
            </div>
            {deck && (
              <p className="mt-1 text-[11px] leading-snug text-foreground/70 break-words">
                {deck.effect}
              </p>
            )}
          </div>
          <div className="rounded-md border border-border bg-card/40 p-2.5">
            <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              {t("ui.challenge.stake")}
            </div>
            <div className="mt-0.5 flex items-center gap-2 font-display text-sm font-semibold text-foreground">
              <span
                className="inline-block h-3 w-3 shrink-0 rounded-full border border-black"
                style={{ background: stake?.color }}
              />
              <span className="truncate">{stake?.name ?? ch.stakeId}</span>
            </div>
            {stake && (
              <p className="mt-1 text-[11px] leading-snug text-foreground/70 break-words">
                {stake.watchOut}
              </p>
            )}
          </div>
        </div>

        {/* Tactical tips */}
        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground/80">
            <Lightbulb className="h-3.5 w-3.5 text-[hsl(45_85%_60%)]" strokeWidth={2.5} />
            {t("ui.challenge.tips")}
          </div>
          <ul className="space-y-1.5">
            {ch.tips.map((line, i) => (
              <li
                key={i}
                className="flex gap-2 rounded-sm border-l-2 border-accent/40 bg-accent/[0.04] px-2 py-1 text-[12px] leading-snug text-foreground/85"
              >
                <span className="shrink-0 text-accent/80">▸</span>
                <span><FormattedBalatroText text={line} lang={lang} /></span>
              </li>
            ))}
          </ul>
        </div>

        {/* Consumables guide */}
        <div className="rounded-md border border-[hsl(280_30%_45%)]/30 bg-[hsl(280_30%_25%)]/15 p-2.5">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[hsl(280_50%_80%)]">
            <Shield className="h-3.5 w-3.5" strokeWidth={2.5} />
            {t("ui.challenge.consumables")}
          </div>
          <p className="mt-1 text-[12px] leading-snug text-foreground/85">
            <FormattedBalatroText text={ch.consumableHint} lang={lang} />
          </p>
        </div>

        {/* Watch out */}
        <div className="rounded-md border border-destructive/40 bg-destructive/[0.07] p-2.5">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[hsl(0_70%_78%)]">
            <Skull className="h-3.5 w-3.5" strokeWidth={2.5} />
            {t("ui.challenge.watch_out")}
          </div>
          <p className="mt-1 text-[12px] leading-snug text-foreground/85">
            <FormattedBalatroText text={ch.watchOut} lang={lang} />
          </p>
        </div>

        <p className="border-t border-border pt-2 text-center text-[10px] italic text-muted-foreground">
          {t("ui.challenge.disclaimer")}
        </p>
      </div>
    </div>
  );
}
