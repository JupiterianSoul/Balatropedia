import { useState } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Star, X, ChevronDown, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Logo } from "@/components/Logo";
import { useApp } from "@/lib/appContext";
import { JokerDetailSheet } from "@/components/JokerDetailSheet";
import { EntityDetailSheet } from "@/components/EntityDetailSheet";
import { UserButton } from "@/components/UserButton";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SoundToggle } from "@/components/SoundToggle";
import { playSound } from "@/lib/sound";
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

// Grouped navigation — 17 tabs collapsed into 6 top-level groups for a cleaner header.
// Single-tab groups render as a flat button; multi-tab groups render as a dropdown.
type TabValue =
  | "library"
  | "myrun"
  | "shop"
  | "synergies"
  | "combos"
  | "archetypes"
  | "decks"
  | "stakes"
  | "consumables"
  | "vouchers"
  | "modifiers"
  | "heatmap"
  | "bosses"
  | "compare"
  | "skeleton"
  | "favorites"
  | "glossary";

type NavGroup = {
  key: string;
  tabs: TabValue[];
};

const NAV_GROUPS: NavGroup[] = [
  { key: "library", tabs: ["library"] },
  { key: "run", tabs: ["myrun", "shop"] },
  { key: "build", tabs: ["synergies", "combos", "archetypes", "compare", "skeleton"] },
  { key: "game", tabs: ["decks", "stakes", "bosses", "vouchers", "consumables", "modifiers"] },
  { key: "more", tabs: ["heatmap", "glossary"] },
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

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Tabs value={tab} onValueChange={(v) => { playSound("click"); setTab(v); }} className="flex min-h-[100dvh] flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b-4 border-black bg-[hsl(178_14%_13%)]/95 shadow-[0_4px_0_hsl(198_18%_4%)] backdrop-blur supports-[backdrop-filter]:bg-[hsl(178_14%_13%)]/90">
          <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-2 md:gap-5 md:px-4 md:py-2.5">
            {/* mobile hamburger — opens sheet with full nav (hidden on desktop) */}
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="balatro-tab flex shrink-0 items-center justify-center !px-2 !py-2 md:hidden"
                  aria-label="Open menu"
                  data-testid="button-mobile-menu"
                  onClick={() => playSound("click")}
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
                <div className="flex max-h-[calc(100dvh-64px)] flex-col gap-1 overflow-y-auto p-2">
                  {NAV_GROUPS.map((group) => {
                    const isActiveGroup = group.tabs.includes(tab as TabValue);
                    if (group.tabs.length === 1) {
                      const v = group.tabs[0];
                      return (
                        <button
                          key={group.key}
                          type="button"
                          onClick={() => { playSound("click"); setTab(v); setMobileNavOpen(false); }}
                          className={`balatro-tab w-full justify-start whitespace-nowrap text-left font-pixel ${isActiveGroup ? "is-active" : ""}`}
                          data-state={isActiveGroup ? "active" : "inactive"}
                          data-testid={`mobile-nav-${group.key}`}
                        >
                          {t(`ui.nav.group.${group.key}`)}
                        </button>
                      );
                    }
                    return (
                      <div key={group.key} className="flex flex-col gap-0.5">
                        <div className="px-2 pt-2 text-[10px] uppercase tracking-[0.2em] text-[hsl(45_85%_60%)]/70">
                          {t(`ui.nav.group.${group.key}`)}
                        </div>
                        <div className="flex flex-col gap-0.5 pl-1">
                          {group.tabs.map((v) => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => { playSound("click"); setTab(v); setMobileNavOpen(false); }}
                              className={`rounded px-3 py-2 text-left text-sm transition-colors hover:bg-[hsl(150_16%_10%)] ${tab === v ? "gold-text bg-[hsl(150_16%_10%)]" : "text-[hsl(45_15%_85%)]"}`}
                              data-testid={`mobile-nav-${v}`}
                            >
                              {t(`ui.nav.${v}`)}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => { playSound("click"); setTab("favorites"); setMobileNavOpen(false); }}
                    className={`balatro-tab mt-2 flex w-full items-center justify-start gap-2 whitespace-nowrap text-left font-pixel ${tab === "favorites" ? "is-active" : ""}`}
                    data-state={tab === "favorites" ? "active" : "inactive"}
                    data-testid="mobile-nav-favorites"
                  >
                    <Star className={`h-3.5 w-3.5 ${favCount > 0 ? "fill-[hsl(45_85%_60%)] text-[hsl(45_85%_60%)]" : ""}`} strokeWidth={2.5} />
                    {t("ui.nav.group.favorites")}
                    <span className="ml-auto tabular text-xs opacity-70">{favCount}</span>
                  </button>
                </div>
              </SheetContent>
            </Sheet>

            {/* logo + wordmark */}
            <button
              type="button"
              onClick={() => { playSound("click"); setTab("library"); }}
              className="flex shrink-0 items-center gap-2 transition-transform hover:scale-[1.02] md:gap-2.5"
              data-testid="button-logo"
              aria-label="Balatropedia home"
            >
              <Logo className="h-8 w-8 shrink-0 drop-shadow-[2px_2px_0_hsl(198_18%_4%)] md:h-10 md:w-10" />
              <h1 className="font-pixel text-[18px] font-bold leading-none tracking-tight md:text-[26px]">
                <span className="mult-text">{t("ui.header.title_a")}</span>
                <span className="chips-text">{t("ui.header.title_b")}</span>
              </h1>
            </button>

            {/* spacer — pushes right-side controls to the edge on mobile (nav fills it on desktop) */}
            <div className="flex-1 md:hidden" />

            {/* grouped nav — desktop only; mobile uses the sheet above */}
            <nav className="-mx-4 hidden flex-1 items-center gap-1 overflow-x-auto px-4 md:mx-0 md:flex md:px-0" data-testid="nav-main">
              {NAV_GROUPS.map((group) => {
                const isActiveGroup = group.tabs.includes(tab as TabValue);
                if (group.tabs.length === 1) {
                  const v = group.tabs[0];
                  return (
                    <button
                      key={group.key}
                      type="button"
                      onClick={() => { playSound("click"); setTab(v); }}
                      onMouseEnter={() => playSound("hover")}
                      className="balatro-tab whitespace-nowrap font-pixel"
                      data-testid={`nav-group-${group.key}`}
                      data-state={isActiveGroup ? "active" : "inactive"}
                    >
                      {t(`ui.nav.group.${group.key}`)}
                    </button>
                  );
                }
                return (
                  <DropdownMenu key={group.key}>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        onMouseEnter={() => playSound("hover")}
                        className="balatro-tab flex items-center gap-1 whitespace-nowrap font-pixel"
                        data-testid={`nav-group-${group.key}`}
                        data-state={isActiveGroup ? "active" : "inactive"}
                      >
                        {t(`ui.nav.group.${group.key}`)}
                        <ChevronDown className="h-3.5 w-3.5 opacity-70" strokeWidth={2.5} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="min-w-[180px] border-2 border-black bg-[hsl(178_14%_13%)] p-1 font-pixel shadow-[0_6px_0_hsl(198_18%_4%)]"
                    >
                      {group.tabs.map((v) => (
                        <DropdownMenuItem
                          key={v}
                          onSelect={() => { playSound("click"); setTab(v); }}
                          className={`cursor-pointer rounded px-3 py-2 text-sm focus:bg-[hsl(150_16%_10%)] ${tab === v ? "gold-text" : "text-[hsl(45_15%_85%)]"}`}
                          data-testid={`nav-item-${v}`}
                        >
                          {t(`ui.nav.${v}`)}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              })}

              {/* favorites — always visible with count badge */}
              <button
                type="button"
                onClick={() => { playSound("click"); setTab("favorites"); }}
                onMouseEnter={() => playSound("hover")}
                className="balatro-tab flex items-center gap-1.5 whitespace-nowrap font-pixel"
                data-testid="nav-group-favorites"
                data-state={tab === "favorites" ? "active" : "inactive"}
              >
                <Star className={`h-3.5 w-3.5 ${favCount > 0 ? "fill-[hsl(45_85%_60%)] text-[hsl(45_85%_60%)]" : ""}`} strokeWidth={2.5} />
                <span className="tabular">{favCount}</span>
              </button>
            </nav>

            {/* right-side controls — always visible, compacted on mobile */}
            <div className="flex shrink-0 items-center gap-1 md:gap-2">
              <LanguageSwitcher />
              <SoundToggle />
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
