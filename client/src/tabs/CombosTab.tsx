import { useState, useMemo, useEffect, useRef } from "react";
import { Layers } from "lucide-react";
import { TabIntro } from "@/components/TabIntro";
import { readHandoff } from "@/lib/tabHandoff";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/lib/appContext";
import { COMBOS, ARCHETYPE_LABELS, type Archetype } from "@/lib/helpers";
import { JokerChip, StarToggle, SectionLabel, PopularityBadge, DifficultyBadge } from "@/components/primitives";
import { SourceCitations } from "@/components/SourceCitations";
import { useT, useLabels, useCuratedText, useCuratedList, useI18n } from "@/lib/i18n";
import { FormattedBalatroText } from "@/lib/balatroText";

interface ComboCardProps {
  c: typeof COMBOS[number];
  archLabel: string;
  openJokerDetail: (id: string) => void;
  isFavoriteCombo: (id: string) => boolean;
  toggleFavoriteCombo: (id: string) => void;
  highlight?: boolean;
  cardRef?: React.Ref<HTMLDivElement>;
  tLabels: {
    corePieces: string;
    optionalSupports: string;
    conditions: string;
    risks: string;
    whyWorks: string;
    pivotOut: string;
  };
}

function ComboCard({ c, archLabel, openJokerDetail, isFavoriteCombo, toggleFavoriteCombo, highlight, cardRef, tLabels }: ComboCardProps) {
  const { lang } = useI18n();
  const title = useCuratedText(`ui.combo.${c.id}.title`, c.title);
  const why = useCuratedText(`ui.combo.${c.id}.why`, c.why);
  const pivotOut = useCuratedText(`ui.combo.${c.id}.pivotOut`, c.pivotOut);
  const conditions = useCuratedList(`ui.combo.${c.id}.conditions`, c.conditions);
  const risks = useCuratedList(`ui.combo.${c.id}.risks`, c.risks);

  return (
    <div
      ref={cardRef}
      className={`casino-card flex flex-col p-5 transition-shadow ${highlight ? "ring-2 ring-accent shadow-[0_0_30px_hsl(var(--accent)/0.45)]" : ""}`}
      data-testid={`card-combo-${c.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-lg font-semibold text-accent">{title}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="inline-block rounded-full border border-[hsl(145_35%_40%)]/40 bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-[hsl(145_45%_62%)]">
              {archLabel}
            </span>
            {c.popularity ? <PopularityBadge popularity={c.popularity} /> : null}
            {c.difficulty ? <DifficultyBadge difficulty={c.difficulty} /> : null}
          </div>
        </div>
        <StarToggle
          active={isFavoriteCombo(c.id)}
          onToggle={() => toggleFavoriteCombo(c.id)}
          testId={`button-favorite-combo-${c.id}`}
          size={18}
        />
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <SectionLabel>{tLabels.corePieces}</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {c.core.map((id) => <JokerChip key={id} id={id} onClick={openJokerDetail} testIdPrefix={`chip-core-${c.id}`} />)}
          </div>
        </div>
        {c.optional.length > 0 && (
          <div>
            <SectionLabel>{tLabels.optionalSupports}</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {c.optional.map((id) => <JokerChip key={id} id={id} onClick={openJokerDetail} testIdPrefix={`chip-opt-${c.id}`} />)}
            </div>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <SectionLabel>{tLabels.conditions}</SectionLabel>
            <ul className="space-y-1">
              {conditions.map((x, i) => (
                <li key={i} className="flex gap-2 text-xs text-foreground/80">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
                  <span><FormattedBalatroText text={x} lang={lang} /></span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <SectionLabel>{tLabels.risks}</SectionLabel>
            <ul className="space-y-1">
              {risks.map((x, i) => (
                <li key={i} className="flex gap-2 text-xs text-[hsl(0_55%_72%)]">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-destructive" />
                  <span><FormattedBalatroText text={x} lang={lang} /></span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div>
          <SectionLabel>{tLabels.whyWorks}</SectionLabel>
          <p className="text-xs leading-relaxed text-foreground/85">
            <FormattedBalatroText text={why} lang={lang} />
          </p>
        </div>
        <div className="border-t border-border pt-3">
          <SectionLabel>{tLabels.pivotOut}</SectionLabel>
          <p className="text-xs italic leading-relaxed text-muted-foreground">
            <FormattedBalatroText text={pivotOut} lang={lang} />
          </p>
        </div>
        <SourceCitations sources={c.sources} />
      </div>
    </div>
  );
}

export function CombosTab() {
  const { openJokerDetail, isFavoriteCombo, toggleFavoriteCombo } = useApp();
  const t = useT();
  const labels = useLabels();
  const [arch, setArch] = useState<string>("all");
  const [highlightedComboId, setHighlightedComboId] = useState<string | null>(null);
  const targetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const id = readHandoff("comboId");
    if (!id) return;
    const combo = COMBOS.find((x) => x.id === id);
    if (!combo) return;
    setArch(combo.archetype);
    setHighlightedComboId(id);
  }, []);

  useEffect(() => {
    if (!highlightedComboId) return;
    const el = targetRef.current;
    if (el) {
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
    const tmo = window.setTimeout(() => setHighlightedComboId(null), 4000);
    return () => window.clearTimeout(tmo);
  }, [highlightedComboId]);

  const archetypes = useMemo(
    () => Array.from(new Set(COMBOS.map((c) => c.archetype))),
    [],
  );
  const filtered = arch === "all" ? COMBOS : COMBOS.filter((c) => c.archetype === arch);

  const tLabels = {
    corePieces: t("ui.combos.core_pieces"),
    optionalSupports: t("ui.combos.optional_supports"),
    conditions: t("ui.combos.conditions"),
    risks: t("ui.combos.risks"),
    whyWorks: t("ui.combos.why_works"),
    pivotOut: t("ui.combos.pivot_out"),
  };

  return (
    <div className="space-y-5">
      <TabIntro Icon={Layers} title="Combos">
        Curated joker combinations grouped by archetype. Pick a filter to focus on the playstyle you are building toward.
      </TabIntro>
      <div className="flex items-center justify-center gap-3">
        <Select value={arch} onValueChange={setArch}>
          <SelectTrigger className="w-56 bg-card" data-testid="select-combo-archetype">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("ui.combos.all_archetypes")}</SelectItem>
            {archetypes.map((a) => (
              <SelectItem key={a} value={a}>{labels.archetype[a as Archetype] ?? ARCHETYPE_LABELS[a as Archetype] ?? a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {filtered.map((c) => (
          <ComboCard
            key={c.id}
            c={c}
            archLabel={labels.archetype[c.archetype] ?? ARCHETYPE_LABELS[c.archetype] ?? c.archetype}
            openJokerDetail={openJokerDetail}
            isFavoriteCombo={isFavoriteCombo}
            toggleFavoriteCombo={toggleFavoriteCombo}
            highlight={highlightedComboId === c.id}
            cardRef={highlightedComboId === c.id ? targetRef : undefined}
            tLabels={tLabels}
          />
        ))}
      </div>
    </div>
  );
}

