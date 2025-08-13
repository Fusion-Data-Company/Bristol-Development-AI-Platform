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
  Upload,
  Cpu,
  Shield,
  Sparkles,
  Terminal,
  X,
  Minimize2,
  Maximize2
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

export default function EnhancedAIAgentV2() {
  // State management
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<EnhancedMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [dataMonitoring, setDataMonitoring] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  // AI Configuration
  const [selectedModel, setSelectedModel] = useState("openai/gpt-4o");
  const [useRealTimeData, setUseRealTimeData] = useState(true);
  const [executeMCPTools, setExecuteMCPTools] = useState(true);
  const [autoRefreshData, setAutoRefreshData] = useState(true);
  
  // Data context
  const [dataContext, setDataContext] = useState<DataContext | null>(null);
  const [toolExecutions, setToolExecutions] = useState<any[]>([]);
  
  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // WebSocket connection
  useEffect(() => {
    if (isExpanded && !isMinimized) {
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }

    return () => disconnectWebSocket();
  }, [isExpanded, isMinimized]);

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
      if (!currentSessionId) {
        const session = await createSessionMutation.mutateAsync();
        setCurrentSessionId(session.id);
      }

      return apiRequest('/api/ai/enhanced/chat', 'POST', {
        sessionId: currentSessionId || "new-session",
        message,
        model: selectedModel,
        enableRealTimeData: useRealTimeData,
        executeMCPTools
      });
    },
    onSuccess: (response: any) => {
      const newMessage: EnhancedMessage = {
        id: response.id || Date.now().toString(),
        role: 'assistant',
        content: response.content || response.message || "Response received",
        timestamp: new Date(response.timestamp || Date.now()),
        metadata: {
          enhanced: true,
          model: selectedModel,
          dataContextUsed: useRealTimeData,
          toolsExecuted: response.toolResults || [],
          processingTime: response.processingTime
        }
      };
      setMessages(prev => [...prev, newMessage]);
    },
    onError: (error: any) => {
      toast({
        title: "AI Error",
        description: error.message || "Failed to process message",
        variant: "destructive"
      });
    }
  });

  const connectWebSocket = () => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        setIsConnected(true);
        console.log("WebSocket connected");
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };
      
      wsRef.current.onclose = () => {
        setIsConnected(false);
        console.log("WebSocket disconnected");
      };
      
      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsConnected(false);
      };
    } catch (error) {
      console.error("Failed to connect WebSocket:", error);
    }
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  };

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'message':
        if (data.sessionId === currentSessionId) {
          const newMessage: EnhancedMessage = {
            id: data.data.id || Date.now().toString(),
            role: data.data.role || 'system',
            content: data.data.content || JSON.stringify(data.data),
            timestamp: new Date(data.timestamp),
            metadata: data.data.metadata
          };
          setMessages(prev => [...prev, newMessage]);
        }
        break;
      case 'data_update':
        setDataContext(data.data);
        break;
      case 'tool_execution':
        setToolExecutions(prev => [...prev, data.data]);
        break;
      case 'system':
        // Handle system notifications
        break;
    }
  };

  const startDataMonitoring = (sessionId: string) => {
    if (autoRefreshData) {
      setDataMonitoring(true);
    }
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: EnhancedMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    sendMessageMutation.mutate(inputValue);
    setInputValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isExpanded) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsExpanded(true)}
          className="h-16 w-16 rounded-full bg-gradient-to-r from-bristol-maroon via-red-800 to-purple-900 hover:from-bristol-maroon/90 hover:via-red-800/90 hover:to-purple-900/90 border-2 border-bristol-gold/40 shadow-2xl shadow-purple-500/20 transition-all duration-300 hover:scale-110 hover:shadow-purple-500/40"
        >
          <Brain className="h-8 w-8 text-white animate-pulse" />
          <div className="absolute -inset-1 bg-gradient-to-r from-bristol-gold/20 to-purple-500/20 rounded-full blur opacity-75 animate-pulse"></div>
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-500 ${isMinimized ? 'w-80 h-12' : 'w-[800px] h-[600px]'}`}>
      {/* Cyberpunk Background Effects */}
      <div className="absolute inset-0 cyberpunk-backdrop rounded-2xl border border-bristol-gold/40 shadow-2xl">
        {/* Animated Grid Background */}
        <div className="absolute inset-0 cyberpunk-grid opacity-30"></div>
        
        {/* Multiple Glowing Border Effects */}
        <div className="absolute -inset-1 bg-gradient-to-r from-bristol-gold/30 via-purple-500/30 to-cyan-500/30 rounded-2xl blur opacity-75 cyberpunk-pulse"></div>
        <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500/20 via-bristol-gold/20 to-purple-500/20 rounded-2xl blur-sm opacity-60 cyberpunk-float"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-bristol-gold/15 to-transparent rounded-2xl animate-pulse"></div>
        
        {/* Corner accent lights */}
        <div className="absolute top-2 left-2 w-3 h-3 bg-bristol-gold rounded-full animate-pulse shadow-lg shadow-bristol-gold/50"></div>
        <div className="absolute top-2 right-2 w-3 h-3 bg-purple-500 rounded-full animate-pulse shadow-lg shadow-purple-500/50"></div>
        <div className="absolute bottom-2 left-2 w-3 h-3 bg-cyan-500 rounded-full animate-pulse shadow-lg shadow-cyan-500/50"></div>
        <div className="absolute bottom-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
      </div>

      {/* Main Content */}
      <div className="relative h-full flex flex-col bg-black/20 rounded-2xl border border-bristol-gold/50 backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-bristol-gold/30 bg-gradient-to-r from-bristol-maroon/20 to-purple-900/20">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Brain className="h-6 w-6 text-bristol-gold animate-pulse" />
              <div className="absolute inset-0 bg-bristol-gold/20 rounded-full blur animate-ping"></div>
            </div>
            <div>
              <h3 className="font-bold text-white text-lg cyberpunk-text">ENHANCED AI AGENT</h3>
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                    <Wifi className="h-3 w-3 mr-1" />
                    CONNECTED
                  </Badge>
                ) : (
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/50">
                    <WifiOff className="h-3 w-3 mr-1" />
                    OFFLINE
                  </Badge>
                )}
                {dataMonitoring && (
                  <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50">
                    <Activity className="h-3 w-3 mr-1 animate-pulse" />
                    LIVE DATA
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-bristol-gold hover:bg-bristol-gold/20 border border-bristol-gold/30"
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
              className="text-bristol-gold hover:bg-bristol-gold/20 border border-bristol-gold/30"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Tabs */}
            <Tabs defaultValue="chat" className="flex-1 flex flex-col">
              <div className="px-4 pt-2">
                <TabsList className="grid w-full grid-cols-4 bg-black/40 border border-bristol-gold/30">
                  <TabsTrigger 
                    value="chat" 
                    className="data-[state=active]:bg-bristol-maroon/40 data-[state=active]:text-bristol-gold text-gray-300"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    CHAT
                  </TabsTrigger>
                  <TabsTrigger 
                    value="data" 
                    className="data-[state=active]:bg-bristol-maroon/40 data-[state=active]:text-bristol-gold text-gray-300"
                  >
                    <Database className="h-4 w-4 mr-2" />
                    DATA
                  </TabsTrigger>
                  <TabsTrigger 
                    value="tools" 
                    className="data-[state=active]:bg-bristol-maroon/40 data-[state=active]:text-bristol-gold text-gray-300"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    TOOLS
                  </TabsTrigger>
                  <TabsTrigger 
                    value="settings" 
                    className="data-[state=active]:bg-bristol-maroon/40 data-[state=active]:text-bristol-gold text-gray-300"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    CONFIG
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Chat Tab */}
              <TabsContent value="chat" className="flex-1 flex flex-col px-4 pb-4">
                {/* Messages */}
                <ScrollArea className="flex-1 mb-4 border-2 border-bristol-gold/40 rounded-lg bg-black/60 p-4 cyberpunk-scrollbar cyberpunk-glow">
                  <div className="space-y-4">
                    {messages.length === 0 && (
                      <div className="text-center text-gray-400 py-8">
                        <Brain className="h-12 w-12 mx-auto mb-4 text-bristol-gold animate-pulse" />
                        <p className="text-lg font-semibold text-white mb-2">ENHANCED AI READY</p>
                        <p className="text-sm">Real-time data access • MCP tools • Elite AI models</p>
                      </div>
                    )}
                    
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg border ${
                            message.role === 'user'
                              ? 'bg-bristol-maroon/20 border-bristol-gold/50 text-white'
                              : message.role === 'system'
                              ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-300'
                              : 'bg-purple-500/10 border-purple-500/50 text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {message.role === 'user' ? (
                              <div className="h-2 w-2 bg-bristol-gold rounded-full"></div>
                            ) : message.role === 'system' ? (
                              <Terminal className="h-3 w-3 text-cyan-400" />
                            ) : (
                              <Bot className="h-3 w-3 text-purple-400" />
                            )}
                            <span className="text-xs font-semibold uppercase">
                              {message.role}
                            </span>
                            {message.metadata?.model && (
                              <Badge className="text-xs bg-black/50 text-bristol-gold border-bristol-gold/30">
                                {message.metadata.model}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm leading-relaxed">{message.content}</p>
                          <div className="text-xs text-gray-400 mt-2">
                            {message.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {sendMessageMutation.isPending && (
                      <div className="flex justify-start">
                        <div className="bg-purple-500/10 border border-purple-500/50 p-3 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                            <span className="text-purple-300">AI processing...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div ref={messagesEndRef} />
                </ScrollArea>

                {/* Input */}
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="◉ NEURAL INTERFACE ACTIVE - ENTER MESSAGE..."
                      className="cyberpunk-input h-14 text-base pr-12 font-medium"
                      disabled={sendMessageMutation.isPending}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Sparkles className="h-5 w-5 text-bristol-gold animate-pulse cyberpunk-pulse" />
                    </div>
                    {/* Animated border effect */}
                    <div className="absolute inset-0 rounded-md border-2 border-transparent bg-gradient-to-r from-bristol-gold/20 via-purple-500/20 to-cyan-500/20 opacity-50 animate-pulse pointer-events-none"></div>
                  </div>
                  
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || sendMessageMutation.isPending}
                    className="bg-gradient-to-r from-bristol-maroon via-purple-700 to-bristol-maroon hover:from-bristol-maroon/90 hover:via-purple-700/90 hover:to-bristol-maroon/90 border-2 border-bristol-gold/60 h-14 px-8 cyberpunk-glow transition-all duration-300 hover:scale-105"
                  >
                    {sendMessageMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span className="text-sm font-semibold">PROCESSING</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Send className="h-5 w-5" />
                        <span className="text-sm font-semibold">TRANSMIT</span>
                      </div>
                    )}
                  </Button>
                </div>
              </TabsContent>

              {/* Data Tab */}
              <TabsContent value="data" className="flex-1 px-4 pb-4">
                <div className="h-full bg-black/40 border border-bristol-gold/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-bristol-gold font-semibold">REAL-TIME DATA ACCESS</h4>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                      <Shield className="h-3 w-3 mr-1" />
                      SECURE
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-black/60 border-bristol-gold/30">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-bristol-gold">Properties</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-white">
                          {dataContext?.sites?.length || 0}
                        </div>
                        <p className="text-xs text-gray-400">Active sites</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-black/60 border-bristol-gold/30">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-bristol-gold">APIs</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-400">6</div>
                        <p className="text-xs text-gray-400">Connected</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* Tools Tab */}
              <TabsContent value="tools" className="flex-1 px-4 pb-4">
                <div className="h-full bg-black/40 border border-bristol-gold/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-bristol-gold font-semibold">MCP TOOLS</h4>
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50">
                      <Cpu className="h-3 w-3 mr-1" />
                      5 AVAILABLE
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    {['n8n Workflows', 'Apify Web Scraping', 'Census Data', 'HUD Fair Market Rent', 'Metrics Storage'].map((tool, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-black/40 border border-gray-700 rounded">
                        <span className="text-white text-sm">{tool}</span>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                          READY
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="flex-1 px-4 pb-4">
                <div className="h-full bg-black/40 border border-bristol-gold/30 rounded-lg p-4">
                  <div className="space-y-6">
                    <div>
                      <Label className="text-bristol-gold font-semibold">AI MODEL</Label>
                      <Select value={selectedModel} onValueChange={setSelectedModel}>
                        <SelectTrigger className="bg-black/60 border-bristol-gold/50 text-white mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-bristol-gold/50">
                          {availableModels.map((model: any) => (
                            <SelectItem key={model.id} value={model.id} className="text-white">
                              {model.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-bristol-gold">Real-time Data</Label>
                        <Switch
                          checked={useRealTimeData}
                          onCheckedChange={setUseRealTimeData}
                          className="data-[state=checked]:bg-bristol-maroon"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label className="text-bristol-gold">Execute MCP Tools</Label>
                        <Switch
                          checked={executeMCPTools}
                          onCheckedChange={setExecuteMCPTools}
                          className="data-[state=checked]:bg-bristol-maroon"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label className="text-bristol-gold">Auto Refresh</Label>
                        <Switch
                          checked={autoRefreshData}
                          onCheckedChange={setAutoRefreshData}
                          className="data-[state=checked]:bg-bristol-maroon"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>

      <style jsx>{`
        .cyberpunk-text {
          text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
          letter-spacing: 2px;
        }
      `}</style>
    </div>
  );
}