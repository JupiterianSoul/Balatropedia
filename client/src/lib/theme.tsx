import {
  createContext, useContext, useEffect, useMemo, useState, type ReactNode,
} from "react";

export type Theme = "felt" | "midnight" | "parchment";

const STORAGE_KEY = "balatro-theme";
const DEFAULT_THEME: Theme = "felt";
const VALID_THEMES: Theme[] = ["felt", "midnight", "parchment"];

interface ThemeState {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeState | null>(null);

function readStoredTheme(): Theme {
  if (typeof window === "undefined" || !window.localStorage) return DEFAULT_THEME;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw && VALID_THEMES.includes(raw as Theme)) return raw as Theme;
  } catch {

  }
  return DEFAULT_THEME;
}

function applyTheme(t: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", t);
  // All three themes are dark surfaces now (felt = teal, midnight = blue,
  // parchment = brown leather). Keep .dark always on so shadcn primitives
  // stay consistent across themes.
  document.documentElement.classList.remove("light");
  document.documentElement.classList.add("dark");
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => readStoredTheme());

  useEffect(() => {
    applyTheme(theme);
    if (typeof window !== "undefined" && window.localStorage) {
      try { window.localStorage.setItem(STORAGE_KEY, theme); } catch {  }
    }
  }, [theme]);

  const value = useMemo<ThemeState>(() => ({
    theme,
    setTheme: setThemeState,
  }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeState {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

export const THEME_OPTIONS: { value: Theme; labelKey: string; descriptionKey: string }[] = [
  { value: "felt",      labelKey: "ui.settings.theme.felt.label",      descriptionKey: "ui.settings.theme.felt.desc" },
  { value: "midnight",  labelKey: "ui.settings.theme.midnight.label",  descriptionKey: "ui.settings.theme.midnight.desc" },
  { value: "parchment", labelKey: "ui.settings.theme.parchment.label", descriptionKey: "ui.settings.theme.parchment.desc" },
];

