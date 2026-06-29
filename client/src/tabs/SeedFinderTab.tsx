
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Loader2, Play, Square, Sparkles, AlertCircle, X, Plus, BookmarkPlus, BookmarkCheck, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { detectDeviceProfile, type DeviceProfile } from "@/lib/deviceProfile";
import { JokerSprite } from "@/components/JokerSprite";
import { jokerIdFromName } from "@/lib/helpers";
import { DECKS, STAKES, COMMON_JOKERS, UNCOMMON_JOKERS, RARE_JOKERS, LEGENDARY_JOKERS } from "@/lib/seedItems";
import {
  SeedFinder, type JokerConstraint, type SeedMatch, type FinderHandle,
} from "@/lib/seedFinder";
import { SeedFinderV2 } from "@/lib/seedFinderV2";
import { describeShopSlot, describePackSlot } from "@/lib/seedFinderLocation";
import { useSeedTabState, setFinder, updateFinder, saveSeed, isSeedSaved } from "@/lib/seedTabState";
import { SeedReproductionPanel } from "@/components/SeedReproductionPanel";

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
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={onKeyDown}
          placeholder="Search a joker to add (e.g. Perkeo, Blueprint, Brainstorm)..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-500"
          data-testid="finder-search-input"
        />
        {query && (
          <button onClick={() => setQuery("")} className="text-zinc-500 hover:text-zinc-300" data-no-sound>
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
                  <JokerSprite jokerId={id} name={name} size={32} className="border-0 bg-transparent" clickable={false} />
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

function ConstraintRow({
  c, onChange, onRemove, showV2Fields,
}: {
  c: JokerConstraint;
  onChange: (next: JokerConstraint) => void;
  onRemove: () => void;
  showV2Fields: boolean;
}) {
  const id = jokerIdFromName(c.joker);
  const r = rarityOf(c.joker);
  const slotValue = (c.slot === undefined || c.slot < 0 || c.slot === 255) ? "any" : String(c.slot);
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
      {showV2Fields && (
        <div title="Eternal/Perishable/Rental sticker filter. V2 only. Only meaningful from Black Stake upward.">
          <Label className="text-[10px] text-zinc-400">Sticker</Label>
          <Select value={c.sticker || "any"} onValueChange={v => onChange({ ...c, sticker: v === "any" ? "" : v as JokerConstraint["sticker"] })}>
            <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="eternal">Eternal</SelectItem>
              <SelectItem value="perishable">Perishable</SelectItem>
              <SelectItem value="rental">Rental</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
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
      {showV2Fields && ((c.source || "") === "" || c.source === "shop") && (
        <div title="Which shop slot to match. Slot 0 = first card shown. 'Any' covers all 16 (default 4 + 12 rerolls). V2 only.">
          <Label className="text-[10px] text-zinc-400">Slot</Label>
          <Select value={slotValue} onValueChange={v => onChange({ ...c, slot: v === "any" ? 255 : Number(v) })}>
            <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any slot (0–15)</SelectItem>
              <SelectItem value="0">Slot 0</SelectItem>
              <SelectItem value="1">Slot 1</SelectItem>
              <SelectItem value="2">Slot 2</SelectItem>
              <SelectItem value="3">Slot 3</SelectItem>
              <SelectItem value="4">Slot 4 (1st reroll)</SelectItem>
              <SelectItem value="5">Slot 5</SelectItem>
              <SelectItem value="6">Slot 6</SelectItem>
              <SelectItem value="7">Slot 7</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
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

/**
 * Friendly Search Speed selector. Maps an opaque thread count to a tier
 * label that any user can understand. The dropdown always shows ONE current
 * tier label regardless of how many cores the device has.
 */
function SpeedSelect({
  value, onChange, disabled, profile,
}: {
  value: number;
  onChange: (n: number) => void;
  disabled?: boolean;
  profile: DeviceProfile;
}) {
  const cores = profile.cores || 4;
  const highCount = Math.max(4, Math.min(8, cores));
  const maxCount = Math.max(highCount + 2, Math.min(16, cores * 2));
  const extremeCount = Math.max(maxCount + 2, Math.min(32, cores * 3));

  // Distinct tier values (deduplicated for low-core devices)
  const tiersRaw: Array<{ key: string; label: string; n: number }> = [
    { key: "eco",     label: `Eco — 1 worker (low CPU)`,                       n: 1 },
    { key: "low",     label: `Low — 2 workers`,                                 n: 2 },
    { key: "medium",  label: `Medium — 4 workers`,                              n: 4 },
    { key: "high",    label: `High — ${highCount} workers`,                    n: highCount },
    { key: "max",     label: `Max — ${maxCount} workers (oversubscribe)`,      n: maxCount },
    { key: "extreme", label: `Extreme — ${extremeCount} workers (24+ core PCs)`, n: extremeCount },
  ];
  // De-duplicate by n while keeping the most descriptive label
  const seen = new Set<number>();
  const tiers = tiersRaw.filter(t => { if (seen.has(t.n)) return false; seen.add(t.n); return true; });

  // Snap incoming value to the closest tier
  const current = tiers.reduce((best, t) => Math.abs(t.n - value) < Math.abs(best.n - value) ? t : best, tiers[0]);

  return (
    <Select value={current.key} onValueChange={(k) => {
      const t = tiers.find(x => x.key === k);
      if (t) onChange(t.n);
    }} disabled={disabled}>
      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
      <SelectContent>
        <div className="px-2 py-1.5 text-[10px] uppercase tracking-wide text-zinc-500 border-b border-zinc-800 mb-1">
          Detected: {profile.label}
        </div>
        {tiers.map(t => {
          const isRec = t.key === profile.recommendedTier;
          return (
            <SelectItem key={t.key} value={t.key}>
              {t.label}{isRec ? "  ★ recommended" : ""}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

/**
 * Plain-English explainer for "Search speed". Opens from a small ? button
 * next to the label. We keep this short and avoid jargon — most users just
 * want to know whether bumping it up will help or melt their phone.
 */
function SpeedHelp({ profile }: { profile: DeviceProfile }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center h-4 w-4 rounded-full text-zinc-500 hover:text-yellow-300 transition-colors"
          aria-label="What is search speed?"
        >
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 text-xs leading-relaxed space-y-2 bg-zinc-950 border-yellow-500/30">
        <div className="font-semibold text-yellow-300 text-sm">How search speed works</div>
        <p className="text-zinc-300">
          Search speed is how many parallel workers crunch seeds on your
          device at the same time. More workers = more seeds per second,
          but also more heat and more CPU usage.
        </p>
        <ul className="text-zinc-300 space-y-1 list-disc pl-4">
          <li><span className="text-emerald-300">Eco / Low</span> — light, good for phones or background search.</li>
          <li><span className="text-yellow-200">Medium / High</span> — balanced, your computer stays usable.</li>
          <li><span className="text-orange-300">Max / Extreme</span> — pushes your CPU hard, fans will spin.</li>
        </ul>
        <div className="rounded border border-yellow-500/20 bg-yellow-500/5 p-2 text-zinc-300">
          We detected <span className="text-yellow-200">{profile.label}</span>
          {" "}and picked <span className="text-yellow-200">{profile.recommendedTier}</span> as the default.
          You can override it anytime.
        </div>
        <p className="text-zinc-500">
          Going past the recommendation usually gives diminishing returns —
          your cores are already busy. On phones it can also cause stutter
          or heat throttling, which actually slows the search down.
        </p>
      </PopoverContent>
    </Popover>
  );
}

export function SeedFinderTab() {
  const finder = useSeedTabState(s => s.finder);
  const deviceProfile = useMemo(() => detectDeviceProfile(), []);

  const handleRef = useRef<FinderHandle | null>(null);
  const finderRef = useRef<SeedFinder | null>(null);
  const finderV2Ref = useRef<SeedFinderV2 | null>(null);

  // Beta toggle for the new Rust+WASM engine. Persisted to localStorage.
  const [useV2Engine, setUseV2Engine] = useState<boolean>(() => {
    try { return localStorage.getItem("seed-finder-v2-beta") === "1"; }
    catch { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem("seed-finder-v2-beta", useV2Engine ? "1" : "0"); } catch {}
  }, [useV2Engine]);

  // V2-only advanced filters expressed as raw JSON.
  // Schema (all keys optional, all arrays may be empty):
  // {
  //   "tagConstraints":   [{ "tag": "Negative Tag", "position": 1, "maxAnte": 8 }],
  //   "bossConstraints":  [{ "boss": "The Wall",     "maxAnte": 8 }],
  //   "standardCardConstraints": [{
  //       "base": "Ace of Spades", "enhancement": "Glass Card",
  //       "edition": "Polychrome", "seal": "Gold Seal", "maxAnte": 4
  //   }]
  // }
  // `position` is 0 = small-blind tag (default), 1 = big-blind tag.
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advancedJson, setAdvancedJson] = useState<string>(() => {
    try { return localStorage.getItem("seed-finder-v2-advanced") || ""; }
    catch { return ""; }
  });
  const [advancedError, setAdvancedError] = useState<string | null>(null);
  useEffect(() => {
    try { localStorage.setItem("seed-finder-v2-advanced", advancedJson); } catch {}
  }, [advancedJson]);
  function parseAdvanced(): { ok: true; value: any } | { ok: false; error: string } {
    const s = advancedJson.trim();
    if (!s) return { ok: true, value: {} };
    try {
      const v = JSON.parse(s);
      if (typeof v !== "object" || v === null || Array.isArray(v)) {
        return { ok: false, error: "Top-level must be an object" };
      }
      return { ok: true, value: v };
    } catch (e: any) {
      return { ok: false, error: e?.message || "Invalid JSON" };
    }
  }

  useEffect(() => () => { handleRef.current?.stop(); }, []);

  const effectiveMaxAnte = useMemo(() => {
    if (finder.selected.length === 0) return 8;
    return Math.max(...finder.selected.map(s => s.maxAnte));
  }, [finder.selected]);

  function addJoker(name: string) {
    updateFinder(f => {
      if (f.selected.some(c => c.joker === name)) return f;
      const defaultMax = f.selected.length > 0
        ? Math.max(...f.selected.map(s => s.maxAnte))
        : 8;
      return { ...f, selected: [...f.selected, { joker: name, edition: "", source: "", maxAnte: defaultMax }] };
    });
  }

  function updateConstraint(i: number, next: JokerConstraint) {
    updateFinder(f => ({ ...f, selected: f.selected.map((c, idx) => idx === i ? next : c) }));
  }

  function removeConstraint(i: number) {
    updateFinder(f => ({ ...f, selected: f.selected.filter((_, idx) => idx !== i) }));
  }

  function start() {
    if (finder.selected.length === 0 && !advancedJson.trim()) return;
    if (finder.running) return;

    // Parse the V2 advanced JSON if present. Anything malformed = surface
    // an inline error and refuse to start (we don't want to silently drop
    // user constraints).
    let advanced: any = {};
    if (useV2Engine) {
      const p = parseAdvanced();
      if (!p.ok) {
        setAdvancedError(p.error);
        return;
      }
      setAdvancedError(null);
      advanced = p.value;
    }

    setFinder({ error: null, matches: [], progress: { totalTries: 0, elapsedMs: 0, seedsPerSec: 0, matches: 0 }, running: true });

    // Effective max ante also has to consider advanced clauses so we don't
    // truncate the engine's scan window below what the user asked for.
    const advAntes: number[] = [];
    for (const arr of [advanced.tagConstraints, advanced.bossConstraints, advanced.standardCardConstraints]) {
      if (Array.isArray(arr)) for (const c of arr) if (typeof c?.maxAnte === "number") advAntes.push(c.maxAnte);
    }
    const totalMaxAnte = Math.max(
      effectiveMaxAnte,
      advAntes.length > 0 ? Math.max(...advAntes) : 0,
    );

    const cfg = {
      jokerConstraints: finder.selected,
      maxAnte: totalMaxAnte,
      deck: finder.deck,
      stake: finder.stake,
      version: finder.version,
      threads: finder.threads,
      // Pass advanced clauses straight through; the V2 adapter knows how to
      // turn each one into an engine clause. The V1 path ignores them.
      tagConstraints:           Array.isArray(advanced.tagConstraints)           ? advanced.tagConstraints           : [],
      bossConstraints:          Array.isArray(advanced.bossConstraints)          ? advanced.bossConstraints          : [],
      standardCardConstraints:  Array.isArray(advanced.standardCardConstraints)  ? advanced.standardCardConstraints  : [],
    };
    const cbs = {
      onProgress: (p: any) => setFinder({ progress: p }),
      onMatch: (m: SeedMatch) => updateFinder(f => ({ ...f, matches: [...f.matches, m].slice(-50) })),
      onDone: () => setFinder({ running: false }),
      onError: (msg: string) => setFinder({ error: msg, running: false }),
    };
    let handle: FinderHandle;
    if (useV2Engine) {
      if (!finderV2Ref.current) finderV2Ref.current = new SeedFinderV2();
      handle = finderV2Ref.current.start(cfg, cbs);
    } else {
      if (!finderRef.current) finderRef.current = new SeedFinder();
      handle = finderRef.current.start(cfg, cbs);
    }
    handleRef.current = handle;
  }

  function stop() {
    handleRef.current?.stop();
    handleRef.current = null;
    setFinder({ running: false });
  }

  function clearMatches() {
    setFinder({ matches: [], progress: { totalTries: 0, elapsedMs: 0, seedsPerSec: 0, matches: 0 } });
  }

  const selectedNames = finder.selected.map(c => c.joker);
  const { selected, deck, stake, version, threads, matches, progress, error, running } = finder;

  return (
    <div className="space-y-4">
      { }
      <div className="rounded-lg border border-yellow-500/30 bg-zinc-950/70 p-3 space-y-3">
        {/* Beta engine toggle — runs the new Rust+WASM finder when on. */}
        <div className="flex items-start gap-2 rounded border border-purple-500/30 bg-purple-950/20 p-2">
          <input
            id="v2-engine-toggle"
            type="checkbox"
            className="mt-1 h-4 w-4 accent-purple-400"
            checked={useV2Engine}
            onChange={(e) => setUseV2Engine(e.target.checked)}
            disabled={running}
          />
          <label htmlFor="v2-engine-toggle" className="text-xs text-zinc-300 leading-snug">
            <span className="font-semibold text-purple-300">Try the new engine (v2.1 beta)</span>
            <span className="ml-1 rounded bg-purple-500/30 px-1 py-0.5 text-[10px] uppercase tracking-wide text-purple-200">v2.1</span>
            <span className="block text-zinc-400">
              Rust + WASM rewrite, SIMD-accelerated when your browser supports it.
              <span className="block mt-1">
                What v2.1 supports: shop jokers across all 16 slots (default 4 + 12 rerolls),
                edition match (Foil/Holo/Polychrome/Negative), sticker match
                (Eternal/Perishable/Rental), Soul → specific Legendary resolution,
                Wraith → specific Rare resolution, tag big-blind position, boss
                filtering, standard-pack card-level matching (rank+suit+enhancement
                +edition+seal), vouchers, buffoon/arcana/spectral/celestial pack contents.
              </span>
              <span className="block mt-1">
                Honest gap: statistical sanity verified against analytical priors
                (Negative ≈0.03%, big-blind Negative Tag ≈4.3%, Soul→Perkeo ≈7%, etc.
                across 100k-seed sweeps); a full bit-for-bit Immolate parity sweep
                is the next milestone. Click "Verify with Immolate" on any match
                to cross-check against the reference implementation.
              </span>
            </span>
          </label>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div>
            <Label className="text-xs text-zinc-400">Deck</Label>
            <Select value={deck} onValueChange={v => setFinder({ deck: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{DECKS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-zinc-400">Stake</Label>
            <Select value={stake} onValueChange={v => setFinder({ stake: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{STAKES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-zinc-400">Version</Label>
            <Select value={version} onValueChange={v => setFinder({ version: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1.0.1f">1.0.1f</SelectItem>
                <SelectItem value="1.0.1c">1.0.1c</SelectItem>
                <SelectItem value="1.0.0">1.0.0</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <Label className="text-xs text-zinc-400">Search speed</Label>
              <SpeedHelp profile={deviceProfile} />
            </div>
            <SpeedSelect value={threads} onChange={n => setFinder({ threads: n })} disabled={running} profile={deviceProfile} />
          </div>
        </div>
      </div>

      { }
      <div className="space-y-2">
        <Label className="text-xs text-zinc-400">
          Target jokers {selected.length > 0 && <span className="text-yellow-300">({selected.length})</span>}
        </Label>
        <JokerSearchBar onAdd={addJoker} selectedNames={selectedNames} />
      </div>

      { }
      {selected.length > 0 && (
        <div className="space-y-1.5">
          {selected.map((c, i) => (
            <ConstraintRow key={c.joker} c={c} onChange={n => updateConstraint(i, n)} onRemove={() => removeConstraint(i)} showV2Fields={useV2Engine} />
          ))}
        </div>
      )}

      { }
      {useV2Engine && (
        <div className="rounded-md border border-purple-500/20 bg-purple-950/10">
          <button
            type="button"
            className="w-full flex items-center justify-between px-3 py-2 text-xs text-purple-200 hover:bg-purple-500/10"
            onClick={() => setAdvancedOpen(o => !o)}
          >
            <span>
              <span className="font-semibold">Advanced V2 filters</span>
              <span className="ml-2 text-zinc-500">tag-position · boss · standard-pack card-level</span>
            </span>
            <span className="text-zinc-500">{advancedOpen ? "−" : "+"}</span>
          </button>
          {advancedOpen && (
            <div className="px-3 pb-3 space-y-2">
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Power-user JSON — the dedicated UI for these is on the roadmap.
                All keys optional. Tag position: 0 = small-blind tag, 1 = big-blind tag.
                <span className="block mt-1 text-zinc-500">Example shown is editable; leave empty to skip.</span>
              </p>
              <textarea
                spellCheck={false}
                value={advancedJson}
                onChange={e => { setAdvancedJson(e.target.value); setAdvancedError(null); }}
                placeholder={`{
  "tagConstraints": [
    { "tag": "Negative Tag", "position": 1, "maxAnte": 8 }
  ],
  "bossConstraints": [
    { "boss": "The Wall", "maxAnte": 8 }
  ],
  "standardCardConstraints": [
    {
      "base": "Ace of Spades",
      "enhancement": "Glass Card",
      "edition": "Polychrome",
      "seal": "Gold Seal",
      "maxAnte": 4
    }
  ]
}`}
                className="w-full h-44 rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 font-mono text-[11px] text-zinc-200 placeholder:text-zinc-600 focus:border-purple-400/60 focus:outline-none"
              />
              {advancedError && (
                <div className="text-[11px] text-red-300">Parse error: {advancedError}</div>
              )}
            </div>
          )}
        </div>
      )}

      { }
      <div className="flex flex-wrap items-center gap-3 rounded-md border border-yellow-500/15 bg-zinc-950/60 p-3">
        {!running ? (
          <Button onClick={start} disabled={selected.length === 0 && !advancedJson.trim()} className="bg-yellow-400 hover:bg-yellow-300 text-zinc-950" data-testid="finder-start">
            <Play className="mr-2 h-4 w-4" /> Start search
          </Button>
        ) : (
          <Button onClick={stop} variant="destructive" data-testid="finder-stop">
            <Square className="mr-2 h-4 w-4" /> Stop
          </Button>
        )}
        {matches.length > 0 && !running && (
          <Button onClick={clearMatches} variant="ghost" size="sm" className="text-zinc-400">
            Clear results
          </Button>
        )}
        <div className="flex flex-wrap gap-4 text-xs font-mono">
          <div><span className="text-zinc-500">checked </span><span className="text-yellow-200">{progress.totalTries.toLocaleString()}</span></div>
          <div><span className="text-zinc-500">rate </span><span className="text-yellow-200">{progress.seedsPerSec.toLocaleString()}/s</span></div>
          <div><span className="text-zinc-500">elapsed </span><span className="text-yellow-200">{(progress.elapsedMs / 1000).toFixed(1)}s</span></div>
          <div><span className="text-zinc-500">matches </span><span className="text-emerald-300">{matches.length}</span></div>
          {useV2Engine && (progress as any).engine && (
            <div><span className="text-zinc-500">engine </span><span className="text-purple-300">v2 {(progress as any).engine}</span></div>
          )}
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
            <MatchCard
              key={m.seed + idx}
              match={m}
              preset={{ deck, stake, version, globalMaxAnte: effectiveMaxAnte, jokerConstraints: selected }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function formatLocation(j: SeedMatch["jokerLocations"][number]): React.ReactNode {
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

export function MatchCard({
  match,
  preset,
  showSave = true,
  trailing,
}: {
  match: SeedMatch;
  preset?: { deck: string; stake: string; version: string; globalMaxAnte: number; jokerConstraints: JokerConstraint[] };
  showSave?: boolean;
  trailing?: React.ReactNode;
}) {
  const saved = useSeedTabState(s => preset ? isSeedSaved(match.seed, preset.deck, preset.stake, preset.version) : false);

  function onSave() {
    if (!preset || saved) return;
    saveSeed({
      id: `${match.seed}-${Date.now()}`,
      seed: match.seed,
      savedAt: Date.now(),
      preset,
      match,
    });
  }

  return (
    <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/10 p-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Sparkles className="h-4 w-4 text-emerald-300" />
        <span className="font-mono text-lg font-bold text-emerald-200 select-all">{match.seed}</span>
        <Button
          size="sm" variant="ghost" className="h-7 px-2 text-xs"
          onClick={() => navigator.clipboard?.writeText(match.seed)}
          title="Copy seed"
        >
          Copy
        </Button>
        {showSave && preset && (
          <Button
            size="sm"
            variant={saved ? "ghost" : "default"}
            disabled={saved}
            className={`h-7 px-2 text-xs ${saved ? "text-emerald-300" : "bg-yellow-400 hover:bg-yellow-300 text-zinc-950"}`}
            onClick={onSave}
            title={saved ? "Already saved" : "Save seed + preset to library"}
            data-testid={`save-seed-${match.seed}`}
          >
            {saved ? <BookmarkCheck className="mr-1 h-3.5 w-3.5" /> : <BookmarkPlus className="mr-1 h-3.5 w-3.5" />}
            {saved ? "Saved" : "Save this seed"}
          </Button>
        )}
        {trailing}
      </div>
      <div className="space-y-1">
        {preset && (
          <SeedReproductionPanel match={match} preset={{ deck: preset.deck, stake: preset.stake, version: preset.version }} />
        )}
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
