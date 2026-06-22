import { cn } from "@/lib/utils";
import { useGameText } from "@/lib/i18n";
import { useApp } from "@/lib/appContext";
import { useOpenDetail } from "@/lib/detailContext";
import { JokerSprite } from "@/components/JokerSprite";
import { Phase3Sprite } from "@/components/Phase3Sprite";
import {
  type EntityKind,
  KIND_TO_SPRITE_CATEGORY,
  KIND_TO_I18N_CATEGORY,
} from "@/lib/entities";
import type { Phase3Category } from "@/lib/phase3Sprites";

/**
 * Clickable chip for any game entity. Shows the localized name + sprite and
 * opens the appropriate detail surface on click. Jokers route through the
 * existing JokerDetailSheet (appContext); all other kinds go through the
 * global EntityDetailSheet (detailContext).
 */
export function EntityChip({
  kind,
  id,
  size = 18,
  className,
  testIdPrefix = "chip-entity",
}: {
  kind: EntityKind;
  id: string;
  size?: number;
  className?: string;
  testIdPrefix?: string;
}) {
  const { openJokerDetail } = useApp();
  const openDetail = useOpenDetail();
  const { name } = useGameText(KIND_TO_I18N_CATEGORY[kind], id);

  function handleClick() {
    if (kind === "joker") openJokerDetail(id);
    else openDetail(kind, id);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      data-testid={`${testIdPrefix}-${kind}-${id}`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2 py-1 text-xs font-medium text-foreground/90 transition-colors hover:border-accent/50 hover:text-foreground",
        className,
      )}
    >
      {kind === "joker" ? (
        <JokerSprite jokerId={id} name={name} size={size} className="rounded" />
      ) : (
        <Phase3Sprite
          category={KIND_TO_SPRITE_CATEGORY[kind] as Phase3Category}
          id={id}
          name={name}
          size={size}
          className="rounded"
        />
      )}
      <span className="whitespace-nowrap">{name}</span>
    </button>
  );
}
