import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

export function useAuth() {
  const queryClient = useQueryClient();
  
  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: 2, // Enable retry with limit
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
  });

  // Manual refresh function for recovery
  const refreshAuth = useCallback(async () => {
    console.log("🔄 Manually refreshing authentication...");
    await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    return refetch();
  }, [queryClient, refetch]);

  // Check if error is an auth error
  const isAuthError = error && (
    (error as any)?.status === 401 || 
    (error as any)?.status === 403
  );

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    isAuthError,
    refreshAuth,
  };
}
