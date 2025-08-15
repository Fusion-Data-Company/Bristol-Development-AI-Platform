import { enhancedChatService } from './enhancedChatService';
import { storage } from '../storage';

interface HealthStatus {
  overall: 'healthy' | 'degraded' | 'critical';
  services: {
    chatService: { status: string; details: any };
    database: { status: string; details: any };
    apiKeys: { status: string; details: any };
    models: { status: string; details: any };
  };
  lastCheck: string;
  recommendations: string[];
}

class ChatHealthMonitor {
  private lastHealthCheck: HealthStatus | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  start() {
    // Initial health check
    this.performHealthCheck();
    
    // Schedule regular health checks every 5 minutes
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 5 * 60 * 1000);
  }

  stop() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  async performHealthCheck(): Promise<HealthStatus> {
    const recommendations: string[] = [];
    let overallStatus: 'healthy' | 'degraded' | 'critical' = 'healthy';

    // Check chat service
    const chatServiceHealth = await this.checkChatService();
    if (chatServiceHealth.status !== 'healthy') {
      overallStatus = 'degraded';
      recommendations.push('Chat service is experiencing issues');
    }

    // Check database connectivity
    const databaseHealth = await this.checkDatabase();
    if (databaseHealth.status !== 'healthy') {
      overallStatus = 'critical';
      recommendations.push('Database connectivity issues detected');
    }

    // Check API keys
    const apiKeysHealth = this.checkApiKeys();
    if (apiKeysHealth.status !== 'healthy') {
      overallStatus = 'degraded';
      recommendations.push('Some API keys are missing or invalid');
    }

    // Check available models
    const modelsHealth = await this.checkModels();
    if (modelsHealth.status !== 'healthy') {
      recommendations.push('Limited model availability detected');
    }

    const healthStatus: HealthStatus = {
      overall: overallStatus,
      services: {
        chatService: chatServiceHealth,
        database: databaseHealth,
        apiKeys: apiKeysHealth,
        models: modelsHealth
      },
      lastCheck: new Date().toISOString(),
      recommendations
    };

    this.lastHealthCheck = healthStatus;
    
    if (overallStatus !== 'healthy') {
      console.warn('🚨 Chat Health Warning:', {
        status: overallStatus,
        issues: recommendations
      });
    }

    return healthStatus;
  }

  private async checkChatService() {
    try {
      const health = await enhancedChatService.healthCheck();
      
      if (health.openaiDirect || health.openRouter) {
        return {
          status: 'healthy',
          details: {
            openaiDirect: health.openaiDirect,
            openRouter: health.openRouter,
            modelsAvailable: health.modelsAvailable
          }
        };
      } else {
        return {
          status: 'critical',
          details: { error: 'No chat providers available' }
        };
      }
    } catch (error) {
      return {
        status: 'critical',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  private async checkDatabase() {
    try {
      // Test database connection with a simple query
      const session = await storage.getChatSession('test-session-id');
      return {
        status: 'healthy',
        details: { connectionTest: 'passed', sessionExists: !!session }
      };
    } catch (error) {
      return {
        status: 'critical',
        details: { error: error instanceof Error ? error.message : 'Database connection failed' }
      };
    }
  }

  private checkApiKeys() {
    const keys = {
      openai: !!process.env.OPENAI_API_KEY,
      openrouter: !!process.env.OPENROUTER_API_KEY,
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      gemini: !!process.env.GEMINI_API_KEY,
      xai: !!process.env.XAI_API_KEY,
      perplexity: !!process.env.PERPLEXITY_API_KEY
    };

    const availableKeys = Object.values(keys).filter(Boolean).length;
    const totalKeys = Object.keys(keys).length;

    if (availableKeys >= 2) {
      return {
        status: 'healthy',
        details: { availableKeys, totalKeys, keys }
      };
    } else if (availableKeys >= 1) {
      return {
        status: 'degraded',
        details: { availableKeys, totalKeys, keys, message: 'Limited API key availability' }
      };
    } else {
      return {
        status: 'critical',
        details: { availableKeys, totalKeys, keys, message: 'No API keys available' }
      };
    }
  }

  private async checkModels() {
    try {
      const models = enhancedChatService.getAvailableModels();
      const availableModels = models.filter(m => m.available);
      
      if (availableModels.length >= 3) {
        return {
          status: 'healthy',
          details: { totalModels: models.length, availableModels: availableModels.length }
        };
      } else if (availableModels.length >= 1) {
        return {
          status: 'degraded',
          details: { totalModels: models.length, availableModels: availableModels.length }
        };
      } else {
        return {
          status: 'critical',
          details: { totalModels: models.length, availableModels: 0 }
        };
      }
    } catch (error) {
      return {
        status: 'critical',
        details: { error: error instanceof Error ? error.message : 'Model check failed' }
      };
    }
  }

  getLastHealthCheck(): HealthStatus | null {
    return this.lastHealthCheck;
  }

  // Test chat functionality end-to-end
  async testChatFunctionality(): Promise<{
    success: boolean;
    details: any;
    responseTime: number;
  }> {
    const startTime = Date.now();
    
    try {
      const testResult = await enhancedChatService.processMessage({
        message: 'Health check test',
        model: 'openai/gpt-4o',
        temperature: 0.1,
        maxTokens: 50,
        mcpEnabled: false,
        realTimeData: false,
        sourceInstance: 'main',
        streaming: false,
        enableAdvancedReasoning: false
      }, 'health-check-user');

      const responseTime = Date.now() - startTime;

      return {
        success: testResult.success,
        details: {
          model: testResult.model,
          contentLength: testResult.content.length,
          hasValidResponse: testResult.content.length > 10
        },
        responseTime
      };
    } catch (error) {
      return {
        success: false,
        details: { error: error instanceof Error ? error.message : 'Test failed' },
        responseTime: Date.now() - startTime
      };
    }
  }
}

export const chatHealthMonitor = new ChatHealthMonitor();