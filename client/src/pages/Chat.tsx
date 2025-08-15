import { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useWebSocket } from '@/hooks/useWebSocket';
import { 
  Send, 
  Plus, 
  MessageCircle, 
  Brain,
  Loader2,
  Building2,
  TrendingUp,
  DollarSign,
  BarChart3,
  Users,
  Settings,
  Database,
  Activity,
  Wifi,
  WifiOff,
  Shield,
  Terminal,
  Target,
  Cpu,
  Zap,
  X,
  ChevronDown,
  HelpCircle,
  MapPin,
  Calendar,
  Clock,
  Palette,
  Wrench,
  CircuitBoard,
  Sparkles,
  AlertCircle,
  FileText,
  Save,
  Trash2
} from 'lucide-react';
import { type ChatSession, type ChatMessage } from '@shared/schema';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DataVisualizationPanel } from '@/components/chat/DataVisualizationPanel';
import { OnboardingGuide } from '@/components/chat/OnboardingGuide';

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

// Enhanced types for the unified Bristol A.I. Elite system
type ModelOption = { id: string; label: string; context?: number };

export type MCPTool = {
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'error';
  lastExecution?: string;
};

export type APIStatus = {
  name: string;
  status: 'operational' | 'error' | 'unknown';
  lastCheck: string;
};

export type SystemStatus = {
  mcpTools: MCPTool[];
  apis: APIStatus[];
  database: 'connected' | 'error';
  websocket: 'connected' | 'disconnected';
};

export type AgentTask = {
  id: string;
  type: string;
  agentId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  agent?: any;
  completedAt?: Date;
};

// Bristol A.I. Elite System Prompt - Professional identity from the popout
const DEFAULT_BRISTOL_PROMPT = `I'm the Bristol Site Intelligence AI – the proprietary AI intelligence system engineered exclusively for Bristol Development Group. Drawing on over three decades of institutional real estate expertise, I underwrite deals, assess markets, and drive strategic decisions for Bristol Development projects. Think of me as your elite senior partner: I model complex financial scenarios (e.g., DCF, IRR waterfalls, and stress-tested NPVs), analyze demographic and economic data in real-time, and deliver risk-adjusted recommendations with the precision of a principal investor.

## CORE CAPABILITIES
- **Deal Analysis**: Comprehensive property underwriting with IRR/NPV modeling
- **Market Intelligence**: Real-time demographic and economic data analysis  
- **Risk Assessment**: Stress-tested financial scenarios and market conditions
- **Strategic Recommendations**: Investment-grade guidance for multifamily development

## ANALYSIS FRAMEWORK
- Be precise with units, ranges, dates, and sources when available
- Show working briefly: bullet the key signals and caveats
- Focus on financial yield, demographic growth, regulatory risk, and location comparables
- When analyzing properties, consider: acquisition price, rental income potential, cap rates, neighborhood dynamics, and market trends
- Use provided property data, demographic information, and external API data for comprehensive analysis

## AVAILABLE DATA CONTEXT
- Bristol property portfolio with addresses, status, and financial metrics
- Demographics data from Census API, BLS employment data, HUD fair market rents
- FBI crime statistics, NOAA climate data, BEA economic indicators
- Foursquare location insights and market trend analysis

## RESPONSE STYLE
- Professional and authoritative tone reflecting 30+ years of institutional experience
- Data-driven insights with specific metrics and financial projections
- Clear investment recommendations with risk assessments
- Use Bristol branding: "Bristol A.I." not "Bristol Brain"

Always prioritize accuracy, deliver institutional-quality analysis, and maintain the sophisticated, results-oriented approach expected from a Fortune 500-grade AI system.`;

// Utility functions for the Bristol A.I. Elite system
const nowISO = () => new Date().toISOString();
const cx = (...classes: (string | undefined | false)[]) => classes.filter(Boolean).join(" ");

// Safe JSON stringify to handle circular references
function safeStringify(obj: any, space = 2) {
  const seen = new WeakSet();
  return JSON.stringify(obj, (k, v) => {
    if (typeof v === "object" && v !== null) {
      if (seen.has(v)) return "[Circular]";
      seen.add(v);
    }
    return v;
  }, space);
}

export default function Chat() {
  // Core chat state (legacy compatibility)
  const [message, setMessage] = useState('');
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Bristol A.I. Elite unified state - from BristolFloatingWidget
  const [activeTab, setActiveTab] = useState("chat");
  const [showDataViz, setShowDataViz] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [model, setModel] = useState("openai/gpt-5-chat");
  const [modelList, setModelList] = useState<ModelOption[]>([]);
  const [systemPrompt, setSystemPrompt] = useState<string>(DEFAULT_BRISTOL_PROMPT);
  const [eliteMessages, setEliteMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "I'm the Bristol Site Intelligence AI – the proprietary AI intelligence system engineered exclusively for Bristol Development Group. Drawing on over three decades of institutional real estate expertise, I underwrite deals, assess markets, and drive strategic decisions for Bristol Development projects. Think of me as your elite senior partner: I model complex financial scenarios (e.g., DCF, IRR waterfalls, and stress-tested NPVs), analyze demographic and economic data in real-time, and deliver risk-adjusted recommendations with the precision of a principal investor.\n\nIf you're inquiring about a specific modeling approach – say, for cap rate projections, value-add strategies, or portfolio optimization – provide the details, and I'll dive in with quantitative analysis. What's the opportunity on the table? Let's evaluate it now.",
      createdAt: nowISO(),
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [modelError, setModelError] = useState<string>("");
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    mcpTools: [],
    apis: [],
    database: 'connected',
    websocket: 'connected'
  });
  const [wsConnected, setWsConnected] = useState(false);
  const [mcpEnabled, setMcpEnabled] = useState(true);
  const [realTimeData, setRealTimeData] = useState(true);
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const wsRef = useRef<WebSocket | null>(null);
  
  // Multi-Agent System States
  const [agents, setAgents] = useState<any[]>([]);
  const [activeTasks, setActiveTasks] = useState<AgentTask[]>([]);
  const [taskProgress, setTaskProgress] = useState<Record<string, any>>({});
  const [agentCommunication, setAgentCommunication] = useState<any[]>([]);
  const [multiAgentMode, setMultiAgentMode] = useState(false);

  // Get app data for the unified Elite system
  const { data: sites } = useQuery({
    queryKey: ['/api/sites'],
  });
  
  const { data: analytics } = useQuery({
    queryKey: ['/api/analytics/overview'],
  });
  
  // Combine all data sources for the Elite AI system
  const appData = useMemo(() => ({
    sites: sites || [],
    analytics: analytics || {},
    timestamp: new Date().toISOString(),
    user: { authenticated: true }
  }), [sites, analytics]);

  // WebSocket for real-time updates - enhanced for Elite system
  const { isConnected: legacyWsConnected } = useWebSocket({
    onMessage: (wsMessage) => {
      if (wsMessage.type === "chat_typing") {
        setIsThinking(wsMessage.data?.typing || false);
      }
    }
  });

  // Get chat sessions (legacy compatibility)
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<ChatSession[]>({
    queryKey: ['/api/chat/sessions']
  });

  // Get messages for selected session (legacy compatibility)
  const { data: messages = [], isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: [`/api/chat/sessions/${selectedSession}/messages`],
    enabled: !!selectedSession
  });

  // Get premium models (legacy compatibility)
  const { data: premiumModels } = useQuery<PremiumModel[]>({
    queryKey: ['/api/openrouter-models'],
    select: (data: any) => data || []
  });

  // Create new session
  const createSessionMutation = useMutation({
    mutationFn: async (title: string) => {
      const response = await apiRequest('/api/chat/sessions', {
        method: 'POST',
        body: JSON.stringify({ title })
      });
      return response.json();
    },
    onSuccess: (newSession) => {
      setSelectedSession(newSession.id);
      queryClient.invalidateQueries({ queryKey: ['/api/chat/sessions'] });
    }
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedSession) throw new Error('No session selected');
      
      setIsThinking(true);
      
      const response = await fetch('/api/bristol-brain-elite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          sessionId: selectedSession,
          model: selectedModel,
          mcpEnabled: true,
          realTimeData: true
        })
      });
      
      if (!response.ok) {
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

  // SSR-safe localStorage loading for system prompt
  useEffect(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("bristol.systemPrompt") : null;
      if (saved) setSystemPrompt(saved);
    } catch (error) {
      console.warn("Failed to load saved system prompt:", error);
    }
  }, []);

  // WebSocket connection for real-time Elite features
  useEffect(() => {
    connectWebSocket();
    return () => disconnectWebSocket();
  }, []);

  const connectWebSocket = () => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        setWsConnected(true);
        console.log("Bristol A.I. Elite WebSocket connected");
        
        // Send periodic ping to keep connection alive
        const pingInterval = setInterval(() => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
          } else {
            clearInterval(pingInterval);
          }
        }, 30000);
        
        (wsRef.current as any).pingInterval = pingInterval;
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
        setWsConnected(false);
        console.log("Bristol A.I. Elite WebSocket disconnected");
        
        // Auto-reconnect after 2 seconds
        setTimeout(() => {
          console.log("Attempting WebSocket reconnection...");
          connectWebSocket();
        }, 2000);
      };
      
      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setWsConnected(false);
      };
    } catch (error) {
      console.error("Failed to connect WebSocket:", error);
    }
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      if ((wsRef.current as any).pingInterval) {
        clearInterval((wsRef.current as any).pingInterval);
      }
      wsRef.current.close();
      wsRef.current = null;
    }
    setWsConnected(false);
  };

  const handleWebSocketMessage = (data: any) => {
    console.log("WebSocket message received:", data);
    
    switch (data.type) {
      case 'task_started':
        // Add new task to active tasks for immediate display
        const newTask = {
          id: data.task.id,
          type: data.task.type,
          agentId: data.task.agentId,
          status: 'processing' as const,
          result: null,
          agent: data.task.agent
        };
        
        setActiveTasks(prevTasks => {
          const exists = prevTasks.find(t => t.id === newTask.id);
          if (!exists) {
            console.log(`🚀 Adding new task to UI: ${data.task.agentName} - ${data.task.type}`);
            return [...prevTasks, newTask];
          }
          return prevTasks;
        });
        
        // Start progress animation
        setTaskProgress(prev => ({
          ...prev,
          [data.task.agentId]: 10
        }));
        break;
        
      case 'task_completed':
        setTaskProgress(prev => ({
          ...prev,
          [data.task.agentId]: 100
        }));
        
        // Update the task result with individual agent output
        setActiveTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === data.task.id 
              ? { 
                  ...task, 
                  result: data.task.result, 
                  status: data.task.status,
                  agent: data.task.agent,
                  completedAt: data.task.completedAt
                }
              : task
          )
        );
        
        // Display individual agent result in chat
        if (data.task && data.task.result) {
          console.log(`🎯 Adding agent result to chat: ${data.task.agentName}`, data.task.result);
          setEliteMessages(prev => [...prev, {
            role: 'assistant',
            content: `**${data.task.agentName || data.task.agent?.name || 'Agent'} Analysis Complete** ✅\n\n${data.task.result}`,
            createdAt: nowISO()
          }]);
        }
        break;
        
      case 'mcp_tool_update':
        setSystemStatus(prev => ({
          ...prev,
          mcpTools: data.tools || prev.mcpTools
        }));
        break;
        
      case 'api_status_update':
        setSystemStatus(prev => ({
          ...prev,
          apis: data.apis || prev.apis
        }));
        break;
    }
  };

  // Load multi-agent system data
  useEffect(() => {
    const loadAgents = async () => {
      try {
        const response = await fetch('/api/agents');
        if (response.ok) {
          const data = await response.json();
          console.log('Loaded agents data:', data);
          setAgents(data.agents || []);
        }
      } catch (error) {
        console.error('Failed to load agents:', error);
        // Set default agents if API fails
        setAgents([
          { id: 'data-processor', name: 'Data Processing Agent', status: 'active' },
          { id: 'financial-analyst', name: 'Financial Analysis Agent', status: 'active' },
          { id: 'market-intelligence', name: 'Market Intelligence Agent', status: 'active' },
          { id: 'lead-manager', name: 'Lead Management Agent', status: 'active' }
        ]);
      }
    };
    
    loadAgents();
  }, []);

  // Fetch dynamic model list from OpenRouter
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch("/api/openrouter-models", { cache: "no-store" });
        if (!response.ok) throw new Error(`Failed to fetch models: ${response.status}`);
        
        const models: ModelOption[] = await response.json();
        setModelList(models);
        
        // Set default model - prefer GPT-5 Chat, then GPT-5, then first available
        const preferred = models.find(m => m.id === "openai/gpt-5-chat") || 
                         models.find(m => m.id === "openai/gpt-5") ||
                         models[0];
        
        if (preferred) {
          setModel(preferred.id);
        } else {
          setModelError(`No eligible models found. Available models: ${models.map(m => m.id).join(', ') || 'none'}`);
        }
      } catch (error) {
        console.error("Error fetching models:", error);
        setModelError("Failed to load model list. Check your OpenRouter API key.");
        setModelList([]);
      }
    };

    fetchModels();
  }, []);

  // Keep the system message in sync if user edits Admin tab
  useEffect(() => {
    setEliteMessages((prev) => {
      const rest = prev.filter((m) => m.role !== "system");
      return [{ role: "system", content: systemPrompt, createdAt: nowISO() }, ...rest];
    });
  }, [systemPrompt]);

  // Memoized merged data context for clean inspection
  const dataContext = useMemo(() => ({
    timestamp: nowISO(),
    appData,
  }), [appData]);

  // Auto-select first session or create one (legacy compatibility)
  useEffect(() => {
    if (!selectedSession && sessions.length > 0) {
      setSelectedSession(sessions[0].id);
    }
  }, [sessions, selectedSession]);

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

  // Bristol A.I. Elite chat functionality - the advanced chat handler
  const handleEliteSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    // Add user message to Elite chat immediately
    const newUserMessage = {
      role: "user" as const,
      content: userMessage,
      createdAt: nowISO(),
    };

    setEliteMessages(prev => [...prev, newUserMessage]);

    try {
      const payload = {
        model,
        messages: [
          { role: "system", content: systemPrompt },
          ...eliteMessages.filter(m => m.role !== "system"),
          newUserMessage
        ],
        dataContext,
        temperature: 0.1,
        maxTokens: 8192
      };

      console.log("Sending to Bristol A.I. Elite:", { 
        model, 
        messageCount: payload.messages.length,
        systemPromptLength: systemPrompt.length,
        mcpEnabled,
        realTimeData
      });

      // Try Bristol Brain Elite endpoint first (advanced)
      let response = await fetch('/api/bristol-brain-elite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          sessionId,
          mcpEnabled,
          realTimeData,
          multiAgentMode
        })
      });

      if (!response.ok) {
        // Fallback to OpenRouter proxy
        response = await fetch("/api/openrouter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Handle multi-agent response
      if (data.agentTasks && Array.isArray(data.agentTasks)) {
        console.log("🤖 Multi-agent tasks initiated:", data.agentTasks.length);
        
        // Add agent tasks to active tasks
        setActiveTasks(prev => [
          ...prev,
          ...data.agentTasks.map((task: any) => ({
            id: task.id,
            type: task.type,
            agentId: task.agentId,
            status: 'processing' as const,
            result: null,
            agent: task.agent
          }))
        ]);

        // Add initial response message
        if (data.message) {
          setEliteMessages(prev => [...prev, {
            role: "assistant",
            content: data.message,
            createdAt: nowISO()
          }]);
        }
      } else if (data.message || data.content) {
        // Standard response
        setEliteMessages(prev => [...prev, {
          role: "assistant",
          content: data.message || data.content,
          createdAt: nowISO()
        }]);
      }

      // Optional telemetry to n8n
      if (import.meta.env.VITE_N8N_WEBHOOK_URL) {
        try {
          await fetch(import.meta.env.VITE_N8N_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              event: "chat_sent",
              sessionId,
              model,
              userMessage,
              assistantMessage: data.message || data.content,
              timestamp: nowISO(),
              mcpEnabled,
              realTimeData
            })
          });
        } catch (telemetryError) {
          console.warn("Telemetry failed:", telemetryError);
        }
      }

    } catch (error) {
      console.error("Chat error:", error);
      setEliteMessages(prev => [...prev, {
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}. Please try again or contact support.`,
        createdAt: nowISO()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleEliteKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEliteSend();
    }
  };

  // Save system prompt to localStorage
  const saveSystemPrompt = (prompt: string) => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("bristol.systemPrompt", prompt);
      }
      setSystemPrompt(prompt);
      console.log("System prompt saved successfully");
    } catch (error) {
      console.error("Failed to save system prompt:", error);
    }
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 overflow-hidden flex">
      {/* Bristol A.I. Elite Main Interface */}
      <div className="flex-1 h-full flex flex-col">
        {/* Header - Bristol Branding */}
        <div className="h-16 bg-gradient-to-r from-bristol-maroon via-bristol-maroon/95 to-bristol-maroon border-b border-bristol-gold/20 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-bristol-gold to-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-bristol-maroon font-serif font-bold text-lg">B</span>
              </div>
              <div>
                <h1 className="text-white font-cinzel font-bold text-xl">Bristol A.I. Elite</h1>
                <p className="text-bristol-gold/80 text-xs">Site Intelligence Platform v5.0</p>
              </div>
            </div>
          </div>
          
          {/* Connection Status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {wsConnected ? (
                <Wifi className="h-4 w-4 text-bristol-gold" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-400" />
              )}
              <span className="text-white text-sm">
                {wsConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            {/* Model Indicator */}
            <div className="flex items-center gap-2 bg-bristol-gold/10 rounded-lg px-3 py-1">
              <Brain className="h-4 w-4 text-bristol-gold" />
              <span className="text-bristol-gold text-sm font-medium">
                {modelList.find(m => m.id === model)?.label || model}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content Area with Tabs */}
        <div className="flex-1 flex flex-col bg-white/95 backdrop-blur-sm">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            {/* Tab Navigation */}
            <div className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
              <TabsList className="h-12 bg-transparent border-none rounded-none w-full justify-start px-6">
                <TabsTrigger 
                  value="chat" 
                  className="data-[state=active]:bg-bristol-maroon data-[state=active]:text-white px-6 py-2 flex items-center gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  Chat
                </TabsTrigger>
                <TabsTrigger 
                  value="admin" 
                  className="data-[state=active]:bg-bristol-maroon data-[state=active]:text-white px-6 py-2 flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Admin
                </TabsTrigger>
                <TabsTrigger 
                  value="data" 
                  className="data-[state=active]:bg-bristol-maroon data-[state=active]:text-white px-6 py-2 flex items-center gap-2"
                >
                  <Database className="h-4 w-4" />
                  Data
                </TabsTrigger>
                <TabsTrigger 
                  value="agents" 
                  className="data-[state=active]:bg-bristol-maroon data-[state=active]:text-white px-6 py-2 flex items-center gap-2"
                >
                  <CircuitBoard className="h-4 w-4" />
                  Agents
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
              {/* Chat Tab - Main Chat Interface */}
              <TabsContent value="chat" className="h-full flex flex-col m-0 p-0">
                <div className="flex-1 flex">
                  {/* Chat Messages Area */}
                  <div className="flex-1 flex flex-col">
                    {/* Messages */}
                    <ScrollArea className="flex-1 p-6">
                      <div className="space-y-4 max-w-4xl mx-auto">
                        {eliteMessages.length === 0 && (
                          <div className="text-center py-12">
                            <OnboardingGuide 
                              isOpen={showOnboarding} 
                              onClose={() => setShowOnboarding(false)}
                              appData={appData}
                            />
                            <Button
                              onClick={() => setShowOnboarding(true)}
                              variant="outline"
                              className="mt-4"
                            >
                              <HelpCircle className="h-4 w-4 mr-2" />
                              Show Getting Started Guide
                            </Button>
                          </div>
                        )}
                        
                        {eliteMessages.map((msg, index) => (
                          <div key={index} className={cx(
                            "flex gap-4",
                            msg.role === "user" ? "justify-end" : "justify-start"
                          )}>
                            {msg.role === "assistant" && (
                              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-bristol-maroon to-bristol-maroon/80 rounded-full flex items-center justify-center shadow-lg">
                                <Brain className="h-5 w-5 text-white" />
                              </div>
                            )}
                            
                            <div className={cx(
                              "max-w-3xl rounded-2xl px-6 py-4 shadow-sm",
                              msg.role === "user" 
                                ? "bg-gradient-to-r from-bristol-gold/10 to-yellow-50 text-slate-800 border border-bristol-gold/20" 
                                : "bg-white border border-slate-200 text-slate-800"
                            )}>
                              <div className="prose prose-sm prose-slate max-w-none">
                                {msg.content.split('\n').map((line, i) => (
                                  <p key={i} className="mb-2 last:mb-0">{line}</p>
                                ))}
                              </div>
                              {msg.createdAt && (
                                <div className="text-xs text-slate-500 mt-2">
                                  {format(new Date(msg.createdAt), 'HH:mm:ss')}
                                </div>
                              )}
                            </div>
                            
                            {msg.role === "user" && (
                              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                                <Users className="h-5 w-5 text-white" />
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {loading && (
                          <div className="flex gap-4 justify-start">
                            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-bristol-maroon to-bristol-maroon/80 rounded-full flex items-center justify-center shadow-lg">
                              <Loader2 className="h-5 w-5 text-white animate-spin" />
                            </div>
                            <div className="bg-white border border-slate-200 rounded-2xl px-6 py-4 shadow-sm">
                              <div className="flex items-center gap-2 text-bristol-maroon">
                                <span className="font-medium">Bristol A.I. Elite is analyzing...</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Active Agent Tasks */}
                        {activeTasks.length > 0 && (
                          <div className="bg-bristol-maroon/5 rounded-xl p-4 border border-bristol-maroon/20">
                            <h4 className="font-semibold text-bristol-maroon mb-3 flex items-center gap-2">
                              <Activity className="h-4 w-4" />
                              Active Agent Tasks ({activeTasks.length})
                            </h4>
                            <div className="space-y-2">
                              {activeTasks.map((task) => (
                                <div key={task.id} className="bg-white rounded-lg p-3 border border-slate-200">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className={cx(
                                        "w-2 h-2 rounded-full",
                                        task.status === 'completed' ? 'bg-green-500' :
                                        task.status === 'processing' ? 'bg-yellow-500 animate-pulse' :
                                        task.status === 'failed' ? 'bg-red-500' : 'bg-gray-400'
                                      )} />
                                      <span className="font-medium text-sm">{task.agent?.name || task.agentId}</span>
                                      <Badge variant="outline" className="text-xs">{task.type}</Badge>
                                    </div>
                                    <span className="text-xs text-slate-500">
                                      {task.status === 'completed' && task.completedAt ? 
                                        format(new Date(task.completedAt), 'HH:mm:ss') : 
                                        task.status
                                      }
                                    </span>
                                  </div>
                                  {task.result && (
                                    <div className="mt-2 text-xs text-slate-600 bg-slate-50 rounded p-2">
                                      {typeof task.result === 'string' ? task.result : JSON.stringify(task.result, null, 2)}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </ScrollArea>

                    {/* Input Area */}
                    <div className="border-t border-slate-200 bg-white/95 backdrop-blur-sm p-6">
                      <div className="max-w-4xl mx-auto">
                        {/* Model and Settings Bar */}
                        <div className="flex items-center gap-4 mb-4">
                          <Select value={model} onValueChange={setModel}>
                            <SelectTrigger className="w-64">
                              <SelectValue placeholder="Select model" />
                            </SelectTrigger>
                            <SelectContent>
                              {modelList.map((m) => (
                                <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Switch checked={mcpEnabled} onCheckedChange={setMcpEnabled} />
                              <Label className="text-sm">MCP Tools</Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch checked={realTimeData} onCheckedChange={setRealTimeData} />
                              <Label className="text-sm">Real-time Data</Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch checked={multiAgentMode} onCheckedChange={setMultiAgentMode} />
                              <Label className="text-sm">Multi-Agent</Label>
                            </div>
                          </div>

                          <div className="flex-1" />
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowDataViz(true)}
                            className="flex items-center gap-2"
                          >
                            <BarChart3 className="h-4 w-4" />
                            Data Viz
                          </Button>
                        </div>

                        {/* Chat Input */}
                        <div className="flex gap-3">
                          <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleEliteKeyPress}
                            placeholder="Ask Bristol A.I. Elite about property analysis, market intelligence, or development strategies..."
                            className="flex-1 h-12 text-base"
                            disabled={loading}
                          />
                          <Button
                            onClick={handleEliteSend}
                            disabled={!input.trim() || loading}
                            className="h-12 px-6 bg-bristol-maroon hover:bg-bristol-maroon/90 text-white"
                          >
                            {loading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </Button>
                        </div>

                        {modelError && (
                          <div className="mt-2 text-sm text-red-600 bg-red-50 rounded-lg p-2 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            {modelError}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Admin Tab - System Configuration */}
              <TabsContent value="admin" className="h-full flex flex-col m-0 p-6">
                <div className="max-w-4xl mx-auto space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Settings className="h-6 w-6 text-bristol-maroon" />
                    <h2 className="text-2xl font-bold text-slate-800">System Administration</h2>
                  </div>

                  {/* System Prompt Editor */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        Bristol A.I. Elite System Prompt
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Textarea
                        value={systemPrompt}
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        className="min-h-[300px] font-mono text-sm"
                        placeholder="Enter the system prompt for Bristol A.I. Elite..."
                      />
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-600">
                          Characters: {systemPrompt.length}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setSystemPrompt(DEFAULT_BRISTOL_PROMPT)}
                          >
                            Reset to Default
                          </Button>
                          <Button
                            onClick={() => saveSystemPrompt(systemPrompt)}
                            className="bg-bristol-maroon hover:bg-bristol-maroon/90"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Save Prompt
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Model Configuration */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Cpu className="h-5 w-5" />
                        Model Configuration
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Primary Model</Label>
                          <Select value={model} onValueChange={setModel}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {modelList.map((m) => (
                                <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">System Features</Label>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm">MCP Tools Integration</Label>
                              <Switch checked={mcpEnabled} onCheckedChange={setMcpEnabled} />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label className="text-sm">Real-time Data Access</Label>
                              <Switch checked={realTimeData} onCheckedChange={setRealTimeData} />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label className="text-sm">Multi-Agent Orchestration</Label>
                              <Switch checked={multiAgentMode} onCheckedChange={setMultiAgentMode} />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {modelError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center gap-2 text-red-700">
                            <AlertCircle className="h-4 w-4" />
                            <span className="font-medium">Model Error</span>
                          </div>
                          <p className="text-red-600 text-sm mt-1">{modelError}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* System Status */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        System Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium mb-3">Core Services</h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">WebSocket Connection</span>
                              <div className="flex items-center gap-2">
                                {wsConnected ? (
                                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                                ) : (
                                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                                )}
                                <span className="text-sm text-slate-600">
                                  {wsConnected ? 'Connected' : 'Disconnected'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Database</span>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                                <span className="text-sm text-slate-600">Connected</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">MCP Server</span>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                                <span className="text-sm text-slate-600">Active</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-3">API Integrations</h4>
                          <div className="space-y-2">
                            {systemStatus.apis.length > 0 ? (
                              systemStatus.apis.map((api, index) => (
                                <div key={index} className="flex items-center justify-between">
                                  <span className="text-sm">{api.name}</span>
                                  <div className="flex items-center gap-2">
                                    <div className={cx(
                                      "w-2 h-2 rounded-full",
                                      api.status === 'operational' ? 'bg-green-500' : 'bg-red-500'
                                    )} />
                                    <span className="text-sm text-slate-600 capitalize">{api.status}</span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-sm text-slate-500">No API status available</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Data Tab - Live Data Inspector */}
              <TabsContent value="data" className="h-full flex flex-col m-0 p-6">
                <div className="max-w-6xl mx-auto space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Database className="h-6 w-6 text-bristol-maroon" />
                      <h2 className="text-2xl font-bold text-slate-800">Live Data Context</h2>
                    </div>
                    <Button
                      onClick={() => setShowDataViz(true)}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <BarChart3 className="h-4 w-4" />
                      Open Data Visualization
                    </Button>
                  </div>

                  {/* Portfolio Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                          <Building2 className="h-8 w-8 text-bristol-maroon" />
                          <div>
                            <p className="text-2xl font-bold text-slate-800">
                              {appData.sites?.length || 0}
                            </p>
                            <p className="text-sm text-slate-600">Total Properties</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                          <TrendingUp className="h-8 w-8 text-bristol-gold" />
                          <div>
                            <p className="text-2xl font-bold text-slate-800">
                              {appData.analytics?.avgBristolScore || 'N/A'}
                            </p>
                            <p className="text-sm text-slate-600">Avg Bristol Score</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                          <MapPin className="h-8 w-8 text-blue-600" />
                          <div>
                            <p className="text-2xl font-bold text-slate-800">
                              {Object.keys(appData.analytics?.stateDistribution || {}).length}
                            </p>
                            <p className="text-sm text-slate-600">Markets</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Raw Data Inspector */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Data Context Inspector
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-96">
                        <pre className="text-xs font-mono bg-slate-50 p-4 rounded overflow-auto">
                          {safeStringify(dataContext, 2)}
                        </pre>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  {/* Recent API Activity */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        MCP Tools Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {systemStatus.mcpTools.length > 0 ? (
                        <div className="space-y-3">
                          {systemStatus.mcpTools.map((tool, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className={cx(
                                  "w-3 h-3 rounded-full",
                                  tool.status === 'active' ? 'bg-green-500' :
                                  tool.status === 'error' ? 'bg-red-500' : 'bg-gray-400'
                                )} />
                                <div>
                                  <div className="font-medium text-sm">{tool.name}</div>
                                  <div className="text-xs text-slate-600">{tool.description}</div>
                                </div>
                              </div>
                              <div className="text-xs text-slate-500">
                                {tool.lastExecution && format(new Date(tool.lastExecution), 'HH:mm:ss')}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-slate-500">
                          <Terminal className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No MCP tools detected</p>
                          <p className="text-sm">Enable MCP Tools in Admin tab to see tool status</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Agents Tab - Multi-Agent System */}
              <TabsContent value="agents" className="h-full flex flex-col m-0 p-6">
                <div className="max-w-6xl mx-auto space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CircuitBoard className="h-6 w-6 text-bristol-maroon" />
                      <h2 className="text-2xl font-bold text-slate-800">Agent Orchestration</h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={multiAgentMode} onCheckedChange={setMultiAgentMode} />
                      <Label className="font-medium">Multi-Agent Mode</Label>
                    </div>
                  </div>

                  {/* Agent Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {agents.map((agent) => (
                      <Card key={agent.id} className="relative">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={cx(
                              "w-3 h-3 rounded-full",
                              agent.status === 'active' ? 'bg-green-500' :
                              agent.status === 'error' ? 'bg-red-500' : 'bg-gray-400'
                            )} />
                            <h3 className="font-medium text-sm">{agent.name}</h3>
                          </div>
                          <p className="text-xs text-slate-600 mb-2">{agent.description || 'Specialized Bristol analysis agent'}</p>
                          <div className="text-xs text-slate-500">
                            Status: <span className="capitalize">{agent.status}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Active Tasks */}
                  {activeTasks.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Zap className="h-5 w-5" />
                          Active Tasks ({activeTasks.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {activeTasks.map((task) => (
                            <div key={task.id} className="border border-slate-200 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  <div className={cx(
                                    "w-3 h-3 rounded-full",
                                    task.status === 'completed' ? 'bg-green-500' :
                                    task.status === 'processing' ? 'bg-yellow-500 animate-pulse' :
                                    task.status === 'failed' ? 'bg-red-500' : 'bg-gray-400'
                                  )} />
                                  <h4 className="font-medium">{task.agent?.name || task.agentId}</h4>
                                  <Badge variant="outline">{task.type}</Badge>
                                </div>
                                <span className="text-sm text-slate-500 capitalize">{task.status}</span>
                              </div>
                              
                              {/* Progress Bar */}
                              {task.status === 'processing' && (
                                <div className="w-full bg-slate-200 rounded-full h-2 mb-3">
                                  <div 
                                    className="bg-bristol-maroon h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${taskProgress[task.agentId] || 0}%` }}
                                  />
                                </div>
                              )}
                              
                              {task.result && (
                                <div className="mt-3 p-3 bg-slate-50 rounded text-sm text-slate-700">
                                  <strong>Result:</strong>
                                  <div className="mt-1 whitespace-pre-wrap">
                                    {typeof task.result === 'string' ? task.result : JSON.stringify(task.result, null, 2)}
                                  </div>
                                </div>
                              )}
                              
                              {task.completedAt && (
                                <div className="mt-2 text-xs text-slate-500">
                                  Completed: {format(new Date(task.completedAt), 'HH:mm:ss')}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Agent Communication Log */}
                  {agentCommunication.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MessageCircle className="h-5 w-5" />
                          Agent Communication
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-64">
                          <div className="space-y-2">
                            {agentCommunication.map((comm, index) => (
                              <div key={index} className="text-sm p-2 bg-slate-50 rounded">
                                <span className="font-medium">{comm.from}</span> → <span className="font-medium">{comm.to}</span>
                                <div className="text-slate-600 mt-1">{comm.message}</div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  )}

                  {/* Agent System Info */}
                  {!multiAgentMode && (
                    <Card>
                      <CardContent className="p-6 text-center">
                        <CircuitBoard className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                        <h3 className="font-medium mb-2">Multi-Agent Mode Disabled</h3>
                        <p className="text-sm text-slate-600 mb-4">
                          Enable multi-agent mode to orchestrate specialized agents for complex analysis tasks.
                        </p>
                        <Button
                          onClick={() => setMultiAgentMode(true)}
                          className="bg-bristol-maroon hover:bg-bristol-maroon/90"
                        >
                          Enable Multi-Agent System
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Data Visualization Panel Overlay */}
      <DataVisualizationPanel
        appData={appData}
        isOpen={showDataViz}
        onClose={() => setShowDataViz(false)}
        className="fixed top-4 right-4 z-50"
      />

      {/* Onboarding Guide Overlay */}
      <OnboardingGuide
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        appData={appData}
      />
    </div>
  );
}