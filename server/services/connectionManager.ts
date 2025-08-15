import { WebSocket } from 'ws';

interface ConnectionLimits {
  maxConnectionsGlobal: number;
  maxConnectionsPerIP: number;
  connectionRateLimit: number; // ms between connections
  maxIdleTime: number; // ms before cleanup
}

interface TrackedConnection {
  id: string;
  ip: string;
  createdAt: number;
  lastActivity: number;
  socket: WebSocket;
}

class ConnectionManager {
  private connections: Map<string, TrackedConnection> = new Map();
  private ipConnectionCounts: Map<string, number> = new Map();
  private lastConnectionByIP: Map<string, number> = new Map();
  
  private limits: ConnectionLimits = {
    maxConnectionsGlobal: 1000,
    maxConnectionsPerIP: 20, // Temporarily increased to handle frontend connection issues
    connectionRateLimit: 500, // Reduced to 500ms to allow faster reconnection
    maxIdleTime: 300000 // 5 minutes
  };

  constructor() {
    // Cleanup idle connections every minute
    setInterval(() => this.cleanupIdleConnections(), 60000);
    
    // Emergency cleanup if too many connections
    setInterval(() => this.emergencyCleanup(), 30000);
  }

  canAcceptConnection(ip: string): { allowed: boolean; reason?: string } {
    const now = Date.now();
    
    // Check global connection limit
    if (this.connections.size >= this.limits.maxConnectionsGlobal) {
      return { allowed: false, reason: 'Global connection limit exceeded' };
    }
    
    // Check per-IP limit
    const ipConnections = this.ipConnectionCounts.get(ip) || 0;
    if (ipConnections >= this.limits.maxConnectionsPerIP) {
      return { allowed: false, reason: 'IP connection limit exceeded' };
    }
    
    // Check rate limiting
    const lastConnection = this.lastConnectionByIP.get(ip) || 0;
    if (now - lastConnection < this.limits.connectionRateLimit) {
      return { allowed: false, reason: 'Rate limit exceeded' };
    }
    
    return { allowed: true };
  }

  addConnection(id: string, ip: string, socket: WebSocket): boolean {
    const check = this.canAcceptConnection(ip);
    if (!check.allowed) {
      console.warn(`🚫 Connection rejected for ${ip}: ${check.reason}`);
      return false;
    }

    const now = Date.now();
    
    this.connections.set(id, {
      id,
      ip,
      createdAt: now,
      lastActivity: now,
      socket
    });

    // Update IP tracking
    const currentCount = this.ipConnectionCounts.get(ip) || 0;
    this.ipConnectionCounts.set(ip, currentCount + 1);
    this.lastConnectionByIP.set(ip, now);

    console.log(`✅ Connection accepted: ${id} from ${ip} (Total: ${this.connections.size})`);
    return true;
  }

  removeConnection(id: string): void {
    const connection = this.connections.get(id);
    if (!connection) return;

    const ip = connection.ip;
    const currentCount = this.ipConnectionCounts.get(ip) || 0;
    
    if (currentCount <= 1) {
      this.ipConnectionCounts.delete(ip);
    } else {
      this.ipConnectionCounts.set(ip, currentCount - 1);
    }

    this.connections.delete(id);
    console.log(`🔌 Connection removed: ${id} from ${ip} (Total: ${this.connections.size})`);
  }

  updateActivity(id: string): void {
    const connection = this.connections.get(id);
    if (connection) {
      connection.lastActivity = Date.now();
    }
  }

  private cleanupIdleConnections(): void {
    const now = Date.now();
    const toRemove: string[] = [];

    this.connections.forEach((connection, id) => {
      if (now - connection.lastActivity > this.limits.maxIdleTime) {
        toRemove.push(id);
        
        // Close the socket if it's still open
        if (connection.socket.readyState === WebSocket.OPEN) {
          connection.socket.close(1000, 'Idle timeout');
        }
      }
    });

    toRemove.forEach(id => this.removeConnection(id));
    
    if (toRemove.length > 0) {
      console.log(`🧹 Cleaned up ${toRemove.length} idle connections`);
    }
  }

  private emergencyCleanup(): void {
    if (this.connections.size > this.limits.maxConnectionsGlobal * 0.8) {
      console.warn(`🚨 Emergency cleanup triggered - ${this.connections.size} connections`);
      
      // Remove oldest connections
      const sorted = Array.from(this.connections.entries())
        .sort(([,a], [,b]) => a.createdAt - b.createdAt);
      
      const toRemove = sorted.slice(0, Math.floor(this.connections.size * 0.3));
      
      toRemove.forEach(([id, connection]) => {
        if (connection.socket.readyState === WebSocket.OPEN) {
          connection.socket.close(1008, 'Emergency cleanup');
        }
        this.removeConnection(id);
      });
      
      console.log(`🧹 Emergency cleanup removed ${toRemove.length} connections`);
    }
  }

  getStats() {
    return {
      totalConnections: this.connections.size,
      connectionsByIP: Object.fromEntries(this.ipConnectionCounts),
      oldestConnection: Math.min(...Array.from(this.connections.values()).map(c => c.createdAt)),
      limits: this.limits
    };
  }

  forceCleanup(): void {
    console.log(`🔄 Force cleanup of ${this.connections.size} connections`);
    
    this.connections.forEach((connection, id) => {
      if (connection.socket.readyState === WebSocket.OPEN) {
        connection.socket.close(1001, 'Server cleanup');
      }
    });

    this.connections.clear();
    this.ipConnectionCounts.clear();
    this.lastConnectionByIP.clear();
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }
}

export const connectionManager = new ConnectionManager();