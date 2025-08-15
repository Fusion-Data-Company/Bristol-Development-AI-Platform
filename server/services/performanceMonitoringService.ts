import { enterpriseHealthService } from './enterpriseHealthService';

interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: string;
  success: boolean;
  metadata?: Record<string, any>;
}

interface PerformanceProfile {
  endpoint: string;
  averageTime: number;
  minTime: number;
  maxTime: number;
  requestCount: number;
  errorCount: number;
  errorRate: number;
  lastUpdated: string;
}

class PerformanceMonitoringService {
  private metrics: PerformanceMetric[] = [];
  private profiles: Map<string, PerformanceProfile> = new Map();
  private maxMetrics = 10000; // Keep last 10k metrics

  /**
   * Middleware to monitor API endpoint performance
   */
  trackApiPerformance() {
    return (req: any, res: any, next: any) => {
      const start = Date.now();
      const endpoint = `${req.method} ${req.path}`;
      
      // Override res.end to capture completion
      const originalEnd = res.end;
      res.end = function(...args: any[]) {
        const duration = Date.now() - start;
        const success = res.statusCode < 400;
        
        // Record the metric
        performanceMonitoringService.recordMetric({
          operation: endpoint,
          duration,
          timestamp: new Date().toISOString(),
          success,
          metadata: {
            statusCode: res.statusCode,
            method: req.method,
            path: req.path,
            userAgent: req.get('User-Agent'),
            ip: req.ip
          }
        });

        // Update enterprise health service
        enterpriseHealthService.recordRequest('API', duration, success);
        
        originalEnd.apply(this, args);
      };
      
      next();
    };
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Maintain max metrics limit
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
    
    // Update performance profile
    this.updateProfile(metric);
  }

  /**
   * Update performance profile for an operation
   */
  private updateProfile(metric: PerformanceMetric): void {
    let profile = this.profiles.get(metric.operation);
    
    if (!profile) {
      profile = {
        endpoint: metric.operation,
        averageTime: metric.duration,
        minTime: metric.duration,
        maxTime: metric.duration,
        requestCount: 1,
        errorCount: metric.success ? 0 : 1,
        errorRate: metric.success ? 0 : 100,
        lastUpdated: metric.timestamp
      };
    } else {
      // Update statistics
      profile.requestCount++;
      if (!metric.success) {
        profile.errorCount++;
      }
      
      profile.minTime = Math.min(profile.minTime, metric.duration);
      profile.maxTime = Math.max(profile.maxTime, metric.duration);
      
      // Calculate rolling average (weighted toward recent requests)
      const alpha = 0.1; // Weight for new value
      profile.averageTime = (1 - alpha) * profile.averageTime + alpha * metric.duration;
      
      profile.errorRate = (profile.errorCount / profile.requestCount) * 100;
      profile.lastUpdated = metric.timestamp;
    }
    
    this.profiles.set(metric.operation, profile);
  }

  /**
   * Get performance analytics
   */
  getPerformanceAnalytics(timeRangeMinutes: number = 60): {
    summary: {
      totalRequests: number;
      averageResponseTime: number;
      errorRate: number;
      slowestEndpoints: PerformanceProfile[];
      fastestEndpoints: PerformanceProfile[];
    };
    trends: {
      requestsOverTime: { timestamp: string; count: number }[];
      responseTimeOverTime: { timestamp: string; averageTime: number }[];
    };
    profiles: PerformanceProfile[];
  } {
    const cutoffTime = new Date(Date.now() - timeRangeMinutes * 60 * 1000);
    const recentMetrics = this.metrics.filter(m => 
      new Date(m.timestamp) >= cutoffTime
    );

    // Calculate summary statistics
    const totalRequests = recentMetrics.length;
    const averageResponseTime = totalRequests > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / totalRequests 
      : 0;
    const errorCount = recentMetrics.filter(m => !m.success).length;
    const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;

    // Get sorted endpoint profiles
    const profiles = Array.from(this.profiles.values());
    const slowestEndpoints = profiles
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 5);
    const fastestEndpoints = profiles
      .sort((a, b) => a.averageTime - b.averageTime)
      .slice(0, 5);

    // Generate time-based trends (5-minute buckets)
    const trends = this.generateTrends(recentMetrics, 5);

    return {
      summary: {
        totalRequests,
        averageResponseTime: Math.round(averageResponseTime),
        errorRate: Math.round(errorRate * 100) / 100,
        slowestEndpoints,
        fastestEndpoints
      },
      trends,
      profiles
    };
  }

  /**
   * Generate time-based trends
   */
  private generateTrends(metrics: PerformanceMetric[], bucketMinutes: number): {
    requestsOverTime: { timestamp: string; count: number }[];
    responseTimeOverTime: { timestamp: string; averageTime: number }[];
  } {
    const buckets = new Map<string, { count: number; totalTime: number }>();
    
    metrics.forEach(metric => {
      const timestamp = new Date(metric.timestamp);
      const bucketKey = new Date(
        timestamp.getFullYear(),
        timestamp.getMonth(),
        timestamp.getDate(),
        timestamp.getHours(),
        Math.floor(timestamp.getMinutes() / bucketMinutes) * bucketMinutes
      ).toISOString();
      
      const bucket = buckets.get(bucketKey) || { count: 0, totalTime: 0 };
      bucket.count++;
      bucket.totalTime += metric.duration;
      buckets.set(bucketKey, bucket);
    });

    const requestsOverTime = Array.from(buckets.entries())
      .map(([timestamp, data]) => ({ timestamp, count: data.count }))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    const responseTimeOverTime = Array.from(buckets.entries())
      .map(([timestamp, data]) => ({ 
        timestamp, 
        averageTime: Math.round(data.totalTime / data.count) 
      }))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    return { requestsOverTime, responseTimeOverTime };
  }

  /**
   * Get performance profile for specific endpoint
   */
  getEndpointProfile(endpoint: string): PerformanceProfile | undefined {
    return this.profiles.get(endpoint);
  }

  /**
   * Get slowest operations
   */
  getSlowestOperations(limit: number = 10): PerformanceProfile[] {
    return Array.from(this.profiles.values())
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, limit);
  }

  /**
   * Get operations with highest error rates
   */
  getHighestErrorRateOperations(limit: number = 10): PerformanceProfile[] {
    return Array.from(this.profiles.values())
      .filter(profile => profile.errorRate > 0)
      .sort((a, b) => b.errorRate - a.errorRate)
      .slice(0, limit);
  }

  /**
   * Performance alerts
   */
  getPerformanceAlerts(): { type: string; message: string; severity: 'high' | 'medium' | 'low' }[] {
    const alerts = [];
    const analytics = this.getPerformanceAnalytics(30); // Last 30 minutes

    // Slow response time alert
    if (analytics.summary.averageResponseTime > 2000) {
      alerts.push({
        type: 'slow_response',
        message: `Average response time is ${analytics.summary.averageResponseTime}ms (threshold: 2000ms)`,
        severity: 'high' as const
      });
    }

    // High error rate alert
    if (analytics.summary.errorRate > 5) {
      alerts.push({
        type: 'high_error_rate',
        message: `Error rate is ${analytics.summary.errorRate}% (threshold: 5%)`,
        severity: 'high' as const
      });
    }

    // Specific slow endpoints
    const slowEndpoints = analytics.summary.slowestEndpoints.filter(ep => ep.averageTime > 3000);
    if (slowEndpoints.length > 0) {
      alerts.push({
        type: 'slow_endpoints',
        message: `Slow endpoints detected: ${slowEndpoints.map(ep => ep.endpoint).join(', ')}`,
        severity: 'medium' as const
      });
    }

    return alerts;
  }

  /**
   * Clean up old metrics
   */
  cleanup(): void {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    this.metrics = this.metrics.filter(m => new Date(m.timestamp) >= cutoffTime);
    
    console.log(`Cleaned up performance metrics. Kept ${this.metrics.length} recent metrics.`);
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = ['operation', 'duration', 'timestamp', 'success', 'statusCode'];
      const rows = this.metrics.map(m => [
        m.operation,
        m.duration,
        m.timestamp,
        m.success,
        m.metadata?.statusCode || ''
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
    
    return JSON.stringify(this.metrics, null, 2);
  }
}

export const performanceMonitoringService = new PerformanceMonitoringService();

// Clean up old metrics every hour
setInterval(() => {
  performanceMonitoringService.cleanup();
}, 60 * 60 * 1000);