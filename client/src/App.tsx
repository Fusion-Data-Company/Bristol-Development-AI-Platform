import React from 'react';
import { Router, Route, Switch } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import SimpleChrome from '@/components/brand/SimpleChrome';
import { ThinkingIndicator } from '@/components/chat/ThinkingIndicator';
import { useAuth } from '@/hooks/useAuth';
import BristolFloatingWidget from '@/components/BristolFloatingWidget';

// Import all pages
import Landing from '@/pages/Landing';
import MapPage from '@/pages/App';
import Sites from '@/pages/Sites';
import Analytics from '@/pages/AnalyticsEnterprise';
import Demographics from '@/pages/DemographicsEnterprise';
import Chat from '@/pages/ChatNew';
import Enterprise from '@/pages/Enterprise';
import { Tools } from '@/pages/Tools';
import Integrations from '@/pages/Integrations';
import Comparables from '@/pages/ComparablesAnnex';
import Users from '@/pages/Users';

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
  // Temporarily bypass auth for development to fix white screen
  const isDevelopment = import.meta.env.DEV;
  
  if (isDevelopment) {
    // In development, show the main app directly
    return (
    <Router>
      <Switch>
        <Route path="/" component={MapPage} />
        <Route path="/sites" component={Sites} />
        <Route path="/analytics-enterprise" component={Analytics} />
        <Route path="/demographics" component={Demographics} />
        <Route path="/chat" component={Chat} />
        <Route path="/enterprise" component={Enterprise} />
        <Route path="/tools" component={Tools} />
        <Route path="/integrations" component={Integrations} />
        <Route path="/comparables" component={Comparables} />
        <Route path="/users" component={Users} />
        
        {/* Fallback to main app */}
        <Route>
          <MapPage />
        </Route>
      </Switch>
      
      {/* Toast Notifications */}
      <Toaster />
      
      {/* Bristol AI Floating Widget - Always visible */}
      <BristolFloatingWidget />
    </Router>
    );
  }
  
  // Production auth flow
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
        <Route path="/" component={MapPage} />
        <Route path="/sites" component={Sites} />
        <Route path="/analytics-enterprise" component={Analytics} />
        <Route path="/demographics" component={Demographics} />
        <Route path="/chat" component={Chat} />
        <Route path="/enterprise" component={Enterprise} />
        <Route path="/tools" component={Tools} />
        <Route path="/integrations" component={Integrations} />
        <Route path="/comparables" component={Comparables} />
        <Route path="/users" component={Users} />
        
        {/* Fallback to main app */}
        <Route>
          <MapPage />
        </Route>
      </Switch>
      
      {/* Toast Notifications */}
      <Toaster />
      
      {/* Bristol AI Floating Widget - Always visible */}
      {/* <BristolFloatingWidget /> */}
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