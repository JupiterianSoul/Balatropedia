/**
 * Local storage adapter.
 *
 * In APP_MODE === "local" the app must work entirely offline with no Express
 * backend. This module emulates the server's REST surface — same request
 * shapes, same response shapes — using a persistent local key/value store.
 *
 * Storage backend:
 *   - On Capacitor (Android), uses @capacitor/preferences (true OS-backed KV).
 *   - On regular web (e.g., running `npm run build:app` in a browser for
 *     testing), falls back to window.localStorage.
 *
 * Important: response shapes here MUST mirror server/routes.ts and the Zod
 * schemas in shared/schema.ts so that no React component, hook, or page has to
 * change.
 */

import { insertFavoriteSchema, insertRunSchema, updateFavoriteSchema, updateRunSchema, updateLanguageSchema } from "@shared/schema";
import type { Favorite, Run, PublicUser } from "@shared/schema";

// ---------- KV backend ----------

type KV = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
};

let kv: KV;

async function initKV(): Promise<KV> {
  if (kv) return kv;
  // Capacitor detection — runtime, not build-time, so the web build is unaffected.
  const isCapacitor =
    typeof window !== "undefined" &&
    !!(window as any).Capacitor &&
    typeof (window as any).Capacitor.isNativePlatform === "function" &&
    (window as any).Capacitor.isNativePlatform();
  if (isCapacitor) {
    try {
      const mod = await import("@capacitor/preferences");
      const Preferences = mod.Preferences;
      kv = {
        async get(k) {
          const r = await Preferences.get({ key: k });
          return r.value ?? null;
        },
        async set(k, v) {
          await Preferences.set({ key: k, value: v });
        },
        async remove(k) {
          await Preferences.remove({ key: k });
        },
      };
      return kv;
    } catch (e) {
      console.warn("Capacitor Preferences unavailable, falling back to localStorage", e);
    }
  }
  kv = {
    async get(k) {
      try { return window.localStorage.getItem(k); } catch { return null; }
    },
    async set(k, v) {
      try { window.localStorage.setItem(k, v); } catch {}
    },
    async remove(k) {
      try { window.localStorage.removeItem(k); } catch {}
    },
  };
  return kv;
}

// ---------- helpers ----------

const NS = "balatropedia.local";
const K_FAVORITES = `${NS}.favorites`;
const K_RUNS = `${NS}.runs`;
const K_LANGUAGE = `${NS}.language`;
const K_NEXT_ID = `${NS}.nextId`;

const LOCAL_USER_ID = 1;

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const store = await initKV();
  const raw = await store.get(key);
  if (raw == null) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  const store = await initKV();
  await store.set(key, JSON.stringify(value));
}

async function nextId(): Promise<number> {
  const store = await initKV();
  const raw = await store.get(K_NEXT_ID);
  const cur = raw ? parseInt(raw, 10) || 0 : 0;
  const next = cur + 1;
  await store.set(K_NEXT_ID, String(next));
  return next;
}

async function getLanguage(): Promise<string> {
  const store = await initKV();
  return (await store.get(K_LANGUAGE)) ?? "en";
}

async function publicUser(): Promise<PublicUser> {
  return {
    id: LOCAL_USER_ID,
    email: "local@balatropedia.app",
    language: await getLanguage(),
  };
}

// Build a fetch-like Response so the rest of the codebase keeps treating
// `apiRequest` calls as if they hit the network.
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
function noContent(): Response {
  return new Response(null, { status: 204 });
}
function errorResponse(message: string, status: number): Response {
  return new Response(JSON.stringify({ message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Limits mirror server/routes.ts so behaviour stays consistent.
const MAX_FAVORITES = 500;
const MAX_RUNS = 200;

// ---------- request dispatcher ----------

export async function handleLocal(
  method: string,
  url: string,
  data?: unknown,
): Promise<Response> {
  const path = url.split("?")[0];

  // ----- auth -----
  if (path === "/api/auth/me" && method === "GET") {
    return jsonResponse({ user: await publicUser() });
  }
  if (path === "/api/auth/login" || path === "/api/auth/signup") {
    // No real accounts in local mode — return the local user with a dummy token.
    return jsonResponse({ user: await publicUser(), token: "local" });
  }
  if (path === "/api/auth/logout") {
    return noContent();
  }
  if (path === "/api/auth/language" && method === "PATCH") {
    const parsed = updateLanguageSchema.safeParse(data);
    if (!parsed.success) return errorResponse("Invalid language", 400);
    const store = await initKV();
    await store.set(K_LANGUAGE, parsed.data.language);
    return jsonResponse({ user: await publicUser() });
  }

  // ----- favorites -----
  if (path === "/api/favorites" && method === "GET") {
    const favs = await readJson<Favorite[]>(K_FAVORITES, []);
    return jsonResponse(favs);
  }
  if (path === "/api/favorites" && method === "POST") {
    const parsed = insertFavoriteSchema.safeParse(data);
    if (!parsed.success) return errorResponse("Invalid input", 400);
    const favs = await readJson<Favorite[]>(K_FAVORITES, []);
    const existing = favs.find((f) => f.jokerId === parsed.data.jokerId);
    if (existing) return jsonResponse(existing);
    if (favs.length >= MAX_FAVORITES) {
      return errorResponse(`Favorite limit reached (${MAX_FAVORITES}).`, 409);
    }
    const fav: Favorite = {
      id: await nextId(),
      userId: LOCAL_USER_ID,
      jokerId: parsed.data.jokerId,
      note: parsed.data.note ?? null,
      createdAt: Date.now(),
    };
    favs.push(fav);
    await writeJson(K_FAVORITES, favs);
    return jsonResponse(fav);
  }
  if (path.startsWith("/api/favorites/") && method === "PATCH") {
    const id = Number(path.split("/").pop());
    const parsed = updateFavoriteSchema.safeParse(data);
    if (!parsed.success) return errorResponse("Invalid input", 400);
    const favs = await readJson<Favorite[]>(K_FAVORITES, []);
    const idx = favs.findIndex((f) => f.id === id);
    if (idx < 0) return errorResponse("Favorite not found", 404);
    favs[idx] = { ...favs[idx], note: parsed.data.note };
    await writeJson(K_FAVORITES, favs);
    return jsonResponse(favs[idx]);
  }
  if (path.startsWith("/api/favorites/") && method === "DELETE") {
    const id = Number(path.split("/").pop());
    const favs = await readJson<Favorite[]>(K_FAVORITES, []);
    const filtered = favs.filter((f) => f.id !== id);
    await writeJson(K_FAVORITES, filtered);
    return noContent();
  }

  // ----- runs -----
  // Server stores jokerIds/meta as JSON strings; the serializeRun helper turns
  // them back into structured fields on the way out. Mirror that here.
  type StoredRun = {
    id: number;
    userId: number;
    name: string;
    jokerIds: string; // JSON
    notes: string | null;
    meta: string | null;
    createdAt: number;
  };
  function serializeRun(r: StoredRun) {
    return {
      id: r.id,
      userId: r.userId,
      name: r.name,
      jokerIds: JSON.parse(r.jokerIds) as string[],
      notes: r.notes,
      meta: r.meta ? JSON.parse(r.meta) : null,
      createdAt: r.createdAt,
    };
  }

  if (path === "/api/runs" && method === "GET") {
    const runs = await readJson<StoredRun[]>(K_RUNS, []);
    return jsonResponse(runs.map(serializeRun));
  }
  if (path === "/api/runs" && method === "POST") {
    const parsed = insertRunSchema.safeParse(data);
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message ?? "Invalid input";
      return errorResponse(msg, 400);
    }
    const runs = await readJson<StoredRun[]>(K_RUNS, []);
    if (runs.length >= MAX_RUNS) {
      return errorResponse(`Run limit reached (${MAX_RUNS}).`, 409);
    }
    const run: StoredRun = {
      id: await nextId(),
      userId: LOCAL_USER_ID,
      name: parsed.data.name,
      jokerIds: JSON.stringify(parsed.data.jokerIds),
      notes: parsed.data.notes ?? null,
      meta: parsed.data.meta ? JSON.stringify(parsed.data.meta) : null,
      createdAt: Date.now(),
    };
    runs.push(run);
    await writeJson(K_RUNS, runs);
    return jsonResponse(serializeRun(run));
  }
  if (path.startsWith("/api/runs/") && method === "PATCH") {
    const id = Number(path.split("/").pop());
    const parsed = updateRunSchema.safeParse(data);
    if (!parsed.success) return errorResponse("Invalid input", 400);
    const runs = await readJson<StoredRun[]>(K_RUNS, []);
    const idx = runs.findIndex((r) => r.id === id);
    if (idx < 0) return errorResponse("Run not found", 404);
    const cur = runs[idx];
    const updated: StoredRun = {
      ...cur,
      name: parsed.data.name ?? cur.name,
      jokerIds: parsed.data.jokerIds !== undefined ? JSON.stringify(parsed.data.jokerIds) : cur.jokerIds,
      notes: parsed.data.notes !== undefined ? parsed.data.notes : cur.notes,
      meta:
        parsed.data.meta !== undefined
          ? (parsed.data.meta ? JSON.stringify(parsed.data.meta) : null)
          : cur.meta,
    };
    runs[idx] = updated;
    await writeJson(K_RUNS, runs);
    return jsonResponse(serializeRun(updated));
  }
  if (path.startsWith("/api/runs/") && method === "DELETE") {
    const id = Number(path.split("/").pop());
    const runs = await readJson<StoredRun[]>(K_RUNS, []);
    await writeJson(K_RUNS, runs.filter((r) => r.id !== id));
    return noContent();
  }

  // Health probe — used in some places to verify connectivity.
  if (path === "/api/health") return jsonResponse({ ok: true });

  return errorResponse(`Local adapter: unhandled route ${method} ${url}`, 404);
}

export const APP_MODE = (import.meta.env.VITE_APP_MODE as string | undefined) ?? "web";
export const IS_LOCAL = APP_MODE === "local";
