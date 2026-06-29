import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TAROTS } from "@/data/phase3/tarots";
import { PLANETS } from "@/data/phase3/planets";
import { SPECTRALS } from "@/data/phase3/spectrals";
import { Phase3Sprite } from "@/components/Phase3Sprite";
import { Chip, RiskBadgeP3, JokerSpriteRow, SearchInput } from "@/components/phase3Primitives";
import { SectionLabel } from "@/components/primitives";
import { LName, LText } from "@/components/Localized";
import { humanize } from "@/lib/utils";
import { useOpenDetail } from "@/lib/detailContext";
import { useT } from "@/lib/i18n";
import type { EntityKind } from "@/lib/entities";

function EntityHeader({
  kind, id, category, name, size = 64, children,
}: {
  kind: EntityKind; id: string; category: string; name: string; size?: number; children?: React.ReactNode;
}) {
  const openDetail = useOpenDetail();
  return (
    <button
      type="button"
      onClick={() => openDetail(kind, id)}
      data-testid={`button-${kind}-detail-${id}`}
      className="flex w-full items-start gap-3 text-left"
    >
      <Phase3Sprite category={category as any} id={id} name={name} size={size} className="h-16 w-16" />
      <div className="min-w-0 flex-1">{children}</div>
    </button>
  );
}

const TAROT_CAT_KEY: Record<string, string> = {
  card_modify: "ui.cons.cat_card_modify",
  economy: "ui.cons.cat_economy",
  scaling: "ui.cons.cat_scaling",
  utility: "ui.cons.cat_utility",
  consumable_gen: "ui.cons.cat_consumable_gen",
};

function CardShell({ children, testId }: { children: React.ReactNode; testId: string }) {
  return (
    <div className="casino-card flex flex-col gap-2.5 p-4" data-testid={testId}>{children}</div>
  );
}

function TarotsGrid() {
  const [q, setQ] = useState("");
  const tr = useT();
  const list = useMemo(
    () => TAROTS.filter((t) => t.name.toLowerCase().includes(q.trim().toLowerCase())),
    [q],
  );
  return (
    <div className="space-y-4">
      <div className="max-w-sm"><SearchInput value={q} onChange={setQ} placeholder={tr("ui.cons.search_tarots")} testId="search-tarots" /></div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((t) => (
          <CardShell key={t.id} testId={`card-tarot-${t.id}`}>
            <EntityHeader kind="tarot" id={t.id} category="tarots" name={t.name}>
              <h3 className="font-display text-sm text-accent"><LName category="tarots" id={t.id} fallback={t.name} /></h3>
              <Chip className="mt-1 border-accent/30 bg-accent/10 text-accent">{TAROT_CAT_KEY[t.category] ? tr(TAROT_CAT_KEY[t.category]) : humanize(t.category)}</Chip>
            </EntityHeader>
            <LText category="tarots" id={t.id} fallback={t.effect} as="p" className="text-xs leading-relaxed text-foreground/85" />
            <div>
              <SectionLabel>{tr("ui.cons.when_to_use")}</SectionLabel>
              <p className="text-xs leading-relaxed text-foreground/70">{t.whenToUse}</p>
            </div>
            <div>
              <SectionLabel>{tr("ui.cons.best_with")}</SectionLabel>
              <JokerSpriteRow ids={t.bestWith} size={28} />
            </div>
          </CardShell>
        ))}
      </div>
    </div>
  );
}

function PlanetsGrid() {
  const [q, setQ] = useState("");
  const t = useT();
  const list = useMemo(
    () => PLANETS.filter((p) => p.name.toLowerCase().includes(q.trim().toLowerCase())),
    [q],
  );
  return (
    <div className="space-y-4">
      <div className="max-w-sm"><SearchInput value={q} onChange={setQ} placeholder={t("ui.cons.search_planets")} testId="search-planets" /></div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => (
          <CardShell key={p.id} testId={`card-planet-${p.id}`}>
            <EntityHeader kind="planet" id={p.id} category="planets" name={p.name}>
              <h3 className="font-display text-sm text-accent"><LName category="planets" id={p.id} fallback={p.name} /></h3>
              <p className="mt-0.5 text-xs text-muted-foreground">{t("ui.cons.buffs")} <span className="text-foreground/80">{p.hand}</span></p>
            </EntityHeader>
            <span className="inline-flex w-fit items-center rounded-sm border border-accent/40 bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent tabular">
              {t("ui.cons.per_level", { chips: p.chipsPerLevel, mult: p.multPerLevel })}
            </span>
            <p className="text-xs leading-relaxed text-foreground/70">{p.scalingNotes}</p>
            <div>
              <SectionLabel>{t("ui.cons.best_with")}</SectionLabel>
              <JokerSpriteRow ids={p.bestWith} size={28} />
            </div>
          </CardShell>
        ))}
      </div>
    </div>
  );
}

function SpectralsGrid() {
  const [q, setQ] = useState("");
  const t = useT();
  const list = useMemo(
    () => SPECTRALS.filter((s) => s.name.toLowerCase().includes(q.trim().toLowerCase())),
    [q],
  );
  return (
    <div className="space-y-4">
      <div className="max-w-sm"><SearchInput value={q} onChange={setQ} placeholder={t("ui.cons.search_spectrals")} testId="search-spectrals" /></div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((s) => (
          <CardShell key={s.id} testId={`card-spectral-${s.id}`}>
            <EntityHeader kind="spectral" id={s.id} category="spectrals" name={s.name}>
              <div className="flex items-center justify-between gap-2">
                <h3 className="truncate font-display text-sm text-accent"><LName category="spectrals" id={s.id} fallback={s.name} /></h3>
                <RiskBadgeP3 risk={s.risk} />
              </div>
            </EntityHeader>
            <LText category="spectrals" id={s.id} fallback={s.effect} as="p" className="text-xs leading-relaxed text-foreground/85" />
            <div>
              <SectionLabel>{t("ui.cons.sequencing")}</SectionLabel>
              <p className="text-xs leading-relaxed text-foreground/70">{s.sequencing}</p>
            </div>
            <div>
              <SectionLabel>{t("ui.cons.best_with")}</SectionLabel>
              <JokerSpriteRow ids={s.bestWith} size={28} />
            </div>
          </CardShell>
        ))}
      </div>
    </div>
  );
}

export function ConsumablesTab() {
  const t = useT();
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl text-accent">{t("ui.cons.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("ui.cons.subtitle")}</p>
      </div>
      <Tabs defaultValue="tarots">
        <TabsList data-testid="tabs-consumables" className="gap-2">
          <TabsTrigger value="tarots" data-testid="subtab-tarots" className="balatro-tab">{t("ui.cons.tab_tarots")} <span className="ml-1 tabular text-muted-foreground">22</span></TabsTrigger>
          <TabsTrigger value="planets" data-testid="subtab-planets" className="balatro-tab">{t("ui.cons.tab_planets")} <span className="ml-1 tabular text-muted-foreground">12</span></TabsTrigger>
          <TabsTrigger value="spectrals" data-testid="subtab-spectrals" className="balatro-tab">{t("ui.cons.tab_spectrals")} <span className="ml-1 tabular text-muted-foreground">18</span></TabsTrigger>
        </TabsList>
        <TabsContent value="tarots" className="mt-4"><TarotsGrid /></TabsContent>
        <TabsContent value="planets" className="mt-4"><PlanetsGrid /></TabsContent>
        <TabsContent value="spectrals" className="mt-4"><SpectralsGrid /></TabsContent>
      </Tabs>
    </div>
  );
}

