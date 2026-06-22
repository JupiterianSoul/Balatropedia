import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import type { Favorite } from "@shared/schema";

interface AppState {
  // joker favorites
  favoriteJokers: Set<string>;
  isFavoriteJoker: (id: string) => boolean;
  toggleFavoriteJoker: (id: string) => void;
  // combo favorites (session-only — no backend table for combos)
  favoriteCombos: Set<string>;
  isFavoriteCombo: (id: string) => boolean;
  toggleFavoriteCombo: (id: string) => void;
  // notes (session-only key/value; persistent per-favorite notes handled separately)
  notes: Record<string, string>;
  setNote: (key: string, value: string) => void;
  // per-favorite persistent notes (signed in only)
  favorites: Favorite[];
  favoriteNote: (jokerId: string) => string;
  setFavoriteNote: (jokerId: string, note: string) => void;
  // detail sheet
  selectedJokerId: string | null;
  openJokerDetail: (id: string) => void;
  closeJokerDetail: () => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { isSignedIn } = useAuth();

  // ── Session-only fallback state (signed out) ──
  const [localFavoriteJokers, setLocalFavoriteJokers] = useState<Set<string>>(new Set());
  const [favoriteCombos, setFavoriteCombos] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [selectedJokerId, setSelectedJokerId] = useState<string | null>(null);

  // ── Server favorites (signed in) ──
  const { data: serverFavorites = [] } = useQuery<Favorite[]>({
    queryKey: ["/api/favorites"],
    enabled: isSignedIn,
  });

  const createFav = useMutation({
    mutationFn: async (jokerId: string) => {
      const res = await apiRequest("POST", "/api/favorites", { jokerId });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/favorites"] }),
  });
  const deleteFav = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/favorites/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/favorites"] }),
  });
  const patchFav = useMutation({
    mutationFn: async ({ id, note }: { id: number; note: string }) => {
      const res = await apiRequest("PATCH", `/api/favorites/${id}`, { note });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/favorites"] }),
  });

  const favByJoker = useMemo(() => {
    const m = new Map<string, Favorite>();
    for (const f of serverFavorites) m.set(f.jokerId, f);
    return m;
  }, [serverFavorites]);

  const favoriteJokers = useMemo(() => {
    if (isSignedIn) return new Set(serverFavorites.map((f) => f.jokerId));
    return localFavoriteJokers;
  }, [isSignedIn, serverFavorites, localFavoriteJokers]);

  const isFavoriteJoker = useCallback((id: string) => favoriteJokers.has(id), [favoriteJokers]);

  const toggleFavoriteJoker = useCallback(
    (id: string) => {
      if (isSignedIn) {
        const existing = favByJoker.get(id);
        if (existing) deleteFav.mutate(existing.id);
        else createFav.mutate(id);
      } else {
        setLocalFavoriteJokers((prev) => {
          const next = new Set(prev);
          next.has(id) ? next.delete(id) : next.add(id);
          return next;
        });
      }
    },
    [isSignedIn, favByJoker, deleteFav, createFav],
  );

  const toggleFavoriteCombo = useCallback((id: string) => {
    setFavoriteCombos((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);
  const isFavoriteCombo = useCallback((id: string) => favoriteCombos.has(id), [favoriteCombos]);

  const setNote = useCallback((key: string, value: string) => {
    setNotes((prev) => ({ ...prev, [key]: value }));
  }, []);

  const favoriteNote = useCallback(
    (jokerId: string) => favByJoker.get(jokerId)?.note ?? "",
    [favByJoker],
  );
  const setFavoriteNote = useCallback(
    (jokerId: string, note: string) => {
      const existing = favByJoker.get(jokerId);
      if (existing) patchFav.mutate({ id: existing.id, note });
    },
    [favByJoker, patchFav],
  );

  const openJokerDetail = useCallback((id: string) => setSelectedJokerId(id), []);
  const closeJokerDetail = useCallback(() => setSelectedJokerId(null), []);

  return (
    <AppContext.Provider
      value={{
        favoriteJokers,
        isFavoriteJoker,
        toggleFavoriteJoker,
        favoriteCombos,
        isFavoriteCombo,
        toggleFavoriteCombo,
        notes,
        setNote,
        favorites: serverFavorites,
        favoriteNote,
        setFavoriteNote,
        selectedJokerId,
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
