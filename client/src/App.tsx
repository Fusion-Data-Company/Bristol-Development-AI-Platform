import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { GlobalHeader } from "@/components/GlobalHeader";
import { ErrorBoundary, setupGlobalErrorHandling } from "@/components/ErrorBoundary";
import { useEffect } from "react";

import PopoutAgent from "@/components/PopoutAgent";
import ElevenLabsWidget from "@/components/ElevenLabsWidget";

import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Sites from "@/pages/Sites";
import Analytics from "@/pages/Analytics";
import AnalyticsEnterprise from "@/pages/AnalyticsEnterprise";
import EnterpriseAnalytics from "@/pages/EnterpriseAnalytics";
import Chat from "@/pages/Chat";
import Integrations from "@/pages/Integrations";
import MainApp from "@/pages/App";
import ToolsConsole from "@/pages/ToolsConsole";
import IntegrationsNew from "@/pages/IntegrationsNew";
import Demographics from "@/pages/Demographics";
import { Tools } from "@/pages/Tools";
import ComparablesAnnex from "@/pages/ComparablesAnnex";
import EnterpriseDashboard from "@/pages/EnterpriseDashboard";
import EnhancedAgents from "@/pages/EnhancedAgents";
import Maps2 from "@/pages/Maps2";
import ProductionStatus from "@/pages/ProductionStatus";
import PlaceholderReplace from "@/pages/PlaceholderReplace";
import CompetitorWatch from "@/pages/CompetitorWatch";



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
          <Route path="/enterprise" component={EnterpriseDashboard} />
          <Route path="/enterprise-dashboard" component={EnterpriseDashboard} />
          <Route path="/sites" component={Sites} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/analytics-enterprise" component={AnalyticsEnterprise} />
          <Route path="/enterprise-analytics" component={EnterpriseAnalytics} />
          <Route path="/demographics" component={Demographics} />
          <Route path="/chat" component={Chat} />
          <Route path="/integrations" component={IntegrationsNew} />
          <Route path="/tools-console" component={ToolsConsole} />
          <Route path="/tools" component={Tools} />
          <Route path="/comparables" component={ComparablesAnnex} />
          <Route path="/comparables-annex" component={ComparablesAnnex} />
          <Route path="/agents" component={EnhancedAgents} />
          <Route path="/enhanced-agents" component={EnhancedAgents} />
          <Route path="/maps2" component={Maps2} />
          <Route path="/production-status" component={ProductionStatus} />
          <Route path="/placeholder-replace" component={PlaceholderReplace} />
          <Route path="/competitor-watch" component={CompetitorWatch} />

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
      {/* Main content without global header - each page uses SimpleChrome */}
      <div>
        <Router />
      </div>
      
      {/* Hide Bristol Floating Widget on chat page and mobile */}
      {isAuthenticated && location !== '/chat' && (
        <PopoutAgent 
            appData={appData}
            webhookUrl={import.meta.env.VITE_N8N_WEBHOOK_URL}
            onSaveSystemPrompt={async (prompt: string) => {
              try {
                console.log("System prompt saved:", prompt.length, "characters");
              } catch (error) {
                console.error("Error saving system prompt:", error);
              }
            }}
            onSend={async (payload: any) => {
              try {
                console.log("Chat sent:", payload.model, payload.messages.length, "messages");
              } catch (error) {
                console.error("Error sending chat:", error);
              }
            }}
          />
      )}

      {/* ElevenLabs Voice Widget - FIXED: Now actually rendered */}
      {isAuthenticated && (
        <ElevenLabsWidget 
          agentId="agent_8801k2t62y9qehhsqqdmzmp10kt9"
          position="bottom-left"
        />
      )}

    </>
  );
}

function App() {
  // Set up global error handling on app initialization
  useEffect(() => {
    setupGlobalErrorHandling();
  }, []);

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Enhanced error reporting
        console.error('Bristol App Error:', {
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString()
        });
      }}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <ErrorBoundary
            onError={(error) => {
              console.error('Content Error:', error.message);
            }}
          >
            <AppContent />
          </ErrorBoundary>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
