import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface AppState {
  favoriteJokers: Set<string>;
  favoriteCombos: Set<string>;
  notes: Record<string, string>; // key = "joker:id" | "combo:id"
  selectedJokerId: string | null;
  toggleFavoriteJoker: (id: string) => void;
  toggleFavoriteCombo: (id: string) => void;
  isFavoriteJoker: (id: string) => boolean;
  isFavoriteCombo: (id: string) => boolean;
  setNote: (key: string, value: string) => void;
  openJokerDetail: (id: string) => void;
  closeJokerDetail: () => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [favoriteJokers, setFavoriteJokers] = useState<Set<string>>(new Set());
  const [favoriteCombos, setFavoriteCombos] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [selectedJokerId, setSelectedJokerId] = useState<string | null>(null);

  const toggleFavoriteJoker = useCallback((id: string) => {
    setFavoriteJokers((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleFavoriteCombo = useCallback((id: string) => {
    setFavoriteCombos((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const isFavoriteJoker = useCallback((id: string) => favoriteJokers.has(id), [favoriteJokers]);
  const isFavoriteCombo = useCallback((id: string) => favoriteCombos.has(id), [favoriteCombos]);

  const setNote = useCallback((key: string, value: string) => {
    setNotes((prev) => ({ ...prev, [key]: value }));
  }, []);

  const openJokerDetail = useCallback((id: string) => setSelectedJokerId(id), []);
  const closeJokerDetail = useCallback(() => setSelectedJokerId(null), []);

  return (
    <AppContext.Provider
      value={{
        favoriteJokers,
        favoriteCombos,
        notes,
        selectedJokerId,
        toggleFavoriteJoker,
        toggleFavoriteCombo,
        isFavoriteJoker,
        isFavoriteCombo,
        setNote,
        openJokerDetail,
        closeJokerDetail,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
