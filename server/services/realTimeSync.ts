import WebSocket from 'ws';
import { memorySyncService } from './memorySyncService';

interface SyncMessage {
  type: 'memory_sync' | 'session_update' | 'message_broadcast';
  sessionId: string;
  sourceInstance: 'main' | 'floating';
  targetInstance: 'main' | 'floating' | 'all';
  data: any;
  timestamp: string;
}

class RealTimeSyncService {
  private connections = new Map<string, { ws: WebSocket; instance: string; sessionId?: string }>();
  
  registerConnection(connectionId: string, ws: WebSocket, instance: 'main' | 'floating') {
    this.connections.set(connectionId, { ws, instance });
    
    ws.on('close', () => {
      this.connections.delete(connectionId);
    });
    
    ws.on('message', (data) => {
      try {
        const message: SyncMessage = JSON.parse(data.toString());
        this.handleSyncMessage(connectionId, message);
      } catch (error) {
        console.error('Failed to parse sync message:', error);
      }
    });
  }
  
  private async handleSyncMessage(fromConnectionId: string, message: SyncMessage) {
    const fromConnection = this.connections.get(fromConnectionId);
    if (!fromConnection) return;
    
    switch (message.type) {
      case 'memory_sync':
        await this.syncMemoryAcrossInstances(message.sessionId, message.sourceInstance);
        break;
        
      case 'message_broadcast':
        await this.broadcastMessage(message, fromConnectionId);
        break;
        
      case 'session_update':
        await this.syncSessionUpdate(message);
        break;
    }
  }
  
  private async syncMemoryAcrossInstances(sessionId: string, sourceInstance: string) {
    try {
      const userId = "demo-user"; // TODO: Get from auth context
      const unifiedContext = await memorySyncService.getUnifiedContext(userId, sessionId);
      
      // Broadcast memory sync to all instances except the source
      this.connections.forEach((connection, connectionId) => {
        if (connection.instance !== sourceInstance && connection.ws.readyState === WebSocket.OPEN) {
          connection.ws.send(JSON.stringify({
            type: 'memory_synced',
            sessionId,
            context: unifiedContext,
            timestamp: new Date().toISOString()
          }));
        }
      });
    } catch (error) {
      console.error('Memory sync failed:', error);
    }
  }
  
  private async broadcastMessage(message: SyncMessage, fromConnectionId: string) {
    // Broadcast to target instances
    this.connections.forEach((connection, connectionId) => {
      if (connectionId !== fromConnectionId && connection.ws.readyState === WebSocket.OPEN) {
        if (message.targetInstance === 'all' || connection.instance === message.targetInstance) {
          connection.ws.send(JSON.stringify({
            type: 'message_received',
            data: message.data,
            fromInstance: message.sourceInstance,
            timestamp: message.timestamp
          }));
        }
      }
    });
  }
  
  private async syncSessionUpdate(message: SyncMessage) {
    // Update session information across all instances
    this.connections.forEach((connection, connectionId) => {
      if (connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(JSON.stringify({
          type: 'session_updated',
          sessionId: message.sessionId,
          data: message.data,
          timestamp: message.timestamp
        }));
      }
    });
  }
  
  async triggerCrossInstanceSync(sessionId: string, sourceInstance: 'main' | 'floating', data: any) {
    const userId = "demo-user"; // TODO: Get from auth context
    
    // Update memory synchronization
    await memorySyncService.handleCrossInstanceMessage(
      sessionId,
      userId,
      data.message || data.content,
      data.role || 'user',
      sourceInstance,
      data.metadata
    );
    
    // Notify all other instances
    this.connections.forEach((connection, connectionId) => {
      if (connection.instance !== sourceInstance && connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(JSON.stringify({
          type: 'cross_instance_update',
          sessionId,
          sourceInstance,
          data,
          timestamp: new Date().toISOString()
        }));
      }
    });
  }
}

export const realTimeSyncService = new RealTimeSyncService();