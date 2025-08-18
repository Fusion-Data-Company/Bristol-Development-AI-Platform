import { Router } from 'express';
import { metricsCollector } from '../../src/lib/metrics';
import { randomUUID } from 'crypto';

const router = Router();

// Health check endpoint for deployment monitoring
router.get('/healthz', (req, res) => {
  const metrics = metricsCollector.getSystemMetrics();
  const startTime = Date.now();
  
  // Basic health response
  const health = {
    status: 'healthy',
    version: process.env.npm_package_version || '1.0.0',
    uptime: Math.round(metrics.uptime / 1000),
    timestamp: new Date().toISOString(),
    memory: {
      heap_mb: metrics.memory.heapUsed,
      rss_mb: metrics.memory.rss
    },
    environment: process.env.NODE_ENV || 'development',
    requestId: randomUUID()
  };
  
  res.status(200).json(health);
});

// Deeper health check with dependencies
router.get('/healthz/deep', async (req, res) => {
  const checks = {
    database: 'unknown',
    memory: 'unknown',
    startup: 'unknown'
  };
  
  let status = 200;
  
  try {
    // Check database connectivity
    const { storage } = await import('../storage');
    await storage.ping?.(); // If ping method exists
    checks.database = 'healthy';
  } catch (error) {
    checks.database = 'unhealthy';
    status = 503;
  }
  
  // Check memory usage
  const metrics = metricsCollector.getSystemMetrics();
  if (metrics.memory.heapUsed > 2000) { // > 2GB
    checks.memory = 'warning';
  } else if (metrics.memory.heapUsed > 4000) { // > 4GB
    checks.memory = 'critical';
    status = 503;
  } else {
    checks.memory = 'healthy';
  }
  
  // Check if system recently started (indicating crashes)
  if (metrics.uptime < 60000) { // Less than 1 minute uptime
    checks.startup = 'recent';
  } else {
    checks.startup = 'stable';
  }
  
  res.status(status).json({
    status: status === 200 ? 'healthy' : 'degraded',
    checks,
    uptime: Math.round(metrics.uptime / 1000),
    memory_mb: metrics.memory.heapUsed,
    timestamp: new Date().toISOString()
  });
});

export default router;