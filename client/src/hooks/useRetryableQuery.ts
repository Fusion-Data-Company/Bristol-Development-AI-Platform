import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useErrorHandler } from './useErrorHandler';

interface RetryableQueryOptions<T> extends Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'> {
  maxRetries?: number;
  retryDelay?: number;
  onError?: (error: Error) => void;
  silentRetry?: boolean;
}

export function useRetryableQuery<T>(
  queryKey: string | string[],
  queryFn?: () => Promise<T>,
  options: RetryableQueryOptions<T> = {}
) {
  const { handleApiError } = useErrorHandler();
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onError,
    silentRetry = false,
    ...queryOptions
  } = options;

  return useQuery({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    queryFn,
    retry: (failureCount, error) => {
      if (failureCount >= maxRetries) {
        if (!silentRetry && onError) {
          onError(error as Error);
        } else if (!silentRetry) {
          handleApiError(error, `Data fetch (${Array.isArray(queryKey) ? queryKey.join('/') : queryKey})`);
        }
        return false;
      }
      return true;
    },
    retryDelay: (attemptIndex) => Math.min(retryDelay * Math.pow(2, attemptIndex), 30000),
    ...queryOptions
  });
}