// SeedFinderTab.tsx - v1.7.1 Native seed finder, reworked UX.
// Search bar (autocomplete) instead of icon grid. Chip list of selected jokers
// with per-joker constraints. Match cards report human-readable locations
// ("After Big Blind, shop item 3" / "After Small Blind, 2nd booster (Mega Buffoon Pack), position 4").

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Loader2, Play, Square, Sparkles, AlertCircle, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { JokerSprite } from "@/components/JokerSprite";
import { jokerIdFromName } from "@/lib/helpers";
import { DECKS, STAKES, COMMON_JOKERS, UNCOMMON_JOKERS, RARE_JOKERS, LEGENDARY_JOKERS } from "@/lib/seedItems";
import {
  SeedFinder, type JokerConstraint, type SeedMatch, type FinderHandle, type FinderProgress,
} from "@/lib/seedFinder";
import { describeShopSlot, describePackSlot } from "@/lib/seedFinderLocation";

// ---- Joker dataset ----
const ALL_JOKER_NAMES = [...COMMON_JOKERS, ...UNCOMMON_JOKERS, ...RARE_JOKERS, ...LEGENDARY_JOKERS]
  .filter((j, i, a) => a.indexOf(j) === i)
  .sort();

function rarityOf(name: string): "common" | "uncommon" | "rare" | "legendary" | "unknown" {
  if (LEGENDARY_JOKERS.includes(name)) return "legendary";
  if (RARE_JOKERS.includes(name)) return "rare";
  if (UNCOMMON_JOKERS.includes(name)) return "uncommon";
  if (COMMON_JOKERS.includes(name)) return "common";
  return "unknown";
}

function rarityTextClass(r: string): string {
  if (r === "legendary") return "text-purple-300";
  if (r === "rare") return "text-red-300";
  if (r === "uncommon") return "text-emerald-300";
  if (r === "common") return "text-zinc-300";
  return "text-zinc-400";
}

function editionClass(edition: string): string {
  if (edition === "Foil") return "text-cyan-300";
  if (edition === "Holographic") return "text-pink-300";
  if (edition === "Polychrome") return "text-orange-300";
  if (edition === "Negative") return "text-zinc-100 font-semibold";
  return "text-zinc-300";
}

// ---- Autocomplete joker search bar ----

function JokerSearchBar({
  onAdd,
  selectedNames,
}: {
  onAdd: (name: string) => void;
  selectedNames: string[];
}) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return ALL_JOKER_NAMES
      .filter(n => n.toLowerCase().includes(q))
      .slice(0, 10);
  }, [query]);

  function commit(name: string) {
    if (!selectedNames.includes(name)) onAdd(name);
    setQuery("");
    setActiveIdx(0);
    inputRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx(i => Math.min(results.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx(i => Math.max(0, i - 1));
    } else if (e.key === "Enter" && results.length > 0) {
      e.preventDefault();
      commit(results[activeIdx]);
    } else if (e.key === "Escape") {
      setQuery("");
      (e.target as HTMLInputElement).blur();
    }
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-md border border-yellow-500/30 bg-zinc-950/80 px-3 py-2 focus-within:border-yellow-400/70">
        <Search className="h-4 w-4 text-yellow-300/70 shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setActiveIdx(0); }}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}  // delay so click registers
          onKeyDown={onKeyDown}
          placeholder="Search a joker to add (e.g. Perkeo, Blueprint, Brainstorm)..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-500"
          data-testid="finder-search-input"
        />
        {query && (
          <button onClick={() => setQuery("")} className="text-zinc-500 hover:text-zinc-300">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {focused && results.length > 0 && (
        <div className="absolute z-30 mt-1 w-full rounded-md border border-yellow-500/30 bg-zinc-950 shadow-xl max-h-80 overflow-y-auto">
          {results.map((name, idx) => {
            const id = jokerIdFromName(name);
            const r = rarityOf(name);
            const isActive = idx === activeIdx;
            const isAdded = selectedNames.includes(name);
            return (
              <button
                key={name}
                onMouseDown={(e) => { e.preventDefault(); commit(name); }}
                onMouseEnter={() => setActiveIdx(idx)}
                disabled={isAdded}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-sm transition ${
                  isActive ? "bg-yellow-500/10" : ""
                } ${isAdded ? "opacity-50" : "hover:bg-yellow-500/5"}`}
              >
                {id ? (
                  <JokerSprite jokerId={id} name={name} size={32} className="border-0 bg-transparent" />
                ) : (
                  <div className="w-8 h-8" />
                )}
                <span className={`flex-1 ${rarityTextClass(r)}`}>{name}</span>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{r}</span>
                {isAdded && <span className="text-[10px] text-emerald-300">added</span>}
                {!isAdded && <Plus className="h-3.5 w-3.5 text-yellow-300/70" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---- Per-joker constraint row ----

function ConstraintRow({
  c, onChange, onRemove,
}: {
  c: JokerConstraint;
  onChange: (next: JokerConstraint) => void;
  onRemove: () => void;
}) {
  const id = jokerIdFromName(c.joker);
  const r = rarityOf(c.joker);
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-yellow-500/15 bg-zinc-900/40 p-2">
      {id ? (
        <JokerSprite jokerId={id} name={c.joker} size={44} className="border-0 bg-transparent" />
      ) : (
        <div className="w-11 h-11" />
      )}
      <div className="min-w-[120px]">
        <div className={`text-sm font-semibold ${rarityTextClass(r)}`}>{c.joker}</div>
        <div className="text-[10px] text-zinc-500 uppercase">{r}</div>
      </div>
      <div>
        <Label className="text-[10px] text-zinc-400">Edition</Label>
        <Select value={c.edition || "any"} onValueChange={v => onChange({ ...c, edition: v === "any" ? "" : v as JokerConstraint["edition"] })}>
          <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any</SelectItem>
            <SelectItem value="Negative">Negative</SelectItem>
            <SelectItem value="Polychrome">Polychrome</SelectItem>
            <SelectItem value="Holographic">Holographic</SelectItem>
            <SelectItem value="Foil">Foil</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-[10px] text-zinc-400">Source</Label>
        <Select value={c.source || "any"} onValueChange={v => onChange({ ...c, source: v === "any" ? "" : v as JokerConstraint["source"] })}>
          <SelectTrigger className="h-8 w-[160px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any source</SelectItem>
            <SelectItem value="shop">Shop only</SelectItem>
            <SelectItem value="buffoon-pack">Buffoon Pack</SelectItem>
            <SelectItem value="arcana-soul">Arcana (Soul card)</SelectItem>
            <SelectItem value="spectral-soul">Spectral (Soul card)</SelectItem>
            <SelectItem value="spectral-wraith">Spectral (Wraith)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-[10px] text-zinc-400">Max ante</Label>
        <Input
          type="number" min={1} max={39}
          value={c.maxAnte}
          onChange={e => onChange({ ...c, maxAnte: Math.max(1, Math.min(39, Number(e.target.value) || 1)) })}
          className="h-8 w-[70px] text-xs"
        />
      </div>
      <Button size="sm" variant="ghost" onClick={onRemove} className="text-red-400 hover:text-red-300 h-8 px-2 ml-auto">
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

// ---- Main tab ----

export function SeedFinderTab() {
  const [selected, setSelected] = useState<JokerConstraint[]>([]);
  const [deck, setDeck] = useState("Red Deck");
  const [stake, setStake] = useState("White Stake");
  const [version, setVersion] = useState("1.0.1f");
  const [globalMaxAnte, setGlobalMaxAnte] = useState(4);
  const [threads, setThreads] = useState(() => Math.max(1, Math.min(8, navigator.hardwareConcurrency || 4)));

  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<FinderProgress>({ totalTries: 0, elapsedMs: 0, seedsPerSec: 0, matches: 0 });
  const [matches, setMatches] = useState<SeedMatch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const handleRef = useRef<FinderHandle | null>(null);
  const finderRef = useRef<SeedFinder | null>(null);

  useEffect(() => () => { handleRef.current?.stop(); }, []);

  const effectiveMaxAnte = useMemo(() => {
    if (selected.length === 0) return globalMaxAnte;
    return Math.max(globalMaxAnte, ...selected.map(s => s.maxAnte));
  }, [selected, globalMaxAnte]);

  function addJoker(name: string) {
    setSelected(prev => {
      if (prev.some(c => c.joker === name)) return prev;
      return [...prev, { joker: name, edition: "", source: "", maxAnte: globalMaxAnte }];
    });
  }

  function updateConstraint(i: number, next: JokerConstraint) {
    setSelected(prev => prev.map((c, idx) => idx === i ? next : c));
  }

  function removeConstraint(i: number) {
    setSelected(prev => prev.filter((_, idx) => idx !== i));
  }

  function start() {
    if (selected.length === 0 || running) return;
    setError(null);
    setMatches([]);
    setProgress({ totalTries: 0, elapsedMs: 0, seedsPerSec: 0, matches: 0 });
    setRunning(true);

    if (!finderRef.current) finderRef.current = new SeedFinder();
    const handle = finderRef.current.start(
      {
        jokerConstraints: selected,
        maxAnte: effectiveMaxAnte,
        deck, stake, version, threads,
      },
      {
        onProgress: (p) => setProgress(p),
        onMatch: (m) => setMatches(prev => [...prev, m].slice(-50)),
        onDone: () => setRunning(false),
        onError: (msg) => { setError(msg); setRunning(false); },
      }
    );
    handleRef.current = handle;
  }

  function stop() {
    handleRef.current?.stop();
    handleRef.current = null;
  }

  const selectedNames = selected.map(c => c.joker);

  return (
    <div className="space-y-4">
      {/* Run config */}
      <div className="rounded-lg border border-yellow-500/30 bg-zinc-950/70 p-3 space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <div>
            <Label className="text-xs text-zinc-400">Deck</Label>
            <Select value={deck} onValueChange={setDeck}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{DECKS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-zinc-400">Stake</Label>
            <Select value={stake} onValueChange={setStake}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{STAKES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-zinc-400">Version</Label>
            <Select value={version} onValueChange={setVersion}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1.0.1f">1.0.1f</SelectItem>
                <SelectItem value="1.0.1c">1.0.1c</SelectItem>
                <SelectItem value="1.0.0">1.0.0</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-zinc-400" title="Global cap. Per-joker max-ante can be tighter.">Max ante</Label>
            <Input
              type="number" min={1} max={39} value={globalMaxAnte}
              onChange={e => setGlobalMaxAnte(Math.max(1, Math.min(39, Number(e.target.value) || 1)))}
              className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-xs text-zinc-400" title="CPU threads (Web Workers)">Threads</Label>
            <Input
              type="number" min={1} max={16} value={threads}
              onChange={e => setThreads(Math.max(1, Math.min(16, Number(e.target.value) || 1)))}
              className="h-8 text-xs"
              disabled={running} />
          </div>
        </div>
      </div>

      {/* Joker search bar */}
      <div className="space-y-2">
        <Label className="text-xs text-zinc-400">
          Target jokers {selected.length > 0 && <span className="text-yellow-300">({selected.length})</span>}
        </Label>
        <JokerSearchBar onAdd={addJoker} selectedNames={selectedNames} />
      </div>

      {/* Selected constraints */}
      {selected.length > 0 && (
        <div className="space-y-1.5">
          {selected.map((c, i) => (
            <ConstraintRow key={c.joker} c={c} onChange={n => updateConstraint(i, n)} onRemove={() => removeConstraint(i)} />
          ))}
        </div>
      )}

      {/* Run controls */}
      <div className="flex flex-wrap items-center gap-3 rounded-md border border-yellow-500/15 bg-zinc-950/60 p-3">
        {!running ? (
          <Button onClick={start} disabled={selected.length === 0} className="bg-yellow-400 hover:bg-yellow-300 text-zinc-950" data-testid="finder-start">
            <Play className="mr-2 h-4 w-4" /> Start search
          </Button>
        ) : (
          <Button onClick={stop} variant="destructive" data-testid="finder-stop">
            <Square className="mr-2 h-4 w-4" /> Stop
          </Button>
        )}
        <div className="flex flex-wrap gap-4 text-xs font-mono">
          <div><span className="text-zinc-500">checked </span><span className="text-yellow-200">{progress.totalTries.toLocaleString()}</span></div>
          <div><span className="text-zinc-500">rate </span><span className="text-yellow-200">{progress.seedsPerSec.toLocaleString()}/s</span></div>
          <div><span className="text-zinc-500">elapsed </span><span className="text-yellow-200">{(progress.elapsedMs / 1000).toFixed(1)}s</span></div>
          <div><span className="text-zinc-500">matches </span><span className="text-emerald-300">{matches.length}</span></div>
        </div>
        {running && <Loader2 className="h-4 w-4 animate-spin text-yellow-300 ml-auto" />}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-red-500/40 bg-red-950/30 p-3 text-sm text-red-200">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <div className="font-semibold">Search error</div>
            <div className="text-xs text-red-300/80 mt-0.5">{error}</div>
          </div>
        </div>
      )}

      {matches.length === 0 && !running && (
        <div className="text-center text-sm text-zinc-500 italic py-8">
          {selected.length === 0
            ? "Search and add jokers above, then click Start search."
            : "Click Start search to begin brute-forcing seeds."}
        </div>
      )}
      {matches.length === 0 && running && (
        <div className="text-center text-sm text-zinc-500 italic py-8">
          Searching... no match yet. Rare constraints can take seconds to minutes.
        </div>
      )}

      {matches.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-zinc-400">
            Matches ({matches.length}{matches.length >= 50 ? ", showing last 50" : ""})
          </Label>
          {matches.slice().reverse().map((m, idx) => (
            <MatchCard key={m.seed + idx} match={m} />
          ))}
        </div>
      )}
    </div>
  );
}

function formatLocation(j: SeedMatch["jokerLocations"][number]): React.ReactNode {
  if (j.source === "shop") {
    const info = describeShopSlot(j.slot, j.ante);
    return (
      <>
        Ante <span className="text-yellow-300 font-mono">{j.ante}</span>
        {" · "}<span className="text-zinc-300">{info.blindLabel}</span>
        {" · shop item "}<span className="text-yellow-300 font-mono">{info.positionInShop}</span>
      </>
    );
  }
  if (j.source === "buffoon-pack") {
    const info = describePackSlot(j.slot, j.ante);
    return (
      <>
        Ante <span className="text-yellow-300 font-mono">{j.ante}</span>
        {" · "}<span className="text-zinc-300">{info.blindLabel}</span>
        {", "}<span className="text-yellow-300">{info.positionInShop === 1 ? "1st" : "2nd"} booster</span>
        {" ("}<span className="text-purple-300">{j.packName}</span>{")"}
        {", card "}<span className="text-yellow-300 font-mono">#{j.packPosition}</span>
      </>
    );
  }
  if (j.source === "arcana-soul" || j.source === "spectral-soul" || j.source === "spectral-wraith") {
    const info = describePackSlot(j.slot, j.ante);
    const soulType = j.source === "arcana-soul" ? "Arcana"
      : j.source === "spectral-soul" ? "Spectral"
      : "Spectral (Wraith)";
    return (
      <>
        Ante <span className="text-yellow-300 font-mono">{j.ante}</span>
        {" · "}<span className="text-zinc-300">{info.blindLabel}</span>
        {", "}<span className="text-yellow-300">{info.positionInShop === 1 ? "1st" : "2nd"} booster</span>
        {" ("}<span className="text-purple-300">{j.packName}</span>{") "}
        <span className="text-purple-300 italic">[{soulType} → Soul card]</span>
      </>
    );
  }
  return <>Ante {j.ante}</>;
}

function MatchCard({ match }: { match: SeedMatch }) {
  return (
    <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/10 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-emerald-300" />
        <span className="font-mono text-lg font-bold text-emerald-200 select-all">{match.seed}</span>
        <Button
          size="sm" variant="ghost" className="h-7 px-2 text-xs"
          onClick={() => navigator.clipboard?.writeText(match.seed)}
          title="Copy seed"
        >
          Copy
        </Button>
      </div>
      <div className="space-y-1">
        {match.jokerLocations.map((j, i) => {
          const id = jokerIdFromName(j.joker);
          return (
            <div key={i} className="flex items-center gap-2 text-sm">
              {id ? <JokerSprite jokerId={id} name={j.joker} size={40} className="border-0 bg-transparent" /> : <div className="w-10 h-10" />}
              <div className="flex-1">
                <div className="font-semibold text-yellow-200">
                  {j.joker}
                  {j.edition && j.edition !== "No Edition" && (
                    <span className={`ml-2 text-xs italic ${editionClass(j.edition)}`}>[{j.edition}]</span>
                  )}
                  {(j.eternal || j.perishable || j.rental) && (
                    <span className="text-amber-300/80 ml-2 text-xs">
                      [{[j.eternal && "Eternal", j.perishable && "Perishable", j.rental && "Rental"].filter(Boolean).join(", ")}]
                    </span>
                  )}
                </div>
                <div className="text-xs text-zinc-400">{formatLocation(j)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
