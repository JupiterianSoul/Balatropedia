/**
 * Firebase initialization — Google sign-in + Firestore cloud sync.
 *
 * Activated only when the user provides `VITE_FIREBASE_*` env vars at build
 * time. Without those, the module exposes safe no-op stubs and the rest of
 * the app continues to use the local-only persistence path.
 *
 * Required env (web + Capacitor APK):
 *   VITE_FIREBASE_API_KEY
 *   VITE_FIREBASE_AUTH_DOMAIN
 *   VITE_FIREBASE_PROJECT_ID
 *   VITE_FIREBASE_APP_ID
 * Optional:
 *   VITE_FIREBASE_STORAGE_BUCKET
 *   VITE_FIREBASE_MESSAGING_SENDER_ID
 *
 * On the APK we use Capacitor's in-app browser session via the standard
 * Firebase Web SDK; this works in WebView because we whitelist
 * `app.balatropedia` in firebaseauth (authorized domains).
 *
 * Cloud-sync schema (Firestore):
 *   /users/{uid}/state/main      — { favorites, runs, prefs, version, updatedAt }
 *   /users/{uid}/tierlists/{id}  — TierList document
 */

import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  type Auth,
  type User as FirebaseUser,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  deleteDoc,
  serverTimestamp,
  type Firestore,
} from "firebase/firestore";

const env = (import.meta as any).env ?? {};

export const FIREBASE_CONFIG = {
  apiKey: env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: env.VITE_FIREBASE_APP_ID as string | undefined,
};

export const FIREBASE_ENABLED: boolean =
  !!FIREBASE_CONFIG.apiKey &&
  !!FIREBASE_CONFIG.authDomain &&
  !!FIREBASE_CONFIG.projectId &&
  !!FIREBASE_CONFIG.appId;

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;

function init(): { app: FirebaseApp; auth: Auth; db: Firestore } | null {
  if (!FIREBASE_ENABLED) return null;
  if (!_app) {
    try {
      _app = initializeApp({
        apiKey: FIREBASE_CONFIG.apiKey!,
        authDomain: FIREBASE_CONFIG.authDomain!,
        projectId: FIREBASE_CONFIG.projectId!,
        storageBucket: FIREBASE_CONFIG.storageBucket,
        messagingSenderId: FIREBASE_CONFIG.messagingSenderId,
        appId: FIREBASE_CONFIG.appId!,
      });
      _auth = getAuth(_app);
      _db = getFirestore(_app);
    } catch (e) {
      console.error("[firebase] init failed", e);
      return null;
    }
  }
  return { app: _app!, auth: _auth!, db: _db! };
}

export interface FirebaseUserSummary {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

function toSummary(u: FirebaseUser | null): FirebaseUserSummary | null {
  if (!u) return null;
  return {
    uid: u.uid,
    email: u.email,
    displayName: u.displayName,
    photoURL: u.photoURL,
  };
}

/** Subscribe to auth state changes. Returns an unsubscribe function. */
export function subscribeAuth(cb: (user: FirebaseUserSummary | null) => void): () => void {
  const ctx = init();
  if (!ctx) {
    cb(null);
    return () => {};
  }
  return onAuthStateChanged(ctx.auth, (u) => cb(toSummary(u)));
}

/** Trigger a Google sign-in popup (works in browser + WebView). */
export async function signInWithGoogle(): Promise<FirebaseUserSummary | null> {
  const ctx = init();
  if (!ctx) throw new Error("Firebase is not configured. Set VITE_FIREBASE_* env vars at build time.");
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const result = await signInWithPopup(ctx.auth, provider);
  return toSummary(result.user);
}

/** Sign the current user out. */
export async function signOut(): Promise<void> {
  const ctx = init();
  if (!ctx) return;
  await fbSignOut(ctx.auth);
}

/** Return the current user summary (synchronous, no waiting). */
export function getCurrentUser(): FirebaseUserSummary | null {
  const ctx = init();
  if (!ctx) return null;
  return toSummary(ctx.auth.currentUser);
}

// ----------------------------- cloud sync -----------------------------

export interface CloudState {
  favorites?: { jokers: string[]; combos: string[] };
  runs?: any[];
  prefs?: Record<string, unknown>;
  version?: number;
  updatedAt?: number;
}

/** Write the main state blob for the current user. */
export async function pushCloudState(uid: string, state: CloudState): Promise<void> {
  const ctx = init();
  if (!ctx) return;
  const ref = doc(ctx.db, "users", uid, "state", "main");
  await setDoc(ref, { ...state, updatedAt: Date.now(), serverUpdatedAt: serverTimestamp() }, { merge: true });
}

/** Read the main state blob for the current user. Returns null if no document. */
export async function pullCloudState(uid: string): Promise<CloudState | null> {
  const ctx = init();
  if (!ctx) return null;
  const ref = doc(ctx.db, "users", uid, "state", "main");
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as CloudState;
}

/** Upsert a tier list document for the current user. */
export async function pushCloudTierList(uid: string, list: { id: string; [k: string]: any }): Promise<void> {
  const ctx = init();
  if (!ctx) return;
  const ref = doc(ctx.db, "users", uid, "tierlists", list.id);
  await setDoc(ref, { ...list, updatedAt: Date.now(), serverUpdatedAt: serverTimestamp() }, { merge: true });
}

/** Fetch all tier list documents for the current user. */
export async function pullCloudTierLists(uid: string): Promise<any[]> {
  const ctx = init();
  if (!ctx) return [];
  const col = collection(ctx.db, "users", uid, "tierlists");
  const snap = await getDocs(col);
  return snap.docs.map((d) => d.data());
}

/** Delete a tier list document. */
export async function deleteCloudTierList(uid: string, id: string): Promise<void> {
  const ctx = init();
  if (!ctx) return;
  const ref = doc(ctx.db, "users", uid, "tierlists", id);
  await deleteDoc(ref);
}
