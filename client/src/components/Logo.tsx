import { getLogoUrl } from "@/lib/sprites";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <img
      src={getLogoUrl()}
      alt="Balatropedia"
      className={`pixelated select-none ${className}`}
      draggable={false}
      loading="eager"
      decoding="async"
    />
  );
}

