import { AlertTriangle, TrendingUp } from "lucide-react";
import { STAKES } from "@/data/phase3/stakes";
import { Phase3Sprite } from "@/components/Phase3Sprite";
import { DifficultyBadge } from "@/components/phase3Primitives";
import { SectionLabel } from "@/components/primitives";
import { TabIntro } from "@/components/TabIntro";
import { useOpenDetail } from "@/lib/detailContext";
import { LName } from "@/components/Localized";
import { useT } from "@/lib/i18n";

/**
 * Stakes tab. Modifiers are always shown cumulatively (the toggle was removed
 * per Julie's request, since every higher stake inherits the lower stake's
 * modifiers in the actual game).
 */
export function StakesTab() {
  const openDetail = useOpenDetail();
  const t = useT();

  return (
    <div className="space-y-5">
      <TabIntro Icon={TrendingUp} title={t("ui.stakes.title")}>
        {t("ui.stakes.subtitle")}
      </TabIntro>

      <ol className="space-y-3">
        {STAKES.map((s, idx) => {
          const inherited = STAKES
            .slice(0, idx)
            .flatMap((p) =>
              p.modifiers.map((m) => ({ from: p.name, color: p.color, text: m })),
            );
          return (
            <li
              key={s.id}
              className="casino-card flex flex-col gap-3 p-4 sm:flex-row sm:items-start"
              style={{ borderLeftWidth: 4, borderLeftColor: s.color }}
              data-testid={`card-stake-${s.id}`}
            >
              <button
                type="button"
                onClick={() => openDetail("stake", s.id)}
                data-testid={`button-stake-detail-${s.id}`}
                className="flex items-center gap-3 text-left sm:w-44 sm:shrink-0 sm:flex-col sm:items-start"
              >
                <Phase3Sprite
                  category="stakes"
                  id={s.id}
                  name={s.name}
                  size={56}
                  accent={s.color}
                  className="h-14 w-14"
                />
                <div>
                  <h3
                    className="font-display text-base"
                    style={{
                      color: s.color === "#ffffff" ? "hsl(var(--foreground))" : s.color,
                    }}
                  >
                    <LName category="stakes" id={s.id} fallback={s.name} />
                  </h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[11px] uppercase tracking-wide text-muted-foreground tabular">
                      {t("ui.stakes.tier")} {idx + 1}
                    </span>
                    <DifficultyBadge difficulty={s.difficulty} />
                  </div>
                </div>
              </button>

              <div className="min-w-0 flex-1 space-y-3">
                <div>
                  <SectionLabel>{t("ui.stakes.modifiers")}</SectionLabel>
                  <ul className="space-y-1">
                    {s.modifiers.map((m, i) => (
                      <li
                        key={i}
                        className="flex gap-2 text-sm leading-relaxed text-foreground/85"
                      >
                        <span
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ background: s.color }}
                        />
                        {m}
                      </li>
                    ))}
                  </ul>
                  {inherited.length > 0 && (
                    <ul
                      className="mt-2 space-y-1 border-t border-border/60 pt-2"
                      data-testid={`stake-inherited-${s.id}`}
                    >
                      <li className="text-[10px] uppercase tracking-wide text-muted-foreground/70">
                        {t("ui.stakes.inherited")}
                      </li>
                      {inherited.map((m, i) => (
                        <li
                          key={i}
                          className="flex gap-2 text-xs leading-relaxed text-foreground/60"
                        >
                          <span
                            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full opacity-60"
                            style={{ background: m.color }}
                          />
                          <span>
                            <span className="text-muted-foreground/80">{m.from}:</span>{" "}
                            {m.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div
                  className="flex gap-2 rounded-md border p-2.5"
                  style={{ borderColor: `${s.color}55`, background: `${s.color}10` }}
                >
                  <AlertTriangle
                    className="mt-0.5 h-4 w-4 shrink-0"
                    style={{ color: s.color }}
                  />
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("ui.stakes.watch_out")}
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-foreground/80">
                      {s.watchOut}
                    </p>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
