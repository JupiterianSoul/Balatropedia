import { useState } from "react";
import { cn } from "@/lib/utils";
import { getSpriteUrl } from "@/lib/sprites";

export function JokerSprite({
  jokerId,
  name,
  size = 64,
  className,
}: {
  jokerId: string;
  name: string;
  size?: number;
  className?: string;
}) {
  const url = getSpriteUrl(jokerId);
  const [failed, setFailed] = useState(false);
  const showImg = url && !failed;

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-accent/20 bg-[hsl(150_16%_6%)] shadow-inner",
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden={false}
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
          className="font-display font-semibold text-accent/70"
          style={{ fontSize: Math.round(size * 0.42) }}
        >
          {name.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}

