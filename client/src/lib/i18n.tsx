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

function lookup(bundle: UiBundle, key: string): string | undefined {
  const parts = key.split(".");
  let cur: any = bundle;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = cur[p];
  }
  return typeof cur === "string" ? cur : undefined;
}

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

export function useT() {
  return useI18n().t;
}

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
        "bloodstone_lucky", "canio_destruction", "low_card_count",
        "no_discard", "tarot_engine", "two_pair_scaling", "vampire_enhancement",
      ]),
      popularity: make("popularity", ["staple", "common", "niche"]),
      difficulty: make("difficulty", ["easy", "moderate", "hard"]),
      popularityLabel: t("ui.labels.popularity_label"),
      difficultyLabel: t("ui.labels.difficulty_label"),
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

export function useCuratedText(key: string, fallback: string): string {
  const { lang } = useI18n();
  return useMemo(() => {
    const v = lookup(UI[lang], key) ?? lookup(UI.en, key);
    return v ?? fallback;
  }, [key, fallback, lang]);
}

export function useCuratedList(key: string, fallback: string[]): string[] {
  const { lang } = useI18n();
  return useMemo(() => {
    const v = lookupRaw(UI[lang], key) ?? lookupRaw(UI.en, key);
    if (Array.isArray(v) && v.every((x) => typeof x === "string")) return v as string[];
    return fallback;
  }, [key, fallback, lang]);
}

export function getCuratedText(lang: Lang, key: string, fallback: string): string {
  return lookup(UI[lang], key) ?? lookup(UI.en, key) ?? fallback;
}

export function getCuratedList(lang: Lang, key: string, fallback: string[]): string[] {
  const v = lookupRaw(UI[lang], key) ?? lookupRaw(UI.en, key);
  if (Array.isArray(v) && v.every((x) => typeof x === "string")) return v as string[];
  return fallback;
}

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

