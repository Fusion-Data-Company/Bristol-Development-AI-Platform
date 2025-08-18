import { enhancedErrorHandling } from './enhancedErrorHandling';
import { robustErrorRecovery } from './robustErrorRecovery';
import { ErrorHandlingService } from './errorHandlingService';
import type { Request, Response, NextFunction } from 'express';

interface HttpCallOptions {
  timeout?: number;
  retries?: number;
  backoff?: boolean;
  headers?: Record<string, string>;
  validateResponse?: (response: Response) => boolean;
}

interface HttpErrorMetadata {
  url: string;
  method: string;
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  body?: any;
  attempt: number;
  maxAttempts: number;
}

export class HttpErrorEnhancement {
  private errorHandler = ErrorHandlingService.getInstance();
  private recovery = robustErrorRecovery;

  // Enhanced HTTP call wrapper with comprehensive error handling
  async makeSecureHttpCall<T>(
    url: string,
    options: RequestInit & HttpCallOptions = {}
  ): Promise<T> {
    const {
      timeout = 30000,
      retries = 3,
      backoff = true,
      headers = {},
      validateResponse = (res: any) => res.ok,
      ...fetchOptions
    } = options;

    const method = (fetchOptions.method || 'GET').toUpperCase();
    let lastError: Error = new Error('Unknown HTTP error');

    for (let attempt = 1; attempt <= retries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        console.log(`🌐 HTTP ${method} ${url} (attempt ${attempt}/${retries})`);

        const response = await fetch(url, {
          ...fetchOptions,
          headers: {
            'User-Agent': 'Bristol-AI-Agent/2.0',
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...headers
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        const metadata: HttpErrorMetadata = {
          url,
          method,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          attempt,
          maxAttempts: retries
        };

        // Check if response validation passes
        if (!validateResponse(response)) {
          throw this.createHttpError(response, metadata, 'Response validation failed');
        }

        // Handle different response types
        let data: any;
        const contentType = response.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
          data = await response.json();
        } else if (contentType.includes('text/')) {
          data = await response.text();
        } else {
          data = await response.blob();
        }

        console.log(`✅ HTTP ${method} ${url} completed (${response.status})`);

        return data as T;

      } catch (error) {
        clearTimeout(timeoutId);
        lastError = error as Error;

        const isAbortError = (error as Error).name === 'AbortError';
        const isNetworkError = (error as Error).message.includes('fetch');
        const isTimeoutError = isAbortError || (error as Error).message.includes('timeout');

        const metadata: HttpErrorMetadata = {
          url,
          method,
          attempt,
          maxAttempts: retries,
          body: isNetworkError ? 'Network error prevented body access' : undefined
        };

        // Enhanced error logging
        this.errorHandler.logError(lastError, {
          type: 'http_call',
          url,
          method,
          attempt,
          maxAttempts: retries,
          isTimeout: isTimeoutError,
          isNetwork: isNetworkError,
          timestamp: new Date().toISOString()
        });

        // Determine if we should retry
        const shouldRetry = attempt < retries && this.shouldRetryHttpError(lastError);

        if (!shouldRetry) {
          break;
        }

        // Apply backoff delay
        if (backoff && attempt < retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Max 10s delay
          console.log(`⏳ Retrying HTTP ${method} ${url} in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All attempts failed, throw final error
    throw this.enhanceHttpError(lastError, { url, method, attempts: retries });
  }

  // Enhanced error handling for API endpoints
  wrapApiEndpointWithRecovery(handler: (req: Request, res: Response) => Promise<any>) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      try {
        console.log(`📥 API ${req.method} ${req.path} [${requestId}]`);

        // Enhanced request validation
        this.validateRequest(req);

        const result = await handler(req, res);

        const duration = Date.now() - startTime;
        console.log(`📤 API ${req.method} ${req.path} completed in ${duration}ms [${requestId}]`);

        return result;

      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = (error as Error).message;

        console.error(`❌ API ${req.method} ${req.path} failed after ${duration}ms [${requestId}]:`, errorMessage);

        // Enhanced error classification
        const errorType = this.classifyApiError(error as Error);
        const statusCode = this.getHttpStatusFromError(error as Error);

        // Log error with context
        this.errorHandler.logError(error as Error, {
          type: 'api_endpoint',
          method: req.method,
          path: req.path,
          statusCode,
          errorType,
          requestId,
          duration,
          userAgent: req.get('User-Agent'),
          ip: req.ip,
          body: req.body ? Object.keys(req.body) : undefined,
          query: Object.keys(req.query),
          timestamp: new Date().toISOString()
        });

        // Attempt recovery based on error type
        await this.attemptApiRecovery(error as Error, req);

        // Send enhanced error response
        const errorResponse = {
          success: false,
          error: errorMessage,
          errorType,
          statusCode,
          requestId,
          timestamp: new Date().toISOString(),
          ...(process.env.NODE_ENV === 'development' && {
            stack: (error as Error).stack?.split('\n').slice(0, 5)
          })
        };

        res.status(statusCode).json(errorResponse);
      }
    };
  }

  // MCP operation error wrapper
  async wrapMcpOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
    context: Record<string, any> = {}
  ): Promise<T> {
    const startTime = Date.now();

    try {
      console.log(`🔧 MCP operation: ${operationName}`);

      const result = await operation();

      const duration = Date.now() - startTime;
      console.log(`✅ MCP operation ${operationName} completed in ${duration}ms`);

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = (error as Error).message;

      console.error(`❌ MCP operation ${operationName} failed after ${duration}ms:`, errorMessage);

      // Enhanced MCP error classification
      const errorType = this.classifyMcpError(error as Error);

      this.errorHandler.logError(error as Error, {
        type: 'mcp_operation',
        operation: operationName,
        errorType,
        duration,
        context,
        timestamp: new Date().toISOString()
      });

      // Attempt MCP recovery
      if (errorType === 'server_communication') {
        await this.recovery.recoverMcpServer(operationName, async () => {
          // Recovery would be handled by the calling service
          console.log(`🔄 Attempting MCP server recovery for ${operationName}`);
        });
      }

      throw new Error(`MCP operation '${operationName}' failed: ${errorMessage}`);
    }
  }

  // Private helper methods

  private shouldRetryHttpError(error: Error): boolean {
    const message = error.message.toLowerCase();
    
    // Don't retry on client errors
    if (message.includes('401') || message.includes('403') || message.includes('404')) {
      return false;
    }
    
    // Don't retry on validation errors
    if (message.includes('validation') || message.includes('bad request')) {
      return false;
    }
    
    // Retry on network, timeout, and server errors
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('abort') ||
      message.includes('500') ||
      message.includes('502') ||
      message.includes('503') ||
      message.includes('504') ||
      message.includes('econnrefused') ||
      message.includes('enotfound')
    );
  }

  private createHttpError(response: Response, metadata: HttpErrorMetadata, customMessage?: string): Error {
    const message = customMessage || 
      `HTTP ${response.status} ${response.statusText} for ${metadata.method} ${metadata.url}`;
    
    const error = new Error(message);
    (error as any).metadata = metadata;
    return error;
  }

  private enhanceHttpError(error: Error, context: { url: string; method: string; attempts: number }): Error {
    const enhancedMessage = `${error.message} (after ${context.attempts} attempts to ${context.method} ${context.url})`;
    const enhancedError = new Error(enhancedMessage);
    enhancedError.stack = error.stack;
    return enhancedError;
  }

  private validateRequest(req: Request): void {
    // Basic request validation
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      if (!req.body || (typeof req.body === 'object' && Object.keys(req.body).length === 0)) {
        throw new Error('Request body is required for this method');
      }
    }

    // Check for required headers
    if (req.path.includes('/mcp-') && !req.headers['content-type']) {
      throw new Error('Content-Type header is required for MCP operations');
    }
  }

  private classifyApiError(error: Error): string {
    const message = error.message.toLowerCase();
    
    if (message.includes('validation') || message.includes('invalid')) return 'validation';
    if (message.includes('unauthorized') || message.includes('forbidden')) return 'authorization';
    if (message.includes('not found')) return 'not_found';
    if (message.includes('timeout') || message.includes('abort')) return 'timeout';
    if (message.includes('network') || message.includes('connection')) return 'network';
    if (message.includes('database')) return 'database';
    if (message.includes('mcp')) return 'mcp';
    
    return 'general';
  }

  private classifyMcpError(error: Error): string {
    const message = error.message.toLowerCase();
    
    if (message.includes('spawn') || message.includes('enoent')) return 'server_spawn';
    if (message.includes('communication') || message.includes('pipe')) return 'server_communication';
    if (message.includes('tool') || message.includes('method')) return 'tool_execution';
    if (message.includes('timeout')) return 'timeout';
    if (message.includes('validation')) return 'validation';
    
    return 'general';
  }

  private getHttpStatusFromError(error: Error): number {
    const message = error.message.toLowerCase();
    
    if (message.includes('validation') || message.includes('invalid') || message.includes('bad request')) return 400;
    if (message.includes('unauthorized')) return 401;
    if (message.includes('forbidden')) return 403;
    if (message.includes('not found')) return 404;
    if (message.includes('timeout')) return 408;
    if (message.includes('rate limit')) return 429;
    if (message.includes('server') || message.includes('database')) return 500;
    if (message.includes('network') || message.includes('connection')) return 503;
    
    return 500;
  }

  private async attemptApiRecovery(error: Error, req: Request): Promise<void> {
    const errorMessage = error.message.toLowerCase();
    
    // Database recovery
    if (errorMessage.includes('database') || errorMessage.includes('connection')) {
      await this.recovery.recoverDatabaseConnection();
    }
    
    // Memory recovery
    else if (errorMessage.includes('memory') || errorMessage.includes('heap')) {
      await this.recovery.recoverMemoryPressure();
    }
    
    // Service-specific recovery
    else if (req.path.includes('/mcp-')) {
      const serviceName = this.extractServiceFromPath(req.path);
      if (serviceName) {
        await this.recovery.recoverApiService(serviceName, async () => {
          // Basic health check
          return true;
        });
      }
    }
  }

  private extractServiceFromPath(path: string): string | null {
    if (path.includes('mcp-unified')) return 'mcp-unified';
    if (path.includes('openrouter')) return 'openrouter';
    if (path.includes('openai')) return 'openai';
    if (path.includes('elevenlabs')) return 'elevenlabs';
    
    return null;
  }
}

export const httpErrorEnhancement = new HttpErrorEnhancement();