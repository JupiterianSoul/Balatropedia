import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen, Sparkles, Layers3, Tags, GitCompare, Grid3x3,
  CircleDollarSign, Spade, Skull, Ticket, Wand2, Settings as SettingsIcon, Map, BookMarked, Star, FlaskConical,
} from "lucide-react";
import { useT } from "@/lib/i18n";

interface HelpSection {
  key: string;
  icon: React.ReactNode;
}

const SECTIONS: HelpSection[] = [
  { key: "overview",    icon: <BookOpen className="h-3.5 w-3.5" /> },
  { key: "library",     icon: <Layers3 className="h-3.5 w-3.5" /> },
  { key: "myrun",       icon: <FlaskConical className="h-3.5 w-3.5" /> },
  { key: "synergies",   icon: <Sparkles className="h-3.5 w-3.5" /> },
  { key: "combos",      icon: <Wand2 className="h-3.5 w-3.5" /> },
  { key: "archetypes",  icon: <Tags className="h-3.5 w-3.5" /> },
  { key: "compare",     icon: <GitCompare className="h-3.5 w-3.5" /> },
  { key: "skeleton",    icon: <Grid3x3 className="h-3.5 w-3.5" /> },
  { key: "decks",       icon: <Spade className="h-3.5 w-3.5" /> },
  { key: "stakes",      icon: <CircleDollarSign className="h-3.5 w-3.5" /> },
  { key: "bosses",      icon: <Skull className="h-3.5 w-3.5" /> },
  { key: "vouchers",    icon: <Ticket className="h-3.5 w-3.5" /> },
  { key: "consumables", icon: <Wand2 className="h-3.5 w-3.5" /> },
  { key: "modifiers",   icon: <SettingsIcon className="h-3.5 w-3.5" /> },
  { key: "heatmap",     icon: <Map className="h-3.5 w-3.5" /> },
  { key: "glossary",    icon: <BookMarked className="h-3.5 w-3.5" /> },
  { key: "favorites",   icon: <Star className="h-3.5 w-3.5" /> },
];

export function HelpTab() {
  const t = useT();
  const [active, setActive] = useState(SECTIONS[0].key);

  return (
    <div className="mx-auto max-w-5xl space-y-5" data-testid="tab-help">
      <header>
        <h2 className="font-pixel text-2xl text-accent">{t("ui.help.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("ui.help.subtitle")}</p>
      </header>

      <Tabs value={active} onValueChange={setActive} orientation="vertical" className="grid gap-4 md:grid-cols-[200px_1fr]">
        {}
        <TabsList
          className="flex h-auto w-full flex-row flex-wrap justify-start gap-1 bg-transparent p-0 md:flex-col md:flex-nowrap md:items-stretch"
          data-testid="help-subnav"
        >
          {SECTIONS.map((s) => (
            <TabsTrigger
              key={s.key}
              value={s.key}
              className="inline-flex w-auto items-center justify-start gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs data-[state=active]:border-accent data-[state=active]:bg-accent/15 data-[state=active]:text-accent md:w-full"
              data-testid={`help-tab-${s.key}`}
            >
              {s.icon}
              <span className="truncate">{t(`ui.help.${s.key}.title`)}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {}
        <div className="min-w-0">
          {SECTIONS.map((s) => (
            <TabsContent key={s.key} value={s.key} className="mt-0 space-y-3">
              <section className="casino-card p-5">
                <h3 className="font-pixel text-lg text-accent">{t(`ui.help.${s.key}.title`)}</h3>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground/85">
                  {t(`ui.help.${s.key}.body`)}
                </p>
                {}
                <div className="mt-3 rounded-md border border-accent/30 bg-accent/[0.06] px-3 py-2 text-xs text-foreground/80">
                  <span className="font-pixel text-[10px] uppercase tracking-wide text-accent">{t("ui.help.tip_label")}</span>
                  <p className="mt-1 whitespace-pre-line">{t(`ui.help.${s.key}.tip`)}</p>
                </div>
              </section>
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
}

