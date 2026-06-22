import { cn } from "@/lib/utils";
import { Star, AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Level, Role, Scaling, Stage, JOKER_MAP, Rarity,
} from "@/lib/helpers";
import { useLabels, useT, useGameText } from "@/lib/i18n";

/* ---- Rarity badge ---- */
const RARITY_TONE: Record<Rarity, string> = {
  common: "text-muted-foreground border-border bg-card",
  uncommon: "text-primary border-primary/40 bg-primary/10",
  rare: "text-[hsl(210_50%_65%)] border-[hsl(210_50%_65%)]/40 bg-[hsl(210_50%_65%)]/10",
  legendary: "text-accent border-accent/50 bg-accent/15 shadow-[0_0_8px_-2px_hsl(var(--accent)/0.4)]",
};
export function RarityBadge({ rarity, size = "sm", className }: { rarity: Rarity; size?: "sm" | "md"; className?: string }) {
  const labels = useLabels();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border font-semibold uppercase tracking-wider",
        size === "md" ? "px-2 py-0.5 text-[11px]" : "px-1.5 py-0.5 text-[10px]",
        RARITY_TONE[rarity],
        className,
      )}
      data-testid={`badge-rarity-${rarity}`}
    >
      {labels.rarity[rarity]}
    </span>
  );
}

/* ---- Role pill (flat chip) ---- */
export function RolePill({ role, className }: { role: Role; className?: string }) {
  const labels = useLabels();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground small-caps",
        className,
      )}
    >
      {labels.role[role]}
    </span>
  );
}

/* ---- Level badge with severity coloring ---- */
const LEVEL_TONE: Record<Level, string> = {
  low: "border-border text-muted-foreground",
  med: "border-accent/40 text-accent",
  high: "border-secondary/60 text-[hsl(350_60%_70%)]",
};
export function RiskBadge({ level }: { level: Level }) {
  const labels = useLabels();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide tabular",
        LEVEL_TONE[level],
      )}
      data-testid={`badge-risk-${level}`}
    >
      {labels.riskPrefix} {labels.level[level]}
    </span>
  );
}

const STAGE_TONE: Record<Stage, string> = {
  early: "border-[hsl(145_35%_40%)]/50 text-[hsl(145_45%_60%)]",
  mid: "border-accent/40 text-accent",
  late: "border-secondary/50 text-[hsl(350_55%_68%)]",
};
export function StageBadge({ stage }: { stage: Stage }) {
  const labels = useLabels();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        STAGE_TONE[stage],
      )}
    >
      {labels.stage[stage]}
    </span>
  );
}

export function ScalingBadge({ scaling }: { scaling: Scaling }) {
  const tone =
    scaling === "exponential" || scaling === "multiplicative"
      ? "border-accent/50 text-accent"
      : scaling === "static"
        ? "border-border text-muted-foreground"
        : "border-[hsl(145_35%_40%)]/50 text-[hsl(145_45%_60%)]";
  const labels = useLabels();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        tone,
      )}
    >
      {labels.scaling[scaling]}
    </span>
  );
}

/* ---- Star favorite toggle ---- */
export function StarToggle({
  active,
  onToggle,
  testId,
  size = 16,
}: {
  active: boolean;
  onToggle: () => void;
  testId: string;
  size?: number;
}) {
  const t = useT();
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      aria-label={active ? t("ui.favStar.remove") : t("ui.favStar.add")}
      aria-pressed={active}
      data-testid={testId}
      className="rounded-sm p-1 text-muted-foreground transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Star
        size={size}
        className={cn(active && "fill-accent text-accent")}
      />
    </button>
  );
}

/* ---- Clickable joker chip — opens detail ---- */
export function JokerChip({
  id,
  onClick,
  tone = "default",
  strike = false,
  testIdPrefix = "chip-joker",
}: {
  id: string;
  onClick?: (id: string) => void;
  tone?: "default" | "anti" | "bait";
  strike?: boolean;
  testIdPrefix?: string;
}) {
  const t = useT();
  const j = JOKER_MAP[id];
  const localized = useGameText("jokers", id);
  const name = localized.name || j?.name || id;
  const toneCls =
    tone === "anti"
      ? "border-destructive/60 text-[hsl(0_60%_70%)] hover:border-destructive"
      : tone === "bait"
        ? "border-secondary/50 text-[hsl(350_55%_70%)] hover:border-secondary"
        : "border-border text-foreground/90 hover:border-accent/50 hover:text-accent";

  const content = (
    <button
      type="button"
      onClick={() => onClick?.(id)}
      disabled={!onClick}
      data-testid={`${testIdPrefix}-${id}`}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border bg-card px-2.5 py-1 text-xs font-medium transition-colors",
        toneCls,
        strike && "line-through opacity-80",
        !onClick && "cursor-default",
      )}
    >
      {tone === "bait" && <AlertTriangle size={11} className="shrink-0" />}
      <span>{name}</span>
    </button>
  );

  if (tone === "anti") {
    const reason = localized.text || j?.summary || t("ui.chip.generic_conflict");
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs">{reason}</TooltipContent>
      </Tooltip>
    );
  }
  return content;
}

/* ---- Level indicator dots (for compare) ---- */
export function LevelDots({ level }: { level: Level }) {
  const labels = useLabels();
  const filled = level === "high" ? 3 : level === "med" ? 2 : 1;
  return (
    <span className="inline-flex items-center gap-1" aria-label={labels.level[level]}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn(
            "h-2 w-2 rounded-full",
            i < filled ? "bg-accent" : "bg-muted",
          )}
        />
      ))}
      <span className="ml-1 text-xs text-muted-foreground tabular">{labels.level[level]}</span>
    </span>
  );
}

/* ---- Section heading ---- */
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-accent/80">
      {children}
    </h4>
  );
}
