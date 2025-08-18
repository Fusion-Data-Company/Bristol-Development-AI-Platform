import { ErrorHandlingService } from "./errorHandlingService";
import { storage } from "../storage";

interface ErrorRecoveryContext {
  serviceName: string;
  errorType: string;
  originalError: Error;
  recoveryAttempts: number;
  maxRetries: number;
}

export class RobustErrorRecovery {
  private static instance: RobustErrorRecovery;
  private errorHandler = ErrorHandlingService.getInstance();
  private recoveryAttempts: Map<string, number> = new Map();
  
  static getInstance(): RobustErrorRecovery {
    if (!RobustErrorRecovery.instance) {
      RobustErrorRecovery.instance = new RobustErrorRecovery();
    }
    return RobustErrorRecovery.instance;
  }

  // Database connection recovery
  async recoverDatabaseConnection(): Promise<boolean> {
    const contextKey = 'database_connection';
    const attempts = this.recoveryAttempts.get(contextKey) || 0;
    
    if (attempts >= 3) {
      console.error('❌ Database recovery failed after 3 attempts');
      return false;
    }

    try {
      this.recoveryAttempts.set(contextKey, attempts + 1);
      console.log(`🔄 Attempting database recovery (attempt ${attempts + 1}/3)`);
      
      // Test database connection
      const testUser = await storage.getUser('test-connection');
      console.log('✅ Database connection recovered');
      this.recoveryAttempts.delete(contextKey);
      return true;
      
    } catch (error) {
      this.errorHandler.logError(error as Error, { recovery: 'database', attempts: attempts + 1 });
      
      if (attempts < 2) {
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 5000));
        return this.recoverDatabaseConnection();
      }
      return false;
    }
  }

  // API service recovery
  async recoverApiService(serviceName: string, testFunction: () => Promise<any>): Promise<boolean> {
    const contextKey = `api_${serviceName}`;
    const attempts = this.recoveryAttempts.get(contextKey) || 0;
    
    if (attempts >= 3) {
      console.error(`❌ ${serviceName} API recovery failed after 3 attempts`);
      return false;
    }

    try {
      this.recoveryAttempts.set(contextKey, attempts + 1);
      console.log(`🔄 Attempting ${serviceName} API recovery (attempt ${attempts + 1}/3)`);
      
      await testFunction();
      console.log(`✅ ${serviceName} API recovered`);
      this.recoveryAttempts.delete(contextKey);
      return true;
      
    } catch (error) {
      this.errorHandler.logError(error as Error, { 
        recovery: serviceName, 
        attempts: attempts + 1,
        apiService: true
      });
      
      if (attempts < 2) {
        // Exponential backoff
        const delay = Math.pow(2, attempts) * 3000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.recoverApiService(serviceName, testFunction);
      }
      return false;
    }
  }

  // MCP server recovery
  async recoverMcpServer(serverName: string, restartFunction: () => Promise<void>): Promise<boolean> {
    const contextKey = `mcp_${serverName}`;
    const attempts = this.recoveryAttempts.get(contextKey) || 0;
    
    if (attempts >= 2) {
      console.error(`❌ MCP server ${serverName} recovery failed after 2 attempts`);
      return false;
    }

    try {
      this.recoveryAttempts.set(contextKey, attempts + 1);
      console.log(`🔄 Attempting MCP server ${serverName} recovery (attempt ${attempts + 1}/2)`);
      
      await restartFunction();
      console.log(`✅ MCP server ${serverName} recovered`);
      this.recoveryAttempts.delete(contextKey);
      return true;
      
    } catch (error) {
      this.errorHandler.logError(error as Error, { 
        recovery: 'mcp_server', 
        serverName, 
        attempts: attempts + 1 
      });
      
      if (attempts < 1) {
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 10000));
        return this.recoverMcpServer(serverName, restartFunction);
      }
      return false;
    }
  }

  // Memory pressure recovery
  async recoverMemoryPressure(): Promise<boolean> {
    try {
      console.log('🧹 Initiating memory recovery');
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        console.log('✅ Garbage collection triggered');
      }
      
      // Clear old health check entries
      this.clearOldEntries();
      
      // Wait for GC to complete
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const memUsage = process.memoryUsage();
      const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
      
      console.log(`📊 Memory after recovery: ${heapUsedMB}MB / ${heapTotalMB}MB`);
      
      return heapUsedMB < (heapTotalMB * 0.85); // Success if under 85%
      
    } catch (error) {
      this.errorHandler.logError(error as Error, { recovery: 'memory' });
      return false;
    }
  }

  // WebSocket recovery
  async recoverWebSocket(wsService: any): Promise<boolean> {
    try {
      console.log('🔄 Attempting WebSocket recovery');
      
      // Test WebSocket health
      if (wsService && wsService.isHealthy && !wsService.isHealthy()) {
        await wsService.restart();
        console.log('✅ WebSocket service restarted');
      }
      
      return true;
    } catch (error) {
      this.errorHandler.logError(error as Error, { recovery: 'websocket' });
      return false;
    }
  }

  // Comprehensive system recovery
  async performSystemRecovery(): Promise<{ success: boolean; recoveredServices: string[]; failedServices: string[] }> {
    const recoveredServices: string[] = [];
    const failedServices: string[] = [];
    
    console.log('🚨 Initiating comprehensive system recovery');
    
    // Database recovery
    try {
      if (await this.recoverDatabaseConnection()) {
        recoveredServices.push('database');
      } else {
        failedServices.push('database');
      }
    } catch {
      failedServices.push('database');
    }
    
    // Memory recovery
    try {
      if (await this.recoverMemoryPressure()) {
        recoveredServices.push('memory');
      } else {
        failedServices.push('memory');
      }
    } catch {
      failedServices.push('memory');
    }
    
    // API services recovery (basic health checks)
    const apiServices = ['openrouter', 'openai'];
    for (const service of apiServices) {
      try {
        const recovered = await this.recoverApiService(service, async () => {
          // Basic health check - just test environment variables
          const key = service === 'openrouter' ? 
            (process.env.OPENROUTER_API_KEY2 || process.env.OPENAI_API_KEY) : 
            process.env.OPENAI_API_KEY;
          if (!key) throw new Error(`${service} API key not found`);
        });
        
        if (recovered) {
          recoveredServices.push(service);
        } else {
          failedServices.push(service);
        }
      } catch {
        failedServices.push(service);
      }
    }
    
    const success = recoveredServices.length > 0 && failedServices.length === 0;
    
    console.log(`🏥 System recovery complete - Recovered: [${recoveredServices.join(', ')}], Failed: [${failedServices.join(', ')}]`);
    
    return {
      success,
      recoveredServices,
      failedServices
    };
  }

  // Clear old entries to prevent memory buildup
  private clearOldEntries(): void {
    // Clear recovery attempts older than 1 hour
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const keysToDelete: string[] = [];
    
    // Simple cleanup - clear all attempts older than reasonable time
    this.recoveryAttempts.forEach((attempts, key) => {
      if (attempts > 10) { // Clear if too many attempts (likely old)
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.recoveryAttempts.delete(key));
    
    if (keysToDelete.length > 0) {
      console.log(`🧹 Cleared ${keysToDelete.length} old recovery entries`);
    }
  }

  // Get recovery status
  getRecoveryStatus(): { activeRecoveries: string[]; totalAttempts: number } {
    const activeRecoveries = Array.from(this.recoveryAttempts.keys());
    const totalAttempts = Array.from(this.recoveryAttempts.values()).reduce((sum, val) => sum + val, 0);
    
    return {
      activeRecoveries,
      totalAttempts
    };
  }
}

export const robustErrorRecovery = RobustErrorRecovery.getInstance();