import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { ChatDock } from "@/components/chat/ChatDock";
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
          <Route path="/chat" component={Chat} />
          <Route path="/integrations" component={IntegrationsNew} />
          <Route path="/tools" component={ToolsConsole} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isAuthenticated } = useAuth();
  
  return (
    <>
      <Router />
      {isAuthenticated && <ChatDock />}
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
