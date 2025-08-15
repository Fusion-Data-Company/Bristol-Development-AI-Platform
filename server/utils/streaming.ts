// Utility functions for enhanced streaming chat functionality

export interface StreamingMessage {
  content: string;
  model: string;
  provider: string;
  timestamp: string;
  done?: boolean;
  error?: string;
  tokens?: {
    completion: number;
    prompt: number;
    total: number;
  };
  metadata?: {
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: boolean;
  };
}

export interface StreamingConfig {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  mcpEnabled?: boolean;
  realTimeData?: boolean;
}

// Enhanced SSE response formatter
export const formatSSEMessage = (data: StreamingMessage): string => {
  return `data: ${JSON.stringify(data)}\n\n`;
};

// Provider-specific model mapping
export const getProviderModel = (modelId: string): { provider: string; model: string } => {
  if (modelId.includes('openai/') || modelId.includes('gpt')) {
    return {
      provider: 'openai',
      model: modelId.replace('openai/', '')
    };
  }
  
  if (modelId.includes('anthropic/') || modelId.includes('claude')) {
    return {
      provider: 'anthropic',
      model: modelId.includes('claude-sonnet-4') ? 'claude-sonnet-4-20250514' : 'claude-3-5-sonnet-20241022'
    };
  }
  
  if (modelId.includes('x-ai/') || modelId.includes('grok')) {
    return {
      provider: 'xai',
      model: modelId.replace('x-ai/', '')
    };
  }
  
  if (modelId.includes('google/') || modelId.includes('gemini')) {
    return {
      provider: 'google',
      model: modelId.replace('google/', '')
    };
  }
  
  if (modelId.includes('perplexity/') || modelId.includes('sonar')) {
    return {
      provider: 'perplexity',
      model: modelId.includes('huge') ? 'llama-3.1-sonar-huge-128k-online' : 'llama-3.1-sonar-large-128k-online'
    };
  }
  
  if (modelId.includes('openrouter/')) {
    return {
      provider: 'openrouter',
      model: modelId.replace('openrouter/', '')
    };
  }
  
  // Default fallback
  return {
    provider: 'openai',
    model: 'gpt-4o'
  };
};

// Message preparation utility
export const prepareMessages = (
  messages: Array<{ role: string; content: string }>,
  systemPrompt?: string,
  realTimeData?: boolean
): Array<{ role: string; content: string }> => {
  const finalMessages = [...messages];
  
  // Add system prompt if provided
  if (systemPrompt && !finalMessages.find(m => m.role === 'system')) {
    finalMessages.unshift({ role: 'system', content: systemPrompt });
  }
  
  // Add real-time context if enabled
  if (realTimeData) {
    const contextMessage = {
      role: 'system' as const,
      content: `Real-time context: Current timestamp: ${new Date().toISOString()}. You are Bristol AI Elite with access to live market data and MCP tools. Provide accurate, data-driven insights.`
    };
    
    // Insert after system prompt but before other messages
    const systemIndex = finalMessages.findIndex(m => m.role === 'system');
    if (systemIndex >= 0) {
      finalMessages.splice(systemIndex + 1, 0, contextMessage);
    } else {
      finalMessages.unshift(contextMessage);
    }
  }
  
  return finalMessages;
};

// Error handling utility for streaming
export const createStreamingError = (error: Error | string, model: string, provider: string): StreamingMessage => {
  return {
    content: '',
    model,
    provider,
    timestamp: new Date().toISOString(),
    error: error instanceof Error ? error.message : error,
    done: true
  };
};

// Completion message utility
export const createCompletionMessage = (model: string, provider: string, tokens?: any): StreamingMessage => {
  return {
    content: '',
    model,
    provider,
    timestamp: new Date().toISOString(),
    done: true,
    tokens: tokens && {
      completion: tokens.completion_tokens || 0,
      prompt: tokens.prompt_tokens || 0,
      total: tokens.total_tokens || 0
    }
  };
};

// Content chunk utility
export const createContentChunk = (content: string, model: string, provider: string): StreamingMessage => {
  return {
    content,
    model,
    provider,
    timestamp: new Date().toISOString(),
    done: false
  };
};

// Validate streaming configuration
export const validateStreamingConfig = (config: StreamingConfig): { valid: boolean; error?: string } => {
  if (!config.model) {
    return { valid: false, error: 'Model is required' };
  }
  
  if (!config.messages || config.messages.length === 0) {
    return { valid: false, error: 'Messages array cannot be empty' };
  }
  
  if (config.temperature !== undefined && (config.temperature < 0 || config.temperature > 2)) {
    return { valid: false, error: 'Temperature must be between 0 and 2' };
  }
  
  if (config.maxTokens !== undefined && (config.maxTokens < 1 || config.maxTokens > 8000)) {
    return { valid: false, error: 'Max tokens must be between 1 and 8000' };
  }
  
  return { valid: true };
};