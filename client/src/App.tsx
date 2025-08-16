import React from 'react';
import { Router, Route, Switch } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { GlobalHeader } from '@/components/GlobalHeader';
import { BristolFooter } from '@/components/BristolFooter';
import { ThinkingIndicator } from '@/components/chat/ThinkingIndicator';
import { useAuth } from '@/hooks/useAuth';

// Only import pages that we know work
import Landing from '@/pages/Landing';
import Dashboard from '@/pages/Dashboard';
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

// Auth-protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <PageLoader />;
  }
  
  if (!isAuthenticated) {
    return <Landing />;
  }
  
  return <>{children}</>;
};

// Main app content that uses auth
function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Don't show GlobalHeader on login page
  const showGlobalHeader = isAuthenticated && !isLoading;
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dark Bristol Header - Only show when authenticated */}
      {showGlobalHeader && <GlobalHeader />}
      
      {/* Main Content Area - Light Theme */}
      <div className={showGlobalHeader ? "pt-20" : ""}>
        <Router>
          <Switch>
            <Route path="/">
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            </Route>
            
            <Route path="/dashboard">
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            </Route>
            
            {/* Fallback to dashboard for any other routes temporarily */}
            <Route>
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            </Route>
          </Switch>
        </Router>
      </div>
      
      {/* Thick Bristol Footer - Required for Floating Widget UX */}
      <BristolFooter variant="thick" />
      
      {/* Toast Notifications */}
      <Toaster />
    </div>
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