import { createContext, useContext, useState, useCallback, useMemo, ReactNode, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";

import uiEn from "@/data/i18n/ui_en.json";
import uiFr from "@/data/i18n/ui_fr.json";
import uiEs from "@/data/i18n/ui_es.json";
import gameEn from "@/data/i18n/game_en.json";
import gameFr from "@/data/i18n/game_fr.json";
import gameEs from "@/data/i18n/game_es.json";

export type Lang = "en" | "fr" | "es";

type UiBundle = Record<string, any>;
type GameBundle = Record<string, Record<string, { name?: string; text?: string } | undefined>>;

const UI: Record<Lang, UiBundle> = { en: uiEn, fr: uiFr, es: uiEs };
const GAME: Record<Lang, GameBundle> = {
  en: gameEn as unknown as GameBundle,
  fr: gameFr as unknown as GameBundle,
  es: gameEs as unknown as GameBundle,
};

/** Resolve a dotted key (e.g. "ui.auth.signin") inside a bundle object. */
function lookup(bundle: UiBundle, key: string): string | undefined {
  const parts = key.split(".");
  let cur: any = bundle;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = cur[p];
  }
  return typeof cur === "string" ? cur : undefined;
}

/** Resolve a dotted key and return the raw value (string | array | object | undefined). */
function lookupRaw(bundle: UiBundle, key: string): unknown {
  const parts = key.split(".");
  let cur: any = bundle;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = cur[p];
  }
  return cur;
}

function interpolate(s: string, vars?: Record<string, string | number>): string {
  if (!vars) return s;
  return s.replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : `{{${k}}}`));
}

/** Detect an initial language from the browser, falling back to English. */
function detectLang(): Lang {
  if (typeof navigator !== "undefined") {
    const nav = (navigator.language || (navigator as any).userLanguage || "en").toLowerCase();
    if (nav.startsWith("fr")) return "fr";
    if (nav.startsWith("es")) return "es";
  }
  return "en";
}

interface I18nState {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nState | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const { user, isSignedIn } = useAuth();
  const [lang, setLangState] = useState<Lang>(detectLang);

  // When the signed-in user has a stored language, adopt it.
  useEffect(() => {
    const userLang = user?.language as Lang | undefined;
    if (userLang && (userLang === "en" || userLang === "fr" || userLang === "es")) {
      setLangState(userLang);
    }
  }, [user?.language]);

  const setLang = useCallback(
    (l: Lang) => {
      setLangState(l);
      if (isSignedIn) {
        // Persist to the account; ignore failures (lang still applies for the session).
        apiRequest("PATCH", "/api/auth/language", { language: l })
          .then(() => {
            queryClient.setQueryData(["/api/auth/me"], (prev: any) =>
              prev ? { ...prev, language: l } : prev,
            );
          })
          .catch(() => {});
      }
    },
    [isSignedIn],
  );

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const v = lookup(UI[lang], key) ?? lookup(UI.en, key) ?? key;
      return interpolate(v, vars);
    },
    [lang],
  );

  const value = useMemo<I18nState>(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nState {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

/** Returns the translation function bound to the active language. */
export function useT() {
  return useI18n().t;
}

/**
 * Translated enum-label maps with the SAME SHAPE as the static constants in
 * helpers.ts (ROLE_LABELS, HAND_LABELS, etc.). Components that previously read
 * those English-only constants can swap to these to get localized labels with
 * minimal call-site churn (e.g. `RARITY_LABELS[r]` → `labels.rarity[r]`).
 */
export function useLabels() {
  const { t } = useI18n();
  return useMemo(() => {
    const make = (prefix: string, keys: readonly string[]): Record<string, string> => {
      const out: Record<string, string> = {};
      for (const k of keys) out[k] = t(`ui.labels.${prefix}_${k}`);
      return out;
    };
    return {
      role: make("role", [
        "chips", "flat_mult", "xmult", "retrigger", "economy", "consistency",
        "discard_support", "hand_size", "held_in_hand", "suit_support",
        "rank_face_support", "deck_manipulation", "deck_growth",
        "enhancement_interaction", "destroy_value", "scaling_engine",
        "payoff", "enabler", "pivot",
      ]),
      scaling: make("scaling", ["static", "linear", "multiplicative", "exponential", "conditional"]),
      hand: make("hand", [
        "high_card", "pair", "two_pair", "three_of_a_kind", "straight",
        "flush", "full_house", "four_of_a_kind", "straight_flush", "any",
      ]),
      stage: make("stage", ["early", "mid", "late"]),
      level: make("level", ["low", "med", "high"]),
      rarity: make("rarity", ["common", "uncommon", "rare", "legendary"]),
      synergyKind: make("synergy", [
        "core_pair", "strong_support", "conditional", "archetype_only",
        "risky_explosive", "trap_unless_enabled",
      ]),
      engine: make("engine", [
        "retrigger", "xmult_stack", "deck_manipulation", "consistency",
        "economy", "face_card", "discard_volume", "enhancement",
        "suit_unification", "scaling",
      ]),
      archetype: make("archetype", [
        "flush", "straight", "high_card", "pair", "two_pair",
        "three_of_a_kind", "four_of_a_kind", "face_card", "held_in_hand",
        "steel", "glass", "discard", "deck_growth", "economy_snowball",
        "retrigger_engine",
      ]),
      riskPrefix: t("ui.labels.risk_prefix"),
    };
  }, [t]);
}

function normalizeId(id: string): string {
  return id
    .trim()
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Resolve a localized game entity's name + text.
 * category: jokers | decks | stakes | tarots | planets | spectrals | vouchers |
 *           enhancements | editions | seals | tags | blinds
 * Falls back to English content, then to the raw id.
 */
export function useGameText(
  category: string,
  id: string,
): { name: string; text: string; machineTranslated: boolean } {
  const { lang } = useI18n();
  return useMemo(() => {
    const tryGet = (l: Lang) => {
      const cat = GAME[l]?.[category];
      if (!cat) return undefined;
      return cat[id] ?? cat[normalizeId(id)];
    };
    const active = tryGet(lang);
    const en = tryGet("en");
    const name = active?.name ?? en?.name ?? id;
    const text = active?.text ?? en?.text ?? "";
    const machineTranslated =
      lang === "es" && (active as any)?._machine_translated === false ? false : false;
    return { name, text, machineTranslated };
  }, [category, id, lang]);
}

/**
 * Returns a localized string for a curated content key, falling back to EN then to the
 * provided fallback. Use for content like ARCHETYPES.wants, COMBOS.title, SYNERGIES.why
 * that is duplicated across i18n JSON.
 */
export function useCuratedText(key: string, fallback: string): string {
  const { lang } = useI18n();
  return useMemo(() => {
    const v = lookup(UI[lang], key) ?? lookup(UI.en, key);
    return v ?? fallback;
  }, [key, fallback, lang]);
}

/** Returns a localized string array (e.g. conditions/risks list) with EN + fallback chain. */
export function useCuratedList(key: string, fallback: string[]): string[] {
  const { lang } = useI18n();
  return useMemo(() => {
    const v = lookupRaw(UI[lang], key) ?? lookupRaw(UI.en, key);
    if (Array.isArray(v) && v.every((x) => typeof x === "string")) return v as string[];
    return fallback;
  }, [key, fallback, lang]);
}

/** Non-hook curated string resolver. */
export function getCuratedText(lang: Lang, key: string, fallback: string): string {
  return lookup(UI[lang], key) ?? lookup(UI.en, key) ?? fallback;
}

/** Non-hook curated array resolver. */
export function getCuratedList(lang: Lang, key: string, fallback: string[]): string[] {
  const v = lookupRaw(UI[lang], key) ?? lookupRaw(UI.en, key);
  if (Array.isArray(v) && v.every((x) => typeof x === "string")) return v as string[];
  return fallback;
}

/** Non-hook resolver for use inside loops/utilities that already know the lang. */
export function getGameText(lang: Lang, category: string, id: string): { name: string; text: string } {
  const tryGet = (l: Lang) => {
    const cat = GAME[l]?.[category];
    if (!cat) return undefined;
    return cat[id] ?? cat[normalizeId(id)];
  };
  const active = tryGet(lang);
  const en = tryGet("en");
  return { name: active?.name ?? en?.name ?? id, text: active?.text ?? en?.text ?? "" };
}
