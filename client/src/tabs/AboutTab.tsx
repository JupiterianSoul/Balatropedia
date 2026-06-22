import { Github, ExternalLink, Heart, BookOpen, AlertTriangle, FlaskConical } from "lucide-react";
import { SectionLabel } from "@/components/primitives";
import { useT } from "@/lib/i18n";

/**
 * About tab — project info, source attributions, and an honest accuracy disclaimer.
 *
 * Every strategy claim in Synergies / Combos / Tips is cross-referenced against
 * community-trusted sources (Balatro Fandom Wiki, dood.gg, Balatro HQ, Mobalytics,
 * Two Average Gamers). Per-entry citations render inline via <SourceCitations />.
 * This tab consolidates the full source list + project metadata.
 */

interface SourceLink {
  name: string;
  url: string;
  note: string;
}

const SOURCES: SourceLink[] = [
  {
    name: "Balatro Fandom Wiki",
    url: "https://balatrogame.fandom.com/wiki/Jokers",
    note: "Joker effects, base values, retrigger rules (CC-BY-SA).",
  },
  {
    name: "dood.gg — Joker Synergy Guide",
    url: "https://dood.gg/en/balatro/guides/joker-synergy/",
    note: "Community-validated joker pairings (Baron+Mime, Hologram+DNA, etc.).",
  },
  {
    name: "dood.gg — Deck Strategies",
    url: "https://dood.gg/en/balatro/guides/deck-strategies/",
    note: "Per-deck strategy notes (Checkered, Abandoned, Plasma).",
  },
  {
    name: "dood.gg — Poker Hands",
    url: "https://dood.gg/en/balatro/guides/poker-hands/",
    note: "Base chip/mult tables and hand frequency tiers.",
  },
  {
    name: "Balatro HQ — Advanced Strategies",
    url: "https://www.balatrohq.com/guides/advanced-strategies/",
    note: "Blueprint/Brainstorm scaling, Mime+Stencil, joker positioning rules.",
  },
  {
    name: "Mobalytics — Joker Tier List",
    url: "https://mobalytics.gg/blog/tier-lists/best-balatro-jokers/",
    note: "Tier rankings, Brainstorm/Seltzer/Hack analysis.",
  },
  {
    name: "Two Average Gamers — Strategy Guide",
    url: "https://www.twoaveragegamers.com/balatro-strategy-guide-the-joker-combos-that-actually-win-runs/",
    note: "Win-rate-validated combos (Cavendish stacking, Mr. Bones insurance).",
  },
  {
    name: "TheGamer — Joker Tier List",
    url: "https://www.thegamer.com/balatro-joker-tier-list/",
    note: "Editorial tier list cross-reference.",
  },
];

export function AboutTab() {
  const t = useT();

  return (
    <div className="mx-auto max-w-3xl space-y-6" data-testid="tab-about">
      <header>
        <h2 className="font-pixel text-2xl text-accent">{t("ui.about.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("ui.about.subtitle")}</p>
      </header>

      {/* What this is */}
      <section className="casino-card p-4">
        <div className="mb-3 flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5 text-accent" />
          <SectionLabel>{t("ui.about.what_title")}</SectionLabel>
        </div>
        <p className="text-sm leading-relaxed text-foreground/90">
          {t("ui.about.what_body")}
        </p>
      </section>

      {/* Accuracy / sources */}
      <section className="casino-card p-4">
        <div className="mb-3 flex items-center gap-1.5">
          <FlaskConical className="h-3.5 w-3.5 text-accent" />
          <SectionLabel>{t("ui.about.accuracy_title")}</SectionLabel>
        </div>
        <p className="mb-3 text-sm leading-relaxed text-foreground/90">
          {t("ui.about.accuracy_body")}
        </p>
        <ul className="space-y-2 text-sm">
          {SOURCES.map((s) => (
            <li key={s.url} className="rounded-md border border-border bg-card/50 px-3 py-2">
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-medium text-accent hover:underline"
                data-testid={`link-source-${s.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              >
                {s.name}
                <ExternalLink className="h-3 w-3 opacity-60" />
              </a>
              <p className="mt-0.5 text-xs text-muted-foreground">{s.note}</p>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          {t("ui.about.fandom_attribution")}
        </p>
      </section>

      {/* Disclaimer */}
      <section className="casino-card p-4">
        <div className="mb-3 flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 text-[hsl(45_85%_60%)]" />
          <SectionLabel>{t("ui.about.disclaimer_title")}</SectionLabel>
        </div>
        <p className="text-sm leading-relaxed text-foreground/90">
          {t("ui.about.disclaimer_body")}
        </p>
        <a
          href="https://github.com/JupiterianSoul/Balatropedia/issues/new"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
          data-testid="link-submit-correction"
        >
          <Github className="h-3.5 w-3.5" />
          {t("ui.about.submit_correction")}
          <ExternalLink className="h-3 w-3 opacity-60" />
        </a>
      </section>

      {/* Credits */}
      <section className="casino-card p-4">
        <div className="mb-3 flex items-center gap-1.5">
          <Heart className="h-3.5 w-3.5 text-[hsl(0_70%_60%)]" />
          <SectionLabel>{t("ui.about.credits_title")}</SectionLabel>
        </div>
        <ul className="space-y-1.5 text-sm text-foreground/90">
          <li>
            <span className="text-muted-foreground">{t("ui.about.credit_game")} </span>
            <a
              href="https://www.playbalatro.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              LocalThunk & Playstack
              <ExternalLink className="ml-1 inline h-3 w-3 opacity-60" />
            </a>
          </li>
          <li>
            <span className="text-muted-foreground">{t("ui.about.credit_font")} </span>
            <a
              href="https://managore.itch.io/m6x11"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              Daniel Linssen — m6x11plus
              <ExternalLink className="ml-1 inline h-3 w-3 opacity-60" />
            </a>
          </li>
          <li>
            <span className="text-muted-foreground">{t("ui.about.credit_stack")} </span>
            <span>React · Vite · Tailwind · shadcn/ui · Drizzle ORM</span>
          </li>
        </ul>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href="https://github.com/JupiterianSoul/Balatropedia"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/50 px-3 py-1.5 text-sm font-medium text-accent hover:bg-card"
            data-testid="link-about-github"
          >
            <Github className="h-3.5 w-3.5" />
            {t("ui.about.view_source")}
            <ExternalLink className="h-3 w-3 opacity-60" />
          </a>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          v{import.meta.env.VITE_APP_VERSION ?? "0.1"} · Balatropedia ·{" "}
          {t("ui.about.fanmade")}
        </p>
      </section>
    </div>
  );
}
