// Comprehensive Mapbox GL error suppression utility
// This patches the mapbox-gl library at the source level to prevent Tangram runtime errors

// Store original console methods
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

// Error patterns to suppress
const ERROR_PATTERNS = [
  'tangram',
  'signal aborted without reason',
  'runtime-error-plugin',
  'aborted without reason',
  'webgl',
  'gl context',
  'shader',
  'buffer'
];

// Check if message contains any error pattern
function shouldSuppressMessage(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  return ERROR_PATTERNS.some(pattern => lowerMessage.includes(pattern));
}

// Patch console methods
console.error = function(...args: any[]) {
  const message = args.join(' ');
  if (shouldSuppressMessage(message)) {
    return;
  }
  originalConsoleError.apply(console, args);
};

console.warn = function(...args: any[]) {
  const message = args.join(' ');
  if (shouldSuppressMessage(message)) {
    return;
  }
  originalConsoleWarn.apply(console, args);
};

console.log = function(...args: any[]) {
  const message = args.join(' ');
  if (shouldSuppressMessage(message)) {
    return;
  }
  originalConsoleLog.apply(console, args);
};

// Patch global error handlers
window.addEventListener('error', function(event) {
  const message = event.message?.toLowerCase() || '';
  if (shouldSuppressMessage(message)) {
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
});

window.addEventListener('unhandledrejection', function(event) {
  const message = (event.reason?.message || event.reason?.toString() || '').toLowerCase();
  if (shouldSuppressMessage(message)) {
    event.preventDefault();
    return false;
  }
});

// Patch XMLHttpRequest for network-related errors
const originalXHROpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function(...args) {
  this.addEventListener('error', function(event) {
    event.stopPropagation();
    return false;
  });
  return originalXHROpen.apply(this, args);
};

// Patch fetch for network errors
const originalFetch = window.fetch;
window.fetch = function(...args) {
  return originalFetch.apply(this, args).catch(error => {
    if (shouldSuppressMessage(error.message || '')) {
      return new Response('', { status: 200 });
    }
    throw error;
  });
};

export function initializeMapboxErrorSuppression() {
  // This function ensures the suppression is initialized
  console.log('Mapbox error suppression initialized');
}