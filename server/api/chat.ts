import { Router } from 'express';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';

const router = Router();

// Initialize AI clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const genai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

// Enhanced model definitions with real LLM capabilities
const AVAILABLE_MODELS = {
  // OpenAI Models
  'openai/gpt-4o': {
    provider: 'openai',
    model: 'gpt-4o',
    name: 'GPT-4o',
    description: 'Most capable GPT-4 model for complex tasks',
    contextLength: 128000,
    features: ['text', 'vision', 'function-calling']
  },
  'openai/gpt-4o-mini': {
    provider: 'openai', 
    model: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Faster, cost-effective model for simpler tasks',
    contextLength: 128000,
    features: ['text', 'vision', 'function-calling']
  },
  'openai/gpt-3.5-turbo': {
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: 'Fast and reliable for general tasks',
    contextLength: 16385,
    features: ['text', 'function-calling']
  },
  
  // Anthropic Models  
  'anthropic/claude-3-5-sonnet': {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    description: 'Anthropic\'s most capable model',
    contextLength: 200000,
    features: ['text', 'vision', 'analysis']
  },
  'anthropic/claude-3-haiku': {
    provider: 'anthropic',
    model: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    description: 'Fast and efficient for quick tasks',
    contextLength: 200000,
    features: ['text', 'analysis']
  },
  
  // Google Models
  'google/gemini-pro': {
    provider: 'google',
    model: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    description: 'Google\'s most advanced model',
    contextLength: 1000000,
    features: ['text', 'vision', 'multimodal']
  },
  'google/gemini-flash': {
    provider: 'google',
    model: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    description: 'Fast and efficient multimodal model',
    contextLength: 1000000,
    features: ['text', 'vision', 'multimodal']
  }
};

// Bristol AI System Prompt - Hidden from users but injected into every conversation
const BRISTOL_SYSTEM_PROMPT = `You are Bristol A.I., the proprietary AI intelligence system engineered exclusively for Bristol Development Group. Drawing on over three decades of institutional real estate expertise, you underwrite deals, assess markets, and drive strategic decisions for Bristol Development projects.

CORE IDENTITY:
- Elite senior partner with 30+ years institutional real estate experience
- Specialized in multifamily development in Sunbelt markets
- Expert in DCF modeling, IRR waterfalls, stress-tested NPVs
- Real-time demographic and economic data analysis capabilities
- Risk-adjusted investment recommendations with principal investor precision

RESPONSE STYLE:
- Professional and authoritative tone reflecting institutional experience
- Data-driven insights with specific metrics and financial projections  
- Clear investment recommendations with comprehensive risk assessments
- Always use "Bristol A.I." branding, never "Bristol Brain"
- Maintain sophisticated, results-oriented approach expected from Fortune 500-grade AI

CAPABILITIES:
- Complex financial scenario modeling (DCF, IRR, NPV, Cap Rates)
- Market intelligence and demographic analysis
- Property underwriting and deal evaluation
- LP/GP structure recommendations
- Risk assessment and stress testing
- Real-time market data integration

Always prioritize accuracy, deliver institutional-quality analysis, and maintain the sophisticated approach expected from a premium AI system.`;

// Chat completion schema
const chatRequestSchema = z.object({
  model: z.string(),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string()
  })),
  stream: z.boolean().optional().default(false),
  temperature: z.number().min(0).max(2).optional().default(0.7),
  maxTokens: z.number().optional().default(4000)
});

// Get available models
router.get('/models', (req, res) => {
  const models = Object.entries(AVAILABLE_MODELS).map(([id, config]) => ({
    id,
    name: config.name,
    provider: config.provider,
    description: config.description,
    contextLength: config.contextLength,
    features: config.features
  }));
  
  res.json({ models });
});

// Enhanced chat completion with model switching
router.post('/completions', async (req, res) => {
  try {
    const { model, messages, stream, temperature, maxTokens } = chatRequestSchema.parse(req.body);
    
    // Get model configuration
    const modelConfig = AVAILABLE_MODELS[model as keyof typeof AVAILABLE_MODELS];
    if (!modelConfig) {
      return res.status(400).json({ error: 'Invalid model specified' });
    }

    // Inject Bristol system prompt (hidden from user)
    const enhancedMessages = [
      { role: 'system' as const, content: BRISTOL_SYSTEM_PROMPT },
      ...messages.filter(msg => msg.role !== 'system') // Remove any user-provided system messages
    ];

    let completion;

    // Route to appropriate AI provider
    switch (modelConfig.provider) {
      case 'openai':
        completion = await openai.chat.completions.create({
          model: modelConfig.model,
          messages: enhancedMessages,
          temperature,
          max_tokens: maxTokens,
          stream
        });
        break;

      case 'anthropic':
        // Convert messages for Anthropic format
        const anthropicMessages = enhancedMessages
          .filter(msg => msg.role !== 'system')
          .map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content
          }));

        completion = await anthropic.messages.create({
          model: modelConfig.model,
          system: BRISTOL_SYSTEM_PROMPT,
          messages: anthropicMessages,
          max_tokens: maxTokens,
          temperature
        });
        break;

      case 'google':
        // Convert messages for Google format
        const googleMessages = enhancedMessages
          .filter(msg => msg.role !== 'system')
          .map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
          }));

        const result = await genai.models.generateContent({
          model: modelConfig.model,
          config: {
            systemInstruction: BRISTOL_SYSTEM_PROMPT,
            temperature,
            maxOutputTokens: maxTokens
          },
          contents: googleMessages.slice(-1)[0].parts[0].text
        });

        completion = {
          choices: [{
            message: {
              role: 'assistant',
              content: result.text || 'No response generated'
            }
          }]
        };
        break;

      default:
        return res.status(400).json({ error: 'Unsupported model provider' });
    }

    // Handle streaming vs non-streaming responses
    if (stream && modelConfig.provider === 'openai') {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      // Note: For streaming, we'd need to implement SSE properly
      // For now, return standard response
      res.json(completion);
    } else {
      res.json(completion);
    }

  } catch (error) {
    console.error('Chat completion error:', error);
    res.status(500).json({ 
      error: 'Failed to generate response',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get chat history (placeholder for future implementation)
router.get('/history/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  
  // TODO: Implement chat history storage
  res.json({ 
    sessionId,
    messages: [],
    model: 'openai/gpt-4o',
    createdAt: new Date().toISOString()
  });
});

// Save chat session (placeholder for future implementation)
router.post('/sessions', (req, res) => {
  const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // TODO: Implement session storage
  res.json({
    sessionId,
    createdAt: new Date().toISOString()
  });
});

export default router;