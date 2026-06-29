/**
 * Local-only saved runs.
 *
 * Replaces the previous server-backed implementation. Runs are stored in
 * localStorage under `bp.runs.v1`. IDs are monotonic integers seeded from the
 * current max + 1 so existing call sites that key on `run.id` keep working.
 */
import { useCallback, useEffect, useState } from "react";

export interface RunMeta {
  deckId?: string | null;
  stakeId?: string | null;
  voucherIds?: string[];
}

export interface SavedRun {
  id: number;
  userId: number;
  name: string;
  jokerIds: string[];
  notes: string | null;
  meta: RunMeta | null;
  createdAt: number;
}

const LS_KEY = "bp.runs.v1";

function loadRuns(): SavedRun[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as SavedRun[]) : [];
  } catch {
    return [];
  }
}
function saveRuns(runs: SavedRun[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(runs)); } catch {}
}

export function useRuns() {
  const [runs, setRuns] = useState<SavedRun[]>(() => loadRuns());

  useEffect(() => { saveRuns(runs); }, [runs]);

  const saveRun = {
    mutateAsync: useCallback(async (input: { name: string; jokerIds: string[]; notes?: string | null; meta?: RunMeta | null }) => {
      const newRun: SavedRun = {
        id: runs.reduce((m, r) => Math.max(m, r.id), 0) + 1,
        userId: 0,
        name: input.name,
        jokerIds: input.jokerIds,
        notes: input.notes ?? null,
        meta: input.meta ?? null,
        createdAt: Date.now(),
      };
      setRuns((prev) => [newRun, ...prev]);
      return newRun;
    }, [runs]),
    mutate(input: { name: string; jokerIds: string[]; notes?: string | null; meta?: RunMeta | null }) {
      void this.mutateAsync(input);
    },
  };

  const deleteRun = {
    mutateAsync: useCallback(async (id: number) => {
      setRuns((prev) => prev.filter((r) => r.id !== id));
    }, []),
    mutate(id: number) { void this.mutateAsync(id); },
  };

  return { runs, isLoading: false, saveRun, deleteRun };
}
