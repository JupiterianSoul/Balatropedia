import { useState, useMemo } from "react";
import { useApp } from "@/lib/appContext";
import {
  JOKER_MAP, synergiesFor, synergyKey, SYNERGY_KIND_ORDER, SYNERGY_KIND_LABELS, ENGINE_LABELS,
  SynergyKind,
} from "@/lib/helpers";
import { JokerCombobox } from "@/components/JokerCombobox";
import { JokerSprite } from "@/components/JokerSprite";
import { SourceCitations } from "@/components/SourceCitations";
import { PopularityBadge, DifficultyBadge } from "@/components/primitives";
import { LName, LText } from "@/components/Localized";
import { useT, useLabels, useCuratedText, useGameText } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const KIND_ACCENT: Record<SynergyKind, string> = {
  core_pair: "border-l-accent",
  strong_support: "border-l-[hsl(145_35%_40%)]",
  conditional: "border-l-[hsl(173_40%_45%)]",
  archetype_only: "border-l-muted-foreground",
  risky_explosive: "border-l-secondary",
  trap_unless_enabled: "border-l-destructive",
};

interface SynergyRowProps {
  c: ReturnType<typeof synergiesFor>[number];
  kind: SynergyKind;
  selected: string;
  onSelect: (id: string) => void;
  engineLabel: string;
}

function SynergyRow({ c, kind, selected, onSelect, engineLabel }: SynergyRowProps) {
  const p = JOKER_MAP[c.partnerId];
  const a = JOKER_MAP[c.a];
  const b = JOKER_MAP[c.b];
  const key = synergyKey(c.a, c.b);
  const why = useCuratedText(`ui.synergy.${key}.why`, c.why);
  const partnerName = useGameText("jokers", c.partnerId);
  const aName = useGameText("jokers", c.a);
  const bName = useGameText("jokers", c.b);
  return (
    <div
      className={cn("casino-card border-l-2 p-3.5", KIND_ACCENT[kind])}
      data-testid={`synergy-${selected}-${c.partnerId}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex shrink-0 items-center gap-0.5">
            <JokerSprite jokerId={c.a} name={aName.name ?? a?.name ?? c.a} size={28} className="h-7 w-7" />
            <span className="px-0.5 text-[10px] text-muted-foreground">+</span>
            <JokerSprite jokerId={c.b} name={bName.name ?? b?.name ?? c.b} size={28} className="h-7 w-7" />
          </div>
          <button
            onClick={() => onSelect(c.partnerId)}
            className="truncate font-display text-sm font-semibold text-accent hover:underline"
            data-testid={`button-select-partner-${c.partnerId}`}
          >
            {partnerName.name ?? p?.name ?? c.partnerId}
          </button>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {c.popularity ? <PopularityBadge popularity={c.popularity} /> : null}
          {c.difficulty ? <DifficultyBadge difficulty={c.difficulty} /> : null}
          <span className="rounded-sm border border-border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {engineLabel}
          </span>
        </div>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-foreground/80">{why}</p>
      <SourceCitations sources={c.sources} />
    </div>
  );
}

export function SynergyTab() {
  const { openJokerDetail } = useApp();
  const t = useT();
  const labels = useLabels();
  const [selected, setSelected] = useState<string | null>(null);

  const grouped = useMemo(() => {
    if (!selected) return null;
    const conns = synergiesFor(selected);
    const map = {} as Record<SynergyKind, typeof conns>;
    for (const k of SYNERGY_KIND_ORDER) map[k] = [];
    for (const c of conns) map[c.kind].push(c);
    return map;
  }, [selected]);

  const total = grouped ? Object.values(grouped).reduce((n, l) => n + l.length, 0) : 0;
  const j = selected ? JOKER_MAP[selected] : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      {}
      <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
        <div>
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {t("ui.syn.select_joker")}
          </div>
          <JokerCombobox value={selected} onChange={setSelected} testId="combobox-synergy" />
        </div>
        {j && (
          <div className="casino-card p-4">
            <button
              onClick={() => openJokerDetail(j.id)}
              className="font-display text-lg text-accent hover:underline"
              data-testid="button-open-selected-detail"
            >
              <LName category="jokers" id={j.id} fallback={j.name} />
            </button>
            <LText category="jokers" id={j.id} fallback={j.summary} as="p" className="mt-1 text-xs text-foreground/80 small-caps" />
            <p className="mt-2 text-xs tabular text-muted-foreground">
              {total} {t("ui.syn.curated")} {total === 1 ? t("ui.syn.connection") : t("ui.syn.connections")}
            </p>
          </div>
        )}
        <div className="space-y-1.5 rounded-md border border-border bg-card/40 p-3 text-[11px] text-muted-foreground">
          <div className="font-semibold uppercase tracking-[0.12em] text-muted-foreground">{t("ui.syn.legend")}</div>
          {SYNERGY_KIND_ORDER.map((k) => (
            <div key={k} className="flex items-center gap-2">
              <span className={cn("h-3 w-1 rounded-full border-l-2", KIND_ACCENT[k])} />
              <span>{labels.synergyKind[k] ?? SYNERGY_KIND_LABELS[k]}</span>
            </div>
          ))}
        </div>
      </div>

      {}
      <div className="space-y-6">
        {!selected || !grouped ? (
          <div className="rounded-md border border-dashed border-border py-16 text-center">
            <p className="text-sm text-muted-foreground">
              {t("ui.syn.pick_to_start")}
            </p>
          </div>
        ) : total === 0 ? (
          <div className="rounded-md border border-dashed border-border py-16 text-center">
            <p className="text-sm text-muted-foreground">
              {t("ui.syn.no_synergies")}
            </p>
          </div>
        ) : (
          SYNERGY_KIND_ORDER.map((kind) => {
            const list = grouped[kind];
            if (!list.length) return null;
            return (
              <section key={kind}>
                <h3 className={cn(
                  "mb-2.5 inline-block font-display text-sm font-semibold uppercase tracking-wide",
                  kind === "core_pair" ? "gold-underline text-accent" :
                  kind === "risky_explosive" ? "text-[hsl(350_55%_70%)]" :
                  kind === "trap_unless_enabled" ? "text-[hsl(0_60%_70%)]" :
                  "text-foreground/90",
                )}>
                  {labels.synergyKind[kind] ?? SYNERGY_KIND_LABELS[kind]}
                </h3>
                <div className="grid gap-2.5 md:grid-cols-2">
                  {list.map((c) => (
                    <SynergyRow
                      key={c.partnerId}
                      c={c}
                      kind={kind}
                      selected={selected!}
                      onSelect={(id) => setSelected(id)}
                      engineLabel={labels.engine[c.engine] ?? ENGINE_LABELS[c.engine]}
                    />
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}

