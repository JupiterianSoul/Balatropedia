export function Logo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      fill="none"
      aria-label="Balatro Synergy Explorer logo"
      role="img"
    >
      {/* jester-hat / pip mark in gold */}
      <g stroke="hsl(42 55% 55%)" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
        {/* diamond pip */}
        <path d="M20 4 L27 13 L20 22 L13 13 Z" fill="hsl(42 55% 55% / 0.12)" />
        {/* club / hat lobes flanking */}
        <path d="M13 13 Q6 16 9 24 L13 22" fill="hsl(145 35% 26% / 0.35)" />
        <path d="M27 13 Q34 16 31 24 L27 22" fill="hsl(145 35% 26% / 0.35)" />
        {/* base band */}
        <path d="M11 27 L29 27 L27 34 L13 34 Z" fill="hsl(350 45% 28% / 0.30)" />
        {/* center stitch */}
        <path d="M20 22 L20 27" />
      </g>
      {/* gold bells */}
      <circle cx="9" cy="25" r="1.6" fill="hsl(42 55% 55%)" />
      <circle cx="31" cy="25" r="1.6" fill="hsl(42 55% 55%)" />
      <circle cx="20" cy="13" r="1.4" fill="hsl(42 55% 55%)" />
    </svg>
  );
}
