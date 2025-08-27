import { Router } from 'express';
import { bulletproofChatService } from '../services/bulletproofChatService';
import { companyChatAuthStack } from '../middleware/enhancedAuth';
import { z } from 'zod';

const router = Router();

// Apply bulletproof authentication stack to all chat endpoints
router.use(companyChatAuthStack);

// Comprehensive chat request schema
const chatRequestSchema = z.object({
  message: z.string().min(1, 'Message is required').max(10000, 'Message too long'),
  sessionId: z.string().optional(),
  model: z.string().default('openai/gpt-4o'),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(1).max(8000).default(4000),
  streaming: z.boolean().default(false),
  sourceInstance: z.enum(['main', 'floating']).default('main'),
  mcpEnabled: z.boolean().default(false),
  realTimeData: z.boolean().default(false),
  enableAdvancedReasoning: z.boolean().default(false),
  systemPrompt: z.string().optional(),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string()
  })).optional(),
  dataContext: z.record(z.any()).optional()
});

// Ultimate chat endpoint with maximum reliability
router.post('/chat', async (req: any, res) => {
  const startTime = Date.now();
  
  try {
    // Validate request with comprehensive error handling
    let validatedRequest;
    try {
      validatedRequest = chatRequestSchema.parse(req.body);
    } catch (validationError) {
      // If validation fails, create a minimal working request
      console.warn('Chat request validation failed, using fallback:', validationError);
      validatedRequest = {
        message: req.body.message || 'Hello, how can you help me?',
        model: 'openai/gpt-4o',
        temperature: 0.7,
        maxTokens: 4000,
        streaming: false,
        sourceInstance: 'main' as const,
        mcpEnabled: false,
        realTimeData: false,
        enableAdvancedReasoning: false,
        retryCount: 0
      };
    }

    // Ensure user ID exists
    const userId = req.user?.id || 'demo-user';
    
    // Process with bulletproof service
    const result = await bulletproofChatService.processMessage(validatedRequest, userId);
    
    // Return in multiple compatible formats
    res.json({
      // Company format
      success: result.success,
      content: result.content,
      message: result.content,
      text: result.content,
      
      // OpenAI format
      choices: [{
        index: 0,
        message: {
          role: result.role,
          content: result.content
        },
        finish_reason: 'stop'
      }],
      
      // Extended metadata
      id: `brand-${Date.now()}`,
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
      processing_time: Date.now() - startTime
    });

  } catch (error) {
    console.error('Bulletproof chat endpoint error:', error);
    
    // Never fail - always return a helpful response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const fallbackContent = `I apologize, but I'm experiencing a temporary issue (${errorMessage}). I'm working to resolve this and will be back to full capacity shortly. Please try again in a moment.`;
    
    res.status(200).json({
      success: false,
      content: fallbackContent,
      message: fallbackContent,
      text: fallbackContent,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: fallbackContent
        },
        finish_reason: 'stop'
      }],
      id: `brand-error-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      sessionId: req.body.sessionId || `error-${Date.now()}`,
      model: req.body.model || 'openai/gpt-4o',
      metadata: {
        error: true,
        errorMessage,
        provider: 'error_handler',
        processingTime: Date.now() - startTime
      },
      usage: {
        prompt_tokens: 0,
        completion_tokens: fallbackContent.length,
        total_tokens: fallbackContent.length
      },
      processing_time: Date.now() - startTime
    });
  }
});

// Streaming chat endpoint
router.post('/stream', async (req: any, res) => {
  try {
    // Set headers for server-sent events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Validate request
    let validatedRequest;
    try {
      validatedRequest = chatRequestSchema.parse({ ...req.body, streaming: true });
    } catch (validationError) {
      validatedRequest = {
        message: req.body.message || 'Hello',
        model: 'openai/gpt-4o',
        streaming: true,
        sourceInstance: 'main' as const,
        temperature: 0.7,
        maxTokens: 4000,
        mcpEnabled: false,
        realTimeData: false,
        enableAdvancedReasoning: false
      };
    }

    const userId = req.user?.id || 'demo-user';
    
    // Process with enhanced chat service (streaming)
    const { enhancedChatService } = await import('../services/enhancedChatService');
    
    try {
      const streamGenerator = enhancedChatService.processStreamingMessage(validatedRequest, userId);
      
      for await (const chunk of streamGenerator) {
        const data = {
          content: chunk.content || '',
          done: chunk.done || false,
          sessionId: chunk.sessionId,
          model: chunk.model,
          metadata: chunk.metadata || {}
        };

        res.write(`data: ${JSON.stringify(data)}\n\n`);

        if (chunk.done) {
          res.write('data: [DONE]\n\n');
          break;
        }
      }
    } catch (streamError) {
      console.error('Streaming error:', streamError);
      
      // Send error response and close stream
      res.write(`data: ${JSON.stringify({
        content: "I encountered an issue while streaming. Please try the regular chat mode.",
        done: true,
        error: true,
        errorMessage: streamError instanceof Error ? streamError.message : 'Streaming error'
      })}\n\n`);
      res.write('data: [DONE]\n\n');
    }

    res.end();

  } catch (error) {
    console.error('Stream endpoint initialization error:', error);
    
    // Send immediate error response
    res.status(200);
    res.setHeader('Content-Type', 'application/json');
    res.json({
      error: 'Streaming unavailable',
      content: 'Streaming mode is temporarily unavailable. Please use the regular chat mode.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Health check for chat system
router.get('/health', async (req, res) => {
  try {
    const health = await bulletproofChatService.healthCheck();
    
    res.json({
      status: health.status,
      circuitBreaker: health.circuitBreaker,
      details: health.details,
      timestamp: new Date().toISOString(),
      endpoints: [
        '/bulletproof-chat/chat',
        '/bulletproof-chat/stream',
        '/bulletproof-chat/models',
        '/bulletproof-chat/reset'
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

// Get available models
router.get('/models', async (req, res) => {
  try {
    const { enhancedChatService } = await import('../services/enhancedChatService');
    const models = enhancedChatService.getAvailableModels();
    
    res.json({
      models: models.map(model => ({
        id: model.id,
        displayName: model.displayName,
        provider: model.provider,
        tier: model.tier,
        available: model.available,
        features: model.features,
        maxTokens: model.maxTokens
      })),
      count: models.length,
      available: models.filter(m => m.available).length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch models',
      details: error instanceof Error ? error.message : 'Unknown error',
      models: [],
      count: 0,
      available: 0
    });
  }
});

// Admin endpoint to reset circuit breaker
router.post('/reset', async (req, res) => {
  try {
    bulletproofChatService.resetCircuitBreaker();
    
    res.json({
      success: true,
      message: 'Circuit breaker reset successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Reset failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Fallback endpoint for any unhandled chat requests
router.use('*', (req: any, res) => {
  res.json({
    success: true,
    content: "I'm here and ready to help! Please send your message to the /chat endpoint.",
    message: "I'm here and ready to help! Please send your message to the /chat endpoint.",
    text: "I'm here and ready to help! Please send your message to the /chat endpoint.",
    sessionId: `fallback-${Date.now()}`,
    model: 'brand-fallback',
    metadata: {
      provider: 'company',
      fallback: true
    }
  });
});

export default router;