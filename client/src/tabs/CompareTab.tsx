import { useState } from "react";
import { X } from "lucide-react";
import { useApp } from "@/lib/appContext";
import {
  JOKER_MAP, ARCHETYPE_LABELS,
  earlyGameValue, lateGameCeiling, reliability, jokerName, Joker,
} from "@/lib/helpers";
import { JokerMultiCombobox } from "@/components/JokerCombobox";
import { LevelDots } from "@/components/primitives";
import { useT, useLabels } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface Row {
  label: string;
  render: (j: Joker) => React.ReactNode;
}

export function CompareTab() {
  const { openJokerDetail } = useApp();
  const t = useT();
  const labels = useLabels();
  const [ids, setIds] = useState<string[]>(["triboulet", "joker"]);
  const jokers = ids.map((id) => JOKER_MAP[id]).filter(Boolean) as Joker[];

  const rows: Row[] = [
    { label: t("ui.tabs.compare_role"), render: (j) => <span className="text-sm">{labels.role[j.mainRole]}{j.secondaryRole ? ` / ${labels.role[j.secondaryRole]}` : ""}</span> },
    { label: t("ui.tabs.compare_scaling"), render: (j) => <span className="text-sm">{labels.scaling[j.scaling]}</span> },
    { label: t("ui.tabs.compare_setup_difficulty"), render: (j) => <LevelDots level={j.setupDifficulty} /> },
    { label: t("ui.tabs.compare_archetype_fit"), render: (j) => <span className="text-xs text-muted-foreground">{j.archetypes.map((a) => ARCHETYPE_LABELS[a] ?? a).join(", ")}</span> },
    { label: t("ui.tabs.compare_early_value"), render: (j) => <LevelDots level={earlyGameValue(j)} /> },
    { label: t("ui.tabs.compare_late_ceiling"), render: (j) => <LevelDots level={lateGameCeiling(j)} /> },
    { label: t("ui.tabs.compare_reliability"), render: (j) => <LevelDots level={reliability(j)} /> },
    {
      label: t("ui.tabs.compare_best_partners"), render: (j) => (
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
          {j.partners.slice(0, 3).map((p, idx) => (
            <span key={p} className="text-xs">
              <button onClick={() => openJokerDetail(p)} className="text-accent hover:underline" data-testid={`compare-partner-${j.id}-${p}`}>
                {jokerName(p)}
              </button>
              {idx < Math.min(j.partners.length, 3) - 1 && <span className="text-muted-foreground">,</span>}
            </span>
          ))}
          {j.partners.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
        </div>
      )
    },
    {
      label: t("ui.tabs.compare_main_risks"), render: (j) => (
        <div className="text-xs text-[hsl(0_55%_72%)]">
          {labels.riskPrefix} {labels.level[j.risk]}
          {j.antiSynergies.length > 0 && (
            <span className="text-muted-foreground">{t("ui.tabs.compare_conflicts_with", { names: j.antiSynergies.map(jokerName).join(", ") })}</span>
          )}
        </div>
      )
    },
  ];

  return (
    <div className="space-y-5">
      <div className="max-w-sm">
        <JokerMultiCombobox values={ids} onChange={setIds} max={4} testId="combobox-compare" />
        <p className="mt-1.5 text-xs text-muted-foreground">{t("ui.tabs.compare_select_hint")}</p>
      </div>

      {jokers.length < 2 ? (
        <div className="rounded-md border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted-foreground">{t("ui.tabs.compare_add_two")}</p>
        </div>
      ) : (
        <>
          {/* Desktop columnar */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="w-44 border-b border-border p-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground" />
                  {jokers.map((j) => (
                    <th key={j.id} className="border-b border-border p-3 text-left align-top">
                      <div className="flex items-start justify-between gap-2">
                        <button onClick={() => openJokerDetail(j.id)} className="font-pixel text-base text-accent hover:underline" data-testid={`compare-head-${j.id}`}>
                          {j.name}
                        </button>
                        <button onClick={() => setIds(ids.filter((x) => x !== j.id))} className="text-muted-foreground hover:text-foreground" aria-label={t("ui.common.remove")} data-testid={`compare-remove-${j.id}`}>
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="mt-1 text-xs font-normal text-foreground/70 small-caps">{j.summary}</p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, ri) => (
                  <tr key={r.label} className={cn(ri % 2 === 1 && "bg-card/40")}>
                    <td className="border-b border-border p-3 text-xs font-medium text-muted-foreground">{r.label}</td>
                    {jokers.map((j) => (
                      <td key={j.id} className="border-b border-border p-3 align-top">{r.render(j)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile stacked */}
          <div className="space-y-4 md:hidden">
            {jokers.map((j) => (
              <div key={j.id} className="casino-card p-4">
                <div className="flex items-start justify-between">
                  <button onClick={() => openJokerDetail(j.id)} className="font-pixel text-base text-accent">{j.name}</button>
                  <button onClick={() => setIds(ids.filter((x) => x !== j.id))} aria-label={t("ui.common.remove")} data-testid={`compare-remove-m-${j.id}`}><X className="h-4 w-4 text-muted-foreground" /></button>
                </div>
                <dl className="mt-3 space-y-2">
                  {rows.map((r) => (
                    <div key={r.label} className="flex items-start justify-between gap-3 border-t border-border pt-2">
                      <dt className="text-xs font-medium text-muted-foreground">{r.label}</dt>
                      <dd className="text-right">{r.render(j)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
