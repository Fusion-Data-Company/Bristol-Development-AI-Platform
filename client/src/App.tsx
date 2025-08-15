import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { GlobalHeader } from "@/components/GlobalHeader";

import BristolFloatingWidget from "@/components/BristolFloatingWidget";

import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Sites from "@/pages/Sites";
import Analytics from "@/pages/Analytics";
import Chat from "@/pages/Chat";
import Integrations from "@/pages/Integrations";
import MainApp from "@/pages/App";
import ToolsConsole from "@/pages/ToolsConsole";
import IntegrationsNew from "@/pages/IntegrationsNew";
import Demographics from "@/pages/Demographics";
import { Tools } from "@/pages/Tools";
import ComparablesAnnex from "@/pages/ComparablesAnnex";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={MainApp} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/sites" component={Sites} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/demographics" component={Demographics} />
          <Route path="/chat" component={Chat} />
          <Route path="/integrations" component={IntegrationsNew} />
          <Route path="/tools-console" component={ToolsConsole} />
          <Route path="/tools" component={Tools} />
          <Route path="/comparables" component={ComparablesAnnex} />
          <Route path="/comparables-annex" component={ComparablesAnnex} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [location] = useLocation();
  
  // Aggregate app data for Bristol Floating Widget
  const { data: sites } = useQuery({
    queryKey: ['/api/sites'],
    enabled: isAuthenticated,
  });
  
  const { data: analytics } = useQuery({
    queryKey: ['/api/analytics/overview'],
    enabled: isAuthenticated,
  });
  
  // Combine all data sources
  const appData = {
    sites: sites || [],
    analytics: analytics || {},
    timestamp: new Date().toISOString(),
    user: { authenticated: isAuthenticated }
  };
  
  return (
    <>
      {/* Global Header - Always visible when authenticated */}
      {isAuthenticated && location !== "/landing" && <GlobalHeader />}
      
      {/* Main content with header spacing */}
      <div className={isAuthenticated && location !== "/landing" ? "pt-20" : ""}>
        <Router />
      </div>
      
      {/* Hide Bristol Floating Widget on chat page */}
      {isAuthenticated && location !== '/chat' && (
        <BristolFloatingWidget 
            appData={appData}
            webhookUrl={import.meta.env.VITE_N8N_WEBHOOK_URL}
            onSaveSystemPrompt={async (prompt) => {
              try {
                console.log("System prompt saved:", prompt.length, "characters");
              } catch (error) {
                console.error("Error saving system prompt:", error);
              }
            }}
            onSend={async (payload) => {
              try {
                console.log("Chat sent:", payload.model, payload.messages.length, "messages");
              } catch (error) {
                console.error("Error sending chat:", error);
              }
            }}
          />
      )}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
