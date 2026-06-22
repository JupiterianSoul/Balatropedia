import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useApp } from "@/lib/appContext";
import { ARCHETYPES } from "@/lib/helpers";
import { JokerChip, SectionLabel } from "@/components/primitives";
import { cn } from "@/lib/utils";

export function ArchetypesTab() {
  const { openJokerDetail } = useApp();
  const [openId, setOpenId] = useState<string>(ARCHETYPES[0]?.id ?? "");

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {ARCHETYPES.map((a) => {
        const expanded = openId === a.id;
        return (
          <div
            key={a.id}
            className={cn(
              "casino-card overflow-hidden p-0 transition-all",
              expanded && "md:col-span-2 border-accent/30",
            )}
            data-testid={`tile-archetype-${a.id}`}
          >
            <button
              onClick={() => setOpenId(expanded ? "" : a.id)}
              className="flex w-full items-center justify-between gap-3 bg-primary/10 px-4 py-3 text-left hover-elevate"
              data-testid={`button-archetype-${a.id}`}
            >
              <span className="font-display text-base font-semibold text-accent">{a.name}</span>
              <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-180")} />
            </button>

            {expanded && (
              <div className="space-y-5 p-5">
                <blockquote className="border-l-2 border-accent pl-4 font-display text-lg leading-snug text-foreground/90">
                  {a.wants}
                </blockquote>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <SectionLabel>Enablers</SectionLabel>
                    <div className="flex flex-wrap gap-1.5">
                      {a.enablers.map((id) => <JokerChip key={id} id={id} onClick={openJokerDetail} testIdPrefix={`chip-enabler-${a.id}`} />)}
                    </div>
                  </div>
                  <div>
                    <SectionLabel>Scalers</SectionLabel>
                    <div className="flex flex-wrap gap-1.5">
                      {a.scalers.map((id) => <JokerChip key={id} id={id} onClick={openJokerDetail} testIdPrefix={`chip-scaler-${a.id}`} />)}
                    </div>
                  </div>
                </div>

                <div>
                  <SectionLabel>Bait — looks good, usually isn't</SectionLabel>
                  <div className="flex flex-wrap gap-1.5">
                    {a.bait.map((id) => <JokerChip key={id} id={id} tone="bait" strike onClick={openJokerDetail} testIdPrefix={`chip-bait-${a.id}`} />)}
                  </div>
                </div>

                <div className="border-t border-border pt-3">
                  <SectionLabel>Often lacks</SectionLabel>
                  <p className="text-sm italic leading-relaxed text-muted-foreground">{a.oftenLacks}</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
