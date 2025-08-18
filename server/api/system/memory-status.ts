import { Router } from 'express';
import { memoryOptimizationService } from '../../services/memoryOptimizationService';

const router = Router();

/**
 * System Memory Status API
 * Provides real-time memory monitoring and optimization endpoints
 */

// Get current memory statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = memoryOptimizationService.getMemoryStats();
    const processUptime = process.uptime();
    
    res.json({
      memory: stats,
      system: {
        uptime: Math.round(processUptime),
        uptimeHours: Math.round(processUptime / 3600 * 10) / 10,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      },
      recommendations: getMemoryRecommendations(stats),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Memory stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve memory statistics' });
  }
});

// Manual memory cleanup endpoint
router.post('/cleanup', async (req, res) => {
  try {
    console.log('🧹 Manual memory cleanup requested via API');
    const beforeStats = memoryOptimizationService.getMemoryStats();
    const afterStats = memoryOptimizationService.manualCleanup();
    
    const saved = beforeStats.heapUsed - afterStats.heapUsed;
    
    res.json({
      success: true,
      cleanup: {
        before: beforeStats,
        after: afterStats,
        memorySaved: saved,
        memorySavedMB: Math.round(saved / 1024 / 1024 * 10) / 10
      },
      message: `Memory cleanup completed. Freed ${Math.round(saved / 1024 / 1024 * 10) / 10}MB`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Memory cleanup error:', error);
    res.status(500).json({ error: 'Memory cleanup failed' });
  }
});

// MCP server memory optimization
router.post('/optimize-mcp', async (req, res) => {
  try {
    console.log('🔧 MCP server memory optimization requested');
    const beforeStats = memoryOptimizationService.getMemoryStats();
    const afterStats = memoryOptimizationService.optimizeMCPServers();
    
    const saved = beforeStats.heapUsed - afterStats.heapUsed;
    
    res.json({
      success: true,
      optimization: {
        before: beforeStats,
        after: afterStats,
        memorySaved: saved,
        memorySavedMB: Math.round(saved / 1024 / 1024 * 10) / 10
      },
      message: 'MCP server memory optimization completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('MCP optimization error:', error);
    res.status(500).json({ error: 'MCP optimization failed' });
  }
});

// Memory health check
router.get('/health', async (req, res) => {
  try {
    const stats = memoryOptimizationService.getMemoryStats();
    const healthStatus = getMemoryHealthStatus(stats);
    
    res.json({
      status: healthStatus.status,
      level: healthStatus.level,
      memory: stats,
      recommendations: healthStatus.recommendations,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Memory health check error:', error);
    res.status(500).json({ error: 'Memory health check failed' });
  }
});

/**
 * Generate memory recommendations based on current usage
 */
function getMemoryRecommendations(stats: any): string[] {
  const recommendations = [];
  
  if (stats.memoryUtilization > 90) {
    recommendations.push('CRITICAL: Memory utilization above 90%. Consider restarting the application.');
    recommendations.push('Review memory-intensive operations and optimize data structures.');
  } else if (stats.memoryUtilization > 75) {
    recommendations.push('HIGH: Memory utilization above 75%. Monitor closely.');
    recommendations.push('Consider performing manual cleanup or garbage collection.');
  } else if (stats.memoryUtilization > 60) {
    recommendations.push('MODERATE: Memory utilization above 60%. Regular monitoring recommended.');
    recommendations.push('Consider optimizing MCP server configurations.');
  } else {
    recommendations.push('HEALTHY: Memory utilization is within normal ranges.');
  }
  
  if (stats.heapUsedMB > 800) {
    recommendations.push('Heap usage exceeding 800MB. Consider memory optimization strategies.');
  }
  
  return recommendations;
}

/**
 * Determine memory health status
 */
function getMemoryHealthStatus(stats: any) {
  let status = 'HEALTHY';
  let level = 'SUCCESS';
  let recommendations = [];
  
  if (stats.memoryUtilization > 90 || stats.heapUsedMB > 1000) {
    status = 'CRITICAL';
    level = 'DANGER';
    recommendations = [
      'Immediate action required',
      'Consider restarting the application',
      'Review memory-intensive operations'
    ];
  } else if (stats.memoryUtilization > 75 || stats.heapUsedMB > 750) {
    status = 'WARNING';
    level = 'WARNING';
    recommendations = [
      'Monitor memory usage closely',
      'Consider performing cleanup',
      'Optimize data processing'
    ];
  } else if (stats.memoryUtilization > 60 || stats.heapUsedMB > 500) {
    status = 'MODERATE';
    level = 'INFO';
    recommendations = [
      'Regular monitoring recommended',
      'Consider optimization opportunities'
    ];
  } else {
    recommendations = [
      'Memory usage is healthy',
      'Continue normal operations'
    ];
  }
  
  return { status, level, recommendations };
}

export default router;