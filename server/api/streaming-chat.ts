import { Router } from 'express';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI } from '@google/genai';
import { 
  formatSSEMessage, 
  getProviderModel, 
  prepareMessages, 
  createStreamingError, 
  createCompletionMessage, 
  createContentChunk,
  validateStreamingConfig,
  type StreamingConfig 
} from '../utils/streaming';

const router = Router();

// Initialize streaming-capable AI clients
const initializeStreamingClients = () => {
  const clients: any = {};

  if (process.env.OPENAI_API_KEY) {
    clients.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  if (process.env.OPENROUTER_API_KEY) {
    clients.openrouter = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': process.env.OPENROUTER_REFERER || 'https://bristol.dev',
        'X-Title': 'Bristol Elite AI Chat'
      }
    });
  }

  if (process.env.ANTHROPIC_API_KEY) {
    clients.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  if (process.env.XAI_API_KEY) {
    clients.xai = new OpenAI({
      apiKey: process.env.XAI_API_KEY,
      baseURL: 'https://api.x.ai/v1',
    });
  }

  if (process.env.PERPLEXITY_API_KEY) {
    clients.perplexity = new OpenAI({
      apiKey: process.env.PERPLEXITY_API_KEY,
      baseURL: 'https://api.perplexity.ai',
    });
  }

  return clients;
};

const streamingClients = initializeStreamingClients();

// Enhanced streaming endpoint with server-sent events
router.post('/stream', async (req, res) => {
  const config: StreamingConfig = req.body;
  const { model, messages, temperature = 0.7, maxTokens = 4000, systemPrompt, mcpEnabled, realTimeData } = config;

  // Validate configuration
  const validation = validateStreamingConfig(config);
  if (!validation.valid) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: validation.error }));
    return;
  }

  // Set up SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  try {
    const { provider, model: actualModel } = getProviderModel(model);
    const client = streamingClients[provider];
    
    if (!client) {
      res.write(formatSSEMessage(createStreamingError(`${provider} client not available`, model, provider)));
      res.end();
      return;
    }

    // Prepare messages with system prompt and real-time data
    const finalMessages = prepareMessages(messages, systemPrompt, realTimeData);

    let stream;

    // Handle different providers with streaming
    switch (provider) {
      case 'openai':
      case 'openrouter':
      case 'xai':
        stream = await client.chat.completions.create({
          model: actualModel,
          messages: finalMessages,
          temperature,
          max_tokens: maxTokens,
          stream: true,
        });
        
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            res.write(formatSSEMessage(createContentChunk(content, model, provider)));
          }
        }
        break;

      case 'anthropic':
        const anthropicMessages = finalMessages.filter(m => m.role !== 'system');
        const systemMessage = finalMessages.find(m => m.role === 'system')?.content;
        
        const anthropicStream = await client.messages.create({
          model: actualModel,
          max_tokens: maxTokens,
          temperature,
          system: systemMessage,
          messages: anthropicMessages,
          stream: true
        });

        for await (const chunk of anthropicStream) {
          if (chunk.type === 'content_block_delta') {
            const content = (chunk as any).delta?.text || '';
            if (content) {
              res.write(formatSSEMessage(createContentChunk(content, model, provider)));
            }
          }
        }
        break;

      case 'perplexity':
        stream = await client.chat.completions.create({
          model: 'llama-3.1-sonar-large-128k-online',
          messages: finalMessages,
          temperature,
          max_tokens: maxTokens,
          stream: true,
        });
        
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            res.write(`data: ${JSON.stringify({ 
              content, 
              model, 
              provider,
              timestamp: new Date().toISOString() 
            })}\n\n`);
          }
        }
        break;

      default:
        res.write(`data: ${JSON.stringify({ error: 'Unsupported provider for streaming' })}\n\n`);
        res.end();
        return;
    }

    // Send completion signal
    res.write(formatSSEMessage(createCompletionMessage(model, provider)));
    res.end();

  } catch (error) {
    console.error('Streaming error:', error);
    const { provider } = getProviderModel(model);
    res.write(formatSSEMessage(createStreamingError(error instanceof Error ? error.message : 'Unknown streaming error', model, provider)));
    res.end();
  }
});

// Non-streaming fallback endpoint
router.post('/completions', async (req, res) => {
  try {
    const { model, messages, temperature = 0.7, maxTokens = 4000, systemPrompt } = req.body;

    const provider = model.includes('openai') ? 'openai' :
                    model.includes('anthropic') ? 'anthropic' :
                    model.includes('x-ai') ? 'xai' :
                    model.includes('perplexity') ? 'perplexity' :
                    model.includes('openrouter') ? 'openrouter' : 'openai';

    const client = streamingClients[provider];
    
    if (!client) {
      return res.status(503).json({ error: `${provider} client not available` });
    }

    const finalMessages = [...messages];
    if (systemPrompt && !finalMessages.find(m => m.role === 'system')) {
      finalMessages.unshift({ role: 'system', content: systemPrompt });
    }

    let response;

    switch (provider) {
      case 'openai':
      case 'openrouter':
      case 'xai':
        const modelName = provider === 'openrouter' ? model : model.split('/')[1];
        response = await client.chat.completions.create({
          model: modelName,
          messages: finalMessages,
          temperature,
          max_tokens: maxTokens,
        });
        break;

      case 'anthropic':
        const anthropicMessages = finalMessages.filter(m => m.role !== 'system');
        const systemMessage = finalMessages.find(m => m.role === 'system')?.content;
        
        const anthropicResponse = await client.messages.create({
          model: model.includes('claude-sonnet-4') ? 'claude-sonnet-4-20250514' : 'claude-3-5-sonnet-20241022',
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

      case 'perplexity':
        response = await client.chat.completions.create({
          model: 'llama-3.1-sonar-large-128k-online',
          messages: finalMessages,
          temperature,
          max_tokens: maxTokens,
        });
        break;

      default:
        return res.status(400).json({ error: 'Unsupported provider' });
    }

    res.json({
      choices: response.choices,
      usage: response.usage,
      model,
      provider,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat completion error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;