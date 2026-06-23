import { useMemo, useState } from "react";
import { Info, ExternalLink } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { JokerSprite } from "@/components/JokerSprite";
import { useApp } from "@/lib/appContext";
import { JOKER_MAP } from "@/lib/helpers";
import { useT, useGameText } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import TIERLIST from "@/data/tierlist.json";

type Tier = "S" | "A" | "B" | "C" | "D";
const TIER_ORDER: Tier[] = ["S", "A", "B", "C", "D"];

const TIER_TONE: Record<Tier, { bg: string; border: string; text: string }> = {
  S: { bg: "bg-[hsl(0_60%_25%)]", border: "border-[hsl(0_60%_50%)]", text: "text-[hsl(0_85%_75%)]" },
  A: { bg: "bg-[hsl(28_50%_22%)]", border: "border-[hsl(28_60%_50%)]", text: "text-[hsl(28_85%_70%)]" },
  B: { bg: "bg-[hsl(45_45%_22%)]", border: "border-[hsl(45_55%_50%)]", text: "text-[hsl(45_85%_72%)]" },
  C: { bg: "bg-[hsl(145_30%_20%)]", border: "border-[hsl(145_40%_45%)]", text: "text-[hsl(145_50%_70%)]" },
  D: { bg: "bg-[hsl(210_20%_22%)]", border: "border-[hsl(210_25%_45%)]", text: "text-[hsl(210_25%_70%)]" },
};

interface TierData {
  S: string[];
  A: string[];
  B: string[];
  C: string[];
  D: string[];
}

interface TierListShape {
  default: TierData;
  byStake: Record<string, TierData>;
  byDeck: Record<string, TierData>;
  sources: { name: string; url: string }[];
  notes: string[];
}

const DATA = TIERLIST as TierListShape;

const STAKE_OPTIONS = [
  { id: "any", labelKey: "ui.tierlist.stake_any" },
  { id: "white", label: "White Stake", color: "#ffffff" },
  { id: "red", label: "Red Stake", color: "#dc3545" },
  { id: "green", label: "Green Stake", color: "#28a745" },
  { id: "black", label: "Black Stake", color: "#212529" },
  { id: "blue", label: "Blue Stake", color: "#0d6efd" },
  { id: "purple", label: "Purple Stake", color: "#6f42c1" },
  { id: "orange", label: "Orange Stake", color: "#fd7e14" },
  { id: "gold", label: "Gold Stake", color: "#ffc107" },
];

const DECK_OPTIONS = [
  { id: "any", labelKey: "ui.tierlist.deck_any" },
  { id: "red", label: "Red Deck" },
  { id: "blue", label: "Blue Deck" },
  { id: "yellow", label: "Yellow Deck" },
  { id: "green", label: "Green Deck" },
  { id: "black", label: "Black Deck" },
  { id: "magic", label: "Magic Deck" },
  { id: "nebula", label: "Nebula Deck" },
  { id: "ghost", label: "Ghost Deck" },
  { id: "abandoned", label: "Abandoned Deck" },
  { id: "checkered", label: "Checkered Deck" },
  { id: "zodiac", label: "Zodiac Deck" },
  { id: "painted", label: "Painted Deck" },
  { id: "anaglyph", label: "Anaglyph Deck" },
  { id: "plasma", label: "Plasma Deck" },
  { id: "erratic", label: "Erratic Deck" },
];

function JokerCell({ id, onClick }: { id: string; onClick: (id: string) => void }) {
  const joker = JOKER_MAP[id];
  const name = useGameText("jokers", id);
  const displayName = name.name ?? joker?.name ?? id;
  return (
    <button
      onClick={() => onClick(id)}
      title={displayName}
      className="group flex flex-col items-center gap-0.5 rounded-md p-1 transition-transform hover:scale-110 hover:bg-white/5"
      data-testid={`tierlist-joker-${id}`}
    >
      <JokerSprite jokerId={id} name={displayName} size={48} className="h-12 w-12" />
      <span className="hidden truncate text-[10px] text-foreground/70 group-hover:block lg:block lg:max-w-[80px]">
        {displayName}
      </span>
    </button>
  );
}

export function TierListTab() {
  const t = useT();
  const { openJokerDetail } = useApp();
  const [stake, setStake] = useState<string>("any");
  const [deck, setDeck] = useState<string>("any");

  const data: TierData = useMemo(() => {
    // Priority: deck override > stake override > default
    if (deck !== "any" && DATA.byDeck[deck]) return DATA.byDeck[deck];
    if (stake !== "any" && DATA.byStake[stake]) return DATA.byStake[stake];
    return DATA.default;
  }, [stake, deck]);

  const variantLabel = useMemo(() => {
    if (deck !== "any") return DECK_OPTIONS.find((d) => d.id === deck)?.label ?? deck;
    if (stake !== "any") return STAKE_OPTIONS.find((s) => s.id === stake)?.label ?? stake;
    return t("ui.tierlist.variant_default");
  }, [stake, deck, t]);

  return (
    <div className="space-y-5">
      {/* Disclaimer */}
      <div
        className="flex items-start gap-3 rounded-md border-2 border-accent/40 bg-accent/5 p-4"
        data-testid="tierlist-disclaimer"
      >
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-accent" strokeWidth={2.5} />
        <div className="space-y-1.5">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-accent">
            {t("ui.tierlist.disclaimer_title")}
          </h3>
          <p className="text-xs leading-relaxed text-foreground/85">
            {t("ui.tierlist.disclaimer_body")}
          </p>
        </div>
      </div>

      {/* Selectors */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[180px] flex-1">
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {t("ui.tierlist.filter_stake")}
          </label>
          <Select value={stake} onValueChange={(v) => { setStake(v); if (v !== "any") setDeck("any"); }}>
            <SelectTrigger className="bg-card" data-testid="select-tierlist-stake">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STAKE_OPTIONS.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  <div className="flex items-center gap-2">
                    {s.color && (
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full border border-black"
                        style={{ background: s.color }}
                      />
                    )}
                    {s.labelKey ? t(s.labelKey) : s.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[180px] flex-1">
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {t("ui.tierlist.filter_deck")}
          </label>
          <Select value={deck} onValueChange={(v) => { setDeck(v); if (v !== "any") setStake("any"); }}>
            <SelectTrigger className="bg-card" data-testid="select-tierlist-deck">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DECK_OPTIONS.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.labelKey ? t(d.labelKey) : d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-xs italic text-muted-foreground">
          {t("ui.tierlist.showing")}: <span className="font-semibold text-foreground/90 not-italic">{variantLabel}</span>
        </div>
      </div>

      {/* Tier rows */}
      <div className="space-y-2">
        {TIER_ORDER.map((tier) => {
          const ids = data[tier] ?? [];
          const tone = TIER_TONE[tier];
          return (
            <div
              key={tier}
              className={cn(
                "flex gap-3 rounded-md border-2 p-2",
                tone.border,
              )}
              data-testid={`tier-row-${tier}`}
            >
              <div
                className={cn(
                  "flex w-16 shrink-0 items-center justify-center rounded font-display text-3xl font-black",
                  tone.bg, tone.text,
                )}
              >
                {tier}
              </div>
              <div className="flex min-h-[60px] flex-1 flex-wrap items-center gap-1">
                {ids.length === 0 ? (
                  <span className="text-xs italic text-muted-foreground">
                    {t("ui.tierlist.empty_tier")}
                  </span>
                ) : (
                  ids.map((id) => (
                    <JokerCell key={id} id={id} onClick={openJokerDetail} />
                  ))
                )}
              </div>
              <div className="hidden shrink-0 self-center text-[11px] tabular text-muted-foreground sm:block">
                {ids.length}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sources */}
      <div className="space-y-2 border-t border-border pt-4">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t("ui.tierlist.sources")}
        </h3>
        <ul className="flex flex-wrap gap-x-3 gap-y-1.5">
          {DATA.sources.map((s) => (
            <li key={s.url}>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-accent underline decoration-dotted underline-offset-2 hover:text-accent/80"
                data-testid={`tierlist-source-${s.name}`}
              >
                <ExternalLink className="h-3 w-3" />
                {s.name}
              </a>
            </li>
          ))}
        </ul>
        {DATA.notes && DATA.notes.length > 0 && (
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer font-semibold hover:text-foreground">
              {t("ui.tierlist.methodology")}
            </summary>
            <ul className="ml-4 mt-2 list-disc space-y-1">
              {DATA.notes.map((n, i) => (
                <li key={i} className="leading-relaxed">{n}</li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  );
}
