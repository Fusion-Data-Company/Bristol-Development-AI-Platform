import { enhancedErrorHandling } from './enhancedErrorHandling';
import { robustErrorRecovery } from './robustErrorRecovery';
import { ErrorHandlingService } from './errorHandlingService';

interface SystemHealthStatus {
  overall: 'healthy' | 'degraded' | 'critical';
  services: Record<string, ServiceHealth>;
  recovery: any;
  metrics: SystemMetrics;
  timestamp: string;
}

interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'critical';
  details: any;
  lastCheck: string;
  responseTime?: number;
}

interface SystemMetrics {
  uptime: number;
  memory: MemoryMetrics;
  database: DatabaseMetrics;
  apis: ApiMetrics;
}

interface MemoryMetrics {
  heapUsedMB: number;
  heapTotalMB: number;
  usagePercent: number;
  rss: number;
}

interface DatabaseMetrics {
  connectionStatus: 'connected' | 'disconnected';
  responseTime: number;
  activeConnections?: number;
}

interface ApiMetrics {
  totalRequests: number;
  errorRate: number;
  avgResponseTime: number;
}

export class SystemHealthMonitor {
  private static instance: SystemHealthMonitor;
  private errorHandler = ErrorHandlingService.getInstance();
  private startTime = Date.now();
  private requestMetrics = {
    total: 0,
    errors: 0,
    totalResponseTime: 0
  };

  static getInstance(): SystemHealthMonitor {
    if (!SystemHealthMonitor.instance) {
      SystemHealthMonitor.instance = new SystemHealthMonitor();
    }
    return SystemHealthMonitor.instance;
  }

  // Track API request metrics
  recordApiRequest(responseTime: number, isError = false): void {
    this.requestMetrics.total++;
    this.requestMetrics.totalResponseTime += responseTime;
    if (isError) {
      this.requestMetrics.errors++;
    }
  }

  // Comprehensive system health check
  async performComprehensiveHealthCheck(): Promise<SystemHealthStatus> {
    const checkStartTime = Date.now();
    
    try {
      // Run all health checks in parallel for efficiency
      const [
        memoryHealth,
        databaseHealth,
        servicesHealth,
        recoveryStatus
      ] = await Promise.all([
        this.checkMemoryHealth(),
        this.checkDatabaseHealth(),
        this.checkServicesHealth(),
        robustErrorRecovery.getRecoveryStatus()
      ]);

      // Calculate overall system health
      const services = {
        memory: memoryHealth,
        database: databaseHealth,
        services: servicesHealth
      };

      const overallHealth = this.calculateOverallHealth(services);
      
      const metrics: SystemMetrics = {
        uptime: Date.now() - this.startTime,
        memory: this.getMemoryMetrics(),
        database: await this.getDatabaseMetrics(),
        apis: this.getApiMetrics()
      };

      console.log(`🔍 Health check completed in ${Date.now() - checkStartTime}ms - Status: ${overallHealth}`);

      return {
        overall: overallHealth,
        services,
        recovery: recoveryStatus,
        metrics,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.errorHandler.logError(error as Error, { type: 'health_check' });
      
      return {
        overall: 'critical',
        services: {},
        recovery: { activeRecoveries: [], totalAttempts: 0 },
        metrics: {
          uptime: Date.now() - this.startTime,
          memory: this.getMemoryMetrics(),
          database: { connectionStatus: 'disconnected', responseTime: 0 },
          apis: this.getApiMetrics()
        },
        timestamp: new Date().toISOString()
      };
    }
  }

  // Memory health check
  private async checkMemoryHealth(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      const memUsage = process.memoryUsage();
      const heapUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
      
      let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
      if (heapUsagePercent > 90) {
        status = 'critical';
      } else if (heapUsagePercent > 75) {
        status = 'degraded';
      }

      return {
        status,
        details: {
          heapUsagePercent: Math.round(heapUsagePercent),
          heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
          heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
          rssMB: Math.round(memUsage.rss / 1024 / 1024)
        },
        lastCheck: new Date().toISOString(),
        responseTime: Date.now() - startTime
      };
      
    } catch (error) {
      this.errorHandler.logError(error as Error, { type: 'memory_health_check' });
      
      return {
        status: 'critical',
        details: { error: (error as Error).message },
        lastCheck: new Date().toISOString(),
        responseTime: Date.now() - startTime
      };
    }
  }

  // Database health check
  private async checkDatabaseHealth(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      const { db } = await import('../db');
      
      // Test basic database connectivity
      await db.execute('SELECT 1');
      
      const responseTime = Date.now() - startTime;
      
      let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
      if (responseTime > 5000) {
        status = 'critical';
      } else if (responseTime > 2000) {
        status = 'degraded';
      }

      return {
        status,
        details: {
          connectionStatus: 'connected',
          responseTime,
          host: process.env.PGHOST || 'unknown',
          database: process.env.PGDATABASE || 'unknown'
        },
        lastCheck: new Date().toISOString(),
        responseTime
      };
      
    } catch (error) {
      this.errorHandler.logError(error as Error, { type: 'database_health_check' });
      
      return {
        status: 'critical',
        details: { 
          connectionStatus: 'disconnected',
          error: (error as Error).message 
        },
        lastCheck: new Date().toISOString(),
        responseTime: Date.now() - startTime
      };
    }
  }

  // Services health check
  private async checkServicesHealth(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      const services = {
        openai: !!process.env.OPENAI_API_KEY,
        openrouter: !!(process.env.OPENROUTER_API_KEY2 || process.env.OPENAI_API_KEY),
        database_url: !!process.env.DATABASE_URL,
        websocket: true // WebSocket is internal, assume healthy if server is running
      };

      const availableServices = Object.values(services).filter(Boolean).length;
      const totalServices = Object.keys(services).length;
      const availabilityPercent = (availableServices / totalServices) * 100;
      
      let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
      if (availabilityPercent < 50) {
        status = 'critical';
      } else if (availabilityPercent < 80) {
        status = 'degraded';
      }

      return {
        status,
        details: {
          availableServices,
          totalServices,
          availabilityPercent: Math.round(availabilityPercent),
          services
        },
        lastCheck: new Date().toISOString(),
        responseTime: Date.now() - startTime
      };
      
    } catch (error) {
      this.errorHandler.logError(error as Error, { type: 'services_health_check' });
      
      return {
        status: 'critical',
        details: { error: (error as Error).message },
        lastCheck: new Date().toISOString(),
        responseTime: Date.now() - startTime
      };
    }
  }

  // Calculate overall system health
  private calculateOverallHealth(services: Record<string, ServiceHealth>): 'healthy' | 'degraded' | 'critical' {
    const statuses = Object.values(services).map(service => service.status);
    
    if (statuses.includes('critical')) {
      return 'critical';
    }
    
    if (statuses.includes('degraded')) {
      return 'degraded';
    }
    
    return 'healthy';
  }

  // Get memory metrics
  private getMemoryMetrics(): MemoryMetrics {
    const memUsage = process.memoryUsage();
    
    return {
      heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
      usagePercent: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
      rss: Math.round(memUsage.rss / 1024 / 1024)
    };
  }

  // Get database metrics
  private async getDatabaseMetrics(): Promise<DatabaseMetrics> {
    try {
      const startTime = Date.now();
      const { db } = await import('../db');
      await db.execute('SELECT 1');
      const responseTime = Date.now() - startTime;
      
      return {
        connectionStatus: 'connected',
        responseTime
      };
    } catch (error) {
      return {
        connectionStatus: 'disconnected',
        responseTime: 0
      };
    }
  }

  // Get API metrics
  private getApiMetrics(): ApiMetrics {
    const { total, errors, totalResponseTime } = this.requestMetrics;
    
    return {
      totalRequests: total,
      errorRate: total > 0 ? Math.round((errors / total) * 100) : 0,
      avgResponseTime: total > 0 ? Math.round(totalResponseTime / total) : 0
    };
  }

  // Auto-recovery with comprehensive checks
  async performAutoRecovery(): Promise<{ success: boolean; actions: string[]; errors: string[] }> {
    const actions: string[] = [];
    const errors: string[] = [];
    
    try {
      console.log('🚨 Starting automatic system recovery');
      
      // Get current health status
      const healthStatus = await this.performComprehensiveHealthCheck();
      
      // Determine recovery actions needed
      const recoveryNeeded = Object.entries(healthStatus.services)
        .filter(([, service]) => service.status !== 'healthy')
        .map(([name]) => name);
      
      if (recoveryNeeded.length === 0) {
        console.log('✅ System health is good, no recovery needed');
        return { success: true, actions: ['No recovery needed'], errors: [] };
      }
      
      console.log(`🔧 Recovery needed for: ${recoveryNeeded.join(', ')}`);
      
      // Perform targeted recovery
      const recoveryResult = await robustErrorRecovery.performSystemRecovery();
      
      actions.push(`Recovered services: ${recoveryResult.recoveredServices.join(', ')}`);
      
      if (recoveryResult.failedServices.length > 0) {
        errors.push(`Failed to recover: ${recoveryResult.failedServices.join(', ')}`);
      }
      
      // Post-recovery health check
      const postRecoveryHealth = await this.performComprehensiveHealthCheck();
      const overallImproved = postRecoveryHealth.overall !== 'critical';
      
      actions.push(`Post-recovery status: ${postRecoveryHealth.overall}`);
      
      console.log(`🏥 Auto-recovery completed: ${overallImproved ? 'SUCCESS' : 'PARTIAL'}`);
      
      return {
        success: recoveryResult.success && overallImproved,
        actions,
        errors
      };
      
    } catch (error) {
      this.errorHandler.logError(error as Error, { type: 'auto_recovery' });
      errors.push(`Recovery failed: ${(error as Error).message}`);
      
      return {
        success: false,
        actions,
        errors
      };
    }
  }

  // Reset metrics (useful for testing or periodic reset)
  resetMetrics(): void {
    this.requestMetrics = {
      total: 0,
      errors: 0,
      totalResponseTime: 0
    };
    
    console.log('📊 System metrics reset');
  }

  // Get system uptime
  getUptime(): { uptimeMs: number; uptimeHours: number; startTime: string } {
    const uptimeMs = Date.now() - this.startTime;
    
    return {
      uptimeMs,
      uptimeHours: Math.round(uptimeMs / (1000 * 60 * 60) * 100) / 100,
      startTime: new Date(this.startTime).toISOString()
    };
  }
}

export const systemHealthMonitor = SystemHealthMonitor.getInstance();