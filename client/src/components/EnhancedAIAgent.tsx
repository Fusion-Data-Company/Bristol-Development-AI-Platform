import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Bot, 
  Brain, 
  Database, 
  Activity, 
  Send, 
  Settings, 
  Zap, 
  Eye,
  MessageSquare,
  BarChart3,
  Wifi,
  WifiOff,
  Loader2,
  Play,
  Square,
  RefreshCw,
  Download,
  Upload
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EnhancedMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    enhanced?: boolean;
    model?: string;
    dataContextUsed?: boolean;
    toolsExecuted?: any[];
    processingTime?: number;
  };
}

interface DataContext {
  sites: any[];
  analytics: any;
  realTimeMetrics: any;
  integrationStatus: any;
  mcpTools: any[];
}

interface WSMessage {
  type: 'message' | 'data_update' | 'tool_execution' | 'system';
  sessionId?: string;
  data: any;
}

export default function EnhancedAIAgent() {
  // State management
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<EnhancedMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [dataMonitoring, setDataMonitoring] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  // AI Configuration
  const [selectedModel, setSelectedModel] = useState("gpt-4o");
  const [useRealTimeData, setUseRealTimeData] = useState(true);
  const [executeMCPTools, setExecuteMCPTools] = useState(true);
  const [autoRefreshData, setAutoRefreshData] = useState(true);
  
  // Data context
  const [dataContext, setDataContext] = useState<DataContext | null>(null);
  const [toolExecutions, setToolExecutions] = useState<any[]>([]);
  
  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // WebSocket connection
  useEffect(() => {
    if (isExpanded) {
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }

    return () => disconnectWebSocket();
  }, [isExpanded]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch available models
  const { data: availableModels = [] } = useQuery({
    queryKey: ['/api/openrouter-models'],
    enabled: isExpanded
  });

  // Create new chat session
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/chat/sessions', 'POST', {
        title: `Enhanced AI Session - ${new Date().toLocaleString()}`
      });
    },
    onSuccess: (session: any) => {
      setCurrentSessionId(session.id);
      startDataMonitoring(session.id);
    }
  });

  // Send enhanced message
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!currentSessionId) throw new Error('No session active');
      
      return apiRequest('/api/ai/enhanced/chat', 'POST', {
        sessionId: currentSessionId,
        message,
        options: {
          useRealTimeData,
          executeMCPTools,
          model: selectedModel
        }
      });
    },
    onSuccess: (response: any) => {
      if (response.success) {
        // Message will be added via WebSocket
        setInputValue("");
        if (response.toolResults?.length > 0) {
          setToolExecutions(prev => [...prev, ...response.toolResults]);
        }
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  });

  // Refresh data context
  const refreshDataMutation = useMutation({
    mutationFn: async () => {
      if (!currentSessionId) throw new Error('No session active');
      return apiRequest('/api/ai/enhanced/context', 'POST', {
        sessionId: currentSessionId
      });
    },
    onSuccess: (context: any) => {
      setDataContext(context);
      toast({
        title: "Data Refreshed",
        description: "Real-time data context updated"
      });
    }
  });

  // WebSocket functions
  const connectWebSocket = () => {
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        setIsConnected(true);
        toast({
          title: "Connected",
          description: "Real-time data connection established"
        });
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };
      
      wsRef.current.onclose = () => {
        setIsConnected(false);
        // Auto-reconnect after 3 seconds
        setTimeout(() => {
          if (isExpanded) connectWebSocket();
        }, 3000);
      };
      
      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsConnected(false);
      };
    } catch (error) {
      console.error("Error connecting WebSocket:", error);
    }
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  };

  const handleWebSocketMessage = (message: WSMessage) => {
    switch (message.type) {
      case 'message':
        if (message.sessionId === currentSessionId) {
          setMessages(prev => [...prev, message.data]);
        }
        break;
      case 'data_update':
        if (message.sessionId === currentSessionId) {
          setDataContext(prev => prev ? { ...prev, realTimeMetrics: message.data } : null);
        }
        break;
      case 'tool_execution':
        setToolExecutions(prev => [...prev, message.data]);
        break;
      case 'system':
        toast({
          title: "System Update",
          description: message.data.message || "System notification"
        });
        break;
    }
  };

  // Start data monitoring
  const startDataMonitoring = async (sessionId: string) => {
    try {
      await apiRequest('/api/ai/enhanced/monitor', 'POST', { sessionId });
      setDataMonitoring(true);
    } catch (error) {
      console.error("Error starting data monitoring:", error);
    }
  };

  // Handle sending messages
  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    if (!currentSessionId) {
      createSessionMutation.mutate();
      return;
    }

    // Add user message immediately
    const userMessage: EnhancedMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    sendMessageMutation.mutate(inputValue);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Compact floating button
  if (!isExpanded) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsExpanded(true)}
          size="lg"
          className="rounded-full h-16 w-16 bg-gradient-to-r from-bristol-maroon to-red-800 hover:from-bristol-maroon/90 hover:to-red-700 text-white shadow-2xl border-2 border-bristol-gold/30 transition-all duration-300 hover:scale-110"
        >
          <Brain className="h-8 w-8" />
        </Button>
      </div>
    );
  }

  // Expanded AI agent panel
  return (
    <div className="fixed inset-4 z-50 bg-white/95 backdrop-blur-md border border-gray-200 rounded-2xl shadow-2xl">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-bristol-maroon to-red-800 text-white rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-bristol-gold/20 flex items-center justify-center">
              <Brain className="h-6 w-6 text-bristol-gold" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Enhanced AI Agent</h2>
              <div className="flex items-center gap-2 text-sm text-gray-200">
                <div className="flex items-center gap-1">
                  {isConnected ? (
                    <><Wifi className="h-3 w-3 text-green-400" /> Connected</>
                  ) : (
                    <><WifiOff className="h-3 w-3 text-red-400" /> Disconnected</>
                  )}
                </div>
                {dataMonitoring && (
                  <Badge variant="secondary" className="bg-green-500/20 text-green-200">
                    <Activity className="h-3 w-3 mr-1" />
                    Monitoring
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refreshDataMutation.mutate()}
              disabled={refreshDataMutation.isPending}
              className="text-white hover:bg-white/10"
            >
              {refreshDataMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
              className="text-white hover:bg-white/10"
            >
              ×
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chat panel */}
          <div className="flex-1 flex flex-col">
            <Tabs defaultValue="chat" className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-4 m-4 mb-0">
                <TabsTrigger value="chat" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="data" className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Data
                </TabsTrigger>
                <TabsTrigger value="tools" className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Tools
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </TabsTrigger>
              </TabsList>

              {/* Chat Tab */}
              <TabsContent value="chat" className="flex-1 flex flex-col m-4 mt-2">
                <ScrollArea className="flex-1 mb-4 border border-gray-200 rounded-lg p-4">
                  <div className="space-y-4">
                    {messages.length === 0 && (
                      <div className="text-center text-gray-500 py-8">
                        <Brain className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">Enhanced AI Assistant Ready</p>
                        <p className="text-sm">I have access to all your real-time data and tools</p>
                      </div>
                    )}
                    
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            message.role === 'user' 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-gradient-to-r from-bristol-maroon to-red-800 text-white'
                          }`}>
                            {message.role === 'user' ? '👤' : <Brain className="h-4 w-4" />}
                          </div>
                          <div className={`rounded-lg p-3 ${
                            message.role === 'user'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}>
                            <div className="whitespace-pre-wrap">{message.content}</div>
                            {message.metadata && (
                              <div className="mt-2 text-xs opacity-70">
                                {message.metadata.enhanced && <Badge variant="outline" className="mr-1">Enhanced</Badge>}
                                {message.metadata.dataContextUsed && <Badge variant="outline" className="mr-1">Real-time Data</Badge>}
                                {message.metadata.toolsExecuted && message.metadata.toolsExecuted.length > 0 && (
                                  <Badge variant="outline">{message.metadata.toolsExecuted.length} tools used</Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {sendMessageMutation.isPending && (
                      <div className="flex gap-3 justify-start">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-bristol-maroon to-red-800 text-white flex items-center justify-center">
                          <Brain className="h-4 w-4" />
                        </div>
                        <div className="bg-gray-100 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Analyzing with real-time data...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input area */}
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Textarea
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Ask me anything about your properties, market data, or analytics..."
                      className="min-h-[60px] resize-none"
                      disabled={sendMessageMutation.isPending}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() || sendMessageMutation.isPending}
                      className="bg-gradient-to-r from-bristol-maroon to-red-800 hover:from-bristol-maroon/90 hover:to-red-700"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={useRealTimeData} 
                        onCheckedChange={setUseRealTimeData}
                        id="realtime-data"
                      />
                      <Label htmlFor="realtime-data">Real-time Data</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={executeMCPTools} 
                        onCheckedChange={setExecuteMCPTools}
                        id="mcp-tools"
                      />
                      <Label htmlFor="mcp-tools">MCP Tools</Label>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Data Tab */}
              <TabsContent value="data" className="flex-1 m-4 mt-2">
                <ScrollArea className="h-full">
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Database className="h-5 w-5" />
                          Data Context
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {dataContext ? (
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium mb-2">Properties ({dataContext.sites?.length || 0})</h4>
                              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded max-h-40 overflow-y-auto">
                                <pre>{JSON.stringify(dataContext.sites?.slice(0, 3), null, 2)}</pre>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">Real-time Metrics</h4>
                              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded max-h-40 overflow-y-auto">
                                <pre>{JSON.stringify(dataContext.realTimeMetrics, null, 2)}</pre>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">Integration Status</h4>
                              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded max-h-40 overflow-y-auto">
                                <pre>{JSON.stringify(dataContext.integrationStatus, null, 2)}</pre>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p>No data context loaded</p>
                            <Button 
                              onClick={() => refreshDataMutation.mutate()}
                              className="mt-2"
                              size="sm"
                            >
                              Load Data Context
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Tools Tab */}
              <TabsContent value="tools" className="flex-1 m-4 mt-2">
                <ScrollArea className="h-full">
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Zap className="h-5 w-5" />
                          Tool Executions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {toolExecutions.length > 0 ? (
                          <div className="space-y-3">
                            {toolExecutions.map((execution, index) => (
                              <div key={index} className="border border-gray-200 rounded p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <Badge variant="outline">{execution.tool}</Badge>
                                  <span className="text-xs text-gray-500">
                                    {new Date(execution.timestamp).toLocaleTimeString()}
                                  </span>
                                </div>
                                <div className="text-sm">
                                  <div className="mb-2">
                                    <strong>Input:</strong>
                                    <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                                      {JSON.stringify(execution.input, null, 2)}
                                    </pre>
                                  </div>
                                  <div>
                                    <strong>Result:</strong>
                                    <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                                      {JSON.stringify(execution.result, null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <Zap className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p>No tools executed yet</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="flex-1 m-4 mt-2">
                <ScrollArea className="h-full">
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Settings className="h-5 w-5" />
                          AI Configuration
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="model-select">AI Model</Label>
                          <Select value={selectedModel} onValueChange={setSelectedModel}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.isArray(availableModels) && availableModels.map((model: any) => (
                                <SelectItem key={model.id} value={model.id}>
                                  {model.label}
                                </SelectItem>
                              ))}
                              <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                              <SelectItem value="claude-3-5-sonnet">Claude 3.5 Sonnet</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="auto-refresh">Auto-refresh Data</Label>
                            <Switch 
                              checked={autoRefreshData} 
                              onCheckedChange={setAutoRefreshData}
                              id="auto-refresh"
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <Label htmlFor="realtime-default">Use Real-time Data by Default</Label>
                            <Switch 
                              checked={useRealTimeData} 
                              onCheckedChange={setUseRealTimeData}
                              id="realtime-default"
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <Label htmlFor="tools-default">Enable MCP Tools by Default</Label>
                            <Switch 
                              checked={executeMCPTools} 
                              onCheckedChange={setExecuteMCPTools}
                              id="tools-default"
                            />
                          </div>
                        </div>

                        <div className="pt-4 border-t">
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1">
                              <Download className="h-4 w-4 mr-2" />
                              Export Chat
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1">
                              <Upload className="h-4 w-4 mr-2" />
                              Import Session
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}