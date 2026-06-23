import { useState, useEffect } from "react";
import { readHandoff } from "@/lib/tabHandoff";
import { ChevronDown, Sparkles, TrendingUp, Ban, AlertCircle } from "lucide-react";
import { useApp } from "@/lib/appContext";
import { ARCHETYPES, type Archetype } from "@/lib/helpers";
import { JokerChip, SectionLabel, PopularityBadge, DifficultyBadge } from "@/components/primitives";
import { JokerSprite } from "@/components/JokerSprite";
import { cn } from "@/lib/utils";
import { useT, useLabels, useCuratedText, useGameText, useI18n } from "@/lib/i18n";
import { FormattedBalatroText } from "@/lib/balatroText";

type ArchFamily = "hand" | "property" | "engine" | "specific";

const FAMILY_BY_ID: Record<string, ArchFamily> = {
  flush: "hand", straight: "hand", high_card: "hand", pair: "hand",
  two_pair: "hand", two_pair_scaling: "hand", three_of_a_kind: "hand",
  four_of_a_kind: "hand",
  face_card: "property", held_in_hand: "property", steel: "property",
  glass: "property", low_card_count: "property",
  discard: "engine", no_discard: "engine", retrigger_engine: "engine",
  deck_growth: "engine", economy_snowball: "engine",
  bloodstone_lucky: "specific", vampire_enhancement: "specific",
  canio_destruction: "specific", tarot_engine: "specific",
};

const FAMILY_TONE: Record<ArchFamily, { border: string; accent: string; chip: string; label: string }> = {
  hand:     { border: "border-l-[hsl(173_55%_50%)]", accent: "text-[hsl(173_55%_60%)]", chip: "bg-[hsl(173_45%_25%)]/30 border-[hsl(173_45%_45%)]/40", label: "Hand-Type" },
  property: { border: "border-l-[hsl(330_50%_60%)]", accent: "text-[hsl(330_55%_72%)]", chip: "bg-[hsl(330_40%_30%)]/30 border-[hsl(330_40%_50%)]/40", label: "Card-Property" },
  engine:   { border: "border-l-[hsl(45_85%_55%)]",  accent: "text-[hsl(45_85%_62%)]",  chip: "bg-[hsl(45_60%_30%)]/30 border-[hsl(45_60%_45%)]/40",   label: "Engine" },
  specific: { border: "border-l-[hsl(270_45%_60%)]", accent: "text-[hsl(270_50%_72%)]", chip: "bg-[hsl(270_40%_30%)]/30 border-[hsl(270_40%_50%)]/40", label: "Build" },
};

function familyOf(id: string): ArchFamily {
  return FAMILY_BY_ID[id] ?? "hand";
}

function JokerPreview({ id, size = 24 }: { id: string; size?: number }) {
  const txt = useGameText("jokers", id);
  return <JokerSprite jokerId={id} name={txt.name ?? id} size={size} className="shrink-0" />;
}

interface ArchetypeRowProps {
  a: typeof ARCHETYPES[number];
  expanded: boolean;
  onToggle: () => void;
  archName: string;
  openJokerDetail: (id: string) => void;
  tLabels: {
    enablers: string;
    scalers: string;
    bait: string;
    oftenLacks: string;
  };
}

function ArchetypeCard({ a, expanded, onToggle, archName, openJokerDetail, tLabels }: ArchetypeRowProps) {
  const { lang } = useI18n();
  const wants = useCuratedText(`ui.archetype.${a.id}.wants`, a.wants);
  const oftenLacks = useCuratedText(`ui.archetype.${a.id}.oftenLacks`, a.oftenLacks);
  const fam = familyOf(a.id);
  const tone = FAMILY_TONE[fam];
  const previewJokers = [...a.enablers, ...a.scalers].slice(0, 4);

  return (
    <div
      className={cn(
        "casino-card overflow-hidden border-l-2 p-0 transition-all",
        tone.border,
        expanded && "md:col-span-2 ring-1 ring-accent/20",
      )}
      data-testid={`tile-archetype-${a.id}`}
    >
      <button
        onClick={onToggle}
        className="flex w-full flex-col gap-2.5 px-4 py-3.5 text-left hover-elevate"
        data-testid={`button-archetype-${a.id}`}
      >
        {}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("truncate font-display text-base font-semibold", tone.accent)}>
                {archName}
              </span>
              <span className={cn(
                "inline-flex shrink-0 items-center rounded-sm border px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider",
                tone.chip,
                tone.accent,
              )}>
                {tone.label}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {a.popularity ? <PopularityBadge popularity={a.popularity} /> : null}
              {a.difficulty ? <DifficultyBadge difficulty={a.difficulty} /> : null}
            </div>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              expanded && "rotate-180",
            )}
          />
        </div>

        {}
        {!expanded && (
          <>
            <p className="line-clamp-2 text-xs italic leading-relaxed text-foreground/70">
              <FormattedBalatroText text={wants} lang={lang} />
            </p>
            {previewJokers.length > 0 && (
              <div className="flex items-center gap-1.5 pt-0.5">
                {previewJokers.map((id) => <JokerPreview key={id} id={id} size={22} />)}
                {a.enablers.length + a.scalers.length > previewJokers.length && (
                  <span className="text-[10px] text-muted-foreground">
                    +{a.enablers.length + a.scalers.length - previewJokers.length}
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </button>

      {expanded && (
        <div className="space-y-5 border-t border-border/50 px-5 py-5">
          <blockquote className={cn("border-l-2 pl-4 font-display text-base leading-snug text-foreground/90", tone.border)}>
            <FormattedBalatroText text={wants} lang={lang} />
          </blockquote>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <div className="mb-2 flex items-center gap-1.5">
                <Sparkles className={cn("h-3.5 w-3.5", tone.accent)} />
                <SectionLabel>{tLabels.enablers}</SectionLabel>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {a.enablers.map((id) => (
                  <JokerChip key={id} id={id} onClick={openJokerDetail} testIdPrefix={`chip-enabler-${a.id}`} />
                ))}
              </div>
            </div>
            <div>
              <div className="mb-2 flex items-center gap-1.5">
                <TrendingUp className={cn("h-3.5 w-3.5", tone.accent)} />
                <SectionLabel>{tLabels.scalers}</SectionLabel>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {a.scalers.map((id) => (
                  <JokerChip key={id} id={id} onClick={openJokerDetail} testIdPrefix={`chip-scaler-${a.id}`} />
                ))}
              </div>
            </div>
          </div>

          {a.bait.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-1.5">
                <Ban className="h-3.5 w-3.5 text-destructive/80" />
                <SectionLabel>{tLabels.bait}</SectionLabel>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {a.bait.map((id) => (
                  <JokerChip key={id} id={id} tone="bait" strike onClick={openJokerDetail} testIdPrefix={`chip-bait-${a.id}`} />
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-border/50 pt-3">
            <div className="mb-1.5 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
              <SectionLabel>{tLabels.oftenLacks}</SectionLabel>
            </div>
            <p className="text-sm italic leading-relaxed text-muted-foreground">
              <FormattedBalatroText text={oftenLacks} lang={lang} />
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function ArchetypesTab() {
  const { openJokerDetail } = useApp();
  const t = useT();
  const labels = useLabels();
  const [openId, setOpenId] = useState<string>("");

  useEffect(() => {
    const id = readHandoff("archetypeId");
    if (id) setOpenId(id);
  }, []);

  const tLabels = {
    enablers: t("ui.arch.enablers"),
    scalers: t("ui.arch.scalers"),
    bait: t("ui.arch.bait"),
    oftenLacks: t("ui.arch.often_lacks"),
  };

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {ARCHETYPES.map((a) => (
        <ArchetypeCard
          key={a.id}
          a={a}
          expanded={openId === a.id}
          onToggle={() => setOpenId(openId === a.id ? "" : a.id)}
          archName={labels.archetype[a.id as Archetype] ?? a.name}
          openJokerDetail={openJokerDetail}
          tLabels={tLabels}
        />
      ))}
    </div>
  );
}
