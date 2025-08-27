import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  // Simplified authentication for internal app - always authenticated
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled: false, // Disable auth queries to prevent errors
  });

  return {
    user: { id: 'internal-user', email: 'internal@company.dev' }, // Mock user for internal app
    isLoading: false, // Never loading
    isAuthenticated: true, // Always authenticated for internal app
  };
}
