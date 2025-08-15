import { EventEmitter } from 'events';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

interface PerformanceThresholds {
  agentResponseTime: number; // ms
  apiResponseTime: number; // ms
  memoryUsage: number; // MB
  cpuUsage: number; // %
}

export class PerformanceMonitor extends EventEmitter {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private timers: Map<string, number> = new Map();
  private thresholds: PerformanceThresholds = {
    agentResponseTime: 5000, // 5 seconds
    apiResponseTime: 2000, // 2 seconds
    memoryUsage: 512, // 512 MB
    cpuUsage: 80 // 80%
  };
  
  private intervals: NodeJS.Timeout[] = [];
  private maxMetricsPerType = 50; // Reduced from 100 to save memory

  constructor() {
    super();
    this.startSystemMonitoring();
  }

  // Start a performance timer
  startTimer(name: string): void {
    this.timers.set(name, Date.now());
  }

  // End a performance timer and record the metric
  endTimer(name: string, tags?: Record<string, string>): number {
    const startTime = this.timers.get(name);
    if (!startTime) {
      console.warn(`Timer ${name} not found`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.timers.delete(name);
    
    this.recordMetric(name, duration, tags);
    
    // Check against thresholds
    this.checkThresholds(name, duration);
    
    return duration;
  }

  // Record a custom metric
  recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      tags
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metricArray = this.metrics.get(name)!;
    metricArray.push(metric);

    // Keep only last 50 metrics per type to reduce memory usage
    if (metricArray.length > this.maxMetricsPerType) {
      metricArray.splice(0, metricArray.length - this.maxMetricsPerType);
    }

    this.emit('metric', metric);
  }

  // Get performance statistics
  getStats(metricName?: string): any {
    if (metricName) {
      const metrics = this.metrics.get(metricName) || [];
      return this.calculateStats(metrics);
    }

    const allStats: Record<string, any> = {};
    this.metrics.forEach((metrics, name) => {
      allStats[name] = this.calculateStats(metrics);
    });
    return allStats;
  }

  // Calculate statistics for a metric array
  private calculateStats(metrics: PerformanceMetric[]): any {
    if (metrics.length === 0) {
      return { count: 0 };
    }

    const values = metrics.map(m => m.value);
    const sorted = [...values].sort((a, b) => a - b);
    
    return {
      count: metrics.length,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((sum, val) => sum + val, 0) / values.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)] || sorted[sorted.length - 1],
      p99: sorted[Math.floor(sorted.length * 0.99)] || sorted[sorted.length - 1],
      last: metrics[metrics.length - 1]
    };
  }

  // Check performance thresholds
  private checkThresholds(name: string, value: number): void {
    let threshold = 0;
    
    if (name.includes('agent') && name.includes('response')) {
      threshold = this.thresholds.agentResponseTime;
    } else if (name.includes('api') && name.includes('response')) {
      threshold = this.thresholds.apiResponseTime;
    }
    
    if (threshold > 0 && value > threshold) {
      this.emit('threshold_exceeded', {
        metric: name,
        value,
        threshold,
        timestamp: Date.now()
      });
      
      console.warn(`⚠️ Performance threshold exceeded: ${name} = ${value}ms (threshold: ${threshold}ms)`);
    }
  }

  // Start system-level monitoring
  private startSystemMonitoring(): void {
    // Memory monitoring
    const memoryInterval = setInterval(() => {
      const memUsage = process.memoryUsage();
      this.recordMetric('system_memory_heap_used', memUsage.heapUsed / 1024 / 1024, { unit: 'MB' });
      this.recordMetric('system_memory_heap_total', memUsage.heapTotal / 1024 / 1024, { unit: 'MB' });
      this.recordMetric('system_memory_rss', memUsage.rss / 1024 / 1024, { unit: 'MB' });
      
      // Check memory threshold
      const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
      if (heapUsedMB > this.thresholds.memoryUsage) {
        this.emit('memory_warning', {
          current: heapUsedMB,
          threshold: this.thresholds.memoryUsage,
          timestamp: Date.now()
        });
      }
    }, 30000); // Every 30 seconds - reduced frequency to save memory

    // Event loop lag monitoring
    const eventLoopInterval = setInterval(() => {
      const start = process.hrtime.bigint();
      setImmediate(() => {
        const lag = Number(process.hrtime.bigint() - start) / 1000000; // Convert to ms
        this.recordMetric('event_loop_lag', lag, { unit: 'ms' });
      });
    }, 15000); // Every 15 seconds - reduced frequency to save memory

    this.intervals.push(memoryInterval, eventLoopInterval);
  }

  // Agent-specific performance tracking
  trackAgentExecution(agentId: string, operation: string): {
    end: (result?: any) => void;
  } {
    const timerName = `agent_${agentId}_${operation}`;
    this.startTimer(timerName);

    return {
      end: (result?: any) => {
        const duration = this.endTimer(timerName, { 
          agentId, 
          operation,
          success: result ? 'true' : 'false'
        });
        
        console.log(`🤖 Agent ${agentId} ${operation}: ${duration}ms`);
        return duration;
      }
    };
  }

  // API request performance tracking
  trackApiRequest(endpoint: string, method: string = 'GET'): {
    end: (status?: number) => void;
  } {
    const timerName = `api_${method}_${endpoint.replace(/\//g, '_')}`;
    this.startTimer(timerName);

    return {
      end: (status?: number) => {
        const duration = this.endTimer(timerName, { 
          endpoint, 
          method,
          status: status?.toString() || 'unknown'
        });
        
        if (duration > this.thresholds.apiResponseTime) {
          console.warn(`🐌 Slow API: ${method} ${endpoint} took ${duration}ms`);
        }
        
        return duration;
      }
    };
  }

  // Get real-time performance dashboard data
  getDashboardData(): any {
    const stats = this.getStats();
    const systemMetrics = {
      memory: stats.system_memory_heap_used || { count: 0 },
      eventLoopLag: stats.event_loop_lag || { count: 0 }
    };

    // Get recent agent performance
    const agentMetrics: Record<string, any> = {};
    this.metrics.forEach((data, name) => {
      if (name.includes('agent_')) {
        const parts = name.split('_');
        if (parts.length >= 3) {
          const agentId = parts[1];
          const operation = parts.slice(2).join('_');
          
          if (!agentMetrics[agentId]) {
            agentMetrics[agentId] = {};
          }
          agentMetrics[agentId][operation] = this.calculateStats(data);
        }
      }
    });

    return {
      timestamp: Date.now(),
      system: systemMetrics,
      agents: agentMetrics,
      apis: this.getApiStats(),
      overview: {
        totalMetrics: this.metrics.size,
        activeTimers: this.timers.size
      }
    };
  }

  // Get API performance statistics
  private getApiStats(): Record<string, any> {
    const apiStats: Record<string, any> = {};
    
    this.metrics.forEach((data, name) => {
      if (name.includes('api_')) {
        const parts = name.split('_');
        if (parts.length >= 3) {
          const method = parts[1];
          const endpoint = parts.slice(2).join('/');
          
          const key = `${method} /${endpoint}`;
          apiStats[key] = this.calculateStats(data);
        }
      }
    });
    
    return apiStats;
  }

  // Enhanced cleanup with memory optimization
  destroy(): void {
    this.intervals.forEach(clearInterval);
    this.intervals.length = 0;
    this.metrics.clear();
    this.timers.clear();
    this.removeAllListeners();
    // Force garbage collection hint
    if (global.gc) {
      global.gc();
    }
  }

  // Periodic memory cleanup
  private performMemoryCleanup(): void {
    // Remove old metrics beyond our limit
    this.metrics.forEach((metricArray, name) => {
      if (metricArray.length > this.maxMetricsPerType) {
        metricArray.splice(0, metricArray.length - this.maxMetricsPerType);
      }
    });

    // Clear completed timers
    const now = Date.now();
    const expiredTimers: string[] = [];
    this.timers.forEach((startTime, name) => {
      if (now - startTime > 300000) { // 5 minutes
        expiredTimers.push(name);
      }
    });
    expiredTimers.forEach(name => this.timers.delete(name));
  }

  // Performance optimization recommendations
  getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    const stats = this.getStats();

    // Memory recommendations
    const memoryStats = stats.system_memory_heap_used;
    if (memoryStats && memoryStats.avg > this.thresholds.memoryUsage) {
      recommendations.push('High memory usage detected. Consider implementing memory optimization strategies.');
    }

    // Event loop lag recommendations
    const lagStats = stats.event_loop_lag;
    if (lagStats && lagStats.avg > 10) {
      recommendations.push('Event loop lag detected. Consider offloading CPU-intensive tasks.');
    }

    // Agent performance recommendations
    for (const [name, metricStats] of Object.entries(stats)) {
      if (name.includes('agent_') && typeof metricStats === 'object' && metricStats && 'avg' in metricStats && typeof metricStats.avg === 'number' && metricStats.avg > this.thresholds.agentResponseTime) {
        recommendations.push(`Slow agent response time for ${name}. Consider optimizing agent logic.`);
      }
    }

    return recommendations;
  }
}

// Global instance
export const performanceMonitor = new PerformanceMonitor();

// Enhanced error handling with performance tracking
performanceMonitor.on('threshold_exceeded', (data) => {
  console.warn(`⚠️ Performance Alert: ${data.metric} exceeded threshold`);
});

performanceMonitor.on('memory_warning', (data) => {
  console.warn(`🚨 Memory Warning: ${data.current}MB (threshold: ${data.threshold}MB)`);
});