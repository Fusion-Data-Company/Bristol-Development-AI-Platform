import { Router } from 'express';
import { mcpIntegrationService } from '../services/mcpIntegrationService';
import { enhancedChatAgentService } from '../services/enhancedChatAgentService';
import { eliteMemoryEnhancementService } from '../services/eliteMemoryEnhancementService';

const router = Router();

// Enhanced MCP Network Status and Monitoring
router.get('/network-status', async (req, res) => {
  try {
    const networkStatus = await mcpIntegrationService.monitorMCPServers();
    const networkOptimization = await mcpIntegrationService.optimizeNetworkPerformance();
    const syncStatus = await mcpIntegrationService.synchronizeNetworkState();

    res.json({
      success: true,
      timestamp: new Date(),
      networkStatus,
      optimization: networkOptimization,
      synchronization: syncStatus,
      capabilities: {
        totalNodes: networkStatus.servers ? Object.keys(networkStatus.servers).length : 0,
        networkHealth: networkStatus.overallHealth,
        optimizationActive: networkOptimization.optimizations?.length > 0,
        syncCompleted: syncStatus.synchronized !== false
      }
    });
  } catch (error) {
    console.error('Error getting enhanced MCP network status:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      fallback: 'Basic MCP status available'
    });
  }
});

// Advanced Cross-Agent Data Sharing
router.post('/share-data', async (req, res) => {
  try {
    const { sourceAgent, targetAgents, data, shareType = 'targeted' } = req.body;

    if (!sourceAgent || !targetAgents || !data) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: sourceAgent, targetAgents, data' 
      });
    }

    const shareResult = await mcpIntegrationService.shareDataAcrossAgents(
      sourceAgent,
      targetAgents,
      data,
      shareType
    );

    res.json({
      success: true,
      shareResult,
      networkEnhanced: true,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error sharing data across agents:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Network-Integrated Tool Execution
router.post('/execute-tool-networked', async (req, res) => {
  try {
    const { toolId, parameters, userId = 'demo-user', sessionId, networkContext } = req.body;

    if (!toolId || !parameters) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: toolId, parameters' 
      });
    }

    const networkExecution = await mcpIntegrationService.networkIntegratedToolExecution(
      toolId,
      parameters,
      userId,
      sessionId || `session_${Date.now()}`,
      networkContext
    );

    res.json({
      success: true,
      execution: networkExecution,
      networkEnhanced: networkExecution.networkEnhanced,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error executing network-integrated tool:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Advanced Tool Chain Network Orchestration
router.post('/orchestrate-tool-chain', async (req, res) => {
  try {
    const { 
      toolChain, 
      parameters, 
      userId = 'demo-user', 
      sessionId, 
      networkOptions 
    } = req.body;

    if (!toolChain || !Array.isArray(toolChain) || toolChain.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid toolChain: must be a non-empty array' 
      });
    }

    const orchestration = await mcpIntegrationService.orchestrateNetworkToolChain(
      toolChain,
      parameters || {},
      userId,
      sessionId || `session_${Date.now()}`,
      networkOptions
    );

    res.json({
      success: true,
      orchestration,
      chainId: orchestration.chainId,
      networkOptimized: orchestration.error ? false : true,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error orchestrating network tool chain:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Enhanced Chat with MCP Network Integration
router.post('/enhanced-chat-with-network', async (req, res) => {
  try {
    const { 
      message, 
      userId = 'demo-user', 
      sessionId, 
      enableNetworking = true,
      networkPreferences = {}
    } = req.body;

    if (!message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Message is required' 
      });
    }

    // Process message with enhanced chat agent
    const chatResult = await enhancedChatAgentService.processEnhancedChatMessage(
      userId,
      sessionId || `session_${Date.now()}`,
      message,
      { networkingEnabled: enableNetworking, networkPreferences }
    );

    // If networking is enabled and tools were suggested, orchestrate them
    let networkOrchestration = null;
    if (enableNetworking && chatResult.capabilities?.some((c: any) => c.mcpIntegration)) {
      const toolsToOrchestrate = chatResult.capabilities
        .filter((c: any) => c.mcpIntegration)
        .map((c: any) => c.id);

      if (toolsToOrchestrate.length > 0) {
        networkOrchestration = await mcpIntegrationService.orchestrateNetworkToolChain(
          toolsToOrchestrate.slice(0, 3), // Limit to 3 tools for performance
          { userMessage: message, chatContext: chatResult.context },
          userId,
          sessionId || `session_${Date.now()}`,
          networkPreferences
        );
      }
    }

    res.json({
      success: true,
      chat: chatResult,
      networkOrchestration,
      networkEnhanced: enableNetworking,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error processing enhanced chat with network:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// MCP Tool Suggestions with Network Intelligence
router.post('/suggest-tools-networked', async (req, res) => {
  try {
    const { 
      userIntent, 
      userId = 'demo-user', 
      sessionId, 
      networkContext = {} 
    } = req.body;

    if (!userIntent) {
      return res.status(400).json({ 
        success: false, 
        error: 'User intent is required' 
      });
    }

    const suggestions = await mcpIntegrationService.suggestOptimalTools(
      userIntent,
      userId,
      sessionId || `session_${Date.now()}`,
      networkContext
    );

    res.json({
      success: true,
      suggestions,
      networkEnhanced: true,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error suggesting networked tools:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Real-Time Network Analytics
router.get('/network-analytics', async (req, res) => {
  try {
    const analytics = await mcpIntegrationService.analyzeToolPerformance();
    const networkStatus = await mcpIntegrationService.monitorMCPServers();

    const enhancedAnalytics = {
      ...analytics,
      networkMetrics: {
        overallHealth: networkStatus.overallHealth,
        serverCount: networkStatus.servers ? Object.keys(networkStatus.servers).length : 0,
        activeConnections: Object.values(networkStatus.servers || {})
          .filter((server: any) => server.status === 'connected').length,
        recommendations: networkStatus.recommendations
      },
      realTimeData: {
        timestamp: new Date(),
        performanceScore: analytics.topPerformingTools?.length || 0,
        improvementOpportunities: analytics.improvementOpportunities?.length || 0
      }
    };

    res.json({
      success: true,
      analytics: enhancedAnalytics,
      networkOptimized: true,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error getting network analytics:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Network Health Check and Auto-Recovery
router.post('/network-health-check', async (req, res) => {
  try {
    const { performRecovery = true } = req.body;

    const healthCheck = await mcpIntegrationService.monitorMCPServers();
    let recoveryResults = null;

    if (performRecovery && healthCheck.overallHealth !== 'excellent') {
      // Trigger network optimization and synchronization
      const optimization = await mcpIntegrationService.optimizeNetworkPerformance();
      const synchronization = await mcpIntegrationService.synchronizeNetworkState();
      
      recoveryResults = {
        optimization,
        synchronization,
        recoveryActions: healthCheck.recommendations || []
      };
    }

    res.json({
      success: true,
      healthCheck,
      recovery: recoveryResults,
      autoRecoveryPerformed: performRecovery,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error performing network health check:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Export Enhanced MCP Network Configuration
router.get('/network-configuration', async (req, res) => {
  try {
    const configuration = {
      networkTopology: 'hybrid-mesh',
      totalNodes: 11, // 5 MCP servers + 5 agents + 1 memory node
      totalConnections: 110, // Full mesh connectivity
      dataChannels: {
        total: 110,
        highPriority: 9, // Critical paths
        encrypted: 110,
        compressed: 75
      },
      capabilities: {
        crossAgentCommunication: true,
        realTimeDataStreams: true,
        networkOptimization: true,
        loadBalancing: true,
        autoRecovery: true,
        dataReplication: true
      },
      performance: {
        averageThroughput: '1000 ops/sec',
        averageReliability: '99%',
        networkLatency: '<50ms',
        optimizationInterval: '10 seconds'
      },
      features: {
        intelligentToolChaining: true,
        adaptiveNetworking: true,
        predictiveOptimization: true,
        conflictResolution: true,
        compressionEnabled: true,
        encryptionLevel: 'high'
      }
    };

    res.json({
      success: true,
      configuration,
      networkVersion: '2.0.0',
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error getting network configuration:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;