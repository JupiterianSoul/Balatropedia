import { useState } from "react";
import { X, Plus, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { DECKS } from "@/data/phase3/decks";
import { STAKES } from "@/data/phase3/stakes";
import { VOUCHERS } from "@/data/phase3/vouchers";
import { Phase3Sprite } from "@/components/Phase3Sprite";
import { SectionLabel } from "@/components/primitives";
import { useRun } from "@/lib/runContext";
import { useT, useGameText } from "@/lib/i18n";
import { LName, LText } from "@/components/Localized";

function VoucherRow({
  v,
  selected,
  onSelect,
}: {
  v: { id: string; name: string; tier: number };
  selected: boolean;
  onSelect: () => void;
}) {
  const { name } = useGameText("vouchers", v.id);
  const label = name || v.name;
  return (
    <CommandItem
      value={`${label} ${v.name}`}
      onSelect={onSelect}
      data-testid={`voucher-option-${v.id}`}
    >
      <Check className={cn("mr-2 h-4 w-4", selected ? "opacity-100 text-accent" : "opacity-0")} />
      <span className="flex-1">{label}</span>
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">T{v.tier}</span>
    </CommandItem>
  );
}

const DECK_MAP = Object.fromEntries(DECKS.map((d) => [d.id, d]));
const STAKE_MAP = Object.fromEntries(STAKES.map((s) => [s.id, s]));
const VOUCHER_MAP = Object.fromEntries(VOUCHERS.map((v) => [v.id, v]));

export function RunMetaSelectors() {
  const {
    deckId, setDeckId, stakeId, setStakeId, voucherIds, addVoucher, removeVoucher,
  } = useRun();
  const [vOpen, setVOpen] = useState(false);
  const t = useT();

  const deck = deckId ? DECK_MAP[deckId] : null;
  const stake = stakeId ? STAKE_MAP[stakeId] : null;

  return (
    <section className="casino-card space-y-4 p-4" data-testid="run-meta-selectors">
      <div className="grid gap-4 md:grid-cols-2">
        {}
        <div>
          <SectionLabel>{t("ui.runmeta.deck")}</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {DECKS.map((d) => (
              <button
                key={d.id}
                onClick={() => setDeckId(deckId === d.id ? null : d.id)}
                aria-pressed={deckId === d.id}
                data-testid={`pick-deck-${d.id}`}
                title={d.name }
                className={cn(
                  "rounded-md border p-0.5 transition-all",
                  deckId === d.id
                    ? "border-accent ring-2 ring-accent/40"
                    : "border-border opacity-75 hover:opacity-100 hover:border-accent/40",
                )}
              >
                <Phase3Sprite category="decks" id={d.id} name={d.name} size={40} className="h-10 w-10 border-0" />
              </button>
            ))}
          </div>
          {deck && (
            <p className="mt-2 text-xs leading-relaxed text-foreground/80" data-testid="text-deck-effect">
              <span className="font-display text-accent"><LName category="decks" id={deck.id} fallback={deck.name} />:</span> <LText category="decks" id={deck.id} fallback={deck.effect} />
            </p>
          )}
        </div>

        {}
        <div>
          <SectionLabel>{t("ui.runmeta.stake")}</SectionLabel>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between bg-card font-normal" data-testid="select-stake">
                <span className="flex items-center gap-2">
                  {stake && <span className="h-3 w-3 rounded-full border border-border" style={{ background: stake.color }} />}
                  <span className={cn(!stake && "text-muted-foreground")}>{stake ? <LName category="stakes" id={stake.id} fallback={stake.name} /> : t("ui.runmeta.select_stake")}</span>
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-1" align="start">
              <button
                onClick={() => setStakeId(null)}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted"
                data-testid="stake-option-none"
              >
                <span className="h-3 w-3 rounded-full border border-dashed border-border" /> {t("ui.runmeta.none")}
              </button>
              {STAKES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStakeId(s.id)}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted"
                  data-testid={`stake-option-${s.id}`}
                >
                  <span className="h-3 w-3 rounded-full border border-border" style={{ background: s.color }} />
                  <span className="flex-1 text-left"><LName category="stakes" id={s.id} fallback={s.name} /></span>
                  {stakeId === s.id && <Check className="h-4 w-4 text-accent" />}
                </button>
              ))}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <SectionLabel>{t("ui.runmeta.active_vouchers")}</SectionLabel>
          <Popover open={vOpen} onOpenChange={setVOpen}>
            <PopoverTrigger asChild>
              <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" data-testid="button-add-voucher">
                <Plus className="h-3.5 w-3.5" /> {t("ui.runmeta.add_voucher")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="end">
              <Command>
                <CommandInput placeholder={t("ui.runmeta.search_vouchers")} />
                <CommandList>
                  <CommandEmpty>{t("ui.runmeta.no_voucher")}</CommandEmpty>
                  <CommandGroup>
                    {VOUCHERS.map((v) => {
                      const selected = voucherIds.includes(v.id);
                      return (
                        <VoucherRow
                          key={v.id}
                          v={v}
                          selected={selected}
                          onSelect={() => (selected ? removeVoucher(v.id) : addVoucher(v.id))}
                        />
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        {voucherIds.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t("ui.runmeta.no_vouchers_yet")}</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {voucherIds.map((id) => {
              const v = VOUCHER_MAP[id];
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 py-0.5 pl-1 pr-1.5 text-xs text-accent"
                  data-testid={`voucher-chip-${id}`}
                >
                  <Phase3Sprite category="vouchers" id={id} name={v?.name ?? id} size={20} className="h-5 w-5 border-0" />
                  <LName category="vouchers" id={id} fallback={v?.name ?? id} />
                  <button
                    onClick={() => removeVoucher(id)}
                    aria-label={t("ui.runmeta.remove_voucher", { name: v?.name ?? id })}
                    data-testid={`remove-voucher-${id}`}
                    className="rounded-sm text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

