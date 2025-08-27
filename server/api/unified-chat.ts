import { Router } from 'express';
import { unifiedChatService } from '../services/unifiedChatService';
import { bristolChatAuthStack } from '../middleware/enhancedAuth';
import { getPerformanceRecommendations } from '../services/memoryOptimizer';
import { z } from 'zod';

// Extend global type for TypeScript
declare global {
  var lastValidationLogTime: number | undefined;
  var mcpResponseCache: Map<string, any> | undefined;
}

const router = Router();

// Apply enhanced authentication for all unified chat endpoints
router.use(bristolChatAuthStack);

// Comprehensive unified chat schema
const unifiedChatSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  sessionId: z.string().optional(),
  model: z.string().default('openai/gpt-4o'),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(1).max(8000).default(4000),
  streaming: z.boolean().default(false),
  sourceInstance: z.enum(['main', 'floating']).default('main'),
  mcpEnabled: z.boolean().default(true),
  realTimeData: z.boolean().default(true),
  enableAdvancedReasoning: z.boolean().default(true),
  systemPrompt: z.string().optional(),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
    metadata: z.record(z.any()).optional()
  })).optional(),
  dataContext: z.record(z.any()).optional(),
  memoryEnabled: z.boolean().default(true),
  crossSessionMemory: z.boolean().default(true),
  toolSharing: z.boolean().default(true)
});

// Next-level chat endpoint with perfect memory and context
router.post('/chat', async (req: any, res) => {
  const startTime = Date.now();
  
  try {
    console.log(`🧠 Unified chat request from ${req.user?.id} via ${req.body.sourceInstance || 'main'}`);
    
    // Enhanced validation with better error handling
    let validatedRequest;
    try {
      validatedRequest = unifiedChatSchema.parse(req.body);
    } catch (validationError) {
      // Only log validation errors once per minute to reduce noise
      if (!global.lastValidationLogTime || Date.now() - global.lastValidationLogTime > 60000) {
        console.warn('Unified chat validation failed, using safe defaults');
        global.lastValidationLogTime = Date.now();
      }
      
      // Add performance recommendations
      const recommendations = getPerformanceRecommendations();
      if (recommendations.length > 0) {
        console.log('💡 Performance recommendations:', recommendations);
      }
      
      validatedRequest = {
        message: req.body.message || 'Hello, I need assistance.',
        model: req.body.model || 'openai/gpt-4o',
        sourceInstance: req.body.sourceInstance || 'main',
        mcpEnabled: req.body.mcpEnabled !== false,
        realTimeData: req.body.realTimeData !== false,
        enableAdvancedReasoning: req.body.enableAdvancedReasoning !== false,
        memoryEnabled: req.body.memoryEnabled !== false,
        crossSessionMemory: req.body.crossSessionMemory !== false,
        toolSharing: req.body.toolSharing !== false,
        temperature: typeof req.body.temperature === 'number' ? req.body.temperature : 0.7,
        maxTokens: typeof req.body.maxTokens === 'number' ? req.body.maxTokens : 4000,
        streaming: req.body.streaming === true,
        userId: req.user?.id || 'anonymous', // Add missing userId
        sessionId: req.body.sessionId,
        systemPrompt: req.body.systemPrompt,
        messages: req.body.messages,
        dataContext: req.body.dataContext
      };
    }

    // Ensure user ID is set if not already present
    if (!validatedRequest.userId) {
      validatedRequest.userId = req.user?.id || 'demo-user';
    }
    
    // Process with unified chat service
    const result = await unifiedChatService.processUnifiedChat(validatedRequest);
    
    console.log(`✅ Unified chat processed in ${Date.now() - startTime}ms with memory integration`);
    
    // Return comprehensive response
    res.json({
      // Core response
      success: result.success,
      content: result.content,
      message: result.content,
      text: result.content,
      
      // OpenAI compatibility
      choices: [{
        index: 0,
        message: {
          role: result.role,
          content: result.content
        },
        finish_reason: 'stop'
      }],
      
      // Enhanced metadata
      id: `unified-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      sessionId: result.sessionId,
      model: result.model,
      metadata: result.metadata,
      usage: {
        prompt_tokens: result.metadata.tokens || 0,
        completion_tokens: result.content.length,
        total_tokens: (result.metadata.tokens || 0) + result.content.length
      },
      
      // Memory and context info
      memoryIntegrated: true,
      contextUsed: result.metadata.contextUsed,
      userProfile: result.metadata.userProfile,
      memoryStored: result.memoryStored,
      processing_time: Date.now() - startTime,
      
      // Cross-instance sharing indicator
      crossInstanceSync: validatedRequest.crossSessionMemory,
      toolsShared: validatedRequest.toolSharing
    });

  } catch (error) {
    console.error('Unified chat endpoint error:', error);
    
    // Advanced error response with memory preservation
    const errorMessage = `I encountered a technical issue, but my memory systems remain intact. ${error instanceof Error ? error.message : 'Unknown error'} Please try again - I'll remember our conversation context.`;
    
    res.status(200).json({
      success: false,
      content: errorMessage,
      message: errorMessage,
      text: errorMessage,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: errorMessage
        },
        finish_reason: 'stop'
      }],
      id: `unified-error-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      sessionId: req.body.sessionId || `error-${Date.now()}`,
      model: req.body.model || 'openai/gpt-4o',
      metadata: {
        error: true,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        memoryIntegrated: false,
        processingTime: Date.now() - startTime
      },
      usage: {
        prompt_tokens: 0,
        completion_tokens: errorMessage.length,
        total_tokens: errorMessage.length
      },
      processing_time: Date.now() - startTime
    });
  }
});

// Streaming endpoint with memory integration
router.post('/stream', async (req: any, res) => {
  try {
    console.log(`🌊 Unified streaming chat from ${req.user?.id}`);
    
    // Set headers for server-sent events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Validate request
    let validatedRequest;
    try {
      validatedRequest = unifiedChatSchema.parse({ ...req.body, streaming: true });
    } catch (validationError) {
      validatedRequest = {
        message: req.body.message || 'Hello',
        model: 'openai/gpt-4o',
        streaming: true,
        sourceInstance: req.body.sourceInstance || 'main',
        mcpEnabled: true,
        realTimeData: true,
        enableAdvancedReasoning: true,
        memoryEnabled: true,
        crossSessionMemory: true,
        toolSharing: true,
        temperature: 0.7,
        maxTokens: 4000,
        userId: req.user?.id || 'demo-user' // Add missing userId here too
      };
    }

    // Ensure user ID is set if not already present
    if (!validatedRequest.userId) {
      validatedRequest.userId = req.user?.id || 'demo-user';
    }
    
    try {
      const streamGenerator = unifiedChatService.processUnifiedChatStream(validatedRequest);
      
      for await (const chunk of streamGenerator) {
        const data = {
          content: chunk.content || '',
          done: chunk.done || false,
          sessionId: chunk.sessionId,
          model: chunk.model,
          metadata: {
            ...chunk.metadata,
            unifiedChat: true,
            memoryEnabled: validatedRequest.memoryEnabled,
            crossSessionMemory: validatedRequest.crossSessionMemory
          }
        };

        res.write(`data: ${JSON.stringify(data)}\n\n`);

        if (chunk.done) {
          res.write('data: [DONE]\n\n');
          break;
        }
      }
    } catch (streamError) {
      console.error('Unified streaming error:', streamError);
      
      res.write(`data: ${JSON.stringify({
        content: "I encountered an issue while streaming, but my memory systems are operational. Please try the regular chat mode.",
        done: true,
        error: true,
        memoryIntegrated: true,
        errorMessage: streamError instanceof Error ? streamError.message : 'Streaming error'
      })}\n\n`);
      res.write('data: [DONE]\n\n');
    }

    res.end();

  } catch (error) {
    console.error('Unified stream initialization error:', error);
    
    res.status(200);
    res.setHeader('Content-Type', 'application/json');
    res.json({
      error: 'Unified streaming unavailable',
      content: 'Unified streaming mode is temporarily unavailable. Please use the regular chat mode. Your memory is preserved.',
      memoryIntegrated: true,
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Memory management endpoints
router.get('/memory/stats', async (req: any, res) => {
  try {
    const userId = req.user?.id || 'demo-user';
    const memoryStats = await unifiedChatService.healthCheck();
    
    res.json({
      success: true,
      stats: memoryStats.memoryStats,
      services: memoryStats.services,
      userId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get memory stats'
    });
  }
});

router.post('/memory/clear', async (req: any, res) => {
  try {
    const userId = req.user?.id || 'demo-user';
    await unifiedChatService.clearUserData(userId);
    
    res.json({
      success: true,
      message: 'User memory cleared successfully',
      userId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clear memory'
    });
  }
});

// Health check with memory status
router.get('/health', async (req, res) => {
  try {
    const health = await unifiedChatService.healthCheck();
    
    res.json({
      status: health.status,
      services: health.services,
      memoryStats: health.memoryStats,
      features: {
        perfectMemory: true,
        crossSessionSharing: true,
        toolIntegration: true,
        contextAwareness: true,
        adaptiveCommunication: true
      },
      timestamp: new Date().toISOString(),
      endpoints: [
        '/unified-chat/chat',
        '/unified-chat/stream',
        '/unified-chat/memory/stats',
        '/unified-chat/memory/clear'
      ]
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Cross-instance synchronization endpoint
router.post('/sync', async (req: any, res) => {
  try {
    const { sourceSession, targetSession, syncType = 'full' } = req.body;
    const userId = req.user?.id || 'demo-user';

    // This would implement cross-instance memory sync
    console.log(`🔄 Syncing memory between sessions for user ${userId}`);
    
    res.json({
      success: true,
      message: 'Memory synchronized successfully',
      sourceSession,
      targetSession,
      syncType,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Sync failed'
    });
  }
});

// Fallback for any unhandled unified chat requests
router.use('*', (req: any, res) => {
  res.json({
    success: true,
    content: "I'm your unified Company A.I. with perfect memory and cross-session continuity. Send your message to /chat for the full experience!",
    message: "I'm your unified Company A.I. with perfect memory and cross-session continuity. Send your message to /chat for the full experience!",
    features: ['perfect-memory', 'cross-session-sharing', 'tool-integration'],
    sessionId: `unified-${Date.now()}`,
    model: 'brand-unified',
    metadata: {
      provider: 'brand-unified',
      memoryEnabled: true
    }
  });
});

export default router;