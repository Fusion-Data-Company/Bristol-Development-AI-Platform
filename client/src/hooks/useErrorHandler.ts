import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ErrorOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  logToConsole?: boolean;
}

export function useErrorHandler() {
  const { toast } = useToast();

  const handleError = useCallback((error: Error | string, options: ErrorOptions = {}) => {
    const {
      title = "Error Occurred",
      description,
      variant = "destructive",
      logToConsole = true
    } = options;

    const errorMessage = typeof error === 'string' ? error : error.message;
    
    if (logToConsole) {
      console.error('Error handled:', error);
    }

    toast({
      title,
      description: description || errorMessage,
      variant,
    });
  }, [toast]);

  const handleApiError = useCallback((error: Error | unknown, context: string = 'API call') => {
    let errorMessage = 'An unexpected error occurred';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    handleError(errorMessage, {
      title: `${context} Failed`,
      description: errorMessage,
      logToConsole: true
    });
  }, [handleError]);

  const handleSuccess = useCallback((message: string, title: string = "Success") => {
    toast({
      title,
      description: message,
      variant: "default",
    });
  }, [toast]);

  return {
    handleError,
    handleApiError,
    handleSuccess
  };
}