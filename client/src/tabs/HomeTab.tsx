import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { Search, Compass, Sparkles, ArrowRight, X } from "lucide-react";
import { useT } from "@/lib/i18n";
import { JOKERS, SYNERGIES, COMBOS, ARCHETYPES, JOKER_MAP } from "@/lib/helpers";
import { JokerSprite } from "@/components/JokerSprite";
import { CHANGELOG } from "@/data/changelog";
import { useOpenDetail } from "@/lib/detailContext";

interface HomeTabProps {
  onNavigate: (tab: string) => void;
}

// Balatro suit + consumable glyphs, picked at random per mount.
const ICON_POOL = ["♠", "♥", "♦", "♣", "★", "✦", "✧", "◆", "✺", "✪", "▲", "●"];
const COLOR_POOL = ["mult-text", "chips-text", "gold-text", "purple-text", "green-text"];
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

interface SearchHit {
  kind: "joker" | "synergy" | "combo" | "archetype";
  id: string;
  label: string;
  sub?: string;
  // Where to go when picked.
  go: "openJoker" | "navigateTab";
  navigateTab?: string;
}

function buildSearchIndex(): SearchHit[] {
  const hits: SearchHit[] = [];
  for (const j of JOKERS) {
    hits.push({
      kind: "joker", id: j.id, label: j.name,
      sub: j.summary, go: "openJoker",
    });
  }
  for (const s of SYNERGIES) {
    const a = JOKER_MAP[s.a]?.name ?? s.a;
    const b = JOKER_MAP[s.b]?.name ?? s.b;
    hits.push({
      kind: "synergy", id: `${s.a}+${s.b}`,
      label: `${a} + ${b}`,
      sub: s.why.slice(0, 80),
      go: "navigateTab", navigateTab: "synergies",
    });
  }
  for (const c of COMBOS) {
    hits.push({
      kind: "combo", id: c.id, label: c.title,
      sub: c.why.slice(0, 80),
      go: "navigateTab", navigateTab: "combos",
    });
  }
  for (const a of ARCHETYPES) {
    hits.push({
      kind: "archetype", id: a.id, label: a.name,
      sub: a.wants.slice(0, 80),
      go: "navigateTab", navigateTab: "archetypes",
    });
  }
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
          const j = JOKER_MAP[id];
          if (!j) return null;
          return (
            <JokerSprite
              key={`${id}-${i}`}
              jokerId={j.id}
              name={j.name}
              size={56}
              className="opacity-80"
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

  // Randomized icons + description, chosen once per mount.
  const icons = useMemo(() => pickRandom(ICON_POOL, 3), []);
  const iconColors = useMemo(() => pickRandom(COLOR_POOL, 3), []);
  const descKey = useMemo(() => DESC_KEYS[Math.floor(Math.random() * DESC_KEYS.length)], []);

  // Joker IDs for the two conveyors. Memoized once per mount.
  const leftIds = useMemo(() => pickRandom(JOKERS.map((j) => j.id), 14), []);
  const rightIds = useMemo(() => pickRandom(JOKERS.map((j) => j.id), 14), []);

  // Search.
  const index = useMemo(buildSearchIndex, []);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return index
      .filter((h) => h.label.toLowerCase().includes(q) || (h.sub ?? "").toLowerCase().includes(q))
      .slice(0, 8);
  }, [index, query]);

  const handlePick = useCallback((hit: SearchHit) => {
    setQuery("");
    setFocused(false);
    if (hit.go === "openJoker") {
      openDetail("joker", hit.id);
    } else if (hit.go === "navigateTab" && hit.navigateTab) {
      onNavigate(hit.navigateTab);
    }
  }, [openDetail, onNavigate]);

  // Discover Something New: track visited tabs in sessionStorage.
  // The current Home visit does NOT count - only the tab the button picks.
  const [discoverMessage, setDiscoverMessage] = useState<string | null>(null);
  const handleDiscover = useCallback(() => {
    let visited = readVisited();
    const pool = DISCOVER_TABS.filter((tab) => !visited.has(tab));
    let pick: string;
    if (pool.length === 0) {
      // Reset and pick fresh.
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

  // Latest update card.
  const latest = CHANGELOG[0];

  // Close search dropdown on Escape.
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
    <div className="relative min-h-[80vh] overflow-hidden rounded-lg" data-testid="tab-home">
      {/* Animated Balatro main-menu red/blue background, scoped to the hero block. */}
      <div className="balatro-menu-bg" aria-hidden="true" />

      {/* Vertical joker conveyors on left & right edges. */}
      <JokerConveyor direction="down" side="left" ids={leftIds} />
      <JokerConveyor direction="up" side="right" ids={rightIds} />

      {/* Foreground content */}
      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-10 sm:py-16">
        {/* Big app title */}
        <h1
          className="font-pixel text-center leading-none drop-shadow-[0_4px_0_rgba(0,0,0,0.55)]"
          style={{ fontSize: "clamp(2.5rem, 9vw, 5.5rem)" }}
          data-testid="text-home-title"
        >
          <span className="mult-text">{t("ui.home.title_a")}</span>
          <span className="chips-text">{t("ui.home.title_b")}</span>
        </h1>

        {/* Randomized description with Balatro suit/glyph icons */}
        <p
          className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center font-display text-base text-foreground/90 sm:text-lg"
          data-testid="text-home-desc"
        >
          <span className={`font-pixel text-xl ${iconColors[0]}`}>{icons[0]}</span>
          <span>{t(descKey)}</span>
          <span className={`font-pixel text-xl ${iconColors[1]}`}>{icons[1]}</span>
          <span className={`font-pixel text-xl ${iconColors[2]}`}>{icons[2]}</span>
        </p>

        {/* Search-first bar */}
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

          {/* Autocomplete dropdown */}
          {focused && query.trim() && (
            <div
              className="casino-card absolute z-20 mt-2 max-h-80 w-full overflow-y-auto p-1 shadow-2xl"
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
                    // Use onMouseDown so the click fires before the input's onBlur dismisses the menu.
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

        {/* Discover Something New button */}
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={handleDiscover}
            className="balatro-tab inline-flex items-center gap-2 px-5 py-2.5 font-pixel text-sm"
            data-testid="button-home-discover"
          >
            <Compass className="h-4 w-4" />
            {t("ui.home.discover")}
          </button>
          <span className="text-[11px] text-muted-foreground">
            {discoverMessage ?? t("ui.home.discover_hint")}
          </span>
        </div>

        {/* Latest update card */}
        {latest && (
          <article
            className="casino-card mt-2 w-full max-w-2xl p-4 sm:p-5"
            data-testid="home-latest-update"
          >
            <header className="flex flex-wrap items-center gap-2 border-b border-border pb-2">
              <Sparkles className="h-4 w-4 text-accent" strokeWidth={2.5} />
              <span className="font-pixel text-xs uppercase tracking-wider text-muted-foreground">
                {t("ui.home.latest_update")}
              </span>
              <span className="ml-auto rounded-sm border border-border px-1.5 py-0.5 font-mono text-[10px] tabular text-muted-foreground">
                {latest.version}
              </span>
            </header>
            <h3 className="mt-2 font-display text-base font-semibold text-accent">
              {t(latest.titleKey)}
            </h3>
            <ul className="mt-2 space-y-1">
              {latest.bullets.slice(0, 4).map((b) => (
                <li key={b} className="flex gap-2 text-sm leading-snug text-foreground/85">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
                  <span>{t(b)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => onNavigate("whatsnew")}
                className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline"
                data-testid="button-home-see-more-updates"
              >
                {t("ui.home.see_more")}
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </article>
        )}
      </div>
    </div>
  );
}
