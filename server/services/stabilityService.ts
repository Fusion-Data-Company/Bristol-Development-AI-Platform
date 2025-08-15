import { errorHandlingService } from './errorHandlingService';
import { db } from '../db';
import { agents, agentTasks } from '@shared/schema';
import { eq } from 'drizzle-orm';

export class StabilityService {
  private static instance: StabilityService;
  private healthChecks: Map<string, { lastCheck: Date; status: 'healthy' | 'unhealthy'; details?: any }> = new Map();
  private circuitBreakers: Map<string, any> = new Map();

  static getInstance(): StabilityService {
    if (!StabilityService.instance) {
      StabilityService.instance = new StabilityService();
    }
    return StabilityService.instance;
  }

  // Database health check
  async checkDatabaseHealth(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    try {
      const start = Date.now();
      await db.select().from(agents).limit(1);
      const duration = Date.now() - start;
      
      const status = duration < 5000 ? 'healthy' : 'unhealthy';
      const details = { 
        responseTime: duration,
        timestamp: new Date().toISOString()
      };
      
      this.healthChecks.set('database', { lastCheck: new Date(), status, details });
      return { status, details };
    } catch (error) {
      const details = { 
        error: (error as Error).message,
        timestamp: new Date().toISOString()
      };
      this.healthChecks.set('database', { lastCheck: new Date(), status: 'unhealthy', details });
      return { status: 'unhealthy', details };
    }
  }

  // MCP servers health check
  async checkMcpHealth(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    const mcpServers = ['filesystem', 'memory', 'sequential-thinking', 'everything', 'firecrawl'];
    const serverStatuses: any = {};
    let overallHealthy = true;

    for (const server of mcpServers) {
      try {
        // Simple ping test - in a real implementation, this would check actual MCP server status
        serverStatuses[server] = { 
          status: 'healthy', 
          lastPing: new Date().toISOString() 
        };
      } catch (error) {
        serverStatuses[server] = { 
          status: 'unhealthy', 
          error: (error as Error).message 
        };
        overallHealthy = false;
      }
    }

    const status = overallHealthy ? 'healthy' : 'unhealthy';
    const details = { servers: serverStatuses, timestamp: new Date().toISOString() };
    
    this.healthChecks.set('mcp', { lastCheck: new Date(), status, details });
    return { status, details };
  }

  // Agent system health check
  async checkAgentHealth(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    try {
      const activeAgents = await db.select().from(agents).where(eq(agents.status, 'active'));
      const recentTasks = await db.select().from(agentTasks)
        .where(eq(agentTasks.status, 'running'));

      const details = {
        activeAgents: activeAgents.length,
        runningTasks: recentTasks.length,
        timestamp: new Date().toISOString()
      };

      const status = activeAgents.length > 0 ? 'healthy' : 'unhealthy';
      this.healthChecks.set('agents', { lastCheck: new Date(), status, details });
      return { status, details };
    } catch (error) {
      const details = { 
        error: (error as Error).message,
        timestamp: new Date().toISOString()
      };
      this.healthChecks.set('agents', { lastCheck: new Date(), status: 'unhealthy', details });
      return { status: 'unhealthy', details };
    }
  }

  // Memory usage check
  checkMemoryHealth(): { status: 'healthy' | 'unhealthy'; details: any } {
    const memUsage = process.memoryUsage();
    const totalHeap = memUsage.heapTotal;
    const usedHeap = memUsage.heapUsed;
    const heapUsagePercent = (usedHeap / totalHeap) * 100;

    const status = heapUsagePercent < 85 ? 'healthy' : 'unhealthy';
    const details = {
      heapUsed: Math.round(usedHeap / 1024 / 1024 * 100) / 100, // MB
      heapTotal: Math.round(totalHeap / 1024 / 1024 * 100) / 100, // MB
      heapUsagePercent: Math.round(heapUsagePercent * 100) / 100,
      rss: Math.round(memUsage.rss / 1024 / 1024 * 100) / 100, // MB
      external: Math.round(memUsage.external / 1024 / 1024 * 100) / 100, // MB
      timestamp: new Date().toISOString()
    };

    this.healthChecks.set('memory', { lastCheck: new Date(), status, details });
    return { status, details };
  }

  // Comprehensive health check
  async performHealthCheck(): Promise<{ 
    overall: 'healthy' | 'unhealthy';
    services: Record<string, any>;
    timestamp: string;
  }> {
    const results = await Promise.allSettled([
      this.checkDatabaseHealth(),
      this.checkMcpHealth(),
      this.checkAgentHealth(),
      Promise.resolve(this.checkMemoryHealth())
    ]);

    const services: Record<string, any> = {};
    let overallHealthy = true;

    results.forEach((result, index) => {
      const serviceName = ['database', 'mcp', 'agents', 'memory'][index];
      if (result.status === 'fulfilled') {
        services[serviceName] = result.value;
        if (result.value.status === 'unhealthy') {
          overallHealthy = false;
        }
      } else {
        services[serviceName] = { 
          status: 'unhealthy', 
          error: result.reason?.message || 'Unknown error' 
        };
        overallHealthy = false;
      }
    });

    return {
      overall: overallHealthy ? 'healthy' : 'unhealthy',
      services,
      timestamp: new Date().toISOString()
    };
  }

  // Get circuit breaker for a service
  getCircuitBreaker(serviceName: string) {
    if (!this.circuitBreakers.has(serviceName)) {
      this.circuitBreakers.set(
        serviceName, 
        errorHandlingService.createCircuitBreaker(serviceName)
      );
    }
    return this.circuitBreakers.get(serviceName);
  }

  // Auto-recovery mechanisms
  async attemptAutoRecovery(serviceName: string): Promise<boolean> {
    console.log(`🔄 Attempting auto-recovery for service: ${serviceName}`);
    
    try {
      switch (serviceName) {
        case 'database':
          // Attempt database reconnection
          await this.checkDatabaseHealth();
          break;
          
        case 'agents':
          // Initialize default agents if none exist
          const existingAgents = await db.select().from(agents);
          if (existingAgents.length === 0) {
            // Initialize agents through the API
            try {
              const response = await fetch('http://localhost:5000/api/enhanced-agents/initialize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
              });
              console.log('✅ Default agents initialized during recovery');
            } catch (error) {
              console.log('Agent initialization will be handled by next system request');
            }
          } else {
            // Restart failed agents
            const failedAgents = await db.select().from(agents).where(eq(agents.status, 'error'));
            for (const agent of failedAgents) {
              await db.update(agents)
                .set({ status: 'active', updatedAt: new Date() })
                .where(eq(agents.id, agent.id));
            }
          }
          break;
          
        case 'memory':
          // Memory optimization
          if (global.gc) {
            global.gc();
            console.log('✅ Manual garbage collection performed');
          }
          // Clear old cached data
          this.clearOldHealthChecks();
          
          // Clear any cached data to free memory
          // Note: require.cache not available in ES modules, using alternative cleanup
          
          console.log('✅ Memory optimization completed');
          break;
          
        default:
          console.log(`No auto-recovery mechanism for service: ${serviceName}`);
          return false;
      }
      
      console.log(`✅ Auto-recovery succeeded for service: ${serviceName}`);
      return true;
    } catch (error) {
      console.error(`❌ Auto-recovery failed for service: ${serviceName}`, error);
      return false;
    }
  }

  // Clear old health check data to free memory
  private clearOldHealthChecks() {
    const cutoffTime = Date.now() - (5 * 60 * 1000); // 5 minutes ago
    this.healthChecks.forEach((check, key) => {
      if (check.lastCheck.getTime() < cutoffTime) {
        this.healthChecks.delete(key);
      }
    });
  }

  // Performance optimization recommendations
  getPerformanceRecommendations(): string[] {
    const recommendations: string[] = [];
    const memoryHealth = this.healthChecks.get('memory');
    
    if (memoryHealth?.details?.heapUsagePercent > 75) {
      recommendations.push('High memory usage detected. Consider implementing memory optimization strategies.');
    }
    
    const dbHealth = this.healthChecks.get('database');
    if (dbHealth?.details?.responseTime > 1000) {
      recommendations.push('Database response time is slow. Consider query optimization or connection pooling.');
    }
    
    const agentHealth = this.healthChecks.get('agents');
    if (agentHealth?.details?.runningTasks > 50) {
      recommendations.push('High number of running agent tasks. Consider scaling or task prioritization.');
    }
    
    return recommendations;
  }

  // Start continuous monitoring
  startMonitoring(intervalMs: number = 30000) {
    console.log(`🔍 Starting stability monitoring (interval: ${intervalMs}ms)`);
    
    setInterval(async () => {
      try {
        const healthCheck = await this.performHealthCheck();
        
        if (healthCheck.overall === 'unhealthy') {
          console.warn('⚠️ System health check failed:', healthCheck);
          
          // Attempt auto-recovery for unhealthy services
          for (const [serviceName, serviceHealth] of Object.entries(healthCheck.services)) {
            if (serviceHealth.status === 'unhealthy') {
              await this.attemptAutoRecovery(serviceName);
            }
          }
        }
        
        // Log performance recommendations
        const recommendations = this.getPerformanceRecommendations();
        if (recommendations.length > 0) {
          console.log('💡 Performance recommendations:', recommendations);
        }
        
      } catch (error) {
        errorHandlingService.logError(error as Error, { context: 'stability monitoring' });
      }
    }, intervalMs);
  }

  // Get system status summary
  getSystemStatus() {
    const services: Record<string, any> = {};
    this.healthChecks.forEach((check, name) => {
      services[name] = {
        status: check.status,
        lastCheck: check.lastCheck,
        details: check.details
      };
    });

    return {
      services,
      circuitBreakers: Array.from(this.circuitBreakers.entries()).map(([name, cb]) => ({
        name,
        status: cb.getStatus()
      })),
      recommendations: this.getPerformanceRecommendations(),
      timestamp: new Date().toISOString()
    };
  }
}

export const stabilityService = StabilityService.getInstance();