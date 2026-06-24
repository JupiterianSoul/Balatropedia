import {
  createContext, useContext, useEffect, useMemo, useState, type ReactNode,
} from "react";

const STORAGE_KEY = "balatro-ui-scale";
const DEFAULT_SCALE = 1.0;
export const UI_SCALE_MIN = 0.8;
export const UI_SCALE_MAX = 1.6;
export const UI_SCALE_STEP = 0.05;

interface UIScaleState {
  scale: number;
  setScale: (n: number) => void;
}

const UIScaleContext = createContext<UIScaleState | null>(null);

function clamp(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_SCALE;
  return Math.max(UI_SCALE_MIN, Math.min(UI_SCALE_MAX, n));
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
