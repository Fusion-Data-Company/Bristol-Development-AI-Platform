import type { Request, Response, NextFunction, Express } from "express";

export interface ErrorWithStatus extends Error {
  status?: number;
  statusCode?: number;
  code?: string;
}

export class ErrorHandlingService {
  private static instance: ErrorHandlingService;

  static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  // Enhanced error logging with context
  logError(error: Error, context?: any) {
    const timestamp = new Date().toISOString();
    const errorInfo = {
      timestamp,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context,
    };

    console.error('[ERROR]', JSON.stringify(errorInfo, null, 2));
  }

  // Database connection error handler
  handleDatabaseError(error: Error): Response | void {
    this.logError(error, { type: 'database' });
    
    if (error.message.includes('ENOTFOUND') || error.message.includes('connection')) {
      return {
        status: 503,
        message: 'Database connection error. Please check your connection.',
        retry: true
      };
    }

    return {
      status: 500,
      message: 'Database operation failed',
      retry: false
    };
  }

  // API integration error handler
  handleApiError(error: Error, apiName: string): any {
    this.logError(error, { type: 'api', apiName });

    if (error.message.includes('401') || error.message.includes('unauthorized')) {
      return {
        status: 401,
        message: `${apiName} API authentication failed. Please check your API key.`,
        apiName,
        needsAuth: true
      };
    }

    if (error.message.includes('429') || error.message.includes('rate limit')) {
      return {
        status: 429,
        message: `${apiName} API rate limit exceeded. Please try again later.`,
        apiName,
        retry: true
      };
    }

    if (error.message.includes('404')) {
      return {
        status: 404,
        message: `${apiName} API endpoint not found.`,
        apiName
      };
    }

    return {
      status: 500,
      message: `${apiName} API error occurred.`,
      apiName,
      retry: true
    };
  }

  // Agent execution error handler
  handleAgentError(error: Error, agentId: string, taskType?: string): any {
    this.logError(error, { type: 'agent', agentId, taskType });

    return {
      status: 500,
      message: 'Agent execution failed',
      agentId,
      taskType,
      error: error.message,
      retry: true
    };
  }

  // MCP server error handler
  handleMcpError(error: Error, serverName: string, toolName?: string): any {
    this.logError(error, { type: 'mcp', serverName, toolName });

    if (error.message.includes('ENOENT') || error.message.includes('spawn')) {
      return {
        status: 503,
        message: `MCP server '${serverName}' is not available`,
        serverName,
        toolName,
        suggestion: 'Check if the MCP server is properly installed and configured'
      };
    }

    return {
      status: 500,
      message: `MCP operation failed on server '${serverName}'`,
      serverName,
      toolName,
      retry: true
    };
  }

  // Global error middleware
  globalErrorHandler() {
    return (error: ErrorWithStatus, req: Request, res: Response, next: NextFunction) => {
      // Don't handle if response already sent
      if (res.headersSent) {
        return next(error);
      }

      this.logError(error, {
        url: req.url,
        method: req.method,
        headers: req.headers,
        body: req.body,
        query: req.query,
        params: req.params
      });

      // Determine error status
      const status = error.status || error.statusCode || 500;
      
      // Enhanced error response
      const errorResponse = {
        error: true,
        message: error.message || 'Internal server error',
        status,
        timestamp: new Date().toISOString(),
        path: req.url,
        method: req.method,
        ...(process.env.NODE_ENV === 'development' && {
          stack: error.stack,
          details: error
        })
      };

      res.status(status).json(errorResponse);
    };
  }

  // Async error wrapper
  asyncHandler(fn: Function) {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  // Circuit breaker for external services
  createCircuitBreaker(name: string, failureThreshold = 5, timeout = 60000) {
    let failures = 0;
    let lastFailureTime: number | null = null;

    return {
      async execute<T>(fn: () => Promise<T>): Promise<T> {
        // Check if circuit is open
        if (failures >= failureThreshold) {
          if (lastFailureTime && Date.now() - lastFailureTime < timeout) {
            throw new Error(`Circuit breaker open for ${name}. Try again later.`);
          } else {
            // Half-open state - reset and try
            failures = 0;
            lastFailureTime = null;
          }
        }

        try {
          const result = await fn();
          // Success - reset failure count
          failures = 0;
          return result;
        } catch (error) {
          failures++;
          lastFailureTime = Date.now();
          this.logError(error as Error, { 
            circuitBreaker: name, 
            failures, 
            threshold: failureThreshold 
          });
          throw error;
        }
      },

      getStatus() {
        return {
          name,
          failures,
          isOpen: failures >= failureThreshold,
          lastFailureTime
        };
      }
    };
  }

  // Setup global error handling for the application
  setupGlobalErrorHandling(app: Express) {
    // Catch unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      this.logError(new Error('Unhandled Rejection'), { reason, promise });
    });

    // Catch uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.logError(error, { type: 'uncaughtException' });
      // Don't exit in development
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    });

    // Add global error middleware
    app.use(this.globalErrorHandler());

    console.log('✅ Global error handling initialized');
  }
}

export const errorHandlingService = ErrorHandlingService.getInstance();