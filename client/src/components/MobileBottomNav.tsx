/**
 * MobileBottomNav — fixed bottom tab bar, visible on <md only.
 *
 * 5 primary tabs: Home, Jokers, Tier List, Seeds, Settings.
 * Active tab gets a highlighted top stripe.
 * Height ~56dp + safe-area-inset-bottom padding.
 */

import { Home, Sparkles, ListOrdered, Search, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Tab {
  key: string;
  label: string;
  Icon: LucideIcon;
}

const TABS: Tab[] = [
  { key: "home", label: "Home", Icon: Home },
  { key: "jokers", label: "Jokers", Icon: Sparkles },
  { key: "tierlist", label: "Tier List", Icon: ListOrdered },
  { key: "seeds", label: "Seeds", Icon: Search },
  { key: "settings", label: "Settings", Icon: Settings },
];

interface MobileBottomNavProps {
  currentTab: string;
  onSelect: (tab: string) => void;
}

export function MobileBottomNav({ currentTab, onSelect }: MobileBottomNavProps) {
  return (
    <nav
      aria-label="Primary navigation"
      className="fixed bottom-0 inset-x-0 z-20 md:hidden border-t-4 border-black bg-[hsl(178_14%_13%)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-stretch h-14">
        {TABS.map(({ key, label, Icon }) => {
          const active = currentTab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              data-testid={`bottom-nav-${key}`}
              className="relative flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors"
              style={{ minWidth: 0 }}
            >
              {/* Active top stripe */}
              {active && (
                <span
                  className="absolute top-0 inset-x-2 h-[3px] rounded-b-full bg-accent"
                  aria-hidden="true"
                />
              )}
              <Icon
                className={`h-5 w-5 ${active ? "text-accent" : "text-foreground/50"}`}
                strokeWidth={active ? 2.5 : 2}
                aria-hidden
              />
              <span
                className={`font-pixel text-[9px] leading-tight ${
                  active ? "text-accent" : "text-foreground/50"
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
