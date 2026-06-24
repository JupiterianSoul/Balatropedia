
const KEYS = {
  synergyJoker: "balatropedia.handoff.synergyJoker",
  comboId: "balatropedia.handoff.comboId",
  archetypeId: "balatropedia.handoff.archetypeId",
} as const;

export type HandoffKey = keyof typeof KEYS;

export function setHandoff(key: HandoffKey, value: string): void {
  try {
    sessionStorage.setItem(KEYS[key], value);
  } catch {
  }
}

export function readHandoff(key: HandoffKey): string | null {
  try {
    const v = sessionStorage.getItem(KEYS[key]);
    if (v !== null) sessionStorage.removeItem(KEYS[key]);
    return v;
  } catch {
    return null;
  }
}
