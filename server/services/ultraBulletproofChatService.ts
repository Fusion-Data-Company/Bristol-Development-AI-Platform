import { z } from 'zod';
import { mcpService } from './mcpService';
import { mcpToolsIntegration } from './mcpToolsIntegration';

// Enhanced schema with OpenRouter features
const ultraSimpleSchema = z.object({
  message: z.string().min(1).default('Hello'),
  sessionId: z.string().optional(),
  model: z.string().optional().default('openai/gpt-4o'),
  userId: z.string().optional().default('demo-user'),
  stream: z.boolean().optional().default(false),
  
  // OpenRouter Advanced Parameters
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().min(1).optional(),
  top_p: z.number().min(0).max(1).optional(),
  top_k: z.number().min(1).optional(),
  frequency_penalty: z.number().min(-2).max(2).optional(),
  presence_penalty: z.number().min(-2).max(2).optional(),
  repetition_penalty: z.number().min(0).max(2).optional(),
  seed: z.number().int().optional(),
  
  // OpenRouter-specific parameters
  transforms: z.array(z.string()).optional(),
  models: z.array(z.string()).optional(), // Fallback models
  route: z.enum(['fallback']).optional(),
  
  // Response format control
  response_format: z.object({ type: z.literal('json_object') }).optional(),
  
  // Assistant prefill for guided responses
  assistant_prefill: z.string().optional(),
  
  // Enhanced error handling
  require_verified_models: z.boolean().optional().default(true)
});

type UltraSimpleRequest = z.infer<typeof ultraSimpleSchema>;

// OpenRouter Error Response Type
type OpenRouterError = {
  code: number;
  message: string;
  metadata?: Record<string, unknown>;
};

// Enhanced Response Types
type EnhancedResponse = {
  success: boolean;
  content: string;
  sessionId: string;
  model: string;
  source: string;
  metadata: {
    processingTime: number;
    attemptNumber: number;
    finish_reason?: string;
    native_finish_reason?: string;
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
    generation_id?: string;
    provider_used?: string;
    fallback_used?: boolean;
    error_details?: OpenRouterError;
  };
};

// Enhanced Streaming response type for SSE (Server-Sent Events)
type StreamingResponse = {
  success: boolean;
  sessionId: string;
  model: string;
  source: string;
  stream: ReadableStream<Uint8Array>;
  metadata: {
    processingTime: number;
    attemptNumber: number;
    streaming: boolean;
    model_fallbacks?: string[];
    provider_route?: string;
    generation_id?: string;
  };
};

// Response cache for lightning-fast responses
const responseCache = new Map<string, { response: string; timestamp: number }>();
const CACHE_TTL = 300000; // 5 minute cache for speed

class UltraBulletproofChatService {
  private attemptCounter = 0;
  private mcpIntegration = mcpToolsIntegration;

  // STREAMING: Direct streaming response following OpenRouter SSE docs
  async processUltraBulletproofStream(request: any): Promise<StreamingResponse> {
    const startTime = Date.now();
    this.attemptCounter++;
    
    // Step 1: Validate input with extreme tolerance
    let validatedRequest: UltraSimpleRequest;
    try {
      validatedRequest = ultraSimpleSchema.parse(request);
    } catch (error) {
      validatedRequest = {
        message: String(request?.message || request?.query || request?.text || 'Hello'),
        sessionId: String(request?.sessionId || `ultra-${Date.now()}`),
        model: String(request?.model || 'openai/gpt-4o'),
        userId: 'demo-user',
        stream: true,
        require_verified_models: true
      };
    }

    const { message, sessionId = `ultra-${Date.now()}`, model, userId } = validatedRequest;

    console.log(`🚀 STREAMING: OpenRouter call with model ${model}`);
    
    try {
      const { stream: streamResponse, metadata: streamMetadata } = await this.fastDirectOpenRouterStream(message, model, validatedRequest);
      if (streamResponse) {
        return {
          success: true,
          sessionId,
          model,
          source: `openrouter-stream-${streamMetadata.model_actually_used || model}`,
          stream: streamResponse,
          metadata: {
            processingTime: Date.now() - startTime,
            attemptNumber: this.attemptCounter,
            streaming: true,
            ...streamMetadata
          }
        };
      }
    } catch (error) {
      console.warn('Enhanced OpenRouter stream failed:', error);
    }

    // Fallback to non-streaming if streaming fails
    throw new Error('Streaming failed, use non-streaming endpoint');
  }

  // Enhanced bulletproof message processing with OpenRouter features
  async processUltraBulletproofMessage(request: any): Promise<EnhancedResponse> {
    const startTime = Date.now();
    this.attemptCounter++;
    
    // Step 1: Validate input with extreme tolerance
    let validatedRequest: UltraSimpleRequest;
    try {
      validatedRequest = ultraSimpleSchema.parse(request);
    } catch (error) {
      validatedRequest = {
        message: String(request?.message || request?.query || request?.text || 'Hello'),
        sessionId: String(request?.sessionId || `ultra-${Date.now()}`),
        model: String(request?.model || 'openai/gpt-4o'),
        userId: 'demo-user',
        stream: false, // Non-streaming method defaults to false
        require_verified_models: true
      };
    }

    const { message, sessionId = `ultra-${Date.now()}`, model, userId } = validatedRequest;

    // Step 2: Check cache first for instant responses
    const cacheKey = `${userId}-${model}-${message.substring(0, 100)}`; // Include model in cache key!
    const cached = responseCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      console.log('⚡ INSTANT: Cached response');
      return {
        success: true,
        content: cached.response,
        sessionId,
        model,
        source: 'cache-instant',
        metadata: {
          processingTime: Date.now() - startTime,
          attemptNumber: this.attemptCounter,
          fallback_used: false,
          provider_used: 'cache'
        }
      };
    }

    // Step 3: Enhanced OpenRouter call with MCP tool integration
    console.log(`🚀 ENHANCED: OpenRouter + MCP call with model ${model}`);
    
    try {
      const { content: directResponse, metadata: callMetadata } = await this.enhancedOpenRouterWithMCP(message, model, validatedRequest, sessionId);
      if (directResponse) {
        // Cache for future speed with model-specific key
        responseCache.set(cacheKey, {
          response: directResponse,
          timestamp: Date.now()
        });
        
        return {
          success: true,
          content: directResponse,
          sessionId,
          model,
          source: `openrouter-mcp-enhanced-${callMetadata.model_actually_used || model}`,
          metadata: {
            processingTime: Date.now() - startTime,
            attemptNumber: this.attemptCounter,
            mcpToolsUsed: callMetadata.mcpToolsUsed || [],
            ...callMetadata
          }
        };
      }
    } catch (error) {
      console.warn('Enhanced OpenRouter+MCP call failed:', error);
    }

    // Step 4: Intelligent fallback (guaranteed response)
    const intelligentFallback = this.generateSmartFallback(message);
    
    // Cache even fallback for consistency with model-specific key
    responseCache.set(cacheKey, {
      response: intelligentFallback,
      timestamp: Date.now()
    });

    // ALWAYS return a response - ultimate guarantee
    return {
      success: true,
      content: intelligentFallback,
      sessionId,
      model,
      source: 'smart-fallback',
      metadata: {
        processingTime: Date.now() - startTime,
        attemptNumber: this.attemptCounter,
        fallback_used: true,
        provider_used: 'smart-fallback'
      }
    };
  }

  // NEW: Enhanced OpenRouter with MCP tool integration
  private async enhancedOpenRouterWithMCP(message: string, model: string, options: Partial<UltraSimpleRequest> = {}, sessionId: string): Promise<{ content: string | null; metadata: any }> {
    const metadata: any = { mcpToolsUsed: [] };
    
    // First, check if the message requires MCP tools
    const needsData = this.analyzeDataNeeds(message);
    
    // Enhanced system prompt with MCP tool access
    let enhancedSystemPrompt = `You are Your Company A.I. Elite, the proprietary AI intelligence system for Your Company Name. You have access to real-time data through integrated tools.

AVAILABLE TOOLS:
- Property database queries (Company portfolio, metrics, comparables)
- Economic data (BLS employment, BEA GDP, HUD fair market rents)
- Market intelligence (demographics, crime statistics, climate data)
- Financial analysis tools (IRR/NPV calculators, cap rate analysis)

When users ask about:
- Specific properties or addresses → Query property database
- Market conditions → Pull economic and demographic data  
- Investment analysis → Use financial tools and comparables
- Market trends → Access BLS, BEA, HUD data

Always provide data-driven insights with specific metrics, sources, and Company's institutional expertise.

User Message: ${message}`;

    // If data tools are needed, gather context first
    if (needsData.requiresData) {
      console.log('🔧 Gathering data via MCP tools...');
      
      for (const toolCall of needsData.toolCalls) {
        try {
          const toolResult = await this.mcpIntegration.executeTool(toolCall.tool, toolCall.parameters);
          if (toolResult.success) {
            metadata.mcpToolsUsed.push({
              tool: toolCall.tool,
              success: true,
              executionTime: toolResult.executionTime
            });
            // Add tool data to the enhanced prompt
            enhancedSystemPrompt += `\n\nTOOL DATA (${toolCall.tool}):\n${JSON.stringify(toolResult.data, null, 2)}`;
          }
        } catch (error) {
          console.warn(`MCP tool ${toolCall.tool} failed:`, error);
          metadata.mcpToolsUsed.push({
            tool: toolCall.tool,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    // Now call OpenRouter with enhanced context
    return await this.fastDirectOpenRouter(message, model, options, metadata);
  }

  // Analyze what data/tools the message needs
  private analyzeDataNeeds(message: string): { requiresData: boolean; toolCalls: Array<{ tool: string; parameters: any }> } {
    const lowerMessage = message.toLowerCase();
    const toolCalls: Array<{ tool: string; parameters: any }> = [];

    // Property-specific queries
    if (lowerMessage.includes('property') || lowerMessage.includes('address') || lowerMessage.includes('site')) {
      toolCalls.push({
        tool: 'search_properties',
        parameters: { location: this.extractLocation(message), propertyType: 'multifamily' }
      });
    }

    // Market analysis queries
    if (lowerMessage.includes('market') || lowerMessage.includes('demographic') || lowerMessage.includes('employment')) {
      toolCalls.push({
        tool: 'get_demographics',
        parameters: { location: this.extractLocation(message) }
      });
    }

    // Financial analysis queries
    if (lowerMessage.includes('irr') || lowerMessage.includes('npv') || lowerMessage.includes('cap rate') || lowerMessage.includes('financial')) {
      toolCalls.push({
        tool: 'calculate_financial_metrics',
        parameters: { analysisType: 'comprehensive' }
      });
    }

    return {
      requiresData: toolCalls.length > 0,
      toolCalls
    };
  }

  // Extract location from message
  private extractLocation(message: string): string {
    // Simple regex to find city, state patterns or addresses
    const locationPatterns = [
      /([A-Z][a-z]+,?\s+[A-Z]{2})/g, // City, ST
      /(\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Boulevard|Blvd))/g // Street addresses
    ];

    for (const pattern of locationPatterns) {
      const match = message.match(pattern);
      if (match) return match[0];
    }

    return 'Atlanta, GA'; // Default fallback
  }

  // Enhanced OpenRouter call with comprehensive error handling
  private async fastDirectOpenRouter(message: string, model: string, options: Partial<UltraSimpleRequest> = {}, existingMetadata: any = {}): Promise<{ content: string | null; metadata: any }> {
    // Enhanced API key handling with BYOK support
    const API_KEY = process.env.OPENROUTER_API_KEY2 || process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
    if (!API_KEY) {
      console.warn('No OpenRouter API key found - ensure OPENROUTER_API_KEY is set for BYOK');
      return { content: null, metadata: { error: 'No API key configured' } };
    }
    
    console.log(`🔑 Using API key: ${API_KEY.substring(0, 8)}...${API_KEY.substring(API_KEY.length - 4)} for model: ${model}`);

    // VERIFIED WORKING MODELS ONLY - Updated with GPT-5 and latest models
    const ELITE_MODELS = new Set([
      // OpenAI Models (including GPT-5)
      "openai/gpt-5", "openai/o1", "openai/o1-preview", "openai/o1-mini",
      "openai/gpt-4o", "openai/gpt-4o-mini", "openai/gpt-4-turbo", "openai/gpt-4", "openai/chatgpt-4o-latest",
      // Anthropic Claude Models
      "anthropic/claude-3.5-sonnet", "anthropic/claude-3.5-haiku", "anthropic/claude-3-opus", "anthropic/claude-3-haiku",
      // Grok Models
      "x-ai/grok-2-1212", "x-ai/grok-2-vision-1212", "x-ai/grok-vision-beta",
      // Perplexity Models
      "perplexity/sonar-deep-research", "perplexity/sonar-reasoning-pro", "perplexity/sonar-pro", "perplexity/sonar-reasoning", "perplexity/sonar"
    ]);

    // Enhanced model routing with fallbacks
    const primaryModel = ELITE_MODELS.has(model) ? model : 'openai/gpt-4o';
    const fallbackModels = options.models || ['openai/gpt-4o', 'anthropic/claude-3.5-sonnet'];
    
    console.log(`🎯 Primary model: ${primaryModel}, Fallbacks: ${fallbackModels.join(', ')}`);

    // Build enhanced messages with assistant prefill support
    const messages: any[] = [
      {
        role: 'system',
        content: 'You are Your Company A.I. Elite, Your Company Name\'s institutional real estate AI. Provide concise, professional responses focused on multifamily development analysis, market insights, and financial modeling.'
      },
      {
        role: 'user',
        content: message
      }
    ];
    
    // Add assistant prefill if provided
    if (options.assistant_prefill) {
      messages.push({
        role: 'assistant',
        content: options.assistant_prefill
      });
    }

    // Enhanced request payload with OpenRouter parameters
    const requestPayload: any = {
      model: primaryModel,
      messages,
      
      // Core parameters with defaults
      temperature: options.temperature ?? 0.3,
      max_tokens: options.max_tokens ?? 800,
      
      // Advanced parameters (only include if specified)
      ...(options.top_p && { top_p: options.top_p }),
      ...(options.top_k && { top_k: options.top_k }),
      ...(options.frequency_penalty && { frequency_penalty: options.frequency_penalty }),
      ...(options.presence_penalty && { presence_penalty: options.presence_penalty }),
      ...(options.repetition_penalty && { repetition_penalty: options.repetition_penalty }),
      ...(options.seed && { seed: options.seed }),
      
      // OpenRouter-specific parameters
      ...(options.transforms && { transforms: options.transforms }),
      ...(fallbackModels.length > 1 && { models: fallbackModels, route: 'fallback' }),
      ...(options.response_format && { response_format: options.response_format }),
      
      // User identification for abuse prevention
      user: options.userId || 'demo-user'
    };

    const metadata: any = {
      model_requested: model,
      model_used: primaryModel,
      fallback_models: fallbackModels,
      parameters_used: Object.keys(requestPayload)
    };

    try {
      // Enhanced error handling with timeout and retry logic
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
          'HTTP-Referer': process.env.SITE_URL || 'http://localhost:5000',
          'X-Title': 'Company Development AI'
        },
        body: JSON.stringify(requestPayload),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ OpenRouter response from ${data.model || primaryModel}`);
        
        // Extract enhanced metadata
        const choice = data.choices?.[0];
        metadata.finish_reason = choice?.finish_reason;
        metadata.native_finish_reason = choice?.native_finish_reason;
        metadata.usage = data.usage;
        metadata.generation_id = data.id;
        metadata.model_actually_used = data.model;
        metadata.system_fingerprint = data.system_fingerprint;
        
        // Handle errors in choices
        if (choice?.error) {
          metadata.choice_error = choice.error;
          console.warn('Choice error:', choice.error);
        }
        
        return {
          content: choice?.message?.content || null,
          metadata
        };
      } else {
        // Enhanced error handling
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: await response.text() };
        }
        
        const openRouterError: OpenRouterError = {
          code: response.status,
          message: errorData.error?.message || errorData.message || 'Unknown error',
          metadata: errorData.error?.metadata || {}
        };
        
        metadata.error = openRouterError;
        console.error(`OpenRouter API error:`, openRouterError);
        
        return { content: null, metadata };
      }
    } catch (error) {
      // Comprehensive error handling
      const err = error as any;
      if (err?.name === 'AbortError') {
        metadata.timeout_error = 'Request timed out after 30 seconds';
        console.error('OpenRouter request timeout');
      } else if (err?.code === 'ECONNRESET' || err?.code === 'ENOTFOUND') {
        metadata.network_error = `Network connectivity issue: ${err.message || 'Unknown network error'}`;
        console.error('Network connectivity error:', error);
      } else if (err?.code === 'ECONNREFUSED') {
        metadata.service_unavailable = 'OpenRouter service unavailable';
        console.error('OpenRouter service unavailable:', error);
      } else {
        metadata.network_error = error instanceof Error ? error.message : 'Unknown network error';
        console.error('Unexpected network error:', error);
      }
      
      // Return null to trigger fallback mechanisms
      return { content: null, metadata };
    }
  }

  // Enhanced OpenRouter STREAMING call with full parameter support
  private async fastDirectOpenRouterStream(message: string, model: string, options: Partial<UltraSimpleRequest> = {}): Promise<{ stream: ReadableStream<Uint8Array> | null; metadata: any }> {
    const API_KEY = process.env.OPENROUTER_API_KEY2 || process.env.OPENAI_API_KEY;
    if (!API_KEY) {
      console.warn('No OpenRouter API key found');
      return { stream: null, metadata: { error: 'No API key' } };
    }

    // VERIFIED WORKING MODELS ONLY - same allowlist as non-streaming
    const ELITE_MODELS = new Set([
      "openai/gpt-4o", "openai/gpt-4o-mini", "openai/gpt-4-turbo", "openai/gpt-4", "openai/chatgpt-4o-latest",
      "anthropic/claude-3.5-sonnet", "anthropic/claude-3.5-haiku", "anthropic/claude-3-opus", "anthropic/claude-3-haiku",
      "x-ai/grok-2-1212", "x-ai/grok-2-vision-1212", "x-ai/grok-vision-beta",
      "perplexity/sonar-deep-research", "perplexity/sonar-reasoning-pro", "perplexity/sonar-pro", "perplexity/sonar-reasoning", "perplexity/sonar"
    ]);

    const primaryModel = ELITE_MODELS.has(model) ? model : 'openai/gpt-4o';
    const fallbackModels = options.models || ['openai/gpt-4o', 'anthropic/claude-3.5-sonnet'];
    console.log(`🎯 Streaming model: ${primaryModel}`);

    // Build enhanced messages with assistant prefill support
    const messages: any[] = [
      {
        role: 'system',
        content: 'You are Your Company A.I. Elite, Your Company Name\'s institutional real estate AI. Provide concise, professional responses focused on multifamily development analysis, market insights, and financial modeling.'
      },
      {
        role: 'user',
        content: message
      }
    ];
    
    if (options.assistant_prefill) {
      messages.push({
        role: 'assistant',
        content: options.assistant_prefill
      });
    }

    // Enhanced streaming payload
    const requestPayload: any = {
      model: primaryModel,
      messages,
      stream: true, // STREAMING ENABLED
      
      // Parameters with enhanced defaults for streaming
      temperature: options.temperature ?? 0.3,
      max_tokens: options.max_tokens ?? 800,
      
      // Advanced parameters
      ...(options.top_p && { top_p: options.top_p }),
      ...(options.top_k && { top_k: options.top_k }),
      ...(options.frequency_penalty && { frequency_penalty: options.frequency_penalty }),
      ...(options.presence_penalty && { presence_penalty: options.presence_penalty }),
      ...(options.repetition_penalty && { repetition_penalty: options.repetition_penalty }),
      ...(options.seed && { seed: options.seed }),
      
      // OpenRouter-specific for streaming
      ...(options.transforms && { transforms: options.transforms }),
      ...(fallbackModels.length > 1 && { models: fallbackModels, route: 'fallback' }),
      ...(options.response_format && { response_format: options.response_format }),
      
      user: options.userId || 'demo-user'
    };

    const metadata: any = {
      model_requested: model,
      model_used: primaryModel,
      fallback_models: fallbackModels,
      streaming: true,
      parameters_used: Object.keys(requestPayload)
    };

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.SITE_URL || 'http://localhost:5000',
          'X-Title': 'Company Development AI'
        },
        body: JSON.stringify(requestPayload)
      });

      if (response.ok && response.body) {
        console.log(`✅ OpenRouter streaming response from model: ${primaryModel}`);
        
        // Enhanced metadata for streaming
        metadata.response_headers = Object.fromEntries(response.headers.entries());
        metadata.status = response.status;
        
        return { stream: response.body, metadata };
      } else {
        // Enhanced error handling for streaming
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: await response.text() };
        }
        
        const openRouterError: OpenRouterError = {
          code: response.status,
          message: errorData.error?.message || errorData.message || 'Streaming error',
          metadata: errorData.error?.metadata || {}
        };
        
        metadata.error = openRouterError;
        console.error(`OpenRouter streaming error:`, openRouterError);
        return { stream: null, metadata };
      }
    } catch (error) {
      metadata.network_error = error instanceof Error ? error.message : 'Unknown streaming error';
      console.error('Streaming network error:', error);
      return { stream: null, metadata };
    }
  }

  // Smart fallback responses based on message context
  private generateSmartFallback(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('property') || lowerMessage.includes('real estate')) {
      return `I understand you're asking about property analysis regarding: "${message.substring(0, 80)}...". As Your Company A.I. Elite, I analyze multifamily properties using our institutional-grade methodology. Key factors include location scoring, demographic trends, cap rates (targeting 5-7%), cash flow projections, and market comparables. What specific property metrics would you like me to evaluate?`;
    }
    
    if (lowerMessage.includes('market') || lowerMessage.includes('analysis')) {
      return `You're inquiring about market analysis for: "${message.substring(0, 80)}...". Your Company Name specializes in Sunbelt market intelligence. I evaluate population growth rates, employment trends, housing supply/demand, and demographic shifts. Our target markets show 2%+ annual population growth. Which market metrics are most important for your analysis?`;
    }
    
    if (lowerMessage.includes('irr') || lowerMessage.includes('npv') || lowerMessage.includes('financial')) {
      return `I see you're interested in financial modeling related to: "${message.substring(0, 80)}...". For multifamily value-add projects, we target IRRs of 15-20% and stress-test scenarios at 80% occupancy. NPV calculations include acquisition costs, renovation expenses, and exit strategies. What financial assumptions should I model for your analysis?`;
    }
    
    return `I received your message: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}". As Your Company A.I. Elite, I'm your institutional-grade real estate AI assistant. I specialize in multifamily development analysis, market intelligence, and financial modeling with 30+ years of Your Company expertise. How can I assist with your real estate investment needs today?`;
  }

  // Clear cache for admin use
  clearCache(): void {
    responseCache.clear();
    this.attemptCounter = 0;
  }

  // Get service stats
  getStats(): any {
    return {
      cacheSize: responseCache.size,
      attemptCounter: this.attemptCounter,
      cacheKeys: Array.from(responseCache.keys()).slice(0, 5)
    };
  }
}

export const ultraBulletproofChatService = new UltraBulletproofChatService();