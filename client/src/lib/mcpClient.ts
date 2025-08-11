import { apiRequest } from '@/lib/queryClient';

const KEY = import.meta.env.VITE_MCP_KEY || "";
const API_BASE = 
  import.meta.env.VITE_API_BASE ||
  (location.origin.includes(":5173")
    ? location.origin.replace(":5173", ":5000") 
    : location.origin); // dev: 5173→5000 ; prod: same origin

export async function mcpRun(name: string, payload: any) {
  try {
    const response = await apiRequest("POST", "/api/mcp/execute", { tool: name, payload });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('MCP tool execution failed:', error);
    throw error;
  }
}

export function mcpConnect(onMessage?: (message: any) => void) {
  const apiUrl = new URL(API_BASE);
  const wsProto = apiUrl.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${wsProto}//${apiUrl.host}/ws`;
  
  const ws = new WebSocket(wsUrl);
  
  ws.onmessage = (msg) => {
    try {
      const data = JSON.parse(msg.data);
      onMessage?.(data);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
  
  ws.onopen = () => {
    console.log('MCP WebSocket connected');
  };
  
  ws.onclose = () => {
    console.log('MCP WebSocket disconnected');
  };
  
  return ws;
}

export async function mcpListTools() {
  try {
    const response = await apiRequest("GET", "/api/mcp/tools");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch MCP tools:', error);
    throw error;
  }
}