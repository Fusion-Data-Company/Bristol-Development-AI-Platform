import { Router } from 'express';
import OpenAI from 'openai';

const router = Router();

// Initialize OpenRouter client with premium configuration
const openRouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': process.env.OPENROUTER_REFERER || 'https://yourcompany.com',
    'X-Title': 'Company Elite AI Chat'
  }
});

// Premium model configurations with exact OpenRouter model IDs
const premiumModels = {
  // OpenAI GPT-5 and latest models
  'openai/gpt-5': {
    id: 'openai/gpt-5',
    label: 'OpenAI GPT-5 💎 PREMIUM',
    provider: 'openai',
    tier: 'premium',
    context: 128000,
    available: true,
    features: ['reasoning', 'coding', 'multimodal'],
    pricing: { input: 0.02, output: 0.04 }
  },
  'openai/gpt-4o': {
    id: 'openai/gpt-4o',
    label: 'OpenAI GPT-4o',
    provider: 'openai',
    tier: 'standard',
    context: 128000,
    available: true,
    features: ['multimodal', 'vision', 'fast']
  },

  // Anthropic Claude models
  'anthropic/claude-sonnet-4-20250514': {
    id: 'anthropic/claude-sonnet-4-20250514',
    label: 'Anthropic Claude Sonnet 4 💎 PREMIUM',
    provider: 'anthropic',
    tier: 'premium',
    context: 200000,
    available: true,
    features: ['reasoning', 'analysis', 'coding'],
    pricing: { input: 0.015, output: 0.075 }
  },
  'anthropic/claude-3.5-sonnet': {
    id: 'anthropic/claude-3.5-sonnet',
    label: 'Anthropic Claude 3.5 Sonnet',
    provider: 'anthropic',
    tier: 'standard',
    context: 200000,
    available: true,
    features: ['reasoning', 'coding', 'analysis']
  },

  // Google Gemini models
  'google/gemini-2.5-pro': {
    id: 'google/gemini-2.5-pro',
    label: 'Google Gemini 2.5 Pro 💎 PREMIUM',
    provider: 'google',
    tier: 'premium',
    context: 1000000,
    available: true,
    features: ['multimodal', 'long-context', 'reasoning'],
    pricing: { input: 0.002, output: 0.008 }
  },
  'google/gemini-pro-1.5': {
    id: 'google/gemini-pro-1.5',
    label: 'Google Gemini Pro 1.5',
    provider: 'google',
    tier: 'standard',
    context: 1000000,
    available: true,
    features: ['multimodal', 'long-context']
  },

  // xAI Grok models
  'x-ai/grok-4': {
    id: 'x-ai/grok-4',
    label: 'xAI Grok 4 💎 PREMIUM',
    provider: 'xai',
    tier: 'premium',
    context: 131072,
    available: true,
    features: ['reasoning', 'real-time', 'web-search'],
    pricing: { input: 0.01, output: 0.02 }
  },
  'x-ai/grok-2-1212': {
    id: 'x-ai/grok-2-1212',
    label: 'xAI Grok 2 1212',
    provider: 'xai',
    tier: 'standard',
    context: 131072,
    available: true,
    features: ['reasoning', 'real-time']
  },

  // Perplexity models
  'perplexity/llama-3.1-sonar-huge-128k-online': {
    id: 'perplexity/llama-3.1-sonar-huge-128k-online',
    label: 'Perplexity Sonar Huge 💎 PREMIUM',
    provider: 'perplexity',
    tier: 'premium',
    context: 127072,
    available: true,
    features: ['web-search', 'real-time', 'citations'],
    pricing: { input: 0.005, output: 0.005 }
  },
  'perplexity/llama-3.1-sonar-large-128k-online': {
    id: 'perplexity/llama-3.1-sonar-large-128k-online',
    label: 'Perplexity Sonar Large',
    provider: 'perplexity',
    tier: 'standard',
    context: 127072,
    available: true,
    features: ['web-search', 'citations']
  }
};

// Get available premium models
router.get('/models', async (req, res) => {
  try {
    // Check which API keys are available
    const apiKeys = {
      openrouter: !!process.env.OPENROUTER_API_KEY,
      openai: !!process.env.OPENAI_API_KEY,
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      google: !!process.env.GEMINI_API_KEY,
      xai: !!process.env.XAI_API_KEY,
      perplexity: !!process.env.PERPLEXITY_API_KEY
    };

    const availableModels = Object.values(premiumModels).map(model => ({
      ...model,
      available: apiKeys.openrouter || apiKeys[model.provider as keyof typeof apiKeys] || false
    }));

    res.json({
      models: availableModels,
      providers: apiKeys,
      totalModels: availableModels.length,
      premiumModels: availableModels.filter(m => m.tier === 'premium').length
    });
  } catch (error) {
    console.error('Error fetching premium models:', error);
    res.status(500).json({
      error: 'Failed to fetch premium models',
      models: []
    });
  }
});

// Premium chat completion with enhanced model handling
router.post('/chat', async (req, res) => {
  try {
    const { 
      model, 
      messages, 
      temperature = 0.7, 
      maxTokens = 4000, 
      systemPrompt,
      mcpEnabled,
      realTimeData,
      stream = false 
    } = req.body;

    if (!model || !messages) {
      return res.status(400).json({
        error: 'Missing required parameters: model and messages'
      });
    }

    const modelConfig = premiumModels[model as keyof typeof premiumModels];
    if (!modelConfig) {
      return res.status(400).json({
        error: `Unsupported model: ${model}`
      });
    }

    // Prepare enhanced messages with system context
    const enhancedMessages = [...messages];
    
    if (systemPrompt && !enhancedMessages.find(m => m.role === 'system')) {
      enhancedMessages.unshift({
        role: 'system',
        content: `${systemPrompt}\n\nYou are Company A.I. Elite, the proprietary AI intelligence system engineered exclusively for Company Development Group. You have access to real-time market data${mcpEnabled ? ' and MCP tools' : ''}${realTimeData ? ' with live data feeds' : ''}. Current timestamp: ${new Date().toISOString()}.`
      });
    }

    // Add Company context for premium models
    if (modelConfig.tier === 'premium') {
      const companyContext = {
        role: 'system' as const,
        content: `COMPANY ELITE MODE ACTIVATED: You are operating in premium mode with enhanced capabilities. Provide institutional-grade analysis with precise financial modeling, risk assessment, and strategic recommendations. Focus on IRR, NPV, cap rates, and comprehensive market intelligence.`
      };
      enhancedMessages.splice(1, 0, companyContext);
    }

    const completion = await openRouter.chat.completions.create({
      model: model,
      messages: enhancedMessages,
      temperature,
      max_tokens: maxTokens,
      stream,
      // Enhanced parameters for premium models
      ...(modelConfig.tier === 'premium' && {
        top_p: 0.95,
        frequency_penalty: 0.1,
        presence_penalty: 0.1
      })
    });

    if (stream) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });

      for await (const chunk of completion as any) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          res.write(`data: ${JSON.stringify({ 
            content, 
            model, 
            provider: modelConfig.provider,
            tier: modelConfig.tier,
            timestamp: new Date().toISOString() 
          })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ 
        done: true, 
        model, 
        provider: modelConfig.provider,
        tier: modelConfig.tier
      })}\n\n`);
      res.end();
    } else {
      const result = completion as any;
      res.json({
        choices: result.choices,
        usage: result.usage,
        model,
        provider: modelConfig.provider,
        tier: modelConfig.tier,
        timestamp: new Date().toISOString(),
        pricing: (modelConfig as any).pricing
      });
    }

  } catch (error) {
    console.error('Premium chat error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Premium chat failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Model health check for premium services
router.get('/health', async (req, res) => {
  try {
    const healthChecks = await Promise.allSettled([
      // Test OpenRouter connectivity
      openRouter.models.list(),
    ]);

    const openRouterHealthy = healthChecks[0].status === 'fulfilled';

    res.json({
      timestamp: new Date().toISOString(),
      services: {
        openrouter: {
          status: openRouterHealthy ? 'healthy' : 'error',
          available: !!process.env.OPENROUTER_API_KEY,
          lastCheck: new Date().toISOString()
        }
      },
      overallHealth: openRouterHealthy,
      premiumModelsAvailable: Object.values(premiumModels).filter(m => m.tier === 'premium').length
    });
  } catch (error) {
    res.status(500).json({
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;