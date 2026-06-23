import { useT } from "@/lib/i18n";
import { Sparkles, Wrench, ListTree, Heart, Trophy, Compass, type LucideIcon } from "lucide-react";
import { CHANGELOG, type ChangelogKind } from "@/data/changelog";

const ENTRIES = CHANGELOG;

const KIND_ICON: Record<ChangelogKind, LucideIcon> = {
  feature: Sparkles,
  data: ListTree,
  fix: Wrench,
  polish: Trophy,
  community: Heart,
  nav: Compass,
};

const KIND_TONE: Record<ChangelogKind, string> = {
  feature: "text-accent",
  data: "text-[hsl(145_45%_62%)]",
  fix: "text-[hsl(196_50%_65%)]",
  polish: "text-[hsl(45_70%_60%)]",
  community: "text-[hsl(0_60%_70%)]",
  nav: "text-[hsl(270_55%_72%)]",
};

export function WhatsNewTab() {
  const t = useT();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2">
        <h2 className="font-display text-2xl font-bold text-foreground">
          {t("ui.whatsnew.heading")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("ui.whatsnew.subtitle")}
        </p>
      </header>

      <div className="space-y-5">
        {ENTRIES.map((e) => {
          const Icon = KIND_ICON[e.kind];
          return (
            <article
              key={e.version}
              className="casino-card p-5"
              data-testid={`whatsnew-${e.version}`}
            >
              <div className="flex flex-wrap items-center gap-3 border-b border-border pb-3">
                <Icon className={`h-5 w-5 ${KIND_TONE[e.kind]}`} strokeWidth={2.5} />
                <h3 className="font-display text-lg font-semibold text-accent">
                  {t(e.titleKey)}
                </h3>
                <span className="ml-auto rounded-sm border border-border px-1.5 py-0.5 font-mono text-xs tabular text-muted-foreground">
                  {e.version}
                </span>
              </div>
              <ul className="mt-3 space-y-1.5">
                {e.bullets.map((b) => (
                  <li
                    key={b}
                    className="flex gap-2 text-sm leading-relaxed text-foreground/85"
                  >
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
                    <span>{t(b)}</span>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>

      <p className="border-t border-border pt-4 text-center text-xs italic text-muted-foreground">
        {t("ui.whatsnew.footer")}
      </p>
    </div>
  );
}
