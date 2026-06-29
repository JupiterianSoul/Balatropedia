
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
import { useT } from "@/lib/i18n";
import { CheckToggle } from "@/components/primitives";

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
  const t = useT();
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
          placeholder={t("ui.seedfinder.search_joker")}
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
  const t = useT();
  // Local string state so the user can clear the field, type freely, and
  // briefly hold values like "" or "0" while reaching the intended number.
  // We only push to the parent when the input parses to a sane number; we
  // clamp to [1, 39] on blur or Enter so partial typing is never punished.
  const [draft, setDraft] = useState<string>(String(value));

  // Keep local draft in sync if the parent value changes externally.
  useEffect(() => { setDraft(String(value)); }, [value]);

  const commit = () => {
    const n = Number(draft);
    if (!Number.isFinite(n)) { setDraft(String(value)); return; }
    const clamped = Math.max(1, Math.min(39, Math.round(n)));
    setDraft(String(clamped));
    if (clamped !== value) onChange(clamped);
  };

  return (
    <div>
      <Label className="text-[10px] text-zinc-400">{t("ui.seedfinder.max_ante")}</Label>
      <Input
        type="number"
        inputMode="numeric"
        min={1}
        max={39}
        value={draft}
        onChange={e => {
          const raw = e.target.value;
          setDraft(raw);
          // Push to parent only when the input is a finite number in range.
          // Partial states (empty, "0", "4" on the way to "40") stay local.
          const n = Number(raw);
          if (raw !== "" && Number.isFinite(n) && n >= 1 && n <= 39) {
            onChange(Math.round(n));
          }
        }}
        onBlur={commit}
        onKeyDown={e => { if (e.key === "Enter") commit(); }}
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
  const t = useT();
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
        <Label className="text-[10px] text-zinc-400">{t("ui.seedfinder.edition")}</Label>
        <Select value={c.edition || "any"} onValueChange={v => onChange({ ...c, edition: v === "any" ? "" : v as JokerConstraint["edition"] })}>
          <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any">{t("ui.seedfinder.any")}</SelectItem>
            <SelectItem value="Negative">Negative</SelectItem>
            <SelectItem value="Polychrome">Polychrome</SelectItem>
            <SelectItem value="Holographic">Holographic</SelectItem>
            <SelectItem value="Foil">Foil</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div title={t("ui.seedfinder.sticker_filter")}>
        <Label className="text-[10px] text-zinc-400">{t("ui.seedfinder.sticker")}</Label>
        <Select value={c.sticker || "any"} onValueChange={v => onChange({ ...c, sticker: v === "any" ? "" : v as JokerConstraint["sticker"] })}>
          <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any">{t("ui.seedfinder.any")}</SelectItem>
            <SelectItem value="eternal">Eternal</SelectItem>
            <SelectItem value="perishable">{t("ui.seedfinder.perishable")}</SelectItem>
            <SelectItem value="rental">Rental</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-[10px] text-zinc-400">{t("ui.seedfinder.source")}</Label>
        <Select
          value={c.source || "any"}
          onValueChange={v => onChange({ ...c, source: v === "any" ? "" : v as JokerConstraint["source"] })}
        >
          <SelectTrigger className="h-8 w-[170px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {!isLegendary && <SelectItem value="any">{t("ui.seedfinder.any_source")}</SelectItem>}
            {!isLegendary && <SelectItem value="shop">{t("ui.seedfinder.shop_only")}</SelectItem>}
            {!isLegendary && <SelectItem value="buffoon-pack">{t("ui.seedfinder.buffoon_pack")}</SelectItem>}
            <SelectItem value="arcana-soul">{t("ui.seedfinder.arcana_soul")}</SelectItem>
            <SelectItem value="spectral-soul">{t("ui.seedfinder.spectral_soul")}</SelectItem>
            {(isRare || !isLegendary) && <SelectItem value="spectral-wraith">{t("ui.seedfinder.spectral_wraith")}</SelectItem>}
          </SelectContent>
        </Select>
        {isLegendary && (
          <div className="text-[10px] text-purple-300/80 mt-0.5">{t("ui.seedfinder.legendary_forced")}</div>
        )}
      </div>
      {((c.source || "") === "" || c.source === "shop") && !isLegendary && (
        <div>
          <Label className="text-[10px] text-zinc-400">{t("ui.seedfinder.slot_label")}</Label>
          <Select value={slotValue} onValueChange={v => onChange({ ...c, slot: v === "any" ? 255 : Number(v) })}>
            <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">{t("ui.seedfinder.any_slot")}</SelectItem>
              <SelectItem value="0">{t("ui.seedfinder.slot")} 0</SelectItem>
              <SelectItem value="1">{t("ui.seedfinder.slot")} 1</SelectItem>
              <SelectItem value="2">{t("ui.seedfinder.slot")} 2</SelectItem>
              <SelectItem value="3">{t("ui.seedfinder.slot")} 3</SelectItem>
              <SelectItem value="4">{t("ui.seedfinder.slot4_reroll")}</SelectItem>
              <SelectItem value="5">{t("ui.seedfinder.slot")} 5</SelectItem>
              <SelectItem value="6">{t("ui.seedfinder.slot")} 6</SelectItem>
              <SelectItem value="7">{t("ui.seedfinder.slot")} 7</SelectItem>
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
  const t = useT();
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-yellow-500/15 bg-zinc-900/40 p-2">
      <div className="rounded bg-amber-900/30 border border-amber-500/30 px-2 py-1 text-[10px] uppercase tracking-wider text-amber-300">{t("ui.seedfinder.voucher")}</div>
      <div>
        <Label className="text-[10px] text-zinc-400">{t("ui.seedfinder.voucher")}</Label>
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
  const t = useT();
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-yellow-500/15 bg-zinc-900/40 p-2">
      <div className="rounded bg-blue-900/30 border border-blue-500/30 px-2 py-1 text-[10px] uppercase tracking-wider text-blue-300">{t("ui.seedfinder.tag")}</div>
      <div>
        <Label className="text-[10px] text-zinc-400">{t("ui.seedfinder.tag")}</Label>
        <Select value={c.tag} onValueChange={v => onChange({ ...c, tag: v })}>
          <SelectTrigger className="h-8 w-[180px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent className="max-h-72">
            {TAGS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div title={t("ui.seedfinder.blind_tag")}>
        <Label className="text-[10px] text-zinc-400">{t("ui.seedfinder.position")}</Label>
        <Select value={String(c.position ?? 0)} onValueChange={v => onChange({ ...c, position: Number(v) as 0 | 1 })}>
          <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="0">{t("ui.seedfinder.small_blind")}</SelectItem>
            <SelectItem value="1">{t("ui.seedfinder.big_blind")}</SelectItem>
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
  const t = useT();
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-yellow-500/15 bg-zinc-900/40 p-2">
      <div className="rounded bg-red-900/30 border border-red-500/30 px-2 py-1 text-[10px] uppercase tracking-wider text-red-300">{t("ui.seedfinder.boss")}</div>
      <div>
        <Label className="text-[10px] text-zinc-400">{t("ui.seedfinder.boss")}</Label>
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
  const t = useT();
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-yellow-500/15 bg-zinc-900/40 p-2">
      <div className="rounded bg-cyan-900/30 border border-cyan-500/30 px-2 py-1 text-[10px] uppercase tracking-wider text-cyan-300">{t("ui.seedfinder.standard_pack_card")}</div>
      <div>
        <Label className="text-[10px] text-zinc-400">{t("ui.seedfinder.suit")}</Label>
        <Select value={c.suit || "any"} onValueChange={v => onChange({ ...c, suit: v === "any" ? "" : v as StandardCardConstraint["suit"] })}>
          <SelectTrigger className="h-8 w-[110px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any">{t("ui.seedfinder.any_suit")}</SelectItem>
            {SUITS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-[10px] text-zinc-400">{t("ui.seedfinder.rank")}</Label>
        <Select value={c.rank || "any"} onValueChange={v => onChange({ ...c, rank: v === "any" ? "" : v as StandardCardConstraint["rank"] })}>
          <SelectTrigger className="h-8 w-[110px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="any">{t("ui.seedfinder.any_rank")}</SelectItem>
            {RANKS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-[10px] text-zinc-400">{t("ui.seedfinder.enhancement")}</Label>
        <Select value={c.enhancement || "any"} onValueChange={v => onChange({ ...c, enhancement: v === "any" ? "" : v })}>
          <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="any">{t("ui.seedfinder.any")}</SelectItem>
            {ENHANCEMENTS_FULL.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-[10px] text-zinc-400">{t("ui.seedfinder.edition")}</Label>
        <Select value={c.edition || "any"} onValueChange={v => onChange({ ...c, edition: v === "any" ? "" : v as StandardCardConstraint["edition"] })}>
          <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any">{t("ui.seedfinder.any")}</SelectItem>
            <SelectItem value="Foil">Foil</SelectItem>
            <SelectItem value="Holographic">Holographic</SelectItem>
            <SelectItem value="Polychrome">Polychrome</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-[10px] text-zinc-400">{t("ui.seedfinder.seal")}</Label>
        <Select value={c.seal || "any"} onValueChange={v => onChange({ ...c, seal: v === "any" ? "" : v as StandardCardConstraint["seal"] })}>
          <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any">{t("ui.seedfinder.any")}</SelectItem>
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
  const tr = useT();
  const cores = profile.cores || 4;
  const highCount = Math.max(4, Math.min(8, cores));
  const maxCount = Math.max(highCount + 2, Math.min(16, cores * 2));
  const extremeCount = Math.max(maxCount + 2, Math.min(32, cores * 3));

  const tiersRaw: Array<{ key: string; label: string; n: number }> = [
    { key: "eco",     label: tr("ui.seedfinder.speed_eco_label"), n: 1 },
    { key: "low",     label: tr("ui.seedfinder.speed_low_label"), n: 2 },
    { key: "medium",  label: tr("ui.seedfinder.speed_medium_label"), n: 4 },
    { key: "high",    label: tr("ui.seedfinder.speed_high_label", { n: String(highCount) }), n: highCount },
    { key: "max",     label: tr("ui.seedfinder.speed_max_label", { n: String(maxCount) }), n: maxCount },
    { key: "extreme", label: tr("ui.seedfinder.speed_extreme_label", { n: String(extremeCount) }), n: extremeCount },
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
          {tr("ui.seedfinder.detected")}: {profile.label}
        </div>
        {tiers.map(t => {
          const isRec = t.key === profile.recommendedTier;
          return (
            <SelectItem key={t.key} value={t.key}>
              {t.label}{isRec ? `  ★ ${tr("ui.seedfinder.recommended")}` : ""}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

function SpeedHelp({ profile }: { profile: DeviceProfile }) {
  const t = useT();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center h-4 w-4 rounded-full text-zinc-500 hover:text-yellow-300 transition-colors"
          aria-label={t("ui.seedfinder.search_speed_q")}
        >
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 text-xs leading-relaxed space-y-2 bg-zinc-950 border-yellow-500/30">
        <div className="font-semibold text-yellow-300 text-sm">{t("ui.seedfinder.search_speed_how")}</div>
        <p className="text-zinc-300">{t("ui.seedfinder.speed_help_intro")}</p>
        <ul className="text-zinc-300 space-y-1 list-disc pl-4">
          <li><span className="text-emerald-300">{t("ui.seedfinder.eco_low")}</span> — {t("ui.seedfinder.eco_low_desc")}</li>
          <li><span className="text-yellow-200">{t("ui.seedfinder.medium_high")}</span> — {t("ui.seedfinder.medium_high_desc")}</li>
          <li><span className="text-orange-300">{t("ui.seedfinder.max_extreme")}</span> — {t("ui.seedfinder.max_extreme_desc")}</li>
        </ul>
        <div className="rounded border border-yellow-500/20 bg-yellow-500/5 p-2 text-zinc-300">
          {t("ui.seedfinder.speed_help_detected")} <span className="text-yellow-200">{profile.label}</span>
          {" "}{t("ui.seedfinder.speed_help_picked")} <span className="text-yellow-200">{profile.recommendedTier}</span> {t("ui.seedfinder.speed_help_as_default")}
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
  const t = useT();
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline" disabled={disabled} className="h-8 border-yellow-500/30 text-yellow-200 hover:text-yellow-100">
          <Plus className="mr-1 h-3.5 w-3.5" /> {t("ui.seedfinder.add_filter")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-1 bg-zinc-950 border-yellow-500/30">
        <button onClick={() => { onAddVoucher(); setOpen(false); }} className="w-full text-left px-3 py-2 text-xs rounded hover:bg-amber-500/10 text-amber-200">
          <div className="font-semibold">{t("ui.seedfinder.voucher")}</div>
          <div className="text-[10px] text-zinc-500">{t("ui.seedfinder.voucher_desc")}</div>
        </button>
        <button onClick={() => { onAddTag(); setOpen(false); }} className="w-full text-left px-3 py-2 text-xs rounded hover:bg-blue-500/10 text-blue-200">
          <div className="font-semibold">{t("ui.seedfinder.tag")}</div>
          <div className="text-[10px] text-zinc-500">{t("ui.seedfinder.tag_desc")}</div>
        </button>
        <button onClick={() => { onAddBoss(); setOpen(false); }} className="w-full text-left px-3 py-2 text-xs rounded hover:bg-red-500/10 text-red-200">
          <div className="font-semibold">{t("ui.seedfinder.boss")}</div>
          <div className="text-[10px] text-zinc-500">{t("ui.seedfinder.boss_desc")}</div>
        </button>
        <button onClick={() => { onAddStandard(); setOpen(false); }} className="w-full text-left px-3 py-2 text-xs rounded hover:bg-cyan-500/10 text-cyan-200">
          <div className="font-semibold">{t("ui.seedfinder.standard_pack_card")}</div>
          <div className="text-[10px] text-zinc-500">{t("ui.seedfinder.suit_enh_seal_desc")}</div>
        </button>
      </PopoverContent>
    </Popover>
  );
}

export function SeedFinderTab() {
  const t = useT();
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

  // V3 (WebGPU) BETA. Off by default. ?v3=1 reveals the toggle for everyone;
  // otherwise the user must opt in via the toggle once it's surfaced. When on,
  // we probe WebGPU and verify the diagnostic shader. Actual seed searches
  // still run on WASM — see docs/V3_DESIGN.md.
  const showV3Toggle = useMemo(() => {
    try {
      const p = new URLSearchParams(location.search);
      return p.get("v3") === "1" || localStorage.getItem("seed-finder-v3-beta") === "on";
    } catch { return false; }
  }, []);
  const [v3Beta, setV3Beta] = useState<boolean>(() => {
    try { return localStorage.getItem("seed-finder-v3-beta") === "on"; }
    catch { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem("seed-finder-v3-beta", v3Beta ? "on" : "off"); } catch {}
  }, [v3Beta]);
  const [v3Status, setV3Status] = useState<string>("");
  useEffect(() => {
    let cancelled = false;
    if (!v3Beta) { setV3Status(""); return; }
    (async () => {
      try {
        const { selectEngine } = await import("@/lib/v3/engineSelector");
        // The WASM module is loaded lazily inside the worker; for the main-
        // thread probe we load a fresh copy of the JS glue. This is one-time
        // and small (~250KB gzipped). Use runtime URL construction so Vite
        // doesn't try to bundle the public asset.
        const origin = window.location.origin;
        const jsUrl = new URL("/engine-v2/balatro_seed_engine.js", origin).toString();
        const wasmUrl = new URL("/engine-v2/balatro_seed_engine_bg.wasm", origin).toString();
        const wasmJs = await import(/* @vite-ignore */ jsUrl);
        await wasmJs.default({ module_or_path: wasmUrl });
        const desc = await selectEngine({ v3Beta: true, wasm: wasmJs });
        if (cancelled) return;
        if (desc.webgpu?.kind === "ready") {
          const mb = (desc.webgpu.throughputSeedsPerSec / 1e6).toFixed(1);
          setV3Status(`WebGPU verified · ${desc.webgpu.adapterInfo} · ~${mb}M ops/s diagnostic`);
        } else if (desc.webgpu?.kind === "unsupported") {
          setV3Status(`WebGPU unavailable: ${desc.webgpu.reason}`);
        } else if (desc.webgpu?.kind === "verification-failed") {
          setV3Status(`WebGPU verification failed: ${desc.webgpu.reason}`);
        } else {
          setV3Status("probing…");
        }
      } catch (e) {
        if (!cancelled) setV3Status(`V3 probe error: ${String(e)}`);
      }
    })();
    return () => { cancelled = true; };
  }, [v3Beta]);

  // ─── Cold-start pre-warm (phase 2) ─────────────────────────────────────────
  //
  // When the SeedFinder tab mounts, fetch the engine WASM into HTTP cache
  // and pre-compile the module. On a phone APK this trims ~200-400ms off
  // first-search latency since the worker spawn no longer pays a cold
  // network/compile hit when the user finally clicks Start.
  //
  // We pre-warm whichever bundle the tab is actually going to use:
  //   - threaded engine if the page is cross-origin isolated;
  //   - SIMD bundle otherwise (if SIMD is supported);
  //   - scalar bundle as last fallback.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // SIMD probe.
      const simdBytes = new Uint8Array([
        0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
        0x01, 0x05, 0x01, 0x60, 0x00, 0x01, 0x7b,
        0x03, 0x02, 0x01, 0x00,
        0x0a, 0x0a, 0x01, 0x08, 0x00, 0x41, 0x00, 0xfd, 0x0f, 0xfd, 0x62, 0x0b,
      ]);
      let simd = false;
      try { simd = WebAssembly.validate(simdBytes); } catch { simd = false; }
      const canThread =
        typeof (window as any).crossOriginIsolated !== "undefined"
        && (window as any).crossOriginIsolated === true
        && typeof SharedArrayBuffer !== "undefined";
      const urls: string[] = [];
      if (canThread) urls.push("/engine-v2-threads/balatro_seed_engine_bg.wasm");
      urls.push(simd
        ? "/engine-v2-simd/balatro_seed_engine_bg.wasm"
        : "/engine-v2/balatro_seed_engine_bg.wasm");
      for (const url of urls) {
        if (cancelled) return;
        try {
          const res = await fetch(url, { cache: "force-cache" });
          if (cancelled || !res.ok) return;
          if (typeof WebAssembly.compileStreaming === "function") {
            await WebAssembly.compileStreaming(res);
          }
        } catch {
          // Best-effort; the real load surfaces any real error.
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

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
            <div className="mt-0.5">
              <CheckToggle
                active={useLegacyEngine}
                onToggle={() => setUseLegacyEngine(!useLegacyEngine)}
                testId="toggle-legacy-engine"
                ariaLabel={t("ui.seedfinder.use_legacy_label")}
                disabled={running}
              />
            </div>
            <label className="text-xs text-zinc-300 leading-snug">
              <span className="font-semibold text-zinc-200">{t("ui.seedfinder.use_legacy_label")}</span>
              <span className="block text-zinc-500">{t("ui.seedfinder.use_legacy_desc")}</span>
            </label>
          </div>
        )}

        {/* V3 (WebGPU) beta toggle. Hidden by default; ?v3=1 reveals it.
            Search backend stays on WASM for now; see docs/V3_DESIGN.md. */}
        {showV3Toggle && (
          <div className="flex items-start gap-2 rounded border border-cyan-700/40 bg-cyan-950/10 p-2">
            <div className="mt-0.5">
              <CheckToggle
                active={v3Beta}
                onToggle={() => setV3Beta(!v3Beta)}
                testId="toggle-v3-beta"
                ariaLabel={t("ui.seedfinder.v3_engine_title")}
                disabled={running}
              />
            </div>
            <label className="text-xs text-zinc-300 leading-snug">
              <span className="font-semibold text-cyan-200">{t("ui.seedfinder.v3_engine_title")}</span>
              <span className="block text-zinc-500">{t("ui.seedfinder.v3_engine_desc")}</span>
              {v3Beta && v3Status && (
                <span className="block mt-1 text-cyan-300 font-mono text-[10px]">
                  {v3Status}
                </span>
              )}
            </label>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div>
            <Label className="text-xs text-zinc-400">{t("ui.seedfinder.deck")}</Label>
            <Select value={deck} onValueChange={v => setFinder({ deck: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{DECKS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-zinc-400">{t("ui.seedfinder.stake")}</Label>
            <Select value={stake} onValueChange={v => setFinder({ stake: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{STAKES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-zinc-400">{t("ui.seedfinder.version")}</Label>
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
              <Label className="text-xs text-zinc-400">{t("ui.seedfinder.search_speed")}</Label>
              <SpeedHelp profile={deviceProfile} />
            </div>
            <SpeedSelect value={threads} onChange={n => setFinder({ threads: n })} disabled={running} profile={deviceProfile} />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-zinc-400">
          {t("ui.seedfinder.target_jokers")} {selected.length > 0 && <span className="text-yellow-300">({selected.length})</span>}
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
          {t("ui.seedfinder.add_filter_hint")}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-md border border-yellow-500/15 bg-zinc-950/60 p-3">
        {!running ? (
          <Button onClick={start} disabled={totalConstraints === 0} className="bg-yellow-400 hover:bg-yellow-300 text-zinc-950" data-testid="finder-start">
            <Play className="mr-2 h-4 w-4" /> {t("ui.seedfinder.start_search")}
          </Button>
        ) : (
          <Button onClick={stop} variant="destructive" data-testid="finder-stop">
            <Square className="mr-2 h-4 w-4" /> {t("ui.seedfinder.stop")}
          </Button>
        )}
        {matches.length > 0 && !running && (
          <Button onClick={clearMatches} variant="ghost" size="sm" className="text-zinc-400">
            {t("ui.seedfinder.clear_results")}
          </Button>
        )}
        {totalConstraints > 0 && (
          <Button onClick={shareSearch} variant="ghost" size="sm" className="text-zinc-300" title={t("ui.seedfinder.copy_link_title")}>
            {copiedShare ? <Check className="mr-1 h-3.5 w-3.5 text-emerald-300" /> : <Share2 className="mr-1 h-3.5 w-3.5" />}
            {copiedShare ? t("ui.seedfinder.copied") : t("ui.seedfinder.share_search")}
          </Button>
        )}
        <Button
          onClick={() => setVerifyOpen(o => !o)}
          variant="ghost"
          size="sm"
          className="text-zinc-300"
          title={t("ui.seedfinder.verify_seed_title")}
        >
          {t("ui.seedfinder.verify_seed_btn")}
        </Button>
        <div className="flex flex-wrap gap-4 text-xs font-mono ml-auto">
          {(() => {
            const phase = (progress as any).phase as "loading" | "warming" | "running" | undefined;
            // During WASM load + first batch, scanned/rate are legitimately
            // unknown. Surface the phase instead of a misleading "0".
            const checkedLabel = phase === "loading"
              ? t("ui.seedfinder.loading_wasm")
              : progress.totalTries.toLocaleString();
            const rateLabel = phase === "loading"
              ? "—"
              : phase === "warming"
                ? t("ui.seedfinder.warming_up")
                : `${progress.seedsPerSec.toLocaleString()}/s`;
            return (
              <>
                <div><span className="text-zinc-500">{t("ui.seedfinder.checked_label")} </span><span className="text-yellow-200">{checkedLabel}</span></div>
                <div><span className="text-zinc-500">{t("ui.seedfinder.rate_label")} </span><span className="text-yellow-200">{rateLabel}</span></div>
                <div><span className="text-zinc-500">{t("ui.seedfinder.elapsed_label")} </span><span className="text-yellow-200">{(progress.elapsedMs / 1000).toFixed(1)}s</span></div>
                <div><span className="text-zinc-500">{t("ui.seedfinder.matches_label")} </span><span className="text-emerald-300">{matches.length}</span></div>
                {!useLegacyEngine && (progress as any).engine && (
                  <div><span className="text-zinc-500">{t("ui.seedfinder.engine_label")} </span><span className="text-purple-300">{(progress as any).engine}</span></div>
                )}
              </>
            );
          })()}
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
            <div className="font-semibold">{t("ui.seedfinder.search_error_title")}</div>
            <div className="text-xs text-red-300/80 mt-0.5">{error}</div>
          </div>
        </div>
      )}

      {matches.length === 0 && !running && (
        <div className="text-center text-sm text-zinc-500 italic py-8">
          {totalConstraints === 0
            ? t("ui.seedfinder.empty_no_constraints")
            : t("ui.seedfinder.empty_ready")}
        </div>
      )}
      {matches.length === 0 && running && (
        <div className="text-center text-sm text-zinc-500 italic py-8">
          {t("ui.seedfinder.searching_no_match")}
        </div>
      )}

      {matches.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-zinc-400">
            {t("ui.seedfinder.matches_header")} ({matches.length}{matches.length >= 50 ? ", " + t("ui.seedfinder.showing_last_50") : ""})
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

export function FormatLocation({ j }: { j: SeedMatch["jokerLocations"][number] }): React.ReactElement {
  const t = useT();
  const anteLabel = t("ui.seedfinder.ante_label");
  const anteByLabel = t("ui.seedfinder.ante_by");
  const hintLabel = t("ui.seedfinder.exact_slot_hint");
  if (j.source === "shop") {
    const info = describeShopSlot(j.slot, j.ante);
    if (info.unspecified) {
      return (
        <>
          {anteByLabel} <span className="text-yellow-300 font-mono">{j.ante}</span>
          {" · "}<span className="text-zinc-300">{t("ui.seedfinder.in_a_shop")}</span>
          <br />
          <span className="text-[10px] italic text-zinc-500">{hintLabel}</span>
        </>
      );
    }
    return (
      <>
        {anteLabel} <span className="text-yellow-300 font-mono">{j.ante}</span>
        {" · "}<span className="text-zinc-300">{info.blindLabel}</span>
        {" · " + t("ui.seedfinder.shop_item") + " "}<span className="text-yellow-300 font-mono">{info.positionInShop}</span>
      </>
    );
  }
  if (j.source === "buffoon-pack") {
    const info = describePackSlot(j.slot, j.ante);
    if (info.unspecified) {
      return (
        <>
          {anteByLabel} <span className="text-yellow-300 font-mono">{j.ante}</span>
          {" · "}<span className="text-zinc-300">{t("ui.seedfinder.in_a_buffoon")}</span>
          <br />
          <span className="text-[10px] italic text-zinc-500">{hintLabel}</span>
        </>
      );
    }
    return (
      <>
        {anteLabel} <span className="text-yellow-300 font-mono">{j.ante}</span>
        {" · "}<span className="text-zinc-300">{info.blindLabel}</span>
        {", "}<span className="text-yellow-300">{info.positionInShop === 1 ? t("ui.seedfinder.first_booster") : t("ui.seedfinder.second_booster")}</span>
        {j.packName ? <>{" ("}<span className="text-purple-300">{j.packName}</span>{")"}</> : null}
        {j.packPosition > 0 ? <>{", " + t("ui.seedfinder.card") + " "}<span className="text-yellow-300 font-mono">#{j.packPosition}</span></> : null}
      </>
    );
  }
  if (j.source === "arcana-soul" || j.source === "spectral-soul" || j.source === "spectral-wraith") {
    const info = describePackSlot(j.slot, j.ante);
    const soulType = j.source === "arcana-soul" ? t("ui.seedfinder.arcana")
      : j.source === "spectral-soul" ? t("ui.seedfinder.spectral")
      : t("ui.seedfinder.spectral_wraith_label");
    const inAPack = j.source === "arcana-soul" ? t("ui.seedfinder.in_an_arcana") : t("ui.seedfinder.in_a_spectral");
    if (info.unspecified) {
      return (
        <>
          {anteByLabel} <span className="text-yellow-300 font-mono">{j.ante}</span>
          {" · "}<span className="text-zinc-300">{inAPack}</span>{" "}
          <span className="text-purple-300 italic">[{soulType} {t("ui.seedfinder.soul_card_suffix")}]</span>
          <br />
          <span className="text-[10px] italic text-zinc-500">{hintLabel}</span>
        </>
      );
    }
    return (
      <>
        {anteLabel} <span className="text-yellow-300 font-mono">{j.ante}</span>
        {" · "}<span className="text-zinc-300">{info.blindLabel}</span>
        {", "}<span className="text-yellow-300">{info.positionInShop === 1 ? t("ui.seedfinder.first_booster") : t("ui.seedfinder.second_booster")}</span>
        {j.packName ? <>{" ("}<span className="text-purple-300">{j.packName}</span>{") "}</> : " "}
        <span className="text-purple-300 italic">[{soulType} {t("ui.seedfinder.soul_card_suffix")}]</span>
      </>
    );
  }
  return <>{anteLabel} {j.ante}</>;
}

// Backwards-compatible wrapper (legacy callers expected a plain function).
export function formatLocation(j: SeedMatch["jokerLocations"][number]): React.ReactNode {
  return <FormatLocation j={j} />;
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
  const t = useT();
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
          title={t("ui.seedfinder.copy_seed_title")}
        >
          {t("ui.seedfinder.copy_btn")}
        </Button>
        {onVerify && (
          <Button
            size="sm" variant="ghost" className="h-7 px-2 text-xs text-purple-300 hover:text-purple-200"
            onClick={() => onVerify(match.seed)}
            title={t("ui.seedfinder.verify_match_title")}
          >
            {t("ui.seedfinder.verify_btn")}
          </Button>
        )}
        {showSave && preset && (
          <Button
            size="sm"
            variant={saved ? "ghost" : "default"}
            disabled={saved}
            className={`h-7 px-2 text-xs ${saved ? "text-emerald-300" : "bg-yellow-400 hover:bg-yellow-300 text-zinc-950"}`}
            onClick={onSave}
            title={saved ? t("ui.seedfinder.already_saved") : t("ui.seedfinder.save_match_title")}
            data-testid={`save-seed-${match.seed}`}
          >
            {saved ? <BookmarkCheck className="mr-1 h-3.5 w-3.5" /> : <BookmarkPlus className="mr-1 h-3.5 w-3.5" />}
            {saved ? t("ui.seedfinder.saved") : t("ui.seedfinder.save_this_seed")}
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
                      [{[j.eternal && t("ui.seedfinder.eternal"), j.perishable && t("ui.seedfinder.perishable"), j.rental && t("ui.seedfinder.rental")].filter(Boolean).join(", ")}]
                    </span>
                  )}
                </div>
                <div className="text-xs text-zinc-400"><FormatLocation j={j} /></div>
              </div>
            </div>
          );
        })}

        {(match.voucherLocations?.length ?? 0) > 0 && (
          <div className="pt-1 space-y-0.5">
            {match.voucherLocations.map((v, i) => (
              <div key={"v" + i} className="text-xs text-zinc-300">
                <span className="text-cyan-300 font-semibold">{t("ui.seedfinder.voucher_at")}:</span>{" "}
                <span className="text-zinc-100">{v.voucher}</span>{" — "}
                <span className="text-zinc-400">{t("ui.seedfinder.ante_label")} </span>
                <span className="text-yellow-300 font-mono">{v.ante}</span>
              </div>
            ))}
          </div>
        )}

        {(match.tagLocations?.length ?? 0) > 0 && (
          <div className="pt-1 space-y-0.5">
            {match.tagLocations.map((tg, i) => (
              <div key={"t" + i} className="text-xs text-zinc-300">
                <span className="text-pink-300 font-semibold">{t("ui.seedfinder.tag_at")}:</span>{" "}
                <span className="text-zinc-100">{tg.tag}</span>{" — "}
                <span className="text-zinc-400">{t("ui.seedfinder.ante_label")} </span>
                <span className="text-yellow-300 font-mono">{tg.ante}</span>
                {" · "}
                <span className="text-zinc-300">{tg.blind === 1 ? t("ui.seedfinder.big_blind") : t("ui.seedfinder.small_blind")}</span>
              </div>
            ))}
          </div>
        )}

        {(match.bossLocations?.length ?? 0) > 0 && (
          <div className="pt-1 space-y-0.5">
            {match.bossLocations!.map((b, i) => (
              <div key={"b" + i} className="text-xs text-zinc-300">
                <span className="text-red-300 font-semibold">{t("ui.seedfinder.boss_at")}:</span>{" "}
                <span className="text-zinc-100">{b.boss}</span>{" — "}
                <span className="text-zinc-400">{t("ui.seedfinder.ante_label")} </span>
                <span className="text-yellow-300 font-mono">{b.ante}</span>
              </div>
            ))}
          </div>
        )}

        {(match.standardCardLocations?.length ?? 0) > 0 && (
          <div className="pt-1 space-y-0.5">
            {match.standardCardLocations!.map((sc, i) => {
              // packIndex is 1-based (1..6)
              const pIdx0 = Math.max(0, sc.packIndex - 1);
              const blindIdx = Math.min(2, Math.floor(pIdx0 / 2));
              const positionInShop = (pIdx0 % 2) + 1;
              const blindLabel = blindIdx === 0 ? t("ui.seedfinder.small_blind")
                : blindIdx === 1 ? t("ui.seedfinder.big_blind")
                : t("ui.seedfinder.boss");
              const editionTag = sc.edition && sc.edition !== "" ? ` [${sc.edition}]` : "";
              const sealTag = sc.seal && sc.seal !== "" ? ` (${sc.seal} seal)` : "";
              const enhTag = sc.enhancement && sc.enhancement !== "" ? ` (${sc.enhancement})` : "";
              return (
                <div key={"sc" + i} className="text-xs text-zinc-300">
                  <span className="text-emerald-300 font-semibold">{t("ui.seedfinder.standard_card_at")}:</span>{" "}
                  <span className="text-zinc-100">{sc.base || "—"}</span>
                  {enhTag && <span className="text-emerald-200">{enhTag}</span>}
                  {editionTag && <span className="text-purple-300 italic">{editionTag}</span>}
                  {sealTag && <span className="text-amber-200">{sealTag}</span>}
                  {" — "}
                  <span className="text-zinc-400">{t("ui.seedfinder.ante_label")} </span>
                  <span className="text-yellow-300 font-mono">{sc.ante}</span>
                  {" · "}
                  <span className="text-zinc-300">{blindLabel}</span>
                  {", "}
                  <span className="text-yellow-300">{positionInShop === 1 ? t("ui.seedfinder.first_booster") : t("ui.seedfinder.second_booster")}</span>
                  {sc.packName && <span className="text-purple-300"> ({sc.packName})</span>}
                  {sc.cardIndex > 0 && <>{", "}<span className="text-zinc-400">{t("ui.seedfinder.in_pack_card")} </span><span className="text-yellow-300 font-mono">#{sc.cardIndex}</span></>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
