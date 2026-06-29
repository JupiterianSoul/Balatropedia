/**
 * APK first-launch reset.
 *
 * Why this exists: the old hand-rolled APK that Julie had installed under the
 * same package id (`app.balatropedia`) wrote settings + sound prefs into
 * localStorage and Capacitor Preferences. When she upgrades to a new build,
 * Android keeps that prior storage attached to the package id, so the fresh
 * app comes up with sound muted, stale flags, and other carryover state.
 *
 * Strategy: every release bumps `APP_BUILD_VERSION`. On boot we check the
 * stored marker — if it doesn't match, we wipe ALL local storage + Capacitor
 * Preferences, then write the new marker. The reset runs synchronously enough
 * before React mounts that no component reads stale values.
 *
 * This only fires in the native APK build (IS_LOCAL). The web build keeps its
 * normal localStorage so user sessions, favorites, and remote sync continue
 * to work the way they always have.
 */
import { Preferences } from "@capacitor/preferences";
import { IS_LOCAL } from "@/lib/localAdapter";

// Bump this string on every APK build that should ship a clean slate.
// Format: vMAJOR.MINOR.PATCH-LABEL  (no semantic meaning beyond comparison).
export const APP_BUILD_VERSION = "v0.3.0-sign-in-removed";

const VERSION_KEY = "balatropedia.app_build_version";

// Keys that survive a reset because they are inert / non-user-state.
// Empty for now — Julie asked for an entirely first-launch experience.
const PRESERVE_KEYS: ReadonlySet<string> = new Set<string>();

async function wipeCapacitorPreferences(): Promise<void> {
  try {
    // Keys() returns every key the native side has stored.
    const { keys } = await Preferences.keys();
    for (const k of keys) {
      if (PRESERVE_KEYS.has(k)) continue;
      try {
        await Preferences.remove({ key: k });
      } catch {
        /* ignore individual key failures */
      }
    }
  } catch {
    // Plugin missing on web — that's expected outside the APK.
  }
}

function wipeLocalStorage(): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && !PRESERVE_KEYS.has(k)) keys.push(k);
    }
    for (const k of keys) window.localStorage.removeItem(k);
  } catch {
    /* storage disabled — nothing to clear */
  }
}

function wipeSessionStorage(): void {
  try {
    if (typeof window === "undefined" || !window.sessionStorage) return;
    window.sessionStorage.clear();
  } catch {
    /* ignore */
  }
}

/**
 * Run the version check + (if needed) reset. Resolves once it's safe to mount
 * React. We deliberately await Preferences calls so the rest of the app boots
 * against the post-reset state, not the dirty state.
 */
export async function runFirstLaunchResetIfNeeded(): Promise<void> {
  // Only act inside the APK / local build. The hosted web app keeps its
  // multi-session storage untouched.
  if (!IS_LOCAL) return;

  let storedVersion: string | null = null;
  try {
    const { value } = await Preferences.get({ key: VERSION_KEY });
    storedVersion = value ?? null;
  } catch {
    storedVersion = null;
  }

  // Fallback to localStorage when Preferences plugin isn't installed (e.g.
  // running the local build in a desktop browser).
  if (storedVersion === null) {
    try {
      storedVersion = window.localStorage?.getItem(VERSION_KEY) ?? null;
    } catch {
      storedVersion = null;
    }
  }

  if (storedVersion === APP_BUILD_VERSION) return;

  // Mismatch — wipe everything, then stamp the new version.
  await wipeCapacitorPreferences();
  wipeLocalStorage();
  wipeSessionStorage();

  try {
    await Preferences.set({ key: VERSION_KEY, value: APP_BUILD_VERSION });
  } catch {
    /* ignore — fallback below still records the version */
  }
  try {
    window.localStorage?.setItem(VERSION_KEY, APP_BUILD_VERSION);
  } catch {
    /* ignore */
  }
}
