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
  const [model, setModel] = useState("openai/gpt-4o");
  const [modelList, setModelList] = useState<ModelOption[]>([]);
  const [systemPrompt, setSystemPrompt] = useState<string>("");
  const [eliteMessages, setEliteMessages] = useState<any[]>([
    {
      role: "assistant",
      content: "Hello! I'm your AI assistant. How can I help you today?",
      createdAt: nowISO(),
      sessionId: '',
      id: `msg-${Date.now()}`,
      metadata: {}
    }
  ]);
  const [input, setInput] = useState("");
  const [eliteInput, setEliteInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [eliteLoading, setEliteLoading] = useState(false);
  const [modelError, setModelError] = useState<string>("");
  const eliteInputRef = useRef<HTMLInputElement>(null);
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
      const response = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
          model: model,
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

  // Load available models on component mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        const response = await fetch('/api/chat/models');
        if (response.ok) {
          const data = await response.json();
          setModelList(data.models.map((m: any) => ({
            id: m.id,
            label: m.name,
            context: m.contextLength
          })));
        }
      } catch (error) {
        console.error('Failed to load models:', error);
      }
    };
    loadModels();
  }, []);

  // Bristol A.I. Elite chat functionality - the advanced chat handler
  const handleEliteSend = async () => {
    if (!eliteInput.trim() || eliteLoading) return;

    const userMessage = eliteInput.trim();
    setEliteInput("");
    setEliteLoading(true);

    // Add user message to Elite chat immediately
    const newUserMessage = {
      role: "user" as const,
      content: userMessage,
      createdAt: nowISO(),
      sessionId,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      metadata: {}
    };

    setEliteMessages(prev => [...prev, newUserMessage]);

    try {
      // Prepare messages for API (filter out system prompts and format properly)
      const apiMessages = eliteMessages
        .filter(msg => msg.role !== "system")
        .map(msg => ({
          role: msg.role as "user" | "assistant",
          content: msg.content
        }));
      
      // Add current user message
      apiMessages.push({
        role: "user",
        content: userMessage
      });

      console.log("Sending to Bristol A.I. Elite:", { 
        model, 
        messageCount: apiMessages.length,
        mcpEnabled,
        realTimeData
      });

      // Call the enhanced chat API
      const response = await fetch("/api/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: model,
          messages: apiMessages,
          temperature: 0.7,
          maxTokens: 4000
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      let assistantContent = "";
      
      // Handle different response formats from different providers
      if (data.choices && data.choices[0]) {
        assistantContent = data.choices[0].message?.content || "";
      } else if (data.content) {
        assistantContent = Array.isArray(data.content) ? data.content[0].text : data.content;
      }
      
      setEliteMessages(prev => [...prev, {
        role: "assistant",
        content: assistantContent,
        createdAt: nowISO(),
        sessionId,
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        metadata: { model, provider: model.split('/')[0] }
      }]);

    } catch (error) {
      console.error("Chat error:", error);
      setEliteMessages(prev => [...prev, {
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}. Please try again or contact support.`,
        createdAt: nowISO(),
        sessionId,
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        metadata: { error: true }
      }]);
    } finally {
      setEliteLoading(false);
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
    <div className="h-screen w-screen flex">
      {/* Cyberpunk Glassomorphic Panel - Full Height with Fixed Layout - EXACT REPLICA OF FLOATING WIDGET */}
      <div 
        className="w-full h-screen text-neutral-100 shadow-2xl flex flex-col chrome-metallic-panel font-cinzel"
        style={{
          background: 'linear-gradient(135deg, rgba(5, 10, 20, 0.95) 0%, rgba(69, 214, 202, 0.1) 25%, rgba(255, 255, 255, 0.05) 50%, rgba(69, 214, 202, 0.1) 75%, rgba(5, 10, 20, 0.95) 100%)',
          backdropFilter: 'blur(20px) saturate(150%)',
          border: '1px solid rgba(69, 214, 202, 0.3)',
          boxShadow: `
            0 0 30px rgba(69, 214, 202, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.1)
          `,
        }}
      >
        {/* Premium Glass Header */}
        <div className="relative overflow-hidden">
          {/* Ambient glow effects */}
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-bristol-cyan/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -top-5 -right-10 w-32 h-32 bg-bristol-electric/8 rounded-full blur-2xl animate-pulse delay-1000" />
          
          {/* Glass header background */}
          <div 
            className="absolute inset-0" 
            style={{
              background: 'linear-gradient(135deg, rgba(69, 214, 202, 0.15) 0%, rgba(168, 85, 247, 0.1) 50%, rgba(239, 68, 68, 0.08) 100%)',
            }}
          />
          
          {/* Header content */}
          <div className="relative z-10 flex items-center justify-between px-6 py-5 border-b border-bristol-cyan/30">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="absolute -inset-2 bg-gradient-to-r from-bristol-cyan/20 to-bristol-electric/20 rounded-full blur-sm opacity-75 group-hover:opacity-100 animate-pulse" />
                <div className="relative bg-gradient-to-r from-bristol-cyan/20 to-bristol-electric/20 p-2 rounded-full border border-bristol-cyan/30">
                  <Brain className="h-7 w-7 text-bristol-cyan" />
                </div>
              </div>
              <div>
                <h1 className="font-serif font-bold text-2xl bg-gradient-to-r from-bristol-cyan via-white to-bristol-gold bg-clip-text text-transparent drop-shadow-lg">
                  BRISTOL A.I.
                </h1>
                <p className="text-lg text-bristol-cyan font-bold tracking-wide uppercase mt-1 drop-shadow-lg">
                  AI Real Estate Intelligence
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Data Visualization Toggle */}
              <button 
                onClick={() => setShowDataViz(!showDataViz)} 
                className={cx(
                  "p-2 rounded-xl transition-all duration-300 group relative",
                  "bg-white/5 hover:bg-bristol-cyan/10 backdrop-blur-sm",
                  "border border-bristol-cyan/20 hover:border-bristol-cyan/50",
                  "hover:shadow-lg hover:shadow-bristol-cyan/20",
                  showDataViz && "bg-bristol-cyan/20 border-bristol-cyan/60"
                )}
                aria-label="Toggle Data Visualization"
                title="View Live Data Context"
              >
                <BarChart3 className="h-4 w-4 text-bristol-cyan/70 group-hover:text-bristol-cyan transition-colors" />
              </button>

              {/* Onboarding Guide Toggle */}
              <button 
                onClick={() => setShowOnboarding(true)} 
                className={cx(
                  "p-2 rounded-xl transition-all duration-300 group relative",
                  "bg-white/5 hover:bg-bristol-cyan/10 backdrop-blur-sm",
                  "border border-bristol-cyan/20 hover:border-bristol-cyan/50",
                  "hover:shadow-lg hover:shadow-bristol-cyan/20"
                )}
                aria-label="Open AI Guide"
                title="Learn How to Use Bristol A.I."
              >
                <HelpCircle className="h-4 w-4 text-bristol-cyan/70 group-hover:text-bristol-cyan transition-colors" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs - Exact from floating widget */}
        <div className="border-b border-bristol-cyan/30 bg-bristol-ink/20 relative z-20">
          <div className="flex">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Chat tab clicked");
                setActiveTab("chat");
              }}
              className={cx(
                "px-6 py-3 text-sm font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer relative z-30",
                activeTab === "chat"
                  ? "bg-bristol-cyan/20 text-bristol-cyan border-b-2 border-bristol-cyan"
                  : "text-bristol-cyan/70 hover:text-bristol-cyan hover:bg-bristol-cyan/10"
              )}
            >
              AI Chat
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Data tab clicked");
                setActiveTab("data");
              }}
              className={cx(
                "px-6 py-3 text-sm font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer relative z-30",
                activeTab === "data"
                  ? "bg-bristol-cyan/20 text-bristol-cyan border-b-2 border-bristol-cyan"
                  : "text-bristol-cyan/70 hover:text-bristol-cyan hover:bg-bristol-cyan/10"
              )}
            >
              Data
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Tools tab clicked");
                setActiveTab("tools");
              }}
              className={cx(
                "px-6 py-3 text-sm font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer relative z-30",
                activeTab === "tools"
                  ? "bg-bristol-cyan/20 text-bristol-cyan border-b-2 border-bristol-cyan"
                  : "text-bristol-cyan/70 hover:text-bristol-cyan hover:bg-bristol-cyan/10"
              )}
            >
              Tools
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Agents tab clicked");
                setActiveTab("agents");
              }}
              className={cx(
                "px-6 py-3 text-sm font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer relative z-30",
                activeTab === "agents"
                  ? "bg-bristol-cyan/20 text-bristol-cyan border-b-2 border-bristol-cyan"
                  : "text-bristol-cyan/70 hover:text-bristol-cyan hover:bg-bristol-cyan/10"
              )}
            >
              🤖 Agents
            </button>

          </div>
        </div>

        {/* Compact Model Selector - Exact from floating widget */}
        <div 
          className="px-6 py-3 border-b border-bristol-cyan/30 relative"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(69, 214, 202, 0.05) 50%, rgba(168, 85, 247, 0.02) 100%)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {/* Ambient glow */}
          <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 w-32 h-8 bg-bristol-cyan/10 rounded-full blur-2xl" />
          
          {modelError && (
            <div 
              className="mb-4 text-xs text-red-300 rounded-2xl px-4 py-3 backdrop-blur-md border border-red-400/40"
              style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)',
                boxShadow: '0 4px 20px rgba(239, 68, 68, 0.1)',
              }}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                {modelError}
              </div>
            </div>
          )}
          
          <div className="flex flex-wrap items-center gap-6">
            
            {/* Elite Model Selector - Fully Styled */}
            <div className="flex-1 max-w-md">
              <label className="block text-xs text-bristol-cyan/90 font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                <Brain className="h-3 w-3 animate-pulse" />
                AI Engine Selection
              </label>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-bristol-cyan/30 via-bristol-electric/20 to-bristol-gold/30 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
                <div className="absolute inset-0 bg-gradient-to-r from-bristol-cyan/5 to-bristol-electric/5 rounded-2xl" />
                <select
                  className="relative w-full text-sm font-bold transition-all duration-300 backdrop-blur-sm rounded-2xl px-5 py-3 border text-bristol-cyan hover:text-white focus:text-white focus:outline-none focus:border-bristol-electric focus:ring-2 focus:ring-bristol-electric/40 disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(69, 214, 202, 0.1) 30%, rgba(30, 41, 59, 0.9) 100%)',
                    borderColor: 'rgba(69, 214, 202, 0.6)',
                    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 1px 3px rgba(0, 0, 0, 0.3)',
                  }}
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  disabled={modelList.length === 0}
                >
                  {modelList.length === 0 ? (
                    <option value="">⚡ Loading Elite AI Models...</option>
                  ) : (
                    modelList.map((m: ModelOption) => {
                      // Get company-specific emoji based on model provider
                      const getProviderEmoji = (modelId: string) => {
                        if (modelId.includes('gpt') || modelId.includes('openai')) return '🟢'; // OpenAI - green circle
                        if (modelId.includes('claude') || modelId.includes('anthropic')) return '🔶'; // Anthropic - orange diamond
                        if (modelId.includes('grok') || modelId.includes('x-ai')) return '⚡'; // xAI - lightning bolt
                        if (modelId.includes('gemini') || modelId.includes('google')) return '🔷'; // Google - blue diamond
                        if (modelId.includes('perplexity') || modelId.includes('sonar')) return '🔍'; // Perplexity - magnifying glass
                        if (modelId.includes('meta') || modelId.includes('llama')) return '🦙'; // Meta - llama
                        return '🤖'; // Default AI robot
                      };

                      return (
                        <option key={m.id} value={m.id}>
                          {getProviderEmoji(m.id)} {m.label}
                        </option>
                      );
                    })
                  )}
                </select>
              </div>
            </div>

            {/* WebSocket Status */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs">
                {wsConnected ? (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-bristol-cyan rounded-full animate-pulse" />
                    <span className="text-bristol-cyan font-bold">LIVE</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                    <span className="text-red-400 font-bold">OFFLINE</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabbed Content Area - Exact from floating widget */}
        <div 
          className="flex-1 min-h-0 relative flex flex-col overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.3) 0%, rgba(30, 41, 59, 0.2) 50%, rgba(15, 23, 42, 0.4) 100%)',
          }}
        >
          {/* Chat Tab Content */}
          {activeTab === "chat" && (
            <div className="flex-1 overflow-hidden flex flex-col relative">
              {/* Background tint overlay for chat area */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.4) 0%, rgba(30, 41, 59, 0.3) 50%, rgba(15, 23, 42, 0.5) 100%)',
                  backdropFilter: 'blur(8px)',
                }}
              />
              <div className="absolute top-10 right-10 w-24 h-24 bg-bristol-electric/5 rounded-full blur-2xl animate-pulse delay-500" />
              <div className="absolute bottom-20 left-10 w-32 h-32 bg-bristol-cyan/5 rounded-full blur-3xl animate-pulse delay-1000" />
              
              {/* Chat Messages Area */}
              <div className="relative z-10 flex-1 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {eliteMessages.length === 0 && (
                    <div className="text-center py-12">
                      <OnboardingGuide 
                        isOpen={showOnboarding} 
                        onClose={() => setShowOnboarding(false)}
                        appData={appData}
                      />
                      <button
                        onClick={() => setShowOnboarding(true)}
                        className="mt-4 px-6 py-3 bg-bristol-cyan/20 hover:bg-bristol-cyan/30 text-bristol-cyan border border-bristol-cyan/40 rounded-2xl transition-all duration-300 font-bold text-sm backdrop-blur-sm"
                      >
                        <HelpCircle className="h-4 w-4 mr-2 inline" />
                        Show Getting Started Guide
                      </button>
                    </div>
                  )}
                  
                  {eliteMessages.map((msg, index) => (
                    <div key={index} className={cx(
                      "flex w-full",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}>
                      <div className={cx(
                        "max-w-[85%] rounded-2xl px-4 py-3 backdrop-blur-sm border",
                        msg.role === "user" 
                          ? "bg-bristol-cyan/20 border-bristol-cyan/40 text-bristol-cyan"
                          : "bg-white/10 border-white/20 text-white"
                      )}>
                        <div className="text-sm whitespace-pre-wrap font-medium">
                          {msg.content}
                        </div>
                        {msg.createdAt && (
                          <div className="text-xs opacity-60 mt-1">
                            {new Date(msg.createdAt).toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {eliteLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3 backdrop-blur-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-bristol-cyan rounded-full animate-pulse" />
                          <div className="w-2 h-2 bg-bristol-cyan rounded-full animate-pulse delay-150" />
                          <div className="w-2 h-2 bg-bristol-cyan rounded-full animate-pulse delay-300" />
                          <span className="text-bristol-cyan text-sm font-medium ml-2">Bristol A.I. is analyzing...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Other Tab Contents */}
          {activeTab === "data" && (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div className="border border-bristol-cyan/30 rounded-2xl p-6 bg-white/5 backdrop-blur-sm">
                  <h3 className="text-bristol-cyan font-bold text-lg mb-4 flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Live Data Context
                  </h3>
                  <DataVisualizationPanel appData={appData} isOpen={true} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "tools" && (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="text-center py-12">
                <Settings className="h-12 w-12 text-bristol-cyan/60 mx-auto mb-4" />
                <h3 className="text-bristol-cyan font-bold text-lg mb-2">MCP Tools Panel</h3>
                <p className="text-bristol-cyan/70">Advanced tools and integrations coming soon...</p>
              </div>
            </div>
          )}

          {activeTab === "agents" && (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="text-center py-12">
                <CircuitBoard className="h-12 w-12 text-bristol-cyan/60 mx-auto mb-4" />
                <h3 className="text-bristol-cyan font-bold text-lg mb-2">Multi-Agent System</h3>
                <p className="text-bristol-cyan/70">Agent orchestration panel coming soon...</p>
              </div>
            </div>
          )}


        </div>

        {/* Glass Chat Composer - Fixed at Bottom - Only show on chat tab - EXACT FROM FLOATING WIDGET */}
        {activeTab === "chat" && (
          <div 
            className="border-t border-bristol-cyan/40 relative flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 50%, rgba(15, 23, 42, 0.95) 100%)',
              backdropFilter: 'blur(20px) saturate(1.2)',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            }}
          >
            {/* Ambient glow */}
            <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 w-40 h-6 bg-bristol-cyan/10 rounded-full blur-2xl" />
            
            <div className="px-6 py-5 flex items-end gap-4">
              <div className="flex-1 relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-bristol-cyan/20 to-bristol-electric/20 rounded-3xl blur opacity-0 group-focus-within:opacity-100 transition duration-300" />
                <input
                  ref={eliteInputRef}
                  value={eliteInput}
                  onChange={(e) => setEliteInput(e.target.value)}
                  onKeyDown={handleEliteKeyPress}
                  placeholder={eliteLoading ? "Bristol A.I. is analyzing..." : "Ask about properties, market trends, demographics, investment opportunities..."}
                  disabled={eliteLoading}
                  className="chrome-metallic-input w-full text-sm font-medium rounded-3xl px-6 py-4 pr-12 text-white placeholder-bristol-cyan/60 disabled:opacity-60"
                  style={{
                    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(69, 214, 202, 0.1) 30%, rgba(30, 41, 59, 0.9) 100%)',
                    border: '1px solid rgba(69, 214, 202, 0.6)',
                    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 1px 3px rgba(0, 0, 0, 0.3)',
                  }}
                />
                {eliteLoading && (
                  <div className="absolute right-5 top-1/2 transform -translate-y-1/2">
                    <div className="w-5 h-5 border-2 border-bristol-cyan/30 border-t-bristol-cyan rounded-full animate-spin" />
                  </div>
                )}
              </div>
              
              {/* Glass Send Button */}
              <button
                onClick={handleEliteSend}
                disabled={eliteLoading || !eliteInput.trim()}
                className={cx(
                  "chrome-metallic-button relative inline-flex items-center gap-3 px-6 py-4 rounded-3xl font-bold text-sm",
                  "disabled:opacity-50 disabled:cursor-not-allowed group overflow-hidden"
                )}
                style={{
                  background: 'linear-gradient(135deg, rgba(69, 214, 202, 0.15) 0%, rgba(30, 41, 59, 0.8) 50%, rgba(69, 214, 202, 0.1) 100%)',
                  border: '1px solid rgba(69, 214, 202, 0.6)',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 4px 20px rgba(69, 214, 202, 0.1)',
                }}
              >
                {/* Glass shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                
                {/* Button content */}
                <div className="relative z-10 flex items-center gap-2">
                  {eliteLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-bristol-cyan/40 border-t-bristol-cyan rounded-full animate-spin" />
                      <span className="text-bristol-cyan/80 font-bold">Processing</span>
                    </>
                  ) : (
                    <>
                      <Brain className="h-5 w-5 text-bristol-cyan group-hover:text-white transition-colors duration-300" />
                      <span className="text-bristol-cyan group-hover:text-white transition-colors duration-300 font-bold">
                        ANALYZE
                      </span>
                    </>
                  )}
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Data Visualization Panel - Exact from floating widget */}
      {showDataViz && (
        <DataVisualizationPanel 
          appData={appData}
          isOpen={showDataViz}
          onClose={() => setShowDataViz(false)}
        />
      )}

      {/* Onboarding Guide */}
      <OnboardingGuide 
        isOpen={showOnboarding} 
        onClose={() => setShowOnboarding(false)}
        appData={appData}
      />
    </div>
  );
};
