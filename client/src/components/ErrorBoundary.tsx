import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryTimeouts: NodeJS.Timeout[] = [];

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Bristol Error Boundary]', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Auto-retry for network errors (with exponential backoff)
    if (this.isRetryableError(error) && this.state.retryCount < 3) {
      const delay = Math.pow(2, this.state.retryCount) * 1000; // 1s, 2s, 4s
      const timeout = setTimeout(() => {
        this.handleRetry();
      }, delay);
      
      this.retryTimeouts.push(timeout);
    }
  }

  componentWillUnmount() {
    // Clear any pending retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
  }

  private isRetryableError(error: Error): boolean {
    const retryableErrors = [
      'ChunkLoadError',
      'Loading CSS chunk',
      'Loading chunk',
      'NetworkError',
      'Failed to fetch'
    ];
    
    return retryableErrors.some(retryableError => 
      error.message.includes(retryableError) || error.name.includes(retryableError)
    );
  }

  private handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: prevState.retryCount + 1
    }));
  };

  private handleManualRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: 0
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Something went wrong
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Bristol encountered an unexpected error. You can try refreshing the page or retrying the action.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-sm">
                  <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Error Details (Development Only)
                  </summary>
                  <div className="text-red-600 dark:text-red-400 font-mono text-xs whitespace-pre-wrap">
                    {this.state.error.name}: {this.state.error.message}
                    {this.state.error.stack && (
                      <div className="mt-2 text-gray-600 dark:text-gray-400">
                        {this.state.error.stack}
                      </div>
                    )}
                  </div>
                </details>
              )}
              
              <div className="flex gap-3">
                <Button 
                  onClick={this.handleManualRetry}
                  className="flex-1 flex items-center justify-center gap-2"
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </Button>
                
                <Button 
                  onClick={this.handleReload}
                  className="flex-1"
                >
                  Reload Page
                </Button>
              </div>
              
              {this.state.retryCount > 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  Retry attempts: {this.state.retryCount}/3
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Global error handling setup
export function setupGlobalErrorHandling() {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('[Bristol Unhandled Promise Rejection]', event.reason);
    
    // Prevent the default browser error handling
    event.preventDefault();
    
    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error reporting service
    }
  });

  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    console.error('[Bristol Uncaught Error]', event.error);
    
    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error reporting service
    }
  });

  // Handle React errors (requires ErrorBoundary)
  console.log('[Bristol] Global error handling initialized');
}