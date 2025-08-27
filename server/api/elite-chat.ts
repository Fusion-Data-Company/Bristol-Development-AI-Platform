import { Router } from 'express';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';

const router = Router();

// Initialize AI clients with error handling
const initializeClients = () => {
  const clients: any = {};

  // OpenAI client
  if (process.env.OPENAI_API_KEY) {
    clients.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  // OpenRouter client (using OpenAI SDK with custom base URL)
  if (process.env.OPENROUTER_API_KEY) {
    clients.openrouter = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': process.env.OPENROUTER_REFERER || 'https://yourcompany.com',
        'X-Title': 'Company Elite AI Chat'
      }
    });
  }

  // Anthropic client
  if (process.env.ANTHROPIC_API_KEY) {
    clients.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  // Google Gemini client
  if (process.env.GEMINI_API_KEY) {
    clients.google = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  }

  // xAI client (Grok) using OpenAI SDK with xAI base URL
  if (process.env.XAI_API_KEY) {
    clients.xai = new OpenAI({
      apiKey: process.env.XAI_API_KEY,
      baseURL: 'https://api.x.ai/v1',
    });
  }

  // Perplexity client
  if (process.env.PERPLEXITY_API_KEY) {
    clients.perplexity = new OpenAI({
      apiKey: process.env.PERPLEXITY_API_KEY,
      baseURL: 'https://api.perplexity.ai',
    });
  }

  return clients;
};

const clients = initializeClients();

// Elite Model Configuration
const ELITE_MODELS = {
  // OpenAI Models
  'openai/gpt-5': {
    provider: 'openai',
    model: 'gpt-5',
    name: 'GPT-5',
    description: 'OpenAI\'s most advanced model for coding and agentic tasks',
    contextLength: 400000,
    features: ['text', 'vision', 'function-calling', 'reasoning'],
    tier: 'premium'
  },
  'openai/gpt-4o': {
    provider: 'openai',
    model: 'gpt-4o',
    name: 'GPT-4o',
    description: 'Most capable GPT-4 model for complex tasks',
    contextLength: 128000,
    features: ['text', 'vision', 'function-calling'],
    tier: 'standard'
  },
  'openai/gpt-4o-mini': {
    provider: 'openai',
    model: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Faster, cost-effective model for simpler tasks',
    contextLength: 128000,
    features: ['text', 'vision', 'function-calling'],
    tier: 'standard'
  },

  // Anthropic Models (latest)
  'anthropic/claude-sonnet-4-20250514': {
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    description: 'Anthropic\'s newest and most capable model',
    contextLength: 200000,
    features: ['text', 'vision', 'analysis', 'reasoning'],
    tier: 'premium'
  },
  'anthropic/claude-3-7-sonnet-20250219': {
    provider: 'anthropic',
    model: 'claude-3-7-sonnet-20250219',
    name: 'Claude 3.7 Sonnet',
    description: 'Enhanced reasoning capabilities',
    contextLength: 200000,
    features: ['text', 'vision', 'analysis'],
    tier: 'premium'
  },
  'anthropic/claude-3-5-sonnet-20241022': {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    description: 'Balanced performance for most tasks',
    contextLength: 200000,
    features: ['text', 'vision', 'analysis'],
    tier: 'standard'
  },

  // Google Models
  'google/gemini-2.5-pro': {
    provider: 'google',
    model: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    description: 'Google\'s state-of-the-art model with thinking capabilities',
    contextLength: 1048576,
    features: ['text', 'vision', 'multimodal', 'reasoning'],
    tier: 'premium'
  },
  'google/gemini-2.5-flash': {
    provider: 'google',
    model: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Fast and efficient for quick tasks',
    contextLength: 1048576,
    features: ['text', 'vision', 'multimodal'],
    tier: 'standard'
  },

  // xAI Models (Grok)
  'x-ai/grok-4': {
    provider: 'xai',
    model: 'grok-4',
    name: 'Grok 4',
    description: 'xAI\'s latest reasoning model',
    contextLength: 256000,
    features: ['text', 'vision', 'reasoning'],
    tier: 'premium'
  },
  'x-ai/grok-2-vision-1212': {
    provider: 'xai',
    model: 'grok-2-vision-1212',
    name: 'Grok Vision',
    description: 'Vision-capable Grok model',
    contextLength: 8192,
    features: ['text', 'vision'],
    tier: 'standard'
  },

  // Perplexity Models
  'perplexity/llama-3.1-sonar-huge-128k-online': {
    provider: 'perplexity',
    model: 'llama-3.1-sonar-huge-128k-online',
    name: 'Sonar Huge Online',
    description: 'Research-focused model with web access',
    contextLength: 131072,
    features: ['text', 'research', 'web-search'],
    tier: 'premium'
  },
  'perplexity/llama-3.1-sonar-large-128k-online': {
    provider: 'perplexity',
    model: 'llama-3.1-sonar-large-128k-online',
    name: 'Sonar Large Online',
    description: 'Balanced research capabilities',
    contextLength: 131072,
    features: ['text', 'research', 'web-search'],
    tier: 'standard'
  },

  // OpenRouter Premium Models
  'openrouter/anthropic/claude-opus-4': {
    provider: 'openrouter',
    model: 'anthropic/claude-opus-4',
    name: 'Claude Opus 4 (OpenRouter)',
    description: 'World\'s best coding model via OpenRouter',
    contextLength: 200000,
    features: ['text', 'coding', 'reasoning'],
    tier: 'premium'
  },
  'openrouter/google/gemini-2.0-flash-thinking-exp': {
    provider: 'openrouter',
    model: 'google/gemini-2.0-flash-thinking-exp',
    name: 'Gemini Thinking (OpenRouter)',
    description: 'Experimental thinking model via OpenRouter',
    contextLength: 1048576,
    features: ['text', 'reasoning', 'thinking'],
    tier: 'premium'
  }
};

// Request validation schema
const ChatCompletionRequest = z.object({
  model: z.string(),
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string()
  })),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(8000).optional(),
  stream: z.boolean().optional(),
  systemPrompt: z.string().optional(),
  mcpEnabled: z.boolean().optional(),
  realTimeData: z.boolean().optional()
});

// Enhanced chat completions endpoint
router.post('/completions', async (req, res) => {
  try {
    const validatedRequest = ChatCompletionRequest.parse(req.body);
    const { model, messages, temperature = 0.7, maxTokens = 4000, systemPrompt, mcpEnabled, realTimeData } = validatedRequest;

    const modelConfig = ELITE_MODELS[model as keyof typeof ELITE_MODELS];
    if (!modelConfig) {
      return res.status(400).json({
        error: 'Invalid model',
        availableModels: Object.keys(ELITE_MODELS)
      });
    }

    const provider = modelConfig.provider;
    const client = clients[provider];

    if (!client) {
      return res.status(503).json({
        error: `${provider} client not available`,
        message: `API key for ${provider} not configured`
      });
    }

    // Prepare messages with optional system prompt
    const finalMessages = [...messages];
    if (systemPrompt && !finalMessages.find(m => m.role === 'system')) {
      finalMessages.unshift({ role: 'system', content: systemPrompt });
    }

    // Add real-time data context if enabled
    if (realTimeData) {
      const contextMessage = {
        role: 'system' as const,
        content: `Current context: You are Company AI, an elite real estate analysis agent. Current timestamp: ${new Date().toISOString()}. You have access to real-time market data and MCP tools.`
      };
      finalMessages.unshift(contextMessage);
    }

    let response;

    // Handle different providers with their specific implementations
    switch (provider) {
      case 'openai':
        response = await client.chat.completions.create({
          model: modelConfig.model,
          messages: finalMessages,
          temperature,
          max_tokens: maxTokens,
        });
        break;

      case 'openrouter':
        response = await client.chat.completions.create({
          model: modelConfig.model,
          messages: finalMessages,
          temperature,
          max_tokens: maxTokens,
        });
        break;

      case 'anthropic':
        const anthropicMessages = finalMessages.filter(m => m.role !== 'system');
        const systemMessage = finalMessages.find(m => m.role === 'system')?.content;
        
        const anthropicResponse = await client.messages.create({
          model: modelConfig.model,
          max_tokens: maxTokens,
          temperature,
          system: systemMessage,
          messages: anthropicMessages
        });

        response = {
          choices: [{
            message: {
              content: anthropicResponse.content[0]?.text || ''
            }
          }],
          usage: anthropicResponse.usage
        };
        break;

      case 'google':
        const geminiModel = client.models.get(modelConfig.model);
        const prompt = finalMessages.map(m => `${m.role}: ${m.content}`).join('\n\n');
        
        const geminiResponse = await geminiModel.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
          }
        });

        response = {
          choices: [{
            message: {
              content: geminiResponse.response.text() || ''
            }
          }]
        };
        break;

      case 'xai':
        response = await client.chat.completions.create({
          model: modelConfig.model,
          messages: finalMessages,
          temperature,
          max_tokens: maxTokens,
        });
        break;

      case 'perplexity':
        response = await client.chat.completions.create({
          model: modelConfig.model,
          messages: finalMessages,
          temperature,
          max_tokens: maxTokens,
        });
        break;

      default:
        return res.status(400).json({
          error: 'Unsupported provider',
          provider
        });
    }

    // Return standardized response
    res.json({
      choices: response.choices,
      usage: response.usage,
      model: model,
      provider: provider,
      tier: modelConfig.tier,
      features: modelConfig.features
    });

  } catch (error) {
    console.error('Elite chat error:', error);
    
    // Handle specific API errors
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request format',
        details: error.errors
      });
    }

    if (error instanceof Error) {
      // Handle API rate limits and errors
      if (error.message.includes('rate limit')) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: 'Please try again in a few moments'
        });
      }

      if (error.message.includes('quota')) {
        return res.status(402).json({
          error: 'API quota exceeded',
          message: 'Please check your API usage'
        });
      }
    }

    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get available models endpoint
router.get('/models', (req, res) => {
  const availableModels = Object.entries(ELITE_MODELS).map(([id, config]) => ({
    id,
    ...config,
    available: !!clients[config.provider]
  }));

  res.json({
    models: availableModels,
    providers: Object.keys(clients),
    totalModels: availableModels.length,
    availableModels: availableModels.filter(m => m.available).length
  });
});

// Get model details endpoint
router.get('/models/:modelId', (req, res) => {
  const { modelId } = req.params;
  const modelConfig = ELITE_MODELS[modelId as keyof typeof ELITE_MODELS];

  if (!modelConfig) {
    return res.status(404).json({
      error: 'Model not found'
    });
  }

  res.json({
    id: modelId,
    ...modelConfig,
    available: !!clients[modelConfig.provider]
  });
});

// Health check endpoint
router.get('/health', (req, res) => {
  const health = {
    status: 'healthy',
    providers: Object.entries(clients).map(([name, client]) => ({
      name,
      available: !!client,
      models: Object.values(ELITE_MODELS).filter(m => m.provider === name).length
    })),
    timestamp: new Date().toISOString()
  };

  res.json(health);
});

export default router;