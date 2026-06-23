// Seeds tab v1.6 — native Balatro seed engine (no external links).
// Ports Immolate / TheSoul to TypeScript. See client/src/lib/seedEngine.ts.
//
// Three sub-tabs:
//   - Spoiler:      per-ante boss/voucher/tags/shop/packs with contents
//   - Joker Hunter: locate a specific joker across antes
//   - Soul Finder:  list every Soul + Black Hole spawn
import { useMemo, useState } from "react";
import { Dices, Search, Sparkles, Skull, Play, Loader2 } from "lucide-react";
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

const ALL_JOKERS = [...COMMON_JOKERS, ...UNCOMMON_JOKERS, ...RARE_JOKERS, ...LEGENDARY_JOKERS]
  .filter((j, i, a) => a.indexOf(j) === i)
  .sort();

const RARITY_LABEL: Record<string, string> = { "1": "Common", "2": "Uncommon", "3": "Rare", "4": "Legendary" };

function editionClass(edition: string): string {
  if (edition === "Foil") return "text-cyan-300";
  if (edition === "Holographic") return "text-pink-300";
  if (edition === "Polychrome") return "text-orange-300";
  if (edition === "Negative") return "text-zinc-400";
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
  return (
    <span className="ml-1 text-[10px] text-amber-300/80">[{parts.join(", ")}]</span>
  );
}

function PackBlock({ p }: { p: PackContents }) {
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
        {p.contents.kind === "buffoon" && p.contents.jokers.map((j, i) => (
          <div key={i} className="text-zinc-300">
            {i + 1}. <span className={rarityClass(j.rarity)}>{j.joker}</span>
            {j.edition !== "No Edition" && <span className={`ml-1 italic ${editionClass(j.edition)}`}>[{j.edition}]</span>}
            {stickerBadge(j.stickers)}
          </div>
        ))}
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
        <span className="text-sm text-zinc-300">
          <b>Tags:</b> {r.tags[0]} · {r.tags[1]}
        </span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Shop Queue</div>
          <div className="space-y-0.5 text-sm">
            {r.shopQueue.map((it, i) => (
              <div key={i} className="font-mono text-xs">
                <span className="text-zinc-500 w-6 inline-block">{i + 1}.</span>
                <span className="text-zinc-400">{it.type}:</span>{" "}
                {it.jokerData ? (
                  <>
                    <span className={rarityClass(it.jokerData.rarity)}>{it.item}</span>
                    {it.jokerData.edition !== "No Edition" && (
                      <span className={`ml-1 italic ${editionClass(it.jokerData.edition)}`}>[{it.jokerData.edition}]</span>
                    )}
                    {stickerBadge(it.jokerData.stickers)}
                  </>
                ) : (
                  <span className={it.item === "The Soul" || it.item === "Black Hole" ? "text-purple-300 font-semibold" : "text-zinc-200"}>
                    {it.item}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Packs</div>
          <div className="space-y-2">
            {r.packs.map((p, i) => <PackBlock key={i} p={p} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

function InputsPanel({
  input, setInput, onRun, isRunning,
}: {
  input: AnalysisInput;
  setInput: (i: AnalysisInput) => void;
  onRun: () => void;
  isRunning: boolean;
}) {
  return (
    <div className="rounded-lg border border-yellow-500/30 bg-zinc-950/80 p-4 space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Dices className="h-5 w-5 text-yellow-300" />
        <h2 className="text-lg font-bold text-yellow-200">Seed Inputs</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <Label className="text-xs text-zinc-400">Seed</Label>
          <Input
            value={input.seed}
            onChange={e => setInput({ ...input, seed: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10) })}
            placeholder="e.g. 8Q47WV6K"
            className="font-mono uppercase"
            data-testid="input-seed"
          />
        </div>
        <div>
          <Label className="text-xs text-zinc-400">Deck</Label>
          <Select value={input.deck} onValueChange={v => setInput({ ...input, deck: v })}>
            <SelectTrigger data-testid="select-deck"><SelectValue /></SelectTrigger>
            <SelectContent>
              {DECKS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-zinc-400">Stake</Label>
          <Select value={input.stake} onValueChange={v => setInput({ ...input, stake: v })}>
            <SelectTrigger data-testid="select-stake"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STAKES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-zinc-400">Game Version</Label>
          <Select value={String(input.version)} onValueChange={v => setInput({ ...input, version: Number(v) })}>
            <SelectTrigger data-testid="select-version"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="10099">1.0.0 (legacy)</SelectItem>
              <SelectItem value="10103">1.0.1c</SelectItem>
              <SelectItem value="10106">1.0.1f / modern</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-zinc-400">Max Ante</Label>
          <Input
            type="number" min={1} max={39}
            value={input.maxAnte}
            onChange={e => setInput({ ...input, maxAnte: Math.max(1, Math.min(39, Number(e.target.value) || 1)) })}
            data-testid="input-maxante"
          />
        </div>
        <div>
          <Label className="text-xs text-zinc-400">Shop items / ante</Label>
          <Input
            type="number" min={1} max={30}
            value={input.cardsPerAnte}
            onChange={e => setInput({ ...input, cardsPerAnte: Math.max(1, Math.min(30, Number(e.target.value) || 1)) })}
            data-testid="input-cards"
          />
        </div>
        <div>
          <Label className="text-xs text-zinc-400">Packs / ante</Label>
          <Input
            type="number" min={0} max={6}
            value={input.packsPerAnte}
            onChange={e => setInput({ ...input, packsPerAnte: Math.max(0, Math.min(6, Number(e.target.value) || 0)) })}
            data-testid="input-packs"
          />
        </div>
        <div className="flex flex-col gap-2 pt-5">
          <label className="flex items-center gap-2 text-xs text-zinc-300">
            <input type="checkbox" checked={input.showman} onChange={e => setInput({ ...input, showman: e.target.checked })} data-testid="check-showman" />
            Showman owned
          </label>
          <label className="flex items-center gap-2 text-xs text-zinc-300">
            <input type="checkbox" checked={input.freshProfile} onChange={e => setInput({ ...input, freshProfile: e.target.checked })} data-testid="check-freshprofile" />
            Fresh profile
          </label>
          <label className="flex items-center gap-2 text-xs text-zinc-300">
            <input type="checkbox" checked={input.freshRun} onChange={e => setInput({ ...input, freshRun: e.target.checked })} data-testid="check-freshrun" />
            Fresh run
          </label>
        </div>
      </div>
      <Button onClick={onRun} disabled={!input.seed || isRunning} className="w-full md:w-auto" data-testid="button-analyze">
        {isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
        Analyze seed
      </Button>
    </div>
  );
}

type SubTab = "spoiler" | "hunter" | "soul";

export function SeedsTab() {
  const [input, setInput] = useState<AnalysisInput>(() => defaultInput(""));
  const [results, setResults] = useState<AnteResult[] | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [subTab, setSubTab] = useState<SubTab>("spoiler");
  const [hunterQuery, setHunterQuery] = useState("");

  const onRun = () => {
    if (!input.seed) return;
    setIsRunning(true);
    // Defer to next tick so the spinner can render. Engine is sync.
    setTimeout(() => {
      try {
        const r = runAnalysis(input);
        setResults(r);
      } finally {
        setIsRunning(false);
      }
    }, 0);
  };

  const soulSpawns = useMemo(() => results ? findSoulSpawns(results) : [], [results]);
  const hunterMatches = useMemo<JokerSighting[]>(
    () => (results && hunterQuery) ? findJoker(results, hunterQuery, 200) : [],
    [results, hunterQuery],
  );

  return (
    <div className="space-y-4 p-2 md:p-4">
      <div className="flex flex-wrap items-baseline gap-3">
        <h1 className="text-2xl font-bold text-yellow-200 flex items-center gap-2">
          <Dices className="h-7 w-7" /> Seeds
        </h1>
        <p className="text-sm text-zinc-400">
          Native Balatro seed analyzer. Computes shop queue, packs, vouchers, bosses, tags, and Soul/Black Hole spawns deterministically from a seed.
        </p>
      </div>

      <InputsPanel input={input} setInput={setInput} onRun={onRun} isRunning={isRunning} />

      {results && (
        <>
          <div className="flex gap-2 border-b border-yellow-500/20 pb-2">
            <Button variant={subTab === "spoiler" ? "default" : "ghost"} onClick={() => setSubTab("spoiler")} size="sm" data-testid="tab-spoiler">
              <Sparkles className="mr-2 h-4 w-4" /> Spoiler
            </Button>
            <Button variant={subTab === "hunter" ? "default" : "ghost"} onClick={() => setSubTab("hunter")} size="sm" data-testid="tab-hunter">
              <Search className="mr-2 h-4 w-4" /> Joker Hunter
            </Button>
            <Button variant={subTab === "soul" ? "default" : "ghost"} onClick={() => setSubTab("soul")} size="sm" data-testid="tab-soul">
              <Skull className="mr-2 h-4 w-4" /> Soul Finder
            </Button>
          </div>

          {subTab === "spoiler" && (
            <div className="space-y-3">
              {results.map(r => <AnteCard key={r.ante} r={r} />)}
            </div>
          )}

          {subTab === "hunter" && (
            <div className="space-y-3">
              <div className="flex flex-col md:flex-row gap-2 items-start md:items-end">
                <div className="flex-1">
                  <Label className="text-xs text-zinc-400">Joker</Label>
                  <Input
                    list="joker-list"
                    value={hunterQuery}
                    onChange={e => setHunterQuery(e.target.value)}
                    placeholder="Perkeo, Blueprint, Brainstorm..."
                    data-testid="input-hunter-query"
                  />
                  <datalist id="joker-list">
                    {ALL_JOKERS.map(j => <option key={j} value={j} />)}
                  </datalist>
                </div>
                <div className="text-xs text-zinc-500 pb-2">
                  {hunterQuery ? `${hunterMatches.length} sighting${hunterMatches.length === 1 ? "" : "s"}` : "Type a joker to hunt."}
                </div>
              </div>
              {hunterQuery && hunterMatches.length === 0 && (
                <div className="text-sm text-zinc-500 italic">
                  No sightings of "{hunterQuery}" in antes 1-{input.maxAnte}. Try a higher max ante.
                </div>
              )}
              {hunterMatches.length > 0 && (
                <div className="rounded-lg border border-yellow-500/30 bg-zinc-950/80 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-zinc-900/70 text-zinc-400 text-xs uppercase">
                      <tr>
                        <th className="p-2 text-left">Ante</th>
                        <th className="p-2 text-left">Source</th>
                        <th className="p-2 text-left">Rarity</th>
                        <th className="p-2 text-left">Edition</th>
                        <th className="p-2 text-left">Stickers</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hunterMatches.map((m, i) => (
                        <tr key={i} className="border-t border-zinc-800/60">
                          <td className="p-2 font-mono">{m.ante}</td>
                          <td className="p-2">
                            {m.source === "shop" ? "Shop" : m.source === "buffoon-pack" ? `Buffoon pack (${m.packName})` : m.source}
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
          )}

          {subTab === "soul" && (
            <div className="space-y-3">
              <div className="text-xs text-zinc-500">
                The Soul (rolls a random Legendary) appears in Arcana / Spectral packs. Black Hole (upgrades a poker hand) appears in Celestial / Spectral packs.
                Both gate on <code className="text-amber-300">random("soul_*") &gt; 0.997</code> per pack.
              </div>
              {soulSpawns.length === 0 ? (
                <div className="text-sm text-zinc-500 italic">
                  No Soul or Black Hole spawns in antes 1-{input.maxAnte}.
                </div>
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
                      {soulSpawns.map((s, i) => (
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
          )}
        </>
      )}

      {!results && (
        <div className="text-center text-sm text-zinc-500 italic py-12">
          Enter a seed and click <b>Analyze seed</b> to see the full per-ante breakdown.
        </div>
      )}
    </div>
  );
}
