import {
  createContext, useContext, useEffect, useMemo, useState, type ReactNode,
} from "react";

/**
 * Persistence key — uses balatropedia.local. prefix so it's cleared with
 * the "Clear local data" action in Settings.
 */
const PREF_KEY = "balatropedia.local.uiScale";
/** Legacy localStorage key kept for migration. */
const LS_KEY = "balatro-ui-scale";

const DEFAULT_SCALE = 1.0;
export const UI_SCALE_MIN = 0.8;
export const UI_SCALE_MAX = 1.6;
export const UI_SCALE_STEP = 0.05;

interface UIScaleState {
  scale: number;
  setScale: (n: number) => void;
}

const UIScaleContext = createContext<UIScaleState | null>(null);

export function clamp(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_SCALE;
  return Math.max(UI_SCALE_MIN, Math.min(UI_SCALE_MAX, n));
}

/** Read from localStorage (sync, used on initial render). */
export function readStoredSync(): number {
  if (typeof window === "undefined" || !window.localStorage) return DEFAULT_SCALE;
  try {
    // Check new key first, fall back to legacy key.
    const raw = window.localStorage.getItem(PREF_KEY) ?? window.localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULT_SCALE;
    const n = parseFloat(raw);
    return clamp(n);
  } catch {
    return DEFAULT_SCALE;
  }
}

export function apply(n: number) {
  if (typeof document === "undefined") return;
  document.documentElement.style.setProperty("--ui-scale", String(n));
}

/** Persist to both localStorage and Capacitor Preferences (async, best-effort). */
async function persist(n: number) {
  const str = String(n);
  // Always write localStorage for web compatibility.
  try {
    window.localStorage.setItem(PREF_KEY, str);
  } catch { /* ignore */ }
  // Also write Capacitor Preferences when on native platform.
  if ((window as any).Capacitor?.isNativePlatform?.()) {
    try {
      const { Preferences } = await import("@capacitor/preferences");
      await Preferences.set({ key: PREF_KEY, value: str });
    } catch { /* ignore */ }
  }
}

export function UIScaleProvider({ children }: { children: ReactNode }) {
  const [scale, setScaleState] = useState<number>(() => readStoredSync());

  useEffect(() => {
    apply(scale);
    persist(scale);
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
