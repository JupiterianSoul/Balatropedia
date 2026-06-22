import { useState } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Star, X, Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Logo } from "@/components/Logo";
import { NavList, type NavGroup } from "@/components/NavList";
import { useApp } from "@/lib/appContext";
import { JokerDetailSheet } from "@/components/JokerDetailSheet";
import { EntityDetailSheet } from "@/components/EntityDetailSheet";
import { UserButton } from "@/components/UserButton";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SoundToggle } from "@/components/SoundToggle";
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
import { SettingsTab } from "@/tabs/SettingsTab";
import { HelpTab } from "@/tabs/HelpTab";
import { AboutTab } from "@/tabs/AboutTab";

// Grouped navigation; 17 tabs collapsed into 5 logical groups + Favorites.
// Same structure renders in both the mobile sheet and the desktop sidebar.
const NAV_GROUPS: NavGroup[] = [
  { key: "library", tabs: ["library"] },
  { key: "run", tabs: ["myrun", "shop"] },
  { key: "build", tabs: ["synergies", "combos", "archetypes", "compare", "skeleton"] },
  { key: "game", tabs: ["decks", "stakes", "bosses", "vouchers", "consumables", "modifiers"] },
  { key: "more", tabs: ["heatmap", "glossary", "help", "about", "settings"] },
];

export default function Home() {
  const { favoriteJokers, favoriteCombos } = useApp();
  const [tab, setTab] = useState("library");
  const favCount = favoriteJokers.size + favoriteCombos.size;
  const { lang } = useI18n();
  const t = useT();
  const [esBannerDismissed, setEsBannerDismissed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const showEsBanner = lang === "es" && !esBannerDismissed;

  function handleSelect(v: string) {
    setTab(v);
    setMobileNavOpen(false);
  }

  // Brand block; shared between mobile sheet header and desktop sidebar header
  const Brand = (
    <button
      type="button"
      onClick={() => handleSelect("library")}
      className="flex w-full shrink-0 items-center gap-2.5 transition-transform hover:scale-[1.02]"
      data-testid="button-logo"
      aria-label="Balatropedia home"
    >
      <Logo className="h-9 w-9 shrink-0 drop-shadow-[2px_2px_0_hsl(198_18%_4%)]" />
      <h1 className="font-pixel text-[22px] font-bold leading-none tracking-tight">
        <span className="mult-text">{t("ui.header.title_a")}</span>
        <span className="chips-text">{t("ui.header.title_b")}</span>
      </h1>
    </button>
  );

  return (
    <div className="flex min-h-[100dvh] bg-background">
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v)}
        className="flex min-h-[100dvh] w-full"
      >
        {/* Desktop sidebar; persistent vertical nav, hidden on mobile */}
        <aside
          className="sticky top-0 z-20 hidden h-[100dvh] w-60 shrink-0 flex-col border-r-4 border-black bg-[hsl(178_14%_13%)] shadow-[4px_0_0_hsl(198_18%_4%)] md:flex"
          data-testid="sidebar-desktop"
        >
          <div className="border-b-2 border-black bg-[hsl(150_16%_10%)] px-4 py-3">
            {Brand}
          </div>
          <div className="flex-1 overflow-y-auto">
            <NavList
              groups={NAV_GROUPS}
              currentTab={tab}
              onSelect={handleSelect}
              favCount={favCount}
            />
          </div>
          <div className="border-t-2 border-black bg-[hsl(150_16%_10%)] px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <LanguageSwitcher />
              <SoundToggle />
              <UserButton />
            </div>
          </div>
        </aside>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top bar; full bar on mobile, slim utility bar on desktop */}
          <header className="sticky top-0 z-10 border-b-4 border-black bg-[hsl(178_14%_13%)]/95 shadow-[0_4px_0_hsl(198_18%_4%)] backdrop-blur supports-[backdrop-filter]:bg-[hsl(178_14%_13%)]/90 md:hidden">
            <div className="flex items-center gap-2 px-3 py-2">
              {/* mobile hamburger */}
              <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                <SheetTrigger asChild>
                  <button
                    type="button"
                    className="balatro-tab flex shrink-0 items-center justify-center !px-2 !py-2"
                    aria-label="Open menu"
                    data-testid="button-mobile-menu"

                  >
                    <Menu className="h-5 w-5" strokeWidth={2.5} />
                  </button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="w-[280px] border-r-4 border-black bg-[hsl(178_14%_13%)] p-0 font-pixel text-[hsl(45_15%_85%)]"
                >
                  <SheetHeader className="border-b-2 border-black bg-[hsl(150_16%_10%)] px-4 py-3 text-left">
                    <SheetTitle className="flex items-center gap-2 font-pixel text-xl leading-none">
                      <Logo className="h-7 w-7" />
                      <span>
                        <span className="mult-text">{t("ui.header.title_a")}</span>
                        <span className="chips-text">{t("ui.header.title_b")}</span>
                      </span>
                    </SheetTitle>
                  </SheetHeader>
                  <div className="max-h-[calc(100dvh-64px)] overflow-y-auto">
                    <NavList
                      groups={NAV_GROUPS}
                      currentTab={tab}
                      onSelect={handleSelect}
                      favCount={favCount}
                    />
                  </div>
                </SheetContent>
              </Sheet>

              {/* mobile logo + wordmark */}
              <button
                type="button"
                onClick={() => setTab("library")}
                className="flex shrink-0 items-center gap-2 transition-transform hover:scale-[1.02]"
                aria-label="Balatropedia home"
              >
                <Logo className="h-8 w-8 shrink-0 drop-shadow-[2px_2px_0_hsl(198_18%_4%)]" />
                <h1 className="font-pixel text-[18px] font-bold leading-none tracking-tight">
                  <span className="mult-text">{t("ui.header.title_a")}</span>
                  <span className="chips-text">{t("ui.header.title_b")}</span>
                </h1>
              </button>

              <div className="flex-1" />

              {/* mobile right controls; no SoundToggle here to keep room for sign-in (desktop has it in the sidebar) */}
              <div className="flex shrink-0 items-center gap-1">
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
              <TabsContent value="help" className="mt-0"><HelpTab /></TabsContent>
              <TabsContent value="about" className="mt-0"><AboutTab /></TabsContent>
              <TabsContent value="settings" className="mt-0"><SettingsTab /></TabsContent>
            </div>
          </main>

          <footer className="border-t border-border py-5 text-center text-xs text-muted-foreground">
            {t("ui.header.footer")}
          </footer>
        </div>
      </Tabs>

      <JokerDetailSheet />
      <EntityDetailSheet />
    </div>
  );
}
