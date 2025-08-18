interface SystemMetrics {
  timestamp: number;
  memory: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
    external: number;
  };
  uptime: number;
  cpuUsage: {
    user: number;
    system: number;
  };
  connections?: {
    websocket: number;
    http: number;
  };
}

class MetricsCollector {
  private startTime = Date.now();
  private lastCpuUsage = process.cpuUsage();
  private metrics: SystemMetrics[] = [];
  private maxMetrics = 100; // Keep last 100 metrics

  getSystemMetrics(): SystemMetrics {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage(this.lastCpuUsage);
    this.lastCpuUsage = process.cpuUsage();

    return {
      timestamp: Date.now(),
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        rss: Math.round(memUsage.rss / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024)
      },
      uptime: Date.now() - this.startTime,
      cpuUsage: {
        user: cpuUsage.user / 1000000, // Convert from microseconds to seconds
        system: cpuUsage.system / 1000000
      }
    };
  }

  recordMetrics(connections?: { websocket: number; http: number }) {
    const metrics = this.getSystemMetrics();
    if (connections) {
      metrics.connections = connections;
    }

    this.metrics.push(metrics);
    
    // Keep only the last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  getLatestMetrics(count = 10): SystemMetrics[] {
    return this.metrics.slice(-count);
  }

  calculateP95Latency(latencies: number[]): number {
    if (latencies.length === 0) return 0;
    const sorted = latencies.sort((a, b) => a - b);
    const index = Math.ceil(0.95 * sorted.length) - 1;
    return sorted[index] || 0;
  }

  startPeriodicLogging(intervalMs = 30000) {
    setInterval(() => {
      const metrics = this.getSystemMetrics();
      console.log(JSON.stringify({
        level: 'INFO',
        type: 'system_metrics',
        memory_mb: metrics.memory.heapUsed,
        uptime_ms: metrics.uptime,
        cpu_user_s: metrics.cpuUsage.user.toFixed(2),
        cpu_system_s: metrics.cpuUsage.system.toFixed(2)
      }));
    }, intervalMs);
  }
}

export const metricsCollector = new MetricsCollector();