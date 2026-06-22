import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useApp } from "@/lib/appContext";
import { ARCHETYPES, type Archetype } from "@/lib/helpers";
import { JokerChip, SectionLabel } from "@/components/primitives";
import { cn } from "@/lib/utils";
import { useT, useLabels, useCuratedText } from "@/lib/i18n";

interface ArchetypeRowProps {
  a: typeof ARCHETYPES[number];
  expanded: boolean;
  onToggle: () => void;
  archName: string;
  openJokerDetail: (id: string) => void;
  tLabels: {
    enablers: string;
    scalers: string;
    bait: string;
    oftenLacks: string;
  };
}

function ArchetypeRow({ a, expanded, onToggle, archName, openJokerDetail, tLabels }: ArchetypeRowProps) {
  const wants = useCuratedText(`ui.archetype.${a.id}.wants`, a.wants);
  const oftenLacks = useCuratedText(`ui.archetype.${a.id}.oftenLacks`, a.oftenLacks);
  return (
    <div
      className={cn(
        "casino-card overflow-hidden p-0 transition-all",
        expanded && "md:col-span-2 border-accent/30",
      )}
      data-testid={`tile-archetype-${a.id}`}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 bg-primary/10 px-4 py-3 text-left hover-elevate"
        data-testid={`button-archetype-${a.id}`}
      >
        <span className="font-display text-base font-semibold text-accent">{archName}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-180")} />
      </button>

      {expanded && (
        <div className="space-y-5 p-5">
          <blockquote className="border-l-2 border-accent pl-4 font-display text-lg leading-snug text-foreground/90">
            {wants}
          </blockquote>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <SectionLabel>{tLabels.enablers}</SectionLabel>
              <div className="flex flex-wrap gap-1.5">
                {a.enablers.map((id) => <JokerChip key={id} id={id} onClick={openJokerDetail} testIdPrefix={`chip-enabler-${a.id}`} />)}
              </div>
            </div>
            <div>
              <SectionLabel>{tLabels.scalers}</SectionLabel>
              <div className="flex flex-wrap gap-1.5">
                {a.scalers.map((id) => <JokerChip key={id} id={id} onClick={openJokerDetail} testIdPrefix={`chip-scaler-${a.id}`} />)}
              </div>
            </div>
          </div>

          <div>
            <SectionLabel>{tLabels.bait}</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {a.bait.map((id) => <JokerChip key={id} id={id} tone="bait" strike onClick={openJokerDetail} testIdPrefix={`chip-bait-${a.id}`} />)}
            </div>
          </div>

          <div className="border-t border-border pt-3">
            <SectionLabel>{tLabels.oftenLacks}</SectionLabel>
            <p className="text-sm italic leading-relaxed text-muted-foreground">{oftenLacks}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function ArchetypesTab() {
  const { openJokerDetail } = useApp();
  const t = useT();
  const labels = useLabels();
  const [openId, setOpenId] = useState<string>(ARCHETYPES[0]?.id ?? "");

  const tLabels = {
    enablers: t("ui.arch.enablers"),
    scalers: t("ui.arch.scalers"),
    bait: t("ui.arch.bait"),
    oftenLacks: t("ui.arch.often_lacks"),
  };

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {ARCHETYPES.map((a) => (
        <ArchetypeRow
          key={a.id}
          a={a}
          expanded={openId === a.id}
          onToggle={() => setOpenId(openId === a.id ? "" : a.id)}
          archName={labels.archetype[a.id as Archetype] ?? a.name}
          openJokerDetail={openJokerDetail}
          tLabels={tLabels}
        />
      ))}
    </div>
  );
}

