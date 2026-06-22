import { useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { JOKERS, JOKER_MAP } from "@/lib/helpers";
import { useT, useGameText } from "@/lib/i18n";

/** Localized name for selected-value display (used in trigger button). */
function SelectedName({ id }: { id: string }) {
  const { name } = useGameText("jokers", id);
  return <>{name || JOKER_MAP[id]?.name || id}</>;
}

/** Per-row command item with localized name; localized text is used as the
 *  cmdk search value so users can search in their active language. */
function LocalizedItem({
  joker,
  testId,
  onSelect,
  selected,
  disabled,
}: {
  joker: { id: string; name: string };
  testId: string;
  onSelect: () => void;
  selected: boolean;
  disabled?: boolean;
}) {
  const { name } = useGameText("jokers", joker.id);
  const label = name || joker.name;
  // Include the EN name as a hidden keyword so search still works for users
  // who know the EN names while their UI is in FR/ES.
  const value = `${label} ${joker.name}`;
  return (
    <CommandItem
      value={value}
      disabled={disabled}
      onSelect={onSelect}
      data-testid={testId}
      className={cn(disabled && "opacity-40")}
    >
      <Check className={cn("mr-2 h-4 w-4", selected ? "opacity-100 text-accent" : "opacity-0")} />
      {label}
    </CommandItem>
  );
}

/* Single-select combobox */
export function JokerCombobox({
  value,
  onChange,
  placeholder,
  testId = "combobox-joker",
}: {
  value: string | null;
  onChange: (id: string) => void;
  placeholder?: string;
  testId?: string;
}) {
  const [open, setOpen] = useState(false);
  const t = useT();
  const ph = placeholder ?? t("ui.combobox.select_joker");
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          data-testid={testId}
          className="w-full justify-between bg-card font-normal"
        >
          <span className={cn(!value && "text-muted-foreground")}>
            {value ? <SelectedName id={value} /> : ph}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder={t("ui.combobox.search_jokers")} />
          <CommandList>
            <CommandEmpty>{t("ui.combobox.no_joker")}</CommandEmpty>
            <CommandGroup>
              {JOKERS.map((j) => (
                <LocalizedItem
                  key={j.id}
                  joker={j}
                  testId={`option-${j.id}`}
                  selected={value === j.id}
                  onSelect={() => { onChange(j.id); setOpen(false); }}
                />
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/* Multi-select combobox with a max cap */
export function JokerMultiCombobox({
  values,
  onChange,
  max,
  testId = "combobox-multi",
}: {
  values: string[];
  onChange: (ids: string[]) => void;
  max: number;
  testId?: string;
}) {
  const [open, setOpen] = useState(false);
  const t = useT();
  const atMax = values.length >= max;

  function toggle(id: string) {
    if (values.includes(id)) onChange(values.filter((v) => v !== id));
    else if (!atMax) onChange([...values, id]);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          data-testid={testId}
          className="w-full justify-between bg-card font-normal"
        >
          <span className="flex items-center gap-2 text-muted-foreground">
            <Plus className="h-4 w-4" />
            {t("ui.combobox.add_joker")} {values.length > 0 && <span className="tabular">({values.length}/{max})</span>}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder={t("ui.combobox.search_jokers")} />
          <CommandList>
            <CommandEmpty>{t("ui.combobox.no_joker")}</CommandEmpty>
            <CommandGroup>
              {JOKERS.map((j) => {
                const selected = values.includes(j.id);
                const disabled = atMax && !selected;
                return (
                  <LocalizedItem
                    key={j.id}
                    joker={j}
                    testId={`option-multi-${j.id}`}
                    selected={selected}
                    disabled={disabled}
                    onSelect={() => toggle(j.id)}
                  />
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
