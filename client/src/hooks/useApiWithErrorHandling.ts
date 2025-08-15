import { useCallback } from 'react';
import { useMutation, useQuery, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { useErrorHandler } from './useErrorHandler';
import { apiRequest } from '@/lib/queryClient';

interface ApiOptions {
  showSuccessToast?: boolean;
  successMessage?: string;
  showErrorToast?: boolean;
  retries?: number;
  timeout?: number;
}

export function useApiWithErrorHandling() {
  const { handleApiError, handleSuccess } = useErrorHandler();

  const createQuery = useCallback(<T = any>(
    queryKey: string | string[],
    options: UseQueryOptions<T> & ApiOptions = {}
  ) => {
    const { showErrorToast = true, retries = 3, ...queryOptions } = options;

    return useQuery({
      queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
      retry: (failureCount, error) => {
        if (failureCount >= retries) {
          if (showErrorToast) {
            handleApiError(error, `Data fetch (${Array.isArray(queryKey) ? queryKey.join('/') : queryKey})`);
          }
          return false;
        }
        return true;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 30000),
      ...queryOptions
    });
  }, [handleApiError]);

  const createMutation = useCallback(<TData = any, TVariables = any>(
    mutationFn: (variables: TVariables) => Promise<TData>,
    options: UseMutationOptions<TData, Error, TVariables> & ApiOptions = {}
  ) => {
    const {
      showSuccessToast = false,
      successMessage = "Operation completed successfully",
      showErrorToast = true,
      onSuccess,
      onError,
      ...mutationOptions
    } = options;

    return useMutation({
      mutationFn,
      onSuccess: (data, variables, context) => {
        if (showSuccessToast) {
          handleSuccess(successMessage);
        }
        if (onSuccess) {
          onSuccess(data, variables, context);
        }
      },
      onError: (error, variables, context) => {
        if (showErrorToast) {
          handleApiError(error, 'Operation');
        }
        if (onError) {
          onError(error, variables, context);
        }
      },
      ...mutationOptions
    });
  }, [handleApiError, handleSuccess]);

  const safeApiCall = useCallback(async <T = any>(
    fn: () => Promise<T>,
    context: string = 'API call',
    options: ApiOptions = {}
  ): Promise<T | null> => {
    const { showErrorToast = true, showSuccessToast = false, successMessage } = options;

    try {
      const result = await fn();
      if (showSuccessToast && successMessage) {
        handleSuccess(successMessage);
      }
      return result;
    } catch (error) {
      if (showErrorToast) {
        handleApiError(error, context);
      }
      return null;
    }
  }, [handleApiError, handleSuccess]);

  return {
    createQuery,
    createMutation,
    safeApiCall
  };
}