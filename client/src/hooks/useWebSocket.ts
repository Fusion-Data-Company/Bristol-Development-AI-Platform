import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  data?: any;
  timestamp: number;
}

interface UseWebSocketOptions {
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  autoReconnect?: boolean; // URGENT: Added to disable auto-reconnect
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    reconnectInterval = 5000,
    maxReconnectAttempts = 5,
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    autoReconnect = false // URGENT: Disabled by default to prevent spam
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutId = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalId = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionStatus('connecting');

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttempts.current = 0;
        onConnect?.();

        // Start ping interval
        pingIntervalId.current = setInterval(() => {
          if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({
              type: 'ping',
              timestamp: Date.now()
            }));
          }
        }, 30000); // Ping every 30 seconds
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          onMessage?.(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onclose = (event) => {
        setIsConnected(false);
        setConnectionStatus('disconnected');
        onDisconnect?.();

        // Clear ping interval
        if (pingIntervalId.current) {
          clearInterval(pingIntervalId.current);
          pingIntervalId.current = null;
        }

        // URGENT: Only reconnect if explicitly enabled and not a manual close
        if (autoReconnect && event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          console.log(`WebSocket reconnect attempt ${reconnectAttempts.current}/${maxReconnectAttempts} in ${reconnectInterval}ms`);
          reconnectTimeoutId.current = setTimeout(() => {
            if (autoReconnect) { // Double check before reconnecting
              connect();
            }
          }, reconnectInterval);
        } else {
          console.log('WebSocket closed - auto-reconnect disabled or manual close');
        }
      };

      ws.current.onerror = (error) => {
        setConnectionStatus('error');
        onError?.(error);
        console.warn('Legacy WebSocket error (non-critical):', error.type || 'error');
        // URGENT: Don't spam console with WebSocket errors
      };

    } catch (error) {
      setConnectionStatus('error');
      console.warn('WebSocket connection failed (non-critical):', error instanceof Error ? error.message : 'unknown error');
      // URGENT: Don't treat WebSocket failures as critical errors
    }
  }, [autoReconnect, maxReconnectAttempts, reconnectInterval, onConnect, onDisconnect, onMessage, onError]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutId.current) {
      clearTimeout(reconnectTimeoutId.current);
      reconnectTimeoutId.current = null;
    }

    if (pingIntervalId.current) {
      clearInterval(pingIntervalId.current);
      pingIntervalId.current = null;
    }

    if (ws.current) {
      ws.current.close(1000, 'Client disconnect');
      ws.current = null;
    }

    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, []);

  const sendMessage = useCallback((message: Omit<WebSocketMessage, 'timestamp'>) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      const fullMessage: WebSocketMessage = {
        ...message,
        timestamp: Date.now()
      };
      ws.current.send(JSON.stringify(fullMessage));
      return true;
    }
    return false;
  }, []);

  const subscribe = useCallback((topic: string) => {
    return sendMessage({
      type: 'subscribe',
      data: { topic }
    });
  }, [sendMessage]);

  const unsubscribe = useCallback((topic: string) => {
    return sendMessage({
      type: 'unsubscribe',
      data: { topic }
    });
  }, [sendMessage]);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, []); // FIXED: Empty dependency array to prevent connection loops

  return {
    isConnected,
    connectionStatus,
    lastMessage,
    sendMessage,
    subscribe,
    unsubscribe,
    connect,
    disconnect
  };
}
