import { Router } from 'express';
import { enhancedChatService } from '../services/enhancedChatService';
import { z } from 'zod';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

const router = Router();

// Schema for chat completion requests
const chatCompletionSchema = z.object({
  model: z.string().default('openai/gpt-4o'),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string()
  })).optional(),
  message: z.string().optional(),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(1).max(8000).default(4000),
  systemPrompt: z.string().optional(),
  mcpEnabled: z.boolean().default(false),
  realTimeData: z.boolean().default(false),
  dataContext: z.record(z.any()).optional(),
  enableAdvancedReasoning: z.boolean().default(false),
  sessionId: z.string().optional(),
  sourceInstance: z.enum(['main', 'floating']).default('main')
});

// Enhanced chat completions endpoint (non-streaming)
router.post('/completions', async (req: any, res) => {
  try {
    const validatedRequest = chatCompletionSchema.parse(req.body);
    const userId = req.user?.id || 'demo-user';

    // Extract message from either 'message' field or last message in 'messages' array
    let messageContent = validatedRequest.message;
    if (!messageContent && validatedRequest.messages?.length) {
      const lastMessage = validatedRequest.messages[validatedRequest.messages.length - 1];
      if (lastMessage.role === 'user') {
        messageContent = lastMessage.content;
      }
    }

    if (!messageContent) {
      return res.status(400).json({
        error: 'No message content provided',
        details: 'Either "message" field or user message in "messages" array is required'
      });
    }

    const result = await enhancedChatService.processMessage({
      ...validatedRequest,
      message: messageContent,
      streaming: false
    }, userId);

    if (!result.success) {
      return res.status(500).json({
        error: 'Failed to process message',
        content: result.content,
        metadata: result.metadata
      });
    }

    // Return in OpenAI-compatible format
    res.json({
      id: `chatcmpl-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: result.model,
      choices: [{
        index: 0,
        message: {
          role: result.role,
          content: result.content
        },
        finish_reason: 'stop'
      }],
      usage: {
        prompt_tokens: result.metadata.tokens || 0,
        completion_tokens: result.content.length,
        total_tokens: (result.metadata.tokens || 0) + result.content.length
      },
      metadata: result.metadata
    });

  } catch (error) {
    console.error('Enhanced chat completions error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      fallback: true
    });
  }
});

// Enhanced streaming chat endpoint
router.post('/stream', async (req: any, res) => {
  try {
    const validatedRequest = chatCompletionSchema.parse(req.body);
    const userId = req.user?.id || 'demo-user';

    // Extract message content
    let messageContent = validatedRequest.message;
    if (!messageContent && validatedRequest.messages?.length) {
      const lastMessage = validatedRequest.messages[validatedRequest.messages.length - 1];
      if (lastMessage.role === 'user') {
        messageContent = lastMessage.content;
      }
    }

    if (!messageContent) {
      return res.status(400).json({
        error: 'No message content provided'
      });
    }

    // Set headers for server-sent events
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

    // Start streaming
    const streamGenerator = enhancedChatService.processStreamingMessage({
      ...validatedRequest,
      message: messageContent,
      streaming: true
    }, userId);

    try {
      for await (const chunk of streamGenerator) {
        const data = JSON.stringify({
          content: chunk.content,
          done: chunk.done,
          sessionId: chunk.sessionId,
          model: chunk.model,
          metadata: chunk.metadata
        });

        res.write(`data: ${data}\n\n`);

        if (chunk.done) {
          res.write('data: [DONE]\n\n');
          break;
        }
      }
    } catch (streamError) {
      console.error('Streaming error:', streamError);
      res.write(`data: ${JSON.stringify({
        error: streamError instanceof Error ? streamError.message : 'Streaming error',
        done: true
      })}\n\n`);
    }

    res.end();

  } catch (error) {
    console.error('Enhanced streaming error:', error);
    res.status(500).json({
      error: 'Streaming initialization failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get available models
router.get('/models', async (req, res) => {
  try {
    const models = enhancedChatService.getAvailableModels();
    res.json({
      models,
      count: models.length,
      available: models.filter(m => m.available).length
    });
  } catch (error) {
    console.error('Models endpoint error:', error);
    res.status(500).json({
      error: 'Failed to fetch models',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const health = await enhancedChatService.healthCheck();
    res.json({
      status: 'healthy',
      services: health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Chat session management
router.post('/sessions', async (req: any, res) => {
  try {
    const { title } = req.body;
    const userId = req.user?.id || 'demo-user';
    
    // This would create a new session - for now return a generated ID
    const sessionId = `bristol-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    res.json({
      sessionId,
      title: title || 'Bristol A.I. Elite Session',
      userId,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Session creation error:', error);
    res.status(500).json({
      error: 'Failed to create session',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Unified message endpoint (handles both floating widget and main chat)
router.post('/message', async (req: any, res) => {
  try {
    const { message, sessionId, model, sourceInstance, ...options } = req.body;
    const userId = req.user?.id || 'demo-user';

    if (!message) {
      return res.status(400).json({
        error: 'Message is required'
      });
    }

    const result = await enhancedChatService.processMessage({
      message,
      sessionId,
      model: model || 'openai/gpt-4o',
      sourceInstance: sourceInstance || 'main',
      streaming: false,
      ...options
    }, userId);

    // Return in multiple formats for compatibility
    res.json({
      // Bristol format
      text: result.content,
      message: result.content,
      content: result.content,
      
      // OpenAI format
      choices: [{
        message: {
          role: result.role,
          content: result.content
        }
      }],
      
      // Metadata
      sessionId: result.sessionId,
      model: result.model,
      metadata: result.metadata,
      success: result.success
    });

  } catch (error) {
    console.error('Unified message endpoint error:', error);
    res.status(500).json({
      error: 'Failed to process message',
      details: error instanceof Error ? error.message : 'Unknown error',
      text: 'I encountered an error processing your request. Please try again.',
      message: 'I encountered an error processing your request. Please try again.',
      content: 'I encountered an error processing your request. Please try again.'
    });
  }
});

export default router;