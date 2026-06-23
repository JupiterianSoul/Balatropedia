import { useT } from "@/lib/i18n";
import { Sparkles, Wrench, ListTree, Heart, Trophy, Compass, type LucideIcon } from "lucide-react";

type EntryKind = "feature" | "data" | "fix" | "polish" | "community" | "nav";

interface Entry {
  version: string;
  kind: EntryKind;
  titleKey: string;
  bullets: string[];
}

// Reverse-chronological, newest first. Dates intentionally omitted.
const ENTRIES: Entry[] = [
  {
    version: "v1.3",
    kind: "feature",
    titleKey: "ui.whatsnew.v1_3.title",
    bullets: [
      "ui.whatsnew.v1_3.home_redesign",
      "ui.whatsnew.v1_3.auto_signin",
      "ui.whatsnew.v1_3.particles",
      "ui.whatsnew.v1_3.easter_eggs",
      "ui.whatsnew.v1_3.no_emdash",
      "ui.whatsnew.v1_3.whatsnew_dates",
    ],
  },
  {
    version: "v1.2",
    kind: "nav",
    titleKey: "ui.whatsnew.v1_2.title",
    bullets: [
      "ui.whatsnew.v1_2.home_tab",
      "ui.whatsnew.v1_2.run_group",
      "ui.whatsnew.v1_2.jokers_in_game",
      "ui.whatsnew.v1_2.tier_variants",
      "ui.whatsnew.v1_2.tier_disclaimer",
      "ui.whatsnew.v1_2.tier_blank_row",
    ],
  },
  {
    version: "v1.1",
    kind: "feature",
    titleKey: "ui.whatsnew.v1_1.title",
    bullets: [
      "ui.whatsnew.v1_1.tierlist",
      "ui.whatsnew.v1_1.runchallenge",
      "ui.whatsnew.v1_1.searcheffects",
      "ui.whatsnew.v1_1.colorcoding",
      "ui.whatsnew.v1_1.mobileback",
      "ui.whatsnew.v1_1.mobilesearch",
      "ui.whatsnew.v1_1.og",
    ],
  },
  {
    version: "v1.0.3",
    kind: "data",
    titleKey: "ui.whatsnew.v1_0_3.title",
    bullets: [
      "ui.whatsnew.v1_0_3.syn60",
      "ui.whatsnew.v1_0_3.combos16",
      "ui.whatsnew.v1_0_3.arch7",
      "ui.whatsnew.v1_0_3.ranking",
      "ui.whatsnew.v1_0_3.backfill",
    ],
  },
  {
    version: "v1.0.2",
    kind: "community",
    titleKey: "ui.whatsnew.v1_0_2.title",
    bullets: [
      "ui.whatsnew.v1_0_2.reddit",
      "ui.whatsnew.v1_0_2.kofi",
      "ui.whatsnew.v1_0_2.hardening",
    ],
  },
  {
    version: "v1.0.1",
    kind: "polish",
    titleKey: "ui.whatsnew.v1_0_1.title",
    bullets: [
      "ui.whatsnew.v1_0_1.sounds",
      "ui.whatsnew.v1_0_1.shop",
      "ui.whatsnew.v1_0_1.comments",
    ],
  },
];

const KIND_ICON: Record<EntryKind, LucideIcon> = {
  feature: Sparkles,
  data: ListTree,
  fix: Wrench,
  polish: Trophy,
  community: Heart,
  nav: Compass,
};

const KIND_TONE: Record<EntryKind, string> = {
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
