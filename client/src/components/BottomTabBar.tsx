/**
 * Native-feel bottom tab bar for the APK / mobile web view.
 *
 * Visible on mobile breakpoints only. Five primary destinations, picked from
 * Julie's spec: Jokers, Synergies, Seeds, Tier Lists, Favorites. The full
 * tab catalog still lives behind the hamburger in the top bar; this just
 * surfaces the high-traffic five so phone navigation feels like a real app.
 *
 * Layout: fixed to bottom, full width, safe-area-aware padding so the bar
 * sits above the gesture nav pill on modern Android. Each button is a 56px
 * tall target (icon + label) \u2014 well above the 44px iOS / 48dp Android touch
 * minimum.
 */
import {
  Cherry,
  Sparkles,
  Sprout,
  Trophy,
  Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TabKey = "jokers" | "synergies" | "seeds" | "tierlist" | "favorites";

interface BottomTabItem {
  key: TabKey;
  labelKey: string;          // i18n key (resolved by parent via useT)
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

// Static spec \u2014 order matches the user's stated priority.
const ITEMS: ReadonlyArray<BottomTabItem> = [
  { key: "jokers",     labelKey: "ui.nav.jokers",     Icon: Cherry   },
  { key: "synergies",  labelKey: "ui.nav.synergies",  Icon: Sparkles },
  { key: "seeds",      labelKey: "ui.nav.seeds",      Icon: Sprout   },
  { key: "tierlist",   labelKey: "ui.nav.tierlist",   Icon: Trophy   },
  { key: "favorites",  labelKey: "ui.nav.group.favorites", Icon: Heart },
];

export function BottomTabBar({
  currentTab,
  onSelect,
  resolveLabel,
}: {
  currentTab: string;
  onSelect: (tab: string) => void;
  /** Receives the i18n key and returns the localized string. Inverted so the
   *  parent owns the i18n context (we don't reach into useT() from a leaf). */
  resolveLabel: (key: string) => string;
}) {
  return (
    <nav
      // role=tablist is technically what Radix Tabs uses; we use role=navigation
      // because these are top-level destinations, not a tablist within a single
      // pane \u2014 Android Talkback announces "Navigation, 5 items" which is right.
      role="navigation"
      aria-label="Primary"
      data-testid="bottom-tab-bar"
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t-4 border-black bg-[hsl(178_14%_13%)]/97 backdrop-blur md:hidden",
        // Heavy black drop-shadow line matches Balatro's top bar treatment.
        "shadow-[0_-4px_0_hsl(198_18%_4%)]",
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-5">
        {ITEMS.map(({ key, labelKey, Icon }) => {
          const active = currentTab === key;
          return (
            <li key={key}>
              <button
                type="button"
                onClick={() => onSelect(key)}
                aria-current={active ? "page" : undefined}
                aria-label={resolveLabel(labelKey)}
                data-testid={`bottom-tab-${key}`}
                className={cn(
                  "flex h-14 w-full flex-col items-center justify-center gap-0.5",
                  // 44dp+ touch target met by h-14 (56px) and full-width columns.
                  "transition-colors active:bg-[hsl(150_16%_8%)]",
                  active
                    ? "text-[hsl(var(--bal-mult))]"
                    : "text-[hsl(45_15%_75%)]",
                )}
              >
                <Icon
                  className={cn("h-5 w-5", active && "drop-shadow-[0_0_4px_hsl(var(--bal-mult))]")}
                  strokeWidth={active ? 2.5 : 2}
                />
                <span className="font-pixel text-[10px] leading-none tracking-tight">
                  {resolveLabel(labelKey)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
