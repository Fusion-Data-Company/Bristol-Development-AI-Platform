import { performance } from 'perf_hooks';

// Global types for TypeScript
declare global {
  var gc: (() => void) | undefined;
}

interface MemoryMetrics {
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
}

class MemoryOptimizer {
  private metrics: MemoryMetrics[] = [];
  private cleanupInterval: NodeJS.Timeout | null = null;
  private lastCleanup = Date.now();
  private readonly MAX_METRICS = 100; // Keep only last 100 memory snapshots
  private readonly CLEANUP_INTERVAL = 30000; // 30 seconds
  private readonly MEMORY_THRESHOLD = 500 * 1024 * 1024; // 500MB

  constructor() {
    this.startMonitoring();
  }

  private startMonitoring() {
    this.cleanupInterval = setInterval(() => {
      this.collectMetrics();
      this.checkMemoryUsage();
      this.performCleanup();
    }, this.CLEANUP_INTERVAL);
  }

  private collectMetrics() {
    const memUsage = process.memoryUsage();
    const metric: MemoryMetrics = {
      timestamp: Date.now(),
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss
    };

    this.metrics.push(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
  }

  private checkMemoryUsage() {
    const currentMemory = process.memoryUsage();
    
    if (currentMemory.heapUsed > this.MEMORY_THRESHOLD) {
      console.warn(`⚠️ High memory usage detected: ${Math.round(currentMemory.heapUsed / 1024 / 1024)}MB`);
      this.triggerGarbageCollection();
    }
  }

  private triggerGarbageCollection() {
    if (global.gc) {
      const before = process.memoryUsage().heapUsed;
      global.gc();
      const after = process.memoryUsage().heapUsed;
      console.log(`🧹 Garbage collection freed ${Math.round((before - after) / 1024 / 1024)}MB`);
    }
  }

  private performCleanup() {
    const now = Date.now();
    
    // Cleanup every 5 minutes
    if (now - this.lastCleanup > 300000) {
      this.cleanupGlobalCaches();
      this.lastCleanup = now;
    }
  }

  private cleanupGlobalCaches() {
    // Clear validation log timestamps to prevent memory leaks
    if (global.lastValidationLogTime) {
      delete global.lastValidationLogTime;
    }

    // Clear any other global caches that might exist
    if (global.mcpResponseCache) {
      global.mcpResponseCache.clear?.();
    }

    console.log('🧽 Global caches cleaned');
  }

  public getMemoryRecommendations(): string[] {
    const recommendations: string[] = [];
    const currentMemory = process.memoryUsage();

    if (currentMemory.heapUsed > this.MEMORY_THRESHOLD) {
      recommendations.push('High memory usage detected. Consider implementing memory optimization strategies.');
    }

    if (currentMemory.external > 100 * 1024 * 1024) {
      recommendations.push('High external memory usage. Check for memory leaks in native modules.');
    }

    if (this.metrics.length > 10) {
      const recent = this.metrics.slice(-10);
      const growth = recent[recent.length - 1].heapUsed - recent[0].heapUsed;
      if (growth > 50 * 1024 * 1024) {
        recommendations.push('Memory usage growing rapidly. Check for memory leaks.');
      }
    }

    return recommendations;
  }

  public getCurrentMemoryStats() {
    const memUsage = process.memoryUsage();
    return {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
      rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
      external: Math.round(memUsage.external / 1024 / 1024) + 'MB'
    };
  }

  public destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.metrics = [];
  }
}

// Export singleton instance
export const memoryOptimizer = new MemoryOptimizer();

// Export recommendations function for easy access
export function getPerformanceRecommendations(): string[] {
  return memoryOptimizer.getMemoryRecommendations();
}

// Enhanced console.warn override to reduce memory usage from excessive logging
const originalConsoleWarn = console.warn;
const warnCounts = new Map<string, { count: number, lastSeen: number }>();
const MAX_WARN_FREQUENCY = 10000; // 10 seconds between identical warnings

console.warn = (...args: unknown[]) => {
  const message = args.join(' ');
  const now = Date.now();
  
  const existing = warnCounts.get(message);
  if (existing && now - existing.lastSeen < MAX_WARN_FREQUENCY) {
    existing.count++;
    return; // Suppress duplicate warning
  }
  
  warnCounts.set(message, { count: 1, lastSeen: now });
  
  // Clean up old warning counts to prevent memory leaks
  if (warnCounts.size > 1000) {
    const cutoff = now - 600000; // 10 minutes
    for (const [key, value] of warnCounts.entries()) {
      if (value.lastSeen < cutoff) {
        warnCounts.delete(key);
      }
    }
  }
  
  originalConsoleWarn.apply(console, args);
};

export default memoryOptimizer;