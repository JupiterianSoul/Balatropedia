/**
 * Haptic feedback helper.
 *
 * Reads the persisted balatropedia.local.haptics preference.
 * No-ops on web (non-Capacitor) or when haptics are disabled.
 */

const PREF_KEY = "balatropedia.local.haptics";

function isNative(): boolean {
  return !!(window as any).Capacitor?.isNativePlatform?.();
}

function isEnabled(): boolean {
  try {
    const stored = window.localStorage.getItem(PREF_KEY);
    // Default ON if not set
    return stored === null ? true : stored === "true";
  } catch {
    return false;
  }
}

type HapticStyle = "light" | "medium" | "heavy";

const IMPACT_STYLE_MAP = {
  light: "Light",
  medium: "Medium",
  heavy: "Heavy",
} as const;

/** Trigger haptic impact. No-op on web or when disabled. */
export async function triggerHaptic(style: HapticStyle = "light"): Promise<void> {
  if (!isNative()) return;
  if (!isEnabled()) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    await Haptics.impact({ style: ImpactStyle[IMPACT_STYLE_MAP[style]] });
  } catch {
    // Haptics unavailable — ignore
  }
}
