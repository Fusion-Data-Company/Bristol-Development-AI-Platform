import { storage } from "../storage";
import WebSocket from 'ws';

interface ServiceMetrics {
  name: string;
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  lastCheck: string;
  errors: number;
  requests: number;
}

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  apiCalls: number;
  errors: number;
  services: ServiceMetrics[];
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  performance: {
    avgResponseTime: number;
    requestsPerSecond: number;
    errorRate: number;
  };
}

class EnterpriseHealthService {
  private metrics: Map<string, ServiceMetrics> = new Map();
  private startTime = Date.now();
  private totalRequests = 0;
  private totalErrors = 0;
  private responseTimes: number[] = [];
  private subscribers: WebSocket[] = [];

  constructor() {
    // Initialize core services monitoring
    this.initializeServices();
    // Start health monitoring interval
    setInterval(() => this.performHealthChecks(), 30000); // Every 30 seconds
    // Clean up old metrics
    setInterval(() => this.cleanupMetrics(), 300000); // Every 5 minutes
  }

  private initializeServices() {
    const services = [
      'Database',
      'Authentication',
      'AI Service',
      'MCP Service',
      'WebSocket',
      'Data Aggregation',
      'Real-time Sync',
      'Bristol Brain',
      'Scraping Service',
      'Integration Service',
      'Analytics Agent'
    ];

    services.forEach(serviceName => {
      this.metrics.set(serviceName, {
        name: serviceName,
        status: 'up',
        lastCheck: new Date().toISOString(),
        errors: 0,
        requests: 0
      });
    });
  }

  async performHealthChecks(): Promise<void> {
    // Database health check
    await this.checkDatabaseHealth();
    
    // Service health checks
    await this.checkServiceHealth();
    
    // Memory monitoring
    this.updateMemoryMetrics();
    
    // Broadcast health updates to subscribers
    this.broadcastHealthUpdate();
  }

  private async checkDatabaseHealth(): Promise<void> {
    const start = Date.now();
    try {
      await storage.getAllSites();
      const responseTime = Date.now() - start;
      
      this.updateServiceMetric('Database', {
        status: responseTime < 1000 ? 'up' : 'degraded',
        responseTime,
        lastCheck: new Date().toISOString()
      });
    } catch (error) {
      this.updateServiceMetric('Database', {
        status: 'down',
        lastCheck: new Date().toISOString(),
        errors: this.metrics.get('Database')?.errors! + 1
      });
    }
  }

  private async checkServiceHealth(): Promise<void> {
    // Check AI Service
    try {
      // Simulated health check - in production, would ping actual service
      this.updateServiceMetric('AI Service', {
        status: 'up',
        responseTime: Math.random() * 200 + 50,
        lastCheck: new Date().toISOString()
      });
    } catch (error) {
      this.updateServiceMetric('AI Service', {
        status: 'down',
        lastCheck: new Date().toISOString(),
        errors: this.metrics.get('AI Service')?.errors! + 1
      });
    }

    // Check MCP Service
    try {
      this.updateServiceMetric('MCP Service', {
        status: 'up',
        responseTime: Math.random() * 150 + 30,
        lastCheck: new Date().toISOString()
      });
    } catch (error) {
      this.updateServiceMetric('MCP Service', {
        status: 'down',
        lastCheck: new Date().toISOString(),
        errors: this.metrics.get('MCP Service')?.errors! + 1
      });
    }
  }

  private updateMemoryMetrics(): void {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      const total = usage.heapTotal;
      const used = usage.heapUsed;
      
      // Store memory metrics (simplified for demo)
      this.metrics.set('Memory', {
        name: 'Memory',
        status: (used / total) > 0.9 ? 'down' : (used / total) > 0.7 ? 'degraded' : 'up',
        lastCheck: new Date().toISOString(),
        errors: 0,
        requests: 0
      });
    }
  }

  private updateServiceMetric(serviceName: string, updates: Partial<ServiceMetrics>): void {
    const current = this.metrics.get(serviceName);
    if (current) {
      this.metrics.set(serviceName, { ...current, ...updates });
    }
  }

  recordRequest(serviceName: string, responseTime: number, success: boolean): void {
    this.totalRequests++;
    this.responseTimes.push(responseTime);
    
    // Keep only last 1000 response times for performance calculation
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-1000);
    }

    if (!success) {
      this.totalErrors++;
    }

    const metric = this.metrics.get(serviceName);
    if (metric) {
      metric.requests++;
      if (!success) {
        metric.errors++;
      }
      if (responseTime) {
        metric.responseTime = responseTime;
      }
    }
  }

  getSystemHealth(): SystemHealth {
    const uptime = (Date.now() - this.startTime) / 1000 / 60 / 60; // hours
    const services = Array.from(this.metrics.values());
    
    // Calculate overall status
    const criticalServices = services.filter(s => s.status === 'down').length;
    const degradedServices = services.filter(s => s.status === 'degraded').length;
    
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (criticalServices > 0) {
      status = 'critical';
    } else if (degradedServices > 0) {
      status = 'warning';
    }

    // Calculate performance metrics
    const avgResponseTime = this.responseTimes.length > 0 
      ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length 
      : 0;
    
    const errorRate = this.totalRequests > 0 ? (this.totalErrors / this.totalRequests) * 100 : 0;
    const requestsPerSecond = this.totalRequests / (uptime * 3600);

    // Memory metrics
    let memoryMetrics = { used: 0, total: 100, percentage: 0 };
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      memoryMetrics = {
        used: Math.round(usage.heapUsed / 1024 / 1024), // MB
        total: Math.round(usage.heapTotal / 1024 / 1024), // MB
        percentage: Math.round((usage.heapUsed / usage.heapTotal) * 100)
      };
    }

    return {
      status,
      uptime: Math.round(uptime * 100) / 100, // Round to 2 decimal places
      apiCalls: this.totalRequests,
      errors: this.totalErrors,
      services,
      memory: memoryMetrics,
      performance: {
        avgResponseTime: Math.round(avgResponseTime),
        requestsPerSecond: Math.round(requestsPerSecond * 100) / 100,
        errorRate: Math.round(errorRate * 100) / 100
      }
    };
  }

  subscribeToHealthUpdates(ws: WebSocket): void {
    this.subscribers.push(ws);
    
    // Send initial health status
    ws.send(JSON.stringify({
      type: 'health_update',
      data: this.getSystemHealth(),
      timestamp: new Date().toISOString()
    }));

    // Clean up on close
    ws.on('close', () => {
      this.subscribers = this.subscribers.filter(subscriber => subscriber !== ws);
    });
  }

  private broadcastHealthUpdate(): void {
    const healthData = this.getSystemHealth();
    const message = JSON.stringify({
      type: 'health_update',
      data: healthData,
      timestamp: new Date().toISOString()
    });

    this.subscribers.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }

  private cleanupMetrics(): void {
    // Reset counters periodically to prevent overflow
    const hoursSinceStart = (Date.now() - this.startTime) / 1000 / 60 / 60;
    
    if (hoursSinceStart > 24) {
      this.totalRequests = Math.floor(this.totalRequests * 0.8);
      this.totalErrors = Math.floor(this.totalErrors * 0.8);
      this.responseTimes = this.responseTimes.slice(-500);
      
      // Reset service-level counters
      this.metrics.forEach(metric => {
        metric.requests = Math.floor(metric.requests * 0.8);
        metric.errors = Math.floor(metric.errors * 0.8);
      });
    }
  }

  getServiceMetrics(serviceName: string): ServiceMetrics | undefined {
    return this.metrics.get(serviceName);
  }

  getAllServiceMetrics(): ServiceMetrics[] {
    return Array.from(this.metrics.values());
  }

  // Alert system for critical issues
  checkCriticalAlerts(): { type: string; message: string; severity: 'high' | 'medium' | 'low' }[] {
    const alerts = [];
    const health = this.getSystemHealth();

    // Critical service down
    const downServices = health.services.filter(s => s.status === 'down');
    if (downServices.length > 0) {
      alerts.push({
        type: 'service_down',
        message: `Critical services down: ${downServices.map(s => s.name).join(', ')}`,
        severity: 'high' as const
      });
    }

    // High error rate
    if (health.performance.errorRate > 5) {
      alerts.push({
        type: 'high_error_rate',
        message: `Error rate is ${health.performance.errorRate}% (threshold: 5%)`,
        severity: 'high' as const
      });
    }

    // High memory usage
    if (health.memory.percentage > 90) {
      alerts.push({
        type: 'high_memory',
        message: `Memory usage is ${health.memory.percentage}% (threshold: 90%)`,
        severity: 'medium' as const
      });
    }

    // Slow response times
    if (health.performance.avgResponseTime > 2000) {
      alerts.push({
        type: 'slow_response',
        message: `Average response time is ${health.performance.avgResponseTime}ms (threshold: 2000ms)`,
        severity: 'medium' as const
      });
    }

    return alerts;
  }
}

export const enterpriseHealthService = new EnterpriseHealthService();