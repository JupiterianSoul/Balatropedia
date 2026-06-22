import { QueryClient, QueryFunction } from "@tanstack/react-query";

export const API_BASE = "__PORT_5000__".startsWith("__") ? "" : "__PORT_5000__";

// In-memory bearer token. The deployed app runs in a cross-site iframe where
// `sameSite: none` cookies are dropped, so auth is carried via an Authorization
// header instead. The token lives only in memory (no localStorage in sandbox),
// so it does not survive a page reload; that is expected behavior.
let authToken: string | null = null;
export function setAuthToken(t: string | null) {
  authToken = t;
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
    const headers: Record<string, string> = {};
    if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
    const res = await fetch(`${API_BASE}${queryKey.join("/")}`, {
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
