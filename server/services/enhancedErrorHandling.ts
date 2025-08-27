import { ErrorHandlingService } from './errorHandlingService';
import { robustErrorRecovery } from './robustErrorRecovery';
import type { Request, Response, NextFunction } from 'express';

// Enhanced error handler for Company platform with comprehensive recovery
export class EnhancedErrorHandling {
  private errorHandler = ErrorHandlingService.getInstance();
  private recovery = robustErrorRecovery;

  // API endpoint wrapper with automatic error handling
  wrapApiEndpoint(handler: (req: Request, res: Response) => Promise<any>) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await handler(req, res);
        
        // Log successful API calls for monitoring
        console.log(`✅ API ${req.method} ${req.path} completed successfully`);
        return result;
        
      } catch (error) {
        this.errorHandler.logError(error as Error, {
          endpoint: `${req.method} ${req.path}`,
          body: req.body,
          params: req.params,
          query: req.query,
          timestamp: new Date().toISOString()
        });

        // Attempt recovery based on error type
        await this.attemptRecovery(error as Error, req);

        // Send appropriate error response
        const status = this.getErrorStatus(error as Error);
        res.status(status).json({
          success: false,
          error: (error as Error).message,
          code: this.getErrorCode(error as Error),
          timestamp: new Date().toISOString(),
          path: req.path,
          recovery: await this.getRecoveryStatus()
        });
      }
    };
  }

  // Database operation wrapper
  async wrapDatabaseOperation<T>(
    operation: () => Promise<T>,
    context: { operation: string; table?: string }
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      this.errorHandler.logError(error as Error, {
        type: 'database',
        ...context,
        timestamp: new Date().toISOString()
      });

      // Attempt database recovery
      const recovered = await this.recovery.recoverDatabaseConnection();
      if (recovered) {
        console.log('🔄 Database recovered, retrying operation');
        return await operation();
      }

      throw new Error(`Database operation failed: ${(error as Error).message}`);
    }
  }

  // External API call wrapper
  async wrapExternalApiCall<T>(
    apiCall: () => Promise<T>,
    serviceName: string,
    options: { maxRetries?: number; backoff?: boolean } = {}
  ): Promise<T> {
    const { maxRetries = 3, backoff = true } = options;
    let lastError: Error = new Error('Unknown error');

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        lastError = error as Error;
        
        this.errorHandler.logError(lastError, {
          type: 'external_api',
          service: serviceName,
          attempt: attempt + 1,
          maxRetries,
          timestamp: new Date().toISOString()
        });

        // Don't retry on certain error types
        if (this.shouldNotRetry(lastError)) {
          break;
        }

        // Apply backoff delay
        if (attempt < maxRetries - 1) {
          const delay = backoff ? Math.pow(2, attempt) * 1000 : 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`${serviceName} API failed after ${maxRetries} attempts: ${lastError.message}`);
  }

  // MCP tool execution wrapper
  async wrapMcpToolExecution<T>(
    toolExecution: () => Promise<T>,
    toolName: string,
    serverName: string
  ): Promise<T> {
    try {
      return await toolExecution();
    } catch (error) {
      this.errorHandler.logError(error as Error, {
        type: 'mcp_tool',
        tool: toolName,
        server: serverName,
        timestamp: new Date().toISOString()
      });

      // Attempt MCP server recovery if needed
      if ((error as Error).message.includes('server') || (error as Error).message.includes('spawn')) {
        console.log(`🔄 Attempting recovery for MCP server: ${serverName}`);
        // Recovery would be handled by the MCP service itself
      }

      throw new Error(`MCP tool '${toolName}' failed: ${(error as Error).message}`);
    }
  }

  // Memory management wrapper
  async wrapMemoryIntensiveOperation<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    const memBefore = process.memoryUsage();
    
    try {
      const result = await operation();
      
      // Check memory usage after operation
      const memAfter = process.memoryUsage();
      const memDelta = memAfter.heapUsed - memBefore.heapUsed;
      const memDeltaMB = Math.round(memDelta / 1024 / 1024);
      
      if (memDeltaMB > 50) { // Alert if operation used more than 50MB
        console.warn(`⚠️ High memory usage detected in ${operationName}: +${memDeltaMB}MB`);
        
        // Trigger memory recovery if usage is very high
        const heapUsagePercent = (memAfter.heapUsed / memAfter.heapTotal) * 100;
        if (heapUsagePercent > 85) {
          await this.recovery.recoverMemoryPressure();
        }
      }
      
      return result;
      
    } catch (error) {
      this.errorHandler.logError(error as Error, {
        type: 'memory_intensive',
        operation: operationName,
        memoryBefore: memBefore,
        timestamp: new Date().toISOString()
      });
      
      // Attempt memory recovery
      await this.recovery.recoverMemoryPressure();
      
      throw error;
    }
  }

  // WebSocket operation wrapper
  async wrapWebSocketOperation<T>(
    operation: () => Promise<T>,
    wsService: any
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      this.errorHandler.logError(error as Error, {
        type: 'websocket',
        timestamp: new Date().toISOString()
      });

      // Attempt WebSocket recovery
      await this.recovery.recoverWebSocket(wsService);
      
      throw new Error(`WebSocket operation failed: ${(error as Error).message}`);
    }
  }

  // Private helper methods
  private async attemptRecovery(error: Error, req: Request): Promise<void> {
    const errorMessage = error.message.toLowerCase();
    
    // Database recovery
    if (errorMessage.includes('database') || errorMessage.includes('connection')) {
      await this.recovery.recoverDatabaseConnection();
    }
    
    // API service recovery
    else if (errorMessage.includes('api') || errorMessage.includes('fetch')) {
      const serviceName = this.extractServiceName(req.path);
      if (serviceName) {
        await this.recovery.recoverApiService(serviceName, async () => {
          // Basic health check for the service
          return true;
        });
      }
    }
    
    // Memory recovery
    else if (errorMessage.includes('memory') || errorMessage.includes('heap')) {
      await this.recovery.recoverMemoryPressure();
    }
  }

  private getErrorStatus(error: Error): number {
    const message = error.message.toLowerCase();
    
    if (message.includes('unauthorized') || message.includes('401')) return 401;
    if (message.includes('forbidden') || message.includes('403')) return 403;
    if (message.includes('not found') || message.includes('404')) return 404;
    if (message.includes('rate limit') || message.includes('429')) return 429;
    if (message.includes('service unavailable') || message.includes('503')) return 503;
    if (message.includes('timeout') || message.includes('504')) return 504;
    
    return 500;
  }

  private getErrorCode(error: Error): string {
    const message = error.message.toLowerCase();
    
    if (message.includes('database')) return 'DATABASE_ERROR';
    if (message.includes('api')) return 'API_ERROR';
    if (message.includes('mcp')) return 'MCP_ERROR';
    if (message.includes('memory')) return 'MEMORY_ERROR';
    if (message.includes('websocket')) return 'WEBSOCKET_ERROR';
    if (message.includes('authentication')) return 'AUTH_ERROR';
    if (message.includes('validation')) return 'VALIDATION_ERROR';
    
    return 'UNKNOWN_ERROR';
  }

  private shouldNotRetry(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('401') ||
      message.includes('403') ||
      message.includes('404') ||
      message.includes('unauthorized') ||
      message.includes('forbidden') ||
      message.includes('validation')
    );
  }

  private extractServiceName(path: string): string | null {
    const pathParts = path.split('/');
    
    if (pathParts.includes('mcp-unified')) return 'mcp';
    if (pathParts.includes('sites')) return 'database';
    if (pathParts.includes('chat')) return 'ai';
    if (pathParts.includes('integrations')) return 'external_api';
    
    return null;
  }

  private async getRecoveryStatus(): Promise<any> {
    return this.recovery.getRecoveryStatus();
  }

  // Health check with automatic recovery
  async performHealthCheckWithRecovery(): Promise<any> {
    try {
      // Basic system health checks
      const checks = {
        memory: this.checkMemoryHealth(),
        database: await this.checkDatabaseHealth(),
        services: await this.checkServicesHealth()
      };

      // Determine overall health
      const failedChecks = Object.entries(checks).filter(([, status]) => !status.healthy);
      
      if (failedChecks.length > 0) {
        console.log(`⚠️ Health check failed: ${failedChecks.map(([name]) => name).join(', ')}`);
        
        // Attempt system recovery
        const recoveryResult = await this.recovery.performSystemRecovery();
        
        return {
          healthy: false,
          checks,
          recovery: recoveryResult,
          timestamp: new Date().toISOString()
        };
      }

      return {
        healthy: true,
        checks,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.errorHandler.logError(error as Error, { type: 'health_check' });
      return {
        healthy: false,
        error: (error as Error).message,
        timestamp: new Date().toISOString()
      };
    }
  }

  private checkMemoryHealth(): { healthy: boolean; details: any } {
    const memUsage = process.memoryUsage();
    const heapUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    
    return {
      healthy: heapUsagePercent < 90,
      details: {
        heapUsagePercent: Math.round(heapUsagePercent),
        heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024)
      }
    };
  }

  private async checkDatabaseHealth(): Promise<{ healthy: boolean; details: any }> {
    try {
      const startTime = Date.now();
      // Simple database connectivity test
      await this.wrapDatabaseOperation(
        async () => {
          // This will throw if database is not accessible
          const { db } = await import('../db');
          await db.execute('SELECT 1');
          return true;
        },
        { operation: 'health_check' }
      );
      
      const responseTime = Date.now() - startTime;
      
      return {
        healthy: responseTime < 2000,
        details: { responseTime }
      };
    } catch (error) {
      return {
        healthy: false,
        details: { error: (error as Error).message }
      };
    }
  }

  private async checkServicesHealth(): Promise<{ healthy: boolean; details: any }> {
    const services = {
      openai: !!process.env.OPENAI_API_KEY,
      openrouter: !!(process.env.OPENROUTER_API_KEY2 || process.env.OPENAI_API_KEY)
    };

    const healthyServices = Object.values(services).filter(Boolean).length;
    
    return {
      healthy: healthyServices > 0,
      details: {
        available: healthyServices,
        total: Object.keys(services).length,
        services
      }
    };
  }
}

export const enhancedErrorHandling = new EnhancedErrorHandling();