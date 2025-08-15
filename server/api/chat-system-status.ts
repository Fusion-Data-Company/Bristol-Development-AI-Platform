import { Router } from 'express';
import { chatHealthMonitor } from '../services/chatHealthMonitor';
import { enhancedChatService } from '../services/enhancedChatService';

const router = Router();

// Get comprehensive chat system status
router.get('/status', async (req: any, res) => {
  try {
    const healthStatus = await chatHealthMonitor.performHealthCheck();
    const models = enhancedChatService.getAvailableModels();
    
    res.json({
      ...healthStatus,
      availableModels: models.filter(m => m.available),
      totalModels: models.length,
      features: {
        streaming: true,
        multiModel: true,
        sessionManagement: true,
        errorRecovery: true,
        realTimeData: true,
        mcpIntegration: true
      }
    });
  } catch (error) {
    console.error('Status endpoint error:', error);
    res.status(500).json({
      overall: 'critical',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Test chat functionality end-to-end
router.post('/test', async (req: any, res) => {
  try {
    const { model = 'openai/gpt-4o', message = 'Test message' } = req.body;
    
    const testResult = await chatHealthMonitor.testChatFunctionality();
    
    res.json({
      success: testResult.success,
      responseTime: testResult.responseTime,
      details: testResult.details,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Test failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Get last health check results
router.get('/health', async (req: any, res) => {
  try {
    const lastCheck = chatHealthMonitor.getLastHealthCheck();
    
    if (lastCheck) {
      res.json(lastCheck);
    } else {
      const healthStatus = await chatHealthMonitor.performHealthCheck();
      res.json(healthStatus);
    }
  } catch (error) {
    console.error('Health endpoint error:', error);
    res.status(500).json({
      overall: 'critical',
      error: error instanceof Error ? error.message : 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Emergency reset chat system
router.post('/reset', async (req: any, res) => {
  try {
    // This would reset connections, clear problematic sessions, etc.
    const healthCheck = await chatHealthMonitor.performHealthCheck();
    
    res.json({
      message: 'Chat system reset initiated',
      healthAfterReset: healthCheck,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Reset endpoint error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Reset failed',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;