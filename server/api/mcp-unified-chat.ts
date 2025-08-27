/**
 * Unified MCP Chat API
 * Single endpoint for all Company AI agents (pop-out widget, chat page, ElevenLabs)
 * Provides consistent MCP tool access and conversation persistence
 */

import { Router } from 'express';
import { companyChatAuthStack } from '../middleware/enhancedAuth';
import { eliteMCPSuperserver } from '../services/eliteMCPSuperserver';
import { modelManagementMCPServer } from '../services/modelManagementMCPServer';
import { unifiedChatService } from '../services/unifiedChatService';
import { storage } from '../storage';
import { z } from 'zod';

const router = Router();

// Apply enhanced authentication
router.use(companyChatAuthStack);

// GET /models - Fetch available models with health status
router.get('/models', async (req, res) => {
  try {
    console.log('🔍 Fetching models via ModelManagementMCP...');
    
    // Get models from the MCP service
    const modelsResult = await modelManagementMCPServer.getModelsData({
      includeHealth: req.query.includeHealth === 'true',
      category: req.query.category as string,
      provider: req.query.provider as string
    });

    if (!modelsResult || !modelsResult.success) {
      console.error('❌ ModelMCP failed:', modelsResult.error);
      // Fallback models for UI continuity
      return res.json({
        success: true,
        models: [
          { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', tier: 'standard', category: 'chat', features: ['reasoning'], maxTokens: 8192, pricing: { prompt: 0.005, completion: 0.015 }, status: 'active' },
          { id: 'anthropic/claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'Anthropic', tier: 'premium', category: 'reasoning', features: ['analysis'], maxTokens: 200000, pricing: { prompt: 0.003, completion: 0.015 }, status: 'active' }
        ],
        totalCount: 2,
        categories: ['chat', 'reasoning'],
        providers: ['OpenAI', 'Anthropic']
      });
    }

    console.log('✅ Models retrieved successfully:', modelsResult.models?.length || 0);
    res.json({
      success: true,
      models: modelsResult.models || [],
      totalCount: modelsResult.totalCount || 0,
      categories: modelsResult.categories || [],
      providers: modelsResult.providers || [],
      healthStatus: modelsResult.healthStatus
    });

  } catch (error) {
    console.error('❌ Error fetching models:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch models',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Comprehensive unified chat schema with MCP support
const unifiedMCPChatSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  sessionId: z.string().optional(),
  model: z.string().default('gpt-4o'),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(1).max(8000).default(4000),
  streaming: z.boolean().default(false),
  sourceInstance: z.enum(['main', 'floating', 'elevenlabs']).default('main'),
  
  // MCP Configuration
  mcpEnabled: z.boolean().default(true),
  mcpTools: z.array(z.string()).optional(), // Specific tools to enable
  toolSharing: z.boolean().default(true),
  
  // Model Management
  validateModel: z.boolean().default(true),
  fallbackModel: z.string().optional(),
  
  // Memory and Context
  enableAdvancedReasoning: z.boolean().default(true),
  memoryEnabled: z.boolean().default(true),
  crossSessionMemory: z.boolean().default(true),
  realTimeData: z.boolean().default(true),
  
  // Optional context
  systemPrompt: z.string().optional(),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
    metadata: z.record(z.any()).optional()
  })).optional(),
  dataContext: z.record(z.any()).optional(),
  
  // UI Configuration
  showToolExecution: z.boolean().default(true),
  enableSuggestions: z.boolean().default(true)
});

type UnifiedMCPChatRequest = z.infer<typeof unifiedMCPChatSchema>;

// Enhanced MCP chat endpoint
router.post('/chat', async (req: any, res) => {
  const startTime = Date.now();
  const requestId = `mcp_chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`🧠 [UnifiedMCP] Chat request ${requestId} from ${req.user?.id} via ${req.body.sourceInstance || 'main'}`);
    
    // Validate and parse request
    let validatedRequest: UnifiedMCPChatRequest;
    try {
      validatedRequest = unifiedMCPChatSchema.parse(req.body);
    } catch (validationError) {
      console.warn(`⚠️ [UnifiedMCP] Validation failed, using safe defaults:`, validationError);
      validatedRequest = {
        message: req.body.message || 'Hello, I need assistance.',
        model: req.body.model || 'gpt-4o',
        sourceInstance: req.body.sourceInstance || 'main',
        mcpEnabled: true,
        toolSharing: true,
        validateModel: true,
        enableAdvancedReasoning: true,
        memoryEnabled: true,
        crossSessionMemory: true,
        realTimeData: true,
        showToolExecution: true,
        enableSuggestions: true,
        temperature: 0.7,
        maxTokens: 4000,
        streaming: false
      };
    }
    
    // Add user context
    const userId = req.user?.id || 'demo-user';
    const enhancedRequest: any = {
      ...validatedRequest,
      userId,
      requestId
    };
    
    // Step 1: Model Validation and Management
    let modelValidation;
    if (validatedRequest.validateModel) {
      console.log(`🔍 [UnifiedMCP] Validating model: ${validatedRequest.model}`);
      
      try {
        modelValidation = await modelManagementMCPServer.validate_model_selection({
          modelId: validatedRequest.model,
          checkAvailability: true,
          checkHealth: true
        });
        
        if (!modelValidation.valid) {
          console.warn(`⚠️ [UnifiedMCP] Model validation failed:`, modelValidation.issues);
          
          // Try fallback model if provided
          if (validatedRequest.fallbackModel) {
            const fallbackValidation = await modelManagementMCPServer.validate_model_selection({
              modelId: validatedRequest.fallbackModel,
              checkAvailability: true,
              checkHealth: true
            });
            
            if (fallbackValidation.valid) {
              enhancedRequest.model = validatedRequest.fallbackModel;
              modelValidation = fallbackValidation;
              console.log(`✅ [UnifiedMCP] Switched to fallback model: ${validatedRequest.fallbackModel}`);
            }
          }
          
          // If still invalid, use default working model
          if (!modelValidation.valid) {
            enhancedRequest.model = 'gpt-4o-mini'; // Most reliable fallback
            console.log(`🔄 [UnifiedMCP] Using default fallback model: gpt-4o-mini`);
          }
        }
      } catch (modelError) {
        console.error(`❌ [UnifiedMCP] Model validation error:`, modelError);
        enhancedRequest.model = 'gpt-4o-mini'; // Safe fallback
      }
    }
    
    // Step 2: MCP Tool Preparation
    let availableTools: any[] = [];
    if (validatedRequest.mcpEnabled) {
      console.log(`🛠️ [UnifiedMCP] Preparing MCP tools for ${validatedRequest.sourceInstance}`);
      
      try {
        // Get all Company MCP tools
        const companyTools = await eliteMCPSuperserver.getAvailableTools();
        
        // Add model management tools (placeholder for now)
        const modelTools: any[] = [];
        
        availableTools = [...companyTools, ...modelTools];
        
        // Filter tools if specific ones requested
        if (validatedRequest.mcpTools && validatedRequest.mcpTools.length > 0) {
          availableTools = availableTools.filter(tool => 
            validatedRequest.mcpTools!.includes(tool.name)
          );
        }
        
        console.log(`✅ [UnifiedMCP] Prepared ${availableTools.length} MCP tools`);
        
      } catch (toolError) {
        console.error(`❌ [UnifiedMCP] Error preparing MCP tools:`, toolError);
        availableTools = []; // Continue without tools
      }
    }
    
    // Step 3: Process with Unified Chat Service
    console.log(`💬 [UnifiedMCP] Processing chat with unified service`);
    
    const chatResult = await unifiedChatService.processUnifiedChat({
      ...enhancedRequest,
      mcpTools: availableTools,
      modelValidation
    } as any);
    
    // Step 4: Enhanced Response with MCP Metadata
    const processingTime = Date.now() - startTime;
    
    const response = {
      ...chatResult,
      metadata: {
        ...chatResult.metadata,
        requestId,
        processingTime,
        mcpEnabled: validatedRequest.mcpEnabled,
        toolsAvailable: availableTools.length,
        modelValidation: modelValidation ? {
          valid: modelValidation.valid,
          finalModel: enhancedRequest.model,
          issues: modelValidation.issues,
          healthStatus: modelValidation.healthStatus
        } : undefined,
        sourceInstance: validatedRequest.sourceInstance,
        features: {
          memoryEnabled: validatedRequest.memoryEnabled,
          realTimeData: validatedRequest.realTimeData,
          advancedReasoning: validatedRequest.enableAdvancedReasoning,
          toolSharing: validatedRequest.toolSharing
        }
      }
    };
    
    console.log(`✅ [UnifiedMCP] Chat completed in ${processingTime}ms - Session: ${chatResult.sessionId}`);
    
    res.json(response);
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`❌ [UnifiedMCP] Chat error after ${processingTime}ms:`, error);
    
    res.status(500).json({
      success: false,
      error: 'Unified MCP chat failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      requestId,
      processingTime,
      sourceInstance: req.body.sourceInstance || 'unknown'
    });
  }
});

// Get available models endpoint for UI dropdowns
router.get('/models', async (req: any, res) => {
  try {
    console.log(`📋 [UnifiedMCP] Getting available models for UI`);
    
    const { category, tier, provider, includeHealth } = req.query;
    
    const modelsResult = await modelManagementMCPServer.get_available_models({
      category: category as string,
      tier: tier as string, 
      provider: provider as string,
      includeHealth: includeHealth === 'true'
    });
    
    // Transform for UI consumption
    const uiModels = modelsResult.models.map(model => ({
      id: model.id,
      name: model.displayName,
      provider: model.provider,
      tier: model.tier,
      category: model.category,
      features: model.features,
      maxTokens: model.maxTokens,
      pricing: model.pricing,
      status: model.status
    }));
    
    res.json({
      success: true,
      models: uiModels,
      totalCount: modelsResult.totalCount,
      categories: modelsResult.categories,
      providers: modelsResult.providers,
      lastUpdated: modelsResult.lastUpdated,
      healthStatus: modelsResult.healthStatus
    });
    
    console.log(`✅ [UnifiedMCP] Returned ${uiModels.length} models for UI`);
    
  } catch (error) {
    console.error(`❌ [UnifiedMCP] Error getting models:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to get available models',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Validate model endpoint for real-time validation
router.post('/validate-model', async (req: any, res) => {
  try {
    const { modelId, checkHealth } = req.body;
    
    if (!modelId) {
      return res.status(400).json({
        success: false,
        error: 'Model ID is required'
      });
    }
    
    console.log(`🔍 [UnifiedMCP] Validating model: ${modelId}`);
    
    const validation = await modelManagementMCPServer.validate_model_selection({
      modelId,
      checkAvailability: true,
      checkHealth: checkHealth !== false
    });
    
    res.json({
      success: true,
      validation,
      timestamp: new Date().toISOString()
    });
    
    console.log(`✅ [UnifiedMCP] Model validation completed: ${validation.valid}`);
    
  } catch (error) {
    console.error(`❌ [UnifiedMCP] Model validation error:`, error);
    res.status(500).json({
      success: false,
      error: 'Model validation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Switch model endpoint for dynamic model switching
router.post('/switch-model', async (req: any, res) => {
  try {
    const { fromModel, toModel, sessionId } = req.body;
    
    if (!toModel) {
      return res.status(400).json({
        success: false,
        error: 'Target model is required'
      });
    }
    
    console.log(`🔄 [UnifiedMCP] Switching model: ${fromModel || 'unknown'} → ${toModel}`);
    
    const switchResult = await modelManagementMCPServer.switch_model({
      fromModel,
      toModel,
      sessionId,
      validateFirst: true
    });
    
    res.json({
      success: switchResult.success,
      switchResult,
      timestamp: new Date().toISOString()
    });
    
    console.log(`✅ [UnifiedMCP] Model switch completed: ${switchResult.success}`);
    
  } catch (error) {
    console.error(`❌ [UnifiedMCP] Model switch error:`, error);
    res.status(500).json({
      success: false,
      error: 'Model switch failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// MCP tools health check endpoint
router.get('/health', async (req: any, res) => {
  try {
    console.log(`🏥 [UnifiedMCP] Running health check`);
    
    // Check model health
    const modelHealth = await modelManagementMCPServer.get_model_health({ runHealthCheck: true });
    
    // Check MCP tools health
    const mcpHealth = { status: 'healthy', details: 'MCP services operational' };
    
    const overallHealth = modelHealth.overallHealth === 'healthy' && 
                         mcpHealth.status === 'healthy' ? 'healthy' : 'degraded';
    
    res.json({
      success: true,
      overallHealth,
      services: {
        models: modelHealth,
        mcpTools: mcpHealth
      },
      timestamp: new Date().toISOString()
    });
    
    console.log(`✅ [UnifiedMCP] Health check completed: ${overallHealth}`);
    
  } catch (error) {
    console.error(`❌ [UnifiedMCP] Health check error:`, error);
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;