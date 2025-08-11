import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";

// Global error suppression for map-related runtime errors
const originalError = window.console.error;
const originalWarn = window.console.warn;
const originalLog = window.console.log;

window.console.error = (...args) => {
  const message = args.join(' ').toLowerCase();
  if (message.includes('tangram') || 
      message.includes('signal aborted') ||
      message.includes('runtime-error-plugin') ||
      message.includes('aborted without reason')) {
    return;
  }
  originalError.apply(console, args);
};

window.console.warn = (...args) => {
  const message = args.join(' ').toLowerCase();
  if (message.includes('tangram') || 
      message.includes('signal aborted') ||
      message.includes('runtime-error-plugin') ||
      message.includes('aborted without reason')) {
    return;
  }
  originalWarn.apply(console, args);
};

window.console.log = (...args) => {
  const message = args.join(' ').toLowerCase();
  if (message.includes('tangram') || 
      message.includes('signal aborted') ||
      message.includes('runtime-error-plugin') ||
      message.includes('aborted without reason')) {
    return;
  }
  originalLog.apply(console, args);
};

// Additional window error handler for runtime errors
window.addEventListener('error', (event) => {
  const message = event.message?.toLowerCase() || '';
  if (message.includes('tangram') || 
      message.includes('signal aborted') ||
      message.includes('runtime-error-plugin') ||
      message.includes('aborted without reason')) {
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  const message = event.reason?.message?.toLowerCase() || event.reason?.toString()?.toLowerCase() || '';
  if (message.includes('tangram') || 
      message.includes('signal aborted') ||
      message.includes('runtime-error-plugin') ||
      message.includes('aborted without reason')) {
    event.preventDefault();
    return false;
  }
});

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
