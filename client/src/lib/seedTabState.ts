// Lightweight singleton store for Seed Finder + Analyzer + Library state.
// Keeps state alive across sub-tab switches (component unmount) and persists
// non-volatile fields to localStorage for cross-reload continuity.
//
// We deliberately avoid heavy dependencies — uses useSyncExternalStore so any
// component can subscribe to slices and re-render on update.

import { useSyncExternalStore } from "react";
import type {
  AnalysisInput, AnteResult,
} from "@/lib/seedEngine";
import type {
  JokerConstraint, SeedMatch, FinderProgress,
} from "@/lib/seedFinder";

const LS_KEY = "balatro_seed_tab_state_v1";

export type AnalyzerView = "spoiler" | "joker" | "soul";

export interface SavedSeed {
  id: string;          // unique
  seed: string;
  savedAt: number;     // epoch ms
  preset: {
    deck: string;
    stake: string;
    version: string;   // human-readable e.g. "1.0.1f"
    globalMaxAnte: number;
    jokerConstraints: JokerConstraint[];
  };
  match: SeedMatch;    // full match details for re-rendering as a card
  note?: string;
}

export interface FinderState {
  selected: JokerConstraint[];
  deck: string;
  stake: string;
  version: string;
  globalMaxAnte: number;
  threads: number;
  // Last run results (kept across tab switches; volatile across reload).
  matches: SeedMatch[];
  progress: FinderProgress;
  error: string | null;
  running: boolean;
}

export interface AnalyzerState {
  input: AnalysisInput;
  results: AnteResult[] | null;
  view: AnalyzerView;
  isRunning: boolean;
  // Optional state for sub-views so their inputs survive too
  jokerQuery: string;
}

interface State {
  finder: FinderState;
  analyzer: AnalyzerState;
  library: SavedSeed[];
}

function defaultFinder(): FinderState {
  const cores = typeof navigator !== "undefined" ? navigator.hardwareConcurrency : 4;
  // Default to ALL logical cores (capped at 16) for maximum throughput.
  // Previous cap of 8 left half the CPU idle on modern machines.
  return {
    selected: [],
    deck: "Red Deck",
    stake: "White Stake",
    version: "1.0.1f",
    globalMaxAnte: 8,
    threads: Math.max(1, Math.min(16, cores || 4)),
    matches: [],
    progress: { totalTries: 0, elapsedMs: 0, seedsPerSec: 0, matches: 0 },
    error: null,
    running: false,
  };
}

function defaultAnalyzer(): AnalyzerState {
  return {
    input: {
      seed: "",
      deck: "Red Deck",
      stake: "White Stake",
      showman: false,
      version: 10103,
      freshProfile: false,
      freshRun: true,
      maxAnte: 8,
      cardsPerAnte: 15,
      packsPerAnte: 6,
    },
    results: null,
    view: "spoiler",
    isRunning: false,
    jokerQuery: "",
  };
}

function loadInitial(): State {
  const base: State = {
    finder: defaultFinder(),
    analyzer: defaultAnalyzer(),
    library: [],
  };
  try {
    if (typeof window === "undefined" || !window.localStorage) return base;
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw);
    // Persist non-volatile fields only. Skip running flags & in-flight progress.
    if (parsed.finder) {
      base.finder.selected = parsed.finder.selected ?? base.finder.selected;
      base.finder.deck = parsed.finder.deck ?? base.finder.deck;
      base.finder.stake = parsed.finder.stake ?? base.finder.stake;
      base.finder.version = parsed.finder.version ?? base.finder.version;
      base.finder.globalMaxAnte = parsed.finder.globalMaxAnte ?? base.finder.globalMaxAnte;
      base.finder.threads = parsed.finder.threads ?? base.finder.threads;
      base.finder.matches = parsed.finder.matches ?? [];
      base.finder.progress = parsed.finder.progress ?? base.finder.progress;
    }
    if (parsed.analyzer) {
      base.analyzer.input = { ...base.analyzer.input, ...(parsed.analyzer.input || {}) };
      base.analyzer.view = parsed.analyzer.view ?? base.analyzer.view;
      base.analyzer.jokerQuery = parsed.analyzer.jokerQuery ?? "";
      base.analyzer.results = parsed.analyzer.results ?? null;
    }
    if (Array.isArray(parsed.library)) {
      base.library = parsed.library;
    }
  } catch {
    // ignore
  }
  return base;
}

let state: State = loadInitial();
const listeners = new Set<() => void>();

function emit() {
  // Snapshot must be a new object so React's getSnapshot detects change.
  state = { ...state };
  listeners.forEach(l => l());
  // Persist (debounced via microtask).
  scheduleSave();
}

let saveScheduled = false;
function scheduleSave() {
  if (saveScheduled) return;
  saveScheduled = true;
  queueMicrotask(() => {
    saveScheduled = false;
    try {
      if (typeof window === "undefined" || !window.localStorage) return;
      // Strip volatile fields before persisting.
      const persisted = {
        finder: {
          selected: state.finder.selected,
          deck: state.finder.deck,
          stake: state.finder.stake,
          version: state.finder.version,
          globalMaxAnte: state.finder.globalMaxAnte,
          threads: state.finder.threads,
          matches: state.finder.matches,
          progress: state.finder.progress,
        },
        analyzer: {
          input: state.analyzer.input,
          view: state.analyzer.view,
          jokerQuery: state.analyzer.jokerQuery,
          results: state.analyzer.results,
        },
        library: state.library,
      };
      window.localStorage.setItem(LS_KEY, JSON.stringify(persisted));
    } catch {
      // ignore quota/JSON errors
    }
  });
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

export function getState(): State { return state; }

export function useSeedTabState<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state), () => selector(state));
}

// --- Setters for Finder ---
export function setFinder(patch: Partial<FinderState>) {
  state = { ...state, finder: { ...state.finder, ...patch } };
  listeners.forEach(l => l());
  scheduleSave();
}
export function updateFinder(updater: (f: FinderState) => FinderState) {
  state = { ...state, finder: updater(state.finder) };
  listeners.forEach(l => l());
  scheduleSave();
}

// --- Setters for Analyzer ---
export function setAnalyzer(patch: Partial<AnalyzerState>) {
  state = { ...state, analyzer: { ...state.analyzer, ...patch } };
  listeners.forEach(l => l());
  scheduleSave();
}

// --- Library ---
export function saveSeed(seed: SavedSeed) {
  // Avoid duplicates on (seed, preset hash).
  const exists = state.library.some(s => s.seed === seed.seed && s.preset.deck === seed.preset.deck && s.preset.stake === seed.preset.stake && s.preset.version === seed.preset.version);
  if (exists) return false;
  state = { ...state, library: [...state.library, seed] };
  listeners.forEach(l => l());
  scheduleSave();
  return true;
}

export function deleteSavedSeed(id: string) {
  state = { ...state, library: state.library.filter(s => s.id !== id) };
  listeners.forEach(l => l());
  scheduleSave();
}

export function isSeedSaved(seed: string, deck: string, stake: string, version: string): boolean {
  return state.library.some(s => s.seed === seed && s.preset.deck === deck && s.preset.stake === stake && s.preset.version === version);
}

void emit; // keep type usage
