/**
 * Local-only auth stub.
 *
 * The Google Sign-In / email-password account feature was removed entirely:
 * Balatropedia is now a fully offline single-user APK and there is no server
 * exchange, no token storage, and no sign-in UI.
 *
 * This file keeps the `useAuth()` shape so the dozen call sites that still
 * call `const { isSignedIn } = useAuth()` continue to compile without edits.
 * It always reports the user as signed out, with no-op mutations. The
 * AuthProvider is also a passthrough so the React tree in main.tsx is
 * untouched.
 */
import type { ReactNode } from "react";

interface AuthState {
  user: null;
  isLoading: false;
  isSignedIn: false;
  signIn: () => Promise<never>;
  signUp: () => Promise<never>;
  signOut: () => Promise<void>;
}

const NOOP_AUTH: AuthState = {
  user: null,
  isLoading: false,
  isSignedIn: false,
  signIn: () => Promise.reject(new Error("auth disabled in local build")),
  signUp: () => Promise.reject(new Error("auth disabled in local build")),
  signOut: () => Promise.resolve(),
};

export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useAuth(): AuthState {
  return NOOP_AUTH;
}
