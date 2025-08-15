import { apiRequest } from './queryClient';

interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  error: string | null;
  status: number;
}

interface ApiOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
}

// Enhanced API wrapper with error handling
export async function safeApiRequest<T = any>(
  endpoint: string,
  options: RequestInit & ApiOptions = {}
): Promise<ApiResponse<T>> {
  const { timeout = 30000, retries = 3, retryDelay = 1000, headers = {}, ...fetchOptions } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(endpoint, {
        ...fetchOptions,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
          ...fetchOptions.headers
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        return {
          success: false,
          data: null,
          error: `${response.status}: ${errorText}`,
          status: response.status
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
        error: null,
        status: response.status
      };

    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on abort (timeout) or auth errors
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            data: null,
            error: 'Request timeout',
            status: 408
          };
        }
        
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          return {
            success: false,
            data: null,
            error: 'Authentication required',
            status: 401
          };
        }
      }

      // Wait before retry (except on last attempt)
      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
      }
    }
  }

  return {
    success: false,
    data: null,
    error: lastError?.message || 'Unknown error occurred',
    status: 0
  };
}

// Wrapper for common API patterns
export const api = {
  get: <T = any>(endpoint: string, options?: ApiOptions) => 
    safeApiRequest<T>(endpoint, { method: 'GET', ...options }),

  post: <T = any>(endpoint: string, data?: any, options?: ApiOptions) =>
    safeApiRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...options
    }),

  put: <T = any>(endpoint: string, data?: any, options?: ApiOptions) =>
    safeApiRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...options
    }),

  delete: <T = any>(endpoint: string, options?: ApiOptions) =>
    safeApiRequest<T>(endpoint, { method: 'DELETE', ...options }),

  patch: <T = any>(endpoint: string, data?: any, options?: ApiOptions) =>
    safeApiRequest<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
      ...options
    })
};

// Utility functions for error handling
export function isNetworkError(error: Error): boolean {
  return error.message.includes('fetch') || 
         error.message.includes('network') ||
         error.message.includes('NetworkError');
}

export function isTimeoutError(error: Error): boolean {
  return error.name === 'AbortError' || 
         error.message.includes('timeout');
}

export function isAuthError(error: Error): boolean {
  return error.message.includes('401') || 
         error.message.includes('Unauthorized') ||
         error.message.includes('Authentication');
}

export function getErrorCategory(error: Error): 'network' | 'timeout' | 'auth' | 'server' | 'unknown' {
  if (isNetworkError(error)) return 'network';
  if (isTimeoutError(error)) return 'timeout';
  if (isAuthError(error)) return 'auth';
  if (error.message.includes('5')) return 'server';
  return 'unknown';
}