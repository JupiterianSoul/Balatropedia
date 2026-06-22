import { Star } from "lucide-react";
import { playSound } from "@/lib/sound";
import { useT } from "@/lib/i18n";

type TabValue = string;

export type NavGroup = {
  key: string;
  tabs: TabValue[];
};

interface NavListProps {
  groups: NavGroup[];
  currentTab: TabValue;
  onSelect: (tab: TabValue) => void;
  favCount: number;
}

/**
 * Shared vertical nav list — used in both the mobile sheet and the desktop sidebar.
 * Group labels (multi-tab groups) act as small-caps section headers.
 * Single-tab groups render as flat top-level buttons.
 */
export function NavList({ groups, currentTab, onSelect, favCount }: NavListProps) {
  const t = useT();

  function go(v: TabValue) {
    playSound("click");
    onSelect(v);
  }

  return (
    <div className="flex flex-col gap-1 p-2">
      {groups.map((group) => {
        const isActiveGroup = group.tabs.includes(currentTab);
        if (group.tabs.length === 1) {
          const v = group.tabs[0];
          return (
            <button
              key={group.key}
              type="button"
              onClick={() => go(v)}
              onMouseEnter={() => playSound("hover")}
              className={`balatro-tab w-full justify-start whitespace-nowrap text-left font-pixel ${isActiveGroup ? "is-active" : ""}`}
              data-state={isActiveGroup ? "active" : "inactive"}
              data-testid={`nav-${group.key}`}
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
                  onClick={() => go(v)}
                  onMouseEnter={() => playSound("hover")}
                  className={`rounded px-3 py-2 text-left text-sm transition-colors hover:bg-[hsl(150_16%_10%)] ${
                    currentTab === v
                      ? "gold-text bg-[hsl(150_16%_10%)]"
                      : "text-[hsl(45_15%_85%)]"
                  }`}
                  data-testid={`nav-${v}`}
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
        onClick={() => go("favorites")}
        onMouseEnter={() => playSound("hover")}
        className={`balatro-tab mt-2 flex w-full items-center justify-start gap-2 whitespace-nowrap text-left font-pixel ${currentTab === "favorites" ? "is-active" : ""}`}
        data-state={currentTab === "favorites" ? "active" : "inactive"}
        data-testid="nav-favorites"
      >
        <Star
          className={`h-3.5 w-3.5 ${favCount > 0 ? "fill-[hsl(45_85%_60%)] text-[hsl(45_85%_60%)]" : ""}`}
          strokeWidth={2.5}
        />
        {t("ui.nav.group.favorites")}
        <span className="ml-auto tabular text-xs opacity-70">{favCount}</span>
      </button>
    </div>
  );
}
