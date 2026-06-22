import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface RunState {
  slots: string[];
  slotCap: number;
  setSlotCap: (n: number) => void;
  addToRun: (id: string) => boolean;
  removeFromRun: (id: string) => void;
  clearRun: () => void;
  replaceRun: (ids: string[]) => void;
  isInRun: (id: string) => boolean;
  isFull: boolean;

  shop: string[];
  setShop: (ids: string[]) => void;

  deckId: string | null;
  setDeckId: (id: string | null) => void;
  stakeId: string | null;
  setStakeId: (id: string | null) => void;
  voucherIds: string[];
  addVoucher: (id: string) => void;
  removeVoucher: (id: string) => void;
  setVoucherIds: (ids: string[]) => void;
  applyMeta: (meta: { deckId?: string | null; stakeId?: string | null; voucherIds?: string[] } | null) => void;
}

const RunContext = createContext<RunState | null>(null);

export function RunProvider({ children }: { children: ReactNode }) {
  const [slots, setSlots] = useState<string[]>([]);
  const [slotCap, setSlotCapRaw] = useState(5);
  const [shop, setShop] = useState<string[]>([]);
  const [deckId, setDeckId] = useState<string | null>(null);
  const [stakeId, setStakeId] = useState<string | null>(null);
  const [voucherIds, setVoucherIds] = useState<string[]>([]);

  const addVoucher = useCallback((id: string) => {
    setVoucherIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);
  const removeVoucher = useCallback((id: string) => {
    setVoucherIds((prev) => prev.filter((v) => v !== id));
  }, []);
  const applyMeta = useCallback(
    (meta: { deckId?: string | null; stakeId?: string | null; voucherIds?: string[] } | null) => {
      setDeckId(meta?.deckId ?? null);
      setStakeId(meta?.stakeId ?? null);
      setVoucherIds(meta?.voucherIds ?? []);
    },
    [],
  );

  const setSlotCap = useCallback((n: number) => {
    const clamped = Math.max(1, Math.min(10, Math.floor(n) || 1));
    setSlotCapRaw(clamped);
    setSlots((prev) => prev.slice(0, clamped));
  }, []);

  const addToRun = useCallback(
    (id: string): boolean => {
      let added = false;
      setSlots((prev) => {
        if (prev.includes(id) || prev.length >= slotCap) return prev;
        added = true;
        return [...prev, id];
      });
      return added;
    },
    [slotCap],
  );

  const removeFromRun = useCallback((id: string) => {
    setSlots((prev) => prev.filter((s) => s !== id));
  }, []);

  const clearRun = useCallback(() => setSlots([]), []);

  const replaceRun = useCallback(
    (ids: string[]) => {
      setSlots(ids.slice(0, slotCap));
    },
    [slotCap],
  );

  const isInRun = useCallback((id: string) => slots.includes(id), [slots]);

  return (
    <RunContext.Provider
      value={{
        slots,
        slotCap,
        setSlotCap,
        addToRun,
        removeFromRun,
        clearRun,
        replaceRun,
        isInRun,
        isFull: slots.length >= slotCap,
        shop,
        setShop,
        deckId,
        setDeckId,
        stakeId,
        setStakeId,
        voucherIds,
        addVoucher,
        removeVoucher,
        setVoucherIds,
        applyMeta,
      }}
    >
      {children}
    </RunContext.Provider>
  );
}

export function useRun() {
  const ctx = useContext(RunContext);
  if (!ctx) throw new Error("useRun must be used within RunProvider");
  return ctx;
}

