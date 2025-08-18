/**
 * Agent Communication Service
 * Handles real-time communication between floating widget, main chat, and ElevenLabs agents
 * Provides WebSocket-based messaging and context sharing
 */

import { WebSocketServer, WebSocket } from 'ws';
import { unifiedMCPOrchestrator } from './unifiedMCPOrchestrator';
import { EventEmitter } from 'events';

interface ConnectedAgent {
  id: string;
  type: 'floating' | 'main' | 'elevenlabs';
  userId: string;
  sessionId: string;
  socket: WebSocket;
  lastPing: Date;
  isActive: boolean;
}

interface AgentMessage {
  id: string;
  type: 'context_sync' | 'tool_execution' | 'model_switch' | 'conversation_update' | 'handoff_request' | 'system_alert';
  sourceAgent: string;
  targetAgent?: string; // undefined = broadcast
  payload: Record<string, any>;
  timestamp: Date;
  requiresAck: boolean;
}

export class AgentCommunicationService extends EventEmitter {
  private wss: WebSocketServer | null = null;
  private connectedAgents: Map<string, ConnectedAgent> = new Map();
  private messageHistory: Map<string, AgentMessage[]> = new Map(); // userId -> messages
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.setupMCPOrchestrator();
  }

  /**
   * Initialize WebSocket server for agent communication
   */
  initializeWebSocket(server: any): void {
    this.wss = new WebSocketServer({ server, path: '/ws/agents' });
    
    this.wss.on('connection', (socket: WebSocket, request) => {
      this.handleAgentConnection(socket, request);
    });

    this.startHeartbeat();
    console.log('🌐 [AgentComm] WebSocket server initialized for agent communication');
  }

  /**
   * Handle new agent connection
   */
  private handleAgentConnection(socket: WebSocket, request: any): void {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const agentType = url.searchParams.get('type') as 'floating' | 'main' | 'elevenlabs';
    const userId = url.searchParams.get('userId');
    const sessionId = url.searchParams.get('sessionId');

    if (!agentType || !userId) {
      socket.close(1008, 'Missing required parameters');
      return;
    }

    const agentId = `${agentType}_${userId}_${Date.now()}`;
    
    const agent: ConnectedAgent = {
      id: agentId,
      type: agentType,
      userId,
      sessionId: sessionId || `session_${Date.now()}`,
      socket,
      lastPing: new Date(),
      isActive: true
    };

    this.connectedAgents.set(agentId, agent);
    console.log(`🤝 [AgentComm] ${agentType} agent connected for user ${userId}: ${agentId}`);

    // Register with MCP Orchestrator
    unifiedMCPOrchestrator.registerAgent({
      type: agentType,
      userId,
      sessionId: agent.sessionId,
      capabilities: this.getAgentCapabilities(agentType)
    });

    // Setup socket event handlers
    this.setupSocketHandlers(socket, agent);

    // Send initial sync message
    this.sendWelcomeMessage(agent);

    // Notify other agents of new connection
    this.broadcastToUserAgents(userId, {
      type: 'system_alert',
      sourceAgent: 'system',
      payload: {
        event: 'agent_connected',
        agentId,
        agentType,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date(),
      requiresAck: false
    }, [agentId]); // exclude the newly connected agent
  }

  /**
   * Setup socket event handlers for an agent
   */
  private setupSocketHandlers(socket: WebSocket, agent: ConnectedAgent): void {
    socket.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString()) as AgentMessage;
        this.handleAgentMessage(agent, message);
      } catch (error) {
        console.error(`❌ [AgentComm] Invalid message from ${agent.id}:`, error);
      }
    });

    socket.on('pong', () => {
      agent.lastPing = new Date();
    });

    socket.on('close', () => {
      this.handleAgentDisconnection(agent);
    });

    socket.on('error', (error) => {
      console.error(`❌ [AgentComm] Socket error for ${agent.id}:`, error);
      this.handleAgentDisconnection(agent);
    });
  }

  /**
   * Handle incoming message from agent
   */
  private async handleAgentMessage(agent: ConnectedAgent, message: AgentMessage): Promise<void> {
    console.log(`📨 [AgentComm] Message from ${agent.type}: ${message.type}`);

    // Update agent activity
    agent.lastPing = new Date();

    // Store message in history
    if (!this.messageHistory.has(agent.userId)) {
      this.messageHistory.set(agent.userId, []);
    }
    this.messageHistory.get(agent.userId)!.push(message);

    // Process message based on type
    switch (message.type) {
      case 'context_sync':
        await this.handleContextSync(agent, message);
        break;
      
      case 'tool_execution':
        await this.handleToolExecution(agent, message);
        break;
      
      case 'model_switch':
        await this.handleModelSwitch(agent, message);
        break;
      
      case 'conversation_update':
        await this.handleConversationUpdate(agent, message);
        break;
      
      case 'handoff_request':
        await this.handleHandoffRequest(agent, message);
        break;
      
      default:
        console.warn(`⚠️ [AgentComm] Unknown message type: ${message.type}`);
    }

    // Send acknowledgment if required
    if (message.requiresAck) {
      this.sendAcknowledgment(agent, message.id);
    }
  }

  /**
   * Handle context synchronization between agents
   */
  private async handleContextSync(agent: ConnectedAgent, message: AgentMessage): Promise<void> {
    try {
      // Share context through MCP Orchestrator
      unifiedMCPOrchestrator.shareContext(agent.id, message.payload);

      // Broadcast to other agents
      this.broadcastToUserAgents(agent.userId, {
        type: 'context_sync',
        sourceAgent: agent.id,
        payload: message.payload,
        timestamp: new Date(),
        requiresAck: false
      }, [agent.id]); // exclude sender

    } catch (error) {
      console.error(`❌ [AgentComm] Context sync failed:`, error);
    }
  }

  /**
   * Handle tool execution sharing
   */
  private async handleToolExecution(agent: ConnectedAgent, message: AgentMessage): Promise<void> {
    try {
      const { toolName, parameters, result } = message.payload;

      // Execute through MCP Orchestrator if needed
      if (!result) {
        const toolResult = await unifiedMCPOrchestrator.executeMCPTool(
          agent.id, 
          toolName, 
          parameters, 
          { shareResults: true }
        );

        // Send result back to requesting agent
        this.sendToAgent(agent, {
          type: 'tool_execution',
          sourceAgent: 'system',
          payload: {
            toolName,
            parameters,
            result: toolResult,
            originalMessageId: message.id
          },
          timestamp: new Date(),
          requiresAck: false
        });
      } else {
        // Share completed tool execution with other agents
        this.broadcastToUserAgents(agent.userId, {
          type: 'tool_execution',
          sourceAgent: agent.id,
          payload: { toolName, parameters, result },
          timestamp: new Date(),
          requiresAck: false
        }, [agent.id]);
      }

    } catch (error) {
      console.error(`❌ [AgentComm] Tool execution handling failed:`, error);
      
      // Send error back to requesting agent
      this.sendToAgent(agent, {
        type: 'system_alert',
        sourceAgent: 'system',
        payload: {
          error: error instanceof Error ? error.message : 'Tool execution failed',
          originalMessageId: message.id
        },
        timestamp: new Date(),
        requiresAck: false
      });
    }
  }

  /**
   * Handle model switching coordination
   */
  private async handleModelSwitch(agent: ConnectedAgent, message: AgentMessage): Promise<void> {
    try {
      const { newModel, syncWithOthers } = message.payload;

      // Switch model through MCP Orchestrator
      await unifiedMCPOrchestrator.switchModel(agent.id, newModel, syncWithOthers !== false);

      if (syncWithOthers !== false) {
        // Notify other agents of model switch
        this.broadcastToUserAgents(agent.userId, {
          type: 'model_switch',
          sourceAgent: agent.id,
          payload: {
            newModel,
            agentType: agent.type,
            timestamp: new Date().toISOString()
          },
          timestamp: new Date(),
          requiresAck: false
        }, [agent.id]);
      }

    } catch (error) {
      console.error(`❌ [AgentComm] Model switch handling failed:`, error);
    }
  }

  /**
   * Handle conversation updates
   */
  private async handleConversationUpdate(agent: ConnectedAgent, message: AgentMessage): Promise<void> {
    const { conversationData } = message.payload;

    // Update shared context through MCP Orchestrator
    unifiedMCPOrchestrator.shareContext(agent.id, {
      conversationUpdate: conversationData,
      lastUpdatedBy: agent.type,
      timestamp: new Date().toISOString()
    });

    // Broadcast to other agents
    this.broadcastToUserAgents(agent.userId, {
      type: 'conversation_update',
      sourceAgent: agent.id,
      payload: {
        conversationData,
        agentType: agent.type
      },
      timestamp: new Date(),
      requiresAck: false
    }, [agent.id]);
  }

  /**
   * Handle conversation handoff requests
   */
  private async handleHandoffRequest(agent: ConnectedAgent, message: AgentMessage): Promise<void> {
    const { targetAgentType, context, reason } = message.payload;

    try {
      const handoffResult = await unifiedMCPOrchestrator.handoffConversation(
        agent.id,
        targetAgentType,
        {
          conversationHistory: context.conversationHistory || [],
          currentContext: context.currentContext || {},
          reason: reason || 'User requested handoff'
        }
      );

      if (handoffResult) {
        // Notify target agent of handoff
        const targetAgent = Array.from(this.connectedAgents.values()).find(
          a => a.type === targetAgentType && a.userId === agent.userId
        );

        if (targetAgent) {
          this.sendToAgent(targetAgent, {
            type: 'handoff_request',
            sourceAgent: agent.id,
            payload: {
              fromAgentType: agent.type,
              context,
              reason
            },
            timestamp: new Date(),
            requiresAck: true
          });
        }
      }

    } catch (error) {
      console.error(`❌ [AgentComm] Handoff request failed:`, error);
    }
  }

  /**
   * Send message to specific agent
   */
  private sendToAgent(agent: ConnectedAgent, message: Omit<AgentMessage, 'id'>): void {
    if (agent.socket.readyState === WebSocket.OPEN) {
      const fullMessage: AgentMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...message
      };

      agent.socket.send(JSON.stringify(fullMessage));
    }
  }

  /**
   * Broadcast message to all user agents
   */
  private broadcastToUserAgents(
    userId: string, 
    message: Omit<AgentMessage, 'id'>, 
    excludeAgents: string[] = []
  ): void {
    const userAgents = Array.from(this.connectedAgents.values()).filter(
      agent => agent.userId === userId && 
               agent.isActive && 
               !excludeAgents.includes(agent.id)
    );

    const fullMessage: AgentMessage = {
      id: `broadcast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...message
    };

    userAgents.forEach(agent => {
      if (agent.socket.readyState === WebSocket.OPEN) {
        agent.socket.send(JSON.stringify(fullMessage));
      }
    });

    console.log(`📡 [AgentComm] Broadcasted ${message.type} to ${userAgents.length} agents for user ${userId}`);
  }

  /**
   * Send welcome message to newly connected agent
   */
  private sendWelcomeMessage(agent: ConnectedAgent): void {
    const sharedContext = unifiedMCPOrchestrator.getSharedContext(agent.userId);
    
    this.sendToAgent(agent, {
      type: 'system_alert',
      sourceAgent: 'system',
      payload: {
        event: 'welcome',
        agentId: agent.id,
        sharedContext,
        activeAgents: Array.from(this.connectedAgents.values())
          .filter(a => a.userId === agent.userId && a.isActive)
          .map(a => ({ id: a.id, type: a.type }))
      },
      timestamp: new Date(),
      requiresAck: false
    });
  }

  /**
   * Send acknowledgment for a message
   */
  private sendAcknowledgment(agent: ConnectedAgent, messageId: string): void {
    this.sendToAgent(agent, {
      type: 'system_alert',
      sourceAgent: 'system',
      payload: {
        event: 'acknowledgment',
        originalMessageId: messageId
      },
      timestamp: new Date(),
      requiresAck: false
    });
  }

  /**
   * Handle agent disconnection
   */
  private handleAgentDisconnection(agent: ConnectedAgent): void {
    agent.isActive = false;
    this.connectedAgents.delete(agent.id);
    
    // Deactivate in MCP Orchestrator
    unifiedMCPOrchestrator.deactivateAgent(agent.id);

    console.log(`👋 [AgentComm] ${agent.type} agent disconnected: ${agent.id}`);

    // Notify other agents
    this.broadcastToUserAgents(agent.userId, {
      type: 'system_alert',
      sourceAgent: 'system',
      payload: {
        event: 'agent_disconnected',
        agentId: agent.id,
        agentType: agent.type
      },
      timestamp: new Date(),
      requiresAck: false
    });
  }

  /**
   * Setup MCP Orchestrator event handling
   */
  private setupMCPOrchestrator(): void {
    // Listen for MCP events and broadcast to relevant agents
    unifiedMCPOrchestrator.on('message', (message) => {
      // Handle cross-agent messages from MCP
      console.log(`🔄 [AgentComm] MCP message received: ${message.type}`);
    });

    unifiedMCPOrchestrator.on('health', (status) => {
      // Broadcast health status to all agents
      this.broadcastSystemMessage({
        event: 'system_health',
        status
      });
    });
  }

  /**
   * Broadcast system message to all connected agents
   */
  private broadcastSystemMessage(payload: Record<string, any>): void {
    const message: AgentMessage = {
      id: `system_${Date.now()}`,
      type: 'system_alert',
      sourceAgent: 'system',
      payload,
      timestamp: new Date(),
      requiresAck: false
    };

    for (const agent of Array.from(this.connectedAgents.values())) {
      if (agent.isActive && agent.socket.readyState === WebSocket.OPEN) {
        agent.socket.send(JSON.stringify(message));
      }
    }
  }

  /**
   * Start heartbeat to monitor agent connections
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const HEARTBEAT_TIMEOUT = 60000; // 60 seconds

      for (const [agentId, agent] of Array.from(this.connectedAgents.entries())) {
        if (now - agent.lastPing.getTime() > HEARTBEAT_TIMEOUT) {
          console.warn(`💔 [AgentComm] Agent ${agentId} heartbeat timeout`);
          this.handleAgentDisconnection(agent);
        } else if (agent.socket.readyState === WebSocket.OPEN) {
          agent.socket.ping();
        }
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Get agent capabilities based on type
   */
  private getAgentCapabilities(agentType: 'floating' | 'main' | 'elevenlabs'): string[] {
    switch (agentType) {
      case 'floating':
        return ['quick_response', 'context_aware', 'tool_execution', 'model_switching'];
      case 'main':
        return ['full_conversation', 'advanced_reasoning', 'tool_execution', 'file_handling', 'model_switching'];
      case 'elevenlabs':
        return ['voice_synthesis', 'audio_processing', 'conversation_handoff'];
      default:
        return [];
    }
  }

  /**
   * Get service health status
   */
  getHealthStatus(): {
    connectedAgents: number;
    activeConnections: number;
    messageHistory: number;
    status: 'healthy' | 'degraded' | 'unhealthy';
  } {
    const connectedCount = this.connectedAgents.size;
    const activeCount = Array.from(this.connectedAgents.values()).filter(a => a.isActive).length;
    const messageCount = Array.from(this.messageHistory.values()).reduce((sum, msgs) => sum + msgs.length, 0);

    return {
      connectedAgents: connectedCount,
      activeConnections: activeCount,
      messageHistory: messageCount,
      status: activeCount === 0 ? 'unhealthy' : connectedCount === activeCount ? 'healthy' : 'degraded'
    };
  }

  /**
   * Cleanup service
   */
  cleanup(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    for (const agent of Array.from(this.connectedAgents.values())) {
      if (agent.socket.readyState === WebSocket.OPEN) {
        agent.socket.close();
      }
    }

    if (this.wss) {
      this.wss.close();
    }
  }
}

// Global instance
export const agentCommunicationService = new AgentCommunicationService();