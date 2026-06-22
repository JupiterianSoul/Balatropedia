/**
 * Balatropedia logo; the base Joker sprite from the official game art.
 * Pixel-art is preserved via `image-rendering: pixelated`.
 */
const JOKER_SPRITE_URL =
  "https://static.wikia.nocookie.net/balatrogame/images/e/ef/Joker.png/revision/latest";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <img
      src={JOKER_SPRITE_URL}
      alt="Balatropedia"
      className={`pixelated select-none ${className}`}
      draggable={false}
      loading="eager"
      decoding="async"
    />
  );
}
