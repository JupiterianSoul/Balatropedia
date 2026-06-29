import { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from "react";

interface AppState {
  favoriteJokers: Set<string>;
  isFavoriteJoker: (id: string) => boolean;
  toggleFavoriteJoker: (id: string) => void;

  favoriteCombos: Set<string>;
  isFavoriteCombo: (id: string) => boolean;
  toggleFavoriteCombo: (id: string) => void;

  notes: Record<string, string>;
  setNote: (key: string, value: string) => void;

  /**
   * Kept for backwards-compatibility with components that expected the old
   * server-favorite list. Always an empty array in local mode.
   */
  favorites: never[];
  favoriteNote: (jokerId: string) => string;
  setFavoriteNote: (jokerId: string, note: string) => void;

  selectedJokerId: string | null;
  openJokerDetail: (id: string) => void;
  closeJokerDetail: () => void;
}

const AppContext = createContext<AppState | null>(null);

const LS_KEYS = {
  favJokers: "bp.fav.jokers.v1",
  favCombos: "bp.fav.combos.v1",
  favNotes:  "bp.fav.notes.v1",
};

function loadSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}
function saveSet(key: string, s: Set<string>) {
  try { localStorage.setItem(key, JSON.stringify(Array.from(s))); } catch {}
}
function loadObj<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
function saveObj(key: string, v: unknown) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [favoriteJokers, setFavoriteJokers] = useState<Set<string>>(() => loadSet(LS_KEYS.favJokers));
  const [favoriteCombos, setFavoriteCombos] = useState<Set<string>>(() => loadSet(LS_KEYS.favCombos));
  const [favNotes, setFavNotes] = useState<Record<string, string>>(() => loadObj(LS_KEYS.favNotes, {}));
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [selectedJokerId, setSelectedJokerId] = useState<string | null>(null);

  // Persist favorites and combo favs to localStorage on every change.
  useEffect(() => saveSet(LS_KEYS.favJokers, favoriteJokers), [favoriteJokers]);
  useEffect(() => saveSet(LS_KEYS.favCombos, favoriteCombos), [favoriteCombos]);
  useEffect(() => saveObj(LS_KEYS.favNotes, favNotes), [favNotes]);

  const isFavoriteJoker = useCallback((id: string) => favoriteJokers.has(id), [favoriteJokers]);
  const toggleFavoriteJoker = useCallback((id: string) => {
    setFavoriteJokers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const isFavoriteCombo = useCallback((id: string) => favoriteCombos.has(id), [favoriteCombos]);
  const toggleFavoriteCombo = useCallback((id: string) => {
    setFavoriteCombos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const setNote = useCallback((key: string, value: string) => {
    setNotes((prev) => ({ ...prev, [key]: value }));
  }, []);

  const favoriteNote = useCallback(
    (jokerId: string) => favNotes[jokerId] ?? "",
    [favNotes],
  );
  const setFavoriteNote = useCallback((jokerId: string, note: string) => {
    setFavNotes((prev) => {
      if (!note && !prev[jokerId]) return prev;
      const next = { ...prev };
      if (note) next[jokerId] = note;
      else delete next[jokerId];
      return next;
    });
  }, []);

  const openJokerDetail = useCallback((id: string) => setSelectedJokerId(id), []);
  const closeJokerDetail = useCallback(() => setSelectedJokerId(null), []);

  const value = useMemo<AppState>(() => ({
    favoriteJokers,
    isFavoriteJoker,
    toggleFavoriteJoker,
    favoriteCombos,
    isFavoriteCombo,
    toggleFavoriteCombo,
    notes,
    setNote,
    favorites: [] as never[],
    favoriteNote,
    setFavoriteNote,
    selectedJokerId,
    openJokerDetail,
    closeJokerDetail,
  }), [favoriteJokers, favoriteCombos, notes, favNotes, selectedJokerId,
       isFavoriteJoker, toggleFavoriteJoker, isFavoriteCombo, toggleFavoriteCombo,
       setNote, favoriteNote, setFavoriteNote, openJokerDetail, closeJokerDetail]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
