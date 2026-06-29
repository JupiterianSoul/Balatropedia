import { useMemo, useState } from "react";
import { TabIntro } from "@/components/TabIntro";
import {
  Dices, Search, Play, Loader2, Target, Telescope, Skull, Sparkles, ListTree,
  Library, ChevronDown, ChevronRight,
} from "lucide-react";
import { JokerSprite } from "@/components/JokerSprite";
import { jokerIdFromName } from "@/lib/helpers";
import { SeedFinderTab } from "./SeedFinderTab";
import { SeedLibraryTab } from "./SeedLibraryTab";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  runAnalysis, findJoker, findSoulSpawns,
  type AnalysisInput, type AnteResult, type PackContents, type JokerSighting,
  type SoulSighting,
} from "@/lib/seedEngine";
import {
  DECKS, STAKES, COMMON_JOKERS, UNCOMMON_JOKERS, RARE_JOKERS, LEGENDARY_JOKERS,
} from "@/lib/seedItems";
import { describeShopSlot, describePackSlot } from "@/lib/seedFinderLocation";
import {
  useSeedTabState, setAnalyzer, type AnalyzerView,
} from "@/lib/seedTabState";
import { useT } from "@/lib/i18n";

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

function SoulResolved({ joker, rarity, edition }: { joker: string; rarity: string; edition: string }) {
  const id = jokerIdFromName(joker);
  return (
    <span className="ml-2 inline-flex items-center gap-1 align-middle">
      <span className="text-zinc-500">→</span>
      {id && <JokerSprite jokerId={id} name={joker} size={22} className="border-0 bg-transparent" />}
      <span className={`font-semibold ${rarityClass(rarity)}`}>{joker}</span>
      {edition !== "No Edition" && (
        <span className={`italic text-xs ${editionClass(edition)}`}>[{edition}]</span>
      )}
    </span>
  );
}

function PackBlock({ p }: { p: PackContents }) {
  const isSoulCard = (it: string) => it === "The Soul" || it === "Black Hole";
  const resolutions = (p.contents.kind === "tarot" || p.contents.kind === "spectral")
    ? (p.contents.soulResolutions || [])
    : [];

  return (
    <div className="rounded-md border border-yellow-500/15 bg-zinc-900/40 px-2.5 py-2 text-sm">
      <div className="flex items-baseline justify-between gap-2 mb-1.5">
        <div className="font-semibold text-yellow-200">{p.name}</div>
        <div className="text-[10px] text-zinc-500">size {p.size} · pick {p.choices}</div>
      </div>
      <div className="space-y-0.5 text-xs">
        {p.contents.kind === "tarot" && p.contents.items.map((it, i) => {
          const resolved = resolutions.find(r => r.position === i);
          return (
            <div key={i} className={isSoulCard(it) ? "text-purple-300 font-semibold" : "text-zinc-300"}>
              <span className="text-zinc-500 mr-1">{i + 1}.</span>{it}
              {resolved && (
                <SoulResolved joker={resolved.joker.joker} rarity={resolved.joker.rarity} edition={resolved.joker.edition} />
              )}
            </div>
          );
        })}
        {p.contents.kind === "planet" && p.contents.items.map((it, i) => (
          <div key={i} className={it === "Black Hole" ? "text-purple-300 font-semibold" : "text-zinc-300"}>
            <span className="text-zinc-500 mr-1">{i + 1}.</span>{it}
          </div>
        ))}
        {p.contents.kind === "spectral" && p.contents.items.map((it, i) => {
          const resolved = resolutions.find(r => r.position === i);
          return (
            <div key={i} className={isSoulCard(it) ? "text-purple-300 font-semibold" : "text-zinc-300"}>
              <span className="text-zinc-500 mr-1">{i + 1}.</span>{it}
              {resolved && (
                <SoulResolved joker={resolved.joker.joker} rarity={resolved.joker.rarity} edition={resolved.joker.edition} />
              )}
            </div>
          );
        })}
        {p.contents.kind === "standard" && p.contents.cards.map((c, i) => (
          <div key={i} className={`text-zinc-300 ${editionClass(c.edition)}`}>
            <span className="text-zinc-500 mr-1">{i + 1}.</span>{c.base}
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
              {id && <JokerSprite jokerId={id} name={j.joker} size={26} className="border-0 bg-transparent" />}
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

function AnteBody({ r }: { r: AnteResult }) {
  const t = useT();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-2">
      <div className="rounded-md border border-zinc-800/60 bg-zinc-950/50 p-2.5">
        <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">{t("ui.seeds.shop_queue")}</div>
        <div className="space-y-0.5 text-xs">
          {r.shopQueue.map((it, i) => {
            const slot = i + 1;
            const info = describeShopSlot(slot, r.ante);
            const showDivider = i > 0 && info.positionInShop === 1;
            const jid = it.jokerData ? jokerIdFromName(it.item) : undefined;
            return (
              <div key={i}>
                {(i === 0 || showDivider) && (
                  <div className="text-[10px] uppercase tracking-wider text-yellow-300/60 mb-1 mt-1.5 first:mt-0">
                    {info.blindLabel}
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-500 font-mono w-5 text-right">{info.positionInShop}.</span>
                  {jid && <JokerSprite jokerId={jid} name={it.item} size={26} className="border-0 bg-transparent" />}
                  <span className="text-zinc-500 font-mono text-[10px] uppercase">{it.type}</span>
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
      <div className="rounded-md border border-zinc-800/60 bg-zinc-950/50 p-2.5">
        <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">Boosters</div>
        <div className="space-y-2">
          {r.packs.map((p, i) => {
            const packIdx = i + 1;
            const info = describePackSlot(packIdx, r.ante);
            const showDivider = i > 0 && info.positionInShop === 1;
            return (
              <div key={i}>
                {(i === 0 || showDivider) && (
                  <div className="text-[10px] uppercase tracking-wider text-yellow-300/60 mb-1 mt-1.5 first:mt-0">
                    {info.blindLabel}
                  </div>
                )}
                <div className="text-[10px] text-zinc-500 mb-0.5">
                  {info.positionInShop === 1 ? "1st" : "2nd"} booster
                </div>
                <PackBlock p={p} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AnteRow({ r, expanded, onToggle }: { r: AnteResult; expanded: boolean; onToggle: () => void }) {
  const hasSoul = r.packs.some(p =>
    (p.contents.kind === "tarot" || p.contents.kind === "spectral")
    && p.contents.items.some(it => it === "The Soul" || it === "Black Hole")
  );

  return (
    <div className={`rounded-lg border bg-zinc-950/80 transition-colors ${expanded ? "border-yellow-500/40" : "border-zinc-800/60 hover:border-yellow-500/25"}`}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
        data-testid={`spoiler-ante-${r.ante}`}
      >
        {expanded ? <ChevronDown className="h-4 w-4 text-yellow-300 shrink-0" /> : <ChevronRight className="h-4 w-4 text-zinc-500 shrink-0" />}
        <div className="text-base font-bold text-yellow-200 w-[70px] shrink-0">Ante {r.ante}</div>
        <div className="flex-1 min-w-0 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-xs">
          <span><span className="text-zinc-500">Boss </span><span className="text-red-300">{r.boss}</span></span>
          <span><span className="text-zinc-500">Voucher </span><span className="text-emerald-300">{r.voucher}</span></span>
          <span className="text-zinc-400"><span className="text-zinc-500">Tags </span>{r.tags[0]} · {r.tags[1]}</span>
        </div>
        {hasSoul && <span className="text-[10px] text-purple-300 font-semibold uppercase tracking-wider shrink-0">Soul</span>}
      </button>
      {expanded && (
        <div className="px-3 pb-3">
          <AnteBody r={r} />
        </div>
      )}
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
  const t = useT();
  return (
    <div className="rounded-lg border border-yellow-500/30 bg-zinc-950/80 p-3 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
        <div className="lg:col-span-2">
          <Label className="text-xs text-zinc-400">{t("ui.seeds.seed")}</Label>
          <Input
            value={input.seed}
            onChange={e => setInput({ ...input, seed: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10) })}
            placeholder={t("ui.seeds.seed_placeholder")}
            className="font-mono uppercase h-9"
            data-testid="input-seed"
          />
        </div>
        <div>
          <Label className="text-xs text-zinc-400">{t("ui.seeds.deck")}</Label>
          <Select value={input.deck} onValueChange={v => setInput({ ...input, deck: v })}>
            <SelectTrigger className="h-9" data-testid="select-deck"><SelectValue /></SelectTrigger>
            <SelectContent>
              {DECKS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-zinc-400">{t("ui.seeds.stake")}</Label>
          <Select value={input.stake} onValueChange={v => setInput({ ...input, stake: v })}>
            <SelectTrigger className="h-9" data-testid="select-stake"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STAKES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-zinc-400">{t("ui.seeds.version")}</Label>
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
        <summary className="cursor-pointer text-zinc-400 hover:text-zinc-200 select-none">{t("ui.seeds.advanced_options")}</summary>
        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 p-2 rounded border border-zinc-800/50 bg-zinc-900/30">
          <div>
            <Label className="text-xs text-zinc-400">{t("ui.seeds.max_ante")}</Label>
            <Input
              type="number" min={1} max={39}
              value={input.maxAnte}
              onChange={e => setInput({ ...input, maxAnte: Math.max(1, Math.min(39, Number(e.target.value) || 1)) })}
              className="h-8"
            />
          </div>
          <div>
            <Label className="text-xs text-zinc-400">{t("ui.seeds.shop_items_ante")}</Label>
            <Input
              type="number" min={1} max={30}
              value={input.cardsPerAnte}
              onChange={e => setInput({ ...input, cardsPerAnte: Math.max(1, Math.min(30, Number(e.target.value) || 1)) })}
              className="h-8"
            />
          </div>
          <div>
            <Label className="text-xs text-zinc-400">{t("ui.seeds.packs_ante")}</Label>
            <Input
              type="number" min={0} max={6}
              value={input.packsPerAnte}
              onChange={e => setInput({ ...input, packsPerAnte: Math.max(0, Math.min(6, Number(e.target.value) || 0)) })}
              className="h-8"
            />
          </div>
          <div className="flex flex-col gap-1 pt-3 text-zinc-300">
            <label className="flex items-center gap-2"><input type="checkbox" checked={input.showman} onChange={e => setInput({ ...input, showman: e.target.checked })} /> {t("ui.seeds.showman")}</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={input.freshProfile} onChange={e => setInput({ ...input, freshProfile: e.target.checked })} /> {t("ui.seeds.fresh_profile")}</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={input.freshRun} onChange={e => setInput({ ...input, freshRun: e.target.checked })} /> {t("ui.seeds.fresh_run")}</label>
          </div>
        </div>
      </details>
      <Button onClick={onRun} disabled={!input.seed || isRunning} className="w-full md:w-auto bg-yellow-400 hover:bg-yellow-300 text-zinc-950" data-testid="button-analyze">
        {isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
        {t("ui.seeds.analyze_seed")}
      </Button>
    </div>
  );
}

function ViewSwitcher({ view, onChange }: { view: AnalyzerView; onChange: (v: AnalyzerView) => void }) {
  const t = useT();
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
      {btn("spoiler", t("ui.seeds.full_spoiler"), ListTree)}
      {btn("joker", t("ui.seeds.find_joker"), Search)}
      {btn("soul", t("ui.seeds.soul_black_hole"), Skull)}
    </div>
  );
}

function FullSpoilerView({ results }: { results: AnteResult[] }) {
  const t = useT();
  const [expanded, setExpanded] = useState<Record<number, boolean>>(() => ({ [results[0]?.ante ?? 1]: true }));

  const allOpen = results.every(r => expanded[r.ante]);
  const toggleAll = () => {
    if (allOpen) setExpanded({});
    else setExpanded(Object.fromEntries(results.map(r => [r.ante, true])));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-xs text-zinc-500">{t("ui.seeds.click_ante_hint")}</div>
        <Button size="sm" variant="ghost" onClick={toggleAll} className="text-xs h-7">
          {allOpen ? t("ui.seeds.collapse_all") : t("ui.seeds.expand_all")}
        </Button>
      </div>
      <div className="space-y-1.5">
        {results.map(r => (
          <AnteRow
            key={r.ante}
            r={r}
            expanded={!!expanded[r.ante]}
            onToggle={() => setExpanded(e => ({ ...e, [r.ante]: !e[r.ante] }))}
          />
        ))}
      </div>
    </div>
  );
}

function JokerHuntView({ results, maxAnte }: { results: AnteResult[]; maxAnte: number }) {
  const t = useT();
  const query = useSeedTabState(s => s.analyzer.jokerQuery);
  const setQuery = (v: string) => setAnalyzer({ jokerQuery: v });
  const matches = useMemo<JokerSighting[]>(() => query ? findJoker(results, query, 200) : [], [results, query]);
  const id = jokerIdFromName(query);

  return (
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row gap-2 items-start md:items-end">
        <div className="flex-1">
          <Label className="text-xs text-zinc-400">{t("ui.seeds.joker_name")}</Label>
          <Input
            list="joker-list"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t("ui.seeds.joker_placeholder")}
            data-testid="input-hunter-query"
          />
          <datalist id="joker-list">
            {ALL_JOKERS.map(j => <option key={j} value={j} />)}
          </datalist>
        </div>
        <div className="text-xs text-zinc-500 pb-2">
          {query ? t("ui.seeds.sightings_in_antes", { n: String(matches.length), m: String(maxAnte) }) : t("ui.seeds.type_joker_name")}
        </div>
      </div>
      {query && matches.length === 0 && (
        <div className="text-sm text-zinc-500 italic">
          {t("ui.seeds.no_sightings", { q: query, m: String(maxAnte) })}
        </div>
      )}
      {matches.length > 0 && (
        <div className="rounded-lg border border-yellow-500/30 bg-zinc-950/80 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900/70 text-zinc-400 text-xs uppercase">
              <tr>
                <th className="p-2 text-left w-[40px]"></th>
                <th className="p-2 text-left">{t("ui.seeds.col_ante")}</th>
                <th className="p-2 text-left">{t("ui.seeds.col_location")}</th>
                <th className="p-2 text-left">{t("ui.seeds.col_rarity")}</th>
                <th className="p-2 text-left">{t("ui.seeds.col_edition")}</th>
                <th className="p-2 text-left">{t("ui.seeds.col_stickers")}</th>
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
  const t = useT();
  const spawns = useMemo<SoulSighting[]>(() => findSoulSpawns(results), [results]);
  return (
    <div className="space-y-3">
      <div className="text-xs text-zinc-500">
        {t("ui.seeds.soul_explanation")}
        {" "}{t("ui.seeds.both_gate_on")} <code className="text-amber-300">random("soul_*") &gt; 0.997</code> {t("ui.seeds.per_pack")}.
      </div>
      {spawns.length === 0 ? (
        <div className="text-sm text-zinc-500 italic">{t("ui.seeds.no_soul_spawns", { m: String(maxAnte) })}</div>
      ) : (
        <div className="space-y-2">
          {spawns.map((s, i) => {
            const id = s.resolvedJoker ? jokerIdFromName(s.resolvedJoker.joker) : undefined;
            return (
              <div key={i} className="rounded-md border border-purple-500/30 bg-purple-950/10 p-2.5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span className="font-mono text-yellow-300">{t("ui.seeds.col_ante")} {s.ante}</span>
                  <span className="text-purple-300 font-semibold">{s.card}</span>
                  <span className="text-zinc-400 text-xs">{t("ui.seeds.in")} {s.packName}</span>
                  <span className="text-zinc-500 text-[10px] uppercase tracking-wider">{s.source.replace("-", " ")}</span>
                </div>
                {s.card === "The Soul" && s.resolvedJoker && (
                  <div className="mt-2 flex items-center gap-2 text-sm rounded-md border border-purple-500/15 bg-zinc-950/40 px-2 py-1.5">
                    <span className="text-zinc-500 text-xs">{t("ui.seeds.resolves_to")}</span>
                    {id && <JokerSprite jokerId={id} name={s.resolvedJoker.joker} size={32} className="border-0 bg-transparent" />}
                    <span className={`font-semibold ${rarityClass(s.resolvedJoker.rarity)}`}>{s.resolvedJoker.joker}</span>
                    {s.resolvedJoker.edition !== "No Edition" && (
                      <span className={`italic text-xs ${editionClass(s.resolvedJoker.edition)}`}>[{s.resolvedJoker.edition}]</span>
                    )}
                    <span className="ml-auto text-[10px] text-zinc-500 uppercase tracking-wider">{t("ui.seeds.legendary")}</span>
                  </div>
                )}
                {s.card === "The Soul" && !s.resolvedJoker && (
                  <div className="mt-1 text-[10px] text-zinc-500 italic">{t("ui.seeds.resolution_unavailable")}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

type SubTab = "analyzer" | "finder" | "library";

export function SeedsTab() {
  const t = useT();
  const [subTab, setSubTab] = useState<SubTab>("analyzer");

  const analyzer = useSeedTabState(s => s.analyzer);
  const librarySize = useSeedTabState(s => s.library.length);
  const setInput = (i: AnalysisInput) => setAnalyzer({ input: i });
  const setView = (v: AnalyzerView) => setAnalyzer({ view: v });

  const onRun = () => {
    if (!analyzer.input.seed) return;
    setAnalyzer({ isRunning: true });
    setTimeout(() => {
      try {
        const r = runAnalysis(analyzer.input);
        setAnalyzer({ results: r, isRunning: false });
      } catch {
        setAnalyzer({ isRunning: false });
      }
    }, 0);
  };

  return (
    <div className="space-y-4 p-2 md:p-4">
      <TabIntro Icon={Dices} title={t("ui.intro.seeds.title")}>
        {t("ui.intro.seeds.desc")}
      </TabIntro>

      {/* Sub-tab pills — sticky on phones so the user can swap views without
          scrolling back up. Horizontal scroll fallback if the three buttons
          overflow on small phones (they shouldn't, but defensive). */}
      <div className="sticky top-[60px] z-[5] -mx-2 flex gap-2 overflow-x-auto border-b border-yellow-500/30 bg-[hsl(178_14%_13%)]/95 px-2 pb-2 pt-1 backdrop-blur md:static md:mx-0 md:overflow-visible md:bg-transparent md:px-0 md:pt-0 md:backdrop-blur-none">
        <Button
          variant={subTab === "analyzer" ? "default" : "ghost"}
          onClick={() => setSubTab("analyzer")}
          className={(subTab === "analyzer" ? "bg-yellow-400 hover:bg-yellow-300 text-zinc-950 " : "") + "shrink-0"}
          data-testid="tab-analyzer"
        >
          <Telescope className="mr-2 h-4 w-4" /> {t("ui.seeds.seed_analyzer")}
        </Button>
        <Button
          variant={subTab === "finder" ? "default" : "ghost"}
          onClick={() => setSubTab("finder")}
          className={(subTab === "finder" ? "bg-yellow-400 hover:bg-yellow-300 text-zinc-950 " : "") + "shrink-0"}
          data-testid="tab-finder"
        >
          <Target className="mr-2 h-4 w-4" /> {t("ui.seeds.seed_finder_tab")}
        </Button>
        <Button
          variant={subTab === "library" ? "default" : "ghost"}
          onClick={() => setSubTab("library")}
          className={(subTab === "library" ? "bg-yellow-400 hover:bg-yellow-300 text-zinc-950 " : "") + "shrink-0"}
          data-testid="tab-library"
        >
          <Library className="mr-2 h-4 w-4" /> {t("ui.seeds.seed_library")}
          {librarySize > 0 && <span className="ml-1.5 text-[10px] bg-zinc-800/80 px-1.5 py-0.5 rounded">{librarySize}</span>}
        </Button>
      </div>

      {subTab === "finder" && <SeedFinderTab />}
      {subTab === "library" && <SeedLibraryTab />}

      {subTab === "analyzer" && (
        <div className="space-y-4">
          <InputsPanel input={analyzer.input} setInput={setInput} onRun={onRun} isRunning={analyzer.isRunning} />

          {analyzer.results && (
            <>
              <ViewSwitcher view={analyzer.view} onChange={setView} />
              {analyzer.view === "spoiler" && <FullSpoilerView results={analyzer.results} />}
              {analyzer.view === "joker" && <JokerHuntView results={analyzer.results} maxAnte={analyzer.input.maxAnte} />}
              {analyzer.view === "soul" && <SoulView results={analyzer.results} maxAnte={analyzer.input.maxAnte} />}
            </>
          )}

          {!analyzer.results && (
            <div
              className="text-center text-sm text-zinc-500 italic py-12"
              dangerouslySetInnerHTML={{ __html: t("ui.seeds.empty_prompt") }}
            />
          )}
        </div>
      )}
    </div>
  );
}
