import { cn, humanize } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { JokerSprite } from "@/components/JokerSprite";
import { JOKER_MAP } from "@/lib/helpers";
import { useApp } from "@/lib/appContext";

const DIFF_TONE: Record<string, string> = {
  low: "border-[hsl(145_35%_40%)]/50 text-[hsl(145_45%_62%)] bg-[hsl(145_45%_40%)]/10",
  medium: "border-accent/40 text-accent bg-accent/10",
  high: "border-secondary/55 text-[hsl(350_60%_70%)] bg-secondary/10",
  extreme: "border-destructive/60 text-[hsl(0_65%_70%)] bg-destructive/10",
};
const DIFF_LABEL: Record<string, string> = {
  low: "Low", medium: "Medium", high: "High", extreme: "Extreme",
};
export function DifficultyBadge({ difficulty, className }: { difficulty: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        DIFF_TONE[difficulty] ?? DIFF_TONE.medium,
        className,
      )}
      data-testid={`badge-difficulty-${difficulty}`}
    >
      {DIFF_LABEL[difficulty] ?? humanize(difficulty)}
    </span>
  );
}

const RISK_TONE: Record<string, string> = {
  low: "border-[hsl(145_35%_40%)]/50 text-[hsl(145_45%_62%)] bg-[hsl(145_45%_40%)]/10",
  medium: "border-accent/40 text-accent bg-accent/10",
  high: "border-destructive/60 text-[hsl(0_65%_70%)] bg-destructive/10",
};
export function RiskBadgeP3({ risk }: { risk: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        RISK_TONE[risk] ?? RISK_TONE.medium,
      )}
      data-testid={`badge-risk-${risk}`}
    >
      {humanize(risk)} risk
    </span>
  );
}

const VTIER_TONE: Record<string, string> = {
  S: "border-[hsl(45_85%_55%)]/60 text-[hsl(45_85%_62%)] bg-[hsl(45_85%_50%)]/12",
  A: "border-[hsl(145_45%_45%)]/55 text-[hsl(145_50%_62%)] bg-[hsl(145_45%_40%)]/10",
  B: "border-[hsl(210_60%_58%)]/55 text-[hsl(210_60%_68%)] bg-[hsl(210_60%_55%)]/10",
  C: "border-border text-muted-foreground bg-muted/40",
};
export function ValueTierBadge({ tier, className }: { tier: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 min-w-[20px] items-center justify-center rounded-sm border px-1 text-[11px] font-bold tabular",
        VTIER_TONE[tier] ?? VTIER_TONE.C,
        className,
      )}
      data-testid={`badge-value-${tier}`}
    >
      {tier}
    </span>
  );
}

export function Chip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function JokerSpriteChip({ id, size = 30 }: { id: string; size?: number }) {
  const { openJokerDetail } = useApp();
  const j = JOKER_MAP[id];
  const name = j?.name ?? humanize(id);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={() => openJokerDetail(id)}
          data-testid={`chip-bestwith-joker-${id}`}
          className="inline-flex rounded-md outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <JokerSprite jokerId={id} name={name} size={size} className="h-[var(--s)] w-[var(--s)]" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="text-xs">{name}</TooltipContent>
    </Tooltip>
  );
}

export function JokerSpriteRow({ ids, size = 30 }: { ids: string[]; size?: number }) {
  if (!ids?.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {ids.map((id) => (
        <JokerSpriteChip key={id} id={id} size={size} />
      ))}
    </div>
  );
}

export function SearchInput({
  value, onChange, placeholder, testId,
}: { value: string; onChange: (v: string) => void; placeholder: string; testId: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      data-testid={testId}
      className="h-9 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    />
  );
}

