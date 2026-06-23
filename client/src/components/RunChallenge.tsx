import { useMemo, useState } from "react";
import { Dices, RefreshCw, Sparkles } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ARCHETYPES, COMBOS, JOKER_MAP, ARCHETYPE_LABELS, type Archetype,
} from "@/lib/helpers";
import { DECKS } from "@/data/phase3/decks";
import { STAKES } from "@/data/phase3/stakes";
import { JokerChip } from "@/components/primitives";
import { useApp } from "@/lib/appContext";
import { useT, useLabels, useI18n } from "@/lib/i18n";
import { FormattedBalatroText } from "@/lib/balatroText";

interface Challenge {
  archetypeId: string;
  comboId: string | null;
  coreJokers: string[];
  deckId: string;
  stakeId: string;
  consumableHint: string;
  watchOut: string;
}

// Curated consumable hints per archetype id — falls back to generic line
const CONSUMABLE_HINTS: Record<string, string> = {
  flush: "Tower (Stone) for filler bricks, Hierophant for +Hearts/Diamonds pairs.",
  flush_five: "Smeared Joker is mandatory; Cryptid + 2x Strength makes Flush Fives trivial.",
  high_card: "Devil for Gold cards, Hermit if behind on money, Vagabond as panic button.",
  pair_focused: "Strength → bump duplicate ranks; Empress for +2 Mult on pair plays.",
  three_of_a_kind: "Hierophant on duplicates; Lovers turns one card into a 2-Pair branch.",
  four_of_a_kind: "Justice (foil/holo) on your scaling Joker; Wheel of Fortune at full coverage.",
  straight: "Magician (Lucky cards) for Bloodstone scaling; The World to swap suits.",
  full_house: "Empress on each pair; Justice on Vampire/Constellation if you brought one.",
  flush_house: "Tower bricks + Smeared = guaranteed Flush House from a single Full-House line.",
  five_of_a_kind: "Death to merge ranks; Hanged Man if cards block your line; Strength to climb.",
  straight_flush: "The World for suit unification; Hermit between rounds to fund Hieroglyph rerolls.",
  bloodstone_lucky: "Magician spam to convert cards into Lucky; Bloodstone target = Hearts.",
  canio_destruction: "Cryptid the Canio you want; Wheel of Fortune for Negative slot expansion.",
  low_card_count: "Death to merge unwanted cards out of the deck; Hermit if economy slips.",
  no_discard: "Banner is the payoff; never play hands with unused discards left.",
  tarot_engine: "Fool spam in shops; Tarot Merchant + Sixth Sense if you see them.",
  two_pair_scaling: "Empress + Hierophant on your pair ranks; Aim for two locked-in pair anchors.",
  vampire_enhancement: "Strip enhancements with Vampire by enhancing first via Hierophant/Magician.",
  rank_focused: "Death to consolidate ranks; Hierophant + Empress to triple-stack pairs.",
  suit_focused: "Smeared + The World to merge two suits into one mega-suit.",
  scaling_engine: "Cryptid your engine Joker; Negative slot pickups are gold here.",
  combo_engine: "Hierophant + Justice on your enablers; Wheel after lock-in for foil/holo/poly.",
  economy: "Hermit early; Vagabond mid-run; The Devil to convert into Gold cards.",
};

const FALLBACK_HINT = "Use Tarot/Spectral consumables that match your archetype's hands; rerolls > buys when the shop is cold.";

// Pseudo-random with seed for determinism
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

function buildChallenge(seed: number): Challenge {
  const rng = mulberry32(seed);

  // Prefer archetypes that actually have at least one combo
  const archsWithCombos = ARCHETYPES.filter((a) =>
    COMBOS.some((c) => c.archetype === a.id)
  );
  const arch = pick(rng, archsWithCombos.length ? archsWithCombos : ARCHETYPES);

  const archCombos = COMBOS.filter((c) => c.archetype === arch.id);
  const combo = archCombos.length ? pick(rng, archCombos) : null;

  // Core jokers: prefer combo's core, fall back to archetype enablers+scalers
  const pool = combo
    ? [...combo.core, ...combo.optional.slice(0, 2)]
    : [...arch.enablers.slice(0, 3), ...arch.scalers.slice(0, 2)];
  const coreJokers = Array.from(new Set(pool)).slice(0, 5);

  const deck = pick(rng, DECKS);
  const stake = pick(rng, STAKES);
  const consumableHint = CONSUMABLE_HINTS[arch.id] ?? FALLBACK_HINT;

  // Watch-out: use first risk from combo or arch oftenLacks
  const watchOut =
    combo?.risks[0] ??
    arch.oftenLacks ??
    "Don't lock in too early; keep one flex slot for unexpected boss blinds.";

  return {
    archetypeId: arch.id,
    comboId: combo?.id ?? null,
    coreJokers,
    deckId: deck.id,
    stakeId: stake.id,
    consumableHint,
    watchOut,
  };
}

export function RunChallengeDialog({ trigger }: { trigger?: React.ReactNode }) {
  const t = useT();
  const labels = useLabels();
  const { lang } = useI18n();
  const { openJokerDetail } = useApp();
  const [open, setOpen] = useState(false);
  const [seed, setSeed] = useState(() => Date.now() & 0xffff);

  const ch = useMemo(() => buildChallenge(seed), [seed]);

  const arch = ARCHETYPES.find((a) => a.id === ch.archetypeId);
  const combo = ch.comboId ? COMBOS.find((c) => c.id === ch.comboId) : null;
  const deck = DECKS.find((d) => d.id === ch.deckId);
  const stake = STAKES.find((s) => s.id === ch.stakeId);

  const archName =
    labels.archetype[ch.archetypeId as Archetype] ??
    ARCHETYPE_LABELS[ch.archetypeId as Archetype] ??
    arch?.name ??
    ch.archetypeId;

  const comboTitle = combo?.title;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            variant="outline"
            className="font-display"
            data-testid="button-run-challenge"
          >
            <Dices className="mr-2 h-4 w-4" />
            {t("ui.challenge.button")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        className="max-h-[90dvh] max-w-2xl overflow-y-auto border-2 border-black bg-[hsl(178_14%_13%)] font-pixel text-[hsl(45_15%_85%)]"
        data-testid="dialog-run-challenge"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <Sparkles className="h-5 w-5 text-accent" />
            <span>{t("ui.challenge.title")}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <p className="text-sm leading-relaxed text-foreground/80">
            {t("ui.challenge.intro")}
          </p>

          {/* Headline */}
          <div className="rounded-md border border-accent/40 bg-accent/5 p-4">
            <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              {t("ui.challenge.archetype")}
            </div>
            <div className="mt-1 font-display text-2xl font-bold text-accent">
              {archName}
            </div>
            {comboTitle && (
              <div className="mt-2 text-sm text-foreground/80">
                {t("ui.challenge.with_combo")}{" "}
                <span className="font-semibold text-foreground">{comboTitle}</span>
              </div>
            )}
          </div>

          {/* Core jokers */}
          <div>
            <div className="mb-2 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              {t("ui.challenge.core_jokers")}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ch.coreJokers.map((id) => (
                <JokerChip
                  key={id}
                  id={id}
                  onClick={(jid) => {
                    setOpen(false);
                    openJokerDetail(jid);
                  }}
                  testIdPrefix="chip-challenge-core"
                />
              ))}
              {ch.coreJokers.length === 0 && (
                <span className="text-xs italic text-muted-foreground">
                  {t("ui.challenge.no_core")}
                </span>
              )}
            </div>
          </div>

          {/* Deck + Stake side by side */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-border bg-card/40 p-3">
              <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                {t("ui.challenge.deck")}
              </div>
              <div className="mt-1 font-display text-base font-semibold text-foreground">
                {deck?.name ?? ch.deckId}
              </div>
              {deck && (
                <p className="mt-1 text-xs text-foreground/70">{deck.effect}</p>
              )}
            </div>
            <div className="rounded-md border border-border bg-card/40 p-3">
              <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                {t("ui.challenge.stake")}
              </div>
              <div className="mt-1 flex items-center gap-2 font-display text-base font-semibold text-foreground">
                <span
                  className="inline-block h-3 w-3 rounded-full border border-black"
                  style={{ background: stake?.color }}
                />
                {stake?.name ?? ch.stakeId}
              </div>
              {stake && (
                <p className="mt-1 text-xs italic text-muted-foreground">
                  {stake.watchOut}
                </p>
              )}
            </div>
          </div>

          {/* Consumable hint */}
          <div className="rounded-md border border-border bg-card/40 p-3">
            <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              {t("ui.challenge.consumables")}
            </div>
            <p className="mt-1 text-sm leading-relaxed text-foreground/85">
              <FormattedBalatroText text={ch.consumableHint} lang={lang} />
            </p>
          </div>

          {/* Watch out */}
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3">
            <div className="text-[11px] uppercase tracking-[0.12em] text-[hsl(0_55%_72%)]">
              {t("ui.challenge.watch_out")}
            </div>
            <p className="mt-1 text-sm leading-relaxed text-foreground/85">
              <FormattedBalatroText text={ch.watchOut} lang={lang} />
            </p>
          </div>

          {/* Reroll */}
          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <Button
              variant="outline"
              onClick={() => setSeed(Date.now() ^ (Math.random() * 0xffffffff))}
              className="font-display"
              data-testid="button-reroll-challenge"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {t("ui.challenge.reroll")}
            </Button>
          </div>

          <p className="border-t border-border pt-3 text-center text-[11px] italic text-muted-foreground">
            {t("ui.challenge.disclaimer")}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
