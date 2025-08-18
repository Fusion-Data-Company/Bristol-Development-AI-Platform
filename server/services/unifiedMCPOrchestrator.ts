/**
 * Unified MCP Orchestrator
 * Central hub for inter-agent communication and MCP tool coordination
 * Enables floating widget, main chat, and ElevenLabs agents to share context and tools
 */

import { EventEmitter } from 'events';
import { eliteMCPSuperserver } from './eliteMCPSuperserver';
import { modelManagementMCPServer } from './modelManagementMCPServer';
import { storage } from '../storage';

interface AgentInstance {
  id: string;
  type: 'floating' | 'main' | 'elevenlabs';
  userId: string;
  sessionId: string;
  currentModel: string;
  isActive: boolean;
  lastActivity: Date;
  context: Record<string, any>;
  capabilities: string[];
}

interface CrossAgentMessage {
  id: string;
  fromAgent: string;
  toAgent: string | 'broadcast';
  type: 'context_share' | 'tool_result' | 'model_switch' | 'conversation_handoff' | 'system_notification';
  payload: Record<string, any>;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface SharedMemoryContext {
  userId: string;
  globalContext: Record<string, any>;
  crossSessionData: Record<string, any>;
  toolResults: Map<string, any>;
  conversationFlow: Array<{
    agentId: string;
    message: string;
    response: string;
    timestamp: Date;
    tools_used: string[];
  }>;
  lastUpdated: Date;
}

export class UnifiedMCPOrchestrator extends EventEmitter {
  private agents: Map<string, AgentInstance> = new Map();
  private messageQueue: CrossAgentMessage[] = [];
  private sharedMemory: Map<string, SharedMemoryContext> = new Map();
  private isProcessingQueue = false;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    super();
    this.startHealthChecks();
    this.setupEventHandlers();
  }

  /**
   * Register an agent instance in the unified system
   */
  async registerAgent(config: {
    type: 'floating' | 'main' | 'elevenlabs';
    userId: string;
    sessionId?: string;
    currentModel?: string;
    capabilities?: string[];
  }): Promise<string> {
    const agentId = `${config.type}_${config.userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const agent: AgentInstance = {
      id: agentId,
      type: config.type,
      userId: config.userId,
      sessionId: config.sessionId || `session_${Date.now()}`,
      currentModel: config.currentModel || 'gpt-4o',
      isActive: true,
      lastActivity: new Date(),
      context: {},
      capabilities: config.capabilities || []
    };

    this.agents.set(agentId, agent);
    
    // Initialize shared memory for user if not exists
    if (!this.sharedMemory.has(config.userId)) {
      this.sharedMemory.set(config.userId, {
        userId: config.userId,
        globalContext: {},
        crossSessionData: {},
        toolResults: new Map(),
        conversationFlow: [],
        lastUpdated: new Date()
      });
    }

    console.log(`🤖 [MCPOrchestrator] Registered ${config.type} agent for user ${config.userId}: ${agentId}`);
    
    // Notify other agents of new registration
    this.broadcastMessage({
      fromAgent: 'system',
      type: 'system_notification',
      payload: { 
        event: 'agent_registered', 
        agentId, 
        agentType: config.type,
        capabilities: agent.capabilities
      },
      priority: 'medium'
    });

    return agentId;
  }

  /**
   * Execute MCP tool with cross-agent context sharing
   */
  async executeMCPTool(agentId: string, toolName: string, parameters: any, options?: {
    shareResults?: boolean;
    notifyAgents?: string[];
    priority?: 'low' | 'medium' | 'high';
  }): Promise<any> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    try {
      console.log(`🔧 [MCPOrchestrator] Executing ${toolName} for agent ${agentId}`);
      
      // Get shared context for enhanced tool execution
      const sharedContext = this.getSharedContext(agent.userId);
      const enhancedParameters = {
        ...parameters,
        _sharedContext: sharedContext,
        _agentId: agentId,
        _userId: agent.userId
      };

      // Execute tool through superserver
      const result = await eliteMCPSuperserver.executeTool(toolName, enhancedParameters);
      
      // Update agent activity
      agent.lastActivity = new Date();
      
      // Store result in shared memory
      const userMemory = this.sharedMemory.get(agent.userId);
      if (userMemory) {
        userMemory.toolResults.set(`${toolName}_${Date.now()}`, {
          agentId,
          toolName,
          parameters,
          result,
          timestamp: new Date()
        });
        userMemory.lastUpdated = new Date();
      }

      // Share results with other agents if requested
      if (options?.shareResults !== false) {
        this.broadcastMessage({
          fromAgent: agentId,
          type: 'tool_result',
          payload: {
            toolName,
            parameters,
            result,
            context: sharedContext
          },
          priority: options?.priority || 'medium'
        }, options?.notifyAgents);
      }

      return result;
    } catch (error) {
      console.error(`❌ [MCPOrchestrator] Tool execution failed:`, error);
      
      // Notify other agents of failure
      this.broadcastMessage({
        fromAgent: agentId,
        type: 'system_notification',
        payload: {
          event: 'tool_execution_failed',
          toolName,
          error: error instanceof Error ? error.message : 'Unknown error',
          agentId
        },
        priority: 'high'
      });
      
      throw error;
    }
  }

  /**
   * Share context between agents
   */
  shareContext(fromAgentId: string, contextData: Record<string, any>, toAgentId?: string): void {
    const fromAgent = this.agents.get(fromAgentId);
    if (!fromAgent) return;

    // Update shared memory
    const userMemory = this.sharedMemory.get(fromAgent.userId);
    if (userMemory) {
      userMemory.globalContext = {
        ...userMemory.globalContext,
        ...contextData,
        lastUpdatedBy: fromAgentId,
        lastUpdated: new Date()
      };
    }

    // Send message to specific agent or broadcast
    const message: CrossAgentMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fromAgent: fromAgentId,
      toAgent: toAgentId || 'broadcast',
      type: 'context_share',
      payload: contextData,
      timestamp: new Date(),
      priority: 'medium'
    };

    this.queueMessage(message);
  }

  /**
   * Handle model switching with cross-agent synchronization
   */
  async switchModel(agentId: string, newModel: string, syncWithOthers = true): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    try {
      // Validate model through model management service  
      const validation = await modelManagementMCPServer.validate_model_selection({ 
        modelId: newModel, 
        checkAvailability: true 
      });
      const isValid = validation.valid;
      if (!isValid) {
        throw new Error(`Invalid model: ${newModel}`);
      }

      const oldModel = agent.currentModel;
      agent.currentModel = newModel;
      agent.lastActivity = new Date();

      console.log(`🔄 [MCPOrchestrator] Model switch: ${oldModel} → ${newModel} for agent ${agentId}`);

      if (syncWithOthers) {
        // Notify other agents of model switch
        this.broadcastMessage({
          fromAgent: agentId,
          type: 'model_switch',
          payload: {
            oldModel,
            newModel,
            agentId,
            agentType: agent.type
          },
          priority: 'medium'
        });
      }
    } catch (error) {
      console.error(`❌ [MCPOrchestrator] Model switch failed:`, error);
      throw error;
    }
  }

  /**
   * Handle conversation handoff between agents
   */
  async handoffConversation(fromAgentId: string, toAgentType: 'floating' | 'main' | 'elevenlabs', context: {
    conversationHistory: any[];
    currentContext: Record<string, any>;
    reason: string;
  }): Promise<string | null> {
    const fromAgent = this.agents.get(fromAgentId);
    if (!fromAgent) return null;

    // Find target agent
    const targetAgent = Array.from(this.agents.values()).find(
      agent => agent.type === toAgentType && 
               agent.userId === fromAgent.userId && 
               agent.isActive
    );

    if (!targetAgent) {
      console.warn(`⚠️ [MCPOrchestrator] No active ${toAgentType} agent found for handoff`);
      return null;
    }

    // Transfer context and conversation
    const userMemory = this.sharedMemory.get(fromAgent.userId);
    if (userMemory) {
      userMemory.conversationFlow.push({
        agentId: fromAgentId,
        message: `Conversation handed off to ${toAgentType}`,
        response: `Handoff initiated: ${context.reason}`,
        timestamp: new Date(),
        tools_used: []
      });

      userMemory.globalContext = {
        ...userMemory.globalContext,
        ...context.currentContext,
        handoffContext: {
          fromAgent: fromAgentId,
          toAgent: targetAgent.id,
          reason: context.reason,
          timestamp: new Date()
        }
      };
    }

    // Send handoff message
    this.queueMessage({
      id: `handoff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fromAgent: fromAgentId,
      toAgent: targetAgent.id,
      type: 'conversation_handoff',
      payload: {
        conversationHistory: context.conversationHistory,
        currentContext: context.currentContext,
        reason: context.reason
      },
      timestamp: new Date(),
      priority: 'high'
    });

    console.log(`🔄 [MCPOrchestrator] Conversation handoff: ${fromAgent.type} → ${targetAgent.type}`);
    return targetAgent.id;
  }

  /**
   * Get shared context for a user
   */
  getSharedContext(userId: string): Record<string, any> {
    const userMemory = this.sharedMemory.get(userId);
    if (!userMemory) return {};

    return {
      globalContext: userMemory.globalContext,
      recentToolResults: Array.from(userMemory.toolResults.values()).slice(-10),
      conversationFlow: userMemory.conversationFlow.slice(-20),
      activeAgents: Array.from(this.agents.values())
        .filter(agent => agent.userId === userId && agent.isActive)
        .map(agent => ({
          id: agent.id,
          type: agent.type,
          model: agent.currentModel,
          capabilities: agent.capabilities
        }))
    };
  }

  /**
   * Get messages for a specific agent
   */
  getMessagesForAgent(agentId: string): CrossAgentMessage[] {
    const agent = this.agents.get(agentId);
    if (!agent) return [];

    return this.messageQueue.filter(msg => 
      msg.toAgent === agentId || 
      msg.toAgent === 'broadcast'
    ).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Mark agent as inactive
   */
  deactivateAgent(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.isActive = false;
      console.log(`🔌 [MCPOrchestrator] Deactivated agent ${agentId}`);
      
      this.broadcastMessage({
        fromAgent: 'system',
        type: 'system_notification',
        payload: {
          event: 'agent_deactivated',
          agentId,
          agentType: agent.type
        },
        priority: 'low'
      });
    }
  }

  /**
   * Get system health status
   */
  getHealthStatus(): {
    activeAgents: number;
    queueSize: number;
    memoryUsage: number;
    lastHealthCheck: Date;
  } {
    return {
      activeAgents: Array.from(this.agents.values()).filter(a => a.isActive).length,
      queueSize: this.messageQueue.length,
      memoryUsage: this.sharedMemory.size,
      lastHealthCheck: new Date()
    };
  }

  // Private methods
  private broadcastMessage(message: Omit<CrossAgentMessage, 'id' | 'timestamp' | 'toAgent'>, targetAgents?: string[]): void {
    const fullMessage: CrossAgentMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      toAgent: targetAgents ? targetAgents[0] || 'broadcast' : 'broadcast',
      timestamp: new Date(),
      ...message
    };

    this.queueMessage(fullMessage);
  }

  private queueMessage(message: CrossAgentMessage): void {
    this.messageQueue.push(message);
    
    // Emit event for real-time processing
    this.emit('message', message);
    
    // Process queue if not already processing
    if (!this.isProcessingQueue) {
      this.processMessageQueue();
    }
  }

  private async processMessageQueue(): Promise<void> {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (!message) continue;

      try {
        await this.processMessage(message);
      } catch (error) {
        console.error(`❌ [MCPOrchestrator] Message processing failed:`, error);
      }
    }

    this.isProcessingQueue = false;
  }

  private async processMessage(message: CrossAgentMessage): Promise<void> {
    console.log(`📨 [MCPOrchestrator] Processing ${message.type} message from ${message.fromAgent}`);
    
    // Store message in persistent storage if needed
    if (message.priority === 'high' || message.priority === 'critical') {
      try {
        // Store critical messages in database for recovery
        const messageData = {
          messageId: message.id,
          messageType: message.type,
          fromAgent: message.fromAgent,
          toAgent: message.toAgent,
          payload: JSON.stringify(message.payload),
          timestamp: message.timestamp.toISOString(),
          priority: message.priority
        };
        
        // Could store in database here
        console.log(`💾 [MCPOrchestrator] Stored critical message ${message.id}`);
      } catch (error) {
        console.error(`❌ [MCPOrchestrator] Failed to store message:`, error);
      }
    }
  }

  private setupEventHandlers(): void {
    // Clean up inactive agents periodically
    setInterval(() => {
      const now = Date.now();
      const INACTIVE_THRESHOLD = 30 * 60 * 1000; // 30 minutes

      for (const [agentId, agent] of Array.from(this.agents.entries())) {
        if (agent.isActive && (now - agent.lastActivity.getTime()) > INACTIVE_THRESHOLD) {
          this.deactivateAgent(agentId);
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    // Clean up old messages
    setInterval(() => {
      const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
      this.messageQueue = this.messageQueue.filter(msg => msg.timestamp.getTime() > cutoff);
    }, 60 * 60 * 1000); // Check every hour
  }

  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(() => {
      const status = this.getHealthStatus();
      console.log(`💓 [MCPOrchestrator] Health: ${status.activeAgents} agents, ${status.queueSize} queued messages`);
      
      // Emit health status for monitoring
      this.emit('health', status);
    }, 60000); // Every minute
  }
}

// Global instance
export const unifiedMCPOrchestrator = new UnifiedMCPOrchestrator();