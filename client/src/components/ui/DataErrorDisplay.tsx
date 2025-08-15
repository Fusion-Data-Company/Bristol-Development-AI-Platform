import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  RefreshCw, 
  Database, 
  Wifi, 
  Lock,
  ExternalLink,
  Info
} from 'lucide-react';

interface DataErrorDisplayProps {
  error?: Error | string | null;
  isLoading?: boolean;
  onRetry?: () => void;
  context?: string;
  showDetails?: boolean;
  className?: string;
}

export function DataErrorDisplay({
  error,
  isLoading = false,
  onRetry,
  context = "data",
  showDetails = false,
  className = ""
}: DataErrorDisplayProps) {
  if (isLoading) {
    return (
      <Card className={`border-blue-200 ${className}`}>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading {context}...</p>
        </CardContent>
      </Card>
    );
  }

  if (!error) {
    return null;
  }

  const errorMessage = typeof error === 'string' ? error : error.message;
  const isAuthError = errorMessage.includes('401') || errorMessage.includes('Unauthorized');
  const isNetworkError = errorMessage.includes('fetch') || errorMessage.includes('network');
  const isTimeoutError = errorMessage.includes('timeout');

  const getErrorType = () => {
    if (isAuthError) return { icon: Lock, color: 'text-yellow-600', bg: 'bg-yellow-50' };
    if (isNetworkError) return { icon: Wifi, color: 'text-red-600', bg: 'bg-red-50' };
    if (isTimeoutError) return { icon: Database, color: 'text-orange-600', bg: 'bg-orange-50' };
    return { icon: AlertTriangle, color: 'text-gray-600', bg: 'bg-gray-50' };
  };

  const { icon: Icon, color, bg } = getErrorType();

  const getErrorTitle = () => {
    if (isAuthError) return 'Authentication Required';
    if (isNetworkError) return 'Connection Error';
    if (isTimeoutError) return 'Request Timeout';
    return 'Data Error';
  };

  const getErrorMessage = () => {
    if (isAuthError) return 'Please log in to access this data';
    if (isNetworkError) return 'Unable to connect to the server';
    if (isTimeoutError) return 'The request took too long to complete';
    return `Failed to load ${context}`;
  };

  const getActionButton = () => {
    if (isAuthError) {
      return (
        <Button 
          onClick={() => window.location.href = '/api/login'}
          className="bg-yellow-600 hover:bg-yellow-700"
        >
          <Lock className="h-4 w-4 mr-2" />
          Log In
        </Button>
      );
    }

    if (onRetry) {
      return (
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      );
    }

    return null;
  };

  return (
    <Card className={`border-l-4 border-l-gray-300 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-full ${bg}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg text-gray-900">{getErrorTitle()}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">{getErrorMessage()}</p>
          </div>
          <Badge variant="outline" className={color}>
            Error
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {showDetails && errorMessage && (
          <div className="mb-4 p-3 bg-gray-100 rounded text-sm text-gray-700 font-mono">
            {errorMessage}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Info className="h-4 w-4" />
            <span>
              {isAuthError ? 'Authentication error' : 
               isNetworkError ? 'Network connectivity issue' : 
               isTimeoutError ? 'Server response timeout' : 
               'Data loading error'}
            </span>
          </div>
          
          {getActionButton()}
        </div>
      </CardContent>
    </Card>
  );
}

// Simplified error display for inline use
export function InlineErrorDisplay({ 
  error, 
  onRetry, 
  className = "" 
}: Pick<DataErrorDisplayProps, 'error' | 'onRetry' | 'className'>) {
  if (!error) return null;

  const errorMessage = typeof error === 'string' ? error : error.message;

  return (
    <div className={`flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded ${className}`}>
      <div className="flex items-center space-x-2">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <span className="text-sm text-red-700">{errorMessage}</span>
      </div>
      {onRetry && (
        <Button onClick={onRetry} size="sm" variant="outline">
          <RefreshCw className="h-3 w-3 mr-1" />
          Retry
        </Button>
      )}
    </div>
  );
}