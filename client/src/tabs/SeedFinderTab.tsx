
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Loader2, Play, Square, Sparkles, AlertCircle, X, Plus, BookmarkPlus, BookmarkCheck, HelpCircle, Share2, Check } from "lucide-react";
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
import {
  DECKS, STAKES, COMMON_JOKERS, UNCOMMON_JOKERS, RARE_JOKERS, LEGENDARY_JOKERS,
  VOUCHERS, TAGS, BOSSES, SUITS, RANKS,
} from "@/lib/seedItems";
import {
  SeedFinder, type JokerConstraint, type VoucherConstraint, type TagConstraint,
  type BossConstraint, type StandardCardConstraint, type SeedMatch, type FinderHandle,
} from "@/lib/seedFinder";
import { SeedFinderV2 } from "@/lib/seedFinderV2";
import { describeShopSlot, describePackSlot } from "@/lib/seedFinderLocation";
import { useSeedTabState, setFinder, updateFinder, saveSeed, isSeedSaved } from "@/lib/seedTabState";
import { SeedReproductionPanel } from "@/components/SeedReproductionPanel";
import { encodeFinderConfig, decodeFinderConfig } from "@/lib/seedFinderShare";
import { VerifySeedPanel } from "@/components/VerifySeedPanel";

const ALL_JOKER_NAMES = [...COMMON_JOKERS, ...UNCOMMON_JOKERS, ...RARE_JOKERS, ...LEGENDARY_JOKERS]
  .filter((j, i, a) => a.indexOf(j) === i)
  .sort();

// Engine-canonical enhancement names. Engine matches the literal "Glass Card"
// etc.; UI shows them verbatim so the user knows what's selected.
const ENHANCEMENTS_FULL = [
  "Bonus Card", "Mult Card", "Wild Card", "Glass Card",
  "Steel Card", "Stone Card", "Gold Card", "Lucky Card",
];

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

function MaxAnteInput({
  value, onChange,
}: { value: number; onChange: (n: number) => void }) {
  return (
    <div>
      <Label className="text-[10px] text-zinc-400">Max ante</Label>
      <Input
        type="number" min={1} max={39}
        value={value}
        onChange={e => onChange(Math.max(1, Math.min(39, Number(e.target.value) || 1)))}
        className="h-8 w-[70px] text-xs"
      />
    </div>
  );
}

function RemoveBtn({ onClick }: { onClick: () => void }) {
  return (
    <Button size="sm" variant="ghost" onClick={onClick} className="text-red-400 hover:text-red-300 h-8 px-2 ml-auto">
      <X className="h-4 w-4" />
    </Button>
  );
}

function JokerConstraintRow({
  c, onChange, onRemove,
}: {
  c: JokerConstraint;
  onChange: (next: JokerConstraint) => void;
  onRemove: () => void;
}) {
  const id = jokerIdFromName(c.joker);
  const r = rarityOf(c.joker);
  const slotValue = (c.slot === undefined || c.slot < 0 || c.slot === 255) ? "any" : String(c.slot);
  const isLegendary = r === "legendary";
  const isRare = r === "rare";
  // For Legendaries, the only meaningful source is Soul → Legendary. Force
  // that and hide the picker.
  // For Rare jokers, Wraith source is also legal.
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
      <div title="Eternal/Perishable/Rental sticker filter. Only meaningful from Black Stake upward.">
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
      <div>
        <Label className="text-[10px] text-zinc-400">Source</Label>
        <Select
          value={c.source || "any"}
          onValueChange={v => onChange({ ...c, source: v === "any" ? "" : v as JokerConstraint["source"] })}
        >
          <SelectTrigger className="h-8 w-[170px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {!isLegendary && <SelectItem value="any">Any source</SelectItem>}
            {!isLegendary && <SelectItem value="shop">Shop only</SelectItem>}
            {!isLegendary && <SelectItem value="buffoon-pack">Buffoon Pack</SelectItem>}
            <SelectItem value="arcana-soul">Arcana (Soul card)</SelectItem>
            <SelectItem value="spectral-soul">Spectral (Soul card)</SelectItem>
            {(isRare || !isLegendary) && <SelectItem value="spectral-wraith">Spectral (Wraith)</SelectItem>}
          </SelectContent>
        </Select>
        {isLegendary && (
          <div className="text-[10px] text-purple-300/80 mt-0.5">Legendary — forced via Soul</div>
        )}
      </div>
      {((c.source || "") === "" || c.source === "shop") && !isLegendary && (
        <div title="Which shop slot to match. Slot 0 = first card shown. 'Any' covers all 16 (default 4 + 12 rerolls).">
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
      <MaxAnteInput value={c.maxAnte} onChange={n => onChange({ ...c, maxAnte: n })} />
      <RemoveBtn onClick={onRemove} />
    </div>
  );
}

function VoucherConstraintRow({
  c, onChange, onRemove,
}: {
  c: VoucherConstraint;
  onChange: (next: VoucherConstraint) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-yellow-500/15 bg-zinc-900/40 p-2">
      <div className="rounded bg-amber-900/30 border border-amber-500/30 px-2 py-1 text-[10px] uppercase tracking-wider text-amber-300">Voucher</div>
      <div>
        <Label className="text-[10px] text-zinc-400">Voucher</Label>
        <Select value={c.voucher} onValueChange={v => onChange({ ...c, voucher: v })}>
          <SelectTrigger className="h-8 w-[180px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent className="max-h-72">
            {VOUCHERS.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <MaxAnteInput value={c.maxAnte} onChange={n => onChange({ ...c, maxAnte: n })} />
      <RemoveBtn onClick={onRemove} />
    </div>
  );
}

function TagConstraintRow({
  c, onChange, onRemove,
}: {
  c: TagConstraint;
  onChange: (next: TagConstraint) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-yellow-500/15 bg-zinc-900/40 p-2">
      <div className="rounded bg-blue-900/30 border border-blue-500/30 px-2 py-1 text-[10px] uppercase tracking-wider text-blue-300">Tag</div>
      <div>
        <Label className="text-[10px] text-zinc-400">Tag</Label>
        <Select value={c.tag} onValueChange={v => onChange({ ...c, tag: v })}>
          <SelectTrigger className="h-8 w-[180px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent className="max-h-72">
            {TAGS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div title="Small-blind tag fires at the small blind, big-blind tag at the big blind. Each ante has both.">
        <Label className="text-[10px] text-zinc-400">Position</Label>
        <Select value={String(c.position ?? 0)} onValueChange={v => onChange({ ...c, position: Number(v) as 0 | 1 })}>
          <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Small blind</SelectItem>
            <SelectItem value="1">Big blind</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <MaxAnteInput value={c.maxAnte} onChange={n => onChange({ ...c, maxAnte: n })} />
      <RemoveBtn onClick={onRemove} />
    </div>
  );
}

function BossConstraintRow({
  c, onChange, onRemove,
}: {
  c: BossConstraint;
  onChange: (next: BossConstraint) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-yellow-500/15 bg-zinc-900/40 p-2">
      <div className="rounded bg-red-900/30 border border-red-500/30 px-2 py-1 text-[10px] uppercase tracking-wider text-red-300">Boss</div>
      <div>
        <Label className="text-[10px] text-zinc-400">Boss</Label>
        <Select value={c.boss} onValueChange={v => onChange({ ...c, boss: v })}>
          <SelectTrigger className="h-8 w-[180px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent className="max-h-72">
            {BOSSES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <MaxAnteInput value={c.maxAnte} onChange={n => onChange({ ...c, maxAnte: n })} />
      <RemoveBtn onClick={onRemove} />
    </div>
  );
}

function StandardCardConstraintRow({
  c, onChange, onRemove,
}: {
  c: StandardCardConstraint;
  onChange: (next: StandardCardConstraint) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-yellow-500/15 bg-zinc-900/40 p-2">
      <div className="rounded bg-cyan-900/30 border border-cyan-500/30 px-2 py-1 text-[10px] uppercase tracking-wider text-cyan-300">Standard pack card</div>
      <div>
        <Label className="text-[10px] text-zinc-400">Suit</Label>
        <Select value={c.suit || "any"} onValueChange={v => onChange({ ...c, suit: v === "any" ? "" : v as StandardCardConstraint["suit"] })}>
          <SelectTrigger className="h-8 w-[110px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any suit</SelectItem>
            {SUITS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-[10px] text-zinc-400">Rank</Label>
        <Select value={c.rank || "any"} onValueChange={v => onChange({ ...c, rank: v === "any" ? "" : v as StandardCardConstraint["rank"] })}>
          <SelectTrigger className="h-8 w-[110px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="any">Any rank</SelectItem>
            {RANKS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-[10px] text-zinc-400">Enhancement</Label>
        <Select value={c.enhancement || "any"} onValueChange={v => onChange({ ...c, enhancement: v === "any" ? "" : v })}>
          <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="any">Any</SelectItem>
            {ENHANCEMENTS_FULL.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-[10px] text-zinc-400">Edition</Label>
        <Select value={c.edition || "any"} onValueChange={v => onChange({ ...c, edition: v === "any" ? "" : v as StandardCardConstraint["edition"] })}>
          <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any</SelectItem>
            <SelectItem value="Foil">Foil</SelectItem>
            <SelectItem value="Holographic">Holographic</SelectItem>
            <SelectItem value="Polychrome">Polychrome</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-[10px] text-zinc-400">Seal</Label>
        <Select value={c.seal || "any"} onValueChange={v => onChange({ ...c, seal: v === "any" ? "" : v as StandardCardConstraint["seal"] })}>
          <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any</SelectItem>
            <SelectItem value="Red">Red</SelectItem>
            <SelectItem value="Blue">Blue</SelectItem>
            <SelectItem value="Gold">Gold</SelectItem>
            <SelectItem value="Purple">Purple</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <MaxAnteInput value={c.maxAnte} onChange={n => onChange({ ...c, maxAnte: n })} />
      <RemoveBtn onClick={onRemove} />
    </div>
  );
}

/**
 * Friendly Search Speed selector. Maps an opaque thread count to a tier
 * label that any user can understand.
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

  const tiersRaw: Array<{ key: string; label: string; n: number }> = [
    { key: "eco",     label: `Eco — 1 worker (low CPU)`,                       n: 1 },
    { key: "low",     label: `Low — 2 workers`,                                 n: 2 },
    { key: "medium",  label: `Medium — 4 workers`,                              n: 4 },
    { key: "high",    label: `High — ${highCount} workers`,                    n: highCount },
    { key: "max",     label: `Max — ${maxCount} workers (oversubscribe)`,      n: maxCount },
    { key: "extreme", label: `Extreme — ${extremeCount} workers (24+ core PCs)`, n: extremeCount },
  ];
  const seen = new Set<number>();
  const tiers = tiersRaw.filter(t => { if (seen.has(t.n)) return false; seen.add(t.n); return true; });
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
      </PopoverContent>
    </Popover>
  );
}

// "Add filter" menu — surfaces all V2 clause types.
function AddFilterMenu({
  onAddVoucher, onAddTag, onAddBoss, onAddStandard, disabled,
}: {
  onAddVoucher: () => void;
  onAddTag: () => void;
  onAddBoss: () => void;
  onAddStandard: () => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline" disabled={disabled} className="h-8 border-yellow-500/30 text-yellow-200 hover:text-yellow-100">
          <Plus className="mr-1 h-3.5 w-3.5" /> Add filter
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-1 bg-zinc-950 border-yellow-500/30">
        <button onClick={() => { onAddVoucher(); setOpen(false); }} className="w-full text-left px-3 py-2 text-xs rounded hover:bg-amber-500/10 text-amber-200">
          <div className="font-semibold">Voucher</div>
          <div className="text-[10px] text-zinc-500">Match a voucher reaching the shop</div>
        </button>
        <button onClick={() => { onAddTag(); setOpen(false); }} className="w-full text-left px-3 py-2 text-xs rounded hover:bg-blue-500/10 text-blue-200">
          <div className="font-semibold">Tag</div>
          <div className="text-[10px] text-zinc-500">Small or big blind tag for an ante</div>
        </button>
        <button onClick={() => { onAddBoss(); setOpen(false); }} className="w-full text-left px-3 py-2 text-xs rounded hover:bg-red-500/10 text-red-200">
          <div className="font-semibold">Boss</div>
          <div className="text-[10px] text-zinc-500">Force a specific boss at an ante</div>
        </button>
        <button onClick={() => { onAddStandard(); setOpen(false); }} className="w-full text-left px-3 py-2 text-xs rounded hover:bg-cyan-500/10 text-cyan-200">
          <div className="font-semibold">Standard pack card</div>
          <div className="text-[10px] text-zinc-500">Rank · suit · enh · edition · seal</div>
        </button>
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

  // V2 is now the default engine. The legacy V1 path is still wired up for
  // emergency fallback only (no UI toggle by default; ?legacy=1 unhides it).
  const showLegacyToggle = useMemo(() => {
    try { return new URLSearchParams(location.search).get("legacy") === "1"; }
    catch { return false; }
  }, []);
  const [useLegacyEngine, setUseLegacyEngine] = useState<boolean>(() => {
    try { return localStorage.getItem("seed-finder-engine") === "legacy"; }
    catch { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem("seed-finder-engine", useLegacyEngine ? "legacy" : "v2"); } catch {}
  }, [useLegacyEngine]);

  // Share-link import on first mount.
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const share = params.get("seedfinder");
      if (!share) return;
      const decoded = decodeFinderConfig(share);
      if (!decoded) return;
      updateFinder(f => ({
        ...f,
        selected: decoded.jokerConstraints ?? [],
        vouchers: decoded.voucherConstraints ?? [],
        tags: decoded.tagConstraints ?? [],
        bosses: decoded.bossConstraints ?? [],
        standardCards: decoded.standardCardConstraints ?? [],
        deck: decoded.deck ?? f.deck,
        stake: decoded.stake ?? f.stake,
        version: decoded.version ?? f.version,
      }));
      // Clear the param so a refresh doesn't re-import.
      params.delete("seedfinder");
      const q = params.toString();
      history.replaceState(null, "", location.pathname + (q ? "?" + q : "") + location.hash);
    } catch {}
  }, []);

  useEffect(() => () => { handleRef.current?.stop(); }, []);

  // Verify-seed inspector state.
  const [verifySeed, setVerifySeed] = useState<string>("");
  const [verifyOpen, setVerifyOpen] = useState(false);

  const effectiveMaxAnte = useMemo(() => {
    const all = [
      ...finder.selected.map(s => s.maxAnte),
      ...finder.vouchers.map(s => s.maxAnte),
      ...finder.tags.map(s => s.maxAnte),
      ...finder.bosses.map(s => s.maxAnte),
      ...finder.standardCards.map(s => s.maxAnte),
    ];
    if (all.length === 0) return 8;
    return Math.max(...all);
  }, [finder.selected, finder.vouchers, finder.tags, finder.bosses, finder.standardCards]);

  function addJoker(name: string) {
    updateFinder(f => {
      if (f.selected.some(c => c.joker === name)) return f;
      const defaultMax = f.selected.length > 0
        ? Math.max(...f.selected.map(s => s.maxAnte))
        : 8;
      const r = rarityOf(name);
      // Default to "any" except legendaries — legendaries must be sourced via
      // Soul, so default to arcana-soul which the engine resolves precisely.
      const source: JokerConstraint["source"] = r === "legendary" ? "arcana-soul" : "";
      return { ...f, selected: [...f.selected, { joker: name, edition: "", source, maxAnte: defaultMax }] };
    });
  }

  function updateConstraint(i: number, next: JokerConstraint) {
    updateFinder(f => ({ ...f, selected: f.selected.map((c, idx) => idx === i ? next : c) }));
  }
  function removeConstraint(i: number) {
    updateFinder(f => ({ ...f, selected: f.selected.filter((_, idx) => idx !== i) }));
  }

  function addVoucher() {
    updateFinder(f => ({ ...f, vouchers: [...f.vouchers, { voucher: VOUCHERS[0], maxAnte: effectiveMaxAnte }] }));
  }
  function updateVoucher(i: number, next: VoucherConstraint) {
    updateFinder(f => ({ ...f, vouchers: f.vouchers.map((c, idx) => idx === i ? next : c) }));
  }
  function removeVoucher(i: number) {
    updateFinder(f => ({ ...f, vouchers: f.vouchers.filter((_, idx) => idx !== i) }));
  }

  function addTag() {
    updateFinder(f => ({ ...f, tags: [...f.tags, { tag: TAGS[0], position: 0, maxAnte: effectiveMaxAnte }] }));
  }
  function updateTag(i: number, next: TagConstraint) {
    updateFinder(f => ({ ...f, tags: f.tags.map((c, idx) => idx === i ? next : c) }));
  }
  function removeTag(i: number) {
    updateFinder(f => ({ ...f, tags: f.tags.filter((_, idx) => idx !== i) }));
  }

  function addBoss() {
    updateFinder(f => ({ ...f, bosses: [...f.bosses, { boss: BOSSES[0], maxAnte: effectiveMaxAnte }] }));
  }
  function updateBoss(i: number, next: BossConstraint) {
    updateFinder(f => ({ ...f, bosses: f.bosses.map((c, idx) => idx === i ? next : c) }));
  }
  function removeBoss(i: number) {
    updateFinder(f => ({ ...f, bosses: f.bosses.filter((_, idx) => idx !== i) }));
  }

  function addStandard() {
    updateFinder(f => ({
      ...f,
      standardCards: [...f.standardCards, { suit: "", rank: "", enhancement: "", edition: "", seal: "", maxAnte: effectiveMaxAnte }],
    }));
  }
  function updateStandard(i: number, next: StandardCardConstraint) {
    updateFinder(f => ({ ...f, standardCards: f.standardCards.map((c, idx) => idx === i ? next : c) }));
  }
  function removeStandard(i: number) {
    updateFinder(f => ({ ...f, standardCards: f.standardCards.filter((_, idx) => idx !== i) }));
  }

  const totalConstraints =
    finder.selected.length + finder.vouchers.length + finder.tags.length +
    finder.bosses.length + finder.standardCards.length;

  function start() {
    if (totalConstraints === 0) return;
    if (finder.running) return;

    setFinder({ error: null, matches: [], progress: { totalTries: 0, elapsedMs: 0, seedsPerSec: 0, matches: 0 }, running: true });

    const cfg = {
      jokerConstraints: finder.selected,
      voucherConstraints: finder.vouchers,
      tagConstraints: finder.tags,
      bossConstraints: finder.bosses,
      standardCardConstraints: finder.standardCards,
      maxAnte: effectiveMaxAnte,
      deck: finder.deck,
      stake: finder.stake,
      version: finder.version,
      threads: finder.threads,
    };
    const cbs = {
      onProgress: (p: any) => setFinder({ progress: p }),
      onMatch: (m: SeedMatch) => updateFinder(f => ({ ...f, matches: [...f.matches, m].slice(-50) })),
      onDone: () => setFinder({ running: false }),
      onError: (msg: string) => setFinder({ error: msg, running: false }),
    };
    let handle: FinderHandle;
    if (useLegacyEngine) {
      if (!finderRef.current) finderRef.current = new SeedFinder();
      handle = finderRef.current.start(cfg, cbs);
    } else {
      if (!finderV2Ref.current) finderV2Ref.current = new SeedFinderV2();
      handle = finderV2Ref.current.start(cfg, cbs);
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

  // Share search — encodes full config (jokers + vouchers + tags + bosses +
  // standard cards + deck/stake/version) to ?seedfinder=... URL.
  const [copiedShare, setCopiedShare] = useState(false);
  async function shareSearch() {
    try {
      const enc = encodeFinderConfig({
        jokerConstraints: finder.selected,
        voucherConstraints: finder.vouchers,
        tagConstraints: finder.tags,
        bossConstraints: finder.bosses,
        standardCardConstraints: finder.standardCards,
        deck: finder.deck,
        stake: finder.stake,
        version: finder.version,
      });
      const url = `${location.origin}${location.pathname}?seedfinder=${enc}${location.hash}`;
      await navigator.clipboard?.writeText(url);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 1800);
    } catch {}
  }

  const selectedNames = finder.selected.map(c => c.joker);
  const { selected, vouchers, tags, bosses, standardCards, deck, stake, version, threads, matches, progress, error, running } = finder;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-yellow-500/30 bg-zinc-950/70 p-3 space-y-3">
        {/* Legacy engine toggle is hidden by default; ?legacy=1 reveals it. */}
        {showLegacyToggle && (
          <div className="flex items-start gap-2 rounded border border-zinc-700 bg-zinc-900/30 p-2">
            <input
              id="legacy-engine-toggle"
              type="checkbox"
              className="mt-1 h-4 w-4 accent-zinc-400"
              checked={useLegacyEngine}
              onChange={(e) => setUseLegacyEngine(e.target.checked)}
              disabled={running}
            />
            <label htmlFor="legacy-engine-toggle" className="text-xs text-zinc-300 leading-snug">
              <span className="font-semibold text-zinc-200">Use legacy engine</span>
              <span className="block text-zinc-500">
                Falls back to the V1 Immolate WASM finder. Slower; doesn't support
                editions/stickers/slots/bosses/standard-card-level filters.
              </span>
            </label>
          </div>
        )}

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

      <div className="space-y-2">
        <Label className="text-xs text-zinc-400">
          Target jokers {selected.length > 0 && <span className="text-yellow-300">({selected.length})</span>}
        </Label>
        <JokerSearchBar onAdd={addJoker} selectedNames={selectedNames} />
      </div>

      {selected.length > 0 && (
        <div className="space-y-1.5">
          {selected.map((c, i) => (
            <JokerConstraintRow key={c.joker} c={c} onChange={n => updateConstraint(i, n)} onRemove={() => removeConstraint(i)} />
          ))}
        </div>
      )}

      {(vouchers.length > 0 || tags.length > 0 || bosses.length > 0 || standardCards.length > 0) && (
        <div className="space-y-1.5">
          {vouchers.map((c, i) => (
            <VoucherConstraintRow key={"v" + i} c={c} onChange={n => updateVoucher(i, n)} onRemove={() => removeVoucher(i)} />
          ))}
          {tags.map((c, i) => (
            <TagConstraintRow key={"t" + i} c={c} onChange={n => updateTag(i, n)} onRemove={() => removeTag(i)} />
          ))}
          {bosses.map((c, i) => (
            <BossConstraintRow key={"b" + i} c={c} onChange={n => updateBoss(i, n)} onRemove={() => removeBoss(i)} />
          ))}
          {standardCards.map((c, i) => (
            <StandardCardConstraintRow key={"s" + i} c={c} onChange={n => updateStandard(i, n)} onRemove={() => removeStandard(i)} />
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <AddFilterMenu
          onAddVoucher={addVoucher}
          onAddTag={addTag}
          onAddBoss={addBoss}
          onAddStandard={addStandard}
          disabled={running}
        />
        <span className="text-[11px] text-zinc-500">
          Add voucher · tag · boss · standard-pack card constraints
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-md border border-yellow-500/15 bg-zinc-950/60 p-3">
        {!running ? (
          <Button onClick={start} disabled={totalConstraints === 0} className="bg-yellow-400 hover:bg-yellow-300 text-zinc-950" data-testid="finder-start">
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
        {totalConstraints > 0 && (
          <Button onClick={shareSearch} variant="ghost" size="sm" className="text-zinc-300" title="Copy a link to this exact search">
            {copiedShare ? <Check className="mr-1 h-3.5 w-3.5 text-emerald-300" /> : <Share2 className="mr-1 h-3.5 w-3.5" />}
            {copiedShare ? "Copied" : "Share search"}
          </Button>
        )}
        <Button
          onClick={() => setVerifyOpen(o => !o)}
          variant="ghost"
          size="sm"
          className="text-zinc-300"
          title="Run the engine on a single seed and show which clauses match where"
        >
          Verify a seed
        </Button>
        <div className="flex flex-wrap gap-4 text-xs font-mono ml-auto">
          <div><span className="text-zinc-500">checked </span><span className="text-yellow-200">{progress.totalTries.toLocaleString()}</span></div>
          <div><span className="text-zinc-500">rate </span><span className="text-yellow-200">{progress.seedsPerSec.toLocaleString()}/s</span></div>
          <div><span className="text-zinc-500">elapsed </span><span className="text-yellow-200">{(progress.elapsedMs / 1000).toFixed(1)}s</span></div>
          <div><span className="text-zinc-500">matches </span><span className="text-emerald-300">{matches.length}</span></div>
          {!useLegacyEngine && (progress as any).engine && (
            <div><span className="text-zinc-500">engine </span><span className="text-purple-300">{(progress as any).engine}</span></div>
          )}
        </div>
        {running && <Loader2 className="h-4 w-4 animate-spin text-yellow-300" />}
      </div>

      {verifyOpen && (
        <VerifySeedPanel
          seed={verifySeed}
          onSeedChange={setVerifySeed}
          deck={deck}
          stake={stake}
          version={version}
          jokerConstraints={selected}
          voucherConstraints={vouchers}
          tagConstraints={tags}
          bossConstraints={bosses}
          standardCardConstraints={standardCards}
        />
      )}

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
          {totalConstraints === 0
            ? "Add target jokers above or use \"Add filter\" for vouchers, tags, bosses, or standard-pack cards."
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
              onVerify={(seed) => { setVerifySeed(seed); setVerifyOpen(true); }}
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
  onVerify,
}: {
  match: SeedMatch;
  preset?: { deck: string; stake: string; version: string; globalMaxAnte: number; jokerConstraints: JokerConstraint[] };
  showSave?: boolean;
  trailing?: React.ReactNode;
  onVerify?: (seed: string) => void;
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
        {onVerify && (
          <Button
            size="sm" variant="ghost" className="h-7 px-2 text-xs text-purple-300 hover:text-purple-200"
            onClick={() => onVerify(match.seed)}
            title="Run the engine on this seed and show all matched locations"
          >
            Verify
          </Button>
        )}
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
