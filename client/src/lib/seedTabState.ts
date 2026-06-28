
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
  id: string;
  seed: string;
  savedAt: number;
  preset: {
    deck: string;
    stake: string;
    version: string;
    globalMaxAnte: number;
    jokerConstraints: JokerConstraint[];
  };
  match: SeedMatch;
  note?: string;
}

export interface FinderState {
  selected: JokerConstraint[];
  deck: string;
  stake: string;
  version: string;
  globalMaxAnte: number;
  threads: number;
  batchSize: number;
  matches: SeedMatch[];
  progress: FinderProgress;
  error: string | null;
  running: boolean;
  throughput: number;
  wasmActive: boolean;
}

export interface AnalyzerState {
  input: AnalysisInput;
  results: AnteResult[] | null;
  view: AnalyzerView;
  isRunning: boolean;
  jokerQuery: string;
}

interface State {
  finder: FinderState;
  analyzer: AnalyzerState;
  library: SavedSeed[];
}

function defaultFinder(): FinderState {
  const cores = typeof navigator !== "undefined" ? navigator.hardwareConcurrency : 4;
  return {
    selected: [],
    deck: "Red Deck",
    stake: "White Stake",
    version: "1.0.1f",
    globalMaxAnte: 8,
    threads: Math.max(1, Math.min(16, cores || 4)),
    batchSize: 10_000,
    matches: [],
    progress: { totalTries: 0, elapsedMs: 0, seedsPerSec: 0, matches: 0 },
    error: null,
    running: false,
    throughput: 0,
    wasmActive: false,
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
  }
  return base;
}

let state: State = loadInitial();
const listeners = new Set<() => void>();

function emit() {
  state = { ...state };
  listeners.forEach(l => l());
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

export function setAnalyzer(patch: Partial<AnalyzerState>) {
  state = { ...state, analyzer: { ...state.analyzer, ...patch } };
  listeners.forEach(l => l());
  scheduleSave();
}

export function saveSeed(seed: SavedSeed) {
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

void emit;
