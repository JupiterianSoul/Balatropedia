// SeedsTab v1.7.1 - reworked into 2 sub-tabs: Seed Analyzer (input seed -> info)
// and Seed Finder (input wants -> find seed). Analyzer combines old Spoiler /
// Joker Hunter / Soul Finder into one workflow with a View toggle.
import { useMemo, useState } from "react";
import { Dices, Search, Play, Loader2, Target, Telescope, Skull, Sparkles, ListTree } from "lucide-react";
import { JokerSprite } from "@/components/JokerSprite";
import { jokerIdFromName } from "@/lib/helpers";
import { SeedFinderTab } from "./SeedFinderTab";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  defaultInput, runAnalysis, findJoker, findSoulSpawns,
  type AnalysisInput, type AnteResult, type PackContents, type JokerSighting,
} from "@/lib/seedEngine";
import {
  DECKS, STAKES, COMMON_JOKERS, UNCOMMON_JOKERS, RARE_JOKERS, LEGENDARY_JOKERS,
} from "@/lib/seedItems";
import { describeShopSlot, describePackSlot } from "@/lib/seedFinderLocation";

const ALL_JOKERS = [...COMMON_JOKERS, ...UNCOMMON_JOKERS, ...RARE_JOKERS, ...LEGENDARY_JOKERS]
  .filter((j, i, a) => a.indexOf(j) === i)
  .sort();

const RARITY_LABEL: Record<string, string> = { "1": "Common", "2": "Uncommon", "3": "Rare", "4": "Legendary" };

function editionClass(edition: string): string {
  if (edition === "Foil") return "text-cyan-300";
  if (edition === "Holographic") return "text-pink-300";
  if (edition === "Polychrome") return "text-orange-300";
  if (edition === "Negative") return "text-zinc-100 font-semibold";
  return "";
}

function rarityClass(rarity: string): string {
  if (rarity === "1") return "text-zinc-300";
  if (rarity === "2") return "text-emerald-300";
  if (rarity === "3") return "text-red-300";
  if (rarity === "4") return "text-purple-300";
  return "";
}

function stickerBadge(s: { eternal: boolean; perishable: boolean; rental: boolean }) {
  const parts: string[] = [];
  if (s.eternal) parts.push("Eternal");
  if (s.perishable) parts.push("Perishable");
  if (s.rental) parts.push("Rental");
  if (parts.length === 0) return null;
  return <span className="ml-1 text-[10px] text-amber-300/80">[{parts.join(", ")}]</span>;
}

// --- Pack block in spoiler ---
function PackBlock({ p, ante }: { p: PackContents; ante: number }) {
  // Render pack header with "After X Blind, Nth booster" hint.
  // p has `index` is not exported; we use the array index from the parent's map below.
  return (
    <div className="rounded-md border border-yellow-500/20 bg-zinc-900/60 p-2 text-sm">
      <div className="font-semibold text-yellow-200">
        {p.name} <span className="text-zinc-500 text-xs">(size {p.size}, choose {p.choices})</span>
      </div>
      <div className="mt-1 text-xs space-y-0.5">
        {p.contents.kind === "tarot" && p.contents.items.map((it, i) => (
          <div key={i} className={it === "The Soul" || it === "Black Hole" ? "text-purple-300 font-semibold" : "text-zinc-300"}>
            {i + 1}. {it}
          </div>
        ))}
        {p.contents.kind === "planet" && p.contents.items.map((it, i) => (
          <div key={i} className={it === "Black Hole" ? "text-purple-300 font-semibold" : "text-zinc-300"}>
            {i + 1}. {it}
          </div>
        ))}
        {p.contents.kind === "spectral" && p.contents.items.map((it, i) => (
          <div key={i} className={it === "The Soul" || it === "Black Hole" ? "text-purple-300 font-semibold" : "text-zinc-300"}>
            {i + 1}. {it}
          </div>
        ))}
        {p.contents.kind === "standard" && p.contents.cards.map((c, i) => (
          <div key={i} className={`text-zinc-300 ${editionClass(c.edition)}`}>
            {i + 1}. {c.base}
            {c.enhancement !== "No Enhancement" && <span className="text-amber-400/70"> / {c.enhancement}</span>}
            {c.edition !== "No Edition" && <span className="ml-1 italic opacity-80">[{c.edition}]</span>}
            {c.seal !== "No Seal" && <span className="ml-1 text-blue-300/80">[{c.seal}]</span>}
          </div>
        ))}
        {p.contents.kind === "buffoon" && p.contents.jokers.map((j, i) => {
          const id = jokerIdFromName(j.joker);
          return (
            <div key={i} className="flex items-center gap-1.5 text-zinc-300">
              <span className="text-zinc-500">{i + 1}.</span>
              {id && <JokerSprite jokerId={id} name={j.joker} size={28} className="border-0 bg-transparent" />}
              <span className={rarityClass(j.rarity)}>{j.joker}</span>
              {j.edition !== "No Edition" && <span className={`italic ${editionClass(j.edition)}`}>[{j.edition}]</span>}
              {stickerBadge(j.stickers)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AnteCard({ r }: { r: AnteResult }) {
  return (
    <div className="rounded-lg border border-yellow-500/30 bg-zinc-950/80 p-3 shadow-md">
      <div className="flex flex-wrap items-baseline gap-3 mb-2">
        <h3 className="text-lg font-bold text-yellow-200">Ante {r.ante}</h3>
        <span className="text-sm text-red-300"><b>Boss:</b> {r.boss}</span>
        <span className="text-sm text-emerald-300"><b>Voucher:</b> {r.voucher}</span>
        <span className="text-sm text-zinc-300"><b>Tags:</b> {r.tags[0]} (Small) · {r.tags[1]} (Big)</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Shop Queue</div>
          <div className="space-y-0.5 text-sm">
            {r.shopQueue.map((it, i) => {
              const slot = i + 1;
              const info = describeShopSlot(slot, r.ante);
              const showDivider = i > 0 && info.positionInShop === 1;
              const jid = it.jokerData ? jokerIdFromName(it.item) : undefined;
              return (
                <div key={i}>
                  {showDivider && (
                    <div className="text-[10px] uppercase tracking-wider text-yellow-300/60 mt-2 mb-1 border-t border-yellow-500/15 pt-1">
                      {info.blindLabel}
                    </div>
                  )}
                  {i === 0 && (
                    <div className="text-[10px] uppercase tracking-wider text-yellow-300/60 mb-1">
                      {info.blindLabel}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-zinc-500 font-mono w-6">{info.positionInShop}.</span>
                    {jid && <JokerSprite jokerId={jid} name={it.item} size={26} className="border-0 bg-transparent" />}
                    <span className="text-zinc-400 font-mono">{it.type}:</span>
                    {it.jokerData ? (
                      <>
                        <span className={rarityClass(it.jokerData.rarity)}>{it.item}</span>
                        {it.jokerData.edition !== "No Edition" && (
                          <span className={`italic ${editionClass(it.jokerData.edition)}`}>[{it.jokerData.edition}]</span>
                        )}
                        {stickerBadge(it.jokerData.stickers)}
                      </>
                    ) : (
                      <span className={it.item === "The Soul" || it.item === "Black Hole" ? "text-purple-300 font-semibold" : "text-zinc-200"}>
                        {it.item}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Boosters</div>
          <div className="space-y-2">
            {r.packs.map((p, i) => {
              const packIdx = i + 1;
              const info = describePackSlot(packIdx, r.ante);
              const showDivider = i > 0 && info.positionInShop === 1;
              return (
                <div key={i}>
                  {(i === 0 || showDivider) && (
                    <div className="text-[10px] uppercase tracking-wider text-yellow-300/60 mb-1">
                      {info.blindLabel}
                    </div>
                  )}
                  <div className="text-[10px] text-zinc-500 mb-0.5">
                    {info.positionInShop === 1 ? "1st" : "2nd"} booster
                  </div>
                  <PackBlock p={p} ante={r.ante} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Inputs (shared by all analyzer views) ----

function InputsPanel({
  input, setInput, onRun, isRunning,
}: {
  input: AnalysisInput;
  setInput: (i: AnalysisInput) => void;
  onRun: () => void;
  isRunning: boolean;
}) {
  return (
    <div className="rounded-lg border border-yellow-500/30 bg-zinc-950/80 p-3 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
        <div className="lg:col-span-2">
          <Label className="text-xs text-zinc-400">Seed</Label>
          <Input
            value={input.seed}
            onChange={e => setInput({ ...input, seed: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10) })}
            placeholder="e.g. 8Q47WV6K"
            className="font-mono uppercase h-9"
            data-testid="input-seed"
          />
        </div>
        <div>
          <Label className="text-xs text-zinc-400">Deck</Label>
          <Select value={input.deck} onValueChange={v => setInput({ ...input, deck: v })}>
            <SelectTrigger className="h-9" data-testid="select-deck"><SelectValue /></SelectTrigger>
            <SelectContent>
              {DECKS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-zinc-400">Stake</Label>
          <Select value={input.stake} onValueChange={v => setInput({ ...input, stake: v })}>
            <SelectTrigger className="h-9" data-testid="select-stake"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STAKES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-zinc-400">Version</Label>
          <Select value={String(input.version)} onValueChange={v => setInput({ ...input, version: Number(v) })}>
            <SelectTrigger className="h-9" data-testid="select-version"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="10099">1.0.0 (legacy)</SelectItem>
              <SelectItem value="10103">1.0.1c</SelectItem>
              <SelectItem value="10106">1.0.1f / modern</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <details className="text-xs">
        <summary className="cursor-pointer text-zinc-400 hover:text-zinc-200 select-none">Advanced options</summary>
        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 p-2 rounded border border-zinc-800/50 bg-zinc-900/30">
          <div>
            <Label className="text-xs text-zinc-400">Max Ante</Label>
            <Input
              type="number" min={1} max={39}
              value={input.maxAnte}
              onChange={e => setInput({ ...input, maxAnte: Math.max(1, Math.min(39, Number(e.target.value) || 1)) })}
              className="h-8"
            />
          </div>
          <div>
            <Label className="text-xs text-zinc-400">Shop items / ante</Label>
            <Input
              type="number" min={1} max={30}
              value={input.cardsPerAnte}
              onChange={e => setInput({ ...input, cardsPerAnte: Math.max(1, Math.min(30, Number(e.target.value) || 1)) })}
              className="h-8"
            />
          </div>
          <div>
            <Label className="text-xs text-zinc-400">Packs / ante</Label>
            <Input
              type="number" min={0} max={6}
              value={input.packsPerAnte}
              onChange={e => setInput({ ...input, packsPerAnte: Math.max(0, Math.min(6, Number(e.target.value) || 0)) })}
              className="h-8"
            />
          </div>
          <div className="flex flex-col gap-1 pt-3 text-zinc-300">
            <label className="flex items-center gap-2"><input type="checkbox" checked={input.showman} onChange={e => setInput({ ...input, showman: e.target.checked })} /> Showman owned</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={input.freshProfile} onChange={e => setInput({ ...input, freshProfile: e.target.checked })} /> Fresh profile</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={input.freshRun} onChange={e => setInput({ ...input, freshRun: e.target.checked })} /> Fresh run</label>
          </div>
        </div>
      </details>
      <Button onClick={onRun} disabled={!input.seed || isRunning} className="w-full md:w-auto bg-yellow-400 hover:bg-yellow-300 text-zinc-950" data-testid="button-analyze">
        {isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
        Analyze seed
      </Button>
    </div>
  );
}

// ---- Sub-views ----

type AnalyzerView = "spoiler" | "joker" | "soul";

function ViewSwitcher({ view, onChange }: { view: AnalyzerView; onChange: (v: AnalyzerView) => void }) {
  const btn = (v: AnalyzerView, label: string, Icon: any) => (
    <Button
      key={v}
      size="sm"
      variant={view === v ? "default" : "ghost"}
      onClick={() => onChange(v)}
      className={view === v ? "bg-yellow-400 hover:bg-yellow-300 text-zinc-950" : ""}
    >
      <Icon className="mr-2 h-4 w-4" /> {label}
    </Button>
  );
  return (
    <div className="flex flex-wrap gap-1 border-b border-yellow-500/15 pb-2">
      {btn("spoiler", "Full Spoiler", ListTree)}
      {btn("joker", "Find a Joker", Search)}
      {btn("soul", "Soul / Black Hole", Skull)}
    </div>
  );
}

function JokerHuntView({ results, maxAnte }: { results: AnteResult[]; maxAnte: number }) {
  const [query, setQuery] = useState("");
  const matches = useMemo<JokerSighting[]>(() => query ? findJoker(results, query, 200) : [], [results, query]);
  const id = jokerIdFromName(query);

  return (
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row gap-2 items-start md:items-end">
        <div className="flex-1">
          <Label className="text-xs text-zinc-400">Joker name</Label>
          <Input
            list="joker-list"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Perkeo, Blueprint, Brainstorm..."
            data-testid="input-hunter-query"
          />
          <datalist id="joker-list">
            {ALL_JOKERS.map(j => <option key={j} value={j} />)}
          </datalist>
        </div>
        <div className="text-xs text-zinc-500 pb-2">
          {query ? `${matches.length} sighting${matches.length === 1 ? "" : "s"} in antes 1-${maxAnte}` : "Type a joker name."}
        </div>
      </div>
      {query && matches.length === 0 && (
        <div className="text-sm text-zinc-500 italic">
          No sightings of "{query}" in antes 1-{maxAnte}. Try a higher max ante.
        </div>
      )}
      {matches.length > 0 && (
        <div className="rounded-lg border border-yellow-500/30 bg-zinc-950/80 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900/70 text-zinc-400 text-xs uppercase">
              <tr>
                <th className="p-2 text-left w-[40px]"></th>
                <th className="p-2 text-left">Ante</th>
                <th className="p-2 text-left">Location</th>
                <th className="p-2 text-left">Rarity</th>
                <th className="p-2 text-left">Edition</th>
                <th className="p-2 text-left">Stickers</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((m, i) => (
                <tr key={i} className="border-t border-zinc-800/60">
                  <td className="p-1 w-[40px]">
                    {id && i === 0 && <JokerSprite jokerId={id} name={query} size={36} className="border-0 bg-transparent" />}
                  </td>
                  <td className="p-2 font-mono">{m.ante}</td>
                  <td className="p-2 text-zinc-300">
                    {renderHunterLocation(m)}
                  </td>
                  <td className={`p-2 ${rarityClass(m.rarity)}`}>{RARITY_LABEL[m.rarity] || m.rarity}</td>
                  <td className={`p-2 italic ${editionClass(m.edition)}`}>{m.edition}</td>
                  <td className="p-2 text-amber-300/80">
                    {[m.stickers.eternal && "Eternal", m.stickers.perishable && "Perishable", m.stickers.rental && "Rental"].filter(Boolean).join(", ") || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function renderHunterLocation(m: JokerSighting): React.ReactNode {
  // JokerSighting source: "shop" with slot, OR "buffoon-pack" with packIndex + packName + position-in-pack.
  // Fall back gracefully for other shapes.
  const anyM = m as any;
  if (m.source === "shop") {
    const slot = anyM.slot ?? anyM.shopSlot;
    if (slot) {
      const info = describeShopSlot(slot, m.ante);
      return <>{info.blindLabel}, shop item <span className="font-mono">{info.positionInShop}</span></>;
    }
    return "Shop";
  }
  if (m.source === "buffoon-pack") {
    const packIdx = anyM.packIndex ?? anyM.slot;
    const packName = anyM.packName ?? "Buffoon Pack";
    const pos = anyM.position ?? anyM.packPosition;
    if (packIdx) {
      const info = describePackSlot(packIdx, m.ante);
      return (
        <>
          {info.blindLabel}, {info.positionInShop === 1 ? "1st" : "2nd"} booster
          {" ("}<span className="text-purple-300">{packName}</span>{")"}
          {pos && <>, card <span className="font-mono">#{pos}</span></>}
        </>
      );
    }
    return <span className="text-purple-300">{packName}</span>;
  }
  return m.source;
}

function SoulView({ results, maxAnte }: { results: AnteResult[]; maxAnte: number }) {
  const spawns = useMemo(() => findSoulSpawns(results), [results]);
  return (
    <div className="space-y-3">
      <div className="text-xs text-zinc-500">
        The Soul rolls a random Legendary joker and appears in Arcana / Spectral packs. Black Hole upgrades a poker hand and appears in Celestial / Spectral packs.
        Both gate on <code className="text-amber-300">random("soul_*") &gt; 0.997</code> per pack.
      </div>
      {spawns.length === 0 ? (
        <div className="text-sm text-zinc-500 italic">No Soul or Black Hole spawns in antes 1-{maxAnte}.</div>
      ) : (
        <div className="rounded-lg border border-yellow-500/30 bg-zinc-950/80 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900/70 text-zinc-400 text-xs uppercase">
              <tr>
                <th className="p-2 text-left">Ante</th>
                <th className="p-2 text-left">Card</th>
                <th className="p-2 text-left">Pack</th>
                <th className="p-2 text-left">Source</th>
              </tr>
            </thead>
            <tbody>
              {spawns.map((s, i) => (
                <tr key={i} className="border-t border-zinc-800/60">
                  <td className="p-2 font-mono">{s.ante}</td>
                  <td className="p-2 text-purple-300 font-semibold">{s.card}</td>
                  <td className="p-2">{s.packName}</td>
                  <td className="p-2 text-zinc-400">{s.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---- Outer SeedsTab ----

type SubTab = "analyzer" | "finder";

export function SeedsTab() {
  const [subTab, setSubTab] = useState<SubTab>("analyzer");

  // analyzer state
  const [input, setInput] = useState<AnalysisInput>(() => defaultInput(""));
  const [results, setResults] = useState<AnteResult[] | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [view, setView] = useState<AnalyzerView>("spoiler");

  const onRun = () => {
    if (!input.seed) return;
    setIsRunning(true);
    setTimeout(() => {
      try {
        const r = runAnalysis(input);
        setResults(r);
      } finally {
        setIsRunning(false);
      }
    }, 0);
  };

  return (
    <div className="space-y-4 p-2 md:p-4">
      <div className="flex flex-wrap items-baseline gap-3">
        <h1 className="text-2xl font-bold text-yellow-200 flex items-center gap-2">
          <Dices className="h-7 w-7" /> Seeds
        </h1>
        <p className="text-sm text-zinc-400">
          Two tools: analyze a seed you already have, or search for a seed matching what you want.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-yellow-500/30 pb-2">
        <Button
          variant={subTab === "analyzer" ? "default" : "ghost"}
          onClick={() => setSubTab("analyzer")}
          className={subTab === "analyzer" ? "bg-yellow-400 hover:bg-yellow-300 text-zinc-950" : ""}
          data-testid="tab-analyzer"
        >
          <Telescope className="mr-2 h-4 w-4" /> Seed Analyzer
        </Button>
        <Button
          variant={subTab === "finder" ? "default" : "ghost"}
          onClick={() => setSubTab("finder")}
          className={subTab === "finder" ? "bg-yellow-400 hover:bg-yellow-300 text-zinc-950" : ""}
          data-testid="tab-finder"
        >
          <Target className="mr-2 h-4 w-4" /> Seed Finder
        </Button>
      </div>

      {subTab === "finder" && <SeedFinderTab />}

      {subTab === "analyzer" && (
        <div className="space-y-4">
          <InputsPanel input={input} setInput={setInput} onRun={onRun} isRunning={isRunning} />

          {results && (
            <>
              <ViewSwitcher view={view} onChange={setView} />
              {view === "spoiler" && (
                <div className="space-y-3">
                  {results.map(r => <AnteCard key={r.ante} r={r} />)}
                </div>
              )}
              {view === "joker" && <JokerHuntView results={results} maxAnte={input.maxAnte} />}
              {view === "soul" && <SoulView results={results} maxAnte={input.maxAnte} />}
            </>
          )}

          {!results && (
            <div className="text-center text-sm text-zinc-500 italic py-12">
              Enter a seed and click <b>Analyze seed</b> to see boss, voucher, tags, shop queue, every booster and its contents, and locate any joker or Soul spawn.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
