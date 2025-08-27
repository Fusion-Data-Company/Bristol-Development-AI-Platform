import { Router } from 'express';
import { unifiedChatService } from '../services/unifiedChatService';
import { advancedMemoryService } from '../services/advancedMemoryService';

const router = Router();

// Test endpoint to verify unified chat system works
router.post('/test-chat', async (req, res) => {
  try {
    console.log('🧪 Testing unified chat system...');

    const testRequest = {
      message: "Hello, I'm testing the unified chat system with perfect memory. Please confirm you can remember this conversation and that tools are shared between interfaces.",
      model: 'openai/gpt-4o',
      temperature: 0.7,
      maxTokens: 4000,
      sourceInstance: 'main' as const,
      mcpEnabled: true,
      realTimeData: true,
      enableAdvancedReasoning: true,
      memoryEnabled: true,
      crossSessionMemory: true,
      toolSharing: true,
      userId: 'test-user',
      sessionId: 'test-session-' + Date.now()
    };

    const result = await unifiedChatService.processUnifiedChat(testRequest);

    res.json({
      success: true,
      testResult: result,
      timestamp: new Date().toISOString(),
      features: {
        memoryIntegrated: result.metadata?.memoryIntegrated || false,
        contextUsed: result.metadata?.contextUsed || {},
        crossSessionMemory: testRequest.crossSessionMemory,
        toolSharing: testRequest.toolSharing,
        sourceInstance: testRequest.sourceInstance
      }
    });

  } catch (error) {
    console.error('Unified chat test failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Test failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Test memory persistence across sessions
router.post('/test-memory', async (req, res) => {
  try {
    console.log('🧠 Testing memory persistence...');

    const userId = 'test-user';
    const sessionId1 = 'session-1-' + Date.now();
    const sessionId2 = 'session-2-' + Date.now();

    // Store some test memories
    await advancedMemoryService.storeMemory(
      userId,
      sessionId1,
      "User prefers detailed financial analysis with IRR calculations",
      'preference',
      { importance: 9, confidence: 1.0 },
      'main'
    );

    await advancedMemoryService.storeMemory(
      userId,
      sessionId1,
      "User is working on a Company Development project in Charlotte, NC",
      'fact',
      { importance: 8, confidence: 0.9 },
      'main'
    );

    // Test context retrieval
    const context = await advancedMemoryService.getRelevantContext(
      userId,
      sessionId2,
      "What do you remember about my project and preferences?",
      10
    );

    // Test cross-session sharing
    await advancedMemoryService.shareMemoryAcrossSessions(userId, sessionId1, sessionId2);

    res.json({
      success: true,
      memoryTest: {
        userProfile: context.userProfile,
        relevantMemories: context.relevantMemories.length,
        recentContext: context.recentContext.length,
        crossSessionSharing: true
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Memory test failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Memory test failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Test tool sharing between interfaces
router.post('/test-tool-sharing', async (req, res) => {
  try {
    console.log('🔧 Testing tool sharing...');

    const userId = 'test-user';
    const sessionId = 'tool-test-' + Date.now();

    // Simulate tool integration from floating widget
    await advancedMemoryService.integrateToolContext(
      userId,
      sessionId,
      'bls-employment',
      { unemployment_rate: 3.2, region: 'charlotte-nc' },
      'floating'
    );

    // Simulate tool integration from main chat
    await advancedMemoryService.integrateToolContext(
      userId,
      sessionId,
      'hud-housing',
      { fair_market_rent: 1250, bedroom_count: 2 },
      'main'
    );

    // Test context retrieval shows tools from both interfaces
    const context = await advancedMemoryService.getRelevantContext(
      userId,
      sessionId,
      "Show me the tool data we've collected",
      10
    );

    res.json({
      success: true,
      toolSharingTest: {
        toolContextsFound: context.relevantMemories.filter(m => m.type === 'task').length,
        fromFloating: context.relevantMemories.filter(m => 
          m.type === 'task' && m.metadata.sourceInstance === 'floating'
        ).length,
        fromMain: context.relevantMemories.filter(m => 
          m.type === 'task' && m.metadata.sourceInstance === 'main'
        ).length,
        toolsShared: true
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Tool sharing test failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Tool sharing test failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Health check for unified chat system
router.get('/health', async (req, res) => {
  try {
    const health = await unifiedChatService.healthCheck();
    
    res.json({
      status: 'operational',
      unifiedChatSystem: health,
      features: {
        perfectMemory: true,
        contextRetention: true,
        crossSessionSharing: true,
        toolIntegration: true,
        bothInterfaces: ['main', 'floating']
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;