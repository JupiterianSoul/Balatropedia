import { useState } from "react";
import { X, Save, FolderOpen, Trash2, Layers, AlertTriangle, Sparkles, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { JokerCombobox } from "@/components/JokerCombobox";
import { JokerSprite } from "@/components/JokerSprite";
import { SectionLabel } from "@/components/primitives";
import { LName } from "@/components/Localized";
import { RunMetaSelectors } from "@/components/RunMetaSelectors";
import { RunChallengePanel } from "@/components/RunChallenge";
import { useRun } from "@/lib/runContext";
import type { SavedRun } from "@/lib/useRuns";
import { useAuth } from "@/lib/auth";
import { useRuns } from "@/lib/useRuns";
import { useApp } from "@/lib/appContext";
import { useToast } from "@/hooks/use-toast";
import {
  JOKER_MAP,
  activeSynergies, antiSynergyWarnings, synergyKey,
  heuristicSynergies, suggestedArchetypes,
  type Archetype, type HeuristicSynergy,
} from "@/lib/helpers";
import { useT, useLabels, useCuratedText, useGameText } from "@/lib/i18n";

function RunSynergyRow({ s, labels }: { s: ReturnType<typeof activeSynergies>[number]; labels: ReturnType<typeof useLabels> }) {
  const key = synergyKey(s.a, s.b);
  const why = useCuratedText(`ui.synergy.${key}.why`, s.why);
  const aText = useGameText("jokers", s.a);
  const bText = useGameText("jokers", s.b);
  return (
    <li className="border-l-2 border-accent/40 pl-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-sm font-medium text-foreground">{aText.name}</span>
        <span className="text-xs text-muted-foreground">+</span>
        <span className="text-sm font-medium text-foreground">{bText.name}</span>
        <span className="rounded-sm border border-accent/30 bg-accent/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-accent">
          {labels.engine[s.engine]}
        </span>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-foreground/75">{why}</p>
      <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground/60">{labels.synergyKind[s.kind]}</p>
    </li>
  );
}

function RunLikelyRow({ h, labels, t }: {
  h: HeuristicSynergy;
  labels: ReturnType<typeof useLabels>;
  t: ReturnType<typeof useT>;
}) {
  const aText = useGameText("jokers", h.a);
  const bText = useGameText("jokers", h.b);
  let reasonLabel = "";
  let reasonDetail: string | null = null;
  if (h.reasonKey === "partner") {
    reasonLabel = t("ui.tabs.myrun_reason_partner");
  } else if (h.reasonKey === "archetype") {
    reasonLabel = t("ui.tabs.myrun_reason_archetype");

    const firstArch = h.detail.split(",")[0] as Archetype;
    reasonDetail = (labels.archetype as Record<string, string>)[firstArch] ?? firstArch;
  } else if (h.reasonKey === "tag") {
    reasonLabel = t("ui.tabs.myrun_reason_tag");

    const firstTag = h.detail.split(",")[0];
    reasonDetail = (labels.role as Record<string, string>)[firstTag] ?? firstTag;
  }
  return (
    <li className="rounded-md border border-[hsl(45_85%_60%)]/30 bg-[hsl(45_85%_60%)]/[0.06] p-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-sm font-medium text-foreground">{aText.name}</span>
        <span className="text-xs text-muted-foreground">+</span>
        <span className="text-sm font-medium text-foreground">{bText.name}</span>
        <span className="rounded-sm border border-[hsl(45_85%_60%)]/30 bg-[hsl(45_85%_60%)]/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[hsl(45_85%_60%)]">
          {reasonLabel}
        </span>
      </div>
      {reasonDetail ? (
        <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground/70">{reasonDetail}</p>
      ) : null}
    </li>
  );
}

function RunWarningRow({ w, t }: { w: ReturnType<typeof antiSynergyWarnings>[number]; t: ReturnType<typeof useT> }) {
  const aText = useGameText("jokers", w.a);
  const bText = useGameText("jokers", w.b);
  const key = synergyKey(w.a, w.b);
  const fallback = w.fromSynergy
    ? w.why
    : t("ui.tabs.myrun_anti_generic", { a: aText.name, b: bText.name });
  const why = useCuratedText(`ui.synergy.${key}.why`, fallback);
  return (
    <li className="rounded-md border border-destructive/40 bg-destructive/[0.06] p-2.5">
      <div className="text-sm font-medium text-[hsl(0_60%_72%)]">
        {aText.name} ✕ {bText.name}
      </div>
      <p className="mt-0.5 text-xs leading-relaxed text-foreground/75">{why}</p>
    </li>
  );
}

export function MyRunTab() {
  const {
    slots, slotCap, setSlotCap, addToRun, removeFromRun, clearRun, replaceRun, isInRun, isFull,
    deckId, stakeId, voucherIds, applyMeta,
  } = useRun();
  const { isSignedIn } = useAuth();
  const { runs, saveRun, deleteRun } = useRuns();
  const { openJokerDetail } = useApp();
  const { toast } = useToast();
  const t = useT();
  const labels = useLabels();

  const [picker, setPicker] = useState<string | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [runName, setRunName] = useState("");
  const [runNotes, setRunNotes] = useState("");

  const synergies = activeSynergies(slots);

  const archetypes = suggestedArchetypes(slots);
  const warnings = antiSynergyWarnings(slots);

  const likely = heuristicSynergies(slots);

  function handleAdd(id: string) {
    const ok = addToRun(id);
    if (!ok) {
      toast({
        title: isFull ? t("ui.tabs.myrun_run_full") : t("ui.tabs.myrun_already_in"),
        description: isFull ? t("ui.tabs.myrun_full_desc", { cap: slotCap }) : undefined,
        variant: "destructive",
      });
    }
    setPicker(null);
  }

  async function handleSave() {
    if (!runName.trim()) {
      toast({ title: t("ui.tabs.myrun_name_required"), variant: "destructive" });
      return;
    }
    try {
      await saveRun.mutateAsync({
        name: runName.trim(),
        jokerIds: slots,
        notes: runNotes.trim() || null,
        meta: { deckId, stakeId, voucherIds },
      });
      toast({ title: t("ui.tabs.myrun_run_saved"), description: runName.trim() });
      setSaveOpen(false);
      setRunName("");
      setRunNotes("");
    } catch (e: any) {
      toast({ title: t("ui.tabs.myrun_save_failed"), description: String(e?.message ?? e), variant: "destructive" });
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      {}
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-pixel text-xl text-accent">{t("ui.tabs.myrun_title")}</h2>
            <p className="text-sm text-muted-foreground">{t("ui.tabs.myrun_subtitle")}</p>
          </div>
          <div className="flex items-end gap-2">
            <div>
              <Label htmlFor="slot-cap" className="text-[11px] uppercase tracking-wide text-muted-foreground">{t("ui.tabs.myrun_slots")}</Label>
              <Input
                id="slot-cap"
                type="number"
                min={1}
                max={10}
                value={slotCap}
                onChange={(e) => setSlotCap(Number(e.target.value))}
                className="mt-1 h-9 w-20 bg-card"
                data-testid="input-slot-cap"
              />
            </div>
          </div>
        </div>

        {}
        <RunMetaSelectors />

        {}
        <div className="flex flex-wrap items-center gap-2">
          <div className="min-w-0 flex-1 sm:min-w-[220px]">
            <JokerCombobox
              value={picker}
              onChange={handleAdd}
              placeholder={isFull ? t("ui.tabs.myrun_full_ph") : t("ui.tabs.myrun_add_ph")}
              testId="combobox-add-run"
            />
          </div>
          <div className="flex gap-2">
            {isSignedIn ? (
              <RunLoadMenu runs={runs} onLoad={(r) => { replaceRun(r.jokerIds); applyMeta(r.meta); toast({ title: t("ui.tabs.myrun_run_loaded"), description: r.name }); }} onDelete={(id) => deleteRun.mutate(id)} />
            ) : null}
            {isSignedIn ? (
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setSaveOpen(true)} disabled={slots.length === 0} data-testid="button-save-run">
                <Save className="h-4 w-4" /> {t("ui.btn.save_run")}
              </Button>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0}>
                    <Button size="sm" variant="outline" className="gap-1.5" disabled data-testid="button-save-run-disabled">
                      <Save className="h-4 w-4" /> {t("ui.btn.save_run")}
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>{t("ui.tabs.myrun_sign_in_save")}</TooltipContent>
              </Tooltip>
            )}
            <Button size="sm" variant="ghost" className="gap-1.5 text-muted-foreground" onClick={clearRun} disabled={slots.length === 0} data-testid="button-clear-run">
              {t("ui.btn.clear")}
            </Button>
          </div>
        </div>

        {}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {Array.from({ length: slotCap }).map((_, i) => {
            const id = slots[i];
            const j = id ? JOKER_MAP[id] : null;
            return (
              <div
                key={i}
                className="casino-card flex items-center gap-3 p-3"
                data-testid={`run-slot-${i}`}
              >
                {j ? (
                  <>
                    <JokerSprite jokerId={j.id} name={j.name} size={44} className="h-11 w-11" />
                    <button
                      onClick={() => openJokerDetail(j.id)}
                      className="min-w-0 flex-1 truncate text-left font-display text-sm text-accent hover:underline"
                    >
                      <LName category="jokers" id={j.id} fallback={j.name} />
                    </button>
                    <button
                      onClick={() => removeFromRun(j.id)}
                      aria-label={t("ui.tabs.myrun_remove_aria", { name: j.name })}
                      data-testid={`button-remove-run-${j.id}`}
                      className="rounded-sm p-1 text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <div className="flex h-11 flex-1 items-center gap-3 text-sm text-muted-foreground/60">
                    <div className="flex h-11 w-11 items-center justify-center rounded-md border border-dashed border-border">
                      <Layers className="h-4 w-4" />
                    </div>
                    {t("ui.tabs.myrun_empty_slot")}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {}
        <RunChallengePanel />
      </div>

      {}
      <div className="space-y-5">
        <section className="casino-card p-4">
          <div className="mb-2.5 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <SectionLabel>{t("ui.tabs.myrun_active_synergies")}</SectionLabel>
            <span className="ml-auto tabular text-xs text-muted-foreground">{synergies.length}</span>
          </div>
          {synergies.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("ui.tabs.myrun_no_synergies")}</p>
          ) : (
            <ul className="space-y-3">
              {synergies.map((s, i) => (
                <RunSynergyRow key={i} s={s} labels={labels} />
              ))}
            </ul>
          )}
        </section>

        {}
        {likely.length > 0 && (
          <section className="casino-card p-4">
            <div className="mb-2.5 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[hsl(45_85%_60%)]" />
              <SectionLabel>{t("ui.tabs.myrun_likely_synergies")}</SectionLabel>
              <span className="ml-auto tabular text-xs text-muted-foreground">{likely.length}</span>
            </div>
            <ul className="space-y-2">
              {likely.map((h, i) => (
                <RunLikelyRow key={i} h={h} labels={labels} t={t} />
              ))}
            </ul>
          </section>
        )}

        <section className="casino-card p-4">
          <div className="mb-2.5 flex items-center gap-1.5">
            <Tags className="h-3.5 w-3.5 text-[hsl(145_45%_60%)]" />
            <SectionLabel>{t("ui.tabs.myrun_implied_arch")}</SectionLabel>
          </div>
          {archetypes.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("ui.tabs.myrun_no_arch")}</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {archetypes.map((a) => (
                <span
                  key={a.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(145_35%_40%)]/40 bg-primary/15 px-2.5 py-1 text-xs text-[hsl(145_45%_62%)]"
                  data-testid={`run-archetype-${a.id}`}
                >
                  {labels.archetype[a.id as Archetype] ?? a.name}
                  <span className="tabular text-[10px] text-muted-foreground">{a.matched.length}</span>
                </span>
              ))}
            </div>
          )}
        </section>

        <section className="casino-card p-4">
          <div className="mb-2.5 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-[hsl(0_60%_68%)]" />
            <SectionLabel>{t("ui.tabs.myrun_anti_warnings")}</SectionLabel>
          </div>
          {warnings.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("ui.tabs.myrun_no_conflicts")}</p>
          ) : (
            <ul className="space-y-2">
              {warnings.map((w, i) => (
                <RunWarningRow key={i} w={w} t={t} />
              ))}
            </ul>
          )}
        </section>
      </div>

      {}
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-save-run">
          <DialogHeader>
            <DialogTitle className="font-pixel text-lg text-accent">{t("ui.tabs.myrun_save_title")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="run-name">{t("ui.tabs.myrun_run_name")}</Label>
              <Input id="run-name" value={runName} onChange={(e) => setRunName(e.target.value)} placeholder={t("ui.tabs.myrun_run_name_ph")} data-testid="input-run-name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="run-notes">{t("ui.tabs.myrun_notes_optional")}</Label>
              <Textarea id="run-notes" value={runNotes} onChange={(e) => setRunNotes(e.target.value)} rows={3} className="resize-none" data-testid="input-run-notes" />
            </div>
            <p className="text-xs text-muted-foreground">
              {slots.length === 1 ? t("ui.tabs.myrun_snapshot_one", { count: slots.length }) : t("ui.tabs.myrun_snapshot", { count: slots.length })}
              {deckId ? ` · ${t("ui.tabs.myrun_deck_set")}` : ""}{stakeId ? ` · ${t("ui.tabs.myrun_stake_set")}` : ""}
              {voucherIds.length ? (voucherIds.length === 1 ? t("ui.tabs.myrun_voucher_frag_one", { count: voucherIds.length }) : t("ui.tabs.myrun_voucher_frag", { count: voucherIds.length })) : ""}.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSaveOpen(false)}>{t("ui.common.cancel")}</Button>
            <Button onClick={handleSave} disabled={saveRun.isPending} data-testid="button-confirm-save-run">
              {saveRun.isPending ? t("ui.common.saving") : t("ui.btn.save_run")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RunLoadMenu({
  runs,
  onLoad,
  onDelete,
}: {
  runs: SavedRun[];
  onLoad: (run: SavedRun) => void;
  onDelete: (id: number) => void;
}) {
  const t = useT();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5" data-testid="button-load-run">
          <FolderOpen className="h-4 w-4" /> {t("ui.btn.load_run")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs text-muted-foreground">{t("ui.tabs.myrun_saved_runs")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {runs.length === 0 ? (
          <div className="px-2 py-2 text-xs text-muted-foreground">{t("ui.tabs.myrun_no_saved")}</div>
        ) : (
          runs.map((r) => (
            <div key={r.id} className="flex items-center gap-1 px-1">
              <DropdownMenuItem
                className="min-w-0 flex-1 text-sm"
                onSelect={() => onLoad(r)}
                data-testid={`load-run-${r.id}`}
              >
                <span className="truncate">{r.name}</span>
                <span className="ml-auto tabular text-[10px] text-muted-foreground">{r.jokerIds.length}</span>
              </DropdownMenuItem>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(r.id); }}
                aria-label={t("ui.tabs.myrun_delete_aria", { name: r.name })}
                data-testid={`delete-run-${r.id}`}
                className="rounded-sm p-1 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

