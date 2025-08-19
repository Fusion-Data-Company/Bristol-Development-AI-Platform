import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles/mobile.css";

// Suppress Replit-specific errors and non-critical map warnings
const originalError = console.error;
const originalWarn = console.warn;

console.error = (...args) => {
  const message = args.join(' ');
  // Suppress known non-critical errors
  if (message.includes('beacon.js') ||
      message.includes('replit.com/public') ||
      message.includes('Failed to fetch') && message.includes('replit') ||
      message.includes('Resource loading error') && message.includes('replit') ||
      message.includes('Non-critical Map Warning')) {
    return; // Suppress Replit-specific errors
  }
  originalError.apply(console, args);
};

console.warn = (...args) => {
  const message = args.join(' ');
  // Suppress known non-critical warnings
  if (message.includes('style') || 
      message.includes('Style') || 
      message.includes('mapbox-gl') ||
      message.includes('worker') ||
      message.includes('Non-critical Map Warning')) {
    return; // Suppress map style warnings
  }
  originalWarn.apply(console, args);
};

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  const error = event.reason?.toString() || '';
  const errorMessage = event.reason?.message || '';
  
  // Suppress Replit-specific errors
  if (error.includes('beacon.js') || 
      error.includes('beacon') ||
      error.includes('replit.com') || 
      error.includes('Failed to fetch') && error.includes('replit') ||
      errorMessage.includes('beacon') ||
      errorMessage.includes('replit')) {
    event.preventDefault(); // Prevent Replit errors from showing
    return;
  }
  
  // Suppress WebSocket connection errors that are non-critical
  if (error.includes('WebSocket') || 
      error.includes('websocket') ||
      errorMessage.includes('WebSocket') ||
      errorMessage.includes('Connection failed')) {
    event.preventDefault(); // Prevent WebSocket errors from showing
    return;
  }
  
  // Suppress query/fetch errors that are handled gracefully
  if (error.includes('Failed to fetch') || 
      errorMessage.includes('NetworkError') ||
      errorMessage.includes('fetch')) {
    event.preventDefault(); // These are handled by React Query
    return;
  }
});

// Also suppress network errors for Replit resources
window.addEventListener('error', (event) => {
  if (event.message?.includes('beacon') || 
      event.message?.includes('replit') ||
      event.filename?.includes('replit.com')) {
    event.preventDefault();
    return;
  }
}, true);

createRoot(document.getElementById("root")!).render(<App />);
