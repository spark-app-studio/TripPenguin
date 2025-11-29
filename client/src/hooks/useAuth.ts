import { useQuery } from "@tanstack/react-query";
import type { PublicUser } from "@shared/schema";

async function fetchAuthUser(): Promise<PublicUser | null> {
  const res = await fetch("/api/auth/user", {
    credentials: "include",
  });

  if (res.status === 401) {
    // Simply return null for unauthenticated users
    // Don't clear cache here to avoid infinite loops
    return null;
  }

  if (!res.ok) {
    throw new Error(`${res.status}: ${res.statusText}`);
  }

  return res.json();
}

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<PublicUser | null>({
    queryKey: ["/api/auth/user"],
    queryFn: fetchAuthUser,
    retry: false,
    staleTime: Infinity,
  });

  return {
    user: user ?? undefined,
    isLoading,
    isAuthenticated: !!user,
    error,
  };
}
