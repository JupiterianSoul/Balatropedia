/**
 * MyTierListsTab — user-editable tier lists with drag-and-drop.
 *
 * Backed by the localAdapter CRUD endpoints (/api/tierlists). Persists to
 * localStorage under `balatropedia.local.tierlists`. Up to 20 lists with up
 * to 12 tiers each.
 *
 * Pools: jokers, vouchers, tarots, planets, spectrals.
 */

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, Trash2, Edit3, Copy, Download, Save, X, Tag, Layers, ListPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { JOKERS } from "@/lib/helpers";
import { VOUCHERS } from "@/data/phase3/vouchers";
import { TAROTS } from "@/data/phase3/tarots";
import { PLANETS } from "@/data/phase3/planets";
import { SPECTRALS } from "@/data/phase3/spectrals";
import type { TierList, Tier, ItemPool } from "@/lib/tierTypes";
import { TIER_COLOR_PRESETS, makeDefaultTiers } from "@/lib/tierTypes";
import { useToast } from "@/hooks/use-toast";

const POOL_LABEL: Record<ItemPool, string> = {
  jokers: "Jokers",
  vouchers: "Vouchers",
  tarots: "Tarots",
  planets: "Planets",
  spectrals: "Spectrals",
};

function getPool(pool: ItemPool): { id: string; name: string }[] {
  switch (pool) {
    case "jokers":    return JOKERS.map((j) => ({ id: j.id, name: j.name }));
    case "vouchers":  return VOUCHERS.map((v) => ({ id: v.id, name: v.name }));
    case "tarots":    return TAROTS.map((t) => ({ id: t.id, name: t.name }));
    case "planets":   return PLANETS.map((p) => ({ id: p.id, name: p.name }));
    case "spectrals": return SPECTRALS.map((s) => ({ id: s.id, name: s.name }));
  }
}

function itemName(pool: ItemPool, id: string): string {
  const found = getPool(pool).find((x) => x.id === id);
  return found?.name ?? id;
}

// ---------- API helpers ----------

async function listTierLists(): Promise<TierList[]> {
  const res = await apiRequest("GET", "/api/tierlists");
  const json = await res.json();
  return (json?.lists ?? json ?? []) as TierList[];
}

async function createTierList(input: Partial<TierList>): Promise<TierList> {
  const res = await apiRequest("POST", "/api/tierlists", input);
  const json = await res.json();
  return (json?.list ?? json) as TierList;
}

async function updateTierList(id: string, patch: Partial<TierList>): Promise<TierList> {
  const res = await apiRequest("PATCH", `/api/tierlists/${id}`, patch);
  const json = await res.json();
  return (json?.list ?? json) as TierList;
}

async function deleteTierList(id: string): Promise<void> {
  await apiRequest("DELETE", `/api/tierlists/${id}`);
}

// ---------- Sortable item chip ----------

function SortableChip({ id, pool, onRemove }: { id: string; pool: ItemPool; onRemove?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group relative inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-xs font-medium shadow-sm hover:border-accent/60 hover:bg-card/80 cursor-grab active:cursor-grabbing select-none"
      data-testid={`chip-${id}`}
    >
      <span className="truncate max-w-[160px]">{itemName(pool, id)}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onRemove();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="opacity-0 group-hover:opacity-100 ml-0.5 rounded p-0.5 hover:bg-destructive/20"
          aria-label="Remove"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

function TierDropZone({
  tier, pool, onRenameTier, onColorTier, onRemoveTier, onRemoveItem,
}: {
  tier: Tier;
  pool: ItemPool;
  onRenameTier: (label: string) => void;
  onColorTier: (color: string) => void;
  onRemoveTier: () => void;
  onRemoveItem: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useSortable({ id: `tier-zone-${tier.id}`, data: { type: "tier", tierId: tier.id } });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg border-2 transition-colors ${isOver ? "border-accent bg-accent/5" : "border-border"} bg-card/40`}
      style={{ borderLeftWidth: 8, borderLeftColor: tier.color }}
      data-testid={`tier-${tier.label}`}
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-card/60 rounded-t-md">
        <Input
          value={tier.label}
          onChange={(e) => onRenameTier(e.target.value)}
          className="h-7 w-16 font-bold text-center"
          maxLength={4}
          aria-label="Tier label"
        />
        <Select value={tier.color} onValueChange={onColorTier}>
          <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {TIER_COLOR_PRESETS.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                <div className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-sm" style={{ background: c.value }} />
                  <span>{c.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex-1 text-xs text-muted-foreground">{tier.itemIds.length} items</div>
        <Button variant="ghost" size="sm" onClick={onRemoveTier} className="h-7 px-2" aria-label="Remove tier">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="p-2 min-h-[60px]">
        <SortableContext items={tier.itemIds} strategy={rectSortingStrategy}>
          <div className="flex flex-wrap gap-1.5">
            {tier.itemIds.length === 0 ? (
              <div className="text-xs text-muted-foreground italic px-1 py-1">Drop items here.</div>
            ) : (
              tier.itemIds.map((id) => (
                <SortableChip key={id} id={id} pool={pool} onRemove={() => onRemoveItem(id)} />
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

function UnassignedZone({ pool, ids }: { pool: ItemPool; ids: string[] }) {
  const { setNodeRef, isOver } = useSortable({ id: `tier-zone-unassigned`, data: { type: "unassigned" } });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg border-2 transition-colors ${isOver ? "border-accent bg-accent/5" : "border-dashed border-border"} bg-card/30`}
    >
      <div className="px-3 py-2 border-b border-border/60 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Unassigned ({ids.length})
      </div>
      <div className="p-2 min-h-[60px] max-h-[260px] overflow-y-auto">
        <SortableContext items={ids} strategy={rectSortingStrategy}>
          <div className="flex flex-wrap gap-1.5">
            {ids.length === 0 ? (
              <div className="text-xs text-muted-foreground italic px-1 py-1">All items are tiered.</div>
            ) : (
              ids.map((id) => <SortableChip key={id} id={id} pool={pool} />)
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

// ---------- Editor ----------

function TierListEditor({
  list,
  onChange,
  onSave,
  onClose,
  onExport,
}: {
  list: TierList;
  onChange: (next: TierList) => void;
  onSave: () => void;
  onClose: () => void;
  onExport: () => void;
}) {
  const [activeChip, setActiveChip] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  );

  const pool = list.itemPool;
  const allIds = useMemo(() => getPool(pool).map((x) => x.id), [pool]);
  const assigned = useMemo(() => new Set(list.tiers.flatMap((t) => t.itemIds)), [list.tiers]);
  const unassigned = useMemo(() => allIds.filter((id) => !assigned.has(id)), [allIds, assigned]);

  function setTiers(next: Tier[]) {
    onChange({ ...list, tiers: next, updatedAt: Date.now() });
  }
  function patchTier(idx: number, patch: Partial<Tier>) {
    setTiers(list.tiers.map((t, i) => (i === idx ? { ...t, ...patch } : t)));
  }

  function handleDragStart(e: DragStartEvent) {
    setActiveChip(String(e.active.id));
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveChip(null);
    const { active, over } = e;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    // Find current location of the active item
    let fromTierIdx = list.tiers.findIndex((t) => t.itemIds.includes(activeId));
    const fromUnassigned = !assigned.has(activeId);

    // Resolve target tier
    let targetTierIdx = -1;
    let targetUnassigned = false;
    let targetItemId: string | null = null;

    if (overId === "tier-zone-unassigned") {
      targetUnassigned = true;
    } else if (overId.startsWith("tier-zone-")) {
      const tierId = overId.replace("tier-zone-", "");
      targetTierIdx = list.tiers.findIndex((t) => t.id === tierId);
    } else {
      // Over another chip — find which tier (or unassigned) contains it
      const overIdx = list.tiers.findIndex((t) => t.itemIds.includes(overId));
      if (overIdx >= 0) {
        targetTierIdx = overIdx;
        targetItemId = overId;
      } else if (unassigned.includes(overId)) {
        targetUnassigned = true;
        targetItemId = overId;
      }
    }

    if (targetTierIdx < 0 && !targetUnassigned) return;

    // Same-tier reorder
    if (!fromUnassigned && fromTierIdx === targetTierIdx && targetItemId && activeId !== targetItemId) {
      const ids = list.tiers[fromTierIdx].itemIds;
      const oldIndex = ids.indexOf(activeId);
      const newIndex = ids.indexOf(targetItemId);
      if (oldIndex >= 0 && newIndex >= 0) {
        const next = arrayMove(ids, oldIndex, newIndex);
        patchTier(fromTierIdx, { itemIds: next });
      }
      return;
    }

    // Cross-zone move
    const newTiers = list.tiers.map((t) => ({ ...t, itemIds: t.itemIds.filter((id) => id !== activeId) }));
    if (targetTierIdx >= 0) {
      const ids = [...newTiers[targetTierIdx].itemIds];
      if (targetItemId && ids.includes(targetItemId)) {
        ids.splice(ids.indexOf(targetItemId), 0, activeId);
      } else {
        ids.push(activeId);
      }
      newTiers[targetTierIdx] = { ...newTiers[targetTierIdx], itemIds: ids };
    }
    // If targetUnassigned: dropping into unassigned just removes from any tier (newTiers already does that)
    setTiers(newTiers);
  }

  function addTier() {
    if (list.tiers.length >= 12) return;
    const used = new Set(list.tiers.map((t) => t.label));
    const label = ["S", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"].find((l) => !used.has(l)) ?? "X";
    const newTier: Tier = {
      id: `tier-${label.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      label,
      color: TIER_COLOR_PRESETS[list.tiers.length % TIER_COLOR_PRESETS.length].value,
      itemIds: [],
    };
    setTiers([...list.tiers, newTier]);
  }

  function changePool(next: ItemPool) {
    if (next === pool) return;
    if (!confirm("Switching item pools clears all assigned items. Continue?")) return;
    const cleared = list.tiers.map((t) => ({ ...t, itemIds: [] }));
    onChange({ ...list, itemPool: next, tiers: cleared, updatedAt: Date.now() });
  }

  return (
    <div className="space-y-3" data-testid="tier-list-editor">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={list.name}
          onChange={(e) => onChange({ ...list, name: e.target.value, updatedAt: Date.now() })}
          className="h-9 max-w-xs font-semibold"
          maxLength={60}
          aria-label="Tier list name"
        />
        <Select value={pool} onValueChange={(v) => changePool(v as ItemPool)}>
          <SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            {(Object.keys(POOL_LABEL) as ItemPool[]).map((p) => (
              <SelectItem key={p} value={p}>{POOL_LABEL[p]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" onClick={addTier} disabled={list.tiers.length >= 12} data-testid="button-add-tier">
          <ListPlus className="h-3.5 w-3.5 mr-1" /> Tier
        </Button>
        <div className="flex-1" />
        <Button size="sm" variant="outline" onClick={onExport} data-testid="button-export-list">
          <Download className="h-3.5 w-3.5 mr-1" /> Export
        </Button>
        <Button size="sm" onClick={onSave} data-testid="button-save-list">
          <Save className="h-3.5 w-3.5 mr-1" /> Save
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose} aria-label="Close editor">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="space-y-2">
          {list.tiers.map((tier, idx) => (
            <TierDropZone
              key={tier.id}
              tier={tier}
              pool={pool}
              onRenameTier={(label) => patchTier(idx, { label })}
              onColorTier={(color) => patchTier(idx, { color })}
              onRemoveTier={() => setTiers(list.tiers.filter((_, i) => i !== idx))}
              onRemoveItem={(id) =>
                patchTier(idx, { itemIds: list.tiers[idx].itemIds.filter((x) => x !== id) })
              }
            />
          ))}
        </div>
        <div className="mt-3">
          <UnassignedZone pool={pool} ids={unassigned} />
        </div>
        <DragOverlay>
          {activeChip ? (
            <div className="inline-flex items-center gap-1 rounded-md border border-accent bg-card px-2 py-1 text-xs font-medium shadow-lg">
              <span className="truncate max-w-[160px]">{itemName(pool, activeChip)}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

// ---------- Overview ----------

export function MyTierListsTab() {
  const { toast } = useToast();
  const [lists, setLists] = useState<TierList[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<TierList | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await listTierLists();
        setLists(data);
      } catch (e) {
        console.error("[tierlists] load failed", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleCreate(pool: ItemPool) {
    if (lists.length >= 20) {
      toast({ title: "Limit reached", description: "Tier list limit is 20.", variant: "destructive" });
      return;
    }
    try {
      const list = await createTierList({
        name: `${POOL_LABEL[pool]} Tier List`,
        itemPool: pool,
        tiers: makeDefaultTiers(),
      });
      setLists((prev) => [...prev, list]);
      setEditingId(list.id);
      setDraft(list);
    } catch (e: any) {
      toast({ title: "Create failed", description: e?.message ?? "Unknown error", variant: "destructive" });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this tier list?")) return;
    try {
      await deleteTierList(id);
      setLists((prev) => prev.filter((l) => l.id !== id));
      if (editingId === id) { setEditingId(null); setDraft(null); }
    } catch (e: any) {
      toast({ title: "Delete failed", description: e?.message ?? "Unknown error", variant: "destructive" });
    }
  }

  async function handleDuplicate(list: TierList) {
    if (lists.length >= 20) return;
    try {
      const copy = await createTierList({
        name: `${list.name} (copy)`,
        itemPool: list.itemPool,
        tiers: list.tiers.map((t) => ({ ...t, id: `tier-${t.label}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` })),
      });
      setLists((prev) => [...prev, copy]);
    } catch (e: any) {
      toast({ title: "Duplicate failed", description: e?.message ?? "Unknown error", variant: "destructive" });
    }
  }

  async function handleSave() {
    if (!draft) return;
    try {
      const saved = await updateTierList(draft.id, {
        name: draft.name,
        tiers: draft.tiers,
        itemPool: draft.itemPool,
      });
      setLists((prev) => prev.map((l) => (l.id === saved.id ? saved : l)));
      toast({ title: "Saved", description: `"${saved.name}" saved.` });
    } catch (e: any) {
      toast({ title: "Save failed", description: e?.message ?? "Unknown error", variant: "destructive" });
    }
  }

  function handleExport() {
    if (!draft) return;
    const lines: string[] = [];
    lines.push(`# ${draft.name}`);
    lines.push(`Pool: ${POOL_LABEL[draft.itemPool]}`);
    lines.push("");
    for (const tier of draft.tiers) {
      lines.push(`## ${tier.label}`);
      if (tier.itemIds.length === 0) {
        lines.push("_(empty)_");
      } else {
        for (const id of tier.itemIds) lines.push(`- ${itemName(draft.itemPool, id)}`);
      }
      lines.push("");
    }
    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${draft.name.replace(/[^\w-]+/g, "_") || "tierlist"}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading tier lists…</div>;
  }

  if (editingId && draft) {
    return (
      <div className="p-3 sm:p-4">
        <TierListEditor
          list={draft}
          onChange={setDraft}
          onSave={handleSave}
          onClose={() => { setEditingId(null); setDraft(null); }}
          onExport={handleExport}
        />
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 space-y-4" data-testid="tier-lists-overview">
      <div className="flex flex-wrap items-center gap-2">
        <Layers className="h-4 w-4 text-accent" />
        <h2 className="text-base font-semibold">My Tier Lists</h2>
        <span className="text-xs text-muted-foreground">({lists.length}/20)</span>
        <div className="flex-1" />
        <Select onValueChange={(v) => handleCreate(v as ItemPool)}>
          <SelectTrigger className="h-9 w-44" data-testid="select-new-list-pool">
            <SelectValue placeholder="+ New tier list…" />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(POOL_LABEL) as ItemPool[]).map((p) => (
              <SelectItem key={p} value={p}>+ {POOL_LABEL[p]} list</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {lists.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card/30 p-8 text-center">
          <Tag className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
          <div className="text-sm font-medium">No tier lists yet</div>
          <div className="text-xs text-muted-foreground mt-1">Create one above to start ranking jokers, vouchers, tarots, planets, or spectrals.</div>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => (
            <div
              key={list.id}
              className="rounded-lg border border-border bg-card/50 p-3 hover:border-accent/60 transition-colors"
              data-testid={`tier-list-card-${list.id}`}
            >
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{list.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {POOL_LABEL[list.itemPool]} · {list.tiers.length} tiers · {list.tiers.reduce((n, t) => n + t.itemIds.length, 0)} ranked
                  </div>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {list.tiers.slice(0, 8).map((t) => (
                  <span
                    key={t.id}
                    className="inline-flex items-center justify-center text-[10px] font-bold rounded-sm w-6 h-5"
                    style={{ background: t.color, color: "white" }}
                    title={`${t.label} (${t.itemIds.length})`}
                  >
                    {t.label}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex gap-1">
                <Button size="sm" variant="default" className="flex-1" onClick={() => { setEditingId(list.id); setDraft(list); }} data-testid={`button-edit-${list.id}`}>
                  <Edit3 className="h-3.5 w-3.5 mr-1" /> Edit
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleDuplicate(list)} aria-label="Duplicate">
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleDelete(list.id)} aria-label="Delete">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
