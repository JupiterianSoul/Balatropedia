import { useState, useMemo } from "react";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { useApp } from "@/lib/appContext";
import {
  JOKERS, JOKER_MAP, ENGINE_CATEGORIES, ROLE_LABELS, jokerName, Joker,
} from "@/lib/helpers";
import { JokerMultiCombobox } from "@/components/JokerCombobox";
import { JokerChip, SectionLabel } from "@/components/primitives";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

const LEVEL_RANK = { low: 0, med: 1, high: 2 } as const;

export function SkeletonTab() {
  const { openJokerDetail } = useApp();
  const [ids, setIds] = useState<string[]>(["triboulet", "pareidolia", "sock_and_buskin"]);
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
    const rules: { fired: boolean; text: string }[] = [];
    const allSameArch = jokers.length > 1 && (() => {
      const sets = jokers.map((j) => new Set(j.archetypes));
      const first = jokers[0].archetypes;
      return first.some((a) => sets.every((s) => s.has(a)));
    })();
    const allLate = jokers.length > 0 && jokers.every((j) => j.stage.length === 1 && j.stage[0] === "late");
    const avgSetupHigh = jokers.length > 0 && (jokers.reduce((s, j) => s + LEVEL_RANK[j.setupDifficulty], 0) / jokers.length) >= 1.5;
    const wellRounded = covered.length >= 4;

    rules.push({ fired: allSameArch, text: "All selected Jokers share a single archetype → the build is too narrow." });
    rules.push({ fired: allLate, text: "Every selected Joker is late-stage only → the build is too slow to come online." });
    rules.push({ fired: avgSetupHigh, text: "Average setup difficulty is high → the build is too conditional." });
    rules.push({ fired: wellRounded, text: `Covers ${covered.length} engine categories (≥4) → the build is well-rounded.` });

    let diagnosis = "Incomplete — add more pieces to evaluate.";
    if (jokers.length > 0) {
      if (allSameArch) diagnosis = "Too narrow";
      else if (allLate) diagnosis = "Too slow";
      else if (avgSetupHigh) diagnosis = "Too conditional";
      else if (wellRounded) diagnosis = "Well-rounded";
      else diagnosis = "Developing — covers some engine categories but has gaps.";
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
            Your selected Jokers
          </div>
          <JokerMultiCombobox values={ids} onChange={setIds} max={6} testId="combobox-skeleton" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {jokers.map((j) => (
            <span key={j.id} className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-1 text-xs">
              <button onClick={() => openJokerDetail(j.id)} className="text-foreground/90 hover:text-accent">{j.name}</button>
              <button onClick={() => setIds(ids.filter((x) => x !== j.id))} aria-label="Remove" data-testid={`skeleton-remove-${j.id}`}>
                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </button>
            </span>
          ))}
          {jokers.length === 0 && <p className="text-xs text-muted-foreground">Add up to 6 Jokers to diagnose your run skeleton.</p>}
        </div>
      </div>

      {/* analysis */}
      <div className="space-y-5">
        {jokers.length === 0 ? (
          <div className="rounded-md border border-dashed border-border py-16 text-center">
            <p className="text-sm text-muted-foreground">Select some Jokers to see a transparent, rule-based skeleton analysis.</p>
          </div>
        ) : (
          <>
            {/* Diagnosis banner */}
            <div className="casino-card flex items-center gap-3 border-l-2 border-l-accent p-4" data-testid="text-diagnosis">
              <Info className="h-5 w-5 shrink-0 text-accent" />
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Diagnosis</div>
                <div className="font-display text-lg text-accent">{analysis.diagnosis}</div>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="casino-card p-4">
                <SectionLabel>What you have</SectionLabel>
                {analysis.have.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No recognized engine pieces yet.</p>
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
                <SectionLabel>What you're missing</SectionLabel>
                {analysis.missing.length === 0 ? (
                  <p className="text-sm text-[hsl(145_45%_55%)]">Nothing — all six engine categories are covered.</p>
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
                <SectionLabel>Suggested next Joker type</SectionLabel>
                <p className="mb-3 text-sm text-foreground/85">
                  Your biggest gap is <strong className="text-accent">{analysis.nextCat.label}</strong>. Consider one of these:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.suggestions.map((j) => (
                    <JokerChip key={j.id} id={j.id} onClick={openJokerDetail} testIdPrefix="chip-suggest" />
                  ))}
                  {analysis.suggestions.length === 0 && <span className="text-xs text-muted-foreground">No additional candidates outside your current selection.</span>}
                </div>
              </div>
            )}

            {/* Why this analysis */}
            <Collapsible open={whyOpen} onOpenChange={setWhyOpen}>
              <CollapsibleTrigger className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground" data-testid="button-why-analysis">
                <Info className="h-3.5 w-3.5" />
                Why this analysis? {whyOpen ? "Hide" : "Show"} the rules that fired
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 rounded-md border border-border bg-card/40 p-4">
                {analysis.rules.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No diagnostic rules fired — the build is still developing.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {analysis.rules.map((r, i) => (
                      <li key={i} className="flex gap-2 text-xs text-foreground/80">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />{r.text}
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
