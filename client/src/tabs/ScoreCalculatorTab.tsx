import { useMemo, useState } from "react";
import { Plus, X, ArrowUp, ArrowDown, Trash2, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { JokerCombobox } from "@/components/JokerCombobox";
import { JokerSprite } from "@/components/JokerSprite";
import { JOKER_MAP } from "@/lib/helpers";
import { computeScore } from "@/lib/calcEngine";
import { ALL_HANDS, HAND_LEVELS } from "@/lib/handLevels";
import { useCuratedText } from "@/lib/i18n";
import type {
  PlayingCard, JokerInstance, CalcInput, Rank, Suit,
  CardEnhancement, CardEdition, CardSeal, HandKey, JokerEdition,
} from "../../../../shared/calcTypes";

const RANKS: Rank[] = ["A","2","3","4","5","6","7","8","9","T","J","Q","K"];
const SUITS: Suit[] = ["S","H","D","C"];
const ENHANCEMENTS: CardEnhancement[] = ["none","bonus","mult","wild","glass","steel","stone","gold","lucky"];
const EDITIONS: CardEdition[] = ["none","foil","holo","poly","negative"];
const SEALS: CardSeal[] = ["none","red","blue","gold","purple"];
const JOKER_EDS: JokerEdition[] = ["none","foil","holo","poly","negative"];

const SUIT_LABEL: Record<Suit, string> = { S: "♠ Spades", H: "♥ Hearts", D: "♦ Diamonds", C: "♣ Clubs" };
const SUIT_CHAR: Record<Suit, string> = { S: "♠", H: "♥", D: "♦", C: "♣" };

let uid = 1;
function nextId() { return `c${uid++}`; }

function freshCard(): PlayingCard {
  return { id: nextId(), rank: "A", suit: "S", enhancement: "none", edition: "none", seal: "none", selected: true };
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
        {slot.jokerId && <JokerSprite jokerId={slot.jokerId} size={28} />}
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
  const [plasmaDeck, setPlasmaDeck] = useState(false);
  const [observatory, setObservatory] = useState(false);
  const [flintBoss, setFlintBoss] = useState(false);
  const [eyeBoss, setEyeBoss] = useState(false);
  const [obsPlanets, setObsPlanets] = useState<HandKey[]>([]);

  const result = useMemo(() => {
    const input: CalcInput = {
      hand, handLevel,
      played: played.map(p => ({ ...p, selected: true })),
      inHand,
      jokers,
      modifiers: {
        plasmaDeck, observatory, flintBoss, eyeBoss,
        abandonedDeck: false, ghostDeck: false, honeMult: 1,
      },
      observatoryPlanets: obsPlanets,
    };
    return computeScore(input);
  }, [hand, handLevel, played, inHand, jokers, plasmaDeck, observatory, flintBoss, eyeBoss, obsPlanets]);

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

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border/60 bg-card/40 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calculator className="h-4 w-4 text-accent" />
          <h2 className="text-lg font-bold">{t("calculator.title", "Score Calculator")}</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("calculator.desc", "Full Balatro scoring engine: per-card breakdown, joker order, scaling state, deck modifiers, 4-phase timeline. More accurate than balatrocalc and efhiii's calculator.")}
        </p>
      </div>

      {/* Hand selector */}
      <section className="rounded-lg border border-border/60 bg-card/40 p-3 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">{t("calculator.hand", "Hand")}</Label>
            <Select value={hand} onValueChange={(v) => setHand(v as HandKey)}>
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ALL_HANDS.map(h => <SelectItem key={h} value={h}>{HAND_LEVELS[h].label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">{t("calculator.level", "Level")}</Label>
            <Input type="number" min={1} max={50} value={handLevel} onChange={(e) => setHandLevel(Math.max(1, Math.min(50, Number(e.target.value) || 1)))} className="h-8" />
          </div>
          <div className="text-xs text-muted-foreground self-end">
            base: <span className="chips-text">{HAND_LEVELS[hand].baseChips + HAND_LEVELS[hand].chipsPerLevel * (handLevel - 1)}</span>
            {" x "}
            <span className="mult-text">{HAND_LEVELS[hand].baseMult + HAND_LEVELS[hand].multPerLevel * (handLevel - 1)}</span>
          </div>
        </div>
      </section>

      {/* Played cards */}
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

      {/* In-hand cards */}
      <section className="rounded-lg border border-border/60 bg-card/40 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{t("calculator.inHand", "In-hand (not played)")} ({inHand.length}/8)</h3>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={addInHand} disabled={inHand.length >= 8}><Plus className="h-3.5 w-3.5 mr-1" />Add</Button>
            <Button size="sm" variant="outline" onClick={() => setInHand([])} disabled={inHand.length === 0}><Trash2 className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">Steel cards here give x1.5 each. Gold cards give $3 (utility).</p>
        <div className="flex flex-wrap gap-2">
          {inHand.map((c, i) => (
            <CardEditor key={c.id} card={c}
              onChange={(nc) => setInHand(inHand.map((p, j) => j === i ? nc : p))}
              onRemove={() => setInHand(inHand.filter((_, j) => j !== i))} />
          ))}
        </div>
      </section>

      {/* Jokers */}
      <section className="rounded-lg border border-border/60 bg-card/40 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{t("calculator.jokers", "Jokers (left → right)")} ({jokers.length}/5)</h3>
          <Button size="sm" variant="outline" onClick={addJoker} disabled={jokers.length >= 5}><Plus className="h-3.5 w-3.5 mr-1" />Add</Button>
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

      {/* Modifiers */}
      <section className="rounded-lg border border-border/60 bg-card/40 p-3 space-y-3">
        <h3 className="text-sm font-semibold">{t("calculator.modifiers", "Modifiers")}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <label className="flex items-center gap-2"><Switch checked={plasmaDeck} onCheckedChange={setPlasmaDeck} /> Plasma deck</label>
          <label className="flex items-center gap-2"><Switch checked={observatory} onCheckedChange={setObservatory} /> Observatory voucher</label>
          <label className="flex items-center gap-2"><Switch checked={flintBoss} onCheckedChange={setFlintBoss} /> The Flint (boss)</label>
          <label className="flex items-center gap-2"><Switch checked={eyeBoss} onCheckedChange={setEyeBoss} /> The Eye (boss)</label>
        </div>
        {observatory && (
          <div>
            <Label className="text-xs">Planet cards in consumable area (each matching played hand gives x1.5)</Label>
            <div className="flex flex-wrap gap-1 mt-1">
              {ALL_HANDS.map(h => {
                const has = obsPlanets.includes(h);
                return (
                  <Button key={h} size="sm" variant={has ? "default" : "outline"}
                    onClick={() => setObsPlanets(has ? obsPlanets.filter(x => x !== h) : [...obsPlanets, h])}
                    className="h-7 px-2 text-[11px]">
                    {HAND_LEVELS[h].label}
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Score output */}
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
        {result.warnings.length > 0 && (
          <div className="text-xs text-yellow-500/90 space-y-0.5">
            {result.warnings.map((w, i) => <div key={i}>⚠ {w}</div>)}
          </div>
        )}
      </section>

      {/* Timeline */}
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
    </div>
  );
}
