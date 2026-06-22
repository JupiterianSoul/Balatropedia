import { useApp } from "@/lib/appContext";
import { Joker } from "@/lib/helpers";
import { RolePill, RiskBadge, StageBadge, StarToggle } from "./primitives";

export function JokerCard({ joker }: { joker: Joker }) {
  const { openJokerDetail, isFavoriteJoker, toggleFavoriteJoker } = useApp();
  const visibleRoles = joker.tags.slice(0, 3);
  const extra = joker.tags.length - visibleRoles.length;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => openJokerDetail(joker.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openJokerDetail(joker.id);
        }
      }}
      data-testid={`card-joker-${joker.id}`}
      className="casino-card casino-card-interactive group flex cursor-pointer flex-col p-3.5 focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display text-base font-semibold leading-tight text-accent">
          {joker.name}
        </h3>
        <StarToggle
          active={isFavoriteJoker(joker.id)}
          onToggle={() => toggleFavoriteJoker(joker.id)}
          testId={`button-favorite-${joker.id}`}
        />
      </div>

      <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-foreground/80 small-caps">
        {joker.summary}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {visibleRoles.map((r) => (
          <RolePill key={r} role={r} />
        ))}
        {extra > 0 && (
          <span className="inline-flex items-center rounded-full border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground">
            +{extra}
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border pt-2.5">
        {joker.stage.map((s) => (
          <StageBadge key={s} stage={s} />
        ))}
        <RiskBadge level={joker.risk} />
      </div>
    </div>
  );
}
