import { WebSocket } from 'ws';
import { EventEmitter } from 'events';

interface EnhancedConnectionLimits {
  maxConnectionsGlobal: number;
  maxConnectionsPerIP: number;
  maxConnectionsPerUser: number;
  connectionRateLimit: number;
  maxIdleTime: number;
  maxBandwidthPerConnection: number; // bytes per second
  heartbeatInterval: number;
  reconnectionBackoff: number[];
}

interface ConnectionMetrics {
  id: string;
  ip: string;
  userId?: string;
  createdAt: number;
  lastActivity: number;
  bytesSent: number;
  bytesReceived: number;
  messageCount: number;
  errorCount: number;
  socket: WebSocket;
  connectionType: 'main' | 'floating' | 'admin';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface ConnectionHealth {
  latency: number;
  packetLoss: number;
  bandwidth: number;
  errorRate: number;
  stability: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
}

interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'closed' | 'open' | 'half-open';
  threshold: number;
  timeout: number;
}

class EnhancedConnectionManager extends EventEmitter {
  private connections: Map<string, ConnectionMetrics> = new Map();
  private ipConnectionCounts: Map<string, number> = new Map();
  private userConnectionCounts: Map<string, number> = new Map();
  private lastConnectionByIP: Map<string, number> = new Map();
  private connectionHealth: Map<string, ConnectionHealth> = new Map();
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private connectionPools: Map<string, Set<string>> = new Map();
  
  private limits: EnhancedConnectionLimits = {
    maxConnectionsGlobal: 10000,
    maxConnectionsPerIP: 200,
    maxConnectionsPerUser: 10,
    connectionRateLimit: 50, // ms between connections
    maxIdleTime: 300000, // 5 minutes
    maxBandwidthPerConnection: 1024 * 1024, // 1MB/s
    heartbeatInterval: 30000, // 30 seconds
    reconnectionBackoff: [1000, 2000, 5000, 10000, 30000] // exponential backoff
  };

  // Enhanced error tracking with categorization
  private errorTracking: Map<string, {
    networkErrors: number;
    timeoutErrors: number;
    protocolErrors: number;
    authErrors: number;
    lastErrorReset: number;
  }> = new Map();

  private readonly ERROR_RESET_INTERVAL = 300000; // 5 minutes
  private readonly HEALTH_CHECK_INTERVAL = 60000; // 1 minute
  private readonly CIRCUIT_BREAKER_THRESHOLD = 10;
  private readonly CIRCUIT_BREAKER_TIMEOUT = 60000; // 1 minute

  constructor() {
    super();
    this.startHealthMonitoring();
    this.startPerformanceOptimization();
    this.startSecurityMonitoring();
  }

  // Enhanced connection acceptance with comprehensive checks
  canAcceptConnection(ip: string, userId?: string, connectionType: string = 'main'): { 
    allowed: boolean; 
    reason?: string; 
    priority?: string;
    retryAfter?: number;
  } {
    const now = Date.now();
    
    // Reset error counts periodically
    this.resetOldErrorCounts(now);
    
    // Check circuit breaker for this IP
    const circuitBreaker = this.getCircuitBreaker(ip);
    if (circuitBreaker.state === 'open') {
      const timeSinceFailure = now - circuitBreaker.lastFailureTime;
      if (timeSinceFailure < circuitBreaker.timeout) {
        return { 
          allowed: false, 
          reason: 'Circuit breaker open due to repeated failures',
          retryAfter: Math.ceil((circuitBreaker.timeout - timeSinceFailure) / 1000)
        };
      } else {
        // Move to half-open state
        circuitBreaker.state = 'half-open';
      }
    }
    
    // Always allow localhost and private networks
    if (this.isPrivateNetwork(ip)) {
      return { allowed: true, priority: 'high' };
    }
    
    // Check global connection limit with reserved slots for critical connections
    const criticalReservedSlots = Math.floor(this.limits.maxConnectionsGlobal * 0.1);
    const availableSlots = this.limits.maxConnectionsGlobal - criticalReservedSlots;
    
    if (this.connections.size >= availableSlots && connectionType !== 'admin') {
      this.performEmergencyCleanup();
      if (this.connections.size >= availableSlots) {
        return { 
          allowed: false, 
          reason: 'Global connection limit exceeded',
          retryAfter: 60
        };
      }
    }
    
    // Check per-IP limit with dynamic adjustment based on behavior
    const ipConnections = this.ipConnectionCounts.get(ip) || 0;
    const errorStats = this.errorTracking.get(ip);
    const adjustedIPLimit = this.calculateDynamicIPLimit(ip, errorStats);
    
    if (ipConnections >= adjustedIPLimit) {
      return { 
        allowed: false, 
        reason: `IP connection limit exceeded (${ipConnections}/${adjustedIPLimit})`,
        retryAfter: 300
      };
    }
    
    // Check per-user limit
    if (userId) {
      const userConnections = this.userConnectionCounts.get(userId) || 0;
      if (userConnections >= this.limits.maxConnectionsPerUser) {
        return { 
          allowed: false, 
          reason: 'User connection limit exceeded',
          retryAfter: 120
        };
      }
    }
    
    // Check rate limiting
    const lastConnection = this.lastConnectionByIP.get(ip) || 0;
    const timeSinceLastConnection = now - lastConnection;
    if (timeSinceLastConnection < this.limits.connectionRateLimit) {
      return { 
        allowed: false, 
        reason: 'Connection rate limit exceeded',
        retryAfter: Math.ceil((this.limits.connectionRateLimit - timeSinceLastConnection) / 1000)
      };
    }
    
    return { allowed: true, priority: this.calculateConnectionPriority(ip, userId, connectionType) };
  }

  // Enhanced connection addition with comprehensive tracking
  addConnection(
    id: string, 
    ip: string, 
    socket: WebSocket, 
    userId?: string,
    connectionType: 'main' | 'floating' | 'admin' = 'main'
  ): boolean {
    const check = this.canAcceptConnection(ip, userId, connectionType);
    if (!check.allowed) {
      console.warn(`🚫 Connection rejected for ${ip}: ${check.reason}`);
      return false;
    }

    const now = Date.now();
    const priority = this.determinePriority(check.priority, connectionType);
    
    const connectionMetrics: ConnectionMetrics = {
      id,
      ip,
      userId,
      createdAt: now,
      lastActivity: now,
      bytesSent: 0,
      bytesReceived: 0,
      messageCount: 0,
      errorCount: 0,
      socket,
      connectionType,
      priority
    };

    this.connections.set(id, connectionMetrics);

    // Update tracking maps
    const currentIPCount = this.ipConnectionCounts.get(ip) || 0;
    this.ipConnectionCounts.set(ip, currentIPCount + 1);
    
    if (userId) {
      const currentUserCount = this.userConnectionCounts.get(userId) || 0;
      this.userConnectionCounts.set(userId, currentUserCount + 1);
    }
    
    this.lastConnectionByIP.set(ip, now);

    // Add to connection pool
    this.addToConnectionPool(ip, id);

    // Initialize health tracking
    this.connectionHealth.set(id, {
      latency: 0,
      packetLoss: 0,
      bandwidth: 0,
      errorRate: 0,
      stability: 'excellent'
    });

    // Setup connection monitoring
    this.setupConnectionMonitoring(connectionMetrics);

    console.log(`✅ Enhanced connection accepted: ${id} from ${ip} (${connectionType}, ${priority} priority) - Total: ${this.connections.size}`);
    
    this.emit('connectionAdded', { id, ip, userId, connectionType, priority });
    return true;
  }

  // Enhanced connection removal with comprehensive cleanup
  removeConnection(id: string): void {
    const connection = this.connections.get(id);
    if (!connection) return;

    const { ip, userId } = connection;

    // Update IP count
    const currentIPCount = this.ipConnectionCounts.get(ip) || 0;
    if (currentIPCount <= 1) {
      this.ipConnectionCounts.delete(ip);
    } else {
      this.ipConnectionCounts.set(ip, currentIPCount - 1);
    }

    // Update user count
    if (userId) {
      const currentUserCount = this.userConnectionCounts.get(userId) || 0;
      if (currentUserCount <= 1) {
        this.userConnectionCounts.delete(userId);
      } else {
        this.userConnectionCounts.set(userId, currentUserCount - 1);
      }
    }

    // Remove from connection pool
    this.removeFromConnectionPool(ip, id);

    // Cleanup tracking maps
    this.connections.delete(id);
    this.connectionHealth.delete(id);

    console.log(`🔌 Enhanced connection removed: ${id} from ${ip} - Total: ${this.connections.size}`);
    
    this.emit('connectionRemoved', { id, ip, userId });
  }

  // Enhanced activity tracking with bandwidth monitoring
  updateActivity(id: string, bytesTransferred: number = 0, messageType: string = 'data'): void {
    const connection = this.connections.get(id);
    if (!connection) return;

    const now = Date.now();
    connection.lastActivity = now;
    connection.messageCount++;
    
    if (bytesTransferred > 0) {
      connection.bytesSent += bytesTransferred;
    }

    // Check bandwidth limits
    const timeWindow = 1000; // 1 second
    const recentTransfer = this.calculateRecentBandwidth(connection, timeWindow);
    
    if (recentTransfer > this.limits.maxBandwidthPerConnection) {
      console.warn(`⚠️ Bandwidth limit exceeded for connection ${id}: ${recentTransfer} bytes/sec`);
      this.recordError(connection.ip, 'bandwidth');
    }

    // Update health metrics
    this.updateConnectionHealth(id, messageType);
  }

  // Circuit breaker management
  private getCircuitBreaker(ip: string): CircuitBreakerState {
    if (!this.circuitBreakers.has(ip)) {
      this.circuitBreakers.set(ip, {
        failures: 0,
        lastFailureTime: 0,
        state: 'closed',
        threshold: this.CIRCUIT_BREAKER_THRESHOLD,
        timeout: this.CIRCUIT_BREAKER_TIMEOUT
      });
    }
    return this.circuitBreakers.get(ip)!;
  }

  recordConnectionFailure(ip: string, errorType: string): void {
    const circuitBreaker = this.getCircuitBreaker(ip);
    circuitBreaker.failures++;
    circuitBreaker.lastFailureTime = Date.now();

    if (circuitBreaker.failures >= circuitBreaker.threshold) {
      circuitBreaker.state = 'open';
      console.warn(`🔴 Circuit breaker opened for IP ${ip} due to ${circuitBreaker.failures} failures`);
    }

    this.recordError(ip, errorType);
  }

  recordConnectionSuccess(ip: string): void {
    const circuitBreaker = this.getCircuitBreaker(ip);
    if (circuitBreaker.state === 'half-open') {
      circuitBreaker.state = 'closed';
      circuitBreaker.failures = 0;
      console.log(`🟢 Circuit breaker closed for IP ${ip} - connection successful`);
    }
  }

  // Enhanced health monitoring
  private startHealthMonitoring(): void {
    setInterval(() => {
      this.performHealthChecks();
      this.optimizeConnections();
      this.generateHealthReport();
    }, this.HEALTH_CHECK_INTERVAL);
  }

  private performHealthChecks(): void {
    const now = Date.now();
    const unhealthyConnections: string[] = [];

    this.connections.forEach((connection, id) => {
      const health = this.connectionHealth.get(id);
      if (!health) return;

      // Check for stale connections
      if (now - connection.lastActivity > this.limits.maxIdleTime) {
        unhealthyConnections.push(id);
        return;
      }

      // Check error rate
      if (health.errorRate > 0.1) { // 10% error rate threshold
        health.stability = 'poor';
        if (health.errorRate > 0.5) {
          unhealthyConnections.push(id);
        }
      }

      // Check latency
      if (health.latency > 5000) { // 5 second threshold
        health.stability = 'critical';
        unhealthyConnections.push(id);
      }
    });

    // Clean up unhealthy connections
    unhealthyConnections.forEach(id => {
      const connection = this.connections.get(id);
      if (connection) {
        console.warn(`🩺 Removing unhealthy connection: ${id} from ${connection.ip}`);
        if (connection.socket.readyState === WebSocket.OPEN) {
          connection.socket.close(1008, 'Connection health check failed');
        }
        this.removeConnection(id);
      }
    });
  }

  // Performance optimization
  private startPerformanceOptimization(): void {
    setInterval(() => {
      this.balanceConnectionLoads();
      this.optimizeMemoryUsage();
      this.updateDynamicLimits();
    }, 30000); // Every 30 seconds
  }

  private balanceConnectionLoads(): void {
    const connectionsByIP = new Map<string, ConnectionMetrics[]>();
    
    // Group connections by IP
    this.connections.forEach(connection => {
      const existing = connectionsByIP.get(connection.ip) || [];
      existing.push(connection);
      connectionsByIP.set(connection.ip, existing);
    });

    // Identify overloaded IPs
    connectionsByIP.forEach((connections, ip) => {
      if (connections.length > 50) { // Threshold for load balancing
        console.log(`⚖️ Load balancing for IP ${ip} with ${connections.length} connections`);
        
        // Sort by priority and activity
        connections.sort((a, b) => {
          if (a.priority !== b.priority) {
            const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
          }
          return b.lastActivity - a.lastActivity;
        });

        // Keep only high-priority and recent connections
        const toKeep = connections.slice(0, 30);
        const toRemove = connections.slice(30);

        toRemove.forEach(connection => {
          if (connection.socket.readyState === WebSocket.OPEN) {
            connection.socket.close(1000, 'Load balancing - please reconnect');
          }
          this.removeConnection(connection.id);
        });
      }
    });
  }

  // Security monitoring
  private startSecurityMonitoring(): void {
    setInterval(() => {
      this.detectAnomalousPatterns();
      this.updateThreatIntelligence();
      this.enforceSecurityPolicies();
    }, 60000); // Every minute
  }

  private detectAnomalousPatterns(): void {
    const now = Date.now();
    const suspiciousIPs: string[] = [];

    this.errorTracking.forEach((errors, ip) => {
      const totalErrors = errors.networkErrors + errors.timeoutErrors + errors.protocolErrors + errors.authErrors;
      const timeWindow = now - errors.lastErrorReset;
      
      if (totalErrors > 50 && timeWindow < 300000) { // 50 errors in 5 minutes
        suspiciousIPs.push(ip);
      }
    });

    suspiciousIPs.forEach(ip => {
      console.warn(`🚨 Suspicious activity detected from IP: ${ip}`);
      const circuitBreaker = this.getCircuitBreaker(ip);
      circuitBreaker.state = 'open';
      circuitBreaker.timeout = 3600000; // 1 hour block
    });
  }

  // Utility methods
  private isPrivateNetwork(ip: string): boolean {
    return ip === '127.0.0.1' || 
           ip === '::1' || 
           ip.startsWith('192.168.') || 
           ip.startsWith('10.') || 
           ip.startsWith('172.31.') ||
           ip.startsWith('172.16.');
  }

  private calculateDynamicIPLimit(ip: string, errorStats?: any): number {
    let baseLimit = this.limits.maxConnectionsPerIP;
    
    if (errorStats) {
      const totalErrors = errorStats.networkErrors + errorStats.timeoutErrors + errorStats.protocolErrors;
      if (totalErrors > 10) {
        baseLimit = Math.max(baseLimit * 0.5, 5); // Reduce limit for problematic IPs
      }
    }
    
    return Math.floor(baseLimit);
  }

  private calculateConnectionPriority(ip: string, userId?: string, connectionType?: string): string {
    if (connectionType === 'admin') return 'critical';
    if (this.isPrivateNetwork(ip)) return 'high';
    if (userId) return 'medium';
    return 'low';
  }

  private determinePriority(suggestedPriority?: string, connectionType?: string): 'low' | 'medium' | 'high' | 'critical' {
    if (connectionType === 'admin') return 'critical';
    if (suggestedPriority === 'high') return 'high';
    if (suggestedPriority === 'medium') return 'medium';
    return 'low';
  }

  private setupConnectionMonitoring(connection: ConnectionMetrics): void {
    const startTime = Date.now();
    
    // Monitor for ping/pong to calculate latency
    connection.socket.on('pong', () => {
      const health = this.connectionHealth.get(connection.id);
      if (health) {
        health.latency = Date.now() - startTime;
      }
    });

    // Monitor for errors
    connection.socket.on('error', (error) => {
      connection.errorCount++;
      this.recordConnectionFailure(connection.ip, 'socket_error');
      
      const health = this.connectionHealth.get(connection.id);
      if (health) {
        health.errorRate = connection.errorCount / connection.messageCount;
      }
    });
  }

  private addToConnectionPool(ip: string, connectionId: string): void {
    if (!this.connectionPools.has(ip)) {
      this.connectionPools.set(ip, new Set());
    }
    this.connectionPools.get(ip)!.add(connectionId);
  }

  private removeFromConnectionPool(ip: string, connectionId: string): void {
    const pool = this.connectionPools.get(ip);
    if (pool) {
      pool.delete(connectionId);
      if (pool.size === 0) {
        this.connectionPools.delete(ip);
      }
    }
  }

  private calculateRecentBandwidth(connection: ConnectionMetrics, timeWindow: number): number {
    // Simplified bandwidth calculation - in production, this would track time-windowed data
    return connection.bytesSent + connection.bytesReceived;
  }

  private updateConnectionHealth(id: string, messageType: string): void {
    const health = this.connectionHealth.get(id);
    if (!health) return;

    // Update health metrics based on message type and patterns
    if (messageType === 'error') {
      health.errorRate = Math.min(health.errorRate + 0.01, 1.0);
    } else {
      health.errorRate = Math.max(health.errorRate - 0.001, 0);
    }

    // Update stability rating
    if (health.errorRate < 0.01 && health.latency < 1000) {
      health.stability = 'excellent';
    } else if (health.errorRate < 0.05 && health.latency < 2000) {
      health.stability = 'good';
    } else if (health.errorRate < 0.1 && health.latency < 5000) {
      health.stability = 'fair';
    } else {
      health.stability = 'poor';
    }
  }

  private recordError(ip: string, errorType: string): void {
    if (!this.errorTracking.has(ip)) {
      this.errorTracking.set(ip, {
        networkErrors: 0,
        timeoutErrors: 0,
        protocolErrors: 0,
        authErrors: 0,
        lastErrorReset: Date.now()
      });
    }

    const errors = this.errorTracking.get(ip)!;
    
    switch (errorType) {
      case 'network':
      case 'socket_error':
        errors.networkErrors++;
        break;
      case 'timeout':
        errors.timeoutErrors++;
        break;
      case 'protocol':
        errors.protocolErrors++;
        break;
      case 'auth':
        errors.authErrors++;
        break;
    }
  }

  private resetOldErrorCounts(now: number): void {
    this.errorTracking.forEach((errors, ip) => {
      if (now - errors.lastErrorReset > this.ERROR_RESET_INTERVAL) {
        errors.networkErrors = 0;
        errors.timeoutErrors = 0;
        errors.protocolErrors = 0;
        errors.authErrors = 0;
        errors.lastErrorReset = now;
      }
    });
  }

  private performEmergencyCleanup(): void {
    console.warn(`🚨 Emergency cleanup triggered - ${this.connections.size} connections`);
    
    const connectionsArray = Array.from(this.connections.values());
    
    // Sort by priority and activity (remove low priority, inactive connections first)
    connectionsArray.sort((a, b) => {
      const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
      if (a.priority !== b.priority) {
        return priorityOrder[b.priority] - priorityOrder[a.priority]; // Higher priority first
      }
      return a.lastActivity - b.lastActivity; // Older activity first
    });

    // Remove 20% of connections, starting with lowest priority
    const toRemove = connectionsArray.slice(-Math.floor(this.connections.size * 0.2));
    
    toRemove.forEach(connection => {
      if (connection.socket.readyState === WebSocket.OPEN) {
        connection.socket.close(1001, 'Emergency cleanup - please reconnect');
      }
      this.removeConnection(connection.id);
    });
    
    console.log(`🧹 Emergency cleanup removed ${toRemove.length} connections`);
  }

  private optimizeConnections(): void {
    // Implementation for connection optimization
  }

  private generateHealthReport(): void {
    // Implementation for health reporting
  }

  private optimizeMemoryUsage(): void {
    // Clear old health data
    const cutoffTime = Date.now() - 300000; // 5 minutes
    
    this.connectionHealth.forEach((health, id) => {
      const connection = this.connections.get(id);
      if (!connection || connection.lastActivity < cutoffTime) {
        this.connectionHealth.delete(id);
      }
    });

    // Clean up old circuit breaker data
    this.circuitBreakers.forEach((breaker, ip) => {
      if (breaker.state === 'closed' && Date.now() - breaker.lastFailureTime > 3600000) {
        breaker.failures = 0;
      }
    });
  }

  private updateDynamicLimits(): void {
    // Adjust limits based on current system performance
    const memUsage = process.memoryUsage();
    const heapUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    
    if (heapUsagePercent > 80) {
      // Reduce limits when memory is high
      this.limits.maxConnectionsGlobal = Math.max(this.limits.maxConnectionsGlobal * 0.9, 1000);
      this.limits.maxConnectionsPerIP = Math.max(this.limits.maxConnectionsPerIP * 0.9, 10);
    } else if (heapUsagePercent < 50) {
      // Increase limits when memory is available
      this.limits.maxConnectionsGlobal = Math.min(this.limits.maxConnectionsGlobal * 1.1, 10000);
      this.limits.maxConnectionsPerIP = Math.min(this.limits.maxConnectionsPerIP * 1.1, 200);
    }
  }

  private updateThreatIntelligence(): void {
    // Implementation for threat intelligence updates
  }

  private enforceSecurityPolicies(): void {
    // Implementation for security policy enforcement
  }

  // Public methods for getting statistics and health information
  getDetailedStats() {
    const connectionsByType = new Map<string, number>();
    const connectionsByPriority = new Map<string, number>();
    const healthByStability = new Map<string, number>();

    this.connections.forEach(connection => {
      // Count by type
      const typeCount = connectionsByType.get(connection.connectionType) || 0;
      connectionsByType.set(connection.connectionType, typeCount + 1);

      // Count by priority
      const priorityCount = connectionsByPriority.get(connection.priority) || 0;
      connectionsByPriority.set(connection.priority, priorityCount + 1);
    });

    this.connectionHealth.forEach(health => {
      const stabilityCount = healthByStability.get(health.stability) || 0;
      healthByStability.set(health.stability, stabilityCount + 1);
    });

    return {
      totalConnections: this.connections.size,
      connectionsByIP: Object.fromEntries(this.ipConnectionCounts),
      connectionsByUser: Object.fromEntries(this.userConnectionCounts),
      connectionsByType: Object.fromEntries(connectionsByType),
      connectionsByPriority: Object.fromEntries(connectionsByPriority),
      healthByStability: Object.fromEntries(healthByStability),
      circuitBreakerStats: Array.from(this.circuitBreakers.entries()).map(([ip, state]) => ({
        ip, state: state.state, failures: state.failures
      })),
      errorStats: Object.fromEntries(this.errorTracking),
      limits: this.limits,
      timestamp: new Date().toISOString()
    };
  }

  forceCleanup(): void {
    console.log(`🔄 Force cleanup of ${this.connections.size} connections`);
    
    this.connections.forEach(connection => {
      if (connection.socket.readyState === WebSocket.OPEN) {
        connection.socket.close(1001, 'Server cleanup');
      }
    });

    this.connections.clear();
    this.ipConnectionCounts.clear();
    this.userConnectionCounts.clear();
    this.lastConnectionByIP.clear();
    this.connectionHealth.clear();
    this.connectionPools.clear();
    this.errorTracking.clear();
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }
}

export const enhancedConnectionManager = new EnhancedConnectionManager();