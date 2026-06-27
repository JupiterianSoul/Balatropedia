import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { IS_LOCAL, handleLocal } from "@/lib/localAdapter";

// In server-backed (web) mode this is empty → relative URLs hit the same origin.
// In local (Capacitor) mode this is unused — the adapter short-circuits the fetch.
export const API_BASE = "__PORT_5000__".startsWith("__") ? "" : "__PORT_5000__";

const TOKEN_STORAGE_KEY = "balatropedia.authToken";

function readPersistedToken(): string | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage?.getItem(TOKEN_STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
}

function writePersistedToken(t: string | null) {
  try {
    if (typeof window === "undefined") return;
    if (t == null) window.localStorage?.removeItem(TOKEN_STORAGE_KEY);
    else window.localStorage?.setItem(TOKEN_STORAGE_KEY, t);
  } catch {
  }
}

let authToken: string | null = readPersistedToken();
export function setAuthToken(t: string | null) {
  authToken = t;
  writePersistedToken(t);
}
export function getAuthToken() {
  return authToken;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Local mode: route everything through the in-app adapter — no network.
  if (IS_LOCAL) {
    const res = await handleLocal(method, url, data);
    await throwIfResNotOk(res);
    return res;
  }

  const headers: Record<string, string> = {};
  if (data) headers["Content-Type"] = "application/json";
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

  const res = await fetch(`${API_BASE}${url}`, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey.join("/");

    if (IS_LOCAL) {
      const res = await handleLocal("GET", url);
      if (unauthorizedBehavior === "returnNull" && res.status === 401) return null;
      await throwIfResNotOk(res);
      return await res.json();
    }

    const headers: Record<string, string> = {};
    if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
    const res = await fetch(`${API_BASE}${url}`, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
