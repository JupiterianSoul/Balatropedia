import { useState, useMemo } from "react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/lib/appContext";
import { COMBOS, ARCHETYPE_LABELS, Archetype } from "@/lib/helpers";
import { JokerChip, StarToggle, SectionLabel } from "@/components/primitives";
import { useT } from "@/lib/i18n";

export function CombosTab() {
  const { openJokerDetail, isFavoriteCombo, toggleFavoriteCombo } = useApp();
  const t = useT();
  const [arch, setArch] = useState<string>("all");

  const archetypes = useMemo(
    () => Array.from(new Set(COMBOS.map((c) => c.archetype))),
    [],
  );
  const filtered = arch === "all" ? COMBOS : COMBOS.filter((c) => c.archetype === arch);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground tabular">{t("ui.combos.count", { n: filtered.length })}</p>
        <Select value={arch} onValueChange={setArch}>
          <SelectTrigger className="w-56 bg-card" data-testid="select-combo-archetype">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("ui.combos.all_archetypes")}</SelectItem>
            {archetypes.map((a) => (
              <SelectItem key={a} value={a}>{ARCHETYPE_LABELS[a as Archetype] ?? a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {filtered.map((c) => (
          <div key={c.id} className="casino-card flex flex-col p-5" data-testid={`card-combo-${c.id}`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-display text-lg font-semibold text-accent">{c.title}</h3>
                <span className="mt-1 inline-block rounded-full border border-[hsl(145_35%_40%)]/40 bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-[hsl(145_45%_62%)]">
                  {ARCHETYPE_LABELS[c.archetype] ?? c.archetype}
                </span>
              </div>
              <StarToggle
                active={isFavoriteCombo(c.id)}
                onToggle={() => toggleFavoriteCombo(c.id)}
                testId={`button-favorite-combo-${c.id}`}
                size={18}
              />
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <SectionLabel>{t("ui.combos.core_pieces")}</SectionLabel>
                <div className="flex flex-wrap gap-1.5">
                  {c.core.map((id) => <JokerChip key={id} id={id} onClick={openJokerDetail} testIdPrefix={`chip-core-${c.id}`} />)}
                </div>
              </div>
              {c.optional.length > 0 && (
                <div>
                  <SectionLabel>{t("ui.combos.optional_supports")}</SectionLabel>
                  <div className="flex flex-wrap gap-1.5">
                    {c.optional.map((id) => <JokerChip key={id} id={id} onClick={openJokerDetail} testIdPrefix={`chip-opt-${c.id}`} />)}
                  </div>
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <SectionLabel>{t("ui.combos.conditions")}</SectionLabel>
                  <ul className="space-y-1">
                    {c.conditions.map((x, i) => (
                      <li key={i} className="flex gap-2 text-xs text-foreground/80">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />{x}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <SectionLabel>{t("ui.combos.risks")}</SectionLabel>
                  <ul className="space-y-1">
                    {c.risks.map((x, i) => (
                      <li key={i} className="flex gap-2 text-xs text-[hsl(0_55%_72%)]">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-destructive" />{x}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div>
                <SectionLabel>{t("ui.combos.why_works")}</SectionLabel>
                <p className="text-xs leading-relaxed text-foreground/85">{c.why}</p>
              </div>
              <div className="border-t border-border pt-3">
                <SectionLabel>{t("ui.combos.pivot_out")}</SectionLabel>
                <p className="text-xs italic leading-relaxed text-muted-foreground">{c.pivotOut}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
