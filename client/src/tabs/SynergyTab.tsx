import { useState, useMemo, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { useApp } from "@/lib/appContext";
import { readHandoff } from "@/lib/tabHandoff";
import {
  JOKER_MAP, synergiesFor, synergyKey, SYNERGY_KIND_ORDER, SYNERGY_KIND_LABELS, ENGINE_LABELS,
  SynergyKind,
} from "@/lib/helpers";
import { JokerCombobox } from "@/components/JokerCombobox";
import { JokerSprite } from "@/components/JokerSprite";
import { SourceCitations } from "@/components/SourceCitations";
import { PopularityBadge, DifficultyBadge } from "@/components/primitives";
import { TabIntro } from "@/components/TabIntro";
import { useT, useLabels, useCuratedText, useGameText, useI18n } from "@/lib/i18n";
import { FormattedBalatroText } from "@/lib/balatroText";
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
  onOpenPartner: (id: string) => void;
  engineLabel: string;
}

/**
 * Partner row.
 *
 * The user wanted partner rows to be sprite-only (no name button). Tapping the
 * sprite opens the partner's full detail sheet. The pair-sprite header on the
 * left still shows the A+B pairing icons, but the partner identity is
 * communicated by the sprite-only target on the right.
 */
function SynergyRow({ c, kind, selected, onOpenPartner, engineLabel }: SynergyRowProps) {
  const { lang } = useI18n();
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
      className={cn("casino-card border-l-2 p-2.5 sm:p-3.5", KIND_ACCENT[kind])}
      data-testid={`synergy-${selected}-${c.partnerId}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="flex shrink-0 items-center gap-0.5">
            <JokerSprite jokerId={c.a} name={aName.name ?? a?.name ?? c.a} size={32} />
            <span className="px-0.5 text-[10px] text-muted-foreground">+</span>
            <JokerSprite jokerId={c.b} name={bName.name ?? b?.name ?? c.b} size={32} />
          </div>
          {/* Sprite-only partner target. No name button. */}
          <button
            type="button"
            onClick={() => onOpenPartner(c.partnerId)}
            className="ml-1 shrink-0 rounded transition-transform hover:scale-110"
            aria-label={partnerName.name ?? p?.name ?? c.partnerId}
            data-testid={`button-select-partner-${c.partnerId}`}
          >
            <JokerSprite
              jokerId={c.partnerId}
              name={partnerName.name ?? p?.name ?? c.partnerId}
              size={40}
              clickable={false}
            />
          </button>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1">
          {c.popularity ? <PopularityBadge popularity={c.popularity} /> : null}
          {c.difficulty ? <DifficultyBadge difficulty={c.difficulty} /> : null}
          <span className="max-w-[80px] truncate rounded-sm border border-border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {engineLabel}
          </span>
        </div>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-foreground/80">
        <FormattedBalatroText text={why} lang={lang} />
      </p>
      <SourceCitations sources={c.sources} />
    </div>
  );
}

export function SynergyTab() {
  const { openJokerDetail } = useApp();
  const t = useT();
  const labels = useLabels();
  const { lang } = useI18n();
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const id = readHandoff("synergyJoker");
    if (id) setSelected(id);
  }, []);

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
  const selectedName = useGameText("jokers", selected ?? "");
  const selectedText = useGameText("jokers", selected ?? "");

  return (
    <div className="space-y-5 p-2 md:p-4">
      <TabIntro Icon={Sparkles} title={t("ui.nav.synergies")}>
        Pick a joker. The board shows curated and heuristic partners, grouped by how strong the pairing is.
      </TabIntro>

      {/* Joker picker */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {t("ui.syn.select_joker")}
        </div>
        <JokerCombobox value={selected} onChange={setSelected} testId="combobox-synergy" />
      </div>

      {/* Selected joker card: sprite LEFT + description RIGHT */}
      {j && (
        <div
          className="casino-card p-4"
          data-testid="synergy-selected-card"
        >
          <div className="flex items-start gap-4">
            <button
              type="button"
              onClick={() => openJokerDetail(j.id)}
              className="shrink-0 transition-transform hover:scale-105"
              aria-label={selectedName.name ?? j.name}
              data-testid="button-open-selected-detail"
            >
              <JokerSprite
                jokerId={j.id}
                name={selectedName.name ?? j.name}
                size={88}
                clickable={false}
              />
            </button>
            <div className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => openJokerDetail(j.id)}
                className="block text-left font-display text-lg text-accent hover:underline"
              >
                {selectedName.name ?? j.name}
              </button>
              <p className="mt-1 text-xs leading-relaxed text-foreground/85">
                <FormattedBalatroText text={selectedText.text ?? j.summary} id={j.id} lang={lang} />
              </p>
              <p className="mt-2 text-xs tabular text-muted-foreground">
                {total} {t("ui.syn.curated")}{" "}
                {total === 1 ? t("ui.syn.connection") : t("ui.syn.connections")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Synergy list */}
      <div className="space-y-6">
        {!selected || !grouped ? (
          <div className="rounded-md border border-dashed border-border py-16 text-center">
            <p className="text-sm text-muted-foreground">{t("ui.syn.pick_to_start")}</p>
          </div>
        ) : total === 0 ? (
          <div className="rounded-md border border-dashed border-border py-16 text-center">
            <p className="text-sm text-muted-foreground">{t("ui.syn.no_synergies")}</p>
          </div>
        ) : (
          SYNERGY_KIND_ORDER.map((kind) => {
            const list = grouped[kind];
            if (!list.length) return null;
            return (
              <section key={kind}>
                <h3
                  className={cn(
                    "mb-2.5 inline-block font-display text-sm font-semibold uppercase tracking-wide",
                    kind === "core_pair"
                      ? "gold-underline text-accent"
                      : kind === "risky_explosive"
                      ? "text-[hsl(350_55%_70%)]"
                      : kind === "trap_unless_enabled"
                      ? "text-[hsl(0_60%_70%)]"
                      : "text-foreground/90",
                  )}
                >
                  {labels.synergyKind[kind] ?? SYNERGY_KIND_LABELS[kind]}
                </h3>
                <div className="grid gap-2 sm:gap-2.5 md:grid-cols-2">
                  {list.map((c) => (
                    <SynergyRow
                      key={c.partnerId}
                      c={c}
                      kind={kind}
                      selected={selected!}
                      onOpenPartner={(id) => openJokerDetail(id)}
                      engineLabel={labels.engine[c.engine] ?? ENGINE_LABELS[c.engine]}
                    />
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>

      {/* Legend AFTER the list (user request) */}
      {selected && grouped && total > 0 && (
        <div
          className="space-y-1.5 rounded-md border border-border bg-card/40 p-3 text-[11px] text-muted-foreground"
          data-testid="synergy-legend"
        >
          <div className="font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {t("ui.syn.legend")}
          </div>
          {SYNERGY_KIND_ORDER.map((k) => (
            <div key={k} className="flex items-center gap-2">
              <span className={cn("h-3 w-1 rounded-full border-l-2", KIND_ACCENT[k])} />
              <span>{labels.synergyKind[k] ?? SYNERGY_KIND_LABELS[k]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
