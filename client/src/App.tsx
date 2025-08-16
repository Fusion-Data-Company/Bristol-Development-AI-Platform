import React from 'react';
import { Router, Route, Switch } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import SimpleChrome from '@/components/brand/SimpleChrome';
import { ThinkingIndicator } from '@/components/chat/ThinkingIndicator';
import { useAuth } from '@/hooks/useAuth';

// Only import pages that we know work
import Landing from '@/pages/Landing';
import Dashboard from '@/pages/Dashboard';
import Users from '@/pages/Users';
import NotFound from '@/pages/not-found';

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
  },
});

// Loading component
const PageLoader = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <ThinkingIndicator isThinking={true} size="lg" />
      <p className="mt-4 text-gray-600">Loading Bristol Intelligence...</p>
    </div>
  </div>
);

// Auth-protected route wrapper with enhanced error handling
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, isAuthError, refreshAuth } = useAuth();
  
  if (isLoading) {
    return <PageLoader />;
  }
  
  if (!isAuthenticated) {
    // If there's an auth error, show a recovery option
    if (isAuthError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
            <p className="text-gray-600 mb-6">Your session may have expired. Please sign in again to continue.</p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/api/login'}
                className="w-full px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all"
              >
                Sign In with Replit Auth
              </button>
              <button
                onClick={() => refreshAuth()}
                className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-all"
              >
                Retry Connection
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    return <Landing />;
  }
  
  return <>{children}</>;
};

// Main app content that uses auth
function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <PageLoader />;
  }
  
  if (!isAuthenticated) {
    return <Landing />;
  }
  
  return (
    <Router>
      <Switch>
        <Route path="/">
          <Dashboard />
        </Route>
        
        <Route path="/dashboard">
          <Dashboard />
        </Route>
        
        <Route path="/users">
          <Users />
        </Route>
        
        {/* Fallback to dashboard for any other routes temporarily */}
        <Route>
          <Dashboard />
        </Route>
      </Switch>
      
      {/* Toast Notifications */}
      <Toaster />
    </Router>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;