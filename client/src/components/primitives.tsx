import { cn } from "@/lib/utils";
import { Star, AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Level, Role, Scaling, Stage, JOKER_MAP, Rarity, Popularity, Difficulty,
} from "@/lib/helpers";
import { useLabels, useT, useGameText } from "@/lib/i18n";
import { playSound } from "@/lib/sound";

const RARITY_TONE: Record<Rarity, string> = {
  common: "bg-gradient-to-b from-[hsl(40_14%_85%)] to-[hsl(40_14%_70%)] text-[hsl(198_18%_9%)] border-[hsl(198_18%_9%)]",
  uncommon: "bg-gradient-to-b from-[hsl(206_100%_60%)] to-[hsl(206_100%_45%)] text-white border-[hsl(198_18%_9%)]",
  rare: "bg-gradient-to-b from-[hsl(4_99%_72%)] to-[hsl(4_99%_60%)] text-white border-[hsl(198_18%_9%)]",
  legendary: "bg-gradient-to-b from-[hsl(282_50%_65%)] to-[hsl(282_45%_50%)] text-white border-[hsl(198_18%_9%)] shadow-[0_0_12px_-2px_hsl(282_50%_55%/0.7)]",
};
export function RarityBadge({ rarity, size = "sm", className }: { rarity: Rarity; size?: "sm" | "md"; className?: string }) {
  const labels = useLabels();
  return (
    <span
      className={cn(
        "font-display inline-flex items-center rounded-md border-2 font-semibold uppercase tracking-wider",
        "shadow-[inset_0_1px_0_hsl(0_0%_100%/0.4),0_2px_0_hsl(198_18%_4%)]",
        size === "md" ? "px-2 py-0.5 text-[11px]" : "px-1.5 py-0.5 text-[10px]",
        RARITY_TONE[rarity],
        className,
      )}
      style={{ textShadow: "0 1px 0 rgba(0,0,0,0.3)" }}
      data-testid={`badge-rarity-${rarity}`}
    >
      {labels.rarity[rarity]}
    </span>
  );
}

export function RolePill({ role, className }: { role: Role; className?: string }) {
  const labels = useLabels();
  return (
    <span
      className={cn(
        "font-display inline-flex items-center rounded-md border-2 border-[hsl(198_18%_9%)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        "bg-gradient-to-b from-[hsl(45_25%_24%)] to-[hsl(45_25%_16%)] text-[hsl(45_85%_70%)]",
        "shadow-[inset_0_1px_0_hsl(0_0%_100%/0.18),0_2px_0_hsl(198_18%_4%)]",
        className,
      )}
      style={{ textShadow: "0 1px 0 rgba(0,0,0,0.45)" }}
      data-testid={`badge-role-${role}`}
    >
      {labels.role[role]}
    </span>
  );
}

const LEVEL_TONE: Record<Level, string> = {
  low: "bg-gradient-to-b from-[hsl(144_50%_60%)] to-[hsl(144_50%_42%)] text-white",
  med: "bg-gradient-to-b from-[hsl(45_85%_65%)] to-[hsl(45_85%_50%)] text-[hsl(198_18%_9%)]",
  high: "bg-gradient-to-b from-[hsl(4_99%_72%)] to-[hsl(4_99%_58%)] text-white",
};
export function RiskBadge({ level }: { level: Level }) {
  const labels = useLabels();
  return (
    <span
      className={cn(
        "font-display inline-flex items-center gap-1 rounded-md border-2 border-[hsl(198_18%_9%)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        "shadow-[inset_0_1px_0_hsl(0_0%_100%/0.3),0_2px_0_hsl(198_18%_4%)]",
        LEVEL_TONE[level],
      )}
      style={{ textShadow: "0 1px 0 rgba(0,0,0,0.3)" }}
      data-testid={`badge-risk-${level}`}
    >
      {labels.riskPrefix} {labels.level[level]}
    </span>
  );
}

const STAGE_TONE: Record<Stage, string> = {
  early: "bg-gradient-to-b from-[hsl(144_50%_60%)] to-[hsl(144_50%_42%)] text-white",
  mid: "bg-gradient-to-b from-[hsl(45_85%_65%)] to-[hsl(45_85%_50%)] text-[hsl(198_18%_9%)]",
  late: "bg-gradient-to-b from-[hsl(206_100%_60%)] to-[hsl(206_100%_45%)] text-white",
};
export function StageBadge({ stage }: { stage: Stage }) {
  const labels = useLabels();
  return (
    <span
      className={cn(
        "font-display inline-flex items-center rounded-md border-2 border-[hsl(198_18%_9%)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        "shadow-[inset_0_1px_0_hsl(0_0%_100%/0.3),0_2px_0_hsl(198_18%_4%)]",
        STAGE_TONE[stage],
      )}
      style={{ textShadow: "0 1px 0 rgba(0,0,0,0.3)" }}
      data-testid={`badge-stage-${stage}`}
    >
      {labels.stage[stage]}
    </span>
  );
}

export function ScalingBadge({ scaling }: { scaling: Scaling }) {
  const tone =
    scaling === "exponential"
      ? "bg-gradient-to-b from-[hsl(282_50%_65%)] to-[hsl(282_45%_48%)] text-white shadow-[inset_0_1px_0_hsl(0_0%_100%/0.3),0_2px_0_hsl(198_18%_4%),0_0_10px_-2px_hsl(282_50%_55%/0.6)]"
      : scaling === "multiplicative"
        ? "bg-gradient-to-b from-[hsl(4_99%_72%)] to-[hsl(4_99%_58%)] text-white shadow-[inset_0_1px_0_hsl(0_0%_100%/0.3),0_2px_0_hsl(198_18%_4%)]"
        : scaling === "static"
          ? "bg-gradient-to-b from-[hsl(40_14%_85%)] to-[hsl(40_14%_70%)] text-[hsl(198_18%_9%)] shadow-[inset_0_1px_0_hsl(0_0%_100%/0.5),0_2px_0_hsl(198_18%_4%)]"
          : "bg-gradient-to-b from-[hsl(206_100%_60%)] to-[hsl(206_100%_45%)] text-white shadow-[inset_0_1px_0_hsl(0_0%_100%/0.3),0_2px_0_hsl(198_18%_4%)]";
  const labels = useLabels();
  return (
    <span
      className={cn(
        "font-display inline-flex items-center rounded-md border-2 border-[hsl(198_18%_9%)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        tone,
      )}
      style={{ textShadow: "0 1px 0 rgba(0,0,0,0.3)" }}
      data-testid={`badge-scaling-${scaling}`}
    >
      {labels.scaling[scaling]}
    </span>
  );
}

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
      data-no-sound
      onClick={(e) => {
        e.stopPropagation();
        playSound(active ? "toggle_off" : "favorite");
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
      ? "bg-gradient-to-b from-[hsl(4_99%_72%)] to-[hsl(4_99%_55%)] text-white border-[hsl(198_18%_9%)] hover:from-[hsl(4_99%_76%)] hover:to-[hsl(4_99%_60%)]"
      : tone === "bait"
        ? "bg-gradient-to-b from-[hsl(35_100%_60%)] to-[hsl(35_100%_45%)] text-white border-[hsl(198_18%_9%)] hover:from-[hsl(35_100%_65%)] hover:to-[hsl(35_100%_50%)]"
        : "bg-gradient-to-b from-[hsl(206_100%_60%)] to-[hsl(206_100%_42%)] text-white border-[hsl(198_18%_9%)] hover:from-[hsl(206_100%_65%)] hover:to-[hsl(206_100%_48%)]";

  const content = (
    <button
      type="button"
      onClick={() => onClick?.(id)}
      disabled={!onClick}
      data-testid={`${testIdPrefix}-${id}`}
      className={cn(
        "font-display inline-flex items-center gap-1 rounded-md border-2 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider transition-all",
        "shadow-[inset_0_1px_0_hsl(0_0%_100%/0.3),0_2px_0_hsl(198_18%_4%)] hover:-translate-y-px hover:shadow-[inset_0_1px_0_hsl(0_0%_100%/0.4),0_3px_0_hsl(198_18%_4%)]",
        toneCls,
        strike && "line-through opacity-80",
        !onClick && "cursor-default",
      )}
      style={{ textShadow: "0 1px 0 rgba(0,0,0,0.4)" }}
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

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-accent/80">
      {children}
    </h4>
  );
}


const POPULARITY_TONE: Record<Popularity, string> = {
  staple: "bg-gradient-to-b from-[hsl(45_85%_65%)] to-[hsl(45_85%_50%)] text-[hsl(198_18%_9%)]",
  common: "bg-gradient-to-b from-[hsl(206_55%_60%)] to-[hsl(206_55%_45%)] text-white",
  niche: "bg-gradient-to-b from-[hsl(220_10%_50%)] to-[hsl(220_10%_38%)] text-white",
};
export function PopularityBadge({ popularity }: { popularity: Popularity }) {
  const labels = useLabels();
  return (
    <span
      className={cn(
        "font-display inline-flex items-center gap-1 rounded-md border-2 border-[hsl(198_18%_9%)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        "shadow-[inset_0_1px_0_hsl(0_0%_100%/0.3),0_2px_0_hsl(198_18%_4%)]",
        POPULARITY_TONE[popularity],
      )}
      style={{ textShadow: "0 1px 0 rgba(0,0,0,0.3)" }}
      data-testid={`badge-popularity-${popularity}`}
      title={labels.popularityLabel}
    >
      {labels.popularity[popularity]}
    </span>
  );
}

const DIFFICULTY_TONE: Record<Difficulty, string> = {
  easy: "bg-gradient-to-b from-[hsl(144_50%_60%)] to-[hsl(144_50%_42%)] text-white",
  moderate: "bg-gradient-to-b from-[hsl(45_85%_65%)] to-[hsl(45_85%_50%)] text-[hsl(198_18%_9%)]",
  hard: "bg-gradient-to-b from-[hsl(4_99%_72%)] to-[hsl(4_99%_58%)] text-white",
};
export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const labels = useLabels();
  return (
    <span
      className={cn(
        "font-display inline-flex items-center gap-1 rounded-md border-2 border-[hsl(198_18%_9%)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        "shadow-[inset_0_1px_0_hsl(0_0%_100%/0.3),0_2px_0_hsl(198_18%_4%)]",
        DIFFICULTY_TONE[difficulty],
      )}
      style={{ textShadow: "0 1px 0 rgba(0,0,0,0.3)" }}
      data-testid={`badge-difficulty-${difficulty}`}
      title={labels.difficultyLabel}
    >
      {labels.difficulty[difficulty]}
    </span>
  );
}
