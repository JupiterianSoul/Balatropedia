import { useState } from "react";
import { cn } from "@/lib/utils";
import { getPhase3Sprite, type Phase3Category } from "@/lib/phase3Sprites";

/**
 * Lazy, pixel-art rendered sprite for any phase-3 entity (deck, stake, tarot,
 * planet, spectral, voucher, enhancement, edition, seal, tag).
 *
 * Falls back gracefully to a neutral square showing the entity's initial when
 * the sprite is missing in the manifest OR the proxied image 404s.
 */
export function Phase3Sprite({
  category,
  id,
  name,
  size = 64,
  accent,
  className,
}: {
  category: Phase3Category;
  id: string;
  name: string;
  size?: number;
  /** optional hex accent for the fallback monogram + border */
  accent?: string;
  className?: string;
}) {
  const url = getPhase3Sprite(category, id);
  const [failed, setFailed] = useState(false);
  const showImg = url && !failed;

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-accent/20 bg-[hsl(150_16%_6%)] shadow-inner",
        className,
      )}
      style={{ width: size, height: size, ...(accent ? { borderColor: `${accent}55` } : {}) }}
      data-testid={`sprite-${category}-${id}`}
    >
      {showImg ? (
        <img
          src={url}
          alt={name}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-contain p-1"
          style={{
            imageRendering: "pixelated",
            // @ts-expect-error vendor fallback
            WebkitImageRendering: "crisp-edges",
          }}
          draggable={false}
        />
      ) : (
        <span
          className="font-display font-semibold"
          style={{ fontSize: Math.round(size * 0.42), color: accent ?? "hsl(var(--accent) / 0.7)" }}
        >
          {name.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}
