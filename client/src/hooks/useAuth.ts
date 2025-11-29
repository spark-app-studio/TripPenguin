import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import type { PublicUser } from "@shared/schema";
import { getQueryFn, queryClient } from "@/lib/queryClient";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<PublicUser | null>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    staleTime: Infinity,
  });

  // Auto-clear stale cache on mount
  useEffect(() => {
    const checkStaleness = async () => {
      // If we have user data, validate it's still fresh
      if (user && typeof window !== "undefined") {
        const lastCheck = sessionStorage.getItem("lastAuthCheck");
        const now = Date.now();
        
        // Check if it's been more than 10 minutes since last validation
        if (!lastCheck || now - parseInt(lastCheck) > 10 * 60 * 1000) {
          sessionStorage.setItem("lastAuthCheck", now.toString());
          // Revalidate in background
          queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        }
      }
    };
    
    checkStaleness();
  }, [user]);

  return {
    user: user ?? undefined,
    isLoading,
    isAuthenticated: !!user,
    error,
  };
}
