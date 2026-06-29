import { useState } from "react";
import { cn } from "@/lib/utils";
import { getPhase3Sprite, type Phase3Category } from "@/lib/phase3Sprites";

export function Phase3Sprite({
  category,
  id,
  name,
  size = 64,
  accent,
  className,
  frame = false,
}: {
  category: Phase3Category;
  id: string;
  name: string;
  size?: number;

  accent?: string;
  className?: string;
  /** When true, render the legacy dark rounded container. Default false. */
  frame?: boolean;
}) {
  const url = getPhase3Sprite(category, id);
  const [failed, setFailed] = useState(false);
  const showImg = url && !failed;

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden",
        frame && "rounded-md border border-accent/20 bg-[hsl(150_16%_6%)] shadow-inner",
        className,
      )}
      style={{
        width: size,
        height: size,
        ...(frame && accent ? { borderColor: `${accent}55` } : {}),
      }}
      data-testid={`sprite-${category}-${id}`}
    >
      {showImg ? (
        <img
          src={url}
          alt={name}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className={cn("h-full w-full object-contain", frame && "p-1")}
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

