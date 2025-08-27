import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import { storage } from "../storage";
import { realTimeSyncService } from "./realTimeSync";
import { enhancedConnectionManager } from "./enhancedConnectionManager";
import type { IntegrationLog } from "@shared/schema";
import { EventEmitter } from 'events';

interface WebSocketClient {
  id: string;
  userId?: string;
  socket: WebSocket;
  lastPing: number;
  connectionType: 'main' | 'floating' | 'admin';
  priority: 'low' | 'medium' | 'high' | 'critical';
  errorCount: number;
  messageCount: number;
  lastActivity: number;
  bandwidthUsed: number;
  healthStatus: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
}

interface WebSocketMessage {
  type: "ping" | "pong" | "subscribe" | "unsubscribe" | "tool_status" | "chat_typing" | 
        "integration_update" | "bristol_sync" | "instance_register" | "heartbeat" | "health_check";
  data?: any;
  timestamp: number;
  instance?: 'main' | 'floating';
  sessionId?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  requestId?: string;
}

interface MessageQueue {
  id: string;
  message: WebSocketMessage;
  priority: number;
  timestamp: number;
  retries: number;
  maxRetries: number;
}

interface BulletproofConfig {
  maxClients: number;
  maxMessageQueueSize: number;
  heartbeatInterval: number;
  connectionTimeout: number;
  maxReconnectAttempts: number;
  circuitBreakerThreshold: number;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
}

export class BulletproofWebSocketService extends EventEmitter {
  private wss: WebSocketServer;
  private clients: Map<string, WebSocketClient> = new Map();
  private subscriptions: Map<string, Set<string>> = new Map();
  private messageQueues: Map<string, MessageQueue[]> = new Map();
  private rateLimitCounters: Map<string, { count: number; resetTime: number }> = new Map();
  private circuitBreakers: Map<string, { failures: number; state: 'closed' | 'open' | 'half-open'; lastFailure: number }> = new Map();
  
  private config: BulletproofConfig = {
    maxClients: 50000,
    maxMessageQueueSize: 1000,
    heartbeatInterval: 30000,
    connectionTimeout: 120000,
    maxReconnectAttempts: 5,
    circuitBreakerThreshold: 10,
    rateLimitWindowMs: 60000,
    rateLimitMaxRequests: 1000,
    compressionEnabled: true,
    encryptionEnabled: false // Can be enabled for production
  };

  // Performance monitoring
  private performanceMetrics = {
    connectionsTotal: 0,
    connectionsActive: 0,
    messagesProcessed: 0,
    errorsTotal: 0,
    bandwidthUsed: 0,
    averageLatency: 0,
    uptime: Date.now()
  };

  constructor(server: Server) {
    super();
    
    this.wss = new WebSocketServer({ 
      server, 
      path: '/ws',
      perMessageDeflate: this.config.compressionEnabled,
      maxPayload: 1024 * 1024, // 1MB max message size
      verifyClient: this.verifyClient.bind(this)
    });
    
    this.setupWebSocketServer();
    this.startHeartbeat();
    this.startPerformanceMonitoring();
    this.startMaintenanceTasks();
    this.setupGracefulShutdown();
  }

  // Enhanced client verification
  private verifyClient(info: any): boolean {
    const ip = info.req.socket.remoteAddress;
    const userAgent = info.req.headers['user-agent'];
    
    // Check circuit breaker
    const circuitBreaker = this.circuitBreakers.get(ip);
    if (circuitBreaker && circuitBreaker.state === 'open') {
      console.warn(`🔴 Circuit breaker open for ${ip} - connection rejected`);
      return false;
    }
    
    // Rate limiting check
    if (!this.checkRateLimit(ip)) {
      console.warn(`⚠️ Rate limit exceeded for ${ip}`);
      return false;
    }
    
    // Basic security checks
    if (!userAgent || userAgent.length > 200) {
      console.warn(`🚨 Suspicious user agent from ${ip}`);
      return false;
    }
    
    // Check global connection limit
    if (this.clients.size >= this.config.maxClients) {
      console.warn(`⚠️ Max clients reached: ${this.clients.size}`);
      return false;
    }
    
    return true;
  }

  private setupWebSocketServer() {
    this.wss.on('connection', (socket: WebSocket, request) => {
      const clientIP = request.socket.remoteAddress || 'unknown';
      const clientId = this.generateClientId();
      
      // Enhanced connection acceptance using the enhanced connection manager
      const connectionResult = enhancedConnectionManager.canAcceptConnection(clientIP);
      if (!connectionResult.allowed) {
        console.warn(`⚠️ Enhanced connection manager rejected ${clientIP}: ${connectionResult.reason}`);
        socket.close(1008, connectionResult.reason || 'Connection rejected');
        return;
      }
      
      // Determine connection type and priority from headers
      const connectionType = this.determineConnectionType(request);
      const priority = this.determinePriority(connectionType, clientIP);
      
      if (!enhancedConnectionManager.addConnection(clientId, clientIP, socket, undefined, connectionType)) {
        socket.close(1008, 'Enhanced connection management failed');
        return;
      }
      
      const client: WebSocketClient = {
        id: clientId,
        socket,
        lastPing: Date.now(),
        connectionType,
        priority,
        errorCount: 0,
        messageCount: 0,
        lastActivity: Date.now(),
        bandwidthUsed: 0,
        healthStatus: 'excellent'
      };

      this.clients.set(clientId, client);
      this.performanceMetrics.connectionsTotal++;
      this.performanceMetrics.connectionsActive++;
      
      console.log(`✅ Bulletproof WebSocket client connected: ${clientId} (${connectionType}, ${priority} priority)`);

      // Setup client monitoring
      this.setupClientMonitoring(client, clientIP);

      // Send enhanced welcome message
      this.sendToClient(clientId, {
        type: "tool_status",
        data: { 
          status: "connected", 
          clientId, 
          serverCapabilities: this.getServerCapabilities(),
          config: {
            heartbeatInterval: this.config.heartbeatInterval,
            maxMessageSize: 1024 * 1024
          }
        },
        timestamp: Date.now(),
        priority: 'high'
      });

      socket.on('message', (data) => {
        this.handleMessage(clientId, data.toString(), clientIP);
      });

      socket.on('close', (code, reason) => {
        console.log(`WebSocket client ${clientId} disconnected: ${code} ${reason}`);
        this.handleDisconnect(clientId);
      });

      socket.on('error', (error) => {
        this.handleSocketError(clientId, error, clientIP);
      });

      socket.on('pong', () => {
        client.lastPing = Date.now();
        client.lastActivity = Date.now();
        this.updateClientHealth(clientId, 'pong_received');
      });
    });

    this.wss.on('error', (error) => {
      console.error('WebSocket server error:', error);
      this.emit('serverError', error);
    });
  }

  private setupClientMonitoring(client: WebSocketClient, clientIP: string) {
    // Monitor client health
    const healthCheckInterval = setInterval(() => {
      if (!this.clients.has(client.id)) {
        clearInterval(healthCheckInterval);
        return;
      }
      
      const now = Date.now();
      const timeSinceActivity = now - client.lastActivity;
      
      // Check for stale connections
      if (timeSinceActivity > this.config.connectionTimeout) {
        console.warn(`🕰️ Client ${client.id} timed out - removing`);
        this.removeClient(client.id);
        clearInterval(healthCheckInterval);
        return;
      }
      
      // Update health status based on activity and errors
      this.updateClientHealth(client.id, 'health_check');
      
      // Send ping if needed
      if (timeSinceActivity > this.config.heartbeatInterval && client.socket.readyState === WebSocket.OPEN) {
        client.socket.ping();
      }
    }, this.config.heartbeatInterval);
  }

  private handleMessage(clientId: string, data: string, clientIP: string) {
    try {
      const client = this.clients.get(clientId);
      if (!client) return;

      // Rate limiting per client
      if (!this.checkClientRateLimit(clientId)) {
        this.recordError(clientIP, 'rate_limit');
        this.sendToClient(clientId, {
          type: "tool_status",
          data: { error: "Rate limit exceeded", retryAfter: 60 },
          timestamp: Date.now()
        });
        return;
      }

      const message: WebSocketMessage = JSON.parse(data);
      
      // Update client metrics
      client.messageCount++;
      client.lastActivity = Date.now();
      client.bandwidthUsed += data.length;
      this.performanceMetrics.messagesProcessed++;
      
      // Enhanced connection manager activity update
      enhancedConnectionManager.updateActivity(clientId, data.length, message.type);

      // Validate message structure
      if (!this.validateMessage(message)) {
        this.recordError(clientIP, 'invalid_message');
        return;
      }

      // Handle message with priority queueing
      this.processMessage(clientId, message, client);
      
    } catch (error) {
      console.error(`Error processing message from ${clientId}:`, error);
      this.recordError(clientIP, 'message_processing');
      this.updateClientHealth(clientId, 'error');
    }
  }

  private processMessage(clientId: string, message: WebSocketMessage, client: WebSocketClient) {
    // Process high-priority messages immediately
    if (message.priority === 'critical' || message.priority === 'high') {
      this.executeMessage(clientId, message, client);
    } else {
      // Queue lower priority messages
      this.queueMessage(clientId, message);
    }
  }

  private executeMessage(clientId: string, message: WebSocketMessage, client: WebSocketClient) {
    switch (message.type) {
      case "instance_register":
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
          timestamp: Date.now(),
          requestId: message.requestId
        });
        break;

      case "heartbeat":
        client.lastActivity = Date.now();
        this.sendToClient(clientId, {
          type: "heartbeat",
          data: { 
            status: "alive", 
            serverTime: Date.now(),
            clientHealth: client.healthStatus 
          },
          timestamp: Date.now()
        });
        break;

      case "health_check":
        this.sendToClient(clientId, {
          type: "health_check",
          data: this.getClientHealthReport(clientId),
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
        console.warn(`Unknown message type: ${message.type} from client ${clientId}`);
    }
  }

  private queueMessage(clientId: string, message: WebSocketMessage) {
    if (!this.messageQueues.has(clientId)) {
      this.messageQueues.set(clientId, []);
    }
    
    const queue = this.messageQueues.get(clientId)!;
    
    // Check queue size limit
    if (queue.length >= this.config.maxMessageQueueSize) {
      // Remove oldest low-priority message
      const oldestIndex = queue.findIndex(q => q.priority < 3);
      if (oldestIndex !== -1) {
        queue.splice(oldestIndex, 1);
      } else {
        return; // Queue full with high-priority messages
      }
    }
    
    const priorityValue = this.getPriorityValue(message.priority);
    
    queue.push({
      id: this.generateMessageId(),
      message,
      priority: priorityValue,
      timestamp: Date.now(),
      retries: 0,
      maxRetries: 3
    });
    
    // Sort by priority
    queue.sort((a, b) => b.priority - a.priority);
  }

  private processMessageQueues() {
    this.messageQueues.forEach((queue, clientId) => {
      const client = this.clients.get(clientId);
      if (!client || queue.length === 0) return;
      
      // Process up to 10 messages per cycle
      const messagesToProcess = queue.splice(0, 10);
      
      messagesToProcess.forEach(queuedMessage => {
        try {
          this.executeMessage(clientId, queuedMessage.message, client);
        } catch (error) {
          console.error(`Error processing queued message for ${clientId}:`, error);
          
          // Retry logic
          if (queuedMessage.retries < queuedMessage.maxRetries) {
            queuedMessage.retries++;
            queue.unshift(queuedMessage); // Put back at front
          }
        }
      });
    });
  }

  private handleSocketError(clientId: string, error: Error, clientIP: string) {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    client.errorCount++;
    this.performanceMetrics.errorsTotal++;
    
    console.error(`WebSocket error for client ${clientId}:`, error.message || error);
    
    // Enhanced connection manager error recording
    enhancedConnectionManager.recordConnectionFailure(clientIP, 'socket_error');
    
    // Update circuit breaker
    this.recordError(clientIP, 'socket_error');
    
    // Classify error type and take appropriate action
    const errorType = this.classifyError(error);
    
    switch (errorType) {
      case 'network':
        console.log(`🔄 Network error for ${clientId}, allowing reconnection`);
        break;
      case 'resource_exhaustion':
        console.error(`🆘 Resource exhaustion detected for ${clientId}`);
        this.removeClient(clientId);
        break;
      case 'protocol_violation':
        console.warn(`⚠️ Protocol violation from ${clientId}`);
        this.removeClient(clientId);
        break;
      default:
        if (client.errorCount > 5) {
          console.warn(`🚫 Too many errors from ${clientId}, disconnecting`);
          this.removeClient(clientId);
        }
    }
    
    this.updateClientHealth(clientId, 'error');
  }

  private classifyError(error: Error): string {
    const message = error.message.toLowerCase();
    
    if (message.includes('econnreset') || message.includes('epipe') || message.includes('enotfound')) {
      return 'network';
    }
    if (message.includes('emfile') || message.includes('enfile')) {
      return 'resource_exhaustion';
    }
    if (message.includes('protocol') || message.includes('frame')) {
      return 'protocol_violation';
    }
    
    return 'unknown';
  }

  private handleDisconnect(clientId: string) {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    // Enhanced connection manager cleanup
    enhancedConnectionManager.removeConnection(clientId);
    
    // Remove from all subscriptions
    this.subscriptions.forEach((clients, topic) => {
      clients.delete(clientId);
      if (clients.size === 0) {
        this.subscriptions.delete(topic);
      }
    });

    // Clean up message queue
    this.messageQueues.delete(clientId);
    
    this.clients.delete(clientId);
    this.performanceMetrics.connectionsActive--;
    
    this.emit('clientDisconnected', { clientId, client });
  }

  private removeClient(clientId: string) {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    if (client.socket.readyState === WebSocket.OPEN || client.socket.readyState === WebSocket.CONNECTING) {
      client.socket.close(1008, 'Server initiated disconnect');
    }
    
    this.handleDisconnect(clientId);
  }

  private checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const limit = this.rateLimitCounters.get(ip);
    
    if (!limit || now > limit.resetTime) {
      this.rateLimitCounters.set(ip, {
        count: 1,
        resetTime: now + this.config.rateLimitWindowMs
      });
      return true;
    }
    
    if (limit.count >= this.config.rateLimitMaxRequests) {
      return false;
    }
    
    limit.count++;
    return true;
  }

  private checkClientRateLimit(clientId: string): boolean {
    const client = this.clients.get(clientId);
    if (!client) return false;
    
    // Simple rate limiting: max 100 messages per minute per client
    const now = Date.now();
    const timeWindow = 60000; // 1 minute
    
    // This is a simplified implementation - in production, use a sliding window
    return client.messageCount < 1000; // Allow up to 1000 messages total per connection
  }

  private recordError(ip: string, errorType: string) {
    let circuitBreaker = this.circuitBreakers.get(ip);
    if (!circuitBreaker) {
      circuitBreaker = { failures: 0, state: 'closed', lastFailure: 0 };
      this.circuitBreakers.set(ip, circuitBreaker);
    }
    
    circuitBreaker.failures++;
    circuitBreaker.lastFailure = Date.now();
    
    if (circuitBreaker.failures >= this.config.circuitBreakerThreshold) {
      circuitBreaker.state = 'open';
      console.warn(`🔴 Circuit breaker opened for IP ${ip} due to ${circuitBreaker.failures} failures`);
    }
  }

  private validateMessage(message: any): boolean {
    return message && 
           typeof message.type === 'string' && 
           typeof message.timestamp === 'number' &&
           message.timestamp > 0;
  }

  private updateClientHealth(clientId: string, event: string) {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    const now = Date.now();
    const timeSinceActivity = now - client.lastActivity;
    
    // Calculate health score based on various factors
    let healthScore = 100;
    
    // Penalty for errors
    healthScore -= client.errorCount * 10;
    
    // Penalty for inactivity
    if (timeSinceActivity > 60000) { // 1 minute
      healthScore -= Math.floor(timeSinceActivity / 60000) * 5;
    }
    
    // Bonus for recent activity
    if (event === 'pong_received' || event === 'message_received') {
      healthScore += 5;
    }
    
    // Penalty for high message frequency (potential spam)
    if (client.messageCount > 500) {
      healthScore -= 20;
    }
    
    healthScore = Math.max(0, Math.min(100, healthScore));
    
    // Update health status
    if (healthScore >= 90) {
      client.healthStatus = 'excellent';
    } else if (healthScore >= 70) {
      client.healthStatus = 'good';
    } else if (healthScore >= 50) {
      client.healthStatus = 'fair';
    } else if (healthScore >= 20) {
      client.healthStatus = 'poor';
    } else {
      client.healthStatus = 'critical';
    }
    
    // Take action for unhealthy clients
    if (client.healthStatus === 'critical') {
      console.warn(`⚠️ Client ${clientId} health is critical, considering disconnect`);
    }
  }

  private determineConnectionType(request: any): 'main' | 'floating' | 'admin' {
    const userAgent = request.headers['user-agent'] || '';
    const origin = request.headers['origin'] || '';
    
    if (userAgent.includes('admin') || origin.includes('admin')) {
      return 'admin';
    }
    if (userAgent.includes('floating') || request.url?.includes('floating')) {
      return 'floating';
    }
    return 'main';
  }

  private determinePriority(connectionType: string, ip: string): 'low' | 'medium' | 'high' | 'critical' {
    if (connectionType === 'admin') return 'critical';
    if (ip === '127.0.0.1' || ip === '::1') return 'high';
    if (connectionType === 'floating') return 'medium';
    return 'low';
  }

  private getPriorityValue(priority?: string): number {
    switch (priority) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 2;
    }
  }

  private getServerCapabilities() {
    return {
      compression: this.config.compressionEnabled,
      encryption: this.config.encryptionEnabled,
      queueing: true,
      circuitBreaker: true,
      healthMonitoring: true,
      rateLimiting: true
    };
  }

  private getClientHealthReport(clientId: string) {
    const client = this.clients.get(clientId);
    if (!client) return null;
    
    return {
      clientId,
      healthStatus: client.healthStatus,
      errorCount: client.errorCount,
      messageCount: client.messageCount,
      bandwidthUsed: client.bandwidthUsed,
      lastActivity: client.lastActivity,
      connectionAge: Date.now() - client.lastPing
    };
  }

  private heartbeatInterval: NodeJS.Timeout | null = null;
  
  private startHeartbeat() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = setInterval(() => {
      this.performHeartbeatCheck();
      this.processMessageQueues();
      this.cleanupStaleConnections();
    }, this.config.heartbeatInterval);
  }
  
  cleanup() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private performHeartbeatCheck() {
    const now = Date.now();
    const clientsToRemove: string[] = [];
    
    this.clients.forEach((client, clientId) => {
      if (client.socket.readyState === WebSocket.CLOSED || client.socket.readyState === WebSocket.CLOSING) {
        clientsToRemove.push(clientId);
      } else if (now - client.lastPing > this.config.connectionTimeout) {
        console.log(`Client ${clientId} timed out`);
        client.socket.terminate();
        clientsToRemove.push(clientId);
      } else if (now - client.lastPing > this.config.heartbeatInterval && client.socket.readyState === WebSocket.OPEN) {
        try {
          client.socket.ping();
        } catch (error) {
          console.error(`Failed to ping client ${clientId}:`, error);
          clientsToRemove.push(clientId);
        }
      }
    });
    
    clientsToRemove.forEach(clientId => {
      this.handleDisconnect(clientId);
    });
  }

  private cleanupStaleConnections() {
    const now = Date.now();
    
    // Reset circuit breakers that have been closed for a while
    this.circuitBreakers.forEach((breaker, ip) => {
      if (breaker.state === 'open' && now - breaker.lastFailure > 300000) { // 5 minutes
        breaker.state = 'half-open';
        breaker.failures = Math.floor(breaker.failures / 2);
      }
    });
    
    // Clean up old rate limit counters
    this.rateLimitCounters.forEach((limit, ip) => {
      if (now > limit.resetTime + 60000) { // Keep for 1 minute after reset
        this.rateLimitCounters.delete(ip);
      }
    });
  }

  private startPerformanceMonitoring() {
    setInterval(() => {
      this.updatePerformanceMetrics();
      this.optimizePerformance();
    }, 60000); // Every minute
  }

  private updatePerformanceMetrics() {
    this.performanceMetrics.connectionsActive = this.clients.size;
    
    // Calculate average latency (simplified)
    let totalLatency = 0;
    let latencyCount = 0;
    
    this.clients.forEach(client => {
      const latency = Date.now() - client.lastPing;
      if (latency < 60000) { // Only count recent pings
        totalLatency += latency;
        latencyCount++;
      }
    });
    
    this.performanceMetrics.averageLatency = latencyCount > 0 ? totalLatency / latencyCount : 0;
    
    // Log performance metrics
    if (this.clients.size > 1000) {
      console.log(`📊 Performance metrics:`, {
        connections: this.performanceMetrics.connectionsActive,
        messages: this.performanceMetrics.messagesProcessed,
        errors: this.performanceMetrics.errorsTotal,
        avgLatency: Math.round(this.performanceMetrics.averageLatency)
      });
    }
  }

  private optimizePerformance() {
    // Remove unhealthy connections
    const unhealthyClients: string[] = [];
    
    this.clients.forEach((client, clientId) => {
      if (client.healthStatus === 'critical' && client.errorCount > 10) {
        unhealthyClients.push(clientId);
      }
    });
    
    unhealthyClients.forEach(clientId => {
      console.warn(`🧹 Removing unhealthy client: ${clientId}`);
      this.removeClient(clientId);
    });
    
    // Force garbage collection if available and memory usage is high
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    
    if (heapUsedMB > 512 && global.gc) { // 512MB threshold
      global.gc();
    }
  }

  private startMaintenanceTasks() {
    // Clean up old data every 5 minutes
    setInterval(() => {
      this.performMaintenance();
    }, 300000);
  }

  private performMaintenance() {
    console.log(`🔧 Performing WebSocket maintenance: ${this.clients.size} clients`);
    
    // Clean up empty message queues
    this.messageQueues.forEach((queue, clientId) => {
      if (queue.length === 0 || !this.clients.has(clientId)) {
        this.messageQueues.delete(clientId);
      }
    });
    
    // Reset performance counters for inactive IPs
    const now = Date.now();
    this.circuitBreakers.forEach((breaker, ip) => {
      if (now - breaker.lastFailure > 3600000) { // 1 hour
        breaker.failures = 0;
        breaker.state = 'closed';
      }
    });
  }

  private setupGracefulShutdown() {
    const shutdown = () => {
      console.log('🔄 Shutting down WebSocket service gracefully...');
      
      // Notify all clients
      this.clients.forEach(client => {
        if (client.socket.readyState === WebSocket.OPEN) {
          this.sendToClient(client.id, {
            type: "tool_status",
            data: { status: "server_shutdown", message: "Server is shutting down" },
            timestamp: Date.now()
          });
          
          // Give clients time to process the message
          setTimeout(() => {
            client.socket.close(1001, 'Server shutdown');
          }, 1000);
        }
      });
      
      // Close the server
      setTimeout(() => {
        this.wss.close();
      }, 2000);
    };
    
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  }

  // Public methods for broadcasting events
  public broadcastToolExecution(toolName: string, status: string, payload?: any) {
    const message = {
      type: "tool_status" as const,
      data: {
        tool: toolName,
        status,
        payload,
        timestamp: Date.now()
      },
      timestamp: Date.now(),
      priority: 'high' as const
    };
    
    this.broadcastToTopic("tools", message);
  }

  public broadcastIntegrationUpdate(log: IntegrationLog) {
    this.broadcastToTopic("integrations", {
      type: "integration_update",
      data: log,
      timestamp: Date.now(),
      priority: 'medium'
    });
  }

  public broadcastTaskStarted(task: any) {
    this.broadcastToAll({
      type: "tool_status",
      data: { type: "task_started", task },
      timestamp: Date.now(),
      priority: 'medium'
    });
  }

  public broadcastTaskCompleted(task: any) {
    this.broadcastToAll({
      type: "tool_status", 
      data: { type: "task_completed", task },
      timestamp: Date.now(),
      priority: 'medium'
    });
  }

  public broadcastChatUpdate(sessionId: string, message: any) {
    this.broadcastToTopic(`chat:${sessionId}`, {
      type: "chat_typing",
      data: { typing: false, message },
      timestamp: Date.now(),
      priority: 'high'
    });
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

  private sendToClient(clientId: string, message: WebSocketMessage) {
    const client = this.clients.get(clientId);
    if (client && client.socket.readyState === WebSocket.OPEN) {
      try {
        const messageStr = JSON.stringify(message);
        client.socket.send(messageStr);
        client.bandwidthUsed += messageStr.length;
        enhancedConnectionManager.updateActivity(clientId, messageStr.length, 'outbound');
      } catch (error) {
        console.error(`Failed to send message to client ${clientId}:`, error);
        this.updateClientHealth(clientId, 'send_error');
        
        if (client.socket.readyState !== WebSocket.OPEN) {
          this.handleDisconnect(clientId);
        }
      }
    }
  }

  public broadcastToAll(message: WebSocketMessage) {
    this.clients.forEach((client, clientId) => {
      if (client.socket.readyState === WebSocket.OPEN) {
        this.sendToClient(clientId, message);
      }
    });
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

  private generateClientId(): string {
    return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  // Public methods for getting statistics
  public getStats() {
    return {
      ...this.performanceMetrics,
      clients: this.clients.size,
      subscriptions: this.subscriptions.size,
      messageQueues: this.messageQueues.size,
      circuitBreakers: this.circuitBreakers.size,
      config: this.config
    };
  }

  public getDetailedStats() {
    const clientsByHealth = new Map<string, number>();
    const clientsByType = new Map<string, number>();
    
    this.clients.forEach(client => {
      // Count by health
      const healthCount = clientsByHealth.get(client.healthStatus) || 0;
      clientsByHealth.set(client.healthStatus, healthCount + 1);
      
      // Count by type
      const typeCount = clientsByType.get(client.connectionType) || 0;
      clientsByType.set(client.connectionType, typeCount + 1);
    });
    
    return {
      performance: this.performanceMetrics,
      clients: {
        total: this.clients.size,
        byHealth: Object.fromEntries(clientsByHealth),
        byType: Object.fromEntries(clientsByType)
      },
      subscriptions: this.subscriptions.size,
      circuitBreakers: Array.from(this.circuitBreakers.entries()).map(([ip, state]) => ({
        ip, state: state.state, failures: state.failures
      })),
      config: this.config
    };
  }
}

let bulletproofWebSocketService: BulletproofWebSocketService | null = null;

export function initializeBulletproofWebSocketService(server: Server): BulletproofWebSocketService {
  if (!bulletproofWebSocketService) {
    bulletproofWebSocketService = new BulletproofWebSocketService(server);
  }
  return bulletproofWebSocketService;
}

export function getBulletproofWebSocketService(): BulletproofWebSocketService | null {
  return bulletproofWebSocketService;
}