import { WebSocketServer } from 'ws';
import type { IncomingMessage } from 'http';

const connectionsByIp = new Map<string, number>();
const MAX_CONNECTIONS_PER_IP = 3;

export function attachWS(server: any) {
  const wss = new WebSocketServer({ server, path: '/ws' });
  
  wss.on('connection', (socket, req: IncomingMessage) => {
    // Extract real IP address
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() 
              || req.socket.remoteAddress 
              || 'unknown';
    
    // Check connection limit per IP
    const nowCount = (connectionsByIp.get(ip) || 0) + 1;
    if (nowCount > MAX_CONNECTIONS_PER_IP) {
      console.warn(`Too many connections from ${ip}: ${nowCount}/${MAX_CONNECTIONS_PER_IP}`);
      socket.close(4429, 'TooManyConnections');
      return;
    }
    
    connectionsByIp.set(ip, nowCount);
    console.log(`WebSocket connection from ${ip}: ${nowCount}/${MAX_CONNECTIONS_PER_IP}`);
    
    // Parse token from query string
    const url = new URL(req.url || '', 'ws://localhost');
    const token = url.searchParams.get('t');
    
    if (!token || token === 'undefined') {
      console.warn(`Rejected connection from ${ip}: missing or invalid token`);
      socket.close(4401, 'Unauthorized: missing token');
      connectionsByIp.set(ip, (connectionsByIp.get(ip) || 1) - 1);
      return;
    }
    
    // Connection successful
    socket.on('close', () => {
      connectionsByIp.set(ip, (connectionsByIp.get(ip) || 1) - 1);
      console.log(`WebSocket disconnected from ${ip}: ${(connectionsByIp.get(ip) || 0)}/${MAX_CONNECTIONS_PER_IP}`);
    });
    
    socket.on('error', (error) => {
      console.error(`WebSocket error from ${ip}:`, error.message);
      connectionsByIp.set(ip, (connectionsByIp.get(ip) || 1) - 1);
    });
    
    // Send welcome message
    socket.send(JSON.stringify({
      type: 'welcome',
      data: { connected: true, ip }
    }));
  });
  
  return wss;
}