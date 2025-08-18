/**
 * Model Management MCP Server
 * Dedicated MCP server for bulletproof OpenRouter.io model management
 * Handles model discovery, validation, switching, and health checks
 */

import fetch from 'node-fetch';
import { z } from 'zod';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// OpenRouter model schema based on official API docs
const OpenRouterModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  pricing: z.object({
    prompt: z.string(),
    completion: z.string()
  }),
  context_length: z.number(),
  architecture: z.object({
    modality: z.string(),
    tokenizer: z.string(),
    instruct_type: z.string().optional()
  }),
  top_provider: z.object({
    max_completion_tokens: z.number().optional(),
    is_moderated: z.boolean()
  }),
  per_request_limits: z.object({
    prompt_tokens: z.string().optional(),
    completion_tokens: z.string().optional()
  }).optional()
});

const ModelListSchema = z.object({
  data: z.array(OpenRouterModelSchema)
});

// Bristol model configuration with OpenRouter mapping
interface BristolModelConfig {
  id: string;
  displayName: string;
  provider: string;
  openrouterId: string;
  tier: 'free' | 'standard' | 'premium' | 'elite';
  category: 'chat' | 'reasoning' | 'coding' | 'research' | 'multimodal';
  maxTokens: number;
  features: string[];
  pricing: {
    prompt: number;
    completion: number;
  };
  status: 'active' | 'maintenance' | 'deprecated';
  lastHealthCheck?: string;
  errorRate?: number;
}

class ModelManagementMCPServer {
  private modelCache: Map<string, BristolModelConfig> = new Map();
  private lastCacheUpdate = 0;
  private readonly CACHE_TTL = 300000; // 5 minutes
  private healthCheckResults: Map<string, { status: boolean; lastCheck: string; latency?: number }> = new Map();

  // Bristol elite model configurations mapped to OpenRouter
  private readonly BRISTOL_MODEL_CONFIGS: BristolModelConfig[] = [
    // GPT Models
    {
      id: 'gpt-5',
      displayName: 'GPT-5 (Premium)',
      provider: 'OpenAI',
      openrouterId: 'openai/gpt-5',
      tier: 'elite',
      category: 'reasoning',
      maxTokens: 400000,
      features: ['reasoning', 'multimodal', 'tools', 'vision'],
      pricing: { prompt: 0.10, completion: 0.30 },
      status: 'active'
    },
    {
      id: 'gpt-4o',
      displayName: 'GPT-4o Turbo',
      provider: 'OpenAI',
      openrouterId: 'openai/gpt-4o',
      tier: 'standard',
      category: 'chat',
      maxTokens: 128000,
      features: ['multimodal', 'tools', 'vision'],
      pricing: { prompt: 0.005, completion: 0.015 },
      status: 'active'
    },
    {
      id: 'gpt-4o-mini',
      displayName: 'GPT-4o Mini',
      provider: 'OpenAI', 
      openrouterId: 'openai/gpt-4o-mini',
      tier: 'free',
      category: 'chat',
      maxTokens: 128000,
      features: ['multimodal', 'tools'],
      pricing: { prompt: 0.00015, completion: 0.0006 },
      status: 'active'
    },
    // Claude Models
    {
      id: 'claude-sonnet-4',
      displayName: 'Claude 4 Sonnet',
      provider: 'Anthropic',
      openrouterId: 'anthropic/claude-sonnet-4-20250514',
      tier: 'premium',
      category: 'reasoning',
      maxTokens: 200000,
      features: ['reasoning', 'analysis', 'coding'],
      pricing: { prompt: 0.03, completion: 0.15 },
      status: 'active'
    },
    {
      id: 'claude-3-7-sonnet',
      displayName: 'Claude 3.7 Sonnet',
      provider: 'Anthropic',
      openrouterId: 'anthropic/claude-3-7-sonnet-20250219',
      tier: 'premium',
      category: 'reasoning',
      maxTokens: 200000,
      features: ['reasoning', 'analysis', 'coding'],
      pricing: { prompt: 0.03, completion: 0.15 },
      status: 'active'
    },
    // Grok Models
    {
      id: 'grok-4',
      displayName: 'Grok 4 (Real-time)',
      provider: 'xAI',
      openrouterId: 'x-ai/grok-4',
      tier: 'premium',
      category: 'research',
      maxTokens: 131072,
      features: ['real-time', 'web-search', 'reasoning'],
      pricing: { prompt: 0.05, completion: 0.20 },
      status: 'active'
    },
    // Gemini Models
    {
      id: 'gemini-2-5-pro',
      displayName: 'Gemini 2.5 Pro',
      provider: 'Google',
      openrouterId: 'google/gemini-2.5-pro',
      tier: 'premium',
      category: 'multimodal',
      maxTokens: 2097152,
      features: ['multimodal', 'vision', 'reasoning'],
      pricing: { prompt: 0.00125, completion: 0.005 },
      status: 'active'
    },
    // Perplexity Models
    {
      id: 'sonar-deep-research',
      displayName: 'Sonar Deep Research',
      provider: 'Perplexity',
      openrouterId: 'perplexity/sonar-deep-research',
      tier: 'premium',
      category: 'research',
      maxTokens: 128000,
      features: ['research', 'web-search', 'citations'],
      pricing: { prompt: 0.005, completion: 0.005 },
      status: 'active'
    },
    {
      id: 'sonar-reasoning-pro',
      displayName: 'Sonar Reasoning Pro',
      provider: 'Perplexity',
      openrouterId: 'perplexity/sonar-reasoning-pro',
      tier: 'premium',
      category: 'reasoning',
      maxTokens: 131072,
      features: ['reasoning', 'analysis', 'citations'],
      pricing: { prompt: 0.02, completion: 0.02 },
      status: 'active'
    }
  ];

  constructor() {
    // Initialize model cache
    this.BRISTOL_MODEL_CONFIGS.forEach(config => {
      this.modelCache.set(config.id, config);
    });
    
    // Start periodic health checks
    this.startHealthCheckCycle();
  }

  // MCP Tool: Get Available Models
  async get_available_models(params: { 
    category?: string; 
    tier?: string; 
    provider?: string;
    includeHealth?: boolean;
  } = {}): Promise<{
    models: BristolModelConfig[];
    totalCount: number;
    categories: string[];
    providers: string[];
    lastUpdated: string;
    healthStatus?: Record<string, any>;
  }> {
    console.log(`🤖 [ModelMCP] Getting available models with filters:`, params);
    
    try {
      // Refresh cache if needed
      await this.refreshModelCache();
      
      let models = Array.from(this.modelCache.values());
      
      // Apply filters
      if (params.category) {
        models = models.filter(m => m.category === params.category);
      }
      if (params.tier) {
        models = models.filter(m => m.tier === params.tier);
      }
      if (params.provider) {
        models = models.filter(m => m.provider.toLowerCase() === params.provider!.toLowerCase());
      }
      
      // Only include active models
      models = models.filter(m => m.status === 'active');
      
      const categories = Array.from(new Set(models.map(m => m.category)));
      const providers = Array.from(new Set(models.map(m => m.provider)));
      
      const result: any = {
        models,
        totalCount: models.length,
        categories,
        providers,
        lastUpdated: new Date().toISOString()
      };
      
      if (params.includeHealth) {
        result.healthStatus = Object.fromEntries(this.healthCheckResults);
      }
      
      console.log(`✅ [ModelMCP] Returning ${models.length} models`);
      return result;
      
    } catch (error) {
      console.error(`❌ [ModelMCP] Error getting models:`, error);
      throw new Error(`Failed to get available models: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // MCP Tool: Validate Model Selection
  async validate_model_selection(params: { 
    modelId: string; 
    checkAvailability?: boolean;
    checkHealth?: boolean;
  }): Promise<{
    valid: boolean;
    model?: BristolModelConfig;
    openrouterModel?: any;
    healthStatus?: any;
    issues?: string[];
    recommendation?: string;
  }> {
    console.log(`🔍 [ModelMCP] Validating model selection: ${params.modelId}`);
    
    try {
      const model = this.modelCache.get(params.modelId);
      
      if (!model) {
        return {
          valid: false,
          issues: [`Model '${params.modelId}' not found in Bristol model registry`],
          recommendation: 'Use get_available_models to see valid options'
        };
      }
      
      const result: any = {
        valid: true,
        model
      };
      
      // Check OpenRouter availability
      if (params.checkAvailability) {
        try {
          const openrouterModel = await this.getOpenRouterModelDetails(model.openrouterId);
          result.openrouterModel = openrouterModel;
        } catch (error) {
          result.valid = false;
          result.issues = [`Model not available on OpenRouter: ${error instanceof Error ? error.message : 'Unknown error'}`];
        }
      }
      
      // Check health status
      if (params.checkHealth) {
        const health = this.healthCheckResults.get(params.modelId);
        result.healthStatus = health;
        
        if (health && !health.status) {
          result.issues = result.issues || [];
          result.issues.push('Model is currently experiencing health issues');
          result.recommendation = 'Consider using an alternative model';
        }
      }
      
      console.log(`✅ [ModelMCP] Model validation result:`, { valid: result.valid, modelId: params.modelId });
      return result;
      
    } catch (error) {
      console.error(`❌ [ModelMCP] Error validating model:`, error);
      throw new Error(`Failed to validate model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // MCP Tool: Switch Model with Validation
  async switch_model(params: { 
    fromModel?: string;
    toModel: string; 
    sessionId?: string;
    validateFirst?: boolean;
  }): Promise<{
    success: boolean;
    fromModel?: BristolModelConfig;
    toModel: BristolModelConfig;
    switchTime: string;
    sessionId?: string;
    validation?: any;
    issues?: string[];
  }> {
    console.log(`🔄 [ModelMCP] Switching model: ${params.fromModel || 'unknown'} → ${params.toModel}`);
    
    try {
      // Validate target model first
      let validation;
      if (params.validateFirst !== false) {
        validation = await this.validate_model_selection({ 
          modelId: params.toModel, 
          checkAvailability: true, 
          checkHealth: true 
        });
        
        if (!validation.valid) {
          return {
            success: false,
            toModel: this.modelCache.get(params.toModel)!,
            switchTime: new Date().toISOString(),
            validation,
            issues: validation.issues
          };
        }
      }
      
      const fromModel = params.fromModel ? this.modelCache.get(params.fromModel) : undefined;
      const toModel = this.modelCache.get(params.toModel);
      
      if (!toModel) {
        throw new Error(`Target model '${params.toModel}' not found`);
      }
      
      // Record the switch
      const switchTime = new Date().toISOString();
      
      console.log(`✅ [ModelMCP] Successfully switched to model: ${params.toModel}`);
      
      return {
        success: true,
        fromModel,
        toModel,
        switchTime,
        sessionId: params.sessionId,
        validation
      };
      
    } catch (error) {
      console.error(`❌ [ModelMCP] Error switching model:`, error);
      throw new Error(`Failed to switch model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // MCP Tool: Get Model Health Status
  async get_model_health(params: { 
    modelId?: string;
    runHealthCheck?: boolean;
  } = {}): Promise<{
    modelId?: string;
    healthStatus: any;
    lastCheck: string;
    overallHealth: 'healthy' | 'degraded' | 'unhealthy';
  } | {
    allModels: Record<string, any>;
    overallHealth: 'healthy' | 'degraded' | 'unhealthy';
    healthySummary: { healthy: number; degraded: number; unhealthy: number };
  }> {
    console.log(`🏥 [ModelMCP] Getting model health status for:`, params.modelId || 'all models');
    
    try {
      if (params.runHealthCheck) {
        await this.runHealthChecks();
      }
      
      if (params.modelId) {
        const health = this.healthCheckResults.get(params.modelId);
        return {
          modelId: params.modelId,
          healthStatus: health || { status: false, lastCheck: 'never', error: 'No health data available' },
          lastCheck: health?.lastCheck || 'never',
          overallHealth: health?.status ? 'healthy' : 'unhealthy'
        };
      } else {
        const allModels = Object.fromEntries(Array.from(this.healthCheckResults.entries()));
        const healthCounts = { healthy: 0, degraded: 0, unhealthy: 0 };
        
        for (const [_, health] of Array.from(this.healthCheckResults.entries())) {
          if (health.status) {
            healthCounts.healthy++;
          } else {
            healthCounts.unhealthy++;
          }
        }
        
        const overallHealth = healthCounts.unhealthy === 0 ? 'healthy' : 
                             healthCounts.healthy > healthCounts.unhealthy ? 'degraded' : 'unhealthy';
        
        return {
          allModels,
          overallHealth,
          healthySummary: healthCounts
        };
      }
      
    } catch (error) {
      console.error(`❌ [ModelMCP] Error getting health status:`, error);
      throw new Error(`Failed to get model health: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Private: Refresh model cache from OpenRouter
  private async refreshModelCache(): Promise<void> {
    const now = Date.now();
    if (now - this.lastCacheUpdate < this.CACHE_TTL) {
      return; // Cache still valid
    }
    
    try {
      console.log(`🔄 [ModelMCP] Refreshing model cache from OpenRouter...`);
      
      const response = await fetch(`${OPENROUTER_BASE_URL}/models`, {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      const modelList = ModelListSchema.parse(data);
      
      // Update Bristol models with OpenRouter data
      for (const bristolModel of this.BRISTOL_MODEL_CONFIGS) {
        const openrouterModel = modelList.data.find(m => m.id === bristolModel.openrouterId);
        if (openrouterModel) {
          bristolModel.maxTokens = openrouterModel.context_length;
          bristolModel.pricing = {
            prompt: parseFloat(openrouterModel.pricing.prompt),
            completion: parseFloat(openrouterModel.pricing.completion)
          };
        }
        this.modelCache.set(bristolModel.id, bristolModel);
      }
      
      this.lastCacheUpdate = now;
      console.log(`✅ [ModelMCP] Model cache refreshed with ${this.modelCache.size} models`);
      
    } catch (error) {
      console.warn(`⚠️ [ModelMCP] Failed to refresh cache, using existing data:`, error);
    }
  }

  // Private: Get OpenRouter model details
  private async getOpenRouterModelDetails(openrouterId: string): Promise<any> {
    const response = await fetch(`${OPENROUTER_BASE_URL}/models`, {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }
    
    const data = await response.json();
    const modelList = ModelListSchema.parse(data);
    const model = modelList.data.find(m => m.id === openrouterId);
    
    if (!model) {
      throw new Error(`Model ${openrouterId} not found on OpenRouter`);
    }
    
    return model;
  }

  // Private: Health check cycle
  private startHealthCheckCycle(): void {
    // Run health checks every 10 minutes
    setInterval(() => {
      this.runHealthChecks().catch(error => {
        console.warn(`⚠️ [ModelMCP] Health check cycle failed:`, error);
      });
    }, 600000); // 10 minutes
    
    // Initial health check
    setTimeout(() => {
      this.runHealthChecks().catch(console.warn);
    }, 5000); // 5 seconds after startup
  }

  // Private: Run health checks for all models
  private async runHealthChecks(): Promise<void> {
    console.log(`🏥 [ModelMCP] Running health checks for ${this.modelCache.size} models...`);
    
    const healthPromises = Array.from(this.modelCache.keys()).map(async (modelId) => {
      try {
        const startTime = Date.now();
        
        // Simple health check - validate model exists on OpenRouter
        const model = this.modelCache.get(modelId);
        if (!model) return;
        
        await this.getOpenRouterModelDetails(model.openrouterId);
        
        const latency = Date.now() - startTime;
        
        this.healthCheckResults.set(modelId, {
          status: true,
          lastCheck: new Date().toISOString(),
          latency
        });
        
      } catch (error) {
        this.healthCheckResults.set(modelId, {
          status: false,
          lastCheck: new Date().toISOString(),
          latency: undefined
        });
      }
    });
    
    await Promise.allSettled(healthPromises);
    
    const healthyCount = Array.from(this.healthCheckResults.values()).filter(h => h.status).length;
    console.log(`✅ [ModelMCP] Health checks completed: ${healthyCount}/${this.modelCache.size} models healthy`);
  }

  // Get all MCP tools for registration
  getMCPTools() {
    return [
      {
        name: 'get_available_models',
        description: 'Get list of available Bristol AI models with filtering options',
        inputSchema: {
          type: 'object',
          properties: {
            category: { type: 'string', description: 'Filter by category (chat, reasoning, coding, research, multimodal)' },
            tier: { type: 'string', description: 'Filter by tier (free, standard, premium, elite)' },
            provider: { type: 'string', description: 'Filter by provider (OpenAI, Anthropic, etc.)' },
            includeHealth: { type: 'boolean', description: 'Include health status information' }
          }
        }
      },
      {
        name: 'validate_model_selection',
        description: 'Validate a model selection and check availability/health',
        inputSchema: {
          type: 'object',
          properties: {
            modelId: { type: 'string', description: 'Bristol model ID to validate' },
            checkAvailability: { type: 'boolean', description: 'Check OpenRouter availability' },
            checkHealth: { type: 'boolean', description: 'Check model health status' }
          },
          required: ['modelId']
        }
      },
      {
        name: 'switch_model',
        description: 'Switch from one model to another with validation',
        inputSchema: {
          type: 'object',
          properties: {
            fromModel: { type: 'string', description: 'Current model ID' },
            toModel: { type: 'string', description: 'Target model ID' },
            sessionId: { type: 'string', description: 'Session ID for tracking' },
            validateFirst: { type: 'boolean', description: 'Validate target model first (default: true)' }
          },
          required: ['toModel']
        }
      },
      {
        name: 'get_model_health',
        description: 'Get health status for specific model or all models',
        inputSchema: {
          type: 'object',
          properties: {
            modelId: { type: 'string', description: 'Specific model ID (omit for all models)' },
            runHealthCheck: { type: 'boolean', description: 'Run fresh health check' }
          }
        }
      }
    ];
  }
}

export const modelManagementMCPServer = new ModelManagementMCPServer();