/**
 * Hand-drawn pixel icons (24×24 grid).
 *
 * Drawn from scratch as `<rect>` pixels with `shape-rendering="crispEdges"`,
 * inspired by Balatro's chunky pixel-art look but original artwork.
 *
 * Two ways to use:
 *  1. Mount <BalatroIconSymbols /> once at the top of the app to register
 *     the SVG `<defs>`, then reference them with <BalatroIcon name="chip" />.
 *  2. Or just use <BalatroIcon name="..." /> directly anywhere — it includes
 *     a fallback self-contained SVG when symbols aren't mounted.
 *
 * Icons with `fillClass="fill-stroke"` recolor automatically via CSS:
 *   .tab.active svg .fill-stroke { fill: var(--accent); }
 */
import * as React from "react";

export type BalatroIconName =
  | "chip"
  | "coin"
  | "home"
  | "joker"
  | "tier"
  | "seeds"
  | "settings";

const SYMBOLS: Record<BalatroIconName, React.ReactNode> = {
  chip: (
    <symbol id="bal-ic-chip" viewBox="0 0 24 24">
      <g shapeRendering="crispEdges">
        <rect x="8" y="2" width="8" height="2" fill="#000" />
        <rect x="4" y="4" width="4" height="2" fill="#000" />
        <rect x="16" y="4" width="4" height="2" fill="#000" />
        <rect x="2" y="6" width="2" height="4" fill="#000" />
        <rect x="20" y="6" width="2" height="4" fill="#000" />
        <rect x="2" y="14" width="2" height="4" fill="#000" />
        <rect x="20" y="14" width="2" height="4" fill="#000" />
        <rect x="4" y="18" width="4" height="2" fill="#000" />
        <rect x="16" y="18" width="4" height="2" fill="#000" />
        <rect x="8" y="20" width="8" height="2" fill="#000" />
        <rect x="8" y="4" width="8" height="2" fill="#1e90ff" />
        <rect x="4" y="6" width="16" height="12" fill="#1e90ff" />
        <rect x="8" y="18" width="8" height="2" fill="#1e90ff" />
        <rect x="6" y="6" width="2" height="2" fill="#6cb4ff" />
        <rect x="8" y="4" width="2" height="2" fill="#6cb4ff" />
        <rect x="10" y="8" width="4" height="2" fill="#fff" />
        <rect x="10" y="14" width="4" height="2" fill="#fff" />
        <rect x="8" y="10" width="2" height="4" fill="#fff" />
        <rect x="14" y="10" width="2" height="4" fill="#fff" />
        <rect x="10" y="10" width="4" height="4" fill="#0d3a6b" />
        <rect x="11" y="11" width="2" height="2" fill="#fff" />
      </g>
    </symbol>
  ),

  coin: (
    <symbol id="bal-ic-coin" viewBox="0 0 24 24">
      <g shapeRendering="crispEdges">
        <rect x="8" y="3" width="8" height="2" fill="#000" />
        <rect x="5" y="5" width="3" height="2" fill="#000" />
        <rect x="16" y="5" width="3" height="2" fill="#000" />
        <rect x="3" y="7" width="2" height="3" fill="#000" />
        <rect x="19" y="7" width="2" height="3" fill="#000" />
        <rect x="3" y="14" width="2" height="3" fill="#000" />
        <rect x="19" y="14" width="2" height="3" fill="#000" />
        <rect x="5" y="17" width="3" height="2" fill="#000" />
        <rect x="16" y="17" width="3" height="2" fill="#000" />
        <rect x="8" y="19" width="8" height="2" fill="#000" />
        <rect x="8" y="5" width="8" height="2" fill="#f7d24e" />
        <rect x="5" y="7" width="14" height="10" fill="#f7d24e" />
        <rect x="8" y="17" width="8" height="2" fill="#f7d24e" />
        <rect x="6" y="7" width="2" height="2" fill="#fff8b0" />
        <rect x="8" y="5" width="2" height="2" fill="#fff8b0" />
        <rect x="16" y="15" width="2" height="2" fill="#b8860b" />
        <rect x="14" y="17" width="2" height="2" fill="#b8860b" />
        <rect x="11" y="7" width="2" height="1" fill="#000" />
        <rect x="10" y="8" width="4" height="1" fill="#000" />
        <rect x="9" y="9" width="2" height="1" fill="#000" />
        <rect x="11" y="10" width="3" height="1" fill="#000" />
        <rect x="13" y="11" width="2" height="2" fill="#000" />
        <rect x="10" y="13" width="3" height="1" fill="#000" />
        <rect x="9" y="14" width="2" height="1" fill="#000" />
        <rect x="10" y="15" width="4" height="1" fill="#000" />
        <rect x="11" y="16" width="2" height="1" fill="#000" />
        <rect x="11" y="6" width="2" height="1" fill="#000" />
        <rect x="11" y="17" width="2" height="1" fill="#000" />
      </g>
    </symbol>
  ),

  home: (
    <symbol id="bal-ic-home" viewBox="0 0 24 24">
      <g shapeRendering="crispEdges" className="fill-stroke">
        <rect x="11" y="3" width="2" height="1" />
        <rect x="10" y="4" width="4" height="1" />
        <rect x="9" y="5" width="6" height="1" />
        <rect x="8" y="6" width="8" height="1" />
        <rect x="7" y="7" width="10" height="1" />
        <rect x="6" y="8" width="12" height="1" />
        <rect x="5" y="9" width="14" height="1" />
        <rect x="4" y="10" width="16" height="1" />
        <rect x="5" y="11" width="2" height="9" />
        <rect x="17" y="11" width="2" height="9" />
        <rect x="7" y="19" width="10" height="2" />
        <rect x="10" y="14" width="4" height="6" />
      </g>
    </symbol>
  ),

  joker: (
    <symbol id="bal-ic-joker" viewBox="0 0 24 24">
      <g shapeRendering="crispEdges" className="fill-stroke">
        <rect x="3" y="4" width="2" height="2" />
        <rect x="4" y="6" width="2" height="2" />
        <rect x="5" y="8" width="2" height="2" />
        <rect x="6" y="10" width="3" height="2" />
        <rect x="11" y="2" width="2" height="2" />
        <rect x="10" y="4" width="4" height="2" />
        <rect x="9" y="6" width="6" height="2" />
        <rect x="9" y="8" width="6" height="4" />
        <rect x="19" y="4" width="2" height="2" />
        <rect x="18" y="6" width="2" height="2" />
        <rect x="17" y="8" width="2" height="2" />
        <rect x="15" y="10" width="3" height="2" />
        <rect x="5" y="12" width="14" height="2" />
        <rect x="6" y="14" width="12" height="2" />
        <rect x="9" y="16" width="6" height="4" />
      </g>
      <g shapeRendering="crispEdges">
        <rect x="4" y="3" width="2" height="2" fill="#f7d24e" />
        <rect x="11" y="1" width="2" height="2" fill="#f7d24e" />
        <rect x="18" y="3" width="2" height="2" fill="#f7d24e" />
        <rect x="10" y="17" width="1" height="1" fill="#000" />
        <rect x="13" y="17" width="1" height="1" fill="#000" />
      </g>
    </symbol>
  ),

  tier: (
    <symbol id="bal-ic-tier" viewBox="0 0 24 24">
      <g shapeRendering="crispEdges" className="fill-stroke">
        <rect x="4" y="2" width="2" height="2" />
        <rect x="11" y="2" width="2" height="2" />
        <rect x="18" y="2" width="2" height="2" />
        <rect x="4" y="4" width="16" height="2" />
        <rect x="4" y="8" width="16" height="3" />
        <rect x="4" y="12" width="13" height="3" />
        <rect x="4" y="16" width="10" height="3" />
        <rect x="4" y="20" width="7" height="2" />
      </g>
    </symbol>
  ),

  seeds: (
    <symbol id="bal-ic-seeds" viewBox="0 0 24 24">
      <g shapeRendering="crispEdges" className="fill-stroke">
        <rect x="4" y="4" width="16" height="2" />
        <rect x="4" y="18" width="16" height="2" />
        <rect x="4" y="6" width="2" height="12" />
        <rect x="18" y="6" width="2" height="12" />
      </g>
      <g shapeRendering="crispEdges">
        <rect x="7" y="7" width="2" height="2" fill="#000" />
        <rect x="15" y="7" width="2" height="2" fill="#000" />
        <rect x="11" y="11" width="2" height="2" fill="#000" />
        <rect x="7" y="15" width="2" height="2" fill="#000" />
        <rect x="15" y="15" width="2" height="2" fill="#000" />
      </g>
    </symbol>
  ),

  settings: (
    <symbol id="bal-ic-settings" viewBox="0 0 24 24">
      <g shapeRendering="crispEdges" className="fill-stroke">
        <rect x="10" y="2" width="4" height="2" />
        <rect x="10" y="20" width="4" height="2" />
        <rect x="2" y="10" width="2" height="4" />
        <rect x="20" y="10" width="2" height="4" />
        <rect x="4" y="4" width="3" height="3" />
        <rect x="17" y="4" width="3" height="3" />
        <rect x="4" y="17" width="3" height="3" />
        <rect x="17" y="17" width="3" height="3" />
        <rect x="7" y="6" width="10" height="2" />
        <rect x="6" y="8" width="12" height="8" />
        <rect x="7" y="16" width="10" height="2" />
      </g>
      <g shapeRendering="crispEdges">
        <rect x="10" y="10" width="4" height="4" fill="#1c262a" />
      </g>
    </symbol>
  ),
};

/**
 * Mount ONCE in App.tsx (or main.tsx) so every <BalatroIcon /> can
 * reference these symbols via `<use href="#bal-ic-..." />`.
 */
export function BalatroIconSymbols(): JSX.Element {
  return (
    <svg
      width="0"
      height="0"
      style={{ position: "absolute" }}
      aria-hidden="true"
      data-balatro-icons
    >
      <defs>{Object.values(SYMBOLS)}</defs>
    </svg>
  );
}

export interface BalatroIconProps extends React.SVGProps<SVGSVGElement> {
  name: BalatroIconName;
  size?: number | string;
}

export function BalatroIcon({
  name,
  size = 24,
  ...rest
}: BalatroIconProps): JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...rest}
    >
      <use href={`#bal-ic-${name}`} />
    </svg>
  );
}
