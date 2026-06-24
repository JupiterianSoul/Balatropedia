import {
  createContext, useContext, useEffect, useMemo, useState, type ReactNode,
} from "react";

const ENABLED_KEY = "balatro-crt-enabled";
const INTENSITY_KEY = "balatro-crt-intensity";
const DEFAULT_ENABLED = true;
const DEFAULT_INTENSITY = 0.6;
const MIN_INTENSITY = 0;
const MAX_INTENSITY = 1;

interface CRTState {
  enabled: boolean;
  intensity: number;
  setEnabled: (v: boolean) => void;
  setIntensity: (v: number) => void;
  reset: () => void;
}

const CRTContext = createContext<CRTState | null>(null);

function readStoredBool(key: string, fallback: boolean): boolean {
  if (typeof window === "undefined" || !window.localStorage) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === "true") return true;
    if (raw === "false") return false;
  } catch {  }
  return fallback;
}

function readStoredNumber(key: string, fallback: number): number {
  if (typeof window === "undefined" || !window.localStorage) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw != null) {
      const n = Number(raw);
      if (Number.isFinite(n)) return clamp(n);
    }
  } catch {  }
  return fallback;
}

function clamp(n: number): number {
  return Math.min(MAX_INTENSITY, Math.max(MIN_INTENSITY, n));
}

function apply(enabled: boolean, intensity: number) {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  html.setAttribute("data-crt", enabled ? "on" : "off");
  html.style.setProperty("--crt-strength", String(enabled ? intensity : 0));
}

export function CRTProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabledState] = useState<boolean>(() => readStoredBool(ENABLED_KEY, DEFAULT_ENABLED));
  const [intensity, setIntensityState] = useState<number>(() => readStoredNumber(INTENSITY_KEY, DEFAULT_INTENSITY));

  useEffect(() => {
    apply(enabled, intensity);
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.setItem(ENABLED_KEY, String(enabled));
        window.localStorage.setItem(INTENSITY_KEY, String(intensity));
      } catch {  }
    }
  }, [enabled, intensity]);

  const value = useMemo<CRTState>(() => ({
    enabled,
    intensity,
    setEnabled: setEnabledState,
    setIntensity: (v) => setIntensityState(clamp(v)),
    reset: () => {
      setEnabledState(DEFAULT_ENABLED);
      setIntensityState(DEFAULT_INTENSITY);
    },
  }), [enabled, intensity]);

  return <CRTContext.Provider value={value}>{children}</CRTContext.Provider>;
}

export function useCRT(): CRTState {
  const ctx = useContext(CRTContext);
  if (!ctx) throw new Error("useCRT must be used within CRTProvider");
  return ctx;
}

export const CRT_DEFAULTS = {
  enabled: DEFAULT_ENABLED,
  intensity: DEFAULT_INTENSITY,
  min: MIN_INTENSITY,
  max: MAX_INTENSITY,
};
