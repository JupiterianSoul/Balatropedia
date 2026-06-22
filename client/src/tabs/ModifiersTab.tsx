import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ENHANCEMENTS, EDITIONS, SEALS, TAGS } from "@/data/phase3/misc";
import { Phase3Sprite } from "@/components/Phase3Sprite";
import type { Phase3Category } from "@/lib/phase3Sprites";
import { LName, LText } from "@/components/Localized";
import { useT } from "@/lib/i18n";

type MiniItem = { id: string; name: string; effect: string; trigger?: string };

function MiniGrid({ category, items }: { category: Phase3Category; items: MiniItem[] }) {
  const t = useT();
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((it) => (
        <div className="casino-card flex items-start gap-3 p-3.5" key={it.id} data-testid={`card-${category}-${it.id}`}>
          <Phase3Sprite category={category} id={it.id} name={it.name} size={48} className="h-12 w-12" />
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-sm text-accent"><LName category={category} id={it.id} fallback={it.name} /></h3>
            <LText category={category} id={it.id} fallback={it.effect} as="p" className="mt-1 text-xs leading-relaxed text-foreground/80" />
            {it.trigger && (
              <p className="mt-1.5 text-[11px] italic leading-relaxed text-muted-foreground">
                {t("ui.mods.trigger")}: {it.trigger}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ModifiersTab() {
  const t = useT();
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl text-accent">{t("ui.mods.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("ui.mods.subtitle")}</p>
      </div>
      <Tabs defaultValue="enhancements">
        <TabsList className="bg-card/60" data-testid="tabs-modifiers">
          <TabsTrigger value="enhancements" data-testid="subtab-enhancements">{t("ui.mods.tab_enhancements")} <span className="ml-1 tabular text-muted-foreground">8</span></TabsTrigger>
          <TabsTrigger value="editions" data-testid="subtab-editions">{t("ui.mods.tab_editions")} <span className="ml-1 tabular text-muted-foreground">4</span></TabsTrigger>
          <TabsTrigger value="seals" data-testid="subtab-seals">{t("ui.mods.tab_seals")} <span className="ml-1 tabular text-muted-foreground">4</span></TabsTrigger>
          <TabsTrigger value="tags" data-testid="subtab-tags">{t("ui.mods.tab_tags")} <span className="ml-1 tabular text-muted-foreground">24</span></TabsTrigger>
        </TabsList>
        <TabsContent value="enhancements" className="mt-4"><MiniGrid category="enhancements" items={ENHANCEMENTS} /></TabsContent>
        <TabsContent value="editions" className="mt-4"><MiniGrid category="editions" items={EDITIONS} /></TabsContent>
        <TabsContent value="seals" className="mt-4"><MiniGrid category="seals" items={SEALS} /></TabsContent>
        <TabsContent value="tags" className="mt-4"><MiniGrid category="tags" items={TAGS} /></TabsContent>
      </Tabs>
    </div>
  );
}
