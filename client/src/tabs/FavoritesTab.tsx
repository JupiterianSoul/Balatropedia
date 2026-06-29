import { Star, StickyNote } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/lib/appContext";
import { JOKER_MAP, COMBOS, ARCHETYPE_LABELS, type Joker } from "@/lib/helpers";
import { RarityBadge, StarToggle, RiskBadge, StageBadge } from "@/components/primitives";
import { JokerSprite } from "@/components/JokerSprite";
import { LName } from "@/components/Localized";
import { FormattedBalatroText } from "@/lib/balatroText";
import { useT, useLabels, useCuratedText, useGameText, useI18n } from "@/lib/i18n";
import { playSound } from "@/lib/sound";
import { useState } from "react";

function EmptyState() {
  const t = useT();
  return (
    <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-border py-16 text-center">
      <Star className="h-6 w-6 text-muted-foreground" />
      <p className="max-w-md text-sm text-muted-foreground">
        {t("ui.tabs.fav_empty")}
      </p>
    </div>
  );
}

interface JokerFavRowProps {
  j: Joker;
  initialNote: string;
  onNoteCommit: (v: string) => void;
  onUnfavorite: () => void;
  onOpen: () => void;
  notePlaceholder: string;
  expandLabel: string;
  collapseLabel: string;
}

function JokerFavRow({
  j, initialNote,
  onNoteCommit, onUnfavorite, onOpen,
  notePlaceholder, expandLabel, collapseLabel,
}: JokerFavRowProps) {
  const localized = useGameText("jokers", j.id);
  const { lang } = useI18n();
  const displayName = localized.name || j.name;
  const hasNote = Boolean(initialNote);
  const [noteOpen, setNoteOpen] = useState(hasNote);

  return (
    <div
      className="balatro-card balatro-hover group flex cursor-pointer flex-col p-2 transition-transform sm:p-3.5"
      data-balatro-card="joker"
      data-testid={`fav-joker-${j.id}`}
      data-sound="card_place"
      onClick={() => onOpen()}
      onMouseEnter={() => playSound("hover")}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      {j.rarity && (
        <div className="mb-1.5">
          <RarityBadge rarity={j.rarity} />
        </div>
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-1.5 sm:gap-2.5">
          <JokerSprite jokerId={j.id} name={displayName} size={44} />
          <h3 className="min-w-0 font-display text-[13px] font-bold leading-tight gold-text sm:text-base">
            <LName category="jokers" id={j.id} fallback={j.name} />
          </h3>
        </div>
        <StarToggle
          active
          onToggle={onUnfavorite}
          testId={`fav-remove-joker-${j.id}`}
        />
      </div>

      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-foreground/80 small-caps">
        <FormattedBalatroText text={localized.text || j.summary} id={j.id} lang={lang} />
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border pt-2.5">
        {j.stage.map((s) => (
          <StageBadge key={s} stage={s} />
        ))}
        <RiskBadge level={j.risk} />
        <button
          type="button"
          data-sound="toggle_on"
          onClick={(e) => { e.stopPropagation(); setNoteOpen((o) => !o); }}
          className="ml-auto inline-flex items-center gap-1 rounded-md border border-border bg-card/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
          data-testid={`fav-note-toggle-joker-${j.id}`}
          aria-expanded={noteOpen}
        >
          <StickyNote className="h-3 w-3" />
          {hasNote ? "•" : ""}
          {noteOpen ? collapseLabel : expandLabel}
        </button>
      </div>

      {noteOpen && (
        <div onClick={(e) => e.stopPropagation()}>
          <Textarea
            key={`favnote-${j.id}`}
            defaultValue={initialNote}
            onBlur={(e) => onNoteCommit(e.target.value)}
            placeholder={notePlaceholder}
            rows={2}
            className="mt-3 resize-none bg-background text-sm"
            data-testid={`fav-note-joker-${j.id}`}
          />
        </div>
      )}
    </div>
  );
}

interface ComboFavRowProps {
  c: typeof COMBOS[number];
  archLabel: string;
  noteValue: string;
  onNoteChange: (v: string) => void;
  onUnfavorite: () => void;
  notePlaceholder: string;
  expandLabel: string;
  collapseLabel: string;
}

function ComboFavRow({
  c, archLabel, noteValue, onNoteChange, onUnfavorite, notePlaceholder,
  expandLabel, collapseLabel,
}: ComboFavRowProps) {
  const title = useCuratedText(`ui.combo.${c.id}.title`, c.title);
  const hasNote = Boolean(noteValue);
  const [noteOpen, setNoteOpen] = useState(hasNote);
  const jokers = [...(c.core ?? []), ...(c.optional ?? [])].map((id) => JOKER_MAP[id]).filter(Boolean) as Joker[];

  return (
    <div className="balatro-card p-4" data-testid={`fav-combo-${c.id}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="font-pixel text-base text-accent">{title}</span>
          <span className="ml-2 inline-block rounded-full border border-[hsl(145_35%_40%)]/40 bg-primary/15 px-2 py-0.5 text-[11px] text-[hsl(145_45%_62%)]">
            {archLabel}
          </span>
        </div>
        <StarToggle active onToggle={onUnfavorite} testId={`fav-remove-combo-${c.id}`} />
      </div>

      {jokers.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {jokers.map((j) => (
            <div
              key={j.id}
              className="flex items-center gap-1.5 rounded-md border border-border bg-card/60 px-2 py-1"
              data-testid={`fav-combo-${c.id}-joker-${j.id}`}
            >
              <JokerSprite jokerId={j.id} name={j.name} size={32} />
              <span className="font-display text-xs">
                <LName category="jokers" id={j.id} fallback={j.name} />
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-end border-t border-border pt-2.5">
        <button
          type="button"
          data-sound="toggle_on"
          onClick={() => setNoteOpen((o) => !o)}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-card/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
          data-testid={`fav-note-toggle-combo-${c.id}`}
          aria-expanded={noteOpen}
        >
          <StickyNote className="h-3 w-3" />
          {hasNote ? "•" : ""}
          {noteOpen ? collapseLabel : expandLabel}
        </button>
      </div>

      {noteOpen && (
        <Textarea
          value={noteValue}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder={notePlaceholder}
          rows={2}
          className="mt-3 resize-none bg-background text-sm"
          data-testid={`fav-note-combo-${c.id}`}
        />
      )}
    </div>
  );
}

export function FavoritesTab() {
  const {
    favoriteJokers, favoriteCombos, notes, setNote,
    toggleFavoriteJoker, toggleFavoriteCombo, openJokerDetail,
    favoriteNote, setFavoriteNote,
  } = useApp();
  const t = useT();
  const labels = useLabels();

  const jokerList = Array.from(favoriteJokers).map((id) => JOKER_MAP[id]).filter(Boolean) as Joker[];
  const comboList = COMBOS.filter((c) => favoriteCombos.has(c.id));

  const expandLabel = t("ui.tabs.fav_show_note");
  const collapseLabel = t("ui.tabs.fav_hide_note");
  const notePlaceholder = t("ui.tabs.fav_add_saved_note");

  return (
    <Tabs defaultValue="jokers" className="space-y-4 p-2 md:p-4">
      <TabsList className="sticky top-[60px] z-[5] md:static gap-2" data-testid="tabs-favorites">
        <TabsTrigger value="jokers" data-testid="tab-fav-jokers" className="balatro-tab">
          {t("ui.tabs.fav_jokers")} <span className="ml-1.5 tabular text-xs text-muted-foreground">{jokerList.length}</span>
        </TabsTrigger>
        <TabsTrigger value="combos" data-testid="tab-fav-combos" className="balatro-tab">
          {t("ui.tabs.fav_combos")} <span className="ml-1.5 tabular text-xs text-muted-foreground">{comboList.length}</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="jokers" className="space-y-3">
        {jokerList.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3">
            {jokerList.map((j) => (
              <JokerFavRow
                key={j.id}
                j={j}
                initialNote={favoriteNote(j.id) ?? ""}
                onNoteCommit={(v) => setFavoriteNote(j.id, v)}
                onUnfavorite={() => toggleFavoriteJoker(j.id)}
                onOpen={() => openJokerDetail(j.id)}
                notePlaceholder={notePlaceholder}
                expandLabel={expandLabel}
                collapseLabel={collapseLabel}
              />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="combos" className="space-y-3">
        {comboList.length === 0 ? <EmptyState /> : comboList.map((c) => (
          <ComboFavRow
            key={c.id}
            c={c}
            archLabel={labels.archetype[c.archetype] ?? ARCHETYPE_LABELS[c.archetype] ?? c.archetype}
            noteValue={notes[`combo:${c.id}`] ?? ""}
            onNoteChange={(v) => setNote(`combo:${c.id}`, v)}
            onUnfavorite={() => toggleFavoriteCombo(c.id)}
            notePlaceholder={t("ui.tabs.fav_add_session_note")}
            expandLabel={expandLabel}
            collapseLabel={collapseLabel}
          />
        ))}
      </TabsContent>
    </Tabs>
  );
}

