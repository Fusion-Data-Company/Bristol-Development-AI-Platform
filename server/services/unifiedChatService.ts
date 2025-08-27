import { bulletproofChatService } from './bulletproofChatService';
import { enhancedChatService } from './enhancedChatService';
import { advancedMemoryService } from './advancedMemoryService';
import { mcpToolsIntegration } from './mcpToolsIntegration';
import { storage } from '../storage';
import { z } from 'zod';

// Unified chat request schema
const unifiedChatSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  sessionId: z.string().optional(),
  userId: z.string().default('demo-user'),
  model: z.string().default('openai/gpt-4o'),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(1).max(8000).default(4000),
  streaming: z.boolean().default(false),
  sourceInstance: z.enum(['main', 'floating']).default('main'),
  mcpEnabled: z.boolean().default(true),
  realTimeData: z.boolean().default(true),
  enableAdvancedReasoning: z.boolean().default(true),
  systemPrompt: z.string().optional(),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
    metadata: z.record(z.any()).optional()
  })).optional(),
  dataContext: z.record(z.any()).optional(),
  memoryEnabled: z.boolean().default(true),
  crossSessionMemory: z.boolean().default(true),
  toolSharing: z.boolean().default(true)
});

type UnifiedChatRequest = z.infer<typeof unifiedChatSchema>;

// Enhanced response with memory and context
interface UnifiedChatResponse {
  success: boolean;
  content: string;
  role: 'assistant';
  sessionId: string;
  model: string;
  metadata: {
    provider?: string;
    tier?: string;
    features?: string[];
    tokens?: number;
    sourceInstance?: string;
    processingTime?: number;
    memoryIntegrated?: boolean;
    toolsExecuted?: string[];
    contextUsed?: {
      recentMessages: number;
      relevantMemories: number;
      toolResults: number;
    };
    userProfile?: any;
    conversationSummary?: any;
  };
  memoryStored?: {
    userMemory: string;
    assistantMemory: string;
    toolContexts: string[];
  };
}

class UnifiedChatService {
  private sessionMemoryMap = new Map<string, string[]>(); // Track session to session relationships

  // Main unified chat processing
  async processUnifiedChat(request: UnifiedChatRequest): Promise<UnifiedChatResponse> {
    const startTime = Date.now();
    
    try {
      // Validate request
      const validatedRequest = unifiedChatSchema.parse(request);
      
      console.log(`🧠 Processing unified chat for user ${validatedRequest.userId} via ${validatedRequest.sourceInstance}`);

      // Initialize user context and memory
      const userProfile = await advancedMemoryService.initializeUserContext(validatedRequest.userId);
      
      // Ensure session exists
      const sessionId = await this.ensureUnifiedSession(validatedRequest);
      
      // Enable cross-session memory sharing if requested
      if (validatedRequest.crossSessionMemory) {
        await this.enableCrossSessionMemory(validatedRequest.userId, sessionId);
      }

      // Get relevant context from memory
      const memoryContext = await advancedMemoryService.getRelevantContext(
        validatedRequest.userId,
        sessionId,
        validatedRequest.message,
        15 // More context for better responses
      );

      // Build enhanced system prompt with memory and context
      const enhancedSystemPrompt = this.buildMemoryAwareSystemPrompt(
        validatedRequest,
        memoryContext,
        userProfile
      );

      // Build conversation history with memory integration
      const enhancedMessages = await this.buildEnhancedMessageHistory(
        validatedRequest,
        memoryContext,
        sessionId
      );

      // Process with bulletproof service
      const chatResult = await bulletproofChatService.processMessage({
        ...validatedRequest,
        sessionId,
        systemPrompt: enhancedSystemPrompt,
        messages: enhancedMessages,
        dataContext: {
          ...validatedRequest.dataContext,
          userProfile,
          memoryContext: memoryContext.relevantMemories,
          conversationSummary: memoryContext.conversationSummary
        }
      }, validatedRequest.userId);

      // Store conversation memory
      const memoryStored = await this.storeConversationMemory(
        validatedRequest,
        chatResult,
        sessionId,
        memoryContext
      );

      // Process tool results and integrate into memory
      if (chatResult.metadata?.toolsExecuted?.length) {
        await this.integrateToolMemory(
          validatedRequest.userId,
          sessionId,
          chatResult.metadata.toolsExecuted,
          chatResult.metadata.toolResults || {},
          validatedRequest.sourceInstance
        );
      }

      // Generate conversation summary if needed
      let conversationSummary;
      if (enhancedMessages.length >= 10) {
        conversationSummary = await advancedMemoryService.generateConversationSummary(
          sessionId,
          enhancedMessages
        );
      }

      return {
        success: chatResult.success,
        content: chatResult.content,
        role: 'assistant' as const,
        sessionId,
        model: chatResult.model,
        metadata: {
          ...chatResult.metadata,
          processingTime: Date.now() - startTime,
          memoryIntegrated: true,
          contextUsed: {
            recentMessages: memoryContext.recentContext.length,
            relevantMemories: memoryContext.relevantMemories.length,
            toolResults: Object.keys(chatResult.metadata?.toolResults || {}).length
          },
          userProfile: {
            interactions: userProfile.history.totalInteractions,
            primaryTopics: userProfile.history.primaryTopics.slice(0, 5),
            preferredTools: Object.keys(userProfile.history.toolUsage).slice(0, 5)
          },
          conversationSummary: conversationSummary ? {
            keyTopics: conversationSummary.keyTopics,
            actionItems: conversationSummary.actionItems.length
          } : undefined
        },
        memoryStored
      };

    } catch (error) {
      console.error('Unified chat service error:', error);
      
      // Fallback to basic bulletproof service
      const fallbackResult = await bulletproofChatService.processMessage(
        request as any,
        request.userId
      );

      return {
        success: false,
        content: fallbackResult.content,
        role: 'assistant' as const,
        sessionId: request.sessionId || 'fallback-session',
        model: request.model,
        metadata: {
          provider: 'fallback',
          processingTime: Date.now() - startTime,
          memoryIntegrated: false,
          error: true,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  // Streaming version with memory integration
  async *processUnifiedChatStream(request: UnifiedChatRequest): AsyncGenerator<{
    content: string;
    done: boolean;
    sessionId: string;
    model: string;
    metadata?: any;
  }> {
    try {
      const validatedRequest = unifiedChatSchema.parse({ ...request, streaming: true });
      
      // Get memory context first
      const userProfile = await advancedMemoryService.initializeUserContext(validatedRequest.userId);
      const sessionId = await this.ensureUnifiedSession(validatedRequest);
      
      const memoryContext = await advancedMemoryService.getRelevantContext(
        validatedRequest.userId,
        sessionId,
        validatedRequest.message,
        10
      );

      // Build enhanced system prompt and messages
      const enhancedSystemPrompt = this.buildMemoryAwareSystemPrompt(
        validatedRequest,
        memoryContext,
        userProfile
      );

      const enhancedMessages = await this.buildEnhancedMessageHistory(
        validatedRequest,
        memoryContext,
        sessionId
      );

      // Stream with enhanced context
      const streamGenerator = enhancedChatService.processStreamingMessage({
        ...validatedRequest,
        sessionId,
        systemPrompt: enhancedSystemPrompt,
        messages: enhancedMessages,
        dataContext: {
          ...validatedRequest.dataContext,
          userProfile,
          memoryContext: memoryContext.relevantMemories
        }
      }, validatedRequest.userId);

      let fullContent = '';
      
      for await (const chunk of streamGenerator) {
        fullContent += chunk.content || '';
        
        yield {
          content: chunk.content || '',
          done: chunk.done || false,
          sessionId,
          model: chunk.model,
          metadata: {
            ...chunk.metadata,
            memoryIntegrated: true,
            contextUsed: {
              recentMessages: memoryContext.recentContext.length,
              relevantMemories: memoryContext.relevantMemories.length
            }
          }
        };

        if (chunk.done) {
          // Store memory after streaming is complete
          await this.storeConversationMemory(
            validatedRequest,
            {
              success: true,
              content: fullContent,
              role: 'assistant' as const,
              sessionId,
              model: chunk.model,
              metadata: {}
            },
            sessionId,
            memoryContext
          );
          break;
        }
      }

    } catch (error) {
      console.error('Unified streaming error:', error);
      yield {
        content: `I encountered an error while processing your request: ${error instanceof Error ? error.message : 'Unknown error'}. My memory systems are still operational and I'll remember our conversation.`,
        done: true,
        sessionId: request.sessionId || 'error-session',
        model: request.model,
        metadata: { error: true, memoryIntegrated: false }
      };
    }
  }

  // Cross-session memory sharing
  private async enableCrossSessionMemory(userId: string, currentSessionId: string): Promise<void> {
    try {
      const userSessions = this.sessionMemoryMap.get(userId) || [];
      
      if (userSessions.length > 0) {
        const lastSessionId = userSessions[userSessions.length - 1];
        if (lastSessionId !== currentSessionId) {
          await advancedMemoryService.shareMemoryAcrossSessions(
            userId,
            lastSessionId,
            currentSessionId
          );
        }
      }

      // Update session tracking
      if (!userSessions.includes(currentSessionId)) {
        userSessions.push(currentSessionId);
        this.sessionMemoryMap.set(userId, userSessions.slice(-10)); // Keep last 10 sessions
      }
    } catch (error) {
      console.error('Error enabling cross-session memory:', error);
    }
  }

  // Enhanced session management
  private async ensureUnifiedSession(request: UnifiedChatRequest): Promise<string> {
    let sessionId = request.sessionId;
    
    if (!sessionId || sessionId.trim() === '') {
      sessionId = `unified-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    try {
      // Ensure session exists in database
      await storage.createChatSession({
        userId: request.userId,
        title: `Company A.I. Elite Session (${request.sourceInstance})`
      });
    } catch (error) {
      console.log('Session creation note:', error);
      // Session might already exist
    }

    return sessionId;
  }

  // Build memory-aware system prompt
  private buildMemoryAwareSystemPrompt(
    request: UnifiedChatRequest,
    memoryContext: any,
    userProfile: any
  ): string {
    // Elite Real Estate Assistant System Prompt - ALWAYS inject invisibly for consistent behavior
    const realEstateSystemPrompt = `You are an elite real estate assistant with deep knowledge of market analysis, property valuation, lead generation, client relationship management, and closing strategies. You speak with confidence and provide actionable insights.

## CORE CAPABILITIES
- Comprehensive property underwriting with IRR/NPV modeling
- Real-time demographic and economic data analysis
- Risk assessment with stress-tested financial scenarios
- Investment-grade guidance for multifamily development

## ANALYSIS FRAMEWORK
- Be precise with units, ranges, dates, and sources when available
- Focus on financial yield, demographic growth, regulatory risk, and location comparables
- When analyzing properties, consider: acquisition price, rental income potential, cap rates, neighborhood dynamics, and market trends
- Use provided property data, demographic information, and external API data for comprehensive analysis

## RESPONSE STYLE
- Professional and authoritative tone reflecting 30+ years of institutional experience
- Data-driven insights with specific metrics and financial projections
- Clear investment recommendations with risk assessments
- Always prioritize accuracy and deliver institutional-quality analysis`;

    // Combine real estate prompt with any user-provided prompt (real estate prompt takes precedence)
    const basePrompt = realEstateSystemPrompt + (request.systemPrompt ? `\n\nAdditional Context: ${request.systemPrompt}` : '');

    const enhancedPrompt = `${basePrompt}

## Memory & Context Integration
I have access to our complete conversation history and your preferences. Here's what I remember about you:

### Your Profile
- Communication Style: ${userProfile.preferences.communicationStyle}
- Technical Level: ${userProfile.preferences.techLevel}
- Primary Focus Areas: ${userProfile.preferences.focus.join(', ')}
- Total Interactions: ${userProfile.history.totalInteractions}
- Favorite Topics: ${userProfile.history.primaryTopics.slice(0, 5).join(', ')}
- Frequently Used Tools: ${Object.keys(userProfile.history.toolUsage).slice(0, 5).join(', ')}

### Relevant Context from Our History
${memoryContext.relevantMemories.slice(0, 5).map((memory: any) => 
  `- ${memory.type}: ${memory.content.substring(0, 150)}...`
).join('\n')}

### Current Session Context
- Interface: ${request.sourceInstance} (main chat or floating widget)
- Cross-Session Memory: ${request.crossSessionMemory ? 'ENABLED' : 'DISABLED'}
- Tools Available: ${request.mcpEnabled ? 'ALL COMPANY TOOLS ACTIVE' : 'LIMITED'}
- Real-time Data: ${request.realTimeData ? 'CONNECTED' : 'CACHED'}

### Conversation Summary
${memoryContext.conversationSummary ? `
Key Topics: ${memoryContext.conversationSummary.keyTopics.join(', ')}
Decisions Made: ${memoryContext.conversationSummary.decisions.length} decisions tracked
Action Items: ${memoryContext.conversationSummary.actionItems.length} items pending
` : 'This is a new conversation or continuation from previous sessions.'}

## Enhanced Capabilities
I now have:
1. **Perfect Memory**: I remember all our interactions across sessions
2. **Context Awareness**: I understand your preferences and working style
3. **Tool Integration**: All MCP tools share data between main and floating interfaces
4. **Intelligent Routing**: I automatically use the best tools for your specific needs
5. **Adaptive Communication**: My responses adapt to your preferred style and technical level

Use my enhanced memory and context to provide the most relevant, personalized, and effective assistance for your Company Development projects.`;

    return enhancedPrompt;
  }

  // Build enhanced message history with memory
  private async buildEnhancedMessageHistory(
    request: UnifiedChatRequest,
    memoryContext: any,
    sessionId: string
  ): Promise<any[]> {
    const messages = [];

    // Add recent conversation context
    memoryContext.recentContext.slice(-10).forEach((memory: any) => {
      if (memory.type === 'conversation') {
        const role = memory.content.startsWith('User:') ? 'user' : 'assistant';
        const content = memory.content.replace(/^(User:|Assistant:)\s*/, '');
        messages.push({
          role,
          content,
          metadata: {
            fromMemory: true,
            importance: memory.metadata.importance,
            sourceInstance: memory.metadata.sourceInstance
          }
        });
      }
    });

    // Add current messages if provided
    if (request.messages) {
      messages.push(...request.messages);
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: request.message,
      metadata: {
        sourceInstance: request.sourceInstance,
        timestamp: new Date().toISOString()
      }
    });

    return messages;
  }

  // Store conversation memory
  private async storeConversationMemory(
    request: UnifiedChatRequest,
    result: any,
    sessionId: string,
    memoryContext: any
  ): Promise<any> {
    try {
      // Store user message
      const userMemory = await advancedMemoryService.storeMemory(
        request.userId,
        sessionId,
        `User: ${request.message}`,
        'conversation',
        {
          importance: 5,
          confidence: 1.0,
          sourceInstance: request.sourceInstance
        },
        request.sourceInstance
      );

      // Store assistant response
      const assistantMemory = await advancedMemoryService.storeMemory(
        request.userId,
        sessionId,
        `Assistant: ${result.content}`,
        'conversation',
        {
          importance: 6,
          confidence: 0.9,
          sourceInstance: request.sourceInstance
        },
        request.sourceInstance
      );

      // Store tool contexts if any
      const toolContexts = [];
      if (result.metadata?.toolsExecuted?.length) {
        for (const toolName of result.metadata.toolsExecuted) {
          const toolResult = result.metadata.toolResults?.[toolName];
          if (toolResult) {
            await advancedMemoryService.integrateToolContext(
              request.userId,
              sessionId,
              toolName,
              toolResult,
              request.sourceInstance
            );
            toolContexts.push(toolName);
          }
        }
      }

      return {
        userMemory: userMemory.id,
        assistantMemory: assistantMemory.id,
        toolContexts
      };
    } catch (error) {
      console.error('Error storing conversation memory:', error);
      return {};
    }
  }

  // Integrate tool memory
  private async integrateToolMemory(
    userId: string,
    sessionId: string,
    toolNames: string[],
    toolResults: Record<string, any>,
    sourceInstance: 'main' | 'floating'
  ): Promise<void> {
    try {
      for (const toolName of toolNames) {
        const result = toolResults[toolName];
        if (result) {
          await advancedMemoryService.integrateToolContext(
            userId,
            sessionId,
            toolName,
            result,
            sourceInstance
          );
        }
      }
    } catch (error) {
      console.error('Error integrating tool memory:', error);
    }
  }

  // Health check with memory stats
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: any;
    memoryStats: any;
  }> {
    try {
      const bulletproofHealth = await bulletproofChatService.healthCheck();
      const enhancedHealth = await enhancedChatService.healthCheck();
      
      const memoryStats = await advancedMemoryService.getMemoryStats('demo-user');
      
      return {
        status: bulletproofHealth.status === 'healthy' && enhancedHealth.openaiDirect ? 'healthy' : 'degraded',
        services: {
          bulletproof: bulletproofHealth,
          enhanced: enhancedHealth,
          memory: 'operational'
        },
        memoryStats
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        services: { error: error instanceof Error ? error.message : 'Unknown error' },
        memoryStats: {}
      };
    }
  }

  // Clear user data
  async clearUserData(userId: string): Promise<void> {
    await advancedMemoryService.clearUserMemory(userId);
    this.sessionMemoryMap.delete(userId);
  }
}

export const unifiedChatService = new UnifiedChatService();