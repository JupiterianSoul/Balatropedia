import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { Search, Compass, Sparkles, ArrowRight, X } from "lucide-react";
import { useT } from "@/lib/i18n";
import { JOKERS, SYNERGIES, COMBOS, ARCHETYPES, JOKER_MAP } from "@/lib/helpers";
import { TAROTS } from "@/data/phase3/tarots";
import { PLANETS } from "@/data/phase3/planets";
import { SPECTRALS } from "@/data/phase3/spectrals";
import { VOUCHERS } from "@/data/phase3/vouchers";
import { DECKS } from "@/data/phase3/decks";
import { STAKES } from "@/data/phase3/stakes";
import { ENHANCEMENTS, EDITIONS, SEALS, TAGS } from "@/data/phase3/misc";
import { BOSSES } from "@/data/bosses";
import { getSpriteUrl } from "@/lib/sprites";
import { useOpenDetail } from "@/lib/detailContext";
import { setHandoff } from "@/lib/tabHandoff";
import type { EntityKind } from "@/lib/entities";

interface HomeTabProps {
  onNavigate: (tab: string) => void;
}

// Description i18n keys, picked at random per mount.
const DESC_KEYS = [
  "ui.home.desc_1",
  "ui.home.desc_2",
  "ui.home.desc_3",
  "ui.home.desc_4",
  "ui.home.desc_5",
  "ui.home.desc_6",
];

// All discoverable tabs (excludes home itself).
const DISCOVER_TABS = [
  "myrun", "runchallenge",
  "synergies", "combos", "archetypes", "tierlist", "compare", "skeleton",
  "jokers", "decks", "stakes", "bosses", "vouchers", "consumables", "modifiers",
  "heatmap", "glossary", "whatsnew", "help", "about", "settings",
];

const VISITED_KEY = "balatropedia.visitedTabs";

type SearchHitKind =
  | "joker"
  | "synergy"
  | "combo"
  | "archetype"
  | "tarot"
  | "planet"
  | "spectral"
  | "voucher"
  | "deck"
  | "stake"
  | "enhancement"
  | "edition"
  | "seal"
  | "tag"
  | "boss";

interface SearchHit {
  kind: SearchHitKind;
  id: string;
  label: string;
  sub?: string;
  go: "openJoker" | "openDetail" | "navigateTab";
  detailKind?: EntityKind;
  navigateTab?: string;
  handoff?: { key: "synergyJoker" | "comboId" | "archetypeId"; value: string };
}

function buildSearchIndex(): SearchHit[] {
  const hits: SearchHit[] = [];
  for (const j of JOKERS) {
    hits.push({ kind: "joker", id: j.id, label: j.name, sub: j.summary, go: "openJoker" });
  }
  for (const s of SYNERGIES) {
    const a = JOKER_MAP[s.a]?.name ?? s.a;
    const b = JOKER_MAP[s.b]?.name ?? s.b;
    hits.push({
      kind: "synergy", id: `${s.a}+${s.b}`, label: `${a} + ${b}`,
      sub: s.why.slice(0, 80), go: "navigateTab", navigateTab: "synergies",
      handoff: { key: "synergyJoker", value: s.a },
    });
  }
  for (const c of COMBOS) {
    hits.push({
      kind: "combo", id: c.id, label: c.title, sub: c.why.slice(0, 80),
      go: "navigateTab", navigateTab: "combos",
      handoff: { key: "comboId", value: c.id },
    });
  }
  for (const a of ARCHETYPES) {
    hits.push({
      kind: "archetype", id: a.id, label: a.name, sub: a.wants.slice(0, 80),
      go: "navigateTab", navigateTab: "archetypes",
      handoff: { key: "archetypeId", value: a.id },
    });
  }
  for (const x of TAROTS) hits.push({ kind: "tarot", id: x.id, label: x.name, sub: x.effect.slice(0, 80), go: "openDetail", detailKind: "tarot" });
  for (const x of PLANETS) hits.push({ kind: "planet", id: x.id, label: x.name, sub: `${x.hand} - +${x.chipsPerLevel} chips / +${x.multPerLevel} mult per level`, go: "openDetail", detailKind: "planet" });
  for (const x of SPECTRALS) hits.push({ kind: "spectral", id: x.id, label: x.name, sub: x.effect.slice(0, 80), go: "openDetail", detailKind: "spectral" });
  for (const x of VOUCHERS) hits.push({ kind: "voucher", id: x.id, label: x.name, sub: x.effect.slice(0, 80), go: "openDetail", detailKind: "voucher" });
  for (const x of DECKS) hits.push({ kind: "deck", id: x.id, label: x.name, sub: x.effect.slice(0, 80), go: "openDetail", detailKind: "deck" });
  for (const x of STAKES) hits.push({ kind: "stake", id: x.id, label: x.name, sub: x.watchOut.slice(0, 80), go: "openDetail", detailKind: "stake" });
  for (const x of ENHANCEMENTS) hits.push({ kind: "enhancement", id: x.id, label: x.name, sub: x.effect.slice(0, 80), go: "openDetail", detailKind: "enhancement" });
  for (const x of EDITIONS) hits.push({ kind: "edition", id: x.id, label: x.name, sub: x.effect.slice(0, 80), go: "openDetail", detailKind: "edition" });
  for (const x of SEALS) hits.push({ kind: "seal", id: x.id, label: x.name, sub: x.effect.slice(0, 80), go: "openDetail", detailKind: "seal" });
  for (const x of TAGS) hits.push({ kind: "tag", id: x.id, label: x.name, sub: x.effect.slice(0, 80), go: "openDetail", detailKind: "tag" });
  for (const b of BOSSES) hits.push({ kind: "boss", id: b.id, label: b.name, sub: b.effect.slice(0, 80), go: "navigateTab", navigateTab: "bosses" });
  return hits;
}

function pickRandom<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

function readVisited(): Set<string> {
  if (typeof window === "undefined" || !window.sessionStorage) return new Set();
  try {
    const raw = window.sessionStorage.getItem(VISITED_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return new Set(arr.filter((x) => typeof x === "string"));
  } catch { /* ignore */ }
  return new Set();
}

function writeVisited(s: Set<string>) {
  if (typeof window === "undefined" || !window.sessionStorage) return;
  try {
    window.sessionStorage.setItem(VISITED_KEY, JSON.stringify(Array.from(s)));
  } catch { /* ignore */ }
}

function JokerConveyor({ direction, side, ids }: {
  direction: "up" | "down"; side: "left" | "right"; ids: string[];
}) {
  // Duplicate the list for a seamless loop.
  const list = useMemo(() => [...ids, ...ids], [ids]);
  return (
    <div
      className="joker-conveyor"
      data-dir={direction}
      style={side === "left" ? { left: 4 } : { right: 4 }}
      aria-hidden="true"
    >
      <div className="joker-conveyor-track">
        {list.map((id, i) => {
          const url = getSpriteUrl(id);
          if (!url) return null;
          return (
            <img
              key={`${id}-${i}`}
              src={url}
              alt=""
              className="joker-conveyor-img"
              draggable={false}
              decoding="async"
            />
          );
        })}
      </div>
    </div>
  );
}

export function HomeTab({ onNavigate }: HomeTabProps) {
  const t = useT();
  const openDetail = useOpenDetail();

  const descKey = useMemo(() => DESC_KEYS[Math.floor(Math.random() * DESC_KEYS.length)], []);

  // Larger conveyor lists so they fill tall desktop viewports edge-to-edge.
  const leftIds = useMemo(() => pickRandom(JOKERS.map((j) => j.id), 20), []);
  const rightIds = useMemo(() => pickRandom(JOKERS.map((j) => j.id), 20), []);

  const index = useMemo(buildSearchIndex, []);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return index
      .filter((h) => h.label.toLowerCase().includes(q) || (h.sub ?? "").toLowerCase().includes(q))
      .slice(0, 10);
  }, [index, query]);

  const handlePick = useCallback((hit: SearchHit) => {
    setQuery("");
    setFocused(false);
    if (hit.go === "openJoker") {
      openDetail("joker", hit.id);
    } else if (hit.go === "openDetail" && hit.detailKind) {
      openDetail(hit.detailKind, hit.id);
    } else if (hit.go === "navigateTab" && hit.navigateTab) {
      if (hit.handoff) setHandoff(hit.handoff.key, hit.handoff.value);
      onNavigate(hit.navigateTab);
    }
  }, [openDetail, onNavigate]);

  const [discoverMessage, setDiscoverMessage] = useState<string | null>(null);
  const handleDiscover = useCallback(() => {
    let visited = readVisited();
    const pool = DISCOVER_TABS.filter((tab) => !visited.has(tab));
    let pick: string;
    if (pool.length === 0) {
      visited = new Set();
      pick = DISCOVER_TABS[Math.floor(Math.random() * DISCOVER_TABS.length)];
      setDiscoverMessage(t("ui.home.discover_reset"));
      window.setTimeout(() => setDiscoverMessage(null), 2500);
    } else {
      pick = pool[Math.floor(Math.random() * pool.length)];
    }
    visited.add(pick);
    writeVisited(visited);
    onNavigate(pick);
  }, [onNavigate, t]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setFocused(false);
        inputRef.current?.blur();
      }
    }
    if (focused) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focused]);

  return (
    // Full-bleed home view. Mobile has a sticky header (~60px); desktop has no header,
    // so we use 100dvh on md+. Locked overflow-hidden = the user only sees this view.
    <div
      className="relative w-full overflow-hidden h-[calc(100dvh-60px)] md:h-[100dvh]"
      data-testid="tab-home"
    >
      {/* Animated Balatro main-menu red/blue background, fills the entire view. */}
      <div className="balatro-menu-bg" aria-hidden="true" />

      {/* Vertical joker conveyors anchored to the FULL view edges. */}
      <JokerConveyor direction="down" side="left" ids={leftIds} />
      <JokerConveyor direction="up" side="right" ids={rightIds} />

      {/* Foreground content. Vertical-center on mobile, top-aligned-ish on desktop.
          Padding clears the 64px conveyors on both sides. */}
      <div
        className="relative z-10 mx-auto flex h-full w-full flex-col items-center justify-center gap-5 px-20 py-6 sm:gap-6 sm:py-10"
        style={{ maxWidth: "min(64rem, 100%)" }}
      >
        {/* Big app title - moved higher via smaller top padding above */}
        <h1
          className="font-pixel text-center leading-none drop-shadow-[0_4px_0_rgba(0,0,0,0.55)]"
          style={{ fontSize: "clamp(3rem, 11vw, 7rem)" }}
          data-testid="text-home-title"
        >
          <span className="mult-text">{t("ui.home.title_a")}</span>
          <span className="chips-text">{t("ui.home.title_b")}</span>
        </h1>

        {/* Description */}
        <p
          className="max-w-2xl text-center font-display text-base text-foreground/90 sm:text-lg md:text-xl"
          data-testid="text-home-desc"
        >
          {t(descKey)}
        </p>

        {/* All 4 suit icons in one row under the description. */}
        <div
          className="flex items-center justify-center gap-6 sm:gap-8"
          aria-hidden="true"
        >
          <span className="font-pixel chips-text" style={{ fontSize: "clamp(1.5rem, 3.5vw, 2.25rem)" }}>♠</span>
          <span className="font-pixel mult-text" style={{ fontSize: "clamp(1.5rem, 3.5vw, 2.25rem)" }}>♥</span>
          <span className="font-pixel mult-text" style={{ fontSize: "clamp(1.5rem, 3.5vw, 2.25rem)" }}>♦</span>
          <span className="font-pixel chips-text" style={{ fontSize: "clamp(1.5rem, 3.5vw, 2.25rem)" }}>♣</span>
        </div>

        {/* Search bar */}
        <div className="relative w-full max-w-xl" data-testid="home-search">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => window.setTimeout(() => setFocused(false), 150)}
              placeholder={t("ui.home.search_placeholder")}
              className="w-full rounded-md border-2 border-accent/40 bg-background/80 py-3 pl-10 pr-9 font-display text-sm text-foreground shadow-lg backdrop-blur-md placeholder:text-muted-foreground/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
              data-testid="input-home-search"
              autoComplete="off"
              spellCheck={false}
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
                data-testid="button-home-search-clear"
                aria-label="Clear"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Autocomplete dropdown - capped to fit within the view */}
          {focused && query.trim() && (
            <div
              className="casino-card absolute z-20 mt-2 max-h-72 w-full overflow-y-auto p-1 shadow-2xl"
              data-testid="home-search-results"
            >
              {results.length === 0 ? (
                <div className="px-3 py-3 text-sm text-muted-foreground">
                  {t("ui.home.search_empty")}
                </div>
              ) : (
                results.map((hit) => (
                  <button
                    key={`${hit.kind}-${hit.id}`}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); handlePick(hit); }}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-accent/15"
                    data-testid={`search-hit-${hit.kind}-${hit.id}`}
                  >
                    <span className="font-pixel text-[10px] uppercase tracking-wider text-accent/80">
                      {hit.kind}
                    </span>
                    <span className="flex-1 truncate text-sm">
                      <span className="font-medium text-foreground">{hit.label}</span>
                      {hit.sub && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {hit.sub}
                        </span>
                      )}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Two-button row: Discover + What's New */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleDiscover}
              className="balatro-tab inline-flex items-center gap-2 px-5 py-2.5 font-pixel text-sm"
              data-testid="button-home-discover"
            >
              <Compass className="h-4 w-4" />
              {t("ui.home.discover")}
            </button>
            <button
              type="button"
              onClick={() => onNavigate("whatsnew")}
              className="balatro-tab inline-flex items-center gap-2 px-5 py-2.5 font-pixel text-sm"
              data-testid="button-home-whats-new"
            >
              <Sparkles className="h-4 w-4" />
              {t("ui.home.whats_new")}
            </button>
          </div>
          {discoverMessage && (
            <span className="text-[11px] text-muted-foreground">
              {discoverMessage}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
