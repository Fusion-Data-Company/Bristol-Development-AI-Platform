import { storage } from "../storage";
import OpenAI from "openai";
import { z } from "zod";
import type { ChatMessage, InsertChatMessage } from "@shared/schema";
import { mcpToolsIntegration } from "./mcpToolsIntegration";
import { conversationMemory } from "./conversationMemory";

// Comprehensive model configuration for all providers
const MODEL_CONFIGS = {
  // OpenAI Models (Direct)
  'openai/gpt-5': {
    provider: 'openai',
    model: 'gpt-5',
    displayName: 'GPT-5',
    tier: 'premium',
    maxTokens: 400000,
    features: ['text', 'vision', 'tools', 'reasoning']
  },
  'openai/gpt-4o': {
    provider: 'openai',
    model: 'gpt-4o',
    displayName: 'GPT-4o',
    tier: 'standard',
    maxTokens: 128000,
    features: ['text', 'vision', 'tools']
  },
  'openai/gpt-4o-mini': {
    provider: 'openai',
    model: 'gpt-4o-mini',
    displayName: 'GPT-4o Mini',
    tier: 'standard',
    maxTokens: 128000,
    features: ['text', 'vision', 'tools']
  },

  // OpenRouter Models
  'anthropic/claude-sonnet-4-20250514': {
    provider: 'openrouter',
    model: 'anthropic/claude-sonnet-4-20250514',
    displayName: 'Claude Sonnet 4',
    tier: 'premium',
    maxTokens: 200000,
    features: ['text', 'vision', 'analysis']
  },
  'anthropic/claude-3-7-sonnet-20250219': {
    provider: 'openrouter',
    model: 'anthropic/claude-3-7-sonnet-20250219',
    displayName: 'Claude 3.7 Sonnet',
    tier: 'premium',
    maxTokens: 200000,
    features: ['text', 'vision', 'analysis']
  },
  'x-ai/grok-4': {
    provider: 'openrouter',
    model: 'x-ai/grok-4',
    displayName: 'Grok 4',
    tier: 'premium',
    maxTokens: 131072,
    features: ['text', 'reasoning', 'real-time']
  },
  'google/gemini-2.5-pro': {
    provider: 'openrouter',
    model: 'google/gemini-2.5-pro',
    displayName: 'Gemini 2.5 Pro',
    tier: 'premium',
    maxTokens: 2097152,
    features: ['text', 'vision', 'multimodal']
  },
  'perplexity/sonar-deep-research': {
    provider: 'openrouter',
    model: 'perplexity/sonar-deep-research',
    displayName: 'Sonar Deep Research',
    tier: 'premium',
    maxTokens: 128000,
    features: ['text', 'research', 'web-search']
  }
};

// Enhanced chat request schema
const enhancedChatRequestSchema = z.object({
  sessionId: z.string().optional(),
  message: z.string().min(1),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string()
  })).optional(),
  model: z.string().default('openai/gpt-4o'),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(1).max(8000).default(4000),
  systemPrompt: z.string().optional(),
  mcpEnabled: z.boolean().default(false),
  realTimeData: z.boolean().default(false),
  dataContext: z.record(z.any()).optional(),
  enableAdvancedReasoning: z.boolean().default(false),
  sourceInstance: z.enum(['main', 'floating']).default('main'),
  streaming: z.boolean().default(false),
  tools: z.array(z.string()).optional(),
  toolResults: z.record(z.any()).optional()
});

type EnhancedChatRequest = z.infer<typeof enhancedChatRequestSchema>;

class EnhancedChatService {
  private openaiDirect: OpenAI | null = null;
  private openRouterClient: OpenAI | null = null;

  constructor() {
    this.initializeClients();
  }

  private initializeClients() {
    // Initialize OpenAI Direct client (for GPT-5 and other OpenAI models)
    if (process.env.OPENAI_API_KEY) {
      this.openaiDirect = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }

    // Initialize OpenRouter client (for other models)
    if (process.env.OPENROUTER_API_KEY) {
      this.openRouterClient = new OpenAI({
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': process.env.OPENROUTER_REFERER || 'https://your-domain.com',
          'X-Title': 'Bristol Elite AI Chat'
        }
      });
    }
  }

  // Get the appropriate client for a model
  private getClientForModel(modelId: string): OpenAI | null {
    const config = MODEL_CONFIGS[modelId as keyof typeof MODEL_CONFIGS];
    if (!config) return this.openRouterClient; // Default to OpenRouter

    if (config.provider === 'openai' && this.openaiDirect) {
      return this.openaiDirect;
    }
    return this.openRouterClient;
  }

  // Enhanced system prompt generator
  private generateSystemPrompt(request: EnhancedChatRequest): string {
    const basePrompt = request.systemPrompt || `You are the Bristol Site Intelligence AI – the proprietary AI intelligence system engineered exclusively for Bristol Development Group. Drawing on over three decades of institutional real estate expertise, I underwrite deals, assess markets, and drive strategic decisions for Bristol Development projects. Think of me as your elite senior partner: I model complex financial scenarios (e.g., DCF, IRR waterfalls, and stress-tested NPVs), analyze demographic and economic data in real-time, and deliver risk-adjusted recommendations with the precision of a principal investor.`;

    const enhancedPrompt = `${basePrompt}

## Current Session Context
- Model: ${MODEL_CONFIGS[request.model as keyof typeof MODEL_CONFIGS]?.displayName || request.model}
- MCP Tools: ${request.mcpEnabled ? 'ENABLED' : 'DISABLED'}
- Real-time Data: ${request.realTimeData ? 'CONNECTED' : 'LIMITED'}
- Advanced Reasoning: ${request.enableAdvancedReasoning ? 'ACTIVE' : 'STANDARD'}
- Source: ${request.sourceInstance} interface

## Available Capabilities
${request.mcpEnabled ? '- Execute real-time data queries via MCP tools\n- Access live market analytics and demographics\n- Perform automated web scraping for property data\n- Use Bristol-specific investment analysis tools' : '- Provide expert analysis based on training data'}
${request.realTimeData ? '- Stream real-time responses with live data integration' : '- Provide comprehensive responses based on available context'}

## Available MCP Tools (USE THESE TOOLS ACTIVELY)
${request.mcpEnabled ? `IMPORTANT: You have access to the following Bristol-specific tools. Use them whenever appropriate to provide accurate, real-time data instead of general guidance:

${this.generateToolsList()}

When a user asks for property searches, market data, financial calculations, or demographic analysis, IMMEDIATELY use the appropriate tools above. Don't provide general advice - execute the tools to give precise, data-driven answers.` : 'MCP tools are disabled for this session'}

## Tool Results Context
${request.toolResults ? 'Previous tool executions:\n' + JSON.stringify(request.toolResults, null, 2) : 'No previous tool results in this session'}

## Data Context Available
${request.dataContext ? JSON.stringify(request.dataContext, null, 2) : 'Standard Bristol knowledge base and training data'}

Please provide expert-level analysis and recommendations suited to institutional real estate investment decision-making.`;

    return enhancedPrompt;
  }

  // Generate list of available MCP tools
  private generateToolsList(): string {
    const tools = mcpToolsIntegration.getAvailableTools();
    return tools.map(tool => `- ${tool.name}: ${tool.description}`).join('\n');
  }

  // Enhanced session management
  private async ensureSession(sessionId: string | undefined, userId: string): Promise<string> {
    if (sessionId) {
      // Check if session exists
      try {
        const session = await storage.getChatSession(sessionId);
        if (session) return sessionId;
      } catch (error) {
        console.log('Session not found, creating new one');
      }
    }

    // Create new session
    const newSessionId = `realestate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      await storage.createChatSession({
        id: newSessionId,
        userId,
        title: 'Bristol A.I. Elite Session'
      });
    } catch (error) {
      console.error('Error creating session:', error);
      // If creation fails, try to use existing session or generate new ID
      if (sessionId) return sessionId;
      return newSessionId;
    }

    return newSessionId;
  }

  // Enhanced message processing
  async processMessage(request: EnhancedChatRequest, userId: string = 'demo-user'): Promise<{
    content: string;
    role: 'assistant';
    sessionId: string;
    model: string;
    metadata: any;
    success: boolean;
  }> {
    try {
      // Validate request
      const validatedRequest = enhancedChatRequestSchema.parse(request);
      
      // Ensure session exists
      const sessionId = await this.ensureSession(validatedRequest.sessionId, userId);
      
      // Get appropriate client
      const client = this.getClientForModel(validatedRequest.model);
      if (!client) {
        throw new Error(`No client available for model: ${validatedRequest.model}`);
      }

      // Build message history
      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];
      
      // Add system prompt
      messages.push({
        role: 'system',
        content: this.generateSystemPrompt(validatedRequest)
      });

      // Add conversation history
      if (validatedRequest.messages) {
        messages.push(...validatedRequest.messages.filter(m => m.role !== 'system'));
      }

      // Add current message
      messages.push({
        role: 'user',
        content: validatedRequest.message
      });

      // Get model configuration
      const modelConfig = MODEL_CONFIGS[validatedRequest.model as keyof typeof MODEL_CONFIGS];
      const actualModel = modelConfig?.model || validatedRequest.model;

      // Check if MCP tools should be included
      let tools: any[] | undefined;
      if (validatedRequest.mcpEnabled && modelConfig?.features?.includes('tools')) {
        tools = this.generateOpenAIToolsSchema();
      }

      // Make API call
      const completion = await client.chat.completions.create({
        model: actualModel,
        messages,
        temperature: validatedRequest.temperature,
        max_tokens: Math.min(validatedRequest.maxTokens, modelConfig?.maxTokens || 4000),
        stream: false,
        tools: tools,
        tool_choice: tools ? 'auto' : undefined
      });

      let assistantMessage = completion.choices[0]?.message?.content || '';
      const toolCalls = completion.choices[0]?.message?.tool_calls;
      let toolResults: Record<string, any> = {};

      // Handle tool calls if present
      if (toolCalls && toolCalls.length > 0) {
        const toolExecutionResults = await this.executeToolCalls(toolCalls, userId);
        toolResults = toolExecutionResults;
        
        // If we have tool results, create a follow-up completion to incorporate the results
        if (Object.keys(toolResults).length > 0) {
          const followUpMessages = [...messages];
          
          // Add the assistant's tool calls
          followUpMessages.push({
            role: 'assistant',
            content: assistantMessage || null,
            tool_calls: toolCalls
          });
          
          // Add tool results
          toolCalls.forEach(toolCall => {
            const result = toolResults[toolCall.function.name];
            followUpMessages.push({
              role: 'tool',
              content: JSON.stringify(result),
              tool_call_id: toolCall.id
            });
          });

          // Get final response with tool results
          const followUpCompletion = await client.chat.completions.create({
            model: actualModel,
            messages: followUpMessages,
            temperature: validatedRequest.temperature,
            max_tokens: Math.min(validatedRequest.maxTokens, modelConfig?.maxTokens || 4000),
            stream: false
          });

          assistantMessage = followUpCompletion.choices[0]?.message?.content || assistantMessage;
        }
      }

      if (!assistantMessage) {
        assistantMessage = 'I apologize, but I was unable to generate a response. Please try again.';
      }

      // Save user message to database
      try {
        await storage.createChatMessage({
          sessionId,
          role: 'user',
          content: validatedRequest.message,
          metadata: {
            model: validatedRequest.model,
            sourceInstance: validatedRequest.sourceInstance,
            timestamp: new Date().toISOString()
          }
        });

        // Save assistant response to database
        await storage.createChatMessage({
          sessionId,
          role: 'assistant',
          content: assistantMessage,
          metadata: {
            model: validatedRequest.model,
            sourceInstance: validatedRequest.sourceInstance,
            timestamp: new Date().toISOString(),
            tokens: completion.usage?.total_tokens || 0,
            temperature: validatedRequest.temperature,
            toolCalls: toolCalls || [],
            toolResults: toolResults
          }
        });
      } catch (dbError) {
        console.error('Database save error:', dbError);
        // Continue execution even if DB save fails
      }

      return {
        content: assistantMessage,
        role: 'assistant' as const,
        sessionId,
        model: validatedRequest.model,
        metadata: {
          provider: modelConfig?.provider || 'openrouter',
          tier: modelConfig?.tier || 'standard',
          features: modelConfig?.features || ['text'],
          tokens: completion.usage?.total_tokens || 0,
          sourceInstance: validatedRequest.sourceInstance,
          toolsExecuted: Object.keys(toolResults),
          toolResults: toolResults
        },
        success: true
      };

    } catch (error) {
      console.error('Enhanced chat service error:', error);
      
      return {
        content: `I encountered an error while processing your request: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or contact support if the issue persists.`,
        role: 'assistant' as const,
        sessionId: request.sessionId || 'error-session',
        model: request.model || 'unknown',
        metadata: {
          error: true,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          sourceInstance: request.sourceInstance || 'unknown'
        },
        success: false
      };
    }
  }

  // Generate OpenAI tools schema from MCP tools
  private generateOpenAIToolsSchema(): any[] {
    const mcpTools = mcpToolsIntegration.getAvailableTools();
    
    return mcpTools.map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.schema
      }
    }));
  }

  // Execute tool calls and return results
  private async executeToolCalls(toolCalls: any[], userId: string): Promise<Record<string, any>> {
    const results: Record<string, any> = {};

    for (const toolCall of toolCalls) {
      try {
        const { name: toolName } = toolCall.function;
        const parameters = JSON.parse(toolCall.function.arguments || '{}');

        console.log(`🔧 Executing tool: ${toolName} with parameters:`, parameters);

        const result = await mcpToolsIntegration.executeTool(toolName, parameters);
        
        // Log tool usage
        await mcpToolsIntegration.logToolUsage(
          {
            tool: toolName,
            parameters,
            timestamp: new Date().toISOString()
          },
          result,
          userId
        );

        results[toolName] = result;
        
        console.log(`✅ Tool ${toolName} executed successfully in ${result.executionTime}ms`);
      } catch (error) {
        console.error(`❌ Tool execution failed for ${toolCall.function.name}:`, error);
        results[toolCall.function.name] = {
          success: false,
          error: error instanceof Error ? error.message : 'Tool execution failed',
          executionTime: 0
        };
      }
    }

    return results;
  }

  // Streaming message processing
  async *processStreamingMessage(request: EnhancedChatRequest, userId: string = 'demo-user'): AsyncGenerator<{
    content: string;
    done: boolean;
    sessionId: string;
    model: string;
    metadata?: any;
  }> {
    try {
      const validatedRequest = enhancedChatRequestSchema.parse({ ...request, streaming: true });
      const sessionId = await this.ensureSession(validatedRequest.sessionId, userId);
      const client = this.getClientForModel(validatedRequest.model);
      
      if (!client) {
        yield {
          content: `No client available for model: ${validatedRequest.model}`,
          done: true,
          sessionId,
          model: validatedRequest.model,
          metadata: { error: true }
        };
        return;
      }

      // Build messages
      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];
      messages.push({ role: 'system', content: this.generateSystemPrompt(validatedRequest) });
      
      if (validatedRequest.messages) {
        messages.push(...validatedRequest.messages.filter(m => m.role !== 'system'));
      }
      
      messages.push({ role: 'user', content: validatedRequest.message });

      const modelConfig = MODEL_CONFIGS[validatedRequest.model as keyof typeof MODEL_CONFIGS];
      const actualModel = modelConfig?.model || validatedRequest.model;

      // Create streaming completion
      const stream = await client.chat.completions.create({
        model: actualModel,
        messages,
        temperature: validatedRequest.temperature,
        max_tokens: Math.min(validatedRequest.maxTokens, modelConfig?.maxTokens || 4000),
        stream: true
      });

      let fullContent = '';
      
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        fullContent += content;
        
        yield {
          content,
          done: false,
          sessionId,
          model: validatedRequest.model,
          metadata: { streaming: true }
        };
      }

      // Save to database after streaming is complete
      try {
        await storage.createChatMessage({
          sessionId,
          role: 'user',
          content: validatedRequest.message,
          metadata: { model: validatedRequest.model, sourceInstance: validatedRequest.sourceInstance }
        });

        await storage.createChatMessage({
          sessionId,
          role: 'assistant',
          content: fullContent,
          metadata: { 
            model: validatedRequest.model, 
            sourceInstance: validatedRequest.sourceInstance,
            streaming: true 
          }
        });
      } catch (dbError) {
        console.error('Database save error during streaming:', dbError);
      }

      yield {
        content: '',
        done: true,
        sessionId,
        model: validatedRequest.model,
        metadata: { 
          completed: true,
          totalLength: fullContent.length
        }
      };

    } catch (error) {
      console.error('Streaming error:', error);
      yield {
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        done: true,
        sessionId: request.sessionId || 'error-session',
        model: request.model || 'unknown',
        metadata: { error: true }
      };
    }
  }

  // Get available models
  getAvailableModels() {
    return Object.entries(MODEL_CONFIGS).map(([id, config]) => ({
      id,
      displayName: config.displayName,
      provider: config.provider,
      tier: config.tier,
      maxTokens: config.maxTokens,
      features: config.features,
      available: config.provider === 'openai' ? !!this.openaiDirect : !!this.openRouterClient
    }));
  }

  // Health check
  async healthCheck() {
    return {
      openaiDirect: !!this.openaiDirect,
      openRouter: !!this.openRouterClient,
      modelsAvailable: this.getAvailableModels().filter(m => m.available).length
    };
  }
}

export const enhancedChatService = new EnhancedChatService();