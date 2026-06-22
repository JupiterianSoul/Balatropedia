import { Star } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/lib/appContext";
import { JOKER_MAP, COMBOS, ARCHETYPE_LABELS } from "@/lib/helpers";
import { StarToggle } from "@/components/primitives";

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-border py-16 text-center">
      <Star className="h-6 w-6 text-muted-foreground" />
      <p className="max-w-md text-sm text-muted-foreground">
        No favorites yet. Star Jokers and Combos to save them here. Notes are kept in this session only — they'll reset on refresh.
      </p>
    </div>
  );
}

export function FavoritesTab() {
  const {
    favoriteJokers, favoriteCombos, notes, setNote,
    toggleFavoriteJoker, toggleFavoriteCombo, openJokerDetail,
  } = useApp();

  const jokerList = Array.from(favoriteJokers).map((id) => JOKER_MAP[id]).filter(Boolean);
  const comboList = COMBOS.filter((c) => favoriteCombos.has(c.id));

  return (
    <Tabs defaultValue="jokers" className="space-y-4">
      <TabsList data-testid="tabs-favorites">
        <TabsTrigger value="jokers" data-testid="tab-fav-jokers">
          Jokers <span className="ml-1.5 tabular text-xs text-muted-foreground">{jokerList.length}</span>
        </TabsTrigger>
        <TabsTrigger value="combos" data-testid="tab-fav-combos">
          Combos <span className="ml-1.5 tabular text-xs text-muted-foreground">{comboList.length}</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="jokers" className="space-y-3">
        {jokerList.length === 0 ? <EmptyState /> : jokerList.map((j) => (
          <div key={j!.id} className="casino-card p-4" data-testid={`fav-joker-${j!.id}`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <button onClick={() => openJokerDetail(j!.id)} className="font-display text-base text-accent hover:underline">{j!.name}</button>
                <p className="mt-0.5 text-xs text-foreground/75 small-caps">{j!.summary}</p>
              </div>
              <StarToggle active onToggle={() => toggleFavoriteJoker(j!.id)} testId={`fav-remove-joker-${j!.id}`} />
            </div>
            <Textarea
              value={notes[`joker:${j!.id}`] ?? ""}
              onChange={(e) => setNote(`joker:${j!.id}`, e.target.value)}
              placeholder="Add a note (session only)…"
              rows={2}
              className="mt-3 resize-none bg-background text-sm"
              data-testid={`fav-note-joker-${j!.id}`}
            />
          </div>
        ))}
      </TabsContent>

      <TabsContent value="combos" className="space-y-3">
        {comboList.length === 0 ? <EmptyState /> : comboList.map((c) => (
          <div key={c.id} className="casino-card p-4" data-testid={`fav-combo-${c.id}`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-display text-base text-accent">{c.title}</span>
                <span className="ml-2 rounded-full border border-[hsl(145_35%_40%)]/40 bg-primary/15 px-2 py-0.5 text-[11px] text-[hsl(145_45%_62%)]">
                  {ARCHETYPE_LABELS[c.archetype] ?? c.archetype}
                </span>
              </div>
              <StarToggle active onToggle={() => toggleFavoriteCombo(c.id)} testId={`fav-remove-combo-${c.id}`} />
            </div>
            <Textarea
              value={notes[`combo:${c.id}`] ?? ""}
              onChange={(e) => setNote(`combo:${c.id}`, e.target.value)}
              placeholder="Add a note (session only)…"
              rows={2}
              className="mt-3 resize-none bg-background text-sm"
              data-testid={`fav-note-combo-${c.id}`}
            />
          </div>
        ))}
      </TabsContent>
    </Tabs>
  );
}
