import { createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient, setAuthToken } from "@/lib/queryClient";
import type { PublicUser, SignupInput, LoginInput } from "@shared/schema";

interface AuthState {
  user: PublicUser | null;
  isLoading: boolean;
  signIn: (input: LoginInput) => Promise<PublicUser>;
  signUp: (input: SignupInput) => Promise<PublicUser>;
  signOut: () => Promise<void>;
  isSignedIn: boolean;
}

const AuthContext = createContext<AuthState | null>(null);

async function fetchMe(): Promise<PublicUser | null> {
  try {
    const res = await apiRequest("GET", "/api/auth/me");
    const data = await res.json();
    return data.user as PublicUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data, isLoading } = useQuery<PublicUser | null>({
    queryKey: ["/api/auth/me"],
    queryFn: fetchMe,
    staleTime: Infinity,
  });

  const signInMut = useMutation({
    mutationFn: async (input: LoginInput) => {
      const res = await apiRequest("POST", "/api/auth/login", input);
      const json = await res.json();

      if (json.token) setAuthToken(json.token as string);
      return json.user as PublicUser;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/me"], user);
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/runs"] });
    },
  });

  const signUpMut = useMutation({
    mutationFn: async (input: SignupInput) => {
      const res = await apiRequest("POST", "/api/auth/signup", input);
      const json = await res.json();

      if (json.token) setAuthToken(json.token as string);
      return json.user as PublicUser;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/me"], user);
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/runs"] });
    },
  });

  const signOutMut = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      setAuthToken(null);
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.removeQueries({ queryKey: ["/api/favorites"] });
      queryClient.removeQueries({ queryKey: ["/api/runs"] });
    },
  });

  const user = data ?? null;

  const value: AuthState = {
    user,
    isLoading,
    isSignedIn: !!user,
    signIn: (input) => signInMut.mutateAsync(input),
    signUp: (input) => signUpMut.mutateAsync(input),
    signOut: () => signOutMut.mutateAsync(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

