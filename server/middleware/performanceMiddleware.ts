import { Request, Response, NextFunction } from 'express';
import compression from 'compression';

// Memory monitoring and optimization
export class MemoryMonitor {
  private static instance: MemoryMonitor;
  private memoryThreshold = 500 * 1024 * 1024; // 500MB
  private checkInterval = 30000; // 30 seconds
  private isMonitoring = false;

  public static getInstance(): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor();
    }
    return MemoryMonitor.instance;
  }

  public startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    setInterval(() => {
      this.checkMemoryUsage();
    }, this.checkInterval);
  }

  private checkMemoryUsage() {
    const usage = process.memoryUsage();
    const heapUsed = usage.heapUsed;
    
    if (heapUsed > this.memoryThreshold) {
      console.warn(`[Bristol Memory Warning] High memory usage: ${Math.round(heapUsed / 1024 / 1024)}MB`);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        console.log('[Bristol Memory] Garbage collection triggered');
      }
      
      // Emit performance recommendations
      console.log('💡 Performance recommendations: [');
      console.log("  'High memory usage detected. Consider implementing memory optimization strategies.'");
      console.log(']');
    }
  }

  public getMemoryStats() {
    const usage = process.memoryUsage();
    return {
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024),
      rss: Math.round(usage.rss / 1024 / 1024)
    };
  }
}

// Response compression with intelligent content type detection
export const intelligentCompression = compression({
  threshold: 1024, // Only compress responses >= 1KB
  level: 6, // Balance between speed and compression ratio
  filter: (req, res) => {
    // Don't compress if the client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }

    // Use compression for specific content types
    const contentType = res.getHeader('content-type');
    if (!contentType || typeof contentType !== 'string') return false;

    const compressibleTypes = [
      'text/',
      'application/json',
      'application/javascript',
      'application/xml',
      'image/svg+xml',
      'text/css'
    ];

    return compressibleTypes.some(type => contentType.includes(type));
  }
});

// Request timing middleware
export const requestTiming = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime.bigint();
  
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds
    
    // Log slow requests
    if (duration > 1000) {
      console.warn(`[Bristol Performance] Slow request: ${req.method} ${req.path} took ${duration.toFixed(2)}ms`);
    }
    
    // Add timing header for monitoring
    res.setHeader('X-Response-Time', `${duration.toFixed(2)}ms`);
  });
  
  next();
};

// Circuit breaker pattern for external API calls
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime: number | null = null;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private failureThreshold = 5,
    private recoveryTimeout = 60000 // 1 minute
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (this.shouldAttemptReset()) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'open';
      console.warn(`[Bristol Circuit Breaker] Circuit opened after ${this.failures} failures`);
    }
  }

  private shouldAttemptReset(): boolean {
    return this.lastFailureTime !== null && 
           (Date.now() - this.lastFailureTime) >= this.recoveryTimeout;
  }

  getStatus() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    };
  }
}

// Response caching middleware for static data
export const responseCache = (duration = 300000) => { // 5 minutes default
  const cache = new Map<string, { data: any; timestamp: number; etag: string }>();
  
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    const key = req.originalUrl;
    const cached = cache.get(key);
    const now = Date.now();
    
    // Check if cached data is still valid
    if (cached && (now - cached.timestamp) < duration) {
      // Check ETag for conditional requests
      if (req.headers['if-none-match'] === cached.etag) {
        return res.status(304).end();
      }
      
      res.setHeader('ETag', cached.etag);
      res.setHeader('Cache-Control', `max-age=${Math.floor((duration - (now - cached.timestamp)) / 1000)}`);
      return res.json(cached.data);
    }
    
    // Override res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = function(data: any) {
      // Generate ETag
      const etag = `"${Date.now()}-${JSON.stringify(data).length}"`;
      
      // Cache the response
      cache.set(key, {
        data,
        timestamp: now,
        etag
      });
      
      // Clean old cache entries (simple LRU)
      if (cache.size > 100) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
      
      res.setHeader('ETag', etag);
      res.setHeader('Cache-Control', `max-age=${Math.floor(duration / 1000)}`);
      
      return originalJson(data);
    };
    
    next();
  };
};

// Initialize performance monitoring
export function initializePerformanceMonitoring() {
  const memoryMonitor = MemoryMonitor.getInstance();
  memoryMonitor.startMonitoring();
  
  // Log startup performance stats
  const stats = memoryMonitor.getMemoryStats();
  console.log(`[Bristol Performance] Startup memory usage: ${stats.heapUsed}MB heap, ${stats.rss}MB RSS`);
}