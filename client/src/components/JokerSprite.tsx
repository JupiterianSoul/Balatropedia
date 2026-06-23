import { useState, MouseEvent } from "react";
import { cn } from "@/lib/utils";
import { getSpriteUrl } from "@/lib/sprites";
import { useApp } from "@/lib/appContext";

export function JokerSprite({
  jokerId,
  name,
  size = 64,
  className,
  clickable = true,
  onClick,
}: {
  jokerId: string;
  name: string;
  size?: number;
  className?: string;
  /** When true (default), clicking the sprite opens the joker detail sheet. */
  clickable?: boolean;
  /** Override the default openJokerDetail behavior. */
  onClick?: (jokerId: string) => void;
}) {
  const url = getSpriteUrl(jokerId);
  const [failed, setFailed] = useState(false);
  const showImg = url && !failed;

  // useApp can throw if rendered outside provider; gate the hook call via try.
  // Safe pattern: read directly since the entire app is wrapped in AppProvider.
  const { openJokerDetail } = useApp();

  const inner = (
    <>
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
    </>
  );

  const baseCls = cn(
    "flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-accent/20 bg-[hsl(150_16%_6%)] shadow-inner",
    className,
  );

  if (!clickable || !jokerId) {
    return (
      <div className={baseCls} style={{ width: size, height: size }} aria-hidden={false}>
        {inner}
      </div>
    );
  }

  const handle = (e: MouseEvent) => {
    e.stopPropagation();
    if (onClick) onClick(jokerId);
    else openJokerDetail(jokerId);
  };

  return (
    <button
      type="button"
      onClick={handle}
      className={cn(
        baseCls,
        "cursor-pointer transition-transform hover:scale-105 hover:border-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
      )}
      style={{ width: size, height: size }}
      title={name}
      aria-label={name}
      data-sound="click"
    >
      {inner}
    </button>
  );
}
