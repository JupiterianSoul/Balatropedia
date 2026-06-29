/**
 * Native-feel bottom tab bar for the APK / mobile web view.
 *
 * Five primary destinations: Jokers, Seeds, Home (center), Tier List, Favorites.
 * Synergies moved off the bottom bar; Home now anchors the middle slot.
 *
 * The "Jokers" slot uses an actual sprite of the base Joker (j_joker) instead
 * of a generic icon so it reads instantly as "the jokers tab".
 */
import { Sprout, Trophy, Heart, Home as HomeIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSpriteUrl } from "@/lib/sprites";

type TabKey = "jokers" | "seeds" | "home" | "tierlist" | "favorites";

interface BottomTabItem {
  key: TabKey;
  labelKey: string;
  // When set, render a lucide-react icon. When null, render the joker sprite.
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }> | null;
}

const ITEMS: ReadonlyArray<BottomTabItem> = [
  { key: "jokers",    labelKey: "ui.nav.jokers",          Icon: null     },
  { key: "seeds",     labelKey: "ui.nav.seeds",           Icon: Sprout   },
  { key: "home",      labelKey: "ui.nav.home",            Icon: HomeIcon },
  { key: "tierlist",  labelKey: "ui.nav.tierlist",        Icon: Trophy   },
  { key: "favorites", labelKey: "ui.nav.group.favorites", Icon: Heart    },
];

export function BottomTabBar({
  currentTab,
  onSelect,
  resolveLabel,
}: {
  currentTab: string;
  onSelect: (tab: string) => void;
  resolveLabel: (key: string) => string;
}) {
  const jokerSpriteUrl = getSpriteUrl("j_joker");

  return (
    <nav
      role="navigation"
      aria-label="Primary"
      data-testid="bottom-tab-bar"
      className={cn(
        // Solid black background, no transparency. Matches the heavy outline.
        "fixed inset-x-0 bottom-0 z-30 border-t-4 border-black bg-black md:hidden",
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
                  // The `bottom-tab` class flags this button as opted-out of
                  // the theme catch-all selector in index.css. The bottom
                  // navigation must stay solid black per Julie's spec.
                  "bottom-tab",
                  "flex h-14 w-full flex-col items-center justify-center gap-0.5",
                  "transition-colors active:bg-[hsl(150_16%_8%)]",
                  active
                    ? "text-[hsl(var(--bal-mult))]"
                    : "text-[hsl(45_15%_75%)]",
                )}
              >
                <span className="flex h-6 w-6 items-center justify-center">
                  {Icon ? (
                    <Icon
                      className={cn(
                        "h-5 w-5",
                        active && "drop-shadow-[0_0_4px_hsl(var(--bal-mult))]",
                      )}
                      strokeWidth={active ? 2.5 : 2}
                    />
                  ) : jokerSpriteUrl ? (
                    <img
                      src={jokerSpriteUrl}
                      alt=""
                      aria-hidden="true"
                      className={cn(
                        "h-6 w-5 object-contain",
                        active && "drop-shadow-[0_0_4px_hsl(var(--bal-mult))]",
                      )}
                      style={{
                        imageRendering: "pixelated",
                        // @ts-expect-error vendor fallback
                        WebkitImageRendering: "crisp-edges",
                      }}
                      draggable={false}
                    />
                  ) : (
                    // Fallback if sprite asset is missing
                    <span className="font-pixel text-[18px] leading-none">J</span>
                  )}
                </span>
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
