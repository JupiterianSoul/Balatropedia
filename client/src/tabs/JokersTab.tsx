import { useMemo, useState } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { useApp } from "@/lib/appContext";
import {
  JOKERS, ARCHETYPES,
  ALL_ROLES, ALL_HANDS, ALL_SCALINGS, ALL_STAGES, ALL_LEVELS, synergyDensity,
  ALL_RARITIES, RARITY_SORT_RANK, beginnerScore,
  Role, HandType, Scaling, Stage, Level, Archetype, Rarity,
} from "@/lib/helpers";
import { JokerCard } from "@/components/JokerCard";
import { FilterPill, PillGroup } from "@/components/FilterPills";
import { useT, useLabels, useI18n, getGameText } from "@/lib/i18n";
import { useIsMobile } from "@/hooks/use-mobile";

type SortKey = "name" | "beginner" | "setup" | "synergy" | "rarity";
const LEVEL_RANK: Record<Level, number> = { low: 0, med: 1, high: 2 };

function toggle<T>(set: Set<T>, v: T): Set<T> {
  const next = new Set(set);
  next.has(v) ? next.delete(v) : next.add(v);
  return next;
}

export function JokersTab() {
  const { notes } = useApp();
  const t = useT();
  const labels = useLabels();
  const { lang } = useI18n();
  const isMobile = useIsMobile();
  const [query, setQuery] = useState("");
  const [searchSheetOpen, setSearchSheetOpen] = useState(false);
  const [roles, setRoles] = useState<Set<Role>>(new Set());
  const [rarities, setRarities] = useState<Set<Rarity>>(new Set());
  const [archs, setArchs] = useState<Set<Archetype>>(new Set());
  const [hands, setHands] = useState<Set<HandType>>(new Set());
  const [scalings, setScalings] = useState<Set<Scaling>>(new Set());
  const [stages, setStages] = useState<Set<Stage>>(new Set());
  const [risks, setRisks] = useState<Set<Level>>(new Set());
  const [sort, setSort] = useState<SortKey>("name");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeCount = roles.size + rarities.size + archs.size + hands.size + scalings.size + stages.size + risks.size;

  function clearAll() {
    setRoles(new Set()); setRarities(new Set()); setArchs(new Set()); setHands(new Set());
    setScalings(new Set()); setStages(new Set()); setRisks(new Set());
    setQuery("");
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = JOKERS.filter((j) => {
      if (q) {
        const note = (notes[`joker:${j.id}`] ?? "").toLowerCase();
        // Search by effect text: localized name + effect + English fallback.
        // Covers "+Mult", "X Mult", "Chips", "chance", "$" so users can find
        // e.g. "xmult" or "in chance" across all 150 jokers.
        const gameLocal = getGameText(lang, "jokers", j.id);
        const gameEn = lang === "en" ? gameLocal : getGameText("en", "jokers", j.id);
        const hay = [
          j.name, j.summary, j.notes, note,
          gameLocal.name, gameLocal.text,
          gameEn.name, gameEn.text,
        ].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (roles.size && !j.tags.some((t) => roles.has(t)) && !roles.has(j.mainRole)) return false;
      if (rarities.size && !(j.rarity && rarities.has(j.rarity))) return false;
      if (archs.size && !j.archetypes.some((a) => archs.has(a))) return false;
      if (hands.size && !j.hands.some((h) => hands.has(h))) return false;
      if (scalings.size && !scalings.has(j.scaling)) return false;
      if (stages.size && !j.stage.some((s) => stages.has(s))) return false;
      if (risks.size && !risks.has(j.risk)) return false;
      return true;
    });

    const sorted = [...list];
    if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "beginner") sorted.sort((a, b) => beginnerScore(a) - beginnerScore(b) || a.name.localeCompare(b.name));
    else if (sort === "setup") sorted.sort((a, b) => LEVEL_RANK[b.setupDifficulty] - LEVEL_RANK[a.setupDifficulty] || a.name.localeCompare(b.name));
    else if (sort === "synergy") sorted.sort((a, b) => synergyDensity(b) - synergyDensity(a) || a.name.localeCompare(b.name));
    else if (sort === "rarity") sorted.sort((a, b) => {
      const ra = a.rarity ? RARITY_SORT_RANK[a.rarity] : 99;
      const rb = b.rarity ? RARITY_SORT_RANK[b.rarity] : 99;
      return ra - rb || a.name.localeCompare(b.name);
    });
    return sorted;
  }, [query, roles, rarities, archs, hands, scalings, stages, risks, sort, notes]);

  const desktopInput = (
    <div className="relative flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("ui.tabs.library_search_ph")}
        data-testid="input-search-jokers"
        className="bg-card pl-9"
      />
    </div>
  );

  const mobileSearchTrigger = (
    <Sheet open={searchSheetOpen} onOpenChange={setSearchSheetOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="flex flex-1 items-center gap-2 rounded-md border-2 border-black bg-card px-3 py-2 text-left text-sm text-muted-foreground shadow-[2px_2px_0_hsl(198_18%_4%)] hover:bg-card/80"
          data-testid="button-mobile-search"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="truncate">
            {query.trim() ? <span className="text-foreground">{query}</span> : t("ui.tabs.library_search_ph")}
          </span>
          {query.trim() && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); setQuery(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); setQuery(""); } }}
              className="ml-auto inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-sm hover:bg-white/10"
              data-testid="button-mobile-search-clear"
              aria-label={t("ui.btn.clear")}
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="max-h-[60dvh] border-t-4 border-black bg-[hsl(178_14%_13%)] font-pixel"
        data-testid="sheet-mobile-search"
      >
        <SheetHeader className="border-b-2 border-black pb-3 text-left">
          <SheetTitle className="font-display text-lg">
            {t("ui.tabs.library_search_title")}
          </SheetTitle>
        </SheetHeader>
        <div className="space-y-3 pt-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("ui.tabs.library_search_ph")}
              data-testid="input-mobile-search-jokers"
              className="bg-card pl-9 text-base"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            {t("ui.tabs.library_search_hint")}
          </p>
          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <Button variant="outline" onClick={() => setQuery("")} data-testid="button-mobile-search-reset">
              {t("ui.btn.clear")}
            </Button>
            <Button
              onClick={() => setSearchSheetOpen(false)}
              data-testid="button-mobile-search-apply"
              disabled={filtered.length === 0}
            >
              {filtered.length === 0
                ? t("ui.tabs.library_search_no_results")
                : t("ui.tabs.library_search_results", { n: filtered.length })}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <div className="space-y-5">
      {}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {isMobile ? mobileSearchTrigger : desktopInput}
        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="w-full bg-card sm:w-56" data-testid="select-sort">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">{t("ui.tabs.library_sort_name")}</SelectItem>
            <SelectItem value="beginner">{t("ui.tabs.library_sort_beginner")}</SelectItem>
            <SelectItem value="setup">{t("ui.tabs.library_sort_setup")}</SelectItem>
            <SelectItem value="synergy">{t("ui.tabs.library_sort_synergy")}</SelectItem>
            <SelectItem value="rarity">{t("ui.tabs.library_sort_rarity")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {}
      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
        <div className="flex items-center justify-between">
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2" data-testid="button-toggle-filters">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {t("ui.filters.filters")} {activeCount > 0 && <span className="rounded-full bg-accent px-1.5 text-[10px] font-bold text-accent-foreground tabular">{activeCount}</span>}
            </Button>
          </CollapsibleTrigger>
          {activeCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAll} className="gap-1 text-muted-foreground" data-testid="button-clear-filters">
              <X className="h-3.5 w-3.5" /> {t("ui.btn.clear_all")}
            </Button>
          )}
        </div>
        <CollapsibleContent className="mt-3 space-y-4 rounded-md border border-border bg-card/50 p-4">
          <PillGroup title={t("ui.filters.rarity")}>
            {ALL_RARITIES.map((r) => (
              <FilterPill key={r} label={labels.rarity[r]} active={rarities.has(r)} onClick={() => setRarities(toggle(rarities, r))} testId={`pill-rarity-${r}`} />
            ))}
          </PillGroup>
          <PillGroup title={t("ui.filters.role")}>
            {ALL_ROLES.map((r) => (
              <FilterPill key={r} label={labels.role[r]} active={roles.has(r)} onClick={() => setRoles(toggle(roles, r))} testId={`pill-role-${r}`} />
            ))}
          </PillGroup>
          <PillGroup title={t("ui.filters.archetype")}>
            {ARCHETYPES.map((a) => (
              <FilterPill key={a.id} label={labels.archetype[a.id] ?? a.name} active={archs.has(a.id)} onClick={() => setArchs(toggle(archs, a.id))} testId={`pill-arch-${a.id}`} />
            ))}
          </PillGroup>
          <PillGroup title={t("ui.filters.hand_type")}>
            {ALL_HANDS.map((h) => (
              <FilterPill key={h} label={labels.hand[h]} active={hands.has(h)} onClick={() => setHands(toggle(hands, h))} testId={`pill-hand-${h}`} />
            ))}
          </PillGroup>
          <div className="grid gap-4 sm:grid-cols-3">
            <PillGroup title={t("ui.filters.scaling")}>
              {ALL_SCALINGS.map((s) => (
                <FilterPill key={s} label={labels.scaling[s]} active={scalings.has(s)} onClick={() => setScalings(toggle(scalings, s))} testId={`pill-scaling-${s}`} />
              ))}
            </PillGroup>
            <PillGroup title={t("ui.filters.build_stage")}>
              {ALL_STAGES.map((s) => (
                <FilterPill key={s} label={labels.stage[s]} active={stages.has(s)} onClick={() => setStages(toggle(stages, s))} testId={`pill-stage-${s}`} />
              ))}
            </PillGroup>
            <PillGroup title={t("ui.filters.risk_level")}>
              {ALL_LEVELS.map((l) => (
                <FilterPill key={l} label={labels.level[l]} active={risks.has(l)} onClick={() => setRisks(toggle(risks, l))} testId={`pill-risk-${l}`} />
              ))}
            </PillGroup>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span data-testid="text-result-count" className="tabular">{t("ui.tabs.library_result_count", { shown: filtered.length, total: JOKERS.length })}</span>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted-foreground">{t("ui.tabs.library_empty")}</p>
          <Button variant="outline" size="sm" onClick={clearAll} data-testid="button-empty-clear">{t("ui.btn.clear_all")}</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((j) => (
            <JokerCard key={j.id} joker={j} />
          ))}
        </div>
      )}
    </div>
  );
}

