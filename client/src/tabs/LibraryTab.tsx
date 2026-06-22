import { useMemo, useState } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useApp } from "@/lib/appContext";
import {
  JOKERS, ARCHETYPES, ROLE_LABELS, HAND_LABELS, SCALING_LABELS, STAGE_LABELS, LEVEL_LABELS,
  ALL_ROLES, ALL_HANDS, ALL_SCALINGS, ALL_STAGES, ALL_LEVELS, synergyDensity,
  Role, HandType, Scaling, Stage, Level, Archetype,
} from "@/lib/helpers";
import { JokerCard } from "@/components/JokerCard";
import { FilterPill, PillGroup } from "@/components/FilterPills";

type SortKey = "name" | "beginner" | "setup" | "synergy";
const LEVEL_RANK: Record<Level, number> = { low: 0, med: 1, high: 2 };

function toggle<T>(set: Set<T>, v: T): Set<T> {
  const next = new Set(set);
  next.has(v) ? next.delete(v) : next.add(v);
  return next;
}

export function LibraryTab() {
  const { notes } = useApp();
  const [query, setQuery] = useState("");
  const [roles, setRoles] = useState<Set<Role>>(new Set());
  const [archs, setArchs] = useState<Set<Archetype>>(new Set());
  const [hands, setHands] = useState<Set<HandType>>(new Set());
  const [scalings, setScalings] = useState<Set<Scaling>>(new Set());
  const [stages, setStages] = useState<Set<Stage>>(new Set());
  const [risks, setRisks] = useState<Set<Level>>(new Set());
  const [sort, setSort] = useState<SortKey>("name");
  const [filtersOpen, setFiltersOpen] = useState(true);

  const activeCount = roles.size + archs.size + hands.size + scalings.size + stages.size + risks.size;

  function clearAll() {
    setRoles(new Set()); setArchs(new Set()); setHands(new Set());
    setScalings(new Set()); setStages(new Set()); setRisks(new Set());
    setQuery("");
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = JOKERS.filter((j) => {
      if (q) {
        const note = (notes[`joker:${j.id}`] ?? "").toLowerCase();
        const hay = `${j.name} ${j.summary} ${j.notes} ${note}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (roles.size && !j.tags.some((t) => roles.has(t)) && !roles.has(j.mainRole)) return false;
      if (archs.size && !j.archetypes.some((a) => archs.has(a))) return false;
      if (hands.size && !j.hands.some((h) => hands.has(h))) return false;
      if (scalings.size && !scalings.has(j.scaling)) return false;
      if (stages.size && !j.stage.some((s) => stages.has(s))) return false;
      if (risks.size && !risks.has(j.risk)) return false;
      return true;
    });

    const sorted = [...list];
    if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "beginner") sorted.sort((a, b) => LEVEL_RANK[a.setupDifficulty] - LEVEL_RANK[b.setupDifficulty] || a.name.localeCompare(b.name));
    else if (sort === "setup") sorted.sort((a, b) => LEVEL_RANK[b.setupDifficulty] - LEVEL_RANK[a.setupDifficulty] || a.name.localeCompare(b.name));
    else if (sort === "synergy") sorted.sort((a, b) => synergyDensity(b) - synergyDensity(a) || a.name.localeCompare(b.name));
    return sorted;
  }, [query, roles, archs, hands, scalings, stages, risks, sort, notes]);

  return (
    <div className="space-y-5">
      {/* Search + sort row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Jokers by name, effect, or note…"
            data-testid="input-search-jokers"
            className="bg-card pl-9"
          />
        </div>
        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="w-full bg-card sm:w-56" data-testid="select-sort">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Sort: Name (A–Z)</SelectItem>
            <SelectItem value="beginner">Sort: Beginner-friendly</SelectItem>
            <SelectItem value="setup">Sort: Setup difficulty</SelectItem>
            <SelectItem value="synergy">Sort: Synergy density</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Filters */}
      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
        <div className="flex items-center justify-between">
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2" data-testid="button-toggle-filters">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters {activeCount > 0 && <span className="rounded-full bg-accent px-1.5 text-[10px] font-bold text-accent-foreground tabular">{activeCount}</span>}
            </Button>
          </CollapsibleTrigger>
          {activeCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAll} className="gap-1 text-muted-foreground" data-testid="button-clear-filters">
              <X className="h-3.5 w-3.5" /> Clear all
            </Button>
          )}
        </div>
        <CollapsibleContent className="mt-3 space-y-4 rounded-md border border-border bg-card/50 p-4">
          <PillGroup title="Role">
            {ALL_ROLES.map((r) => (
              <FilterPill key={r} label={ROLE_LABELS[r]} active={roles.has(r)} onClick={() => setRoles(toggle(roles, r))} testId={`pill-role-${r}`} />
            ))}
          </PillGroup>
          <PillGroup title="Archetype">
            {ARCHETYPES.map((a) => (
              <FilterPill key={a.id} label={a.name} active={archs.has(a.id)} onClick={() => setArchs(toggle(archs, a.id))} testId={`pill-arch-${a.id}`} />
            ))}
          </PillGroup>
          <PillGroup title="Hand type">
            {ALL_HANDS.map((h) => (
              <FilterPill key={h} label={HAND_LABELS[h]} active={hands.has(h)} onClick={() => setHands(toggle(hands, h))} testId={`pill-hand-${h}`} />
            ))}
          </PillGroup>
          <div className="grid gap-4 sm:grid-cols-3">
            <PillGroup title="Scaling">
              {ALL_SCALINGS.map((s) => (
                <FilterPill key={s} label={SCALING_LABELS[s]} active={scalings.has(s)} onClick={() => setScalings(toggle(scalings, s))} testId={`pill-scaling-${s}`} />
              ))}
            </PillGroup>
            <PillGroup title="Build stage">
              {ALL_STAGES.map((s) => (
                <FilterPill key={s} label={STAGE_LABELS[s]} active={stages.has(s)} onClick={() => setStages(toggle(stages, s))} testId={`pill-stage-${s}`} />
              ))}
            </PillGroup>
            <PillGroup title="Risk level">
              {ALL_LEVELS.map((l) => (
                <FilterPill key={l} label={LEVEL_LABELS[l]} active={risks.has(l)} onClick={() => setRisks(toggle(risks, l))} testId={`pill-risk-${l}`} />
              ))}
            </PillGroup>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Results */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span data-testid="text-result-count" className="tabular">{filtered.length} of {JOKERS.length} Jokers</span>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted-foreground">No Jokers match these filters. Try clearing some pills.</p>
          <Button variant="outline" size="sm" onClick={clearAll} data-testid="button-empty-clear">Clear all</Button>
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
