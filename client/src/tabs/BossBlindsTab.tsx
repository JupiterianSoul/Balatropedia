import { Skull, ShieldCheck } from "lucide-react";
import { JokerSprite } from "@/components/JokerSprite";
import { useApp } from "@/lib/appContext";
import { JOKER_MAP } from "@/lib/helpers";
import { BOSSES } from "@/data/bosses";
import { LName, LText } from "@/components/Localized";
import { useT } from "@/lib/i18n";

export function BossBlindsTab() {
  const { openJokerDetail } = useApp();
  const t = useT();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl text-accent">{t("ui.boss.title")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("ui.boss.subtitle")}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {BOSSES.map((b) => (
          <div key={b.id} className="casino-card flex flex-col p-4" data-testid={`boss-card-${b.id}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Skull className="h-4 w-4 text-[hsl(0_55%_64%)]" />
                <h3 className="font-display text-base text-accent"><LName category="blinds" id={b.id} fallback={b.name} /></h3>
              </div>
              <span className="shrink-0 rounded-sm border border-border bg-card px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                {b.anteRange}
              </span>
            </div>

            <LText category="blinds" id={b.id} fallback={b.effect} as="p" className="mt-2.5 text-sm leading-relaxed text-foreground/85" />

            <div className="mt-3">
              <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[hsl(145_45%_60%)]">
                <ShieldCheck className="h-3.5 w-3.5" /> {t("ui.boss.counter_strategy")}
              </div>
              <ul className="space-y-1.5">
                {b.counters.map((c, i) => (
                  <li key={i} className="flex gap-2 text-xs leading-relaxed text-foreground/80">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[hsl(145_45%_55%)]" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>

            {b.counterJokers.length > 0 && (
              <div className="mt-3 border-t border-border pt-3">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-accent/80">
                  {t("ui.boss.jokers_help")}
                </div>
                <div className="flex flex-wrap gap-2">
                  {b.counterJokers.map((id) => {
                    const j = JOKER_MAP[id];
                    if (!j) return null;
                    return (
                      <button
                        key={id}
                        onClick={() => openJokerDetail(id)}
                        className="flex items-center gap-1.5 rounded-full border border-border bg-card py-1 pl-1 pr-2.5 transition-colors hover:border-accent/50"
                        data-testid={`boss-joker-${b.id}-${id}`}
                      >
                        <JokerSprite jokerId={id} name={j.name} size={22} className="h-[22px] w-[22px] rounded-full" />
                        <span className="text-xs text-foreground/90"><LName category="jokers" id={j.id} fallback={j.name} /></span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

