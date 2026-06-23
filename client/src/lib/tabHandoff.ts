/**
 * Tab handoff: one-shot session-storage messages used when navigating from
 * the Home search bar to a specific tab. The receiving tab reads the value
 * once in a mount-effect and clears it so subsequent visits start fresh.
 *
 * Used in v1.4.1 to make a search-result click in Home land on the exact
 * synergy / combo / archetype the user picked, not just the tab.
 */

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
    // sessionStorage may be unavailable (private browsing, embed). Silently drop.
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
