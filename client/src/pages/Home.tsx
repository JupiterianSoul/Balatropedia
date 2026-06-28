import { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { X, Menu } from "lucide-react";
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
import { burstConfetti } from "@/lib/confetti";
import { HomeTab } from "@/tabs/HomeTab";
import { JokersTab } from "@/tabs/JokersTab";
import { MyRunTab } from "@/tabs/MyRunTab";
import { RunChallengeTab } from "@/tabs/RunChallengeTab";
import { BuildLabTab } from "@/tabs/BuildLabTab";
import { ScoreCalculatorTab } from "@/tabs/ScoreCalculatorTab";
import { SeedsTab } from "@/tabs/SeedsTab";
import { SynergyTab } from "@/tabs/SynergyTab";
import { CombosTab } from "@/tabs/CombosTab";
import { ArchetypesTab } from "@/tabs/ArchetypesTab";
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
import { TierListTab } from "@/tabs/TierListTab";
import { WhatsNewTab } from "@/tabs/WhatsNewTab";
import { KofiFooterButton } from "@/components/KofiButton";
import { MobileBottomNav } from "@/components/MobileBottomNav";

const NAV_GROUPS: NavGroup[] = [
  { key: "home", tabs: ["home"] },
  { key: "run", tabs: ["myrun", "runchallenge", "buildlab", "calculator", "seeds"] },
  { key: "build", tabs: ["synergies", "combos", "archetypes", "tierlist", "compare", "skeleton"] },
  { key: "game", tabs: ["jokers", "decks", "stakes", "bosses", "vouchers", "consumables", "modifiers"] },
  { key: "more", tabs: ["glossary", "whatsnew", "help", "about", "settings"] },
];

const VALID_TABS = new Set([
  "home", "jokers", "myrun", "runchallenge", "buildlab", "calculator", "seeds", "synergies", "combos", "archetypes", "tierlist",
  "compare", "skeleton", "decks", "stakes", "bosses", "vouchers",
  "consumables", "modifiers", "glossary", "whatsnew",
  "help", "about", "settings", "favorites",
  "library",
  "runplanner",
]);

const LEGACY_REDIRECTS: Record<string, string> = {
  library: "jokers",
  runplanner: "buildlab",
};

export default function Home() {
  const { favoriteJokers, favoriteCombos } = useApp();
  const initialTab = (() => {
    if (typeof window === "undefined") return "home";
    const st = window.history.state;
    if (st && typeof st.tab === "string" && VALID_TABS.has(st.tab)) {
      return LEGACY_REDIRECTS[st.tab] ?? st.tab;
    }
    // Apply persisted startup tab preference (if not "last" or unset).
    try {
      const startupPref = window.localStorage.getItem("balatropedia.local.startupTab");
      if (startupPref && startupPref !== "last" && VALID_TABS.has(startupPref)) {
        return startupPref;
      }
    } catch { /* ignore */ }
    return "home";
  })();
  const [tab, setTab] = useState(initialTab);
  const favCount = favoriteJokers.size + favoriteCombos.size;
  const { lang } = useI18n();
  const t = useT();
  const [esBannerDismissed, setEsBannerDismissed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const showEsBanner = lang === "es" && !esBannerDismissed;

  useEffect(() => {
    function onPop(e: PopStateEvent) {
      let next = (e.state && typeof e.state.tab === "string" && VALID_TABS.has(e.state.tab))
        ? e.state.tab
        : "home";
      next = LEGACY_REDIRECTS[next] ?? next;
      setTab(next);
      setMobileNavOpen(false);
    }
    window.addEventListener("popstate", onPop);
    if (!window.history.state || typeof window.history.state.tab !== "string") {
      try {
        window.history.replaceState({ tab: initialTab }, "");
      } catch {  }
    }
    return () => window.removeEventListener("popstate", onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSelect(v: string) {
    if (v !== tab) {
      try {
        window.history.pushState({ tab: v }, "");
      } catch {  }
    }
    setTab(v);
    setMobileNavOpen(false);
  }

  const brandClicks = useRef<{ n: number; last: number }>({ n: 0, last: 0 });
  function onBrandClick() {
    const now = Date.now();
    if (now - brandClicks.current.last < 700) brandClicks.current.n++;
    else brandClicks.current.n = 1;
    brandClicks.current.last = now;
    if (brandClicks.current.n >= 5) {
      brandClicks.current.n = 0;
      burstConfetti({ count: 50, originX: 10, originY: 0 });
    }
    handleSelect("home");
  }

  const Brand = (
    <button
      type="button"
      onClick={onBrandClick}
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
    <div className="flex min-h-[100dvh] bg-background md:h-[100dvh] md:min-h-0 md:overflow-hidden">
      <Tabs
        value={tab}
        onValueChange={handleSelect}
        className="flex min-h-[100dvh] w-full md:h-[100dvh] md:min-h-0"
      >
        { }
        <aside
          className="z-20 hidden h-[100dvh] w-60 shrink-0 flex-col border-r-4 border-black bg-[hsl(178_14%_13%)] shadow-[4px_0_0_hsl(198_18%_4%)] md:flex"
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

        { }
        <div className="flex min-w-0 flex-1 flex-col md:h-[100dvh] md:overflow-y-auto">
          {}
          <header className="sticky top-0 z-10 border-b-4 border-black bg-[hsl(178_14%_13%)]/95 shadow-[0_4px_0_hsl(198_18%_4%)] backdrop-blur supports-[backdrop-filter]:bg-[hsl(178_14%_13%)]/90 md:hidden pt-[env(safe-area-inset-top)]">
            <div className="flex items-center gap-2 px-3 py-1.5">
              {}
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

              {}
              <button
                type="button"
                onClick={() => handleSelect("home")}
                className="flex shrink-0 items-center gap-2 transition-transform hover:scale-[1.02]"
                aria-label="Balatropedia home"
              >
                <Logo className="h-7 w-7 shrink-0 drop-shadow-[2px_2px_0_hsl(198_18%_4%)]" />
                <h1 className="font-pixel text-[16px] font-bold leading-none tracking-tight">
                  <span className="mult-text">{t("ui.header.title_a")}</span>
                  <span className="chips-text">{t("ui.header.title_b")}</span>
                </h1>
              </button>

              <div className="flex-1" />

              {}
              <div className="flex shrink-0 items-center gap-1">
                <LanguageSwitcher compact />
                <UserButton compact />
              </div>
            </div>
          </header>

          {/* Mobile bottom tab bar — hidden on md+ */}
          <MobileBottomNav currentTab={tab} onSelect={handleSelect} />

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

          {}
          {tab === "home" ? (
            <div className="mount-fade flex flex-1 min-h-0 min-w-0 w-full pb-[calc(56px+env(safe-area-inset-bottom)+8px)] md:pb-0" key={tab} data-testid="home-fullbleed">
              <TabsContent value="home" className="mt-0 flex-1 min-h-0 min-w-0 w-full flex flex-col data-[state=inactive]:hidden"><HomeTab onNavigate={handleSelect} /></TabsContent>
            </div>
          ) : (
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 pb-[calc(56px+env(safe-area-inset-bottom)+8px+24px)] md:pb-6">
            <div className="mount-fade" key={tab}>
              <TabsContent value="jokers" className="mt-0"><JokersTab /></TabsContent>
              <TabsContent value="myrun" className="mt-0"><MyRunTab /></TabsContent>
              <TabsContent value="runchallenge" className="mt-0"><RunChallengeTab /></TabsContent>
              <TabsContent value="buildlab" className="mt-0"><BuildLabTab /></TabsContent>
              <TabsContent value="calculator" className="mt-0"><ScoreCalculatorTab /></TabsContent>
              <TabsContent value="seeds" className="mt-0"><SeedsTab /></TabsContent>
              <TabsContent value="synergies" className="mt-0"><SynergyTab /></TabsContent>
              <TabsContent value="combos" className="mt-0"><CombosTab /></TabsContent>
              <TabsContent value="archetypes" className="mt-0"><ArchetypesTab /></TabsContent>
              <TabsContent value="tierlist" className="mt-0"><TierListTab /></TabsContent>
              <TabsContent value="decks" className="mt-0"><DecksTab /></TabsContent>
              <TabsContent value="stakes" className="mt-0"><StakesTab /></TabsContent>
              <TabsContent value="consumables" className="mt-0"><ConsumablesTab /></TabsContent>
              <TabsContent value="vouchers" className="mt-0"><VouchersTab /></TabsContent>
              <TabsContent value="modifiers" className="mt-0"><ModifiersTab /></TabsContent>
              <TabsContent value="bosses" className="mt-0"><BossBlindsTab /></TabsContent>
              <TabsContent value="compare" className="mt-0"><CompareTab /></TabsContent>
              <TabsContent value="skeleton" className="mt-0"><SkeletonTab /></TabsContent>
              <TabsContent value="favorites" className="mt-0"><FavoritesTab /></TabsContent>
              <TabsContent value="glossary" className="mt-0"><GlossaryTab /></TabsContent>
              <TabsContent value="help" className="mt-0"><HelpTab /></TabsContent>
              <TabsContent value="about" className="mt-0"><AboutTab /></TabsContent>
              <TabsContent value="whatsnew" className="mt-0"><WhatsNewTab /></TabsContent>
              <TabsContent value="settings" className="mt-0"><SettingsTab /></TabsContent>
              <KofiFooterButton />
            </div>
          </main>
          )}

          {tab !== "home" && (
            <footer className="border-t border-border py-5 text-center text-xs text-muted-foreground">
              {t("ui.header.footer")}
            </footer>
          )}
        </div>
      </Tabs>

      <JokerDetailSheet />
      <EntityDetailSheet />
    </div>
  );
}

