import { useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { JOKERS, JOKER_MAP } from "@/lib/helpers";

/* Single-select combobox */
export function JokerCombobox({
  value,
  onChange,
  placeholder = "Select a Joker…",
  testId = "combobox-joker",
}: {
  value: string | null;
  onChange: (id: string) => void;
  placeholder?: string;
  testId?: string;
}) {
  const [open, setOpen] = useState(false);
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
            {value ? JOKER_MAP[value]?.name : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search Jokers…" />
          <CommandList>
            <CommandEmpty>No Joker found.</CommandEmpty>
            <CommandGroup>
              {JOKERS.map((j) => (
                <CommandItem
                  key={j.id}
                  value={j.name}
                  onSelect={() => { onChange(j.id); setOpen(false); }}
                  data-testid={`option-${j.id}`}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === j.id ? "opacity-100" : "opacity-0")} />
                  {j.name}
                </CommandItem>
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
            Add Joker {values.length > 0 && <span className="tabular">({values.length}/{max})</span>}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search Jokers…" />
          <CommandList>
            <CommandEmpty>No Joker found.</CommandEmpty>
            <CommandGroup>
              {JOKERS.map((j) => {
                const selected = values.includes(j.id);
                const disabled = atMax && !selected;
                return (
                  <CommandItem
                    key={j.id}
                    value={j.name}
                    disabled={disabled}
                    onSelect={() => toggle(j.id)}
                    data-testid={`option-multi-${j.id}`}
                    className={cn(disabled && "opacity-40")}
                  >
                    <Check className={cn("mr-2 h-4 w-4", selected ? "opacity-100 text-accent" : "opacity-0")} />
                    {j.name}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
