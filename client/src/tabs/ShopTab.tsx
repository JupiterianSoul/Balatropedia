import { Dices, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JokerSprite } from "@/components/JokerSprite";
import { RarityBadge } from "@/components/primitives";
import { useRun } from "@/lib/runContext";
import { useApp } from "@/lib/appContext";
import { useToast } from "@/hooks/use-toast";
import { JOKERS, JOKER_MAP, type Rarity } from "@/lib/helpers";
import { LName, LText } from "@/components/Localized";
import { useT } from "@/lib/i18n";

// Balatro shop rarity weights (no legendary in shop).
const WEIGHTS: { rarity: Rarity; weight: number }[] = [
  { rarity: "common", weight: 70 },
  { rarity: "uncommon", weight: 25 },
  { rarity: "rare", weight: 5 },
];

const PRICE: Record<Rarity, number> = { common: 4, uncommon: 6, rare: 8, legendary: 20 };

const BY_RARITY: Record<Rarity, string[]> = { common: [], uncommon: [], rare: [], legendary: [] };
for (const j of JOKERS) {
  if (j.rarity) BY_RARITY[j.rarity].push(j.id);
}

function rollRarity(): Rarity {
  const total = WEIGHTS.reduce((s, w) => s + w.weight, 0);
  let r = Math.random() * total;
  for (const w of WEIGHTS) {
    if (r < w.weight) return w.rarity;
    r -= w.weight;
  }
  return "common";
}

function rollShop(count = 3): string[] {
  const out: string[] = [];
  let guard = 0;
  while (out.length < count && guard < 200) {
    guard++;
    const rarity = rollRarity();
    const pool = BY_RARITY[rarity];
    if (pool.length === 0) continue;
    const id = pool[Math.floor(Math.random() * pool.length)];
    if (!out.includes(id)) out.push(id);
  }
  return out;
}

export function ShopTab() {
  const { shop, setShop, addToRun, isInRun } = useRun();
  const { openJokerDetail } = useApp();
  const { toast } = useToast();
  const t = useT();

  function handleRoll() {
    setShop(rollShop(3));
  }

  function handleAdd(id: string) {
    const ok = addToRun(id);
    toast(
      ok
        ? { title: t("ui.tabs.shop_added"), description: JOKER_MAP[id]?.name }
        : { title: isInRun(id) ? t("ui.tabs.shop_already") : t("ui.tabs.shop_run_full"), variant: "destructive" },
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-pixel text-xl text-accent">{t("ui.tabs.shop_title")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("ui.tabs.shop_subtitle")}
          </p>
        </div>
        <Button onClick={handleRoll} className="gap-2" data-testid="button-roll-shop">
          <Dices className="h-4 w-4" />
          {t("ui.btn.roll_shop")}
        </Button>
      </div>

      {shop.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-border py-16 text-center">
          <Dices className="h-6 w-6 text-muted-foreground" />
          <p className="max-w-sm text-sm text-muted-foreground">
            {t("ui.tabs.shop_empty_pre")}<span className="text-accent">{t("ui.btn.roll_shop")}</span>{t("ui.tabs.shop_empty_post")}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shop.map((id, idx) => {
            const j = JOKER_MAP[id];
            if (!j) return null;
            const inRun = isInRun(id);
            return (
              <div key={`${id}-${idx}`} className="casino-card flex flex-col p-4" data-testid={`shop-card-${id}`}>
                <div className="flex items-start gap-3">
                  <JokerSprite jokerId={j.id} name={j.name} size={64} className="h-16 w-16" />
                  <div className="min-w-0 flex-1">
                    <button
                      onClick={() => openJokerDetail(j.id)}
                      className="block truncate text-left font-pixel text-base text-accent hover:underline"
                    >
                      <LName category="jokers" id={j.id} fallback={j.name} />
                    </button>
                    <div className="mt-1 flex items-center gap-2">
                      {j.rarity && <RarityBadge rarity={j.rarity} />}
                      <span className="inline-flex items-center rounded-sm border border-accent/40 bg-accent/10 px-1.5 py-0.5 text-[11px] font-semibold tabular text-accent">
                        ${PRICE[j.rarity ?? "common"]}
                      </span>
                    </div>
                  </div>
                </div>
                <LText category="jokers" id={j.id} fallback={j.summary} as="p" className="mt-3 line-clamp-3 flex-1 text-xs leading-relaxed text-foreground/80 small-caps" />
                <Button
                  size="sm"
                  variant={inRun ? "outline" : "default"}
                  className="mt-3 w-full gap-1.5"
                  onClick={() => handleAdd(id)}
                  disabled={inRun}
                  data-testid={`button-add-run-${id}`}
                >
                  {inRun ? <><Check className="h-4 w-4" /> {t("ui.tabs.shop_in_run")}</> : <><Plus className="h-4 w-4" /> {t("ui.tabs.shop_add_to_run")}</>}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
