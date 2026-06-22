import { useState, useMemo } from "react";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { useApp } from "@/lib/appContext";
import {
  JOKERS, JOKER_MAP, ENGINE_CATEGORIES, ROLE_LABELS, jokerName, Joker,
} from "@/lib/helpers";
import { JokerMultiCombobox } from "@/components/JokerCombobox";
import { JokerChip, SectionLabel } from "@/components/primitives";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { LName } from "@/components/Localized";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const LEVEL_RANK = { low: 0, med: 1, high: 2 } as const;

export function SkeletonTab() {
  const { openJokerDetail } = useApp();
  const t = useT();
  const [ids, setIds] = useState<string[]>([]);
  const [whyOpen, setWhyOpen] = useState(false);
  const jokers = ids.map((id) => JOKER_MAP[id]).filter(Boolean) as Joker[];

  const analysis = useMemo(() => {
    // categories present
    const present = ENGINE_CATEGORIES.map((cat) => ({
      ...cat,
      jokers: jokers.filter((j) => cat.matches(j)),
    }));
    const covered = present.filter((c) => c.jokers.length > 0);
    const missing = present.filter((c) => c.jokers.length === 0);

    // "what you have" summary by category
    const have = covered.map((c) => `${c.jokers.length} ${c.label.toLowerCase()}${c.jokers.length > 1 ? "s" : ""}`);

    // diagnosis rules
    const rules: { fired: boolean; key: string; n?: number }[] = [];
    const allSameArch = jokers.length > 1 && (() => {
      const sets = jokers.map((j) => new Set(j.archetypes));
      const first = jokers[0].archetypes;
      return first.some((a) => sets.every((s) => s.has(a)));
    })();
    const allLate = jokers.length > 0 && jokers.every((j) => j.stage.length === 1 && j.stage[0] === "late");
    const avgSetupHigh = jokers.length > 0 && (jokers.reduce((s, j) => s + LEVEL_RANK[j.setupDifficulty], 0) / jokers.length) >= 1.5;
    const wellRounded = covered.length >= 4;

    rules.push({ fired: allSameArch, key: "ui.skel.rule_narrow" });
    rules.push({ fired: allLate, key: "ui.skel.rule_slow" });
    rules.push({ fired: avgSetupHigh, key: "ui.skel.rule_conditional" });
    rules.push({ fired: wellRounded, key: "ui.skel.rule_rounded", n: covered.length });

    let diagnosis = "ui.skel.dx_incomplete";
    if (jokers.length > 0) {
      if (allSameArch) diagnosis = "ui.skel.dx_too_narrow";
      else if (allLate) diagnosis = "ui.skel.dx_too_slow";
      else if (avgSetupHigh) diagnosis = "ui.skel.dx_too_conditional";
      else if (wellRounded) diagnosis = "ui.skel.dx_well_rounded";
      else diagnosis = "ui.skel.dx_developing";
    }

    // suggested next category = first missing
    const nextCat = missing[0] ?? null;
    const suggestions = nextCat
      ? JOKERS.filter((j) => nextCat.matches(j) && !ids.includes(j.id)).slice(0, 3)
      : [];

    return { covered, missing, have, rules: rules.filter((r) => r.fired), diagnosis, nextCat, suggestions };
  }, [jokers, ids]);

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      {/* selector */}
      <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
        <div>
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {t("ui.skel.your_selected")}
          </div>
          <JokerMultiCombobox values={ids} onChange={setIds} max={6} testId="combobox-skeleton" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {jokers.map((j) => (
            <span key={j.id} className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-1 text-xs">
              <button onClick={() => openJokerDetail(j.id)} className="text-foreground/90 hover:text-accent"><LName category="jokers" id={j.id} fallback={j.name} /></button>
              <button onClick={() => setIds(ids.filter((x) => x !== j.id))} aria-label={t("ui.skel.remove_aria")} data-testid={`skeleton-remove-${j.id}`}>
                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </button>
            </span>
          ))}
          {jokers.length === 0 && <p className="text-xs text-muted-foreground">{t("ui.skel.add_up_to")}</p>}
        </div>
      </div>

      {/* analysis */}
      <div className="space-y-5">
        {jokers.length === 0 ? (
          <div className="rounded-md border border-dashed border-border py-16 text-center">
            <p className="text-sm text-muted-foreground">{t("ui.skel.select_some")}</p>
          </div>
        ) : (
          <>
            {/* Diagnosis banner */}
            <div className="casino-card flex items-center gap-3 border-l-2 border-l-accent p-4" data-testid="text-diagnosis">
              <Info className="h-5 w-5 shrink-0 text-accent" />
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{t("ui.skel.diagnosis")}</div>
                <div className="font-display text-lg text-accent">{t(analysis.diagnosis)}</div>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="casino-card p-4">
                <SectionLabel>{t("ui.skel.what_you_have")}</SectionLabel>
                {analysis.have.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("ui.skel.no_pieces")}</p>
                ) : (
                  <ul className="space-y-1.5">
                    {analysis.covered.map((c) => (
                      <li key={c.key} className="flex items-center gap-2 text-sm text-foreground/85">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-[hsl(145_45%_55%)]" />
                        <span className="tabular">{c.jokers.length}× {c.label}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="casino-card p-4">
                <SectionLabel>{t("ui.skel.what_missing")}</SectionLabel>
                {analysis.missing.length === 0 ? (
                  <p className="text-sm text-[hsl(145_45%_55%)]">{t("ui.skel.nothing_all_covered")}</p>
                ) : (
                  <ul className="space-y-1.5">
                    {analysis.missing.map((c) => (
                      <li key={c.key} className="flex items-center gap-2 text-sm text-foreground/85">
                        <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
                        <span>{c.label}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Suggested next */}
            {analysis.nextCat && (
              <div className="casino-card p-4">
                <SectionLabel>{t("ui.skel.suggested_next")}</SectionLabel>
                <p className="mb-3 text-sm text-foreground/85">
                  {t("ui.skel.biggest_gap_pre")} <strong className="text-accent">{analysis.nextCat.label}</strong>{t("ui.skel.biggest_gap_post")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.suggestions.map((j) => (
                    <JokerChip key={j.id} id={j.id} onClick={openJokerDetail} testIdPrefix="chip-suggest" />
                  ))}
                  {analysis.suggestions.length === 0 && <span className="text-xs text-muted-foreground">{t("ui.skel.no_candidates")}</span>}
                </div>
              </div>
            )}

            {/* Why this analysis */}
            <Collapsible open={whyOpen} onOpenChange={setWhyOpen}>
              <CollapsibleTrigger className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground" data-testid="button-why-analysis">
                <Info className="h-3.5 w-3.5" />
                {t("ui.skel.why_pre")} {whyOpen ? t("ui.skel.why_hide") : t("ui.skel.why_show")} {t("ui.skel.why_post")}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 rounded-md border border-border bg-card/40 p-4">
                {analysis.rules.length === 0 ? (
                  <p className="text-xs text-muted-foreground">{t("ui.skel.no_rules")}</p>
                ) : (
                  <ul className="space-y-1.5">
                    {analysis.rules.map((r, i) => (
                      <li key={i} className="flex gap-2 text-xs text-foreground/80">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />{t(r.key, r.n != null ? { n: r.n } : undefined)}
                      </li>
                    ))}
                  </ul>
                )}
              </CollapsibleContent>
            </Collapsible>
          </>
        )}
      </div>
    </div>
  );
}
