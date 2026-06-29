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

const NAV_SECTION_COLORS: Record<string, { header: string; active: string }> = {
  library: { header: "hsl(45 85% 60% / 0.7)",  active: "hsl(45 85% 60%)"  },
  run:     { header: "hsl(0 70% 62% / 0.75)",  active: "hsl(0 70% 62%)"   },
  build:   { header: "hsl(210 75% 65% / 0.75)", active: "hsl(210 75% 65%)" },
  game:    { header: "hsl(145 55% 58% / 0.75)", active: "hsl(145 55% 58%)" },
  more:    { header: "hsl(270 55% 68% / 0.75)", active: "hsl(270 55% 68%)" },
};
function navSectionColor(key: string) {
  return NAV_SECTION_COLORS[key] ?? { header: "hsl(45 85% 60% / 0.7)", active: "hsl(45 85% 60%)" };
}
export function NavList({ groups, currentTab, onSelect, favCount }: NavListProps) {
  const t = useT();

  function go(v: TabValue) {
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
              data-sound="tab_switch"
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
        const color = navSectionColor(group.key);
        return (
          <div key={group.key} className="flex flex-col gap-0.5">
            <div
              className="px-2 pt-2 text-[10px] uppercase tracking-[0.2em]"
              style={{ color: color.header }}
            >
              {t(`ui.nav.group.${group.key}`)}
            </div>
            <div className="flex flex-col gap-0.5 pl-1">
              {group.tabs.map((v) => {
                const active = currentTab === v;
                return (
                  <button
                    key={v}
                    type="button"
                    data-sound="tab_switch"
                    onClick={() => go(v)}
                    onMouseEnter={() => playSound("hover")}
                    className={`rounded border-l-4 px-3 py-2 text-left text-sm transition-colors hover:bg-[hsl(150_16%_10%)] ${
                      active
                        ? "bg-[hsl(150_16%_8%)] font-bold shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"
                        : "border-transparent text-[hsl(45_15%_85%)]"
                    }`}
                    style={
                      active
                        ? { color: color.active, borderLeftColor: color.active }
                        : undefined
                    }
                    data-testid={`nav-${v}`}
                    aria-current={active ? "page" : undefined}
                  >
                    {t(`ui.nav.${v}`)}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      <button
        type="button"
        data-sound="tab_switch"
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

