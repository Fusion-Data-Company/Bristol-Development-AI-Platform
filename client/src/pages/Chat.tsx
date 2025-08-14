import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useWebSocket } from '@/hooks/useWebSocket';
import { 
  Send, 
  Plus, 
  MessageCircle, 
  Brain,
  Sparkles,
  History,
  Settings,
  Trash2,
  Cpu,
  Shield,
  Activity,
  Zap,
  Database,
  Terminal,
  Users,
  Building2,
  MapPin,
  TrendingUp,
  BarChart3,
  DollarSign,
  Save,
  Loader2,
  ChevronDown,
  Palette,
  Wrench,
  Target,
  AlertCircle
} from 'lucide-react';
import { type ChatSession, type ChatMessage } from '@shared/schema';
import { format } from 'date-fns';
import Chrome from '@/components/brand/SimpleChrome';
import { cn } from '@/lib/utils';

interface PremiumModel {
  id: string;
  label: string;
  provider: string;
  category: string;
  description: string;
  features: string[];
  contextLength: number;
  pricing: { input: string; output: string; images?: string; search?: string };
  bestFor: string[];
  status: 'active' | 'byok-required';
}

interface SystemStatus {
  websocket: string;
  database: string;
  apis: any[];
  mcpTools: any[];
}

export default function Chat() {
  const [message, setMessage] = useState('');
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('gpt-5'); // Default to GPT-5 like the widget
  const [mcpEnabled, setMcpEnabled] = useState(true);
  const [realTimeData, setRealTimeData] = useState(true);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // WebSocket for real-time updates like the floating widget
  const { isConnected: wsConnected, sendMessage: sendWsMessage } = useWebSocket({
    onMessage: (wsMessage) => {
      if (wsMessage.type === "chat_typing") {
        setIsThinking(wsMessage.data?.typing || false);
      }
    }
  });

  // Get comprehensive app data like the floating widget
  const { data: sites } = useQuery({
    queryKey: ['/api/sites'],
  });
  
  const { data: analytics } = useQuery({
    queryKey: ['/api/analytics/overview'],
  });

  const { data: premiumModels } = useQuery<PremiumModel[]>({
    queryKey: ['/api/openrouter-models'],
    select: (data: any) => data || []
  });

  // Combine all data sources like the floating widget
  const appData = {
    sites: sites || [],
    analytics: analytics || {},
    timestamp: new Date().toISOString(),
    user: { authenticated: true }
  };

  // Get chat sessions
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<ChatSession[]>({
    queryKey: ['/api/chat/sessions']
  });

  // Get messages for selected session
  const { data: messages = [], isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: [`/api/chat/sessions/${selectedSession}/messages`],
    enabled: !!selectedSession
  });

  // Create new session
  const createSessionMutation = useMutation({
    mutationFn: async (title: string) => {
      const response = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      });
      if (!response.ok) throw new Error('Failed to create session');
      return response.json();
    },
    onSuccess: (newSession: any) => {
      setSelectedSession(newSession.id);
      queryClient.invalidateQueries({ queryKey: ['/api/chat/sessions'] });
    }
  });

  // Send message using Elite Bristol AI endpoint like the floating widget
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedSession && !content.trim()) throw new Error('No session or content');
      
      setIsThinking(true);
      
      // Use the same elite endpoint as the floating widget
      const endpoint = "/api/bristol-brain-elite/chat";
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          sessionId: selectedSession || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          selectedModel: selectedModel,
          dataContext: appData,
          enableAdvancedReasoning: true,
          sourceInstance: 'main', // Identify this as the main chat instance
          mcpTools: mcpEnabled ? [] : undefined, // Will be populated by backend
          enableMCPExecution: mcpEnabled,
          userAgent: "Bristol A.I. Elite Chat v1.0",
          systemStatus: {
            websocket: wsConnected ? "connected" : "disconnected",
            database: "connected",
            apis: [],
            mcpTools: []
          }
        })
      });
      
      if (!response.ok) {
        // Fallback to standard chat endpoint if elite fails
        console.warn('Elite endpoint failed, using fallback');
        const fallbackResponse = await fetch(`/api/chat/sessions/${selectedSession}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content })
        });
        if (!fallbackResponse.ok) throw new Error('Failed to send message');
        return fallbackResponse.json();
      }
      
      return response.json();
    },
    onSuccess: () => {
      setMessage('');
      setIsThinking(false);
      queryClient.invalidateQueries({ 
        queryKey: [`/api/chat/sessions/${selectedSession}/messages`] 
      });
    },
    onError: () => {
      setIsThinking(false);
    }
  });

  // Auto-select first session or create one
  useEffect(() => {
    if (!selectedSession && sessions.length > 0) {
      setSelectedSession(sessions[0].id);
    }
  }, [sessions, selectedSession]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSend = () => {
    if (message.trim() && !sendMessageMutation.isPending && !isThinking) {
      sendMessageMutation.mutate(message.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Load settings from localStorage like the floating widget
  useEffect(() => {
    const savedModel = localStorage.getItem("bristol.selectedModel");
    const savedMcp = localStorage.getItem("bristol.mcpEnabled");
    const savedRealTime = localStorage.getItem("bristol.realTimeData");
    const savedPrompt = localStorage.getItem("bristol.systemPrompt");
    
    if (savedModel) setSelectedModel(savedModel);
    if (savedMcp) setMcpEnabled(savedMcp === 'true');
    if (savedRealTime) setRealTimeData(savedRealTime === 'true');
    if (savedPrompt) setSystemPrompt(savedPrompt);
  }, []);

  const systemStatus: SystemStatus = {
    websocket: wsConnected ? "connected" : "disconnected",
    database: "connected",
    apis: [],
    mcpTools: []
  };

  return (
    <Chrome>
      <div className="container mx-auto p-6 h-[calc(100vh-6rem)]">
      <div className="grid gap-6 lg:grid-cols-4 h-full">
        {/* Sessions Sidebar */}
        <div className="lg:col-span-1">
          <Card className="h-full border-bristol-cyan/20 bg-gradient-to-b from-slate-900/40 to-slate-800/40 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-bristol-cyan">
                <span className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Conversations
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => createSessionMutation.mutate('New Bristol AI Chat')}
                  className="hover:bg-bristol-cyan/10 text-bristol-cyan"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-16rem)]">
                <div className="space-y-2">
                  {sessionsLoading ? (
                    <div className="text-center text-muted-foreground py-4">
                      Loading sessions...
                    </div>
                  ) : sessions.length === 0 ? (
                    <div className="text-center text-muted-foreground py-4">
                      <MessageCircle className="h-8 w-8 mx-auto mb-2" />
                      <p>No conversations yet</p>
                      <Button
                        size="sm"
                        className="mt-2"
                        onClick={() => createSessionMutation.mutate('New Chat')}
                      >
                        Start New Chat
                      </Button>
                    </div>
                  ) : (
                    sessions.map((session) => (
                      <Button
                        key={session.id}
                        variant={selectedSession === session.id ? 'default' : 'ghost'}
                        className="w-full justify-start"
                        onClick={() => setSelectedSession(session.id)}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        <div className="flex-1 text-left">
                          <p className="truncate">{session.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {session.createdAt ? format(new Date(session.createdAt), 'MMM d, h:mm a') : ''}
                          </p>
                        </div>
                      </Button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Elite Bristol AI Chat Area */}
        <div className="lg:col-span-3">
          <Card className="h-full flex flex-col border-bristol-cyan/20 bg-gradient-to-b from-slate-900/40 to-slate-800/40 backdrop-blur-md">
            <CardHeader className="border-b border-bristol-cyan/20">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-bristol-cyan/20 to-bristol-electric/20 rounded-full blur-sm animate-pulse" />
                    <div className="relative bg-gradient-to-r from-bristol-cyan/20 to-bristol-electric/20 p-2 rounded-full border border-bristol-cyan/30">
                      <Brain className="h-6 w-6 text-bristol-cyan" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-bristol-cyan via-white to-bristol-gold bg-clip-text text-transparent">
                      BRISTOL A.I. ELITE
                    </h1>
                    <p className="text-sm text-bristol-cyan/80">
                      Enterprise Real Estate Intelligence Platform
                    </p>
                  </div>
                </div>
                
                {/* Elite Status Indicators */}
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-bristol-cyan/40 text-bristol-cyan bg-bristol-cyan/10">
                    <Activity className="h-3 w-3 mr-1" />
                    {wsConnected ? 'ONLINE' : 'OFFLINE'}
                  </Badge>
                  <Badge variant="outline" className="border-bristol-gold/40 text-bristol-gold bg-bristol-gold/10">
                    <Shield className="h-3 w-3 mr-1" />
                    SECURE
                  </Badge>
                  {mcpEnabled && (
                    <Badge variant="outline" className="border-bristol-electric/40 text-bristol-electric bg-bristol-electric/10">
                      <Cpu className="h-3 w-3 mr-1" />
                      MCP
                    </Badge>
                  )}
                </div>
              </CardTitle>
              
              {/* Model Selection */}
              <div className="flex items-center gap-4 mt-3">
                <Label className="text-bristol-cyan font-medium">AI Model:</Label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="w-64 border-bristol-cyan/20 bg-slate-800/50 text-bristol-cyan">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-bristol-cyan/20 bg-slate-800">
                    {(premiumModels || []).map((model) => (
                      <SelectItem key={model.id} value={model.id} className="text-bristol-cyan hover:bg-bristol-cyan/10">
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-5 m-4 bg-slate-800/50 border border-bristol-cyan/20">
                  <TabsTrigger value="chat" className="data-[state=active]:bg-bristol-cyan/20 data-[state=active]:text-bristol-cyan">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Chat
                  </TabsTrigger>
                  <TabsTrigger value="data" className="data-[state=active]:bg-bristol-cyan/20 data-[state=active]:text-bristol-cyan">
                    <Database className="h-4 w-4 mr-2" />
                    Data
                  </TabsTrigger>
                  <TabsTrigger value="tools" className="data-[state=active]:bg-bristol-cyan/20 data-[state=active]:text-bristol-cyan">
                    <Terminal className="h-4 w-4 mr-2" />
                    Tools
                  </TabsTrigger>
                  <TabsTrigger value="agents" className="data-[state=active]:bg-bristol-cyan/20 data-[state=active]:text-bristol-cyan">
                    <Users className="h-4 w-4 mr-2" />
                    Agents
                  </TabsTrigger>
                  <TabsTrigger value="admin" className="data-[state=active]:bg-bristol-cyan/20 data-[state=active]:text-bristol-cyan">
                    <Settings className="h-4 w-4 mr-2" />
                    Admin
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="chat" className="flex-1 flex flex-col">
                  {/* Elite Chat Messages */}
                  <ScrollArea ref={scrollAreaRef} className="flex-1 px-4 py-2">
                    {messagesLoading ? (
                      <div className="flex items-center justify-center h-full text-bristol-cyan/60">
                        <Loader2 className="h-8 w-8 animate-spin mr-2" />
                        Loading conversation...
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="relative mb-6">
                          <div className="absolute -inset-2 bg-gradient-to-r from-bristol-cyan/20 to-bristol-electric/20 rounded-full blur-lg animate-pulse" />
                          <Brain className="h-16 w-16 text-bristol-cyan relative" />
                        </div>
                        <h2 className="text-2xl font-bold text-bristol-cyan mb-2">
                          Bristol A.I. Elite Ready
                        </h2>
                        <p className="text-bristol-cyan/80 max-w-md mb-4">
                          I'm your elite real estate intelligence partner. Ask me about:
                        </p>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-bristol-cyan/70">
                            <Building2 className="h-4 w-4" />
                            Property Analysis
                          </div>
                          <div className="flex items-center gap-2 text-bristol-cyan/70">
                            <TrendingUp className="h-4 w-4" />
                            Market Intelligence
                          </div>
                          <div className="flex items-center gap-2 text-bristol-cyan/70">
                            <BarChart3 className="h-4 w-4" />
                            Investment Underwriting
                          </div>
                          <div className="flex items-center gap-2 text-bristol-cyan/70">
                            <MapPin className="h-4 w-4" />
                            Demographics & Crime
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 pb-4">
                        {messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={cn(
                                "max-w-[80%] rounded-xl px-4 py-3 border backdrop-blur-sm",
                                msg.role === 'user'
                                  ? 'bg-gradient-to-r from-bristol-cyan/20 to-bristol-electric/20 border-bristol-cyan/30 text-white'
                                  : 'bg-gradient-to-r from-slate-800/80 to-slate-700/80 border-bristol-cyan/20 text-bristol-cyan'
                              )}
                            >
                              <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                              <p className="text-xs opacity-60 mt-2">
                                {msg.createdAt ? format(new Date(msg.createdAt), 'h:mm a') : ''}
                              </p>
                            </div>
                          </div>
                        ))}
                        {(sendMessageMutation.isPending || isThinking) && (
                          <div className="flex justify-start">
                            <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 border border-bristol-cyan/20 rounded-xl px-4 py-3 backdrop-blur-sm">
                              <div className="flex items-center gap-3 text-bristol-cyan">
                                <div className="flex gap-1">
                                  <div className="w-2 h-2 bg-bristol-cyan rounded-full animate-bounce" />
                                  <div className="w-2 h-2 bg-bristol-cyan rounded-full animate-bounce delay-100" />
                                  <div className="w-2 h-2 bg-bristol-cyan rounded-full animate-bounce delay-200" />
                                </div>
                                <span className="text-sm font-medium">Bristol A.I. is analyzing...</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </ScrollArea>

                  {/* Elite Input Area */}
                  <div className="border-t border-bristol-cyan/20 p-4 bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur-sm">
                    <div className="flex gap-3">
                      <div className="flex-1 relative">
                        <Input
                          ref={inputRef}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder={isThinking ? "Bristol A.I. is analyzing..." : "Ask about properties, markets, demographics, investments..."}
                          disabled={sendMessageMutation.isPending || isThinking}
                          className="bg-slate-800/50 border-bristol-cyan/20 text-white placeholder-bristol-cyan/50 focus:border-bristol-cyan focus:ring-bristol-cyan/30"
                        />
                      </div>
                      <Button
                        onClick={handleSend}
                        disabled={!message.trim() || sendMessageMutation.isPending || isThinking}
                        className="bg-gradient-to-r from-bristol-cyan to-bristol-electric hover:from-bristol-cyan/80 hover:to-bristol-electric/80 text-slate-900 font-bold min-w-[100px]"
                      >
                        {sendMessageMutation.isPending || isThinking ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Brain className="h-4 w-4 mr-2" />
                            Analyze
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                {/* Data Tab - Mirror of floating widget */}
                <TabsContent value="data" className="flex-1 px-4 py-2">
                  <div className="space-y-4">
                    <div className="bg-bristol-cyan/10 border border-bristol-cyan/30 rounded-xl p-4">
                      <h3 className="text-bristol-cyan font-semibold mb-3 flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Live Data Context
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-bristol-cyan/80">Total Sites:</span>
                          <span className="text-bristol-cyan font-bold">{appData.analytics?.totalSites || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-bristol-cyan/80">Total Units:</span>
                          <span className="text-bristol-cyan font-bold">{appData.analytics?.totalUnits || 0}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-slate-800/50 border border-bristol-cyan/20 rounded-xl p-4">
                      <h4 className="text-bristol-cyan font-medium mb-2">Raw Data Preview</h4>
                      <ScrollArea className="h-64">
                        <pre className="text-xs text-bristol-cyan/70 whitespace-pre-wrap">
                          {JSON.stringify(appData, null, 2)}
                        </pre>
                      </ScrollArea>
                    </div>
                  </div>
                </TabsContent>

                {/* Tools Tab - Mirror of floating widget */}
                <TabsContent value="tools" className="flex-1 px-4 py-2">
                  <div className="space-y-4">
                    <div className="bg-bristol-cyan/10 border border-bristol-cyan/30 rounded-xl p-4">
                      <h3 className="text-bristol-cyan font-semibold mb-3 flex items-center gap-2">
                        <Terminal className="h-4 w-4" />
                        MCP Tools & APIs
                      </h3>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-bristol-cyan/80">MCP Execution:</span>
                        <Switch
                          checked={mcpEnabled}
                          onCheckedChange={setMcpEnabled}
                          className="data-[state=checked]:bg-bristol-cyan"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-bristol-cyan/80">Real-time Data:</span>
                        <Switch
                          checked={realTimeData}
                          onCheckedChange={setRealTimeData}
                          className="data-[state=checked]:bg-bristol-cyan"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { name: 'Demographics', icon: Users, status: 'active' },
                        { name: 'Employment', icon: TrendingUp, status: 'active' },
                        { name: 'Crime Stats', icon: Shield, status: 'active' },
                        { name: 'Climate Data', icon: Activity, status: 'active' },
                        { name: 'Housing Data', icon: Building2, status: 'active' },
                        { name: 'Deal Pipeline', icon: DollarSign, status: 'active' }
                      ].map((tool) => (
                        <div key={tool.name} className="bg-slate-800/50 border border-bristol-cyan/20 rounded-xl p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <tool.icon className="h-4 w-4 text-bristol-cyan" />
                            <span className="text-bristol-cyan font-medium text-sm">{tool.name}</span>
                          </div>
                          <Badge 
                            variant="outline" 
                            className="text-xs border-bristol-cyan/30 text-bristol-cyan bg-bristol-cyan/10"
                          >
                            {tool.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Agents Tab - Mirror of floating widget */}
                <TabsContent value="agents" className="flex-1 px-4 py-2">
                  <div className="space-y-4">
                    <div className="bg-bristol-cyan/10 border border-bristol-cyan/30 rounded-xl p-4">
                      <h3 className="text-bristol-cyan font-semibold mb-3 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Multi-Agent System
                      </h3>
                      <p className="text-bristol-cyan/80 text-sm">
                        Bristol A.I. Elite orchestrates multiple specialized agents for comprehensive analysis.
                      </p>
                    </div>

                    <div className="grid gap-3">
                      {[
                        { name: 'Financial Analyst', specialty: 'Investment Underwriting', status: 'ready' },
                        { name: 'Market Intelligence', specialty: 'Competitive Analysis', status: 'ready' },
                        { name: 'Data Processor', specialty: 'Demographics & Crime', status: 'ready' },
                        { name: 'Lead Manager', specialty: 'Deal Pipeline', status: 'ready' }
                      ].map((agent) => (
                        <div key={agent.name} className="bg-slate-800/50 border border-bristol-cyan/20 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-bristol-cyan font-medium">{agent.name}</h4>
                            <Badge 
                              variant="outline" 
                              className="text-xs border-bristol-cyan/30 text-bristol-cyan bg-bristol-cyan/10"
                            >
                              {agent.status}
                            </Badge>
                          </div>
                          <p className="text-bristol-cyan/70 text-sm">{agent.specialty}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Admin Tab - Mirror of floating widget */}
                <TabsContent value="admin" className="flex-1 px-4 py-2">
                  <div className="space-y-4">
                    <div className="bg-bristol-cyan/10 border border-bristol-cyan/30 rounded-xl p-4">
                      <h3 className="text-bristol-cyan font-semibold mb-3 flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Elite Configuration
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <Label className="text-bristol-cyan font-medium">System Prompt</Label>
                          <Textarea
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                            placeholder="Enter custom system prompt for Bristol A.I. Elite..."
                            className="mt-2 bg-slate-800/50 border-bristol-cyan/20 text-bristol-cyan placeholder-bristol-cyan/50"
                            rows={6}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label className="text-bristol-cyan font-medium">Real-time Data Integration</Label>
                          <Switch
                            checked={realTimeData}
                            onCheckedChange={setRealTimeData}
                            className="data-[state=checked]:bg-bristol-cyan"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label className="text-bristol-cyan font-medium">MCP Tool Execution</Label>
                          <Switch
                            checked={mcpEnabled}
                            onCheckedChange={setMcpEnabled}
                            className="data-[state=checked]:bg-bristol-cyan"
                          />
                        </div>

                        <Button
                          onClick={() => {
                            localStorage.setItem("bristol.selectedModel", selectedModel);
                            localStorage.setItem("bristol.mcpEnabled", mcpEnabled.toString());
                            localStorage.setItem("bristol.realTimeData", realTimeData.toString());
                            localStorage.setItem("bristol.systemPrompt", systemPrompt);
                          }}
                          className="w-full bg-gradient-to-r from-bristol-cyan to-bristol-electric hover:from-bristol-cyan/80 hover:to-bristol-electric/80 text-slate-900 font-bold"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save Elite Configuration
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </Chrome>
  );
}