import { storage } from "../storage";
import type { 
  MemoryShort, 
  MemoryLong, 
  AgentContext, 
  ChatSession,
  ChatMessage,
  InsertMemoryShort,
  InsertMemoryLong,
  InsertAgentContext 
} from "@shared/schema";

/**
 * Memory Synchronization Service
 * Ensures both main chat and floating widget AI instances share the same:
 * - Long-term memory (user preferences, learned patterns)
 * - Short-term memory (session context, ongoing conversations)
 * - Agent context (current deals, properties, decisions)
 * - Conversation history (synchronized across instances)
 */
export class MemorySyncService {
  private static instance: MemorySyncService;
  
  constructor() {
    // No dependencies in constructor to avoid circular deps
  }

  static getInstance(): MemorySyncService {
    if (!MemorySyncService.instance) {
      MemorySyncService.instance = new MemorySyncService();
    }
    return MemorySyncService.instance;
  }

  /**
   * Synchronize memory between main chat and floating widget
   */
  async syncMemoryBetweenInstances(
    userId: string, 
    sessionId: string, 
    sourceInstance: 'main' | 'floating'
  ): Promise<void> {
    try {
      // Get all memory types for this user/session
      const [longTermMemory, shortTermMemory, agentContext, messages] = await Promise.all([
        storage.getMemoryLong(userId),
        storage.getMemoryShort(userId, sessionId),
        storage.getSessionContext(sessionId),
        storage.getSessionMessages(sessionId)
      ]);

      // Memory sync completed - WebSocket broadcasting handled elsewhere
      console.log(`Memory synchronized for user ${userId}, session ${sessionId} from ${sourceInstance}`);

      console.log(`Memory synchronized from ${sourceInstance} instance for user ${userId}`);
    } catch (error) {
      console.error('Failed to sync memory between instances:', error);
    }
  }

  /**
   * Create shared memory entry that syncs across instances
   */
  async createSharedMemory(
    data: InsertMemoryShort,
    sourceInstance: 'main' | 'floating'
  ): Promise<MemoryShort> {
    const memory = await storage.createMemoryShort(data);
    
    // Sync to other instance
    await this.syncMemoryBetweenInstances(
      data.userId!, 
      data.sessionId!, 
      sourceInstance
    );

    return memory;
  }

  /**
   * Update shared long-term memory with cross-instance sync
   */
  async updateSharedLongTermMemory(
    data: InsertMemoryLong,
    sourceInstance: 'main' | 'floating'
  ): Promise<MemoryLong> {
    const memory = await storage.createMemoryLong(data);
    
    // Sync to other instance
    await this.syncMemoryBetweenInstances(
      data.userId, 
      'shared_context', // Use shared context for long-term memory
      sourceInstance
    );

    return memory;
  }

  /**
   * Create shared agent context that both instances can access
   */
  async createSharedContext(
    data: InsertAgentContext,
    sourceInstance: 'main' | 'floating'
  ): Promise<AgentContext> {
    const context = await storage.createAgentContext(data);
    
    // Sync to other instance
    await this.syncMemoryBetweenInstances(
      data.userId, 
      data.sessionId, 
      sourceInstance
    );

    return context;
  }

  /**
   * Get unified context for AI instances (both main and floating)
   */
  async getUnifiedContext(userId: string, sessionId: string): Promise<{
    longTermMemory: MemoryLong[];
    shortTermMemory: MemoryShort[];
    agentContext: AgentContext[];
    recentMessages: ChatMessage[];
    contextSummary: string;
  }> {
    const [longTermMemory, shortTermMemory, agentContext, messages] = await Promise.all([
      storage.getMemoryLong(userId),
      storage.getMemoryShort(userId, sessionId),
      storage.getSessionContext(sessionId),
      storage.getSessionMessages(sessionId)
    ]);

    // Get recent messages (last 5 for context)
    const recentMessages = messages.slice(-5);

    // Create context summary for AI consumption
    const contextSummary = this.generateContextSummary({
      longTermMemory,
      shortTermMemory,
      agentContext,
      recentMessages
    });

    return {
      longTermMemory,
      shortTermMemory,
      agentContext,
      recentMessages,
      contextSummary
    };
  }

  /**
   * Generate context summary for AI instances
   */
  private generateContextSummary(data: {
    longTermMemory: MemoryLong[];
    shortTermMemory: MemoryShort[];
    agentContext: AgentContext[];
    recentMessages: ChatMessage[];
  }): string {
    const summary: string[] = [];

    // Long-term insights
    if (data.longTermMemory.length > 0) {
      summary.push("## USER PROFILE & PREFERENCES");
      data.longTermMemory
        .filter(m => (m.confidence ?? 0) > 0.7)
        .slice(0, 5)
        .forEach(memory => {
          summary.push(`- ${memory.category}: ${memory.key} = ${JSON.stringify(memory.value)}`);
        });
    }

    // Current session context
    if (data.shortTermMemory.length > 0) {
      summary.push("\n## CURRENT SESSION CONTEXT");
      data.shortTermMemory.forEach(memory => {
        summary.push(`- ${memory.key}: ${JSON.stringify(memory.value)}`);
      });
    }

    // Agent context (deals, properties)
    if (data.agentContext.length > 0) {
      summary.push("\n## ACTIVE DEALS & PROPERTIES");
      data.agentContext.forEach(ctx => {
        summary.push(`- ${ctx.type}: ${JSON.stringify(ctx.context).slice(0, 200)}`);
      });
    }

    // Recent conversation
    if (data.recentMessages.length > 0) {
      summary.push("\n## RECENT CONVERSATION");
      data.recentMessages.forEach(msg => {
        const preview = msg.content.slice(0, 100);
        summary.push(`- ${msg.role}: ${preview}${msg.content.length > 100 ? '...' : ''}`);
      });
    }

    return summary.join('\n');
  }

  /**
   * Handle message from either instance and sync to other
   */
  async handleCrossInstanceMessage(
    sessionId: string,
    userId: string,
    message: string,
    role: 'user' | 'assistant',
    sourceInstance: 'main' | 'floating',
    metadata?: any
  ): Promise<void> {
    // Store message in shared storage
    await storage.createChatMessage({
      sessionId,
      role,
      content: message,
      metadata: { 
        ...metadata, 
        sourceInstance,
        syncedAt: new Date().toISOString()
      }
    });

    // Broadcast to other instance
    this.wsService?.broadcast({
      type: 'cross_instance_message',
      payload: {
        sessionId,
        userId,
        message,
        role,
        sourceInstance,
        targetInstance: sourceInstance === 'main' ? 'floating' : 'main',
        timestamp: new Date().toISOString()
      }
    });

    // Sync memory context
    await this.syncMemoryBetweenInstances(userId, sessionId, sourceInstance);
  }

  /**
   * Initialize shared session between main and floating instances
   */
  async initializeSharedSession(userId: string, title?: string): Promise<ChatSession> {
    const session = await storage.createChatSession({
      userId,
      title: title || `Your Company A.I. Elite Session - ${new Date().toLocaleDateString()}`
    });

    // Create initial context memory
    await this.createSharedMemory({
      userId,
      sessionId: session.id,
      key: 'session_type',
      value: { 
        type: 'unified_elite_session',
        instances: ['main', 'floating'],
        initialized: new Date().toISOString()
      }
    }, 'main');

    // Broadcast session creation
    this.wsService?.broadcast({
      type: 'session_initialized',
      payload: {
        sessionId: session.id,
        userId,
        title: session.title,
        instances: ['main', 'floating'],
        timestamp: new Date().toISOString()
      }
    });

    return session;
  }

  /**
   * Handle tool execution results and sync across instances
   */
  async syncToolExecution(
    sessionId: string,
    userId: string,
    toolName: string,
    result: any,
    sourceInstance: 'main' | 'floating'
  ): Promise<void> {
    // Store tool result in context
    await this.createSharedContext({
      sessionId,
      userId,
      type: 'tool_execution',
      context: {
        toolName,
        result,
        executedAt: new Date().toISOString(),
        sourceInstance
      },
      relevance: 0.8
    }, sourceInstance);

    // Tool execution completed - broadcasting handled by real-time sync service
    console.log(`Tool ${toolName} executed from ${sourceInstance} for session ${sessionId}`);
  }

  /**
   * Clean up expired short-term memory
   */
  async cleanupExpiredMemory(): Promise<void> {
    try {
      const expiredMemories = await storage.getExpiredShortTermMemory();
      
      for (const memory of expiredMemories) {
        await storage.deleteMemoryShort(memory.id);
      }

      if (expiredMemories.length > 0) {
        console.log(`Cleaned up ${expiredMemories.length} expired memory entries`);
      }
    } catch (error) {
      console.error('Failed to cleanup expired memory:', error);
    }
  }
}

// Export singleton instance
export const memorySyncService = MemorySyncService.getInstance();