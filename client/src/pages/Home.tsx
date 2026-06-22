import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useApp } from "@/lib/appContext";
import { JokerDetailSheet } from "@/components/JokerDetailSheet";
import { LibraryTab } from "@/tabs/LibraryTab";
import { SynergyTab } from "@/tabs/SynergyTab";
import { CombosTab } from "@/tabs/CombosTab";
import { ArchetypesTab } from "@/tabs/ArchetypesTab";
import { CompareTab } from "@/tabs/CompareTab";
import { SkeletonTab } from "@/tabs/SkeletonTab";
import { FavoritesTab } from "@/tabs/FavoritesTab";
import { GlossaryTab } from "@/tabs/GlossaryTab";

const TABS = [
  { value: "library", label: "Library" },
  { value: "synergies", label: "Synergies" },
  { value: "combos", label: "Combos" },
  { value: "archetypes", label: "Archetypes" },
  { value: "compare", label: "Compare" },
  { value: "skeleton", label: "Skeleton" },
  { value: "favorites", label: "Favorites" },
  { value: "glossary", label: "Glossary" },
];

export default function Home() {
  const { favoriteJokers, favoriteCombos } = useApp();
  const [tab, setTab] = useState("library");
  const favCount = favoriteJokers.size + favoriteCombos.size;

  return (
    <div className="min-h-screen">
      <Tabs value={tab} onValueChange={setTab} className="flex min-h-screen flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:gap-6">
            {/* logo + title */}
            <div className="flex items-center gap-3">
              <Logo className="h-9 w-9 shrink-0" />
              <div className="leading-tight">
                <h1 className="font-display text-lg font-semibold tracking-tight text-foreground">
                  Joker Synergy <span className="text-accent">Explorer</span>
                </h1>
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  A Balatro build companion
                </p>
              </div>
            </div>

            {/* centered tab bar */}
            <div className="-mx-4 flex-1 overflow-x-auto px-4 lg:mx-0 lg:flex lg:justify-center lg:px-0">
              <TabsList className="h-auto w-max gap-0.5 bg-card/60 p-1" data-testid="tabs-main">
                {TABS.map((t) => (
                  <TabsTrigger
                    key={t.value}
                    value={t.value}
                    data-testid={`tab-${t.value}`}
                    className="whitespace-nowrap px-3 py-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* favorites count */}
            <button
              onClick={() => setTab("favorites")}
              className="hidden items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground lg:flex"
              data-testid="badge-favorites-count"
            >
              <Star className={favCount > 0 ? "h-4 w-4 fill-accent text-accent" : "h-4 w-4"} />
              <span className="tabular">{favCount}</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
          <div className="mount-fade" key={tab}>
            <TabsContent value="library" className="mt-0"><LibraryTab /></TabsContent>
            <TabsContent value="synergies" className="mt-0"><SynergyTab /></TabsContent>
            <TabsContent value="combos" className="mt-0"><CombosTab /></TabsContent>
            <TabsContent value="archetypes" className="mt-0"><ArchetypesTab /></TabsContent>
            <TabsContent value="compare" className="mt-0"><CompareTab /></TabsContent>
            <TabsContent value="skeleton" className="mt-0"><SkeletonTab /></TabsContent>
            <TabsContent value="favorites" className="mt-0"><FavoritesTab /></TabsContent>
            <TabsContent value="glossary" className="mt-0"><GlossaryTab /></TabsContent>
          </div>
        </main>

        <footer className="border-t border-border py-5 text-center text-xs text-muted-foreground">
          A fan-made strategy companion · Joker data is curated and editorial · Favorites &amp; notes are session-only
        </footer>
      </Tabs>

      <JokerDetailSheet />
    </div>
  );
}
