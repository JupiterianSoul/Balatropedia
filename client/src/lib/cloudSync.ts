/**
 * Cloud Sync controller — bridges localStorage <-> Firestore.
 *
 * Sync algorithm (last-write-wins by timestamp):
 *   - On sign-in: pull cloud state; if cloud is newer than local, replace
 *     local; otherwise push local up.
 *   - On every local write while signed in: debounced push (3s).
 *   - On manual "Sync now": full bidirectional reconcile.
 *
 * Auto-sync is opt-in via `balatropedia.local.cloudSync.enabled`. We do not
 * touch the cloud unless the user has explicitly enabled it.
 */

import {
  FIREBASE_ENABLED,
  getCurrentUser,
  subscribeAuth,
  pushCloudState,
  pullCloudState,
  pushCloudTierList,
  pullCloudTierLists,
  type FirebaseUserSummary,
  type CloudState,
} from "@/lib/firebase";

const NS = "balatropedia.local";
const K_FAVORITES = `${NS}.favorites`;
const K_RUNS = `${NS}.runs`;
const K_TIERLISTS = `${NS}.tierlists`;
const K_LAST_SYNC = `${NS}.cloudSync.lastAt`;
const K_ENABLED = `${NS}.cloudSync.enabled`;

const PREF_KEYS = [
  `${NS}.language`,
  `${NS}.uiScale`,
  `${NS}.haptics`,
  `${NS}.sounds`,
  `${NS}.velvet`,
  `${NS}.startupTab`,
];

export type SyncStatus = "idle" | "pushing" | "pulling" | "error" | "disabled";

interface SyncListener {
  (state: { status: SyncStatus; lastAt: number | null; user: FirebaseUserSummary | null; error?: string }): void;
}

let listeners: SyncListener[] = [];
let currentStatus: SyncStatus = "idle";
let currentError: string | undefined;
let currentUser: FirebaseUserSummary | null = null;
let pushTimer: ReturnType<typeof setTimeout> | null = null;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeJson(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}
function readString(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function writeString(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
}

export function isCloudSyncAvailable(): boolean {
  return FIREBASE_ENABLED;
}

export function isCloudSyncEnabled(): boolean {
  return readString(K_ENABLED) === "1";
}

export function setCloudSyncEnabled(enabled: boolean) {
  writeString(K_ENABLED, enabled ? "1" : "0");
  if (enabled && currentUser) {
    // Trigger an initial reconcile when toggled on.
    void reconcile();
  }
  notify();
}

export function getLastSyncAt(): number | null {
  const raw = readString(K_LAST_SYNC);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function setLastSyncAt(ts: number) {
  writeString(K_LAST_SYNC, String(ts));
}

function notify() {
  const payload = {
    status: currentStatus,
    lastAt: getLastSyncAt(),
    user: currentUser,
    error: currentError,
  };
  for (const l of listeners) {
    try { l(payload); } catch { /* ignore listener errors */ }
  }
}

export function subscribeSync(cb: SyncListener): () => void {
  listeners.push(cb);
  // Fire current state immediately
  try {
    cb({ status: currentStatus, lastAt: getLastSyncAt(), user: currentUser, error: currentError });
  } catch { /* ignore */ }
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
}

function snapshotLocal(): CloudState {
  const prefs: Record<string, unknown> = {};
  for (const k of PREF_KEYS) {
    const v = readString(k);
    if (v !== null) prefs[k] = v;
  }
  const favs = readJson<any[]>(K_FAVORITES, []);
  const runs = readJson<any[]>(K_RUNS, []);
  return {
    favorites: {
      jokers: favs.filter((f) => f?.type === "joker" || f?.kind === "joker").map((f) => f.id ?? f.itemId),
      combos: favs.filter((f) => f?.type === "combo" || f?.kind === "combo").map((f) => f.id ?? f.itemId),
    },
    runs,
    prefs,
    version: 1,
    updatedAt: Date.now(),
  };
}

function applyCloud(state: CloudState) {
  // Prefs
  if (state.prefs) {
    for (const [k, v] of Object.entries(state.prefs)) {
      if (typeof v === "string") writeString(k, v);
    }
  }
  // Favorites: rebuild the local-favorites array. The localAdapter stores
  // entries as plain { type, id }; tolerate older shapes by re-emitting
  // both `type` and `kind`.
  if (state.favorites) {
    const favs = [
      ...state.favorites.jokers.map((id) => ({ id, type: "joker", kind: "joker", addedAt: Date.now() })),
      ...state.favorites.combos.map((id) => ({ id, type: "combo", kind: "combo", addedAt: Date.now() })),
    ];
    writeJson(K_FAVORITES, favs);
  }
  // Runs (replace wholesale — last-write-wins by timestamp at the document level)
  if (state.runs) writeJson(K_RUNS, state.runs);
}

/** Bidirectional reconcile. Cloud or local — whichever is newer — wins for the main state. */
export async function reconcile(): Promise<void> {
  if (!FIREBASE_ENABLED || !currentUser) return;
  currentStatus = "pulling";
  currentError = undefined;
  notify();
  try {
    const cloud = await pullCloudState(currentUser.uid);
    const localTs = (() => {
      // Use the larger of: last sync timestamp, or 0. We track local writes
      // by bumping K_LAST_SYNC after every successful push.
      return getLastSyncAt() ?? 0;
    })();

    if (cloud && (cloud.updatedAt ?? 0) > localTs) {
      applyCloud(cloud);
    } else {
      // Push local up
      currentStatus = "pushing";
      notify();
      await pushCloudState(currentUser.uid, snapshotLocal());
    }

    // Tier lists: pull cloud, merge into local by id (cloud wins per-list by updatedAt)
    const cloudTiers = await pullCloudTierLists(currentUser.uid);
    const localTiers = readJson<any[]>(K_TIERLISTS, []);
    const merged = new Map<string, any>();
    for (const t of localTiers) merged.set(t.id, t);
    for (const t of cloudTiers) {
      const existing = merged.get(t.id);
      if (!existing || (t.updatedAt ?? 0) > (existing.updatedAt ?? 0)) merged.set(t.id, t);
    }
    // Push any local-only or newer-local lists up
    for (const t of merged.values()) {
      const cloudVer = cloudTiers.find((c) => c.id === t.id);
      if (!cloudVer || (t.updatedAt ?? 0) > (cloudVer.updatedAt ?? 0)) {
        await pushCloudTierList(currentUser.uid, t);
      }
    }
    writeJson(K_TIERLISTS, Array.from(merged.values()));

    setLastSyncAt(Date.now());
    currentStatus = "idle";
    notify();
  } catch (e: any) {
    currentStatus = "error";
    currentError = e?.message ?? String(e);
    notify();
    throw e;
  }
}

/** Schedule a debounced push of the current local state. */
export function schedulePush() {
  if (!FIREBASE_ENABLED || !currentUser || !isCloudSyncEnabled()) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(async () => {
    pushTimer = null;
    try {
      currentStatus = "pushing";
      notify();
      await pushCloudState(currentUser!.uid, snapshotLocal());
      setLastSyncAt(Date.now());
      currentStatus = "idle";
      currentError = undefined;
      notify();
    } catch (e: any) {
      currentStatus = "error";
      currentError = e?.message ?? String(e);
      notify();
    }
  }, 3000);
}

/** Manual "Sync now" — full reconcile + push. */
export async function syncNow(): Promise<void> {
  if (!isCloudSyncEnabled() || !currentUser) return;
  await reconcile();
}

let _watcherInstalled = false;
let _authUnsub: (() => void) | null = null;

/** Install the auth-state listener + storage-event watcher. Call once at app boot. */
export function installCloudSync() {
  if (_watcherInstalled) return;
  _watcherInstalled = true;
  if (!FIREBASE_ENABLED) {
    currentStatus = "disabled";
    notify();
    return;
  }

  // Hydrate from existing user (if Firebase already restored a session)
  currentUser = getCurrentUser();
  notify();

  _authUnsub = subscribeAuth(async (user) => {
    currentUser = user;
    notify();
    if (user && isCloudSyncEnabled()) {
      try {
        await reconcile();
      } catch (e) {
        console.error("[cloudSync] auto-reconcile failed", e);
      }
    }
  });

  // Cross-tab storage event — debounced push so changes in one tab roll up.
  window.addEventListener("storage", (e) => {
    if (!e.key) return;
    if (e.key.startsWith(NS) && e.key !== K_LAST_SYNC && e.key !== K_ENABLED) {
      schedulePush();
    }
  });
}

export function uninstallCloudSync() {
  if (_authUnsub) { _authUnsub(); _authUnsub = null; }
  _watcherInstalled = false;
}
