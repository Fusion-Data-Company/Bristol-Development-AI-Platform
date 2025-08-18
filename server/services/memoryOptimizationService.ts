/**
 * Memory Optimization Service
 * Addresses high memory usage warnings and improves system performance
 */

export class MemoryOptimizationService {
  private gcInterval: NodeJS.Timeout | null = null;
  private memoryCheckInterval: NodeJS.Timeout | null = null;
  private memoryThresholds = {
    warning: 500 * 1024 * 1024, // 500MB
    critical: 800 * 1024 * 1024, // 800MB
    emergency: 1024 * 1024 * 1024 // 1GB
  };

  constructor() {
    this.startMemoryMonitoring();
  }

  /**
   * Start continuous memory monitoring
   */
  private startMemoryMonitoring() {
    // Perform garbage collection every 2 minutes
    this.gcInterval = setInterval(() => {
      this.performGarbageCollection();
    }, 120000);

    // Check memory usage every 30 seconds
    this.memoryCheckInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, 30000);

    console.log('✅ Memory optimization service started');
  }

  /**
   * Perform garbage collection if available
   */
  private performGarbageCollection() {
    if (global.gc) {
      try {
        const beforeGC = process.memoryUsage();
        global.gc();
        const afterGC = process.memoryUsage();
        
        const saved = beforeGC.heapUsed - afterGC.heapUsed;
        if (saved > 1024 * 1024) { // Only log if we saved more than 1MB
          console.log(`🧹 Garbage collection freed ${Math.round(saved / 1024 / 1024)}MB`);
        }
      } catch (error) {
        // Silently handle GC errors
      }
    }
  }

  /**
   * Check current memory usage and take action if needed
   */
  private checkMemoryUsage() {
    const memoryUsage = process.memoryUsage();
    const heapUsed = memoryUsage.heapUsed;

    if (heapUsed > this.memoryThresholds.emergency) {
      console.warn('🚨 EMERGENCY: Memory usage critical, forcing cleanup');
      this.emergencyCleanup();
    } else if (heapUsed > this.memoryThresholds.critical) {
      console.warn('⚠️ CRITICAL: High memory usage detected, performing cleanup');
      this.performCleanup();
    } else if (heapUsed > this.memoryThresholds.warning) {
      console.log('💡 Memory usage elevated, performing light cleanup');
      this.performLightCleanup();
    }
  }

  /**
   * Emergency cleanup procedures
   */
  private emergencyCleanup() {
    // Force garbage collection multiple times
    if (global.gc) {
      for (let i = 0; i < 3; i++) {
        global.gc();
      }
    }

    // Clear any large temporary objects
    this.clearTemporaryObjects();
    
    // Log memory state
    this.logMemoryState('EMERGENCY CLEANUP COMPLETED');
  }

  /**
   * Standard cleanup procedures
   */
  private performCleanup() {
    // Force garbage collection
    if (global.gc) {
      global.gc();
    }

    // Clear temporary objects
    this.clearTemporaryObjects();

    // Log memory state
    this.logMemoryState('CLEANUP COMPLETED');
  }

  /**
   * Light cleanup for elevated memory usage
   */
  private performLightCleanup() {
    // Gentle garbage collection suggestion
    if (global.gc) {
      global.gc();
    }
  }

  /**
   * Clear temporary objects and caches
   */
  private clearTemporaryObjects() {
    // Clear require cache for non-essential modules (be careful with this)
    // Only clear development/testing modules
    Object.keys(require.cache).forEach(key => {
      if (key.includes('node_modules/.cache') || key.includes('test') || key.includes('spec')) {
        delete require.cache[key];
      }
    });
  }

  /**
   * Log current memory state
   */
  private logMemoryState(context: string) {
    const memoryUsage = process.memoryUsage();
    console.log(`📊 ${context} - Memory Usage:`, {
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
      external: Math.round(memoryUsage.external / 1024 / 1024) + 'MB',
      rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB'
    });
  }

  /**
   * Get current memory statistics
   */
  getMemoryStats() {
    const memoryUsage = process.memoryUsage();
    return {
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      external: memoryUsage.external,
      rss: memoryUsage.rss,
      heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      memoryUtilization: Math.round(memoryUsage.heapUsed / memoryUsage.heapTotal * 100)
    };
  }

  /**
   * Stop memory monitoring
   */
  stop() {
    if (this.gcInterval) {
      clearInterval(this.gcInterval);
      this.gcInterval = null;
    }
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = null;
    }
    console.log('🛑 Memory optimization service stopped');
  }

  /**
   * Manual memory cleanup trigger
   */
  manualCleanup() {
    console.log('🧹 Manual memory cleanup triggered');
    this.performCleanup();
    return this.getMemoryStats();
  }

  /**
   * Optimize MCP server memory usage
   */
  optimizeMCPServers() {
    // This can be called periodically to optimize MCP server memory
    console.log('🔧 Optimizing MCP server memory usage');
    
    // Perform cleanup
    this.performLightCleanup();
    
    return this.getMemoryStats();
  }
}

export const memoryOptimizationService = new MemoryOptimizationService();