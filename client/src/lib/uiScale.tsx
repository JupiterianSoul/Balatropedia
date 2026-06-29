import {
  createContext, useContext, useEffect, useMemo, useState, type ReactNode,
} from "react";

const STORAGE_KEY = "balatro-ui-scale";
const DEFAULT_SCALE = 1.10;
export const UI_SCALE_MIN = 1.10;
export const UI_SCALE_MAX = 1.40;
export const UI_SCALE_STEP = 0.15;

/** Three-step preset: Small (default, 110%), Medium (125%), Big (140%). */
export const UI_SCALE_PRESETS = [1.10, 1.25, 1.40] as const;
export type UIScalePresetValue = (typeof UI_SCALE_PRESETS)[number];

export function nearestPreset(n: number): UIScalePresetValue {
  let best: UIScalePresetValue = UI_SCALE_PRESETS[0];
  let bestDist = Math.abs(n - best);
  for (const p of UI_SCALE_PRESETS) {
    const d = Math.abs(n - p);
    if (d < bestDist) { best = p; bestDist = d; }
  }
  return best;
}

interface UIScaleState {
  scale: number;
  setScale: (n: number) => void;
}

const UIScaleContext = createContext<UIScaleState | null>(null);

function clamp(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_SCALE;
  // Snap any stored value to the nearest preset so legacy values
  // (e.g. 1.0 from before the 3-step migration) move to a valid step.
  return nearestPreset(Math.max(UI_SCALE_MIN, Math.min(UI_SCALE_MAX, n)));
}

function readStored(): number {
  if (typeof window === "undefined" || !window.localStorage) return DEFAULT_SCALE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SCALE;
    const n = parseFloat(raw);
    return clamp(n);
  } catch {
    return DEFAULT_SCALE;
  }
}

function apply(n: number) {
  if (typeof document === "undefined") return;
  document.documentElement.style.setProperty("--ui-scale", String(n));
}

export function UIScaleProvider({ children }: { children: ReactNode }) {
  const [scale, setScaleState] = useState<number>(() => readStored());

  useEffect(() => {
    apply(scale);
    if (typeof window !== "undefined" && window.localStorage) {
      try { window.localStorage.setItem(STORAGE_KEY, String(scale)); } catch {
        return;
      }
    }
  }, [scale]);

  const value = useMemo<UIScaleState>(() => ({
    scale,
    setScale: (n) => setScaleState(clamp(n)),
  }), [scale]);

  return <UIScaleContext.Provider value={value}>{children}</UIScaleContext.Provider>;
}

export function useUIScale(): UIScaleState {
  const ctx = useContext(UIScaleContext);
  if (!ctx) throw new Error("useUIScale must be used within UIScaleProvider");
  return ctx;
}
