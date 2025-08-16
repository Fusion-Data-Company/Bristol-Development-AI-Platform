import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  // Always return authenticated for immediate app access
  return {
    user: { id: "demo-user", email: "demo@bristol.dev" },
    isLoading: false,
    isAuthenticated: true,
  };
}
