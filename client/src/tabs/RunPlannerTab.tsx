// Run Planner v2 - main tab. Click-based selection, no DnD. Self-contained.
import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, X, Trash2, Save, FolderOpen, Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { JokerSprite } from "@/components/JokerSprite";
import {
  JOKERS, JOKER_MAP, SYNERGIES,
  antiSynergyWarnings,
  ARCHETYPES,
} from "@/lib/helpers";
import { DECKS } from "@/data/phase3/decks";
import { STAKES } from "@/data/phase3/stakes";
import { VOUCHERS } from "@/data/phase3/vouchers";
import { TAROTS } from "@/data/phase3/tarots";
import { PLANETS } from "@/data/phase3/planets";
import { SPECTRALS } from "@/data/phase3/spectrals";
import { ALL_HANDS, HAND_PROBABILITY_PCT, type HandKey } from "@/lib/handLevels";
import { getBlindTargets, classifyScoreVsTargets } from "@/lib/blindScaling";
import { computeScore } from "@/lib/scoringEngine";
import { encodeBuild, decodeBuild } from "@/lib/buildEncoder";
import type {
  PlannerState, PlannerSlot, Edition, SavedBuild, ConsumableKind,
} from "../../../shared/plannerTypes";
import { makeDefaultState, EMPTY_SLOT } from "../../../shared/plannerTypes";

const EDITIONS: { value: Edition; label: string; note: string }[] = [
  { value: "none", label: "None", note: "" },
  { value: "foil", label: "Foil", note: "+50 chips" },
  { value: "holo", label: "Holo", note: "+10 mult" },
  { value: "poly", label: "Poly", note: "×1.5 mult" },
  { value: "negative", label: "Negative", note: "+1 slot" },
];

const HAND_LABELS: Record<HandKey, string> = {
  high_card: "High Card", pair: "Pair", two_pair: "Two Pair",
  three_of_a_kind: "Three of a Kind", straight: "Straight", flush: "Flush",
  full_house: "Full House", four_of_a_kind: "Four of a Kind",
  straight_flush: "Straight Flush", royal_flush: "Royal Flush",
  five_of_a_kind: "Five of a Kind", flush_house: "Flush House",
  flush_five: "Flush Five",
};

// ---- URL hash sync (separate from wouter routing - we parse query-style) ----
function readBuildFromHash(): PlannerState | null {
  if (typeof window === "undefined") return null;
  // Look for #planner?b=... pattern OR plain ?b= in the planner tab
  const h = window.location.hash;
  const m = h.match(/[?&]b=([^&]+)/);
  if (!m) return null;
  return decodeBuild(m[1]);
}

// ---- Slot card ----
function SlotCard({
  slot, idx, onPick, onEdit, onRemove,
}: {
  slot: PlannerSlot; idx: number;
  onPick: () => void; onEdit: () => void; onRemove: () => void;
}) {
  const joker = slot.jokerId ? JOKER_MAP[slot.jokerId] : null;
  if (!joker) {
    return (
      <button
        type="button"
        onClick={onPick}
        data-testid={`slot-empty-${idx}`}
        className="group relative aspect-[2/3] w-full rounded-lg border-2 border-dashed border-border bg-card/40 flex flex-col items-center justify-center gap-2 hover:border-accent hover:bg-card transition-colors"
      >
        <div className="absolute top-1 left-1 text-[10px] font-mono opacity-50">#{idx + 1}</div>
        <Plus className="h-6 w-6 opacity-60" />
        <span className="text-xs text-muted-foreground">Add joker</span>
      </button>
    );
  }
  const editionTint = {
    foil: "ring-2 ring-blue-400/60",
    holo: "ring-2 ring-pink-400/60",
    poly: "ring-2 ring-fuchsia-500/60",
    negative: "ring-2 ring-zinc-200/60",
    none: "",
  }[slot.edition];
  return (
    <div
      data-testid={`slot-filled-${idx}`}
      className={`group relative aspect-[2/3] w-full rounded-lg bg-card overflow-hidden ${editionTint}`}
    >
      <div className="absolute top-1 left-1 z-10 text-[10px] font-mono bg-black/60 px-1.5 rounded">#{idx + 1}</div>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove"
        className="absolute top-1 right-1 z-10 h-6 w-6 rounded bg-black/60 hover:bg-red-700 flex items-center justify-center"
      >
        <X className="h-3 w-3" />
      </button>
      <div className="h-full w-full flex items-center justify-center p-1">
        <JokerSprite jokerId={joker.id} size={120} />
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="absolute inset-x-0 bottom-0 px-2 py-1 text-[11px] font-medium bg-black/70 hover:bg-black/90 text-left truncate"
      >
        {joker.name}
        {slot.edition !== "none" && <span className="ml-1 opacity-70">({slot.edition})</span>}
      </button>
    </div>
  );
}

// ---- Picker modal ----
function PickerModal({
  open, onClose, onPick, currentIds,
}: {
  open: boolean; onClose: () => void;
  onPick: (id: string) => void;
  currentIds: Set<string>;
}) {
  const [q, setQ] = useState("");
  const [rarity, setRarity] = useState<string>("all");
  const filtered = useMemo(() => {
    const qs = q.toLowerCase().trim();
    return JOKERS.filter((j) => {
      if (rarity !== "all" && (j.rarity || "common") !== rarity) return false;
      if (!qs) return true;
      return (
        j.name.toLowerCase().includes(qs) ||
        j.id.toLowerCase().includes(qs) ||
        (j.summary || "").toLowerCase().includes(qs) ||
        (j.tags || []).some((t) => t.toLowerCase().includes(qs))
      );
    });
  }, [q, rarity]);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Pick a joker</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, tag, role..."
            data-testid="picker-search"
            className="flex-1"
          />
          <Select value={rarity} onValueChange={setRarity}>
            <SelectTrigger className="w-full sm:w-40" data-testid="picker-rarity">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All rarities</SelectItem>
              <SelectItem value="common">Common</SelectItem>
              <SelectItem value="uncommon">Uncommon</SelectItem>
              <SelectItem value="rare">Rare</SelectItem>
              <SelectItem value="legendary">Legendary</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2 pr-1">
          {filtered.map((j) => {
            const has = currentIds.has(j.id);
            return (
              <button
                key={j.id}
                type="button"
                onClick={() => { onPick(j.id); onClose(); }}
                data-testid={`picker-option-${j.id}`}
                className={`group relative rounded border bg-card hover:bg-card/70 p-2 flex flex-col items-center gap-1 ${has ? "opacity-50" : ""}`}
              >
                <JokerSprite jokerId={j.id} size={80} />
                <div className="text-[11px] font-medium truncate w-full text-center">{j.name}</div>
                <div className="text-[9px] uppercase tracking-wider opacity-60">{j.rarity || "common"}</div>
                {has && <Badge variant="secondary" className="absolute top-1 right-1 text-[9px]">In build</Badge>}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---- Slot edit drawer ----
function SlotEditor({
  open, slot, idx, onClose, onChange, onReplace,
}: {
  open: boolean; slot: PlannerSlot | null; idx: number;
  onClose: () => void;
  onChange: (patch: Partial<PlannerSlot>) => void;
  onReplace: () => void;
}) {
  if (!slot) return null;
  const joker = slot.jokerId ? JOKER_MAP[slot.jokerId] : null;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Slot {idx + 1}: {joker?.name ?? "Empty"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {joker && (
            <div className="text-xs text-muted-foreground">{joker.summary}</div>
          )}
          <div>
            <Label className="text-xs">Edition</Label>
            <Select
              value={slot.edition}
              onValueChange={(v) => onChange({ edition: v as Edition })}
            >
              <SelectTrigger data-testid={`edit-edition-${idx}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EDITIONS.map((e) => (
                  <SelectItem key={e.value} value={e.value}>
                    {e.label} {e.note && <span className="opacity-60 ml-1">({e.note})</span>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs">+Chips</Label>
              <Input
                type="number" inputMode="numeric"
                value={slot.addChips}
                onChange={(e) => onChange({ addChips: Number(e.target.value) || 0 })}
                data-testid={`edit-chips-${idx}`}
              />
            </div>
            <div>
              <Label className="text-xs">+Mult</Label>
              <Input
                type="number" inputMode="numeric"
                value={slot.addMult}
                onChange={(e) => onChange({ addMult: Number(e.target.value) || 0 })}
                data-testid={`edit-mult-${idx}`}
              />
            </div>
            <div>
              <Label className="text-xs">×Mult</Label>
              <Input
                type="number" inputMode="decimal" step="0.1"
                value={slot.xMult}
                onChange={(e) => onChange({ xMult: Number(e.target.value) || 1 })}
                data-testid={`edit-xmult-${idx}`}
              />
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onReplace} data-testid={`edit-replace-${idx}`}>Replace</Button>
          <Button onClick={onClose} data-testid={`edit-done-${idx}`}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---- Main tab ----
export function RunPlannerTab() {
  const { toast } = useToast();
  const [state, setState] = useState<PlannerState>(() => {
    const fromHash = readBuildFromHash();
    return fromHash ?? makeDefaultState();
  });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSlot, setPickerSlot] = useState<number | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorSlot, setEditorSlot] = useState<number | null>(null);
  const [savedBuilds, setSavedBuilds] = useState<SavedBuild[]>([]);
  const [saveName, setSaveName] = useState("");
  const [copied, setCopied] = useState(false);

  // Negative edition grants +1 slot. Trim/extend on edition change.
  useEffect(() => {
    const hasNeg = state.slots.some((s) => s.edition === "negative");
    const desired = hasNeg ? 6 : 5;
    if (state.slots.length !== desired) {
      setState((s) => ({
        ...s,
        slots: desired > s.slots.length
          ? [...s.slots, { ...EMPTY_SLOT }]
          : s.slots.slice(0, desired),
      }));
    }
  }, [state.slots]);

  const result = useMemo(() => computeScore(state), [state]);
  const blindTargets = useMemo(() => getBlindTargets(state.ante), [state.ante]);
  const targetClass = classifyScoreVsTargets(result.score, state.ante);

  // Active synergies / anti-synergies / archetype detection
  const activeIds = state.slots.map((s) => s.jokerId).filter(Boolean) as string[];
  const activeSyn = useMemo(() => {
    if (activeIds.length < 2) return [];
    return SYNERGIES.filter(
      (s) => activeIds.includes(s.a) && activeIds.includes(s.b)
    );
  }, [activeIds]);
  const antiSyn = useMemo(() => antiSynergyWarnings(activeIds), [activeIds]);
  const archetypes = useMemo(() => {
    return ARCHETYPES.filter((a) => {
      const overlap = activeIds.filter((id) => {
        const j = JOKER_MAP[id];
        return j?.archetypes?.includes(a.id);
      });
      return overlap.length >= 3;
    });
  }, [activeIds]);
  const missingPartners = useMemo(() => {
    const have = new Set(activeIds);
    const suggestions: { joker: any; pairsWith: string[] }[] = [];
    for (const id of activeIds) {
      const j = JOKER_MAP[id];
      if (!j?.partners) continue;
      for (const pid of j.partners) {
        if (!have.has(pid)) {
          const p = JOKER_MAP[pid];
          if (p) {
            const ex = suggestions.find((s) => s.joker.id === pid);
            if (ex) ex.pairsWith.push(j.name);
            else suggestions.push({ joker: p, pairsWith: [j.name] });
          }
        }
      }
    }
    return suggestions.slice(0, 5);
  }, [activeIds]);

  // Synergy score 0-100: synergies count + archetype overlap, minus anti
  const synScore = useMemo(() => {
    if (activeIds.length === 0) return 0;
    const synBonus = Math.min(50, activeSyn.length * 12);
    const archBonus = Math.min(30, archetypes.length * 15);
    const fillBonus = (activeIds.length / state.slots.length) * 20;
    const antiPenalty = Math.min(30, antiSyn.length * 10);
    return Math.max(0, Math.min(100, synBonus + archBonus + fillBonus - antiPenalty));
  }, [activeIds, activeSyn, archetypes, antiSyn, state.slots.length]);

  // ---- Handlers ----
  const updateSlot = useCallback((i: number, patch: Partial<PlannerSlot>) => {
    setState((s) => ({
      ...s,
      slots: s.slots.map((sl, idx) => idx === i ? { ...sl, ...patch } : sl),
    }));
  }, []);
  const pickJokerForSlot = useCallback((id: string) => {
    if (pickerSlot == null) return;
    updateSlot(pickerSlot, { jokerId: id });
  }, [pickerSlot, updateSlot]);
  const removeSlot = useCallback((i: number) => {
    updateSlot(i, { ...EMPTY_SLOT });
  }, [updateSlot]);
  const clearAll = () => {
    if (confirm("Clear all slots?")) {
      setState((s) => ({ ...s, slots: s.slots.map(() => ({ ...EMPTY_SLOT })) }));
    }
  };
  const addPartner = (id: string) => {
    const emptyIdx = state.slots.findIndex((s) => !s.jokerId);
    if (emptyIdx < 0) {
      toast({ title: "No empty slot", description: "Remove a joker first." });
      return;
    }
    updateSlot(emptyIdx, { jokerId: id });
  };

  // ---- Save / Load builds (in-memory only per spec) ----
  const saveBuild = () => {
    const name = saveName.trim() || `Build ${savedBuilds.length + 1}`;
    if (savedBuilds.length >= 5) {
      toast({ title: "Max 5 builds", description: "Delete one first." });
      return;
    }
    const b: SavedBuild = {
      id: `b-${Date.now()}`, name, state: JSON.parse(JSON.stringify(state)), savedAt: Date.now(),
    };
    setSavedBuilds((bs) => [...bs, b]);
    setSaveName("");
    toast({ title: "Saved", description: name });
  };
  const loadBuild = (b: SavedBuild) => {
    setState(JSON.parse(JSON.stringify(b.state)));
    toast({ title: "Loaded", description: b.name });
  };
  const deleteBuild = (id: string) => {
    setSavedBuilds((bs) => bs.filter((b) => b.id !== id));
  };

  // ---- Share URL ----
  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const enc = encodeBuild(state);
    const base = `${window.location.origin}${window.location.pathname}`;
    return `${base}#planner?b=${enc}`;
  }, [state]);
  const copyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast({ title: "Copy failed", description: "Select the URL manually." });
    }
  };

  // Apply planet -> bump hand level
  const applyPlanet = (planetId: string) => {
    const p = PLANETS.find((x: any) => x.id === planetId);
    if (!p) return;
    setState((s) => ({ ...s, handLevel: Math.min(10, s.handLevel + 1) }));
    toast({ title: "Planet applied", description: `+1 level to ${HAND_LABELS[state.hand]}` });
  };

  // ---- Render ----
  const currentIds = new Set(activeIds);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Run Planner</h1>
          <p className="text-sm text-muted-foreground">
            Click slots to fill, tweak editions & modifiers, watch the score change live.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={clearAll} data-testid="clear-all">
            <Trash2 className="h-4 w-4 mr-1" /> Clear all
          </Button>
          <Button variant="outline" size="sm" onClick={copyShare} data-testid="share-btn">
            {copied ? <Check className="h-4 w-4 mr-1" /> : <Share2 className="h-4 w-4 mr-1" />}
            {copied ? "Copied" : "Share"}
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* ---- LEFT: Slots + Context ---- */}
        <section className="lg:col-span-4 space-y-4">
          <Card>
            <CardContent className="p-3">
              <div className="text-xs font-semibold uppercase tracking-wider mb-2 opacity-70">
                Joker Slots ({activeIds.length}/{state.slots.length})
              </div>
              <div className="grid grid-cols-3 gap-2">
                {state.slots.map((slot, i) => (
                  <SlotCard
                    key={i}
                    slot={slot}
                    idx={i}
                    onPick={() => { setPickerSlot(i); setPickerOpen(true); }}
                    onEdit={() => { setEditorSlot(i); setEditorOpen(true); }}
                    onRemove={() => removeSlot(i)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Build context */}
          <Card>
            <CardContent className="p-3 space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider opacity-70">Build Context</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Deck</Label>
                  <Select
                    value={state.deckId ?? "__none__"}
                    onValueChange={(v) => setState((s) => ({ ...s, deckId: v === "__none__" ? null : v }))}
                  >
                    <SelectTrigger data-testid="ctx-deck"><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {DECKS.map((d: any) => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Stake</Label>
                  <Select
                    value={state.stakeId ?? "__none__"}
                    onValueChange={(v) => setState((s) => ({ ...s, stakeId: v === "__none__" ? null : v }))}
                  >
                    <SelectTrigger data-testid="ctx-stake"><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {STAKES.map((s: any) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs">Ante: {state.ante}</Label>
                <input
                  type="range" min={1} max={8} value={state.ante}
                  onChange={(e) => setState((s) => ({ ...s, ante: Number(e.target.value) }))}
                  data-testid="ctx-ante"
                  className="w-full"
                />
              </div>
              <div className="grid grid-cols-3 gap-1 text-[11px]">
                {(["small", "big", "boss"] as const).map((k) => {
                  const v = blindTargets[k];
                  const hit = (k === "small" && result.score >= v) ||
                              (k === "big" && result.score >= v) ||
                              (k === "boss" && result.score >= v);
                  return (
                    <div key={k} className={`rounded p-2 border ${hit ? "border-green-500/60 bg-green-500/10" : "border-border bg-card"}`}>
                      <div className="uppercase tracking-wider opacity-70">{k}</div>
                      <div className="font-mono">{v.toLocaleString()}</div>
                    </div>
                  );
                })}
              </div>
              <div className="text-[10px] opacity-70">
                Current: {targetClass === "fail" ? "Below small blind" :
                          targetClass === "small" ? "Beats small" :
                          targetClass === "big" ? "Beats big" : "Beats boss"}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[0, 1].map((i) => (
                  <div key={i}>
                    <Label className="text-xs">Voucher {i + 1}</Label>
                    <Select
                      value={state.voucherIds[i] ?? "__none__"}
                      onValueChange={(v) => setState((s) => ({
                        ...s,
                        voucherIds: s.voucherIds.map((x, idx) => idx === i ? (v === "__none__" ? null : v) : x),
                      }))}
                    >
                      <SelectTrigger data-testid={`ctx-voucher-${i}`}><SelectValue placeholder="None" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">None</SelectItem>
                        {VOUCHERS.map((v: any) => (
                          <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Save/Load */}
          <Card>
            <CardContent className="p-3 space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider opacity-70">Saved Builds ({savedBuilds.length}/5)</div>
              <div className="flex gap-2">
                <Input
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Build name"
                  data-testid="save-name"
                />
                <Button size="sm" onClick={saveBuild} data-testid="save-btn">
                  <Save className="h-4 w-4 mr-1" /> Save
                </Button>
              </div>
              {savedBuilds.length === 0 ? (
                <div className="text-[11px] text-muted-foreground italic">No saved builds yet.</div>
              ) : (
                <div className="space-y-1">
                  {savedBuilds.map((b) => (
                    <div key={b.id} className="flex items-center gap-1 text-xs">
                      <Button variant="ghost" size="sm" onClick={() => loadBuild(b)} className="flex-1 justify-start h-7" data-testid={`load-${b.id}`}>
                        <FolderOpen className="h-3 w-3 mr-1" /> {b.name}
                      </Button>
                      <button onClick={() => deleteBuild(b.id)} className="opacity-50 hover:opacity-100" data-testid={`del-${b.id}`}>
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* ---- MIDDLE: Scoring Engine ---- */}
        <section className="lg:col-span-4 space-y-4">
          <Card>
            <CardContent className="p-3 space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider opacity-70">Scoring</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Hand</Label>
                  <Select value={state.hand} onValueChange={(v) => setState((s) => ({ ...s, hand: v as HandKey }))}>
                    <SelectTrigger data-testid="hand-select"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ALL_HANDS.map((h) => (
                        <SelectItem key={h} value={h}>{HAND_LABELS[h]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Level: {state.handLevel}</Label>
                  <input
                    type="range" min={1} max={10} value={state.handLevel}
                    onChange={(e) => setState((s) => ({ ...s, handLevel: Number(e.target.value) }))}
                    data-testid="hand-level"
                    className="w-full"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Steel cards</Label>
                  <Input type="number" inputMode="numeric" value={state.steelCards}
                    onChange={(e) => setState((s) => ({ ...s, steelCards: Math.max(0, Number(e.target.value) || 0) }))}
                    data-testid="steel-cards" />
                </div>
                <div>
                  <Label className="text-xs">Glass cards</Label>
                  <Input type="number" inputMode="numeric" value={state.glassCards}
                    onChange={(e) => setState((s) => ({ ...s, glassCards: Math.max(0, Number(e.target.value) || 0) }))}
                    data-testid="glass-cards" />
                </div>
                <div>
                  <Label className="text-xs">Retriggers</Label>
                  <Input type="number" inputMode="numeric" value={state.redSealRetriggers}
                    onChange={(e) => setState((s) => ({ ...s, redSealRetriggers: Math.max(0, Number(e.target.value) || 0) }))}
                    data-testid="retriggers" />
                </div>
              </div>
              <div className="rounded bg-black/40 p-3 text-center">
                <div className="text-[10px] uppercase tracking-wider opacity-60 mb-1">Score</div>
                <div className="font-mono text-2xl font-bold tabular-nums" data-testid="score-value">
                  <span className="chips-text">{result.chips.toLocaleString()}</span>
                  <span className="opacity-50 mx-1">×</span>
                  <span className="mult-text">{result.mult.toLocaleString()}</span>
                </div>
                <div className="font-mono text-3xl font-extrabold mt-1 text-[var(--bal-gold)]" data-testid="score-total">
                  {result.score.toLocaleString()}
                </div>
              </div>
              <details className="text-[11px]">
                <summary className="cursor-pointer opacity-70 hover:opacity-100">Breakdown</summary>
                <div className="mt-2 space-y-0.5 font-mono">
                  {result.breakdown.map((b, i) => (
                    <div key={i} className="flex justify-between gap-2 border-b border-border/50 py-0.5">
                      <span className="opacity-80">{b.label}</span>
                      <span className="text-right">
                        {b.chips != null && <span className="chips-text">+{Math.round(b.chips).toLocaleString()}c </span>}
                        {b.mult != null && b.xMult == null && <span className="mult-text">+{Math.round(b.mult).toLocaleString()}m </span>}
                        {b.xMult != null && <span className="text-fuchsia-400">×{b.xMult}</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </details>
            </CardContent>
          </Card>

          {/* Hand probability */}
          <Card>
            <CardContent className="p-3 space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider opacity-70">Hand Probability (5-card draw)</div>
              <div className="space-y-1">
                {ALL_HANDS.slice(0, 10).map((h) => {
                  const pct = HAND_PROBABILITY_PCT[h] ?? 0;
                  const w = Math.max(2, Math.min(100, pct * 5));
                  return (
                    <div key={h} className="flex items-center gap-2 text-[10px]">
                      <div className="w-24 truncate opacity-80">{HAND_LABELS[h]}</div>
                      <div className="flex-1 h-2 bg-black/40 rounded overflow-hidden">
                        <div className="h-full bg-[var(--bal-mult)]" style={{ width: `${w}%` }} />
                      </div>
                      <div className="w-12 text-right font-mono opacity-70">{pct < 0.01 ? "<0.01" : pct.toFixed(2)}%</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ---- RIGHT: Synergy + Consumables + Notes ---- */}
        <section className="lg:col-span-4 space-y-4">
          <Card>
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-wider opacity-70">Synergy</div>
                <div className="font-mono text-sm" data-testid="syn-score">{Math.round(synScore)}/100</div>
              </div>
              <Progress value={synScore} className="h-2" />
              {activeSyn.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider opacity-60 mt-2">Active ({activeSyn.length})</div>
                  <div className="space-y-1 mt-1">
                    {activeSyn.slice(0, 6).map((s, i) => (
                      <div key={i} className="text-[11px] rounded bg-green-500/10 border border-green-500/30 p-1.5">
                        <span className="font-medium">{JOKER_MAP[s.a]?.name}</span> + <span className="font-medium">{JOKER_MAP[s.b]?.name}</span>
                        <div className="opacity-70">{s.why}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {antiSyn.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider opacity-60 mt-2 text-red-400">Conflicts ({antiSyn.length})</div>
                  <div className="space-y-1 mt-1">
                    {antiSyn.slice(0, 4).map((w, i) => (
                      <div key={i} className="text-[11px] rounded bg-red-500/10 border border-red-500/30 p-1.5">
                        <span className="font-medium">{JOKER_MAP[w.a]?.name} × {JOKER_MAP[w.b]?.name}</span>
                        <div className="opacity-70">{w.why}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {archetypes.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider opacity-60 mt-2">Archetypes</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {archetypes.map((a) => (
                      <Badge key={a.id} variant="secondary" className="text-[10px]">{a.name}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {missingPartners.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider opacity-60 mt-2">Suggested partners</div>
                  <div className="space-y-1 mt-1">
                    {missingPartners.map((s, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px] gap-2">
                        <div className="flex-1 truncate">
                          <span className="font-medium">{s.joker.name}</span>
                          <span className="opacity-60"> (pairs with {s.pairsWith.slice(0, 2).join(", ")})</span>
                        </div>
                        <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => addPartner(s.joker.id)} data-testid={`add-partner-${s.joker.id}`}>
                          <Plus className="h-3 w-3 mr-1" /> Add
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Consumables */}
          <Card>
            <CardContent className="p-3 space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider opacity-70">Consumables</div>
              <div className="grid grid-cols-2 gap-2">
                {state.consumables.map((c, i) => {
                  const pool = c.kind === "tarot" ? TAROTS : c.kind === "planet" ? PLANETS : SPECTRALS;
                  return (
                    <div key={i} className="space-y-1">
                      <Select
                        value={c.kind}
                        onValueChange={(v) => setState((s) => ({
                          ...s,
                          consumables: s.consumables.map((x, idx) => idx === i ? { kind: v as ConsumableKind, id: null } : x),
                        }))}
                      >
                        <SelectTrigger className="h-7 text-xs" data-testid={`cons-kind-${i}`}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tarot">Tarot</SelectItem>
                          <SelectItem value="planet">Planet</SelectItem>
                          <SelectItem value="spectral">Spectral</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={c.id ?? "__none__"}
                        onValueChange={(v) => setState((s) => ({
                          ...s,
                          consumables: s.consumables.map((x, idx) => idx === i ? { ...x, id: v === "__none__" ? null : v } : x),
                        }))}
                      >
                        <SelectTrigger className="h-7 text-xs" data-testid={`cons-id-${i}`}>
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">None</SelectItem>
                          {(pool as any[]).map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {c.kind === "planet" && c.id && (
                        <Button size="sm" variant="outline" className="h-6 w-full text-[10px]" onClick={() => applyPlanet(c.id!)} data-testid={`cons-apply-${i}`}>
                          Apply
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardContent className="p-3 space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider opacity-70">Notes</div>
              <Textarea
                value={state.notes}
                onChange={(e) => setState((s) => ({ ...s, notes: e.target.value }))}
                placeholder="Build plan, win conditions, stop-loss conditions..."
                className="min-h-24 text-sm"
                data-testid="notes"
              />
            </CardContent>
          </Card>
        </section>
      </div>

      <PickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={pickJokerForSlot}
        currentIds={currentIds}
      />
      <SlotEditor
        open={editorOpen}
        slot={editorSlot != null ? state.slots[editorSlot] : null}
        idx={editorSlot ?? 0}
        onClose={() => setEditorOpen(false)}
        onChange={(patch) => editorSlot != null && updateSlot(editorSlot, patch)}
        onReplace={() => {
          if (editorSlot != null) {
            setEditorOpen(false);
            setPickerSlot(editorSlot);
            setPickerOpen(true);
          }
        }}
      />
    </div>
  );
}

export default RunPlannerTab;
