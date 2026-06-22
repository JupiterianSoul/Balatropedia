import { useApp } from "@/lib/appContext";
import { Joker } from "@/lib/helpers";
import { useGameText, useI18n } from "@/lib/i18n";
import { RolePill, RiskBadge, StageBadge, StarToggle, RarityBadge } from "./primitives";
import { JokerSprite } from "./JokerSprite";
import { playSound } from "@/lib/sound";
import { FormattedBalatroText } from "@/lib/balatroText";

export function JokerCard({ joker }: { joker: Joker }) {
  const { openJokerDetail, isFavoriteJoker, toggleFavoriteJoker } = useApp();
  const localized = useGameText("jokers", joker.id);
  const { lang } = useI18n();
  const displayName = localized.name || joker.name;
  const visibleRoles = joker.tags.slice(0, 3);
  const extra = joker.tags.length - visibleRoles.length;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => { playSound("card_place"); openJokerDetail(joker.id); }}
      onMouseEnter={() => playSound("hover")}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openJokerDetail(joker.id);
        }
      }}
      data-testid={`card-joker-${joker.id}`}
      className="balatro-card balatro-hover group flex cursor-pointer flex-col p-3.5 focus-visible:ring-2 focus-visible:ring-ring"
      style={{ contentVisibility: "auto", containIntrinsicSize: "auto 180px" } as React.CSSProperties}
    >
      {joker.rarity && (
        <div className="mb-1.5">
          <RarityBadge rarity={joker.rarity} />
        </div>
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2.5">
          <JokerSprite jokerId={joker.id} name={displayName} size={48} className="h-12 w-12 sm:h-14 sm:w-14" />
          <h3 className="min-w-0 font-display text-base font-bold leading-tight gold-text">
            {displayName}
          </h3>
        </div>
        <StarToggle
          active={isFavoriteJoker(joker.id)}
          onToggle={() => toggleFavoriteJoker(joker.id)}
          testId={`button-favorite-${joker.id}`}
        />
      </div>

      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-foreground/80 small-caps">
        <FormattedBalatroText text={localized.text || joker.summary} id={joker.id} lang={lang} />
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {visibleRoles.map((r) => (
          <RolePill key={r} role={r} />
        ))}
        {extra > 0 && (
          <span className="font-display inline-flex items-center rounded-md border-2 border-[hsl(198_18%_9%)] bg-gradient-to-b from-[hsl(198_14%_25%)] to-[hsl(198_14%_15%)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/90 shadow-[inset_0_1px_0_hsl(0_0%_100%/0.2),0_2px_0_hsl(198_18%_4%)]">
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
