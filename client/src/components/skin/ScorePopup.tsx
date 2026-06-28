/**
 * ScorePopup + particle burst — floating gold/blue/red/holo numbers
 * that rise + fade, with optional radial particle ring (esp. holo).
 *
 * Imperative API: `spawnScorePopup(text, x, y, color)` and
 * `spawnParticleBurst(x, y, color)`. Both no-op if window is undefined.
 *
 * Honors `prefers-reduced-motion`: skips particles, shortens popup.
 */

export type PopupColor = "gold" | "blue" | "red" | "holo";

const PALETTES: Record<PopupColor, string[]> = {
  gold: ["#f7d24e", "#ffa502", "#ffd700"],
  red: ["#ff4757", "#ff6b6b", "#ffa502"],
  blue: ["#6cb4ff", "#1e90ff", "#5352ed"],
  holo: ["#ff4757", "#ffa502", "#f7df1e", "#2ed573", "#1e90ff", "#5352ed", "#ff6b9d"],
};

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export function spawnScorePopup(
  text: string,
  x: number,
  y: number,
  color: PopupColor = "gold",
): void {
  if (typeof document === "undefined") return;
  const p = document.createElement("div");
  p.className = `bal-popup bal-popup-${color}`;
  p.textContent = text;
  p.style.left = `${x}px`;
  p.style.top = `${y}px`;
  document.body.appendChild(p);
  const lifetime = prefersReducedMotion() ? 500 : 1100;
  window.setTimeout(() => p.remove(), lifetime);
}

export function spawnParticleBurst(
  x: number,
  y: number,
  color: PopupColor = "gold",
): void {
  if (typeof document === "undefined") return;
  if (prefersReducedMotion()) return;
  const colors = PALETTES[color];
  const N = color === "holo" ? 18 : 10;
  for (let i = 0; i < N; i++) {
    const angle = (Math.PI * 2 * i) / N + Math.random() * 0.3;
    const dist = 55 + Math.random() * 65;
    const p = document.createElement("div");
    p.className = "bal-particle";
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    const col = colors[i % colors.length];
    p.style.background = col;
    p.style.boxShadow = `0 0 6px ${col}`;
    p.style.setProperty("--tx", `calc(-50% + ${Math.cos(angle) * dist}px)`);
    p.style.setProperty("--ty", `calc(-50% + ${Math.sin(angle) * dist}px)`);
    document.body.appendChild(p);
    window.setTimeout(() => p.remove(), 950);
  }
}
