import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from "react";
import type { EntityKind } from "@/lib/entities";

export interface DetailTarget {
  kind: EntityKind;
  id: string;
}

interface DetailState {
  target: DetailTarget | null;
  openDetail: (kind: EntityKind, id: string) => void;
  closeDetail: () => void;
}

const DetailContext = createContext<DetailState | null>(null);

export function DetailProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<DetailTarget | null>(null);

  const openDetail = useCallback((kind: EntityKind, id: string) => {
    setTarget({ kind, id });
  }, []);
  const closeDetail = useCallback(() => setTarget(null), []);

  const value = useMemo<DetailState>(
    () => ({ target, openDetail, closeDetail }),
    [target, openDetail, closeDetail],
  );

  return <DetailContext.Provider value={value}>{children}</DetailContext.Provider>;
}

export function useDetail(): DetailState {
  const ctx = useContext(DetailContext);
  if (!ctx) throw new Error("useDetail must be used within DetailProvider");
  return ctx;
}

/** Convenience hook returning just the opener. */
export function useOpenDetail() {
  return useDetail().openDetail;
}
