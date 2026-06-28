import {
  createContext, useContext, useEffect, useMemo, useState, type ReactNode,
} from "react";

/**
 * App scale + text scale — independent of joker icon size.
 *
 * - `appScale`  → CSS var `--app-scale`. Applied via `transform: scale()`
 *                 on a root wrapper so layout *uses* the scaled size (the
 *                 content shrinks/grows but stays within the viewport).
 * - `textScale` → CSS var `--text-scale`. Multiplies `font-size` on `html`.
 *
 * Both persist to localStorage. Defaults are 1.0.
 */

const APP_KEY = "balatropedia.appScale";

// Min is 100% (user request — going below breaks layout and wastes viewport space)
export const APP_SCALE_MIN = 1.0;
export const APP_SCALE_MAX = 1.4;
export const APP_SCALE_STEP = 0.05;
const APP_DEFAULT = 1.0;

interface State {
  appScale: number;
  setAppScale: (n: number) => void;
}

const Ctx = createContext<State | null>(null);

function clamp(n: number, lo: number, hi: number, def: number): number {
  if (!Number.isFinite(n)) return def;
  return Math.max(lo, Math.min(hi, n));
}

function readNum(key: string, def: number, lo: number, hi: number): number {
  if (typeof window === "undefined" || !window.localStorage) return def;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return def;
    const n = parseFloat(raw);
    return clamp(n, lo, hi, def);
  } catch {
    return def;
  }
}

function applyAppScale(n: number) {
  if (typeof document === "undefined") return;
  document.documentElement.style.setProperty("--app-scale", String(n));
  // Use CSS `zoom` to scale the whole UI while keeping layout flow intact
  // (so nothing overlaps or overflows the viewport). Supported in Chrome,
  // Edge, Safari, and Firefox 126+.
  if (Math.abs(n - 1) < 0.001) {
    document.documentElement.style.removeProperty("zoom");
  } else {
    document.documentElement.style.setProperty("zoom", String(n));
  }
}

export function AppScaleProvider({ children }: { children: ReactNode }) {
  const [appScale, setApp] = useState<number>(() =>
    readNum(APP_KEY, APP_DEFAULT, APP_SCALE_MIN, APP_SCALE_MAX)
  );

  useEffect(() => {
    applyAppScale(appScale);
    try { window.localStorage?.setItem(APP_KEY, String(appScale)); } catch {  }
  }, [appScale]);

  const value = useMemo<State>(() => ({
    appScale,
    setAppScale: (n) => setApp(clamp(n, APP_SCALE_MIN, APP_SCALE_MAX, APP_DEFAULT)),
  }), [appScale]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppScale(): State {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppScale must be used within AppScaleProvider");
  return ctx;
}
