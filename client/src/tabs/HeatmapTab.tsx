import { useMemo, useState } from "react";
import { ArrowDownUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JokerCombobox } from "@/components/JokerCombobox";
import { JokerSprite } from "@/components/JokerSprite";
import { useApp } from "@/lib/appContext";
import { JOKER_MAP, heatmapFor } from "@/lib/helpers";
import { LName } from "@/components/Localized";
import { useT } from "@/lib/i18n";

// Color scale: dark oxblood for negative, charcoal mid (neutral), muted gold for positive.
function chipStyle(score: number): React.CSSProperties {
  if (score < 0) {
    // oxblood — secondary hue 350
    return { backgroundColor: "hsl(350 45% 26%)", color: "hsl(350 60% 82%)", borderColor: "hsl(350 45% 40%)" };
  }
  if (score === 0) {
    return { backgroundColor: "hsl(150 8% 16%)", color: "hsl(45 12% 68%)", borderColor: "hsl(150 10% 24%)" };
  }
  // positive — muted gold, intensity scales with score (1..6)
  const t = Math.min(score / 6, 1);
  const light = 24 + t * 26; // 24% -> 50%
  return {
    backgroundColor: `hsl(42 55% ${light}%)`,
    color: score >= 3 ? "hsl(150 16% 8%)" : "hsl(42 55% 80%)",
    borderColor: "hsl(42 55% 55%)",
  };
}

export function HeatmapTab() {
  const { openJokerDetail } = useApp();
  const t = useT();
  const [selected, setSelected] = useState<string | null>("triboulet");
  const [negFirst, setNegFirst] = useState(false);

  const entries = useMemo(() => {
    if (!selected) return [];
    const list = heatmapFor(selected);
    list.sort((a, b) => (negFirst ? a.score - b.score : b.score - a.score) || a.name.localeCompare(b.name));
    return list;
  }, [selected, negFirst]);

  const selJoker = selected ? JOKER_MAP[selected] : null;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-pixel text-xl text-accent">{t("ui.tabs.heatmap_title")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("ui.tabs.heatmap_subtitle")}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1 sm:min-w-[240px] sm:max-w-sm">
          <JokerCombobox value={selected} onChange={setSelected} placeholder={t("ui.tabs.heatmap_pick")} testId="combobox-heatmap" />
        </div>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => setNegFirst((v) => !v)}
          data-testid="button-toggle-negatives"
        >
          <ArrowDownUp className="h-4 w-4" />
          {negFirst ? t("ui.tabs.heatmap_neg_first") : t("ui.tabs.heatmap_pos_first")}
        </Button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        <span>{t("ui.tabs.heatmap_scale")}</span>
        <span className="rounded-sm border px-1.5 py-0.5" style={chipStyle(-3)}>{t("ui.tabs.heatmap_clash")}</span>
        <span className="rounded-sm border px-1.5 py-0.5" style={chipStyle(0)}>{t("ui.tabs.heatmap_neutral")}</span>
        <span className="rounded-sm border px-1.5 py-0.5" style={chipStyle(1)}>+1</span>
        <span className="rounded-sm border px-1.5 py-0.5" style={chipStyle(3)}>+3</span>
        <span className="rounded-sm border px-1.5 py-0.5" style={chipStyle(6)}>+6</span>
      </div>

      {!selJoker ? (
        <p className="text-sm text-muted-foreground">{t("ui.tabs.heatmap_empty")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3" data-testid="heatmap-grid">
          {entries.map((e) => (
            <button
              key={e.id}
              onClick={() => openJokerDetail(e.id)}
              className="casino-card casino-card-interactive flex items-center gap-2.5 p-2 text-left"
              data-testid={`heatmap-cell-${e.id}`}
            >
              <JokerSprite jokerId={e.id} name={e.name} size={36} className="h-9 w-9" />
              <span className="min-w-0 flex-1 truncate text-sm text-foreground/90"><LName category="jokers" id={e.id} fallback={e.name} /></span>
              <span
                className="shrink-0 rounded-sm border px-1.5 py-0.5 text-[11px] font-semibold tabular"
                style={chipStyle(e.score)}
              >
                {e.score > 0 ? `+${e.score}` : e.score}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
