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
import { ChatBackground } from "../components/EnterpriseBackgrounds";

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
  const [eliteMessages, setEliteMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [eliteInput, setEliteInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [eliteLoading, setEliteLoading] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState("");
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
  const [agents, setAgents] = useState<any[]>([
    { id: 'master', name: 'Bristol Master Agent', model: 'gpt-4o', description: 'Orchestrates multi-agent coordination and final synthesis' },
    { id: 'data-processing', name: 'Data Processor', model: 'claude-3.5-sonnet', description: 'Handles demographic and employment data analysis' },
    { id: 'financial-analysis', name: 'Financial Analyst', model: 'gpt-4o', description: 'Performs DCF modeling and investment calculations' },
    { id: 'market-intelligence', name: 'Market Intelligence', model: 'claude-3.5-sonnet', description: 'Analyzes comparable properties and market trends' },
    { id: 'lead-management', name: 'Lead Manager', model: 'gpt-4-turbo', description: 'Assesses investor fit and manages lead conversion' }
  ]);
  const [activeTasks, setActiveTasks] = useState<AgentTask[]>([]);
  const [taskProgress, setTaskProgress] = useState<Record<string, any>>({});
  const [agentCommunication, setAgentCommunication] = useState<any[]>([]);
  const [multiAgentMode, setMultiAgentMode] = useState(true);

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

  // Function to analyze property with multi-agent system
  const analyzePropertyWithAgents = (property: any) => {
    console.log("Starting multi-agent property analysis for:", property);
    
    // Create analysis tasks for each agent
    const tasks = agents.map(agent => ({
      id: `task-${agent.id}-${Date.now()}`,
      type: 'property-analysis',
      agentId: agent.id,
      status: 'processing' as const,
      agent,
      result: null
    }));
    
    setActiveTasks(tasks);
    
    // Initialize progress tracking
    const initialProgress: Record<string, number> = {};
    agents.forEach(agent => {
      initialProgress[agent.id] = 0;
    });
    setTaskProgress(initialProgress);
    
    // Simulate multi-agent analysis process
    agents.forEach((agent, index) => {
      setTimeout(() => {
        const interval = setInterval(() => {
          setTaskProgress(prev => {
            const currentProgress = prev[agent.id] || 0;
            if (currentProgress >= 100) {
              clearInterval(interval);
              
              // Update task status
              setActiveTasks(prevTasks => 
                prevTasks.map(task => 
                  task.agentId === agent.id 
                    ? { ...task, status: 'completed' as const, completedAt: new Date() }
                    : task
                )
              );
              
              return prev;
            }
            
            return {
              ...prev,
              [agent.id]: Math.min(currentProgress + Math.random() * 15, 100)
            };
          });
          
          // Add agent communication
          if (Math.random() > 0.7) {
            const message = {
              from: agent.id,
              to: 'master',
              message: `Analysis update for ${property.name || property.address || 'property'}`,
              timestamp: Date.now(),
              data: { progress: taskProgress[agent.id] || 0 }
            };
            
            setAgentCommunication(prev => [...prev.slice(-9), message]);
          }
        }, 1000 + Math.random() * 2000);
      }, index * 500); // Stagger agent starts
    });
  };

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

  // Load elite models on component mount
  useEffect(() => {
    const loadEliteModels = async () => {
      try {
        const [eliteResponse, openRouterResponse, premiumResponse] = await Promise.all([
          fetch('/api/elite-chat/models'),
          fetch('/api/openrouter-models'),
          fetch('/api/openrouter-premium/models')
        ]);
        
        const allModels = [];
        
        // Load premium models first
        if (premiumResponse.ok) {
          const premiumData = await premiumResponse.json();
          allModels.push(...(premiumData.models || []));
        }
        
        // Load elite models
        if (eliteResponse.ok) {
          const eliteData = await eliteResponse.json();
          const eliteModels = eliteData.models.map((m: any) => ({
            id: m.id,
            label: `${m.name} ${m.available ? '✅' : '❌'}`,
            context: m.contextLength,
            provider: m.provider,
            tier: m.tier,
            features: m.features,
            available: m.available
          }));
          allModels.push(...eliteModels);
        }
        
        // Load OpenRouter models
        if (openRouterResponse.ok) {
          const openRouterModels = await openRouterResponse.json();
          if (Array.isArray(openRouterModels)) {
            allModels.push(...openRouterModels);
          }
        }
        
        // Deduplicate and sort models
        const unique = allModels.filter((model, index, self) => 
          index === self.findIndex(m => m.id === model.id)
        );
        
        const sorted = unique.sort((a, b) => {
          if (a.tier === 'premium' && b.tier !== 'premium') return -1;
          if (b.tier === 'premium' && a.tier !== 'premium') return 1;
          return a.provider?.localeCompare(b.provider || '') || 0;
        });
        
        setModelList(sorted);
        
        // Set default to the best available premium model
        const preferredModel = sorted.find(m => m.available && m.tier === 'premium' && m.id.includes('gpt-5')) ||
                              sorted.find(m => m.available && m.tier === 'premium' && m.id.includes('claude-sonnet-4')) ||
                              sorted.find(m => m.available && m.tier === 'premium') ||
                              sorted.find(m => m.available) ||
                              sorted[0];
        
        if (preferredModel) {
          setModel(preferredModel.id);
        }
        
        // Enhanced welcome message system - triggers after successful model loading
        setTimeout(() => {
          if (eliteMessages.length === 0 && sorted.length > 0) {
            const currentModel = sorted.find(m => m.id === preferredModel?.id) || sorted[0];
            const isPremium = currentModel?.tier === 'premium';
            
            const welcomeMessage = {
              role: "assistant" as const,
              content: `🚀 **Bristol A.I. Elite v5.0** - *Fortune 500 Intelligence Platform*

**🏢 Current Configuration:**
• **AI Engine:** ${currentModel?.label || 'Loading...'}${isPremium ? ' 💎 **PREMIUM TIER**' : ' 🔧 **STANDARD**'}
• **Provider:** ${currentModel?.provider?.toUpperCase() || 'OPENAI'}  
• **Context Window:** ${currentModel?.context ? `${(currentModel.context/1000).toFixed(0)}K tokens` : 'Standard'}
• **MCP Tools:** ${mcpEnabled ? '✅ **ENABLED**' : '❌ DISABLED'}  
• **Streaming Mode:** ${realTimeData ? '✅ **REAL-TIME**' : '❌ BATCH MODE'}

**⚡ Elite Capabilities Online:**
${isPremium ? '💎 **PREMIUM MODE ACTIVATED** - Full Enterprise Features' : '🔧 **STANDARD MODE** - Core Features'}

📊 **Financial Intelligence:**
• Advanced IRR/NPV financial modeling with DCF analysis
• Multi-scenario cash flow projections & sensitivity analysis
• Real-time market valuation & comparable analysis

🏙️ **Market Intelligence:**
• Live demographic & employment data feeds
• Property analysis & Bristol scoring algorithms
• Multi-agent deal coordination with WebSocket integration

🔗 **Data Integration:**
• Direct PostgreSQL database access for property portfolios
• Enhanced streaming responses with premium model support
• Real-time property intelligence & market opportunity detection

**🎯 System Status:** All enterprise engines online and optimized for Fortune 500 deployment.

What property development project, market analysis, or investment opportunity can I evaluate for you today?`,
              createdAt: nowISO(),
              sessionId,
              id: `welcome-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              metadata: { 
                model: currentModel?.id, 
                provider: currentModel?.provider, 
                tier: currentModel?.tier,
                welcomeMessage: true,
                capabilities: currentModel?.features || [],
                systemVersion: '5.0'
              }
            };
            setEliteMessages([welcomeMessage]);
            console.log('✅ Welcome message initialized with enhanced configuration');
          }
        }, 800);
      } catch (error) {
        console.error('Failed to load models:', error);
        setModelError('Failed to load AI models. Please refresh the page.');
      }
    };
    loadEliteModels();
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

      // Enhanced streaming chat with real-time typing - use the streaming toggle state
      const useStreaming = realTimeData; // Enable streaming based on user preference
      
      if (useStreaming) {
        // Use fetch with ReadableStream for better streaming support
        let streamingContent = "";
        const streamingMessageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Add placeholder message for streaming
        setEliteMessages(prev => [...prev, {
          role: "assistant",
          content: "",
          createdAt: nowISO(),
          sessionId,
          id: streamingMessageId,
          metadata: { model, provider: model.split('/')[0], streaming: true }
        }]);

        try {
          const response = await fetch("/api/streaming-chat/stream", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: model,
              messages: apiMessages,
              temperature: 0.7,
              maxTokens: 4000,
              systemPrompt: systemPrompt,
              mcpEnabled: mcpEnabled,
              realTimeData: realTimeData
            })
          });

          if (!response.ok) {
            throw new Error(`Streaming failed: ${response.status}`);
          }

          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error("No response body reader available");
          }

          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  
                  if (data.error) {
                    throw new Error(data.error);
                  }
                  
                  if (data.done) {
                    // Streaming complete
                    setEliteMessages(prev => 
                      prev.map(msg => 
                        msg.id === streamingMessageId 
                          ? { ...msg, metadata: { ...msg.metadata, streaming: false, completed: true } }
                          : msg
                      )
                    );
                    return;
                  }
                  
                  if (data.content) {
                    streamingContent += data.content;
                    setEliteMessages(prev => 
                      prev.map(msg => 
                        msg.id === streamingMessageId 
                          ? { ...msg, content: streamingContent }
                          : msg
                      )
                    );
                  }
                } catch (parseError) {
                  console.error('Parse error:', parseError);
                }
              }
            }
          }
        } catch (error) {
          console.error('Streaming error:', error);
          // Remove the failed streaming message
          setEliteMessages(prev => prev.filter(msg => msg.id !== streamingMessageId));
          
          // Fallback to premium OpenRouter API if available
          const modelConfig = modelList.find(m => m.id === model);
          if (modelConfig?.tier === 'premium') {
            try {
              const fallbackResponse = await fetch("/api/openrouter-premium/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  model: model,
                  messages: apiMessages,
                  temperature: 0.7,
                  maxTokens: 4000,
                  systemPrompt: systemPrompt,
                  mcpEnabled: mcpEnabled,
                  realTimeData: realTimeData
                })
              });
              
              if (fallbackResponse.ok) {
                const fallbackData = await fallbackResponse.json();
                let assistantContent = "";
                
                if (fallbackData.choices && fallbackData.choices[0]) {
                  assistantContent = fallbackData.choices[0].message?.content || "";
                } else if (fallbackData.content) {
                  assistantContent = Array.isArray(fallbackData.content) ? fallbackData.content[0].text : fallbackData.content;
                }
                
                setEliteMessages(prev => [...prev, {
                  role: "assistant",
                  content: assistantContent,
                  createdAt: nowISO(),
                  sessionId,
                  id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  metadata: { model, provider: fallbackData.provider, tier: fallbackData.tier }
                }]);
                return;
              }
            } catch (fallbackError) {
              console.error('Premium fallback failed:', fallbackError);
            }
          }
          
          // Final fallback to standard API
          await handleNonStreamingFallback();
        }

        // Don't continue to non-streaming code
        return;
      }

      // Fallback function for non-streaming
      const handleNonStreamingFallback = async () => {
        const response = await fetch("/api/elite-chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: model,
            messages: apiMessages,
            temperature: 0.7,
            maxTokens: 4000,
            systemPrompt: systemPrompt,
            mcpEnabled: mcpEnabled,
            realTimeData: realTimeData
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
      };

      // Execute fallback if not using streaming
      if (!useStreaming) {
        await handleNonStreamingFallback();
      }

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
    <ChatBackground>
      <div className="h-screen w-screen flex">
        {/* Cyberpunk Glassomorphic Panel - Full Height with Fixed Layout - EXACT REPLICA OF FLOATING WIDGET */}
        <div 
        className="w-full h-screen text-neutral-100 shadow-2xl flex flex-col chrome-metallic-panel font-cinzel"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.95) 25%, rgba(51, 65, 85, 0.92) 50%, rgba(30, 41, 59, 0.95) 75%, rgba(15, 23, 42, 0.98) 100%)',
          backdropFilter: 'blur(25px) saturate(180%)',
          border: '1px solid rgba(255, 215, 0, 0.2)',
          boxShadow: `
            0 0 40px rgba(255, 215, 0, 0.15),
            0 0 80px rgba(0, 206, 209, 0.1),
            inset 0 2px 4px rgba(255, 255, 255, 0.08),
            inset 0 -2px 4px rgba(0, 0, 0, 0.1)
          `,
        }}
      >
        {/* Premium Glass Header */}
        <div className="relative overflow-hidden">
          {/* Ambient glow effects */}
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-bristol-cyan/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -top-5 -right-10 w-32 h-32 bg-bristol-electric/8 rounded-full blur-2xl animate-pulse delay-1000" />
          
          {/* Fortune 500 Elite header background */}
          <div 
            className="absolute inset-0" 
            style={{
              background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.12) 0%, rgba(0, 206, 209, 0.08) 35%, rgba(136, 0, 32, 0.06) 70%, rgba(255, 215, 0, 0.08) 100%)',
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
                <h1 className="font-serif font-bold text-3xl bg-gradient-to-r from-bristol-gold via-white to-bristol-cyan bg-clip-text text-transparent drop-shadow-xl">
                  BRISTOL A.I. ELITE
                </h1>
                <p className="text-lg text-bristol-gold font-bold tracking-widest uppercase mt-1 drop-shadow-lg flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  Fortune 500 Intelligence Platform
                  <div className="px-2 py-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-xs font-bold text-white ml-2">
                    💎 v5.0
                  </div>
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
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Admin tab clicked");
                setActiveTab("admin");
              }}
              className={cx(
                "px-6 py-3 text-sm font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer relative z-30",
                activeTab === "admin"
                  ? "bg-bristol-cyan/20 text-bristol-cyan border-b-2 border-bristol-cyan"
                  : "text-bristol-cyan/70 hover:text-bristol-cyan hover:bg-bristol-cyan/10"
              )}
            >
              Admin
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

                      const isAvailable = (m as any).available !== false;
                      const tier = (m as any).tier || '';
                      const provider = (m as any).provider || '';
                      const tierBadge = tier === 'premium' ? ' 💎' : '';
                      const statusIcon = isAvailable ? '' : ' ❌';

                      return (
                        <option key={m.id} value={m.id} disabled={!isAvailable}>
                          {getProviderEmoji(m.id)} {m.label.replace(/✅|❌/, '')}{tierBadge}{statusIcon} {provider ? `(${provider.toUpperCase()})` : ''}
                        </option>
                      );
                    })
                  )}
                </select>
              </div>
            </div>

            {/* Streaming Toggle & WebSocket Status */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => {
                    const newStreaming = !realTimeData;
                    setRealTimeData(newStreaming);
                    localStorage.setItem("bristol.streamingEnabled", String(newStreaming));
                  }}
                  className={cx(
                    "px-2 py-1 rounded-full text-xs font-bold transition-all duration-300",
                    realTimeData
                      ? "bg-bristol-cyan/20 text-bristol-cyan border border-bristol-cyan/40"
                      : "bg-white/10 text-white/50 border border-white/20"
                  )}
                >
                  {realTimeData ? "🚀 STREAMING" : "📝 STANDARD"}
                </button>
              </div>
              
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
                        "max-w-[85%] rounded-2xl px-4 py-3 backdrop-blur-sm border relative",
                        msg.role === "user" 
                          ? "bg-bristol-cyan/20 border-bristol-cyan/40 text-bristol-cyan"
                          : "bg-white/10 border-white/20 text-white"
                      )}>
                        {/* Streaming indicator for assistant messages */}
                        {msg.role === "assistant" && (msg as any).metadata?.streaming && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-bristol-cyan rounded-full animate-pulse" />
                        )}
                        
                        <div className="text-sm whitespace-pre-wrap font-medium">
                          {msg.content || (msg.role === "assistant" && (msg as any).metadata?.streaming ? (
                            <div className="flex items-center gap-2 text-bristol-cyan/70">
                              <div className="w-1 h-1 bg-bristol-cyan rounded-full animate-pulse" />
                              <div className="w-1 h-1 bg-bristol-cyan rounded-full animate-pulse delay-150" />
                              <div className="w-1 h-1 bg-bristol-cyan rounded-full animate-pulse delay-300" />
                              <span className="ml-2 text-xs">Bristol A.I. is thinking...</span>
                            </div>
                          ) : msg.content)}
                        </div>
                        
                        <div className="flex items-center justify-between mt-2">
                          {msg.createdAt && (
                            <div className="text-xs opacity-60">
                              {new Date(msg.createdAt).toLocaleTimeString()}
                            </div>
                          )}
                          
                          {/* Model and provider badge for assistant messages */}
                          {msg.role === "assistant" && (msg as any).metadata && (
                            <div className="flex items-center gap-1">
                              {(msg as any).metadata.streaming && (
                                <span className="text-xs text-bristol-cyan bg-bristol-cyan/20 px-1.5 py-0.5 rounded-full animate-pulse">
                                  STREAMING
                                </span>
                              )}
                              {(msg as any).metadata.provider && (
                                <span className="text-xs text-white/70 bg-white/10 px-1.5 py-0.5 rounded-full">
                                  {(msg as any).metadata.provider.toUpperCase()}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
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

          {/* Data Tab Content - Complete from floating widget */}
          {activeTab === "data" && <DataPane data={appData} />}
          
          {/* Tools Tab Content - Complete from floating widget */}
          {activeTab === "tools" && <ToolsPane systemStatus={systemStatus} mcpEnabled={mcpEnabled} setMcpEnabled={setMcpEnabled} />}

          {/* Agents Tab Content - Complete from floating widget */}
          {activeTab === "agents" && <AgentsPane 
            agents={agents}
            activeTasks={activeTasks}
            taskProgress={taskProgress}
            agentCommunication={agentCommunication}
            multiAgentMode={multiAgentMode}
            onAnalyzeProperty={analyzePropertyWithAgents}
            wsConnected={wsConnected}
          />}

          {/* Admin Tab Content - Complete from floating widget */}
          {activeTab === "admin" && <AdminPane 
            systemPrompt={systemPrompt} 
            setSystemPrompt={setSystemPrompt}
            onSave={async () => {
              try {
                localStorage.setItem("bristol.systemPrompt", systemPrompt);
                console.log("System prompt saved successfully");
              } catch (error) {
                console.error("Failed to save system prompt:", error);
              }
            }}
            realTimeData={realTimeData}
            setRealTimeData={setRealTimeData}
          />}


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
      </div>
    </ChatBackground>
  );
};

// Mirror all component functions from BristolFloatingWidget.tsx

function DataPane({ data }: { data: any }) {
  const [selectedTool, setSelectedTool] = useState<string>("overview");
  const [toolResults, setToolResults] = useState<any>({});
  const [loadingTool, setLoadingTool] = useState<string>("");

  // Real-time data tools with actual API endpoints
  const dataTools = {
    overview: {
      name: "Portfolio Overview",
      icon: <Building2 className="h-4 w-4" />,
      endpoint: "/api/analytics/overview",
      description: "Complete portfolio analytics and metrics"
    },
    demographics: {
      name: "Demographics API", 
      icon: <Users className="h-4 w-4" />,
      endpoint: "/api/address-demographics",
      description: "Real-time census and demographic data"
    },
    employment: {
      name: "BLS Employment",
      icon: <TrendingUp className="h-4 w-4" />,
      endpoint: "/api/tools/bls-employment", 
      description: "Bureau of Labor Statistics employment data"
    },
    housing: {
      name: "HUD Housing Data",
      icon: <Building2 className="h-4 w-4" />,
      endpoint: "/api/tools/hud-housing",
      description: "HUD fair market rents and housing data"
    }
  };

  const executeTool = async (toolKey: string) => {
    const tool = dataTools[toolKey as keyof typeof dataTools];
    if (!tool) return;

    setLoadingTool(toolKey);
    try {
      const response = await fetch(tool.endpoint);
      const result = await response.json();
      setToolResults((prev: any) => ({ ...prev, [toolKey]: result }));
    } catch (error) {
      console.error(`Error executing ${tool.name}:`, error);
      setToolResults((prev: any) => ({ 
        ...prev, 
        [toolKey]: { error: `Failed to fetch ${tool.name} data` }
      }));
    } finally {
      setLoadingTool("");
    }
  };

  const currentResult = toolResults[selectedTool];

  return (
    <div className="flex-1 p-6">
      <div className="space-y-6">
        {/* MCP Server Status */}
        <div className="bg-bristol-cyan/10 border border-bristol-cyan/30 rounded-2xl p-4">
          <h4 className="text-bristol-cyan font-semibold mb-3 flex items-center gap-2">
            <Cpu className="h-4 w-4 animate-pulse" />
            MCP Server Integration
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-bristol-cyan">PostgreSQL Server</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-bristol-cyan">Web Search</span>
            </div>
          </div>
        </div>

        {/* Data Tool Grid */}
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(dataTools).map(([key, tool]) => (
            <button
              key={key}
              onClick={() => {
                setSelectedTool(key);
                if (!toolResults[key]) {
                  executeTool(key);
                }
              }}
              className={`p-3 rounded-xl border transition-all duration-300 text-left ${
                selectedTool === key
                  ? 'bg-bristol-cyan/20 border-bristol-cyan/50 text-bristol-cyan'
                  : 'bg-black/40 border-gray-700 text-white hover:border-bristol-cyan/30 hover:bg-bristol-cyan/10'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {tool.icon}
                <span className="text-sm font-semibold">{tool.name}</span>
                {loadingTool === key && (
                  <div className="w-3 h-3 border border-bristol-cyan/40 border-t-bristol-cyan rounded-full animate-spin"></div>
                )}
              </div>
              <p className="text-xs opacity-80">{tool.description}</p>
            </button>
          ))}
        </div>

        {/* Tool Results Display - Enhanced */}
        <div className="bg-black/40 border border-bristol-cyan/30 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-bristol-cyan font-semibold flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              {dataTools[selectedTool as keyof typeof dataTools]?.name || "Select Tool"}
            </h4>
            <div className="flex items-center gap-2">
              <button
                onClick={() => executeTool(selectedTool)}
                disabled={loadingTool === selectedTool}
                className="px-3 py-1 bg-bristol-cyan/20 hover:bg-bristol-cyan/30 text-bristol-cyan rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
              >
                {loadingTool === selectedTool ? 'RUNNING...' : 'EXECUTE'}
              </button>
              {currentResult && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(currentResult, null, 2));
                  }}
                  className="px-3 py-1 bg-bristol-gold/20 hover:bg-bristol-gold/30 text-bristol-gold rounded-lg text-xs font-medium transition-colors"
                >
                  COPY JSON
                </button>
              )}
            </div>
          </div>
          
          <div className="min-h-[200px] max-h-[400px] overflow-auto">
            {loadingTool === selectedTool ? (
              <div className="flex items-center justify-center h-40">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-bristol-cyan/30 border-t-bristol-cyan rounded-full animate-spin"></div>
                  <span className="text-bristol-cyan font-medium">Fetching {dataTools[selectedTool as keyof typeof dataTools]?.name}...</span>
                </div>
              </div>
            ) : currentResult ? (
              <div className="space-y-3">
                {currentResult.error ? (
                  <div className="bg-red-400/10 border border-red-400/30 rounded-lg p-3">
                    <div className="text-red-400 font-medium text-sm mb-1">Error</div>
                    <div className="text-red-300 text-xs">{currentResult.error}</div>
                  </div>
                ) : (
                  <>
                    {/* Success metrics summary */}
                    {currentResult.totalSites !== undefined && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div className="bg-bristol-cyan/10 border border-bristol-cyan/20 rounded-lg p-2">
                          <div className="text-bristol-cyan font-bold text-lg">{currentResult.totalSites}</div>
                          <div className="text-bristol-cyan/80 text-xs">Total Sites</div>
                        </div>
                        <div className="bg-bristol-gold/10 border border-bristol-gold/20 rounded-lg p-2">
                          <div className="text-bristol-gold font-bold text-lg">{currentResult.totalUnits}</div>
                          <div className="text-bristol-gold/80 text-xs">Total Units</div>
                        </div>
                        <div className="bg-green-400/10 border border-green-400/20 rounded-lg p-2">
                          <div className="text-green-400 font-bold text-lg">${(currentResult.totalValue / 1000000).toFixed(1)}M</div>
                          <div className="text-green-400/80 text-xs">Portfolio Value</div>
                        </div>
                        <div className="bg-purple-400/10 border border-purple-400/20 rounded-lg p-2">
                          <div className="text-purple-400 font-bold text-lg">{currentResult.avgBristolScore?.toFixed(1) || 'N/A'}</div>
                          <div className="text-purple-400/80 text-xs">Avg Score</div>
                        </div>
                      </div>
                    )}
                    
                    {/* Raw JSON data in collapsed view */}
                    <details className="bg-black/60 border border-white/10 rounded-lg">
                      <summary className="cursor-pointer p-3 text-white/80 hover:text-white transition-colors text-sm font-medium">
                        Raw Data ({Object.keys(currentResult).length} fields)
                      </summary>
                      <div className="p-3 pt-0">
                        <pre className="text-xs text-white/70 whitespace-pre-wrap overflow-x-auto">
                          {JSON.stringify(currentResult, null, 2)}
                        </pre>
                      </div>
                    </details>
                  </>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-white/50">
                <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Select and execute a tool to view results</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Real-time Data Feeds */}
        <div className="bg-bristol-maroon/10 border border-bristol-gold/30 rounded-2xl p-4">
          <h4 className="text-bristol-gold font-semibold mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 animate-pulse" />
            Live Market Data
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-black/40 border border-bristol-cyan/30 rounded-lg p-3">
              <div className="text-bristol-cyan text-sm font-medium">Market Status</div>
              <div className="text-xs text-bristol-cyan/70 mt-1">Real-time feeds active</div>
            </div>
            <div className="bg-black/40 border border-bristol-gold/30 rounded-lg p-3">
              <div className="text-bristol-gold text-sm font-medium">API Health</div>
              <div className="text-xs text-bristol-gold/70 mt-1">All systems operational</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolsPane({ systemStatus, mcpEnabled, setMcpEnabled }: { 
  systemStatus: any; 
  mcpEnabled: boolean; 
  setMcpEnabled: (enabled: boolean) => void; 
}) {
  return (
    <div className="flex-1 p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h4 className="text-bristol-gold font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4" />
            MCP BOSS AGENT TOOLS
          </h4>
          <div className="flex items-center gap-2">
            <span className="text-xs text-bristol-cyan">Enable MCP</span>
            <button
              onClick={() => setMcpEnabled(!mcpEnabled)}
              className={`
                w-16 h-8 rounded-full transition-all duration-500 relative border-2 shadow-xl transform hover:scale-105
                ${mcpEnabled 
                  ? 'bg-gradient-to-r from-green-600 via-green-500 to-green-400 border-green-300 shadow-green-500/60' 
                  : 'bg-gradient-to-r from-red-700 via-red-600 to-red-500 border-red-400 shadow-red-500/40'
                }
              `}
            >
              <div className={`
                w-6 h-6 rounded-full absolute top-0.5 transition-all duration-500 border-2 border-white/50 shadow-lg
                ${mcpEnabled 
                  ? 'left-8 bg-gradient-to-br from-white via-green-50 to-green-100 transform scale-110' 
                  : 'left-0.5 bg-gradient-to-br from-white via-red-50 to-red-100'
                }
              `} 
              />
            </button>
          </div>
        </div>
        
        <div className="bg-bristol-cyan/10 border border-bristol-cyan/30 rounded-2xl p-4">
          <h5 className="text-bristol-cyan font-semibold mb-3 text-sm">Core MCP Tools</h5>
          <div className="grid gap-2">
            <div className="bg-black/40 border border-gray-700 rounded-lg p-3">
              <div className="text-white font-medium text-sm">PostgreSQL Database</div>
              <div className="text-xs text-gray-400">Full database access and query capabilities</div>
            </div>
            <div className="bg-black/40 border border-gray-700 rounded-lg p-3">
              <div className="text-white font-medium text-sm">Web Search & Analysis</div>
              <div className="text-xs text-gray-400">Real-time web search and content analysis</div>
            </div>
            <div className="bg-black/40 border border-gray-700 rounded-lg p-3">
              <div className="text-white font-medium text-sm">File System Access</div>
              <div className="text-xs text-gray-400">Read, write, and manage project files</div>
            </div>
            <div className="bg-black/40 border border-gray-700 rounded-lg p-3">
              <div className="text-white font-medium text-sm">Memory & Context</div>
              <div className="text-xs text-gray-400">Persistent memory and context management</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentsPane({ 
  agents, 
  activeTasks, 
  taskProgress, 
  agentCommunication, 
  multiAgentMode, 
  onAnalyzeProperty,
  wsConnected 
}: { 
  agents: any[];
  activeTasks: any[];
  taskProgress: any;
  agentCommunication: any[];
  multiAgentMode: boolean;
  onAnalyzeProperty: (property: any) => void;
  wsConnected: boolean;
}) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Multi-Agent System Header */}
        <div className="bg-bristol-maroon/10 border border-bristol-gold/30 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-bristol-gold/20 border border-bristol-gold/40 rounded-lg flex items-center justify-center">
                <Brain className="h-5 w-5 text-bristol-gold" />
              </div>
              <div>
                <h4 className="text-bristol-gold font-bold text-xl tracking-wide">BRISTOL AI AGENTS</h4>
                <p className="text-bristol-gold/70 text-sm">5-Agent Intelligence System • Parallel Processing</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
                wsConnected 
                  ? 'bg-green-400/10 border-green-400/30 text-green-400'
                  : 'bg-red-400/10 border-red-400/30 text-red-400'
              }`}>
                <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                <span className="text-xs font-medium">{wsConnected ? 'CONNECTED' : 'DISCONNECTED'}</span>
              </div>
            </div>
          </div>

          {/* System Status Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-bristol-cyan/10 border border-bristol-cyan/20 rounded-lg p-3">
              <div className="text-lg font-bold text-bristol-cyan">{agents.length}</div>
              <div className="text-xs text-bristol-cyan/80">Active Agents</div>
            </div>
            <div className="bg-bristol-gold/10 border border-bristol-gold/20 rounded-lg p-3">
              <div className="text-lg font-bold text-bristol-gold">{activeTasks.length}</div>
              <div className="text-xs text-bristol-gold/80">Running Tasks</div>
            </div>
            <div className="bg-green-400/10 border border-green-400/20 rounded-lg p-3">
              <div className="text-lg font-bold text-green-400">{agentCommunication.length}</div>
              <div className="text-xs text-green-400/80">Messages</div>
            </div>
            <div className="bg-purple-400/10 border border-purple-400/20 rounded-lg p-3">
              <div className="text-lg font-bold text-purple-400">10x</div>
              <div className="text-xs text-purple-400/80">Speed Boost</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminPane({ 
  systemPrompt, 
  setSystemPrompt, 
  onSave, 
  realTimeData, 
  setRealTimeData 
}: { 
  systemPrompt: string;
  setSystemPrompt: (prompt: string) => void;
  onSave: () => void;
  realTimeData: boolean;
  setRealTimeData: (enabled: boolean) => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="bg-bristol-maroon/10 border border-bristol-maroon/30 rounded-2xl p-6">
        <h4 className="text-bristol-maroon font-bold text-xl mb-4">System Administration</h4>
        
        <div className="space-y-4">
          <div>
            <label className="block text-bristol-cyan text-sm font-semibold mb-2">
              System Prompt Configuration
            </label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full h-40 bg-black/40 border border-bristol-cyan/30 rounded-lg p-3 text-white resize-none"
              placeholder="Enter system prompt..."
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={realTimeData}
                onChange={(e) => setRealTimeData(e.target.checked)}
                className="rounded"
              />
              <span className="text-bristol-cyan text-sm">Enable Real-time Data</span>
            </div>
            <button
              onClick={onSave}
              className="px-4 py-2 bg-bristol-cyan/20 hover:bg-bristol-cyan/30 text-bristol-cyan rounded-lg text-sm font-medium transition-colors"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </ChatBackground>
  );
};
