// SeedFinderTab.tsx - v1.7 Native seed finder (inverse search).
// Brute-force random seeds with constraint matching using Immolate WASM engine
// running in N parallel Web Workers. Shows exact location for each matched joker.

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Loader2, Play, Square, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { JokerSprite } from "@/components/JokerSprite";
import { JOKERS, JOKER_MAP, jokerIdFromName } from "@/lib/helpers";
import { DECKS, STAKES, COMMON_JOKERS, UNCOMMON_JOKERS, RARE_JOKERS, LEGENDARY_JOKERS } from "@/lib/seedItems";
import {
  SeedFinder, type JokerConstraint, type SeedMatch, type FinderHandle, type FinderProgress,
} from "@/lib/seedFinder";

// ---- Joker set & rarity ----
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

function rarityBorder(r: string): string {
  if (r === "legendary") return "border-purple-400/70";
  if (r === "rare") return "border-red-400/70";
  if (r === "uncommon") return "border-emerald-400/60";
  if (r === "common") return "border-zinc-400/40";
  return "border-zinc-700";
}

function editionClass(edition: string): string {
  if (edition === "Foil") return "text-cyan-300";
  if (edition === "Holographic") return "text-pink-300";
  if (edition === "Polychrome") return "text-orange-300";
  if (edition === "Negative") return "text-zinc-200 font-semibold";
  return "text-zinc-300";
}

function sourceLabel(source: string): string {
  switch (source) {
    case "shop": return "Shop";
    case "buffoon-pack": return "Buffoon Pack";
    case "arcana-soul": return "Arcana Pack (Soul)";
    case "spectral-soul": return "Spectral Pack (Soul)";
    case "spectral-wraith": return "Spectral Pack (Wraith)";
    default: return source || "any";
  }
}

function blindLabel(blind: number): string {
  return blind === 1 ? "Small Blind" : blind === 2 ? "Big Blind" : "?";
}

// ---- Joker picker grid (clickable, multi-select) ----

function JokerPickerGrid({
  selected,
  onToggle,
  filter,
}: {
  selected: string[];
  onToggle: (name: string) => void;
  filter: string;
}) {
  const filtered = useMemo(() => {
    const f = filter.toLowerCase().trim();
    return ALL_JOKER_NAMES.filter(n => !f || n.toLowerCase().includes(f));
  }, [filter]);

  return (
    <div className="rounded-md border border-yellow-500/20 bg-zinc-950/40 p-2 max-h-72 overflow-y-auto">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(56px,1fr))] gap-1.5">
        {filtered.map(name => {
          const id = jokerIdFromName(name);
          const isSel = selected.includes(name);
          const rarity = rarityOf(name);
          return (
            <button
              key={name}
              onClick={() => onToggle(name)}
              title={name}
              className={`group relative rounded-md border-2 transition ${
                isSel
                  ? "border-yellow-400 ring-2 ring-yellow-400/50 bg-yellow-400/10"
                  : `${rarityBorder(rarity)} hover:border-yellow-300/70 hover:bg-yellow-300/5`
              }`}
              data-testid={`finder-joker-${id}`}
            >
              {id ? (
                <JokerSprite jokerId={id} name={name} size={50} className="border-0 bg-transparent" />
              ) : (
                <div className="flex h-[50px] items-center justify-center text-xs text-zinc-400 px-1 text-center">{name}</div>
              )}
              {isSel && (
                <div className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-yellow-400 text-zinc-950 text-[10px] font-bold flex items-center justify-center">✓</div>
              )}
            </button>
          );
        })}
      </div>
      {filtered.length === 0 && (
        <div className="text-center text-xs text-zinc-500 py-4 italic">No jokers match "{filter}".</div>
      )}
    </div>
  );
}

// ---- Per-joker constraint editor (edition + source + maxAnte) ----

function ConstraintRow({
  c, onChange, onRemove,
}: {
  c: JokerConstraint;
  onChange: (next: JokerConstraint) => void;
  onRemove: () => void;
}) {
  const id = jokerIdFromName(c.joker);
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-yellow-500/15 bg-zinc-900/40 p-2">
      {id && <JokerSprite jokerId={id} name={c.joker} size={44} />}
      <div className="flex-1 min-w-[120px]">
        <div className="text-sm font-semibold text-yellow-200">{c.joker}</div>
        <div className="text-[10px] text-zinc-500">{rarityOf(c.joker)}</div>
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
          <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any source</SelectItem>
            <SelectItem value="shop">Shop only</SelectItem>
            <SelectItem value="buffoon-pack">Buffoon Pack</SelectItem>
            <SelectItem value="arcana-soul">Arcana (Soul)</SelectItem>
            <SelectItem value="spectral-soul">Spectral (Soul)</SelectItem>
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
      <Button size="sm" variant="ghost" onClick={onRemove} className="text-red-400 hover:text-red-300 h-8 px-2">×</Button>
    </div>
  );
}

// ---- Main tab ----

export function SeedFinderTab() {
  const [selected, setSelected] = useState<JokerConstraint[]>([]);
  const [filter, setFilter] = useState("");
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

  // Sync globalMaxAnte from constraints
  const effectiveMaxAnte = useMemo(() => {
    if (selected.length === 0) return globalMaxAnte;
    return Math.max(globalMaxAnte, ...selected.map(s => s.maxAnte));
  }, [selected, globalMaxAnte]);

  function toggleJoker(name: string) {
    setSelected(prev => {
      const idx = prev.findIndex(c => c.joker === name);
      if (idx >= 0) return prev.filter((_, i) => i !== idx);
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
        onMatch: (m) => setMatches(prev => [...prev, m].slice(-50)),  // keep last 50
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
      {/* Header */}
      <div className="rounded-lg border border-yellow-500/30 bg-zinc-950/70 p-3 space-y-3">
        <div className="flex items-center gap-2 text-yellow-200 font-semibold">
          <Search className="h-4 w-4" /> Seed Finder
          <span className="text-xs text-zinc-400 font-normal">
            Pick jokers, set constraints, brute-force the seed space. Runs locally in {threads} Web Workers powered by a native WebAssembly engine.
          </span>
        </div>

        {/* Run config row */}
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
            <Label className="text-xs text-zinc-400" title="Global cap. Per-joker max-ante can be tighter.">Global max ante</Label>
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

      {/* Joker picker */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Label className="text-xs text-zinc-400">Target jokers ({selected.length} selected)</Label>
          <Input
            placeholder="Filter jokers..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="h-7 w-[200px] text-xs ml-auto"
          />
        </div>
        <JokerPickerGrid selected={selectedNames} onToggle={toggleJoker} filter={filter} />
      </div>

      {/* Per-joker constraints */}
      {selected.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-zinc-400">Per-joker constraints (click × to remove)</Label>
          <div className="space-y-1.5">
            {selected.map((c, i) => (
              <ConstraintRow key={c.joker} c={c} onChange={n => updateConstraint(i, n)} onRemove={() => removeConstraint(i)} />
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-3 rounded-md border border-yellow-500/15 bg-zinc-950/60 p-3">
        {!running ? (
          <Button onClick={start} disabled={selected.length === 0} className="bg-yellow-400 hover:bg-yellow-300 text-zinc-950" data-testid="finder-start">
            <Play className="mr-2 h-4 w-4" /> Start search
          </Button>
        ) : (
          <Button onClick={stop} variant="destructive" data-testid="finder-stop">
            <Square className="mr-2 h-4 w-4" /> Stop
          </Button>
        )}
        <div className="flex flex-wrap gap-4 text-xs text-zinc-300 ml-2 font-mono">
          <div><span className="text-zinc-500">checked</span> <span className="text-yellow-200">{progress.totalTries.toLocaleString()}</span></div>
          <div><span className="text-zinc-500">rate</span> <span className="text-yellow-200">{progress.seedsPerSec.toLocaleString()}/s</span></div>
          <div><span className="text-zinc-500">elapsed</span> <span className="text-yellow-200">{(progress.elapsedMs / 1000).toFixed(1)}s</span></div>
          <div><span className="text-zinc-500">matches</span> <span className="text-emerald-300">{matches.length}</span></div>
        </div>
        {running && <Loader2 className="h-4 w-4 animate-spin text-yellow-300 ml-auto" />}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-md border border-red-500/40 bg-red-950/30 p-3 text-sm text-red-200">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <div className="font-semibold">Search error</div>
            <div className="text-xs text-red-300/80 mt-0.5">{error}</div>
          </div>
        </div>
      )}

      {/* Matches */}
      {matches.length === 0 && !running && (
        <div className="text-center text-sm text-zinc-500 italic py-8">
          {selected.length === 0
            ? "Select one or more jokers above, then click Start search."
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
              {id ? <JokerSprite jokerId={id} name={j.joker} size={40} /> : <div className="w-10 h-10" />}
              <div className="flex-1">
                <div className="font-semibold text-yellow-200">
                  {j.joker}
                  {j.edition && j.edition !== "No Edition" && (
                    <span className={`ml-2 text-xs italic ${editionClass(j.edition)}`}>[{j.edition}]</span>
                  )}
                </div>
                <div className="text-xs text-zinc-400">
                  Ante <span className="text-yellow-300 font-mono">{j.ante}</span>
                  {" · "}{sourceLabel(j.source)}
                  {j.source === "shop" && <> · slot <span className="font-mono">{j.slot}</span></>}
                  {(j.source !== "shop" && j.packName) && (
                    <> · <span className="text-purple-300">{j.packName}</span> (pack #{j.slot}, pos {j.packPosition})</>
                  )}
                  {(j.eternal || j.perishable || j.rental) && (
                    <span className="text-amber-300/80 ml-1">
                      [{[j.eternal && "Eternal", j.perishable && "Perishable", j.rental && "Rental"].filter(Boolean).join(", ")}]
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
