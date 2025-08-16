import React from 'react';
import { Router, Route, Switch } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import BristolFloatingWidget from '@/components/BristolFloatingWidget';

// Import all pages
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
}

export default App;