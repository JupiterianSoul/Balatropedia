import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useApp } from "@/lib/appContext";
import { JokerDetailSheet } from "@/components/JokerDetailSheet";
import { EntityDetailSheet } from "@/components/EntityDetailSheet";
import { UserButton } from "@/components/UserButton";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useI18n, useT } from "@/lib/i18n";
import { LibraryTab } from "@/tabs/LibraryTab";
import { MyRunTab } from "@/tabs/MyRunTab";
import { ShopTab } from "@/tabs/ShopTab";
import { SynergyTab } from "@/tabs/SynergyTab";
import { CombosTab } from "@/tabs/CombosTab";
import { ArchetypesTab } from "@/tabs/ArchetypesTab";
import { HeatmapTab } from "@/tabs/HeatmapTab";
import { BossBlindsTab } from "@/tabs/BossBlindsTab";
import { DecksTab } from "@/tabs/DecksTab";
import { StakesTab } from "@/tabs/StakesTab";
import { ConsumablesTab } from "@/tabs/ConsumablesTab";
import { VouchersTab } from "@/tabs/VouchersTab";
import { ModifiersTab } from "@/tabs/ModifiersTab";
import { CompareTab } from "@/tabs/CompareTab";
import { SkeletonTab } from "@/tabs/SkeletonTab";
import { FavoritesTab } from "@/tabs/FavoritesTab";
import { GlossaryTab } from "@/tabs/GlossaryTab";

const TABS = [
  { value: "library", label: "Library" },
  { value: "myrun", label: "My Run" },
  { value: "shop", label: "Shop" },
  { value: "synergies", label: "Synergies" },
  { value: "combos", label: "Combos" },
  { value: "archetypes", label: "Archetypes" },
  { value: "decks", label: "Decks" },
  { value: "stakes", label: "Stakes" },
  { value: "consumables", label: "Consumables" },
  { value: "vouchers", label: "Vouchers" },
  { value: "modifiers", label: "Modifiers" },
  { value: "heatmap", label: "Heatmap" },
  { value: "bosses", label: "Boss Blinds" },
  { value: "compare", label: "Compare" },
  { value: "skeleton", label: "Skeleton" },
  { value: "favorites", label: "Favorites" },
  { value: "glossary", label: "Glossary" },
];

export default function Home() {
  const { favoriteJokers, favoriteCombos } = useApp();
  const [tab, setTab] = useState("library");
  const favCount = favoriteJokers.size + favoriteCombos.size;
  const { lang } = useI18n();
  const t = useT();
  const [esBannerDismissed, setEsBannerDismissed] = useState(false);
  const showEsBanner = lang === "es" && !esBannerDismissed;

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Tabs value={tab} onValueChange={setTab} className="flex min-h-[100dvh] flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b-4 border-black bg-[hsl(178_14%_13%)]/95 shadow-[0_4px_0_hsl(198_18%_4%)] backdrop-blur supports-[backdrop-filter]:bg-[hsl(178_14%_13%)]/90">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:gap-6">
            {/* logo + title */}
            <div className="flex items-center gap-3">
              <Logo className="h-9 w-9 shrink-0" />
              <div className="leading-tight">
                <h1 className="font-display text-2xl font-bold tracking-tight leading-none">
                  <span className="mult-text">{t("ui.header.title_a")}</span>{" "}
                  <span className="chips-text">{t("ui.header.title_b")}</span>
                </h1>
                <p className="mt-1 font-display text-[11px] uppercase tracking-[0.18em] text-[hsl(45_85%_60%)]/80">
                  {t("ui.header.tagline")}
                </p>
              </div>
            </div>

            {/* centered tab bar */}
            <div className="-mx-4 flex-1 overflow-x-auto px-4 lg:mx-0 lg:flex lg:justify-start lg:px-0">
              <TabsList className="h-auto w-max gap-1 bg-transparent p-1" data-testid="tabs-main">
                {TABS.map((tabItem) => (
                  <TabsTrigger
                    key={tabItem.value}
                    value={tabItem.value}
                    data-testid={`tab-${tabItem.value}`}
                    className="balatro-tab whitespace-nowrap font-pixel"
                  >
                    {t(`ui.nav.${tabItem.value}`)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* favorites count + user button */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTab("favorites")}
                className="hidden items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground lg:flex"
                data-testid="badge-favorites-count"
              >
                <Star className={favCount > 0 ? "h-4 w-4 fill-accent text-accent" : "h-4 w-4"} />
                <span className="tabular">{favCount}</span>
              </button>
              <LanguageSwitcher />
              <UserButton />
            </div>
          </div>
        </header>

        {showEsBanner && (
          <div
            className="flex items-center justify-between gap-3 border-b border-accent/30 bg-accent/10 px-4 py-2 text-xs text-foreground"
            data-testid="banner-es"
          >
            <span>{t("ui.lang.es_banner")}</span>
            <button
              type="button"
              onClick={() => setEsBannerDismissed(true)}
              data-testid="button-dismiss-es-banner"
              className="shrink-0 rounded p-1 text-muted-foreground hover:text-foreground"
              aria-label={t("ui.btn.close")}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Content */}
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
          <div className="mount-fade" key={tab}>
            <TabsContent value="library" className="mt-0"><LibraryTab /></TabsContent>
            <TabsContent value="myrun" className="mt-0"><MyRunTab /></TabsContent>
            <TabsContent value="shop" className="mt-0"><ShopTab /></TabsContent>
            <TabsContent value="synergies" className="mt-0"><SynergyTab /></TabsContent>
            <TabsContent value="combos" className="mt-0"><CombosTab /></TabsContent>
            <TabsContent value="archetypes" className="mt-0"><ArchetypesTab /></TabsContent>
            <TabsContent value="decks" className="mt-0"><DecksTab /></TabsContent>
            <TabsContent value="stakes" className="mt-0"><StakesTab /></TabsContent>
            <TabsContent value="consumables" className="mt-0"><ConsumablesTab /></TabsContent>
            <TabsContent value="vouchers" className="mt-0"><VouchersTab /></TabsContent>
            <TabsContent value="modifiers" className="mt-0"><ModifiersTab /></TabsContent>
            <TabsContent value="heatmap" className="mt-0"><HeatmapTab /></TabsContent>
            <TabsContent value="bosses" className="mt-0"><BossBlindsTab /></TabsContent>
            <TabsContent value="compare" className="mt-0"><CompareTab /></TabsContent>
            <TabsContent value="skeleton" className="mt-0"><SkeletonTab /></TabsContent>
            <TabsContent value="favorites" className="mt-0"><FavoritesTab /></TabsContent>
            <TabsContent value="glossary" className="mt-0"><GlossaryTab /></TabsContent>
          </div>
        </main>

        <footer className="border-t border-border py-5 text-center text-xs text-muted-foreground">
          {t("ui.header.footer")}
        </footer>
      </Tabs>

      <JokerDetailSheet />
      <EntityDetailSheet />
    </div>
  );
}
