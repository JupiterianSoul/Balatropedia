import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { VOUCHERS, type Voucher } from "@/data/phase3/vouchers";
import { Phase3Sprite } from "@/components/Phase3Sprite";
import { ValueTierBadge } from "@/components/phase3Primitives";
import { FilterPill } from "@/components/FilterPills";
import { useOpenDetail } from "@/lib/detailContext";
import { LName, LText } from "@/components/Localized";
import { useT } from "@/lib/i18n";

const TIERS = ["S", "A", "B", "C"] as const;

function VoucherNode({ v }: { v: Voucher }) {
  const openDetail = useOpenDetail();
  return (
    <button
      type="button"
      onClick={() => openDetail("voucher", v.id)}
      data-testid={`voucher-${v.id}`}
      className="casino-card casino-card-interactive flex min-w-0 flex-1 items-start gap-3 p-3 text-left"
    >
      <Phase3Sprite category="vouchers" id={v.id} name={v.name} size={56} className="h-14 w-14" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-pixel text-sm text-accent"><LName category="vouchers" id={v.id} fallback={v.name} /></h3>
          <ValueTierBadge tier={v.valueTier} className="ml-auto shrink-0" />
        </div>
        <LText category="vouchers" id={v.id} fallback={v.effect} as="p" className="mt-1 text-xs leading-relaxed text-foreground/80" />
      </div>
    </button>
  );
}

export function VouchersTab() {
  const [tier, setTier] = useState<string | null>(null);
  const t = useT();

  // Pair tier-1 → tier-2 by prerequisite.
  const rows = useMemo(() => {
    const tier1 = VOUCHERS.filter((v) => v.tier === 1);
    return tier1.map((base) => ({
      base,
      upgrade: VOUCHERS.find((v) => v.tier === 2 && v.prerequisite === base.id) ?? null,
    }));
  }, []);

  const filtered = useMemo(
    () => (!tier ? rows : rows.filter((r) => r.base.valueTier === tier || r.upgrade?.valueTier === tier)),
    [rows, tier],
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-pixel text-xl text-accent">{t("ui.tabs.vouchers_title")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("ui.tabs.vouchers_subtitle")}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <FilterPill label={t("ui.filters.all_tiers")} active={!tier} onClick={() => setTier(null)} testId="filter-voucher-all" />
        {TIERS.map((tr) => (
          <FilterPill key={tr} label={t("ui.tabs.vouchers_tier_label", { tier: tr })} active={tier === tr} onClick={() => setTier(tr)} testId={`filter-voucher-${tr}`} />
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(({ base, upgrade }) => (
          <div
            key={base.id}
            className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center"
            data-testid={`voucher-row-${base.id}`}
          >
            <div className="flex sm:w-[46%]"><VoucherNode v={base} /></div>
            <div className="flex shrink-0 items-center justify-center self-center py-1 text-accent/60 sm:py-0">
              <ArrowRight className="h-5 w-5 rotate-90 sm:rotate-0" aria-label={t("ui.tabs.vouchers_upgrades_to")} />
            </div>
            <div className="flex sm:w-[46%]">
              {upgrade ? (
                <VoucherNode v={upgrade} />
              ) : (
                <div className="flex flex-1 items-center justify-center rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
                  {t("ui.tabs.vouchers_no_upgrade")}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
