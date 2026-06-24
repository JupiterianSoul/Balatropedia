import { useEffect, useMemo, useState } from "react";
import { Plus, X, ArrowUp, ArrowDown, Trash2, Calculator, Wand2, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { JokerCombobox } from "@/components/JokerCombobox";
import { JokerSprite } from "@/components/JokerSprite";
import { JOKER_MAP } from "@/lib/helpers";
import { computeScore, detectHand, optimizeJokerOrder } from "@/lib/calcEngine";
import { ALL_HANDS, HAND_LEVELS } from "@/lib/handLevels";
import { useCuratedText } from "@/lib/i18n";
import type {
  PlayingCard, JokerInstance, CalcInput, Rank, Suit,
  CardEnhancement, CardEdition, CardSeal, HandKey, JokerEdition,
} from "@shared/calcTypes";

const RANKS: Rank[] = ["A","2","3","4","5","6","7","8","9","T","J","Q","K"];
const SUITS: Suit[] = ["S","H","D","C"];
const ENHANCEMENTS: CardEnhancement[] = ["none","bonus","mult","wild","glass","steel","stone","gold","lucky"];
const EDITIONS: CardEdition[] = ["none","foil","holo","poly","negative"];
const SEALS: CardSeal[] = ["none","red","blue","gold","purple"];
const JOKER_EDS: JokerEdition[] = ["none","foil","holo","poly","negative"];

const SUIT_LABEL: Record<Suit, string> = { S: "♠ Spades", H: "♥ Hearts", D: "♦ Diamonds", C: "♣ Clubs" };
const SUIT_CHAR: Record<Suit, string> = { S: "♠", H: "♥", D: "♦", C: "♣" };

const DECK_OPTIONS = [
  { id: "red", name: "Red", note: "+1 discard" },
  { id: "blue", name: "Blue", note: "+1 hand" },
  { id: "yellow", name: "Yellow", note: "+$10" },
  { id: "green", name: "Green", note: "$2/hand, $1/discard, no interest" },
  { id: "black", name: "Black", note: "+1 joker slot, -1 hand" },
  { id: "magic", name: "Magic", note: "starts with Crystal Ball + Fool" },
  { id: "nebula", name: "Nebula", note: "starts with Telescope" },
  { id: "ghost", name: "Ghost", note: "spectral cards in shop" },
  { id: "abandoned", name: "Abandoned", note: "no face cards" },
  { id: "checkered", name: "Checkered", note: "26 Spades + 26 Hearts" },
  { id: "zodiac", name: "Zodiac", note: "starts with Tarot Merchant + Planet Merchant + Overstock" },
  { id: "painted", name: "Painted", note: "+2 hand size, -1 joker slot" },
  { id: "anaglyph", name: "Anaglyph", note: "Double Tag on every boss" },
  { id: "plasma", name: "Plasma", note: "((chips+mult)/2)^2 scoring, x2 blind size" },
  { id: "erratic", name: "Erratic", note: "ranks and suits randomized" },
];

let uid = 1;
function nextId() { return `c${uid++}`; }

function freshCard(): PlayingCard {
  return { id: nextId(), rank: "A", suit: "S", enhancement: "none", edition: "none", seal: "none", selected: true };
}

function jokerName(id: string): string {
  return JOKER_MAP[id]?.name ?? id;
}

function CardEditor({
  card, onChange, onRemove,
}: { card: PlayingCard; onChange: (c: PlayingCard) => void; onRemove: () => void }) {
  const isRed = card.suit === "H" || card.suit === "D";
  return (
    <div className="rounded-md border border-border/60 bg-card/40 p-2 space-y-1.5 min-w-[140px]">
      <div className="flex items-center justify-between gap-1">
        <span className={`text-base font-bold ${isRed ? "text-[hsl(var(--bal-mult))]" : "text-[hsl(var(--bal-chip))]"}`}>
          {card.rank}{SUIT_CHAR[card.suit]}
        </span>
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onRemove}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-1">
        <Select value={card.rank} onValueChange={(v) => onChange({ ...card, rank: v as Rank })}>
          <SelectTrigger className="h-7 px-2 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>{RANKS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={card.suit} onValueChange={(v) => onChange({ ...card, suit: v as Suit })}>
          <SelectTrigger className="h-7 px-2 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>{SUITS.map(s => <SelectItem key={s} value={s}>{SUIT_LABEL[s]}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <Select value={card.enhancement} onValueChange={(v) => onChange({ ...card, enhancement: v as CardEnhancement })}>
        <SelectTrigger className="h-7 px-2 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>{ENHANCEMENTS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={card.edition} onValueChange={(v) => onChange({ ...card, edition: v as CardEdition })}>
        <SelectTrigger className="h-7 px-2 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>{EDITIONS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={card.seal} onValueChange={(v) => onChange({ ...card, seal: v as CardSeal })}>
        <SelectTrigger className="h-7 px-2 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>{SEALS.map(s => <SelectItem key={s} value={s}>{s} seal</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}

function JokerSlotEditor({
  slot, onChange, onRemove, onUp, onDown, idx,
}: {
  slot: JokerInstance; onChange: (j: JokerInstance) => void;
  onRemove: () => void; onUp: () => void; onDown: () => void; idx: number;
}) {
  const meta = JOKER_MAP[slot.jokerId];
  const showState = meta && (meta.scaling !== "static");
  return (
    <div className="rounded-md border border-border/60 bg-card/40 p-2 space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground w-5">{idx + 1}.</span>
        {slot.jokerId && <JokerSprite jokerId={slot.jokerId} name={jokerName(slot.jokerId)} size={28} />}
        <div className="flex-1 min-w-0">
          <JokerCombobox
            value={slot.jokerId}
            onChange={(id) => onChange({ ...slot, jokerId: id })}
            placeholder="Pick joker..."
          />
        </div>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onUp} title="Move left"><ArrowUp className="h-3.5 w-3.5" /></Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onDown} title="Move right"><ArrowDown className="h-3.5 w-3.5" /></Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onRemove}><X className="h-3.5 w-3.5" /></Button>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <Select value={slot.edition} onValueChange={(v) => onChange({ ...slot, edition: v as JokerEdition })}>
          <SelectTrigger className="h-7 px-2 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>{JOKER_EDS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
        </Select>
        <label className="flex items-center gap-2 text-xs">
          <Switch checked={slot.disabled} onCheckedChange={(v) => onChange({ ...slot, disabled: v })} />
          <span className="text-muted-foreground">disabled</span>
        </label>
      </div>
      {showState && (
        <div className="grid grid-cols-3 gap-1.5">
          <div>
            <Label className="text-[10px] text-muted-foreground">count</Label>
            <Input type="number" className="h-7 px-2 text-xs"
              value={slot.state.count ?? 0}
              onChange={(e) => onChange({ ...slot, state: { ...slot.state, count: Number(e.target.value) } })} />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground">xMult</Label>
            <Input type="number" step="0.1" className="h-7 px-2 text-xs"
              value={slot.state.xmult ?? 1}
              onChange={(e) => onChange({ ...slot, state: { ...slot.state, xmult: Number(e.target.value) } })} />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground">value</Label>
            <Input type="number" className="h-7 px-2 text-xs"
              value={slot.state.value ?? 0}
              onChange={(e) => onChange({ ...slot, state: { ...slot.state, value: Number(e.target.value) } })} />
          </div>
        </div>
      )}
    </div>
  );
}

export function ScoreCalculatorTab() {
  const t = useCuratedText;
  const [hand, setHand] = useState<HandKey>("pair");
  const [handLevel, setHandLevel] = useState(1);
  const [played, setPlayed] = useState<PlayingCard[]>([freshCard(), freshCard()]);
  const [inHand, setInHand] = useState<PlayingCard[]>([]);
  const [jokers, setJokers] = useState<JokerInstance[]>([]);
  const [deckId, setDeckId] = useState("red");
  const [autoDetectHand, setAutoDetectHand] = useState(true);
  const [observatory, setObservatory] = useState(false);
  const [flintBoss, setFlintBoss] = useState(false);
  const [eyeBoss, setEyeBoss] = useState(false);
  const [obsPlanets, setObsPlanets] = useState<HandKey[]>([]);

  const plasmaDeck = deckId === "plasma";

  useEffect(() => {
    if (!autoDetectHand) return;
    if (played.length === 0) return;
    const detected = detectHand(played);
    if (detected !== hand) setHand(detected);
  }, [played, autoDetectHand]);

  const baseInput: CalcInput = useMemo(() => ({
    hand, handLevel,
    played: played.map(p => ({ ...p, selected: true })),
    inHand,
    jokers,
    modifiers: {
      plasmaDeck, observatory, flintBoss, eyeBoss,
      abandonedDeck: deckId === "abandoned", ghostDeck: deckId === "ghost", honeMult: 1,
    },
    observatoryPlanets: obsPlanets,
  }), [hand, handLevel, played, inHand, jokers, plasmaDeck, observatory, flintBoss, eyeBoss, obsPlanets, deckId]);

  const result = useMemo(() => computeScore(baseInput), [baseInput]);

  const addPlayed = () => played.length < 5 && setPlayed([...played, freshCard()]);
  const addInHand = () => inHand.length < 8 && setInHand([...inHand, freshCard()]);
  const addJoker = () => jokers.length < 5 && setJokers([...jokers, {
    uid: `j${uid++}`, jokerId: "joker", edition: "none", state: { count: 0, xmult: 1, value: 0 }, disabled: false,
  }]);

  const moveJoker = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= jokers.length) return;
    const next = [...jokers];
    [next[i], next[j]] = [next[j], next[i]];
    setJokers(next);
  };

  const optimize = () => {
    const res = optimizeJokerOrder(baseInput);
    if (res.bestScore > res.baseScore) setJokers(res.best);
  };

  const reset = () => {
    setPlayed([freshCard(), freshCard()]);
    setInHand([]);
    setJokers([]);
    setObsPlanets([]);
    setObservatory(false);
    setFlintBoss(false);
    setEyeBoss(false);
  };

  const handStats = HAND_LEVELS[hand];
  const baseChips = handStats.baseChips + handStats.chipsPerLevel * (handLevel - 1);
  const baseMult = handStats.baseMult + handStats.multPerLevel * (handLevel - 1);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border/60 bg-card/40 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calculator className="h-4 w-4 text-accent" />
          <h2 className="text-lg font-bold">{t("calculator.title", "Score Calculator")}</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("calculator.desc", "Per-card breakdown, joker order, scaling state, deck modifiers, full timeline.")}
        </p>
      </div>

      <Tabs defaultValue="setup">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="result">Result</TabsTrigger>
          <TabsTrigger value="timeline">Timeline ({result.timeline.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-4 mt-4">
          { }
          <section className="rounded-lg border border-border/60 bg-card/40 p-3 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Deck</Label>
                <Select value={deckId} onValueChange={setDeckId}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DECK_OPTIONS.map(d => <SelectItem key={d.id} value={d.id}>{d.name} - {d.note}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-xs">
                  <Switch checked={autoDetectHand} onCheckedChange={setAutoDetectHand} />
                  <span>Auto-detect played hand from cards</span>
                </label>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">{t("calculator.hand", "Hand")}</Label>
                <Select value={hand} onValueChange={(v) => { setAutoDetectHand(false); setHand(v as HandKey); }}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ALL_HANDS.map(h => <SelectItem key={h} value={h}>{HAND_LEVELS[h as HandKey].label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">{t("calculator.level", "Level")}</Label>
                <Input type="number" min={1} max={50} value={handLevel} onChange={(e) => setHandLevel(Math.max(1, Math.min(50, Number(e.target.value) || 1)))} className="h-8" />
              </div>
              <div className="text-xs text-muted-foreground self-end">
                base: <span className="chips-text">{baseChips}</span>
                {" x "}
                <span className="mult-text">{baseMult}</span>
              </div>
            </div>
            {plasmaDeck && (
              <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-200">
                Plasma deck: final score = floor(((chips + mult) / 2)^2). Chips and mult equalize.
              </div>
            )}
          </section>

          { }
          <section className="rounded-lg border border-border/60 bg-card/40 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">{t("calculator.played", "Played cards")} ({played.length}/5)</h3>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={addPlayed} disabled={played.length >= 5}><Plus className="h-3.5 w-3.5 mr-1" />{t("calculator.addCard", "Add")}</Button>
                <Button size="sm" variant="outline" onClick={() => setPlayed([])} disabled={played.length === 0}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {played.map((c, i) => (
                <CardEditor key={c.id} card={c}
                  onChange={(nc) => setPlayed(played.map((p, j) => j === i ? nc : p))}
                  onRemove={() => setPlayed(played.filter((_, j) => j !== i))} />
              ))}
              {played.length === 0 && <p className="text-xs text-muted-foreground italic">No cards. Score = 0.</p>}
            </div>
          </section>

          { }
          <section className="rounded-lg border border-border/60 bg-card/40 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">{t("calculator.inHand", "In-hand (not played)")} ({inHand.length}/8)</h3>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={addInHand} disabled={inHand.length >= 8}><Plus className="h-3.5 w-3.5 mr-1" />Add</Button>
                <Button size="sm" variant="outline" onClick={() => setInHand([])} disabled={inHand.length === 0}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">Steel cards here give x1.5 each. Gold cards give $3 (utility). Baron / Shoot the Moon / Raised Fist read Kings, Queens, and lowest rank from here.</p>
            <div className="flex flex-wrap gap-2">
              {inHand.map((c, i) => (
                <CardEditor key={c.id} card={c}
                  onChange={(nc) => setInHand(inHand.map((p, j) => j === i ? nc : p))}
                  onRemove={() => setInHand(inHand.filter((_, j) => j !== i))} />
              ))}
            </div>
          </section>

          { }
          <section className="rounded-lg border border-border/60 bg-card/40 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">{t("calculator.jokers", "Jokers (left to right)")} ({jokers.length}/5)</h3>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={optimize} disabled={jokers.length < 2} title="Try all permutations and pick the order with highest score">
                  <Wand2 className="h-3.5 w-3.5 mr-1" /> Optimize order
                </Button>
                <Button size="sm" variant="outline" onClick={addJoker} disabled={jokers.length >= 5}><Plus className="h-3.5 w-3.5 mr-1" />Add</Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {jokers.map((j, i) => (
                <JokerSlotEditor key={j.uid} slot={j} idx={i}
                  onChange={(nj) => setJokers(jokers.map((x, k) => k === i ? nj : x))}
                  onRemove={() => setJokers(jokers.filter((_, k) => k !== i))}
                  onUp={() => moveJoker(i, -1)} onDown={() => moveJoker(i, 1)} />
              ))}
            </div>
            {jokers.length === 0 && <p className="text-xs text-muted-foreground italic">No jokers. Add some to see their contribution.</p>}
          </section>

          { }
          <section className="rounded-lg border border-border/60 bg-card/40 p-3 space-y-3">
            <h3 className="text-sm font-semibold">{t("calculator.modifiers", "Modifiers")}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <label className="flex items-center gap-2"><Switch checked={observatory} onCheckedChange={setObservatory} /> Observatory voucher</label>
              <label className="flex items-center gap-2"><Switch checked={flintBoss} onCheckedChange={setFlintBoss} /> The Flint (boss)</label>
              <label className="flex items-center gap-2"><Switch checked={eyeBoss} onCheckedChange={setEyeBoss} /> The Eye (boss)</label>
              <Button size="sm" variant="outline" onClick={reset}><RefreshCcw className="h-3.5 w-3.5 mr-1" /> Reset</Button>
            </div>
            {observatory && (
              <div>
                <Label className="text-xs">Planet cards in consumable area (each matching played hand gives x1.5)</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {ALL_HANDS.map(h => {
                    const has = obsPlanets.includes(h as HandKey);
                    return (
                      <Button key={h} size="sm" variant={has ? "default" : "outline"}
                        onClick={() => setObsPlanets(has ? obsPlanets.filter(x => x !== h) : [...obsPlanets, h as HandKey])}
                        className="h-7 px-2 text-[11px]">
                        {HAND_LEVELS[h as HandKey].label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        </TabsContent>

        <TabsContent value="result" className="space-y-4 mt-4">
          { }
          <section className="rounded-lg border-2 border-accent/40 bg-card/60 p-4 space-y-3">
            <div className="flex items-baseline justify-center gap-4">
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Chips</div>
                <div className="text-3xl font-bold chips-text">{result.chips.toLocaleString()}</div>
              </div>
              <div className="text-2xl text-muted-foreground">x</div>
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Mult</div>
                <div className="text-3xl font-bold mult-text">{result.mult.toLocaleString()}</div>
              </div>
              <div className="text-2xl text-muted-foreground">=</div>
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Score</div>
                <div className="text-4xl font-bold text-[hsl(var(--bal-gold))]">{result.score.toLocaleString()}</div>
              </div>
            </div>
            <div className="text-center text-xs text-muted-foreground">
              {HAND_LEVELS[hand].label} L{handLevel} - {DECK_OPTIONS.find(d => d.id === deckId)?.name} deck
            </div>
            {result.warnings.length > 0 && (
              <div className="text-xs text-yellow-500/90 space-y-0.5">
                {result.warnings.map((w, i) => <div key={i}>! {w}</div>)}
              </div>
            )}
          </section>

          { }
          <section className="rounded-lg border border-border/60 bg-card/40 p-3 space-y-2">
            <h3 className="text-sm font-semibold">Contribution summary</h3>
            <SummaryTable result={result} />
          </section>
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          { }
          <section className="rounded-lg border border-border/60 bg-card/40 p-3">
            <h3 className="text-sm font-semibold mb-2">{t("calculator.timeline", "Score timeline")}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/60 text-left text-muted-foreground">
                    <th className="py-1 px-2 w-16">Phase</th>
                    <th className="py-1 px-2">Source</th>
                    <th className="py-1 px-2 text-right">+Chips</th>
                    <th className="py-1 px-2 text-right">+Mult</th>
                    <th className="py-1 px-2 text-right">xMult</th>
                    <th className="py-1 px-2 text-right">Chips</th>
                    <th className="py-1 px-2 text-right">Mult</th>
                  </tr>
                </thead>
                <tbody>
                  {result.timeline.map((row, i) => (
                    <tr key={i} className="border-b border-border/30">
                      <td className="py-1 px-2">
                        <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] uppercase ${
                          row.phase === "base" ? "bg-blue-500/20 text-blue-300" :
                          row.phase === "card" ? "bg-emerald-500/20 text-emerald-300" :
                          row.phase === "held" ? "bg-cyan-500/20 text-cyan-300" :
                          row.phase === "joker" ? "bg-amber-500/20 text-amber-300" :
                          "bg-rose-500/20 text-rose-300"
                        }`}>{row.phase}</span>
                      </td>
                      <td className="py-1 px-2">
                        {row.source}
                        {row.note && <span className="text-muted-foreground italic"> - {row.note}</span>}
                      </td>
                      <td className="py-1 px-2 text-right chips-text">{row.chipsAdd ? `+${row.chipsAdd}` : ""}</td>
                      <td className="py-1 px-2 text-right mult-text">{row.multAdd ? `+${row.multAdd}` : ""}</td>
                      <td className="py-1 px-2 text-right text-[hsl(var(--bal-gold))]">{row.xMult ? `x${row.xMult}` : ""}</td>
                      <td className="py-1 px-2 text-right text-muted-foreground">{row.chipsAfter.toLocaleString()}</td>
                      <td className="py-1 px-2 text-right text-muted-foreground">{row.multAfter.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SummaryTable({ result }: { result: ReturnType<typeof computeScore> }) {
  const bySource: Record<string, { chips: number; mult: number; xMult: number }> = {};
  for (const row of result.timeline) {
    const cleanSource = row.source
      .replace(/^(card|Gold Seal retrigger|Red Seal retrigger|[\w_]+ retrigger)\s*/, "")
      .trim() || row.source;
    if (!bySource[cleanSource]) bySource[cleanSource] = { chips: 0, mult: 0, xMult: 1 };
    if (row.chipsAdd) bySource[cleanSource].chips += row.chipsAdd;
    if (row.multAdd) bySource[cleanSource].mult += row.multAdd;
    if (row.xMult) bySource[cleanSource].xMult *= row.xMult;
  }
  const rows = Object.entries(bySource).filter(([, v]) => v.chips || v.mult || v.xMult > 1);
  if (rows.length === 0) return <p className="text-xs text-muted-foreground italic">No contributions.</p>;
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="border-b border-border/60 text-left text-muted-foreground">
          <th className="py-1 px-2">Source</th>
          <th className="py-1 px-2 text-right">+Chips</th>
          <th className="py-1 px-2 text-right">+Mult</th>
          <th className="py-1 px-2 text-right">xMult</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([src, v]) => (
          <tr key={src} className="border-b border-border/30">
            <td className="py-1 px-2">{src}</td>
            <td className="py-1 px-2 text-right chips-text">{v.chips ? `+${v.chips}` : ""}</td>
            <td className="py-1 px-2 text-right mult-text">{v.mult ? `+${v.mult}` : ""}</td>
            <td className="py-1 px-2 text-right text-[hsl(var(--bal-gold))]">{v.xMult > 1 ? `x${v.xMult.toFixed(2)}` : ""}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
