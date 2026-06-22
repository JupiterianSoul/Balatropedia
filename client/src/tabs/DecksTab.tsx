import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { DECKS, type Deck } from "@/data/phase3/decks";
import { Phase3Sprite } from "@/components/Phase3Sprite";
import { DifficultyBadge, Chip, JokerSpriteRow } from "@/components/phase3Primitives";
import { SectionLabel } from "@/components/primitives";
import { FilterPill } from "@/components/FilterPills";
import { useRun } from "@/lib/runContext";
import { useOpenDetail } from "@/lib/detailContext";
import { useT } from "@/lib/i18n";

const DIFFS = ["low", "medium", "high"] as const;
const DIFF_LABEL_KEY: Record<string, string> = { low: "ui.tabs.decks_diff_low", medium: "ui.tabs.decks_diff_medium", high: "ui.tabs.decks_diff_high" };
const DIFF_ORDER: Record<string, number> = { low: 0, medium: 1, high: 2 };

export function DecksTab() {
  const { setDeckId } = useRun();
  const { toast } = useToast();
  const openDetail = useOpenDetail();
  const t = useT();
  const [diff, setDiff] = useState<string | null>(null);
  const [sort, setSort] = useState<"name" | "difficulty">("name");

  const decks = useMemo(() => {
    let list = DECKS.filter((d) => !diff || d.difficulty === diff);
    list = [...list].sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name)
        : DIFF_ORDER[a.difficulty] - DIFF_ORDER[b.difficulty] || a.name.localeCompare(b.name),
    );
    return list;
  }, [diff, sort]);

  function useInRun(d: Deck) {
    setDeckId(d.id);
    toast({ title: t("ui.tabs.decks_set"), description: d.name });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-pixel text-xl text-accent">{t("ui.tabs.decks_title")}</h2>
          <p className="text-sm text-muted-foreground">{t("ui.tabs.decks_subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" data-testid="button-sort-decks">
                {t("ui.tabs.decks_sort_prefix", { val: sort === "name" ? t("ui.tabs.decks_sort_name") : t("ui.tabs.decks_sort_difficulty") })}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="text-xs text-muted-foreground">{t("ui.tabs.decks_sort_by")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setSort("name")} data-testid="sort-decks-name">{t("ui.tabs.decks_sort_name")}</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setSort("difficulty")} data-testid="sort-decks-difficulty">{t("ui.tabs.decks_sort_difficulty")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Difficulty filter */}
      <div className="flex flex-wrap gap-1.5">
        <FilterPill label={t("ui.common.all")} active={!diff} onClick={() => setDiff(null)} testId="filter-deck-all" />
        {DIFFS.map((d) => (
          <FilterPill key={d} label={t(DIFF_LABEL_KEY[d])} active={diff === d} onClick={() => setDiff(d)} testId={`filter-deck-${d}`} />
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {decks.map((d) => (
          <div
            key={d.id}
            data-testid={`card-deck-${d.id}`}
            className="casino-card casino-card-interactive flex flex-col gap-2.5 p-4 text-left"
          >
            <button
              type="button"
              onClick={() => openDetail("deck", d.id)}
              data-testid={`button-deck-detail-${d.id}`}
              className="flex items-start gap-3 text-left"
            >
              <Phase3Sprite category="decks" id={d.id} name={d.name} size={96} className="h-24 w-24" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate font-pixel text-base text-accent">{d.name}</h3>
                  <DifficultyBadge difficulty={d.difficulty} />
                </div>
                <p className="mt-1 text-xs leading-relaxed text-foreground/80">{d.effect}</p>
              </div>
            </button>
            <div className="flex flex-wrap gap-1.5">
              {d.buffs.map((b) => <Chip key={b}>{b}</Chip>)}
            </div>
            <div>
              <SectionLabel>{t("ui.tabs.decks_recommended")}</SectionLabel>
              <JokerSpriteRow ids={d.recommendedJokers.slice(0, 6)} />
            </div>
            <Button
              size="sm"
              variant="outline"
              className="mt-auto w-full gap-1.5"
              onClick={() => useInRun(d)}
              data-testid={`button-use-deck-${d.id}`}
            >
              <Check className="h-4 w-4" /> {t("ui.btn.use_in_run")}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
