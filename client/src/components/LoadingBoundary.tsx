import React, { Suspense, ReactNode } from 'react';
import { Loader2, Wifi, WifiOff } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface LoadingBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  minLoadTime?: number;
}

// Enhanced loading fallback component
function DefaultLoadingFallback() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm p-8 text-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-full animate-pulse"></div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Loading Bristol
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Initializing intelligence platform...
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Network status indicator component
export function NetworkStatusIndicator() {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 z-50">
        <WifiOff className="w-4 h-4" />
        <span className="text-sm font-medium">No Internet Connection</span>
      </div>
    );
  }

  return null;
}

// Main loading boundary component
export function LoadingBoundary({ children, fallback, minLoadTime = 300 }: LoadingBoundaryProps) {
  const [showFallback, setShowFallback] = React.useState(false);

  // Implement minimum loading time to prevent flash
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowFallback(true);
    }, minLoadTime);

    return () => clearTimeout(timer);
  }, [minLoadTime]);

  return (
    <Suspense 
      fallback={
        showFallback ? (
          fallback || <DefaultLoadingFallback />
        ) : (
          <div className="w-full h-1 bg-gradient-to-r from-blue-600 to-cyan-600 animate-pulse" />
        )
      }
    >
      {children}
      <NetworkStatusIndicator />
    </Suspense>
  );
}

// Skeleton loader components for different content types
export function MapSkeleton() {
  return (
    <div className="w-full h-96 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse">
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
        <div className="flex space-x-2 mt-4">
          <div className="h-8 w-8 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-20"></div>
        </div>
      </div>
    </div>
  );
}

export function DataTableSkeleton() {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded"></div>
      
      {/* Rows */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-8 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
      ))}
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {/* Messages */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
          <div className={`max-w-xs p-3 rounded-lg ${
            i % 2 === 0 ? 'bg-gray-200 dark:bg-gray-800' : 'bg-blue-200 dark:bg-blue-800'
          } animate-pulse`}>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
        </div>
      ))}
    </div>
  );
}