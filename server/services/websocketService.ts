import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import { storage } from "../storage";
import { realTimeSyncService } from "./realTimeSync";
import type { IntegrationLog } from "@shared/schema";

interface WebSocketClient {
  id: string;
  userId?: string;
  socket: WebSocket;
  lastPing: number;
}

interface WebSocketMessage {
  type: "ping" | "pong" | "subscribe" | "unsubscribe" | "tool_status" | "chat_typing" | "integration_update" | "bristol_sync" | "instance_register";
  data?: any;
  timestamp: number;
  instance?: 'main' | 'floating';
  sessionId?: string;
}

export class WebSocketService {
  private wss: WebSocketServer;
  private clients: Map<string, WebSocketClient> = new Map();
  private subscriptions: Map<string, Set<string>> = new Map(); // topic -> client IDs

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.setupWebSocketServer();
    this.startHeartbeat();
  }

  private setupWebSocketServer() {
    this.wss.on('connection', (socket: WebSocket, request) => {
      const clientId = this.generateClientId();
      const client: WebSocketClient = {
        id: clientId,
        socket,
        lastPing: Date.now()
      };

      this.clients.set(clientId, client);
      console.log(`✅ WebSocket client connected: ${clientId}`);

      // Enhanced connection setup with error handling
      try {
        // Send welcome message with retry mechanism
        this.sendToClient(clientId, {
          type: "tool_status",
          data: { status: "connected", clientId },
          timestamp: Date.now()
        });
      } catch (error) {
        console.error(`Failed to send welcome message to ${clientId}:`, error);
      }

      socket.on('message', (data) => {
        try {
          this.handleMessage(clientId, data.toString());
        } catch (error) {
          console.error(`Error processing message from ${clientId}:`, error);
          // Don't disconnect on message processing errors, just log them
        }
      });

      socket.on('close', (code, reason) => {
        console.log(`WebSocket client ${clientId} disconnected: ${code} ${reason}`);
        this.handleDisconnect(clientId);
      });

      socket.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error.message || error);
        // Only disconnect if socket is in a bad state
        if (socket.readyState === WebSocket.CLOSED || socket.readyState === WebSocket.CLOSING) {
          this.handleDisconnect(clientId);
        }
      });

      // Set up automatic pong response to keep connection alive
      socket.on('pong', () => {
        client.lastPing = Date.now();
      });
    });
  }

  private handleMessage(clientId: string, data: string) {
    try {
      const message: WebSocketMessage = JSON.parse(data);
      const client = this.clients.get(clientId);

      if (!client) return;

      switch (message.type) {
        case "instance_register":
          // Register this client for Bristol AI sync
          if (message.instance && (message.instance === 'main' || message.instance === 'floating')) {
            realTimeSyncService.registerConnection(clientId, client.socket, message.instance);
            this.sendToClient(clientId, {
              type: "tool_status",
              data: { status: "bristol_sync_registered", instance: message.instance },
              timestamp: Date.now()
            });
          }
          break;
          
        case "bristol_sync":
          // Handle Bristol AI memory synchronization
          if (message.sessionId && message.instance && message.data) {
            realTimeSyncService.triggerCrossInstanceSync(
              message.sessionId,
              message.instance,
              message.data
            );
          }
          break;
          
        case "ping":
          client.lastPing = Date.now();
          this.sendToClient(clientId, {
            type: "pong",
            timestamp: Date.now()
          });
          break;

        case "subscribe":
          this.handleSubscription(clientId, message.data?.topic, true);
          break;

        case "unsubscribe":
          this.handleSubscription(clientId, message.data?.topic, false);
          break;

        case "chat_typing":
          // Broadcast typing indicator to other clients in the same session
          if (message.data?.sessionId) {
            this.broadcastToTopic(`chat:${message.data.sessionId}`, {
              type: "chat_typing",
              data: { 
                userId: client.userId,
                typing: message.data.typing 
              },
              timestamp: Date.now()
            }, clientId);
          }
          break;

        default:
          console.warn(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error(`Error handling WebSocket message from ${clientId}:`, error);
    }
  }

  private handleSubscription(clientId: string, topic: string, subscribe: boolean) {
    if (!topic) return;

    if (subscribe) {
      if (!this.subscriptions.has(topic)) {
        this.subscriptions.set(topic, new Set());
      }
      this.subscriptions.get(topic)!.add(clientId);
      console.log(`Client ${clientId} subscribed to ${topic}`);
    } else {
      this.subscriptions.get(topic)?.delete(clientId);
      console.log(`Client ${clientId} unsubscribed from ${topic}`);
    }
  }

  private handleDisconnect(clientId: string) {
    // Remove from all subscriptions
    this.subscriptions.forEach((clients, topic) => {
      clients.delete(clientId);
      if (clients.size === 0) {
        this.subscriptions.delete(topic);
      }
    });

    this.clients.delete(clientId);
    console.log(`WebSocket client disconnected: ${clientId}`);
  }

  private startHeartbeat() {
    setInterval(() => {
      const now = Date.now();
      this.clients.forEach((client, clientId) => {
        if (now - client.lastPing > 90000) { // 90 seconds timeout (increased for stability)
          console.log(`Client ${clientId} timed out`);
          client.socket.terminate();
          this.handleDisconnect(clientId);
        } else if (now - client.lastPing > 30000) {
          // Send ping if client hasn't sent anything in 30 seconds
          try {
            this.sendToClient(clientId, {
              type: "ping",
              timestamp: now
            });
          } catch (error) {
            console.error(`Failed to ping client ${clientId}:`, error);
            this.handleDisconnect(clientId);
          }
        }
      });
    }, 20000); // Check every 20 seconds
  }

  private generateClientId(): string {
    return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public methods for broadcasting events
  public broadcastToolExecution(toolName: string, status: string, payload?: any) {
    this.broadcastToTopic("tools", {
      type: "tool_status",
      data: {
        tool: toolName,
        status,
        payload,
        timestamp: Date.now()
      },
      timestamp: Date.now()
    });
  }

  public broadcastIntegrationUpdate(log: IntegrationLog) {
    this.broadcastToTopic("integrations", {
      type: "integration_update",
      data: log,
      timestamp: Date.now()
    });
  }

  // Agent task broadcasting methods
  public broadcastTaskStarted(task: any) {
    this.broadcastToAll({
      type: "task_started",
      data: { task },
      timestamp: Date.now()
    });
  }

  public broadcastTaskCompleted(task: any) {
    this.broadcastToAll({
      type: "task_completed", 
      data: { task },
      timestamp: Date.now()
    });
  }

  public broadcastChatUpdate(sessionId: string, message: any) {
    this.broadcastToTopic(`chat:${sessionId}`, {
      type: "chat_typing",
      data: { typing: false, message },
      timestamp: Date.now()
    });
  }

  public broadcastToAll(message: any) {
    this.clients.forEach((client, clientId) => {
      if (client.socket.readyState === WebSocket.OPEN) {
        client.socket.send(JSON.stringify(message));
      }
    });
  }

  private sendToClient(clientId: string, message: WebSocketMessage) {
    const client = this.clients.get(clientId);
    if (client && client.socket.readyState === WebSocket.OPEN) {
      try {
        client.socket.send(JSON.stringify(message));
      } catch (error) {
        console.error(`Failed to send message to client ${clientId}:`, error);
        // Remove client if socket is broken
        if (client.socket.readyState !== WebSocket.OPEN) {
          this.handleDisconnect(clientId);
        }
      }
    }
  }

  private broadcastToTopic(topic: string, message: WebSocketMessage, excludeClientId?: string) {
    const subscribers = this.subscriptions.get(topic);
    if (!subscribers) return;

    subscribers.forEach(clientId => {
      if (clientId !== excludeClientId) {
        this.sendToClient(clientId, message);
      }
    });
  }
}

let websocketService: WebSocketService | null = null;

export function initializeWebSocketService(server: Server): WebSocketService {
  if (!websocketService) {
    websocketService = new WebSocketService(server);
  }
  return websocketService;
}

export function getWebSocketService(): WebSocketService | null {
  return websocketService;
}
