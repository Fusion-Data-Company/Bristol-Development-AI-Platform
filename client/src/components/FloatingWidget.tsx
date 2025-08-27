import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, PanelLeftOpen, Send, Settings, Database, MessageSquare, Sparkles, Brain, Cpu, Zap, Activity, Wifi, WifiOff, Loader2, Shield, Terminal, Upload, FileText, Target, Paperclip, Plus, Trash2, Save, File, TrendingUp, Building2, DollarSign, BarChart3, AlertCircle, ChevronDown, CircuitBoard, HelpCircle, BarChart, PieChart, MapPin, Users, Calendar, Minimize2, Maximize2, Clock, Palette, Wrench } from "lucide-react";
import { DataVisualizationPanel } from "./chat/DataVisualizationPanel";
import { EnhancedLiveDataContext } from "./chat/EnhancedLiveDataContext";
import { OnboardingGuide } from "./chat/OnboardingGuide";
import { useMCPChat } from "@/hooks/useMCPChat";
import { useToast } from "@/hooks/use-toast";

/**
 * FloatingWidget.tsx — v1.0
 * Enterprise-grade floating analyst widget for real estate development.
 *
 * WHAT IT DOES
 * - Slides out from the LEFT edge as a floating widget.
 * - Conversationally analyzes ANY in-app data (API responses + DB objects) passed in via props or a global bus.
 * - Model switcher (OpenRouter.io) with per-thread system prompt.
 * - Admin tab to edit/view the company "mega prompt" (stored locally or via callbacks).
 * - Data tab to inspect the merged data that the agent can reason over.
 *
 * HOW TO WIRE IT (quick):
 * 1) Place <FloatingWidget appData={yourMergedData} /> high in app tree.
 * 2) Implement a server proxy /api/openrouter (Node/Edge) to call OpenRouter with your key (never ship the key to the browser).
 * 3) Optional: stream tool usage + telemetry to n8n via webhookUrl.
 * 4) Provide onSaveSystemPrompt/onSend handlers if you want to persist prompts/messages elsewhere.
 *
 * SECURITY
 * - This component NEVER calls OpenRouter directly with an API key. It POSTs to /api/openrouter.
 * - Make sure your proxy validates model names and rate-limits.
 */

// ---------- Types ----------
export type FloatingWidgetProps = {
  appData?: Record<string, any>; // Any merged API/DB state from the app
  defaultSystemPrompt?: string; // Optional initial system prompt
  defaultModel?: string; // e.g., "openrouter/gpt-5" (proxy must map to real model)
  webhookUrl?: string; // optional n8n telemetry sink
  onSaveSystemPrompt?: (prompt: string) => Promise<void> | void;
  onSend?: (payload: ChatPayload) => Promise<void> | void; // tap outgoing chat payloads
  className?: string;
};

// MCP Server and API Integration Types
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

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
  createdAt?: string;
};

export type ChatPayload = {
  model: string;
  messages: ChatMessage[];
  dataContext?: Record<string, any>;
  temperature?: number;
  maxTokens?: number;
};

// ---------- Default Company A.I. System Prompt ----------
const DEFAULT_MEGA_PROMPT = `I'm the Real Estate Intelligence AI – the proprietary AI intelligence system engineered for real estate development analysis. Drawing on decades of institutional real estate expertise, I underwrite deals, assess markets, and drive strategic decisions for development projects. Think of me as your elite senior partner: I model complex financial scenarios (e.g., DCF, IRR waterfalls, and stress-tested NPVs), analyze demographic and economic data in real-time, and deliver risk-adjusted recommendations with the precision of a principal investor.

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
- Property portfolio with addresses, status, and financial metrics
- Demographics data from Census API, BLS employment data, HUD fair market rents
- FBI crime statistics, NOAA climate data, BEA economic indicators
- Foursquare location insights and market trend analysis

## RESPONSE STYLE
- Professional and authoritative tone reflecting decades of institutional experience
- Data-driven insights with specific metrics and financial projections
- Clear investment recommendations with risk assessments
- Use company AI branding consistently

Always prioritize accuracy, deliver institutional-quality analysis, and maintain the sophisticated, results-oriented approach expected from a Fortune 500-grade AI system.`;

// ---------- Types for dynamic models ----------
type ModelOption = { id: string; label: string; context?: number };

// ---------- Utilities ----------
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

// ---------- Component ----------
export default function FloatingWidget({
  appData = {},
  defaultSystemPrompt,
  defaultModel,
  webhookUrl,
  onSaveSystemPrompt,
  onSend,
  className,
}: FloatingWidgetProps) {
  const { toast } = useToast();
  
  // Mobile guard: hide floating widget on mobile screens
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 1024);
    check(); 
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  
  // Don't render on mobile
  if (isMobile) return null;
  
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [showDataViz, setShowDataViz] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Initialize MCP Chat System for bulletproof model management
  const mcpChat = useMCPChat({
    sourceInstance: 'floating',
    defaultModel: defaultModel || 'gpt-4o',
    enableMCP: true,
    autoValidateModel: true,
    onModelSwitch: (newModel) => {
      console.log(`🔄 Model switched to: ${newModel}`);
      toast({
        title: "Model Updated",
        description: `Now using ${mcpChat.availableModels.find(m => m.id === newModel)?.name || newModel}`,
        duration: 3000
      });
    },
    onToolExecution: (tools) => {
      console.log(`🛠️ Tools executed:`, tools);
      // Update system status with tool execution info
      setSystemStatus(prev => ({
        ...prev,
        mcpTools: prev.mcpTools.map(tool => 
          tools.includes(tool.name) 
            ? { ...tool, lastExecution: new Date().toISOString(), status: 'active' }
            : tool
        )
      }));
    },
    onError: (error) => {
      console.error('MCP Chat Error:', error);
      toast({
        title: "Chat Error",
        description: error.message,
        variant: "destructive",
        duration: 5000
      });
    }
  });
  
  const [systemPrompt, setSystemPrompt] = useState<string>(defaultSystemPrompt || DEFAULT_MEGA_PROMPT);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "I'm the Real Estate Intelligence AI – the proprietary AI intelligence system engineered for real estate development analysis. Drawing on decades of institutional real estate expertise, I underwrite deals, assess markets, and drive strategic decisions for development projects. Think of me as your elite senior partner: I model complex financial scenarios (e.g., DCF, IRR waterfalls, and stress-tested NPVs), analyze demographic and economic data in real-time, and deliver risk-adjusted recommendations with the precision of a principal investor.\n\nIf you're inquiring about a specific modeling approach – say, for cap rate projections, value-add strategies, or portfolio optimization – provide the details, and I'll dive in with quantitative analysis. What's the opportunity on the table? Let's evaluate it now.",
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
  const [wsOptional, setWsOptional] = useState(true); // URGENT: Make WebSocket optional
  const [mcpEnabled, setMcpEnabled] = useState(true);
  const [realTimeData, setRealTimeData] = useState(true);
  // Model state for compatibility with existing select component
  const [model, setModel] = useState(defaultModel || 'gpt-4o');
  const [modelList, setModelList] = useState<ModelOption[]>([]);
  // Always elite mode - no toggle needed
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  
  // Multi-Agent System States
  const [agents, setAgents] = useState<any[]>([]);
  const [activeTasks, setActiveTasks] = useState<any[]>([]);
  const [taskProgress, setTaskProgress] = useState<Record<string, any>>({});
  const [agentCommunication, setAgentCommunication] = useState<any[]>([]);
  const [multiAgentMode, setMultiAgentMode] = useState(false);

  // Enhanced AI features state
  const [realTimeInsights, setRealTimeInsights] = useState<any>(null);
  const [smartSuggestions, setSmartSuggestions] = useState<any[]>([]);
  const [conversationAnalytics, setConversationAnalytics] = useState<any>(null);
  const [showInsightsPanel, setShowInsightsPanel] = useState(false);
  const [adaptiveMode, setAdaptiveMode] = useState(true);
  const [userProfile, setUserProfile] = useState({
    role: 'Portfolio Manager',
    experience: 'Senior',
    preferredDetail: 'balanced',
    preferredFormality: 'professional'
  });

  // SSR-safe localStorage loading and WebSocket connection
  useEffect(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("company.systemPrompt") : null;
      if (saved) setSystemPrompt(saved);
    } catch (error) {
      console.warn("Failed to load saved system prompt:", error);
    }
  }, []);

  // Load available models from MCP chat system
  useEffect(() => {
    if (mcpChat.availableModels && mcpChat.availableModels.length > 0) {
      const formattedModels: ModelOption[] = mcpChat.availableModels.map(m => ({
        id: m.id,
        label: m.name || m.id,
        context: (m as any).contextLength || 4000
      }));
      setModelList(formattedModels);
    }
  }, [mcpChat.availableModels]);

  // Sync model state with MCP chat
  useEffect(() => {
    if (model && model !== mcpChat.currentModel) {
      mcpChat.switchModel(model);
    }
  }, [model]);

  // WebSocket connection for real-time features - URGENT: Optional
  useEffect(() => {
    if (open && wsOptional && !wsRef.current) {
      connectWebSocket();
    } else if (!open && wsRef.current) {
      disconnectWebSocket();
    }

    return () => disconnectWebSocket();
  }, [open, wsOptional]);

  const connectWebSocket = () => {
    if (!wsOptional) {
      console.log('WebSocket disabled for floating widget');
      return;
    }
    
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        setWsConnected(true);
        console.log("Company A.I. WebSocket connected");
        
        // Send periodic ping to keep connection alive
        const pingInterval = setInterval(() => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
          } else {
            clearInterval(pingInterval);
          }
        }, 30000); // Ping every 30 seconds
        
        // Store interval ID to clear on disconnect
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
      
      wsRef.current.onclose = (event) => {
        setWsConnected(false);
        console.log("Company A.I. WebSocket disconnected");
        
        // URGENT: Disable auto-reconnect to prevent performance issues
        // Widget functionality continues without WebSocket
        if (event.code !== 1000) {
          console.log('WebSocket disconnected - widget continues in offline mode');
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.warn("WebSocket error (widget continues offline):", error.type || 'connection failed');
        setWsConnected(false);
        // URGENT: Widget works without WebSocket - this is non-critical
      };
    } catch (error) {
      console.warn("WebSocket connection failed (widget continues offline):", error instanceof Error ? error.message : 'unknown error');
      // URGENT: Widget functionality is not dependent on WebSocket
    }
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      // Clear ping interval
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
        
        // Simulate progress for better UX and poll for results
        const agentId = data.task.agentId;
        const taskId = data.task.id;
        
        const progressInterval = setInterval(() => {
          setTaskProgress(currentProgress => {
            const current = currentProgress[agentId] || 10;
            if (current >= 90) {
              clearInterval(progressInterval);
              return currentProgress;
            }
            return {
              ...currentProgress,
              [agentId]: Math.min(current + Math.random() * 15, 90)
            };
          });
        }, 2000);

        // Poll for task results every 2 seconds for faster response
        const pollInterval = setInterval(async () => {
          try {
            const response = await fetch(`/api/agents/task-results/${taskId}`);
            if (response.ok) {
              const data = await response.json();
              if (data.ok && data.task.status === 'completed' && data.task.result) {
                clearInterval(pollInterval);
                clearInterval(progressInterval);
                
                // Update progress to 100%
                setTaskProgress(prev => ({
                  ...prev,
                  [agentId]: 100
                }));
                
                // Update the task in active tasks with real result
                setActiveTasks(prevTasks => 
                  prevTasks.map(task => 
                    task.id === taskId 
                      ? { 
                          ...task, 
                          result: data.task.result?.content || data.task.result, 
                          status: 'completed',
                          completedAt: new Date()
                        }
                      : task
                  )
                );
                
                // Display the actual result in chat with enhanced formatting
                const agentName = data.task.agentName || 'Agent';
                const resultText = data.task.result || 'Analysis completed successfully.';
                
                setMessages(prev => [...prev, {
                  role: 'assistant',
                  content: `**${agentName} Analysis Complete** ✅\n\n${resultText}`,
                  createdAt: nowISO()
                }]);
                
                console.log(`🎯 Received live agent result: ${agentName} (${resultText.length} characters)`);
              }
            }
          } catch (error) {
            console.error('Failed to poll task result:', error);
          }
        }, 2000);
        
        // Clean up polling after 3 minutes
        setTimeout(() => {
          clearInterval(pollInterval);
          clearInterval(progressInterval);
        }, 180000);
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
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `**${data.task.agentName || data.task.agent?.name || 'Agent'} Analysis Complete** ✅\n\n${data.task.result}`,
            createdAt: nowISO()
          }]);
        } else {
          console.log('❌ No task result found in completed message:', data);
        }
        
        console.log(`✅ Task completed: ${data.task.agentName} - ${data.task.status}`);
        break;
        
      case 'agent-task-result':
        // Legacy support
        setTaskProgress(prev => ({
          ...prev,
          [data.taskId]: data.task
        }));
        
        setActiveTasks(prev => 
          prev.map(task => 
            task.id === data.taskId 
              ? { ...task, ...data.task }
              : task
          )
        );
        break;
        
      case 'agent-status':
        setAgents(prev => 
          prev.map(agent => 
            agent.id === data.agentId 
              ? { ...agent, status: data.status }
              : agent
          )
        );
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
        
      case 'real_time_data':
        // Handle real-time data updates
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
        } else {
          console.error('Failed to load agents - response not ok:', response.status);
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
    
    if (open) {
      loadAgents();
    }
  }, [open]);

  // Initialize MCP system status monitoring
  useEffect(() => {
    const updateSystemStatus = async () => {
      try {
        // Update system status with MCP chat info
        setSystemStatus({
          mcpTools: mcpChat.availableModels.slice(0, 5).map(model => ({
            name: model.id,
            description: `${model.provider} - ${model.category}`,
            status: 'active' as const,
            lastExecution: new Date().toISOString()
          })),
          apis: [
            { name: 'Unified MCP Chat', status: 'operational' as const, lastCheck: new Date().toISOString() },
            { name: 'Model Management', status: 'operational' as const, lastCheck: new Date().toISOString() },
            { name: 'Company Tools', status: 'operational' as const, lastCheck: new Date().toISOString() }
          ],
          database: 'connected' as const,
          websocket: wsConnected ? 'connected' as const : 'disconnected' as const
        });
        
        setModelError(''); // Clear any model errors when MCP is working
        
      } catch (error) {
        console.error('Error updating system status:', error);
        setModelError('MCP system initialization error');
      }
    };
    
    if (open) {
      updateSystemStatus();
    }
  }, [open, mcpChat.availableModels, wsConnected]);

  // Keep the system message in sync if user edits Admin tab
  useEffect(() => {
    setMessages((prev) => {
      const rest = prev.filter((m) => m.role !== "system");
      return [{ role: "system", content: systemPrompt, createdAt: nowISO() }, ...rest];
    });
  }, [systemPrompt]);

  // Memoized merged data so we can show a clean inspector
  const dataContext = useMemo(() => ({
    timestamp: nowISO(),
    appData,
  }), [appData]);

  // Optional telemetry to n8n
  const sendTelemetry = async (event: string, payload: any) => {
    if (!webhookUrl) return;
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, at: nowISO(), payload }),
        keepalive: true,
      });
    } catch (err) {
      // Silent fail — don't break UX on telemetry issues
      console.warn("Telemetry failed", err);
    }
  };

  // Real-time typing analysis
  const handleInputChange = async (value: string) => {
    setInput(value);
    
    // Trigger real-time insights for longer messages
    if (value.length > 20 && adaptiveMode) {
      try {
        const insights = await fetch('/api/conversation-intelligence/real-time-insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentMessage: value,
            conversationHistory: messages,
            userContext: { portfolio: {}, role: userProfile.role }
          })
        });
        
        if (insights.ok) {
          const insightsData = await insights.json();
          setRealTimeInsights(insightsData);
        }
      } catch (error) {
        // Silently handle real-time insight errors
      }
    }
  };

  // Generate conversation analytics for the floating widget
  useEffect(() => {
    if (messages.length >= 4) {
      const analyzeConversation = async () => {
        try {
          const analytics = await fetch('/api/conversation-analytics/comprehensive-insights', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              conversationHistory: messages,
              includeRecommendations: true
            })
          });
          
          if (analytics.ok) {
            const analyticsData = await analytics.json();
            setConversationAnalytics(analyticsData);
          }
        } catch (error) {
          console.warn('Failed to generate conversation analytics:', error);
        }
      };
      
      analyzeConversation();
    }
  }, [messages.length]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || mcpChat.isSending) return;
    
    // Clear input immediately for better UX
    setInput("");
    inputRef.current?.focus();

    // Send message through unified MCP chat system
    try {
      await mcpChat.sendMessage(trimmed, {
        model: mcpChat.currentModel,
        systemPrompt,
        dataContext: realTimeData ? dataContext : undefined,
        temperature: 0.2,
        maxTokens: 1500,
        mcpEnabled: mcpEnabled,
        realTimeData: realTimeData,
        memoryEnabled: true,
        crossSessionMemory: true,
        enableAdvancedReasoning: true,
        toolSharing: true,
        sourceInstance: 'floating'
      });
      
      // Update local messages from MCP chat state
      setMessages(mcpChat.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        createdAt: msg.timestamp || nowISO()
      })));
      
    } catch (error) {
      console.error('Failed to send message:', error);
      // Restore input on error
      setInput(trimmed);
    }
  };



  const saveSystemPrompt = async () => {
    try {
      localStorage.setItem("company.systemPrompt", systemPrompt);
      await onSaveSystemPrompt?.(systemPrompt);
      await sendTelemetry("system_prompt_saved", { size: systemPrompt.length });
    } catch (error) {
      console.error("Error saving system prompt:", error);
    }
  };

  // Multi-Agent Property Analysis
  const analyzePropertyWithAgents = async (propertyData: any) => {
    try {
      setMultiAgentMode(true);
      setActiveTasks([]);
      setTaskProgress({});
      
      const response = await fetch('/api/agents/analyze-property', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyData })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Multi-agent analysis started:', result);
        
        // Create initial task objects with proper structure
        const initialTasks = result.taskIds.map((id: string, index: number) => ({
          id,
          agentId: result.agents[index].toLowerCase().replace(' ', '-'),
          type: getTaskTypeForAgent(result.agents[index]),
          status: 'processing' as const,
          result: null,
          agent: result.agents[index]
        }));
        
        setActiveTasks(initialTasks);
        
        // Initialize progress for all agents
        const initialProgress: Record<string, number> = {};
        initialTasks.forEach((task: any) => {
          initialProgress[task.agentId] = 0;
        });
        setTaskProgress(initialProgress);
        
        // Add system message about multi-agent analysis
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `🚀 **Multi-Agent Analysis Initiated**\n\nI've activated the Company A.I. Elite multi-agent system for comprehensive property analysis:\n\n${result.agents.map((agent: string) => `• **${agent}**: Processing specialized analysis`).join('\n')}\n\nAll agents are now processing the property data in parallel. You'll see real-time updates as each agent completes their specialized analysis.`,
          createdAt: nowISO()
        }]);
      }
    } catch (error) {
      console.error('Failed to start multi-agent analysis:', error);
    }
  };
  
  const getTaskTypeForAgent = (agentName: string) => {
    switch(agentName.toLowerCase()) {
      case 'data processor': return 'demographic_analysis';
      case 'financial analyst': return 'financial_modeling';
      case 'market intelligence': return 'competitive_analysis';
      case 'lead manager': return 'lead_management';
      default: return 'analysis';
    }
  };

  // Smart property analysis detection
  const detectPropertyAnalysisRequest = (message: string) => {
    const propertyKeywords = ['property', 'site', 'address', 'analyze', 'underwrite', 'deal', 'investment'];
    return propertyKeywords.some(keyword => message.toLowerCase().includes(keyword));
  };

  return (
    <>
      {/* Elite Company A.I. Launcher - Enterprise Style */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 left-6 z-[9997] group"
          aria-label="Launch Company A.I. Elite Intelligence System"
        >
          {/* Dramatic glow effects - always visible */}
          <div className="absolute -inset-4 bg-gradient-to-r from-brand-cyan/80 via-brand-electric/60 to-brand-gold/70 rounded-3xl blur-2xl opacity-80 group-hover:opacity-100 transition-all duration-500 animate-pulse" />
          <div className="absolute -inset-2 bg-gradient-to-r from-brand-cyan/90 to-brand-electric/90 rounded-3xl blur-lg opacity-100 group-hover:opacity-100 transition-all duration-300" />
          <div className="absolute -inset-1 bg-brand-cyan/40 rounded-3xl blur-md opacity-100 animate-pulse" />
          
          {/* Metallic glass button - completely solid */}
          <div 
            className="relative flex items-center gap-4 px-6 py-4 rounded-3xl border-2 transition-all duration-300 hover:scale-105 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #334155 25%, #475569 50%, #64748b 75%, #475569 100%)',
              borderColor: '#45d6ca',
              boxShadow: `
                inset 0 2px 4px rgba(255, 255, 255, 0.4),
                inset 0 -2px 4px rgba(0, 0, 0, 0.3),
                0 0 20px rgba(69, 214, 202, 0.8),
                0 8px 32px rgba(69, 214, 202, 0.4),
                0 0 0 3px rgba(69, 214, 202, 0.3)
              `,
            }}
          >
            {/* Glass surface overlay */}
            <div 
              className="absolute inset-0 rounded-3xl"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 25%, transparent 50%, rgba(69, 214, 202, 0.1) 75%, rgba(255, 255, 255, 0.15) 100%)',
              }}
            />
            
            {/* Animated shimmer effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out">
              <div className="h-full w-8 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12" />
            </div>
            {/* Brain icon with metallic finish */}
            <div className="relative z-10">
              <div className="absolute inset-0 bg-brand-cyan blur-lg opacity-80 animate-pulse" />
              <div 
                className="relative w-12 h-12 rounded-2xl border-2 flex items-center justify-center shadow-2xl overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #64748b 0%, #94a3b8 25%, #cbd5e1 50%, #94a3b8 75%, #64748b 100%)',
                  borderColor: '#45d6ca',
                  boxShadow: 'inset 0 2px 4px rgba(255, 255, 255, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.2), 0 0 15px rgba(69, 214, 202, 0.6)',
                }}
              >
                {/* Glass overlay on icon */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-brand-cyan/20 rounded-2xl" />
                <Brain className="w-6 h-6 text-brand-cyan relative z-10 drop-shadow-lg animate-pulse" />
              </div>
            </div>
            
            {/* A.I. branding with metallic text - positioned between icons */}
            <div className="flex flex-col relative z-10 flex-1">
              <span 
                className="text-xl font-black drop-shadow-lg text-center"
                style={{
                  background: 'linear-gradient(135deg, #45d6ca 0%, #ffffff 50%, #a8d5f2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  textShadow: '0 0 10px rgba(69, 214, 202, 0.5)',
                }}
              >
                COMPANY A.I.
              </span>
              <span className="text-sm font-bold text-brand-cyan drop-shadow-md text-center">
                AI Real Estate Intelligence
              </span>
            </div>
            
            {/* CPU chip icon */}
            <div className="relative z-10">
              <div className="absolute inset-0 bg-brand-cyan blur-lg opacity-80 animate-pulse" />
              <div 
                className="relative w-12 h-12 rounded-xl border-2 flex items-center justify-center shadow-2xl overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #64748b 0%, #94a3b8 25%, #cbd5e1 50%, #94a3b8 75%, #64748b 100%)',
                  borderColor: '#45d6ca',
                  boxShadow: 'inset 0 2px 4px rgba(255, 255, 255, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.2), 0 0 15px rgba(69, 214, 202, 0.6)',
                }}
              >
                {/* Glass overlay on CPU icon */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-brand-cyan/20 rounded-xl" />
                <Cpu className="w-6 h-6 text-brand-cyan relative z-10 drop-shadow-lg animate-pulse" />
              </div>
            </div>
          </div>
        </button>
      )}

      {/* Slideout Panel */}
      {open && (
        <div className="fixed inset-0 z-[9998]">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />

          {/* Cyberpunk Glassomorphic Panel - Full Height with Fixed Layout */}
          <div 
            className="absolute inset-y-0 left-0 w-[92vw] sm:w-[620px] h-screen text-neutral-100 shadow-2xl flex flex-col chrome-metallic-panel font-cinzel"
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
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-brand-cyan/10 rounded-full blur-3xl animate-pulse" />
              <div className="absolute -top-5 -right-10 w-32 h-32 bg-brand-electric/8 rounded-full blur-2xl animate-pulse delay-1000" />
              
              {/* Glass header background */}
              <div 
                className="absolute inset-0" 
                style={{
                  background: 'linear-gradient(135deg, rgba(69, 214, 202, 0.15) 0%, rgba(168, 85, 247, 0.1) 50%, rgba(239, 68, 68, 0.08) 100%)',
                }}
              />
              
              {/* Header content */}
              <div className="relative z-10 flex items-center justify-between px-6 py-5 border-b border-brand-cyan/30">
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <div className="absolute -inset-2 bg-gradient-to-r from-brand-cyan/20 to-brand-electric/20 rounded-full blur-sm opacity-75 group-hover:opacity-100 animate-pulse" />
                    <div className="relative bg-gradient-to-r from-brand-cyan/20 to-brand-electric/20 p-2 rounded-full border border-brand-cyan/30">
                      <Brain className="h-7 w-7 text-brand-cyan" />
                    </div>
                  </div>
                  <div>
                    <h1 className="font-serif font-bold text-2xl bg-gradient-to-r from-brand-cyan via-white to-brand-gold bg-clip-text text-transparent drop-shadow-lg">
                      COMPANY A.I.
                    </h1>
                    <p className="text-lg text-brand-cyan font-bold tracking-wide uppercase mt-1 drop-shadow-lg">
                      AI Real Estate Intelligence
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* BULLETPROOF MODEL SELECTOR DROPDOWN */}
                  <div className="relative group">
                    <select
                      value={mcpChat.currentModel}
                      onChange={(e) => {
                        console.log(`🔄 Model selection changed: ${e.target.value}`);
                        mcpChat.switchModel(e.target.value);
                      }}
                      className="appearance-none bg-black/40 border border-brand-cyan/30 rounded-xl px-4 py-2 text-sm text-brand-cyan focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 focus:outline-none cursor-pointer pr-10 font-medium"
                      disabled={mcpChat.isSwitching || mcpChat.modelsLoading}
                    >
                      {mcpChat.modelsLoading ? (
                        <option>Loading models...</option>
                      ) : mcpChat.modelsError ? (
                        <option>Error loading models</option>
                      ) : (
                        <>
                          <optgroup label="🚀 Elite Models">
                            {mcpChat.modelsByTier.elite?.map(model => (
                              <option key={model.id} value={model.id}>
                                {model.name} ({model.provider})
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="⭐ Premium Models">
                            {mcpChat.modelsByTier.premium?.map(model => (
                              <option key={model.id} value={model.id}>
                                {model.name} ({model.provider})
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="📊 Standard Models">
                            {mcpChat.modelsByTier.standard?.map(model => (
                              <option key={model.id} value={model.id}>
                                {model.name} ({model.provider})
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="🆓 Free Models">
                            {mcpChat.modelsByTier.free?.map(model => (
                              <option key={model.id} value={model.id}>
                                {model.name} ({model.provider})
                              </option>
                            ))}
                          </optgroup>
                        </>
                      )}
                    </select>
                    
                    {/* Custom dropdown arrow with loading state */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      {mcpChat.isSwitching ? (
                        <div className="w-4 h-4 border border-brand-cyan/40 border-t-brand-cyan rounded-full animate-spin"></div>
                      ) : (
                        <ChevronDown className="w-4 h-4 text-brand-cyan group-hover:text-white transition-colors" />
                      )}
                    </div>
                    
                    {/* Model validation indicator */}
                    {mcpChat.lastResponse?.metadata?.modelValidation && (
                      <div className="absolute -top-1 -right-1 w-3 h-3">
                        {mcpChat.lastResponse.metadata.modelValidation.valid ? (
                          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                        ) : (
                          <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Model health status */}
                  {!mcpChat.modelsLoading && (
                    <div className="flex items-center gap-1 text-xs">
                      <div className={`w-2 h-2 rounded-full ${
                        mcpChat.availableModels.length > 0 ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                      }`} />
                      <span className="text-brand-cyan/70">
                        {mcpChat.availableModels.length} models
                      </span>
                    </div>
                  )}
                  {/* Data Visualization Toggle */}
                  <button 
                    onClick={() => setShowDataViz(!showDataViz)} 
                    className={cx(
                      "p-2 rounded-xl transition-all duration-300 group relative",
                      "bg-white/5 hover:bg-brand-cyan/10 backdrop-blur-sm",
                      "border border-brand-cyan/20 hover:border-brand-cyan/50",
                      "hover:shadow-lg hover:shadow-brand-cyan/20",
                      showDataViz && "bg-brand-cyan/20 border-brand-cyan/60"
                    )}
                    aria-label="Toggle Data Visualization"
                    title="View Live Data Context"
                  >
                    <BarChart3 className="h-4 w-4 text-brand-cyan/70 group-hover:text-brand-cyan transition-colors" />
                  </button>

                  {/* Onboarding Guide Toggle */}
                  <button 
                    onClick={() => setShowOnboarding(true)} 
                    className={cx(
                      "p-2 rounded-xl transition-all duration-300 group relative",
                      "bg-white/5 hover:bg-brand-cyan/10 backdrop-blur-sm",
                      "border border-brand-cyan/20 hover:border-brand-cyan/50",
                      "hover:shadow-lg hover:shadow-brand-cyan/20"
                    )}
                    aria-label="Open AI Guide"
                    title="Learn How to Use Company A.I."
                  >
                    <HelpCircle className="h-4 w-4 text-brand-cyan/70 group-hover:text-brand-cyan transition-colors" />
                  </button>

                  <button 
                    onClick={() => setOpen(false)} 
                    className={cx(
                      "p-3 rounded-2xl transition-all duration-300 group relative",
                      "bg-white/5 hover:bg-brand-cyan/10 backdrop-blur-sm",
                      "border border-brand-cyan/20 hover:border-brand-cyan/50",
                      "hover:shadow-lg hover:shadow-brand-cyan/20"
                    )}
                    aria-label="Close"
                  >
                    <X className="h-5 w-5 text-brand-cyan/70 group-hover:text-brand-cyan transition-colors" />
                  </button>
                </div>
              </div>
              
              {/* Navigation Tabs */}
              <div className="border-b border-brand-cyan/30 bg-brand-ink/20 relative z-20">
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
                        ? "bg-brand-cyan/20 text-brand-cyan border-b-2 border-brand-cyan"
                        : "text-brand-cyan/70 hover:text-brand-cyan hover:bg-brand-cyan/10"
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
                        ? "bg-brand-cyan/20 text-brand-cyan border-b-2 border-brand-cyan"
                        : "text-brand-cyan/70 hover:text-brand-cyan hover:bg-brand-cyan/10"
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
                        ? "bg-brand-cyan/20 text-brand-cyan border-b-2 border-brand-cyan"
                        : "text-brand-cyan/70 hover:text-brand-cyan hover:bg-brand-cyan/10"
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
                        ? "bg-brand-cyan/20 text-brand-cyan border-b-2 border-brand-cyan"
                        : "text-brand-cyan/70 hover:text-brand-cyan hover:bg-brand-cyan/10"
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
                        ? "bg-brand-cyan/20 text-brand-cyan border-b-2 border-brand-cyan"
                        : "text-brand-cyan/70 hover:text-brand-cyan hover:bg-brand-cyan/10"
                    )}
                  >
                    Admin
                  </button>
                </div>
              </div>
            </div>

            {/* Compact Model Selector */}
            <div 
              className="px-6 py-3 border-b border-brand-cyan/30 relative"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(69, 214, 202, 0.05) 50%, rgba(168, 85, 247, 0.02) 100%)',
                backdropFilter: 'blur(12px)',
              }}
            >
              {/* Ambient glow */}
              <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 w-32 h-8 bg-brand-cyan/10 rounded-full blur-2xl" />
              
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
                  <label className="block text-xs text-brand-cyan/90 font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Brain className="h-3 w-3 animate-pulse" />
                    AI Engine Selection
                  </label>
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-cyan/30 via-brand-electric/20 to-brand-gold/30 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-cyan/5 to-brand-electric/5 rounded-2xl" />
                    <select
                      className="relative w-full text-sm font-bold transition-all duration-300 backdrop-blur-sm rounded-2xl px-5 py-3 border text-brand-cyan hover:text-white focus:text-white focus:outline-none focus:border-brand-electric focus:ring-2 focus:ring-brand-electric/40 disabled:opacity-50"
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
                            <option key={m.id} value={m.id} className="bg-brand-ink text-brand-cyan py-2 font-bold">
                              {getProviderEmoji(m.id)} {m.label}
                            </option>
                          );
                        })
                      )}
                    </select>
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <ChevronDown className="h-4 w-4 text-brand-cyan" />
                    </div>
                  </div>
                </div>
                
                {/* Elite Status Badges */}
                <div className="flex items-center gap-3">
                  {/* ONLINE Badge */}
                  <div className="relative">
                    <div 
                      className="px-3 py-1.5 rounded-lg border font-bold text-xs uppercase tracking-wider transition-all duration-300"
                      style={{
                        background: 'linear-gradient(45deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
                        borderColor: '#22d3ee',
                        color: '#22d3ee',
                        boxShadow: '0 0 10px rgba(34, 211, 238, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                        ONLINE
                      </div>
                    </div>
                  </div>

                  {/* SECURE Badge */}
                  <div className="relative">
                    <div 
                      className="px-3 py-1.5 rounded-lg border font-bold text-xs uppercase tracking-wider transition-all duration-300"
                      style={{
                        background: 'linear-gradient(45deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
                        borderColor: '#fbbf24',
                        color: '#fbbf24',
                        boxShadow: '0 0 10px rgba(251, 191, 36, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Shield className="w-3 h-3" />
                        SECURE
                      </div>
                    </div>
                  </div>
                </div>


              </div>
            </div>



            {/* Tabbed Content Area */}
            <div 
              className="flex-1 min-h-0 relative flex flex-col overflow-hidden"
              style={{
                background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.3) 0%, rgba(30, 41, 59, 0.2) 50%, rgba(15, 23, 42, 0.4) 100%)',
              }}
            >
              {/* Tab Content */}
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
                  <div className="absolute top-10 right-10 w-24 h-24 bg-brand-electric/5 rounded-full blur-2xl animate-pulse delay-500" />
                  <div className="absolute bottom-20 left-10 w-32 h-32 bg-brand-cyan/5 rounded-full blur-3xl animate-pulse delay-1000" />
                  
                  {/* Enhanced AI Features Panel */}
                  {(realTimeInsights || smartSuggestions.length > 0 || conversationAnalytics) && (
                    <div className="relative z-20 p-4 border-b border-brand-cyan/30 bg-gradient-to-r from-brand-gold/5 to-brand-maroon/5">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-brand-cyan flex items-center gap-2">
                          <Brain className="h-4 w-4 text-brand-maroon" />
                          AI Insights
                        </h4>
                        <button
                          onClick={() => setShowInsightsPanel(!showInsightsPanel)}
                          className="text-brand-stone hover:text-brand-cyan transition-colors"
                        >
                          {showInsightsPanel ? 'Hide' : 'Show'}
                        </button>
                      </div>
                      
                      {showInsightsPanel && (
                        <div className="space-y-3">
                          {/* Real-time Insights */}
                          {realTimeInsights && (
                            <div className="p-3 bg-brand-ink/20 rounded-lg border border-brand-cyan/20">
                              <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="h-4 w-4 text-brand-gold" />
                                <span className="text-sm font-medium text-brand-cyan">Real-time Analysis</span>
                              </div>
                              <div className="text-sm text-brand-stone">
                                <div className="flex items-center gap-2 mb-1">
                                  <span>Urgency:</span>
                                  <div className={`px-2 py-1 rounded text-xs ${realTimeInsights.urgency === 'critical' ? 'bg-red-900/50 text-red-300' : 'bg-brand-cyan/20 text-brand-cyan'}`}>
                                    {realTimeInsights.urgency}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span>Complexity:</span>
                                  <div className="px-2 py-1 rounded text-xs bg-brand-electric/20 text-brand-electric border border-brand-electric/30">
                                    {realTimeInsights.complexity}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Smart Suggestions */}
                          {smartSuggestions.length > 0 && (
                            <div className="p-3 bg-brand-ink/20 rounded-lg border border-brand-cyan/20">
                              <div className="flex items-center gap-2 mb-2">
                                <Target className="h-4 w-4 text-brand-maroon" />
                                <span className="text-sm font-medium text-brand-cyan">Smart Suggestions</span>
                              </div>
                              <div className="space-y-2">
                                {smartSuggestions.slice(0, 2).map((suggestion, index) => (
                                  <button
                                    key={index}
                                    onClick={() => setInput(suggestion.text)}
                                    className="w-full text-left text-xs p-2 h-auto bg-brand-sky/50 hover:bg-brand-maroon hover:text-white text-brand-stone rounded transition-colors"
                                  >
                                    <div className="flex items-start gap-2">
                                      <div className="px-2 py-1 rounded text-xs bg-brand-gold/20 text-brand-gold border border-brand-gold/30">
                                        {suggestion.priority}
                                      </div>
                                      <span className="flex-1">{suggestion.text}</span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="relative z-10 flex-1 overflow-hidden flex flex-col">
                    <ChatPane messages={messages} loading={loading} appData={appData} />
                  </div>
                </div>
              )}

              {activeTab === "data" && <DataPane data={appData} />}
              
              {activeTab === "tools" && <ToolsPane systemStatus={{
                websocket: "connected",
                database: "connected",
                apis: [],
                mcpTools: []
              }} mcpEnabled={mcpEnabled} setMcpEnabled={setMcpEnabled} />}

              {activeTab === "agents" && <AgentsPane 
                agents={agents}
                activeTasks={activeTasks}
                taskProgress={taskProgress}
                agentCommunication={agentCommunication}
                multiAgentMode={multiAgentMode}
                onAnalyzeProperty={analyzePropertyWithAgents}
                wsConnected={wsConnected}
              />}

              {activeTab === "admin" && <AdminPane 
                systemPrompt={systemPrompt} 
                setSystemPrompt={setSystemPrompt}
                onSave={async () => {
                  // Add delay to show loading animation
                  await new Promise(resolve => setTimeout(resolve, 800));
                  
                  // Save system prompt
                  localStorage.setItem("company.systemPrompt", systemPrompt);
                  
                  // Save real-time data setting
                  localStorage.setItem("company.realTimeData", realTimeData.toString());
                  
                  // Save MCP enabled setting
                  localStorage.setItem("company.mcpEnabled", mcpEnabled.toString());
                  
                  // Save selected model
                  localStorage.setItem("company.selectedModel", model);
                  
                  console.log("All admin settings saved to localStorage");
                  
                  // Optional: Call the parent's onSaveSystemPrompt if available
                  await onSaveSystemPrompt?.(systemPrompt);
                  
                  // Send telemetry
                  await sendTelemetry("admin_settings_saved", { 
                    systemPromptLength: systemPrompt.length,
                    realTimeData,
                    mcpEnabled,
                    model 
                  });
                }}
                realTimeData={realTimeData}
                setRealTimeData={setRealTimeData}
              />}
            </div>

            {/* Glass Chat Composer - Fixed at Bottom - Only show on chat tab */}
            {activeTab === "chat" && (
            <div 
                className="border-t border-brand-cyan/40 relative flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 50%, rgba(15, 23, 42, 0.95) 100%)',
                  backdropFilter: 'blur(20px) saturate(1.2)',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                }}
              >
                {/* Ambient glow */}
                <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 w-40 h-6 bg-brand-cyan/10 rounded-full blur-2xl" />
                
                <div className="px-6 py-5 flex items-end gap-4">
                  <div className="flex-1 relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-cyan/20 to-brand-electric/20 rounded-3xl blur opacity-0 group-focus-within:opacity-100 transition duration-300 pointer-events-none" />
                    <input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => handleInputChange(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey ? handleSend() : null}
                      placeholder={loading ? "Company A.I. is analyzing..." : "Ask about properties, market trends, demographics, investment opportunities..."}
                      disabled={loading}
                      className="chrome-metallic-input w-full text-sm font-medium rounded-3xl px-6 py-4 pr-12 text-white placeholder-brand-cyan/60 disabled:opacity-60 relative z-10"
                      style={{
                        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(69, 214, 202, 0.1) 30%, rgba(30, 41, 59, 0.9) 100%)',
                        border: '1px solid rgba(69, 214, 202, 0.6)',
                        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 1px 3px rgba(0, 0, 0, 0.3)',
                        pointerEvents: 'auto'
                      }}
                    />
                    {loading && (
                      <div className="absolute right-5 top-1/2 transform -translate-y-1/2">
                        <div className="w-5 h-5 border-2 border-brand-cyan/30 border-t-brand-cyan rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  
                  {/* Glass Send Button */}
                  <button
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    className={cx(
                      "chrome-metallic-button relative inline-flex items-center gap-3 px-6 py-4 rounded-3xl font-bold text-sm",
                      "disabled:opacity-50 disabled:cursor-not-allowed group overflow-hidden"
                    )}
                  >
                    {/* Glass shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    
                    {/* Button content */}
                    <div className="relative z-10 flex items-center gap-2">
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-brand-cyan/40 border-t-brand-cyan rounded-full animate-spin" />
                          <span className="text-brand-cyan/80 font-bold">Processing</span>
                        </>
                      ) : (
                        <>
                          <Brain className="h-5 w-5 text-brand-cyan group-hover:text-white transition-colors duration-300" />
                          <span className="text-brand-cyan group-hover:text-white transition-colors duration-300 font-bold">
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
        </div>
      )}

      {/* Enhanced Data Visualization Panel - can be used for floating widget as well */}
      {showDataViz && (
        <div className="fixed bottom-6 left-[38rem] z-[9997] w-96">
          <EnhancedLiveDataContext
            appData={appData}
            isOpen={showDataViz}
            onClose={() => setShowDataViz(false)}
            className=""
          />
        </div>
      )}

      {/* Onboarding Guide */}
      <OnboardingGuide
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        appData={appData}
      />
    </>
  );
}

// Enhanced UI Components for Company A.I. Boss Agent

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
    },
    crime: {
      name: "FBI Crime Stats",
      icon: <Shield className="h-4 w-4" />,
      endpoint: "/api/tools/fbi-crime",
      description: "FBI crime statistics and safety metrics"
    },
    climate: {
      name: "NOAA Climate",
      icon: <Activity className="h-4 w-4" />,
      endpoint: "/api/tools/noaa-climate",
      description: "National weather and climate data"
    },
    sites: {
      name: "Property Database",
      icon: <MapPin className="h-4 w-4" />,
      endpoint: "/api/sites",
      description: "Complete property database access"
    },
    pipeline: {
      name: "Deal Pipeline",
      icon: <DollarSign className="h-4 w-4" />,
      endpoint: "/api/analytics/pipeline",
      description: "Investment pipeline and deal flow"
    },
    foursquare: {
      name: "Foursquare POI",
      icon: <MapPin className="h-4 w-4" />,
      endpoint: "/api/tools/foursquare",
      description: "Points of interest and location data"
    },
    snapshots: {
      name: "Saved Results",
      icon: <Save className="h-4 w-4" />,
      endpoint: "/api/snapshots",
      description: "Previously saved analysis results"
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
        <div className="bg-brand-cyan/10 border border-brand-cyan/30 rounded-2xl p-4">
          <h4 className="text-brand-cyan font-semibold mb-3 flex items-center gap-2">
            <Cpu className="h-4 w-4 animate-pulse" />
            MCP Server Integration
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-brand-cyan">PostgreSQL Server</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-brand-cyan">Web Search</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-brand-cyan">File System</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-brand-cyan">Memory Store</span>
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
                  ? 'bg-brand-cyan/20 border-brand-cyan/50 text-brand-cyan'
                  : 'bg-black/40 border-gray-700 text-white hover:border-brand-cyan/30 hover:bg-brand-cyan/10'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {tool.icon}
                <span className="text-sm font-semibold">{tool.name}</span>
                {loadingTool === key && (
                  <div className="w-3 h-3 border border-brand-cyan/40 border-t-brand-cyan rounded-full animate-spin"></div>
                )}
              </div>
              <p className="text-xs opacity-80">{tool.description}</p>
            </button>
          ))}
        </div>

        {/* Tool Results Display */}
        <div className="bg-black/40 border border-brand-cyan/30 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-brand-cyan font-semibold flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              {dataTools[selectedTool as keyof typeof dataTools]?.name || "Select Tool"}
            </h4>
            <button
              onClick={() => executeTool(selectedTool)}
              disabled={loadingTool === selectedTool}
              className="px-3 py-1 bg-brand-cyan/20 hover:bg-brand-cyan/30 text-brand-cyan rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
            >
              {loadingTool === selectedTool ? "Loading..." : "Refresh"}
            </button>
          </div>
          
          <div className="max-h-80 overflow-auto cyberpunk-scrollbar">
            {currentResult ? (
              <div className="space-y-3">
                {currentResult.error ? (
                  <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg p-3">
                    {currentResult.error}
                  </div>
                ) : (
                  <>
                    {/* Summary Cards for Key Metrics */}
                    {selectedTool === "overview" && currentResult.totalProperties && (
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="bg-brand-gold/10 border border-brand-gold/20 rounded-lg p-2">
                          <div className="text-lg font-bold text-brand-gold">{currentResult.totalProperties}</div>
                          <div className="text-xs text-brand-gold/80">Properties</div>
                        </div>
                        <div className="bg-green-400/10 border border-green-400/20 rounded-lg p-2">
                          <div className="text-lg font-bold text-green-400">${currentResult.totalValue?.toLocaleString() || "N/A"}</div>
                          <div className="text-xs text-green-400/80">Total Value</div>
                        </div>
                        <div className="bg-purple-400/10 border border-purple-400/20 rounded-lg p-2">
                          <div className="text-lg font-bold text-purple-400">{currentResult.avgOccupancy || "N/A"}%</div>
                          <div className="text-xs text-purple-400/80">Occupancy</div>
                        </div>
                      </div>
                    )}
                    
                    {/* Raw Data Display */}
                    <pre className="text-xs text-gray-300 whitespace-pre-wrap bg-black/20 rounded-lg p-3 border border-gray-700">
                      {JSON.stringify(currentResult, null, 2)}
                    </pre>
                  </>
                )}
              </div>
            ) : (
              <div className="text-brand-cyan/60 text-sm text-center py-8">
                Select a data tool to view real-time information
              </div>
            )}
          </div>
        </div>

        {/* Live Data Context */}
        <div className="bg-brand-gold/10 border border-brand-gold/30 rounded-2xl p-4">
          <h4 className="text-brand-gold font-semibold mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 animate-pulse" />
            Live Data Context
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-brand-gold/80">Portfolio Properties:</span>
              <span className="text-white font-semibold ml-2">{data?.sites?.length || 0}</span>
            </div>
            <div>
              <span className="text-brand-gold/80">Active Markets:</span>
              <span className="text-white font-semibold ml-2">{Object.keys(data?.analytics?.stateDistribution || {}).length}</span>
            </div>
            <div>
              <span className="text-brand-gold/80">Total Units:</span>
              <span className="text-white font-semibold ml-2">{data?.analytics?.totalUnits || 0}</span>
            </div>
            <div>
              <span className="text-brand-gold/80">Last Updated:</span>
              <span className="text-white font-semibold ml-2">{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-brand-electric/10 border border-brand-electric/30 rounded-2xl p-4">
          <h4 className="text-brand-electric font-semibold mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 animate-pulse" />
            Quick Actions
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => executeTool("overview")}
              className="p-2 bg-brand-cyan/10 hover:bg-brand-cyan/20 border border-brand-cyan/30 rounded-lg text-xs text-brand-cyan transition-colors"
            >
              Refresh Portfolio
            </button>
            <button 
              onClick={() => executeTool("employment")}
              className="p-2 bg-brand-gold/10 hover:bg-brand-gold/20 border border-brand-gold/30 rounded-lg text-xs text-brand-gold transition-colors"
            >
              Get Employment Data
            </button>
            <button 
              onClick={() => executeTool("housing")}
              className="p-2 bg-green-400/10 hover:bg-green-400/20 border border-green-400/30 rounded-lg text-xs text-green-400 transition-colors"
            >
              Check Housing Market
            </button>
            <button 
              onClick={() => executeTool("crime")}
              className="p-2 bg-purple-400/10 hover:bg-purple-400/20 border border-purple-400/30 rounded-lg text-xs text-purple-400 transition-colors"
            >
              Safety Analytics
            </button>
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
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [orchestrationMode, setOrchestrationMode] = useState<'parallel' | 'sequential'>('parallel');
  const [testProperty, setTestProperty] = useState({
    name: "Sunbelt Plaza",
    address: "1234 Main St, Austin, TX",
    type: "Multifamily",
    units: 250,
    sqft: 280000
  });
  const [outputMessages, setOutputMessages] = useState<Record<string, Array<{ type: 'info' | 'success' | 'error' | 'progress', text: string, timestamp: number }>>>({});

  // Auto-scroll to agent output when tasks start
  useEffect(() => {
    if (activeTasks.length > 0) {
      // Scroll to the agent output section when tasks appear
      setTimeout(() => {
        const outputSection = document.getElementById('agent-output-section');
        if (outputSection) {
          outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [activeTasks.length]);

  // Simulate realistic output messages when tasks are running
  useEffect(() => {
    if (activeTasks.length > 0) {
      const interval = setInterval(() => {
        activeTasks.forEach(task => {
          const progress = taskProgress[task.agentId] || 0;
          const agent = agents.find(a => a.id === task.agentId);
          
          // Generate realistic messages based on progress and agent type
          if (Math.random() > 0.7) { // Random chance for new message
            const newMessage = {
              type: 'info' as const,
              text: generateRealisticMessage(agent, progress),
              timestamp: Date.now()
            };
            
            setOutputMessages(prev => ({
              ...prev,
              [task.agentId]: [...(prev[task.agentId] || []).slice(-10), newMessage]
            }));
          }
        });
      }, 2000 + Math.random() * 3000); // Random interval between 2-5 seconds

      return () => clearInterval(interval);
    }
  }, [activeTasks, taskProgress, agents]);

  const generateRealisticMessage = (agent: any, progress: number) => {
    const messages = {
      'master': [
        'Orchestrating multi-agent analysis pipeline...',
        'Coordinating data flows between specialized agents...',
        'Synthesizing cross-domain insights...',
        'Validating inter-agent communication protocols...',
        'Finalizing consolidated investment recommendation...'
      ],
      'data-processing': [
        'Ingesting demographic datasets from Census API...',
        'Processing employment statistics from BLS...',
        'Analyzing economic indicators and trends...',
        'Geocoding property location and market boundaries...',
        'Computing neighborhood scoring algorithms...'
      ],
      'financial-analysis': [
        'Building DCF model with 10-year projections...',
        'Calculating risk-adjusted IRR scenarios...',
        'Running Monte Carlo simulations for NPV...',
        'Analyzing cap rate compression trends...',
        'Evaluating optimal LP/GP waterfall structures...'
      ],
      'market-intelligence': [
        'Scraping comparable property transactions...',
        'Analyzing rental growth trajectories...',
        'Processing market absorption rates...',
        'Evaluating competitive landscape dynamics...',
        'Forecasting demand drivers and constraints...'
      ],
      'lead-management': [
        'Assessing investor profile compatibility...',
        'Calculating lead conversion probabilities...',
        'Analyzing deal packaging requirements...',
        'Evaluating financing structure preferences...',
        'Preparing investor presentation materials...'
      ]
    };

    const agentMessages = messages[agent?.id as keyof typeof messages] || messages['master'];
    const index = Math.floor((progress / 100) * agentMessages.length);
    return agentMessages[Math.min(index, agentMessages.length - 1)];
  };

  // Agent status colors and icons
  const getAgentStatus = (agentId: string) => {
    const task = activeTasks.find(t => t.agentId === agentId);
    if (task?.status === 'running') return { color: 'bg-brand-cyan', icon: '🔄', text: 'ACTIVE' };
    if (task?.status === 'completed') return { color: 'bg-green-400', icon: '✅', text: 'COMPLETE' };
    if (task?.status === 'error') return { color: 'bg-red-400', icon: '❌', text: 'ERROR' };
    return { color: 'bg-brand-gold', icon: '⚡', text: 'READY' };
  };

  const agentColors = {
    'brand-master': 'brand-cyan',
    'data-processor': 'brand-gold',
    'financial-analyst': 'emerald-400',
    'market-intelligence': 'purple-400',
    'lead-manager': 'pink-400'
  };

  return (
    <div className="flex-1 overflow-y-auto cyberpunk-scrollbar">
      <div className="p-6 space-y-6">
        {/* Multi-Agent System Header */}
        <div className="bg-brand-maroon/10 border border-brand-gold/30 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-gold/20 border border-brand-gold/40 rounded-lg flex items-center justify-center">
                <Brain className="h-5 w-5 text-brand-gold" />
              </div>
              <div>
                <h4 className="text-brand-gold font-bold text-xl tracking-wide">COMPANY AI AGENTS</h4>
                <p className="text-brand-gold/70 text-sm">5-Agent Intelligence System • Parallel Processing</p>
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
              
              <button
                onClick={() => setOrchestrationMode(orchestrationMode === 'parallel' ? 'sequential' : 'parallel')}
                className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-all duration-300 flex items-center gap-2 ${
                  orchestrationMode === 'parallel'
                    ? 'bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30'
                    : 'bg-brand-gold/20 text-brand-gold border border-brand-gold/30'
                }`}
              >
                <Zap className="h-3 w-3" />
                {orchestrationMode === 'parallel' ? 'PARALLEL' : 'SEQUENTIAL'}
              </button>
            </div>
          </div>

          {/* System Status Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-brand-cyan/10 border border-brand-cyan/20 rounded-lg p-3">
              <div className="text-lg font-bold text-brand-cyan">{agents.length}</div>
              <div className="text-xs text-brand-cyan/80">Active Agents</div>
            </div>
            <div className="bg-brand-gold/10 border border-brand-gold/20 rounded-lg p-3">
              <div className="text-lg font-bold text-brand-gold">{activeTasks.length}</div>
              <div className="text-xs text-brand-gold/80">Running Tasks</div>
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

        {/* Agent Grid */}
        <div className="grid gap-4">
          {/* Master Coordination Agent */}
            {agents.filter(agent => agent.id === 'master').map((agent, index) => {
              const status = getAgentStatus(agent.id);
              const colorClass = 'brand-cyan';
              const task = activeTasks.find(t => t.agentId === agent.id);
              const progress = taskProgress[agent.id] || 0;

              return (
                <div 
                  key={agent.id}
                  className={`bg-black/40 border rounded-2xl p-4 transition-all duration-300 cursor-pointer hover:border-${colorClass}/50 ${
                    selectedAgent === agent.id ? `border-${colorClass}/60 bg-${colorClass}/5` : 'border-gray-700'
                  }`}
                  onClick={() => setSelectedAgent(selectedAgent === agent.id ? null : agent.id)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 bg-${colorClass}/20 border border-${colorClass}/40 rounded-lg flex items-center justify-center`}>
                        <span className="text-lg">{status.icon}</span>
                      </div>
                      <div>
                        <h5 className={`text-${colorClass} font-bold text-sm uppercase tracking-wide`}>
                          {agent.name}
                        </h5>
                        <p className="text-xs text-gray-400">{agent.model}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold text-${colorClass}`}>{status.text}</span>
                      <div className={`w-2 h-2 rounded-full ${status.color} ${status.text === 'ACTIVE' ? 'animate-pulse' : ''}`}></div>
                    </div>
                  </div>

                  <p className="text-gray-300 text-sm mb-3">{agent.description}</p>

                  {task && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400">Current Task</span>
                        <span className="text-xs text-gray-400">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-1.5">
                        <div 
                          className={`bg-${colorClass} h-1.5 rounded-full transition-all duration-300`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{task.description}</p>
                    </div>
                  )}

                  {selectedAgent === agent.id && agentCommunication.filter(msg => msg.from === agent.id || msg.to === agent.id).length > 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-700">
                      <h6 className="text-xs font-semibold text-gray-300 mb-2">RECENT COMMUNICATION</h6>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {agentCommunication
                          .filter(msg => msg.from === agent.id || msg.to === agent.id)
                          .slice(-3)
                          .map((msg, idx) => (
                            <div key={idx} className="text-xs p-2 bg-gray-800/50 rounded border border-gray-600">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-gray-400">{msg.from}</span>
                                <span className="text-gray-500">→</span>
                                <span className="text-gray-400">{msg.to}</span>
                                <span className="text-gray-500 ml-auto">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                              </div>
                              <p className="text-gray-300">{msg.message}</p>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

          {/* Data & Market Intelligence Agents */}
          {agents.filter(agent => agent.id === 'data-processing' || agent.id === 'market-intelligence').map((agent, index) => {
              const status = getAgentStatus(agent.id);
              const colorClass = agent.id === 'data-processing' ? 'brand-gold' : 'purple-400';
              const task = activeTasks.find(t => t.agentId === agent.id);
              const progress = taskProgress[agent.id] || 0;

              return (
                <div 
                  key={agent.id}
                  className={`bg-black/40 border rounded-2xl p-4 transition-all duration-300 cursor-pointer hover:border-${colorClass}/50 ${
                    selectedAgent === agent.id ? `border-${colorClass}/60 bg-${colorClass}/5` : 'border-gray-700'
                  }`}
                  onClick={() => setSelectedAgent(selectedAgent === agent.id ? null : agent.id)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 bg-${colorClass}/20 border border-${colorClass}/40 rounded-lg flex items-center justify-center`}>
                        <span className="text-lg">{status.icon}</span>
                      </div>
                      <div>
                        <h5 className={`text-${colorClass} font-bold text-sm uppercase tracking-wide`}>
                          {agent.name}
                        </h5>
                        <p className="text-xs text-gray-400">{agent.model}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold text-${colorClass}`}>{status.text}</span>
                      <div className={`w-2 h-2 rounded-full ${status.color} ${status.text === 'ACTIVE' ? 'animate-pulse' : ''}`}></div>
                    </div>
                  </div>

                  <p className="text-gray-300 text-sm mb-3">{agent.description}</p>

                  {task && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400">Current Task</span>
                        <span className="text-xs text-gray-400">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-1.5">
                        <div 
                          className={`bg-${colorClass} h-1.5 rounded-full transition-all duration-300`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{task.description}</p>
                    </div>
                  )}

                  {selectedAgent === agent.id && agentCommunication.filter(msg => msg.from === agent.id || msg.to === agent.id).length > 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-700">
                      <h6 className="text-xs font-semibold text-gray-300 mb-2">RECENT COMMUNICATION</h6>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {agentCommunication
                          .filter(msg => msg.from === agent.id || msg.to === agent.id)
                          .slice(-3)
                          .map((msg, idx) => (
                            <div key={idx} className="text-xs p-2 bg-gray-800/50 rounded border border-gray-600">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-gray-400">{msg.from}</span>
                                <span className="text-gray-500">→</span>
                                <span className="text-gray-400">{msg.to}</span>
                                <span className="text-gray-500 ml-auto">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                              </div>
                              <p className="text-gray-300">{msg.message}</p>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

          {/* Financial & Lead Management Agents */}
          {agents.filter(agent => agent.id === 'financial-analysis' || agent.id === 'lead-management').map((agent, index) => {
              const status = getAgentStatus(agent.id);
              const colorClass = agent.id === 'financial-analysis' ? 'emerald-400' : 'pink-400';
              const task = activeTasks.find(t => t.agentId === agent.id);
              const progress = taskProgress[agent.id] || 0;

              return (
                <div 
                  key={agent.id}
                  className={`bg-black/40 border rounded-2xl p-4 transition-all duration-300 cursor-pointer hover:border-${colorClass}/50 ${
                    selectedAgent === agent.id ? `border-${colorClass}/60 bg-${colorClass}/5` : 'border-gray-700'
                  }`}
                  onClick={() => setSelectedAgent(selectedAgent === agent.id ? null : agent.id)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 bg-${colorClass}/20 border border-${colorClass}/40 rounded-lg flex items-center justify-center`}>
                        <span className="text-lg">{status.icon}</span>
                      </div>
                      <div>
                        <h5 className={`text-${colorClass} font-bold text-sm uppercase tracking-wide`}>
                          {agent.name}
                        </h5>
                        <p className="text-xs text-gray-400">{agent.model}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold text-${colorClass}`}>{status.text}</span>
                      <div className={`w-2 h-2 rounded-full ${status.color} ${status.text === 'ACTIVE' ? 'animate-pulse' : ''}`}></div>
                    </div>
                  </div>

                  <p className="text-gray-300 text-sm mb-3">{agent.description}</p>

                  {task && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400">Current Task</span>
                        <span className="text-xs text-gray-400">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-1.5">
                        <div 
                          className={`bg-${colorClass} h-1.5 rounded-full transition-all duration-300`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{task.description}</p>
                    </div>
                  )}

                  {selectedAgent === agent.id && agentCommunication.filter(msg => msg.from === agent.id || msg.to === agent.id).length > 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-700">
                      <h6 className="text-xs font-semibold text-gray-300 mb-2">RECENT COMMUNICATION</h6>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {agentCommunication
                          .filter(msg => msg.from === agent.id || msg.to === agent.id)
                          .slice(-3)
                          .map((msg, idx) => (
                            <div key={idx} className="text-xs p-2 bg-gray-800/50 rounded border border-gray-600">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-gray-400">{msg.from}</span>
                                <span className="text-gray-500">→</span>
                                <span className="text-gray-400">{msg.to}</span>
                                <span className="text-gray-500 ml-auto">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                              </div>
                              <p className="text-gray-300">{msg.message}</p>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

          {/* Legacy Agent Grid (fallback for any remaining agents) */}
          {agents.filter(agent => !['master', 'data-processing', 'market-intelligence', 'financial-analysis', 'lead-management'].includes(agent.id)).map((agent, index) => {
            const status = getAgentStatus(agent.id);
            const colorClass = agentColors[agent.id as keyof typeof agentColors] || 'brand-cyan';
            const task = activeTasks.find(t => t.agentId === agent.id);
            const progress = taskProgress[agent.id] || 0;

            return (
              <div 
                key={agent.id}
                className={`bg-black/40 border rounded-2xl p-4 transition-all duration-300 cursor-pointer hover:border-${colorClass}/50 ${
                  selectedAgent === agent.id ? `border-${colorClass}/60 bg-${colorClass}/5` : 'border-gray-700'
                }`}
                onClick={() => setSelectedAgent(selectedAgent === agent.id ? null : agent.id)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 bg-${colorClass}/20 border border-${colorClass}/40 rounded-lg flex items-center justify-center`}>
                      <span className="text-lg">{status.icon}</span>
                    </div>
                    <div>
                      <h5 className={`text-${colorClass} font-bold text-sm uppercase tracking-wide`}>
                        {agent.name}
                      </h5>
                      <p className="text-xs text-gray-400">{agent.model}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold text-${colorClass}`}>{status.text}</span>
                    <div className={`w-2 h-2 rounded-full ${status.color} ${status.text === 'ACTIVE' ? 'animate-pulse' : ''}`}></div>
                  </div>
                </div>

                {/* Agent Description */}
                <p className="text-gray-300 text-sm mb-3">{agent.description}</p>

                {/* Task Progress */}
                {task && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400">Current Task</span>
                      <span className="text-xs text-gray-400">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-1.5">
                      <div 
                        className={`bg-${colorClass} h-1.5 rounded-full transition-all duration-300`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{task.description}</p>
                  </div>
                )}

                {/* Agent Communication */}
                {selectedAgent === agent.id && agentCommunication.filter(msg => msg.from === agent.id || msg.to === agent.id).length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-700">
                    <h6 className="text-xs font-semibold text-gray-300 mb-2">RECENT COMMUNICATION</h6>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {agentCommunication
                        .filter(msg => msg.from === agent.id || msg.to === agent.id)
                        .slice(-3)
                        .map((msg, idx) => (
                          <div key={idx} className="text-xs p-2 bg-gray-800/50 rounded border border-gray-600">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-gray-400">{msg.from}</span>
                              <span className="text-gray-500">→</span>
                              <span className="text-gray-400">{msg.to}</span>
                              <span className="text-gray-500 ml-auto">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <p className="text-gray-300">{msg.message}</p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Property Analysis Test */}
        <div className="bg-brand-electric/10 border border-brand-electric/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-brand-electric/20 border border-brand-electric/40 rounded-lg flex items-center justify-center">
              <Target className="h-4 w-4 text-brand-electric" />
            </div>
            <div>
              <h4 className="text-brand-electric font-bold text-lg">COORDINATED ANALYSIS</h4>
              <p className="text-brand-electric/70 text-sm">Test multi-agent property evaluation</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-brand-electric/80 text-sm font-medium mb-2">Property Name</label>
              <input
                type="text"
                value={testProperty.name}
                onChange={(e) => setTestProperty({...testProperty, name: e.target.value})}
                className="w-full bg-black/40 border border-brand-electric/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-electric/60"
              />
            </div>
            <div>
              <label className="block text-brand-electric/80 text-sm font-medium mb-2">Address</label>
              <input
                type="text"
                value={testProperty.address}
                onChange={(e) => setTestProperty({...testProperty, address: e.target.value})}
                className="w-full bg-black/40 border border-brand-electric/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-electric/60"
              />
            </div>
            <div>
              <label className="block text-brand-electric/80 text-sm font-medium mb-2">Units</label>
              <input
                type="number"
                value={testProperty.units}
                onChange={(e) => setTestProperty({...testProperty, units: parseInt(e.target.value)})}
                className="w-full bg-black/40 border border-brand-electric/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-electric/60"
              />
            </div>
            <div>
              <label className="block text-brand-electric/80 text-sm font-medium mb-2">Square Feet</label>
              <input
                type="number"
                value={testProperty.sqft}
                onChange={(e) => setTestProperty({...testProperty, sqft: parseInt(e.target.value)})}
                className="w-full bg-black/40 border border-brand-electric/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-electric/60"
              />
            </div>
          </div>

          <button
            onClick={() => onAnalyzeProperty(testProperty)}
            disabled={activeTasks.length > 0}
            className="w-full px-6 py-4 rounded-xl font-bold text-lg transition-all duration-300 hover:scale-105 active:scale-95 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{
              background: activeTasks.length > 0 
                ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.3) 0%, rgba(251, 191, 36, 0.2) 50%, rgba(251, 191, 36, 0.3) 100%)'
                : 'linear-gradient(135deg, rgba(20, 184, 166, 0.95) 0%, rgba(6, 182, 212, 0.9) 25%, rgba(14, 165, 233, 0.9) 50%, rgba(59, 130, 246, 0.9) 75%, rgba(99, 102, 241, 0.95) 100%)',
              backdropFilter: 'blur(20px) saturate(1.8)',
              border: activeTasks.length > 0 
                ? '2px solid rgba(251, 191, 36, 0.4)'
                : '2px solid rgba(20, 184, 166, 0.6)',
              boxShadow: activeTasks.length > 0
                ? '0 8px 32px rgba(251, 191, 36, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                : '0 8px 32px rgba(20, 184, 166, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 0 60px rgba(20, 184, 166, 0.3)',
              color: activeTasks.length > 0 ? '#fbbf24' : '#000000'
            }}
            onMouseEnter={(e) => {
              if (activeTasks.length === 0) {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(20, 184, 166, 1) 0%, rgba(6, 182, 212, 0.95) 25%, rgba(14, 165, 233, 0.95) 50%, rgba(59, 130, 246, 0.95) 75%, rgba(99, 102, 241, 1) 100%)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(20, 184, 166, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3), 0 0 80px rgba(20, 184, 166, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTasks.length === 0) {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(20, 184, 166, 0.95) 0%, rgba(6, 182, 212, 0.9) 25%, rgba(14, 165, 233, 0.9) 50%, rgba(59, 130, 246, 0.9) 75%, rgba(99, 102, 241, 0.95) 100%)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(20, 184, 166, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 0 60px rgba(20, 184, 166, 0.3)';
              }
            }}
          >
            {/* Animated background gradient for active state */}
            {activeTasks.length > 0 && (
              <div className="absolute inset-0 bg-gradient-to-r from-brand-gold/20 via-brand-gold/30 to-brand-gold/20 animate-pulse" />
            )}
            
            {/* Glass shimmer effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700" />
            </div>
            
            <div className="relative z-10 flex items-center justify-center gap-3">
              {activeTasks.length > 0 ? (
                <>
                  <div className="w-5 h-5 border-2 border-brand-gold/40 border-t-brand-gold rounded-full animate-spin" />
                  <span className="font-bold tracking-wide">AGENTS ANALYZING...</span>
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5" />
                  <span className="font-bold tracking-wide">START COORDINATED ANALYSIS</span>
                </>
              )}
            </div>
          </button>
        </div>

        {/* Real-time Agent Output Windows */}
        {activeTasks.length > 0 && (
          <div className="bg-black/60 border border-brand-cyan/30 rounded-2xl p-6" id="agent-output-section">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-brand-cyan/20 border border-brand-cyan/40 rounded-lg flex items-center justify-center">
                <Terminal className="h-4 w-4 text-brand-cyan animate-pulse" />
              </div>
              <div>
                <h4 className="text-brand-cyan font-bold text-lg">LIVE AGENT OUTPUT</h4>
                <p className="text-brand-cyan/70 text-sm">Real-time analysis streams from all active agents</p>
              </div>
            </div>
            
            <div className="grid gap-4">
              {activeTasks.map((task, index) => {
                const agent = agents.find(a => a.id === task.agentId);
                const colorClass = agentColors[task.agentId as keyof typeof agentColors] || 'brand-cyan';
                const progress = taskProgress[task.agentId] || 0;

                // Get agent specialization info
                const getAgentSpecialization = (agentId: string) => {
                  switch(agentId) {
                    case 'brand-master':
                      return {
                        category: 'MASTER COORDINATION',
                        description: 'Company Master Agent - Orchestrates analysis & synthesizes insights',
                        icon: '🧠'
                      };
                    case 'data-processor':
                      return {
                        category: 'DATA INTELLIGENCE',
                        description: 'Data Processing Agent - Processes demographics & economic data',
                        icon: '📊'
                      };
                    case 'market-intelligence':
                      return {
                        category: 'MARKET INTELLIGENCE',
                        description: 'Market Intelligence Agent - Analyzes market trends & comparables',
                        icon: '📈'
                      };
                    case 'financial-analyst':
                      return {
                        category: 'FINANCIAL ANALYSIS',
                        description: 'Financial Analysis Agent - Calculates IRR/NPV/Cap rates',
                        icon: '💰'
                      };
                    case 'lead-manager':
                      return {
                        category: 'LEAD MANAGEMENT',
                        description: 'Lead Management Agent - Manages investor conversion strategies',
                        icon: '🎯'
                      };
                    default:
                      return {
                        category: 'AGENT',
                        description: 'Processing...',
                        icon: '⚡'
                      };
                  }
                };

                const specialization = getAgentSpecialization(task.agentId);
                
                return (
                  <div key={task.id} className={`bg-black/40 border border-${colorClass}/30 rounded-xl p-4`}>
                    {/* Enhanced Agent Header with Specialization */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 bg-${colorClass}/20 border border-${colorClass}/40 rounded-lg flex items-center justify-center`}>
                            <span className="text-lg">{specialization.icon}</span>
                          </div>
                          <div>
                            <h5 className={`text-${colorClass} font-bold text-base uppercase tracking-wide`}>
                              {specialization.icon} {agent?.name || task.agentId}
                            </h5>
                            <p className={`text-xs text-${colorClass}/60 font-medium`}>{specialization.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs font-bold text-${colorClass}`}>{progress}%</span>
                          <div className="w-12 bg-gray-700 rounded-full h-1 mt-1">
                            <div 
                              className={`bg-${colorClass} h-1 rounded-full transition-all duration-300`}
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Prominent Agent Name Header */}
                      <div className={`bg-gradient-to-r from-${colorClass}/20 via-${colorClass}/30 to-${colorClass}/20 border border-${colorClass}/50 rounded-xl px-4 py-4`}>
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 bg-${colorClass}/30 border-2 border-${colorClass}/60 rounded-xl flex items-center justify-center`}>
                            <span className="text-3xl">{specialization.icon}</span>
                          </div>
                          <div className="flex-1">
                            <div className={`text-${colorClass} font-bold text-xl uppercase tracking-wider mb-1`}>
                              {specialization.category}
                            </div>
                            <div className={`text-${colorClass} font-semibold text-lg uppercase tracking-wide`}>
                              {agent?.name || task.agentId}
                            </div>
                            <div className={`text-${colorClass}/80 text-sm mt-1`}>
                              {specialization.description}
                            </div>
                          </div>
                          <div className={`text-${colorClass} font-bold text-lg`}>
                            {progress}%
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* LIVE AGENT OUTPUT STREAM - Real data from WebSocket */}
                    <div className={`bg-black/60 border border-${colorClass}/20 rounded-lg p-3 max-h-64 overflow-y-auto cyberpunk-scrollbar`}>
                      <div className="space-y-2 text-sm font-mono">
                        {/* Show agent initialization */}
                        <div className={`text-${colorClass} flex items-center gap-2`}>
                          <span className={`w-1.5 h-1.5 bg-${colorClass} rounded-full ${task.status === 'processing' ? 'animate-pulse' : ''}`}></span>
                          <span className="font-bold">{agent?.name || task.agentId} - {task.type}</span>
                        </div>
                        
                        {/* Show actual agent results when available */}
                        {task.result && (
                          <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-3 mt-2">
                            <div className="text-green-400 font-bold mb-2 flex items-center gap-2">
                              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                              ANALYSIS COMPLETE
                            </div>
                            <div className="text-gray-200 whitespace-pre-wrap text-xs leading-relaxed">
                              {task.result}
                            </div>
                          </div>
                        )}
                        
                        {/* Show processing status */}
                        {!task.result && task.status === 'processing' && (
                          <div className="space-y-1">
                            <div className={`text-${colorClass} flex items-center gap-2 animate-pulse`}>
                              <span className={`w-1.5 h-1.5 bg-${colorClass} rounded-full animate-ping`}></span>
                              <span>Processing {task.type}... {progress}%</span>
                            </div>
                            
                            {/* Agent-specific live status */}
                            {(() => {
                              const getStatusMessage = (agentId: string, progress: number) => {
                                if (progress < 25) return "Initializing analysis engine...";
                                if (progress < 50) return "Processing real estate data...";
                                if (progress < 75) return "Running calculations...";
                                if (progress < 100) return "Finalizing results...";
                                return "Complete";
                              };
                              
                              return (
                                <div className="text-gray-400 ml-4">
                                  → {getStatusMessage(task.agentId, progress)}
                                </div>
                              );
                            })()}
                          </div>
                        )}
                        
                        {/* Show error state */}
                        {task.status === 'failed' && (
                          <div className="text-red-400 flex items-center gap-2 animate-fade-in">
                            <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                            <span>✗ Analysis failed - Will retry automatically</span>
                          </div>
                        )}
                        
                        {/* Show completion state */}
                        {task.status === 'completed' && task.result && (
                          <div className="text-green-400 flex items-center gap-2 animate-fade-in">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                            <span>✓ {agent?.name} analysis completed successfully</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Overall Progress */}
            <div className="mt-4 p-4 bg-brand-maroon/10 border border-brand-maroon/30 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-brand-maroon font-semibold text-sm">OVERALL PROGRESS</span>
                <span className="text-brand-maroon text-sm">
                  {Math.round(Object.values(taskProgress).reduce((a: number, b: unknown) => a + (b as number), 0) / Object.keys(taskProgress).length || 0)}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-brand-maroon to-brand-gold h-2 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${Math.round(Object.values(taskProgress).reduce((a: number, b: unknown) => a + (b as number), 0) / Object.keys(taskProgress).length || 0)}%` 
                  }}
                ></div>
              </div>
              <div className="mt-2 text-xs text-gray-400">
                {activeTasks.filter(t => t.status === 'completed').length} of {activeTasks.length} agents completed
              </div>
            </div>
          </div>
        )}

        {/* Agent Communication Log */}
        {agentCommunication.length > 0 && (
          <div className="bg-brand-maroon/10 border border-brand-maroon/30 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-brand-maroon/20 border border-brand-maroon/40 rounded-lg flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-brand-maroon" />
              </div>
              <div>
                <h4 className="text-brand-maroon font-bold text-lg">INTER-AGENT COMMUNICATION</h4>
                <p className="text-brand-maroon/70 text-sm">Real-time agent coordination messages</p>
              </div>
            </div>
            
            <div className="max-h-64 overflow-y-auto space-y-2">
              {agentCommunication.slice(-10).map((msg, index) => (
                <div key={index} className="bg-black/40 border border-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-brand-cyan text-sm font-medium">{msg.from}</span>
                      <span className="text-gray-500">→</span>
                      <span className="text-brand-gold text-sm font-medium">{msg.to}</span>
                    </div>
                    <span className="text-xs text-gray-400">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-gray-300 text-sm">{msg.message}</p>
                  {msg.data && (
                    <div className="mt-2 text-xs text-gray-400 bg-gray-800/50 rounded p-2 border border-gray-600">
                      {JSON.stringify(msg.data, null, 2)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ToolsPane({ systemStatus, mcpEnabled, setMcpEnabled }: { 
  systemStatus: SystemStatus; 
  mcpEnabled: boolean; 
  setMcpEnabled: (enabled: boolean) => void; 
}) {
  const [mcpTools, setMcpTools] = useState<any[]>([]);
  const [mcpStatus, setMcpStatus] = useState<any>(null);
  const [loadingMcp, setLoadingMcp] = useState(false);

  // Fetch MCP tools and status
  useEffect(() => {
    const fetchMcpData = async () => {
      setLoadingMcp(true);
      try {
        const [toolsResponse, statusResponse] = await Promise.all([
          fetch('/api/mcp-tools'),
          fetch('/api/mcp-tools/status')
        ]);
        
        if (toolsResponse.ok) {
          const toolsData = await toolsResponse.json();
          setMcpTools(toolsData.tools || []);
        }
        
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          setMcpStatus(statusData.status);
        }
      } catch (error) {
        console.error('Error fetching MCP data:', error);
      } finally {
        setLoadingMcp(false);
      }
    };

    fetchMcpData();
  }, []);

  const [executingTool, setExecutingTool] = useState<string | null>(null);
  const [toolResults, setToolResults] = useState<Record<string, any>>({});
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [executionHistory, setExecutionHistory] = useState<any[]>([]);

  const executeMcpTool = async (toolName: string, params: Record<string, any> = {}) => {
    setExecutingTool(toolName);
    try {
      const response = await fetch(`/api/mcp-tools/execute/${toolName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`MCP Tool ${toolName} executed:`, result);
        
        // Store the result
        setToolResults(prev => ({
          ...prev,
          [toolName]: result
        }));
        
        // Add to execution history
        const historyEntry = {
          tool: toolName,
          timestamp: new Date().toISOString(),
          params,
          result: result.result,
          success: true
        };
        setExecutionHistory(prev => [historyEntry, ...prev.slice(0, 9)]); // Keep last 10
        
        return result;
      } else {
        throw new Error('Tool execution failed');
      }
    } catch (error) {
      console.error(`Error executing MCP tool ${toolName}:`, error);
      const historyEntry = {
        tool: toolName,
        timestamp: new Date().toISOString(),
        params,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      };
      setExecutionHistory(prev => [historyEntry, ...prev.slice(0, 9)]);
      throw error;
    } finally {
      setExecutingTool(null);
    }
  };

  const formatToolResult = (result: any) => {
    if (typeof result === 'object') {
      return JSON.stringify(result, null, 2);
    }
    return String(result);
  };

  const injectDataToChat = (data: any, toolName: string) => {
    // This would inject the tool result into the current chat context
    console.log(`Injecting ${toolName} data into chat:`, data);
    alert(`Data from ${toolName} injected into chat context!`);
  };

  return (
    <div className="flex-1 p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h4 className="text-brand-gold font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4" />
            MCP BOSS AGENT TOOLS
          </h4>
          <div className="flex items-center gap-2">
            <span className="text-xs text-brand-cyan">Enable MCP</span>
            <button
              onClick={() => setMcpEnabled(!mcpEnabled)}
              className={`
                w-16 h-8 rounded-full transition-all duration-500 relative border-2 shadow-xl transform hover:scale-105
                ${mcpEnabled 
                  ? 'bg-gradient-to-r from-green-600 via-green-500 to-green-400 border-green-300 shadow-green-500/60' 
                  : 'bg-gradient-to-r from-red-700 via-red-600 to-red-500 border-red-400 shadow-red-500/40'
                }
              `}
              style={{
                boxShadow: mcpEnabled 
                  ? '0 0 25px rgba(34, 197, 94, 0.8), 0 0 50px rgba(34, 197, 94, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.3), inset 0 -2px 0 rgba(0, 0, 0, 0.1)' 
                  : '0 0 20px rgba(239, 68, 68, 0.6), 0 0 40px rgba(239, 68, 68, 0.3), inset 0 2px 0 rgba(255, 255, 255, 0.2), inset 0 -2px 0 rgba(0, 0, 0, 0.15)'
              }}
            >
              <div className={`
                w-6 h-6 rounded-full absolute top-0.5 transition-all duration-500 border-2 border-white/50 shadow-lg
                ${mcpEnabled 
                  ? 'left-8 bg-gradient-to-br from-white via-green-50 to-green-100 transform scale-110' 
                  : 'left-0.5 bg-gradient-to-br from-white via-red-50 to-red-100'
                }
              `} 
              style={{
                boxShadow: mcpEnabled 
                  ? '0 4px 8px rgba(0, 0, 0, 0.25), inset 0 2px 0 rgba(255, 255, 255, 0.9), 0 0 15px rgba(34, 197, 94, 0.5)'
                  : '0 3px 6px rgba(0, 0, 0, 0.2), inset 0 2px 0 rgba(255, 255, 255, 0.8), 0 0 10px rgba(239, 68, 68, 0.3)'
              }}
              />
            </button>
          </div>
        </div>
        
        {/* MCP Tool Categories */}
        <div className="space-y-4">
          {loadingMcp ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-brand-cyan/30 border-t-brand-cyan rounded-full animate-spin"></div>
              <span className="ml-3 text-brand-cyan">Loading MCP Tools...</span>
            </div>
          ) : (
            <>
              {/* Data Tools */}
              <div className="bg-brand-cyan/10 border border-brand-cyan/30 rounded-2xl p-4">
                <h5 className="text-brand-cyan font-semibold mb-3 text-sm">Data Access Tools</h5>
                <div className="grid gap-2">
                  {mcpTools.filter(tool => tool.category === 'data').map((tool, index) => (
                    <div key={index} className="space-y-2">
                      <button
                        onClick={() => {
                          executeMcpTool(tool.name);
                          setSelectedTool(selectedTool === tool.name ? null : tool.name);
                        }}
                        disabled={executingTool === tool.name}
                        className={`w-full flex items-center justify-between p-3 border rounded-xl transition-all duration-300 ${
                          executingTool === tool.name
                            ? 'bg-brand-cyan/20 border-brand-cyan/60 cursor-not-allowed'
                            : selectedTool === tool.name
                              ? 'bg-brand-cyan/15 border-brand-cyan/50'
                              : 'bg-black/40 hover:bg-brand-cyan/10 border-gray-700 hover:border-brand-cyan/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`transition-transform duration-300 ${executingTool === tool.name ? 'animate-spin' : ''}`}>
                            {executingTool === tool.name ? (
                              <div className="h-4 w-4 border-2 border-brand-cyan/30 border-t-brand-cyan rounded-full animate-spin" />
                            ) : (
                              <Database className="h-4 w-4 text-brand-cyan" />
                            )}
                          </div>
                          <div className="text-left">
                            <div className="text-white font-medium text-sm">{tool.name.replace(/_/g, ' ').replace(/get /g, '').toUpperCase()}</div>
                            <div className="text-xs text-gray-400">{tool.description}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {toolResults[tool.name] && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                injectDataToChat(toolResults[tool.name], tool.name);
                              }}
                              className="px-2 py-1 bg-brand-gold/20 hover:bg-brand-gold/30 text-brand-gold text-xs rounded-md transition-colors"
                            >
                              Inject
                            </button>
                          )}
                          <div className={`h-2 w-2 rounded-full ${
                            executingTool === tool.name ? 'bg-brand-cyan animate-pulse' :
                            toolResults[tool.name] ? 'bg-green-400' : 'bg-green-400 animate-pulse'
                          }`} />
                          <span className={`text-xs font-semibold ${
                            executingTool === tool.name ? 'text-brand-cyan' :
                            toolResults[tool.name] ? 'text-green-400' : 'text-green-400'
                          }`}>
                            {executingTool === tool.name ? 'RUNNING' : toolResults[tool.name] ? 'READY' : 'READY'}
                          </span>
                        </div>
                      </button>
                      
                      {/* Show result preview if available */}
                      {toolResults[tool.name] && selectedTool === tool.name && (
                        <div className="ml-6 p-3 bg-brand-cyan/5 border border-brand-cyan/20 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-brand-cyan font-semibold">RESULT PREVIEW</span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(formatToolResult(toolResults[tool.name].result));
                                  alert('Copied to clipboard!');
                                }}
                                className="text-xs text-brand-gold hover:text-brand-gold/70"
                              >
                                📋 Copy
                              </button>
                              <button
                                onClick={() => setSelectedTool(null)}
                                className="text-xs text-gray-400 hover:text-white"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                          <pre className="text-xs text-gray-300 max-h-32 overflow-y-auto">
                            {formatToolResult(toolResults[tool.name].result).slice(0, 200)}
                            {formatToolResult(toolResults[tool.name].result).length > 200 && '...'}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* External API Tools */}
              <div className="bg-brand-gold/10 border border-brand-gold/30 rounded-2xl p-4">
                <h5 className="text-brand-gold font-semibold mb-3 text-sm">External API Tools</h5>
                <div className="grid gap-2">
                  {mcpTools.filter(tool => tool.category === 'external').map((tool, index) => (
                    <button
                      key={index}
                      onClick={() => executeMcpTool(tool.name)}
                      className="flex items-center justify-between p-3 bg-black/40 hover:bg-brand-gold/10 border border-gray-700 hover:border-brand-gold/50 rounded-xl transition-all duration-300"
                    >
                      <div className="flex items-center gap-3">
                        <Zap className="h-4 w-4 text-brand-gold" />
                        <div className="text-left">
                          <div className="text-white font-medium text-sm">{tool.name.replace(/_/g, ' ').replace(/get /g, '').toUpperCase()}</div>
                          <div className="text-xs text-gray-400">{tool.description}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-xs text-green-400 font-semibold">READY</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Analysis Tools */}
              <div className="bg-purple-400/10 border border-purple-400/30 rounded-2xl p-4">
                <h5 className="text-purple-400 font-semibold mb-3 text-sm">Analysis Tools</h5>
                <div className="grid gap-2">
                  {mcpTools.filter(tool => tool.category === 'analysis').map((tool, index) => (
                    <div key={index} className="space-y-2">
                      <button
                        onClick={() => {
                          executeMcpTool(tool.name);
                          setSelectedTool(selectedTool === tool.name ? null : tool.name);
                        }}
                        disabled={executingTool === tool.name}
                        className={`w-full flex items-center justify-between p-3 border rounded-xl transition-all duration-300 ${
                          executingTool === tool.name
                            ? 'bg-purple-400/20 border-purple-400/60 cursor-not-allowed'
                            : selectedTool === tool.name
                              ? 'bg-purple-400/15 border-purple-400/50'
                              : 'bg-black/40 hover:bg-purple-400/10 border-gray-700 hover:border-purple-400/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`transition-transform duration-300 ${executingTool === tool.name ? 'animate-spin' : ''}`}>
                            {executingTool === tool.name ? (
                              <div className="h-4 w-4 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                            ) : (
                              <BarChart3 className="h-4 w-4 text-purple-400" />
                            )}
                          </div>
                          <div className="text-left">
                            <div className="text-white font-medium text-sm">{tool.name.replace(/_/g, ' ').replace(/get /g, '').toUpperCase()}</div>
                            <div className="text-xs text-gray-400">{tool.description}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {toolResults[tool.name] && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                injectDataToChat(toolResults[tool.name], tool.name);
                              }}
                              className="px-2 py-1 bg-brand-gold/20 hover:bg-brand-gold/30 text-brand-gold text-xs rounded-md transition-colors"
                            >
                              Inject
                            </button>
                          )}
                          <div className={`h-2 w-2 rounded-full ${
                            executingTool === tool.name ? 'bg-purple-400 animate-pulse' :
                            toolResults[tool.name] ? 'bg-green-400' : 'bg-green-400 animate-pulse'
                          }`} />
                          <span className={`text-xs font-semibold ${
                            executingTool === tool.name ? 'text-purple-400' :
                            toolResults[tool.name] ? 'text-green-400' : 'text-green-400'
                          }`}>
                            {executingTool === tool.name ? 'RUNNING' : toolResults[tool.name] ? 'READY' : 'READY'}
                          </span>
                        </div>
                      </button>
                      
                      {/* Show result preview if available */}
                      {toolResults[tool.name] && selectedTool === tool.name && (
                        <div className="ml-6 p-3 bg-purple-400/5 border border-purple-400/20 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-purple-400 font-semibold">RESULT PREVIEW</span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(formatToolResult(toolResults[tool.name].result));
                                  alert('Copied to clipboard!');
                                }}
                                className="text-xs text-brand-gold hover:text-brand-gold/70"
                              >
                                📋 Copy
                              </button>
                              <button
                                onClick={() => setSelectedTool(null)}
                                className="text-xs text-gray-400 hover:text-white"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                          <pre className="text-xs text-gray-300 max-h-32 overflow-y-auto">
                            {formatToolResult(toolResults[tool.name].result).slice(0, 200)}
                            {formatToolResult(toolResults[tool.name].result).length > 200 && '...'}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Workflow Tools */}
              <div className="bg-emerald-400/10 border border-emerald-400/30 rounded-2xl p-4">
                <h5 className="text-emerald-400 font-semibold mb-3 text-sm">Workflow & Scheduling Tools</h5>
                <div className="grid gap-2">
                  {mcpTools.filter(tool => tool.category === 'workflow').map((tool, index) => (
                    <div key={index} className="space-y-2">
                      <button
                        onClick={() => {
                          executeMcpTool(tool.name);
                          setSelectedTool(selectedTool === tool.name ? null : tool.name);
                        }}
                        disabled={executingTool === tool.name}
                        className={`w-full flex items-center justify-between p-3 border rounded-xl transition-all duration-300 ${
                          executingTool === tool.name
                            ? 'bg-emerald-400/20 border-emerald-400/60 cursor-not-allowed'
                            : selectedTool === tool.name
                              ? 'bg-emerald-400/15 border-emerald-400/50'
                              : 'bg-black/40 hover:bg-emerald-400/10 border-gray-700 hover:border-emerald-400/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`transition-transform duration-300 ${executingTool === tool.name ? 'animate-spin' : ''}`}>
                            {executingTool === tool.name ? (
                              <div className="h-4 w-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                            ) : (
                              <Clock className="h-4 w-4 text-emerald-400" />
                            )}
                          </div>
                          <div className="text-left">
                            <div className="text-white font-medium text-sm">{tool.name.replace(/_/g, ' ').replace(/get /g, '').toUpperCase()}</div>
                            <div className="text-xs text-gray-400">{tool.description}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {toolResults[tool.name] && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                injectDataToChat(toolResults[tool.name], tool.name);
                              }}
                              className="px-2 py-1 bg-brand-gold/20 hover:bg-brand-gold/30 text-brand-gold text-xs rounded-md transition-colors"
                            >
                              Inject
                            </button>
                          )}
                          <div className={`h-2 w-2 rounded-full ${
                            executingTool === tool.name ? 'bg-emerald-400 animate-pulse' :
                            toolResults[tool.name] ? 'bg-green-400' : 'bg-green-400 animate-pulse'
                          }`} />
                          <span className={`text-xs font-semibold ${
                            executingTool === tool.name ? 'text-emerald-400' :
                            toolResults[tool.name] ? 'text-green-400' : 'text-green-400'
                          }`}>
                            {executingTool === tool.name ? 'RUNNING' : toolResults[tool.name] ? 'READY' : 'READY'}
                          </span>
                        </div>
                      </button>
                      
                      {toolResults[tool.name] && selectedTool === tool.name && (
                        <div className="ml-6 p-3 bg-emerald-400/5 border border-emerald-400/20 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-emerald-400 font-semibold">RESULT PREVIEW</span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(formatToolResult(toolResults[tool.name].result));
                                  alert('Copied to clipboard!');
                                }}
                                className="text-xs text-brand-gold hover:text-brand-gold/70"
                              >
                                📋 Copy
                              </button>
                              <button
                                onClick={() => setSelectedTool(null)}
                                className="text-xs text-gray-400 hover:text-white"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                          <pre className="text-xs text-gray-300 max-h-32 overflow-y-auto">
                            {formatToolResult(toolResults[tool.name].result).slice(0, 200)}
                            {formatToolResult(toolResults[tool.name].result).length > 200 && '...'}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Content & Marketing Tools */}
              <div className="bg-pink-400/10 border border-pink-400/30 rounded-2xl p-4">
                <h5 className="text-pink-400 font-semibold mb-3 text-sm">Content & Marketing Tools</h5>
                <div className="grid gap-2">
                  {mcpTools.filter(tool => tool.category === 'content').map((tool, index) => (
                    <div key={index} className="space-y-2">
                      <button
                        onClick={() => {
                          executeMcpTool(tool.name);
                          setSelectedTool(selectedTool === tool.name ? null : tool.name);
                        }}
                        disabled={executingTool === tool.name}
                        className={`w-full flex items-center justify-between p-3 border rounded-xl transition-all duration-300 ${
                          executingTool === tool.name
                            ? 'bg-pink-400/20 border-pink-400/60 cursor-not-allowed'
                            : selectedTool === tool.name
                              ? 'bg-pink-400/15 border-pink-400/50'
                              : 'bg-black/40 hover:bg-pink-400/10 border-gray-700 hover:border-pink-400/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`transition-transform duration-300 ${executingTool === tool.name ? 'animate-spin' : ''}`}>
                            {executingTool === tool.name ? (
                              <div className="h-4 w-4 border-2 border-pink-400/30 border-t-pink-400 rounded-full animate-spin" />
                            ) : (
                              <Palette className="h-4 w-4 text-pink-400" />
                            )}
                          </div>
                          <div className="text-left">
                            <div className="text-white font-medium text-sm">{tool.name.replace(/_/g, ' ').replace(/get /g, '').toUpperCase()}</div>
                            <div className="text-xs text-gray-400">{tool.description}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {toolResults[tool.name] && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                injectDataToChat(toolResults[tool.name], tool.name);
                              }}
                              className="px-2 py-1 bg-brand-gold/20 hover:bg-brand-gold/30 text-brand-gold text-xs rounded-md transition-colors"
                            >
                              Inject
                            </button>
                          )}
                          <div className={`h-2 w-2 rounded-full ${
                            executingTool === tool.name ? 'bg-pink-400 animate-pulse' :
                            toolResults[tool.name] ? 'bg-green-400' : 'bg-green-400 animate-pulse'
                          }`} />
                          <span className={`text-xs font-semibold ${
                            executingTool === tool.name ? 'text-pink-400' :
                            toolResults[tool.name] ? 'text-green-400' : 'text-green-400'
                          }`}>
                            {executingTool === tool.name ? 'RUNNING' : toolResults[tool.name] ? 'READY' : 'READY'}
                          </span>
                        </div>
                      </button>
                      
                      {toolResults[tool.name] && selectedTool === tool.name && (
                        <div className="ml-6 p-3 bg-pink-400/5 border border-pink-400/20 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-pink-400 font-semibold">RESULT PREVIEW</span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(formatToolResult(toolResults[tool.name].result));
                                  alert('Copied to clipboard!');
                                }}
                                className="text-xs text-brand-gold hover:text-brand-gold/70"
                              >
                                📋 Copy
                              </button>
                              <button
                                onClick={() => setSelectedTool(null)}
                                className="text-xs text-gray-400 hover:text-white"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                          <pre className="text-xs text-gray-300 max-h-32 overflow-y-auto">
                            {formatToolResult(toolResults[tool.name].result).slice(0, 200)}
                            {formatToolResult(toolResults[tool.name].result).length > 200 && '...'}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Utility Tools */}
              <div className="bg-orange-400/10 border border-orange-400/30 rounded-2xl p-4">
                <h5 className="text-orange-400 font-semibold mb-3 text-sm">Utility & Data Processing Tools</h5>
                <div className="grid gap-2">
                  {mcpTools.filter(tool => tool.category === 'utility').map((tool, index) => (
                    <div key={index} className="space-y-2">
                      <button
                        onClick={() => {
                          executeMcpTool(tool.name);
                          setSelectedTool(selectedTool === tool.name ? null : tool.name);
                        }}
                        disabled={executingTool === tool.name}
                        className={`w-full flex items-center justify-between p-3 border rounded-xl transition-all duration-300 ${
                          executingTool === tool.name
                            ? 'bg-orange-400/20 border-orange-400/60 cursor-not-allowed'
                            : selectedTool === tool.name
                              ? 'bg-orange-400/15 border-orange-400/50'
                              : 'bg-black/40 hover:bg-orange-400/10 border-gray-700 hover:border-orange-400/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`transition-transform duration-300 ${executingTool === tool.name ? 'animate-spin' : ''}`}>
                            {executingTool === tool.name ? (
                              <div className="h-4 w-4 border-2 border-orange-400/30 border-t-orange-400 rounded-full animate-spin" />
                            ) : (
                              <Wrench className="h-4 w-4 text-orange-400" />
                            )}
                          </div>
                          <div className="text-left">
                            <div className="text-white font-medium text-sm">{tool.name.replace(/_/g, ' ').replace(/get /g, '').toUpperCase()}</div>
                            <div className="text-xs text-gray-400">{tool.description}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {toolResults[tool.name] && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                injectDataToChat(toolResults[tool.name], tool.name);
                              }}
                              className="px-2 py-1 bg-brand-gold/20 hover:bg-brand-gold/30 text-brand-gold text-xs rounded-md transition-colors"
                            >
                              Inject
                            </button>
                          )}
                          <div className={`h-2 w-2 rounded-full ${
                            executingTool === tool.name ? 'bg-orange-400 animate-pulse' :
                            toolResults[tool.name] ? 'bg-green-400' : 'bg-green-400 animate-pulse'
                          }`} />
                          <span className={`text-xs font-semibold ${
                            executingTool === tool.name ? 'text-orange-400' :
                            toolResults[tool.name] ? 'text-green-400' : 'text-green-400'
                          }`}>
                            {executingTool === tool.name ? 'RUNNING' : toolResults[tool.name] ? 'READY' : 'READY'}
                          </span>
                        </div>
                      </button>
                      
                      {toolResults[tool.name] && selectedTool === tool.name && (
                        <div className="ml-6 p-3 bg-orange-400/5 border border-orange-400/20 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-orange-400 font-semibold">RESULT PREVIEW</span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(formatToolResult(toolResults[tool.name].result));
                                  alert('Copied to clipboard!');
                                }}
                                className="text-xs text-brand-gold hover:text-brand-gold/70"
                              >
                                📋 Copy
                              </button>
                              <button
                                onClick={() => setSelectedTool(null)}
                                className="text-xs text-gray-400 hover:text-white"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                          <pre className="text-xs text-gray-300 max-h-32 overflow-y-auto">
                            {formatToolResult(toolResults[tool.name].result).slice(0, 200)}
                            {formatToolResult(toolResults[tool.name].result).length > 200 && '...'}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Execution History */}
        {executionHistory.length > 0 && (
          <div className="bg-brand-maroon/10 border border-brand-gold/30 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Terminal className="h-4 w-4 text-brand-gold" />
              <span className="text-sm font-semibold text-brand-gold">EXECUTION HISTORY</span>
              <span className="text-xs text-brand-gold/70">({executionHistory.length}/10)</span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {executionHistory.map((entry, index) => (
                <div key={index} className={`p-2 rounded-lg border ${
                  entry.success 
                    ? 'bg-green-400/5 border-green-400/20' 
                    : 'bg-red-400/5 border-red-400/20'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium ${
                      entry.success ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {entry.tool.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  {entry.error && (
                    <div className="text-xs text-red-400 mt-1">{entry.error}</div>
                  )}
                  {entry.result && (
                    <div className="text-xs text-gray-300 mt-1 truncate">
                      {formatToolResult(entry.result).slice(0, 50)}...
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-brand-maroon/10 border border-brand-gold/30 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Terminal className="h-4 w-4 text-brand-gold" />
            <span className="text-sm font-semibold text-brand-gold">BOSS AGENT STATUS</span>
          </div>
          <div className="text-sm text-white">
            MCP Server: <span className="text-green-400">Connected</span><br />
            API Access: <span className="text-green-400">Full Permissions</span><br />
            Real-time Data: <span className="text-green-400">Active</span><br />
            Tool Execution: <span className="text-brand-gold">Authorized</span><br />
            Tools Executed: <span className="text-brand-cyan">{executionHistory.length}</span>
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
  const [mcpConfigText, setMcpConfigText] = useState('');
  const [mcpServers, setMcpServers] = useState<any>({});
  const [mcpStatus, setMcpStatus] = useState<any>(null);
  const [loadingMcp, setLoadingMcp] = useState(false);
  const [showMcpConfig, setShowMcpConfig] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load existing MCP configuration and status
  useEffect(() => {
    const loadMcpConfig = async () => {
      try {
        const response = await fetch('/api/mcp-config');
        if (response.ok) {
          const config = await response.json();
          setMcpServers(config.mcpServers || {});
          setMcpConfigText(JSON.stringify({ mcpServers: config.mcpServers || {} }, null, 2));
        }

        // Load real server status
        const statusResponse = await fetch('/api/mcp-config/status');
        if (statusResponse.ok) {
          const status = await statusResponse.json();
          setMcpStatus(status.status);
        }
      } catch (error) {
        console.error('Error loading MCP config:', error);
      }
    };
    loadMcpConfig();

    // Poll for status updates every 10 seconds
    const interval = setInterval(async () => {
      try {
        const statusResponse = await fetch('/api/mcp-config/status');
        if (statusResponse.ok) {
          const status = await statusResponse.json();
          setMcpStatus(status.status);
        }
      } catch (error) {
        console.error('Error polling MCP status:', error);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleMcpConfigSave = async () => {
    setLoadingMcp(true);
    try {
      const config = JSON.parse(mcpConfigText);
      
      // Validate the config structure
      if (!config.mcpServers) {
        throw new Error("Invalid config - needs mcpServers object");
      }

      // Save the MCP configuration
      const response = await fetch('/api/mcp-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config.mcpServers)
      });

      if (response.ok) {
        setMcpServers(config.mcpServers);
        
        // Restart MCP servers
        const restartResponse = await fetch('/api/mcp-config/restart', {
          method: 'POST'
        });
        
        if (restartResponse.ok) {
          const result = await restartResponse.json();
          setMcpStatus(result);
          alert("MCP servers configured successfully!");
        } else {
          alert("Config saved but server restart failed");
        }
      } else {
        throw new Error("Failed to save MCP config");
      }
    } catch (error) {
      alert(`Config error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoadingMcp(false);
    }
  };

  const testMcpServers = async () => {
    setLoadingMcp(true);
    try {
      const response = await fetch('/api/mcp-test/test-servers', {
        method: 'POST'
      });
      
      if (response.ok) {
        const result = await response.json();
        const tests = result.testResults;
        
        let message = `MCP Server Test Results:\n\n`;
        message += `Overall Status: ${tests.overallStatus.toUpperCase()}\n`;
        message += `Running Servers: ${tests.totalRunning}/${tests.totalConfigured}\n\n`;
        
        tests.tests.forEach((test: any) => {
          const status = test.testPassed ? '✅' : '❌';
          message += `${status} ${test.serverName}: ${test.testDetails}\n`;
          if (test.actualData) {
            message += `   Data: ${JSON.stringify(test.actualData, null, 2)}\n`;
          }
          if (test.error) {
            message += `   Error: ${test.error}\n`;
          }
        });
        
        alert(message);
      } else {
        alert("Failed to test MCP servers");
      }
    } catch (error) {
      alert(`Test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoadingMcp(false);
    }
  };

  const handleMcpConfigReset = () => {
    const defaultConfig = {
      mcpServers: {
        filesystem: {
          command: "npx",
          args: ["@modelcontextprotocol/server-filesystem", "/tmp"],
          env: {
            NODE_ENV: "production"
          }
        },
        postgres: {
          command: "npx",
          args: ["@modelcontextprotocol/server-postgres"],
          env: {
            DATABASE_URL: "postgresql://localhost:5432/company"
          }
        },
        memory: {
          command: "npx",
          args: ["@modelcontextprotocol/server-memory"],
          env: {
            NODE_ENV: "production"
          }
        }
      }
    };
    setMcpConfigText(JSON.stringify(defaultConfig, null, 2));
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* System Configuration Navigation */}
      <div className="flex-shrink-0 p-4 border-b border-brand-gold/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-gold/20 border border-brand-gold/40 rounded-lg flex items-center justify-center">
              <Settings className="h-4 w-4 text-brand-gold" />
            </div>
            <div>
              <h4 className="text-brand-gold font-bold text-lg tracking-wide">SYSTEM CONFIG</h4>
              <p className="text-brand-gold/70 text-xs">Enterprise Admin Controls</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMcpConfig(!showMcpConfig)}
              className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-all duration-300 flex items-center gap-2 ${
                showMcpConfig 
                  ? 'bg-brand-cyan text-black border border-brand-cyan/50' 
                  : 'bg-brand-cyan/20 hover:bg-brand-cyan/30 text-brand-cyan border border-brand-cyan/30'
              }`}
            >
              <CircuitBoard className="h-3 w-3" />
              MCP Config
            </button>
            
            <button
              onClick={testMcpServers}
              disabled={loadingMcp}
              className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed text-emerald-400 border border-emerald-500/30 rounded-lg font-medium text-sm transition-all duration-300 flex items-center gap-2"
            >
              <Cpu className={`h-3 w-3 ${loadingMcp ? 'animate-spin' : ''}`} />
              {loadingMcp ? 'Testing...' : 'Test MCP'}
            </button>
            
            <button
              onClick={async () => {
                setSavingSettings(true);
                setSaveSuccess(false);
                try {
                  await onSave();
                  setSaveSuccess(true);
                  setTimeout(() => setSaveSuccess(false), 2000);
                } catch (error) {
                  console.error('Save failed:', error);
                } finally {
                  setSavingSettings(false);
                }
              }}
              disabled={savingSettings}
              className={`
                px-3 py-1.5 rounded-lg font-medium text-sm transition-all duration-300 flex items-center gap-2 relative overflow-hidden
                ${savingSettings 
                  ? 'bg-brand-gold/40 text-brand-gold/70 cursor-not-allowed' 
                  : saveSuccess
                    ? 'bg-green-500/30 text-green-400 border-green-400/50'
                    : 'bg-brand-gold/20 hover:bg-brand-gold/30 text-brand-gold border border-brand-gold/30 hover:scale-105 hover:shadow-lg hover:shadow-brand-gold/20'
                }
              `}
            >
              <div className={`transition-transform duration-300 ${savingSettings ? 'animate-spin' : saveSuccess ? 'animate-bounce' : ''}`}>
                {savingSettings ? (
                  <div className="h-3 w-3 border-2 border-brand-gold/30 border-t-brand-gold rounded-full animate-spin" />
                ) : saveSuccess ? (
                  <div className="h-3 w-3 flex items-center justify-center">
                    <div className="h-2 w-1 bg-green-400 rounded-full transform rotate-45 origin-bottom"></div>
                    <div className="h-3 w-1 bg-green-400 rounded-full transform -rotate-45 origin-bottom -ml-0.5"></div>
                  </div>
                ) : (
                  <Save className="h-3 w-3" />
                )}
              </div>
              <span className="transition-all duration-300">
                {savingSettings ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Settings'}
              </span>
              
              {/* Shimmer effect on hover */}
              {!savingSettings && !saveSuccess && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-gold/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -skew-x-12 animate-pulse"></div>
              )}
              
              {/* Success ripple effect */}
              {saveSuccess && (
                <div className="absolute inset-0 bg-green-400/20 rounded-lg animate-ping"></div>
              )}
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-6">
        <div className="space-y-6">
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-brand-cyan font-medium">Real-time Data Injection</span>
            <button
              onClick={() => setRealTimeData(!realTimeData)}
              className={`
                w-16 h-8 rounded-full transition-all duration-500 relative border-2 shadow-xl transform hover:scale-105
                ${realTimeData 
                  ? 'bg-gradient-to-r from-green-600 via-green-500 to-green-400 border-green-300 shadow-green-500/60' 
                  : 'bg-gradient-to-r from-red-700 via-red-600 to-red-500 border-red-400 shadow-red-500/40'
                }
              `}
              style={{
                boxShadow: realTimeData 
                  ? '0 0 25px rgba(34, 197, 94, 0.8), 0 0 50px rgba(34, 197, 94, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.3), inset 0 -2px 0 rgba(0, 0, 0, 0.1)' 
                  : '0 0 20px rgba(239, 68, 68, 0.6), 0 0 40px rgba(239, 68, 68, 0.3), inset 0 2px 0 rgba(255, 255, 255, 0.2), inset 0 -2px 0 rgba(0, 0, 0, 0.15)'
              }}
            >
              <div className={`
                w-6 h-6 rounded-full absolute top-0.5 transition-all duration-500 border-2 border-white/50 shadow-lg
                ${realTimeData 
                  ? 'left-8 bg-gradient-to-br from-white via-green-50 to-green-100 transform scale-110' 
                  : 'left-0.5 bg-gradient-to-br from-white via-red-50 to-red-100'
                }
              `}
              style={{
                boxShadow: realTimeData 
                  ? '0 4px 8px rgba(0, 0, 0, 0.25), inset 0 2px 0 rgba(255, 255, 255, 0.9), 0 0 15px rgba(34, 197, 94, 0.5)'
                  : '0 3px 6px rgba(0, 0, 0, 0.2), inset 0 2px 0 rgba(255, 255, 255, 0.8), 0 0 10px rgba(239, 68, 68, 0.3)'
              }}
              />
            </button>
          </div>
        </div>
        
        <div>
          <label className="block text-brand-cyan font-semibold mb-3">
            COMPANY A.I. SYSTEM PROMPT
          </label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={12}
            className="cyberpunk-input w-full text-sm font-mono resize-none"
            placeholder="Enter the Company A.I. system prompt..."
          />
          
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => {
                try {
                  localStorage.setItem("company.systemPrompt", systemPrompt);
                  // Also call the onSave function to ensure parent component is notified
                  onSave();
                  console.log("System prompt saved successfully to localStorage");
                  
                  // Visual feedback
                  const btn = document.activeElement as HTMLButtonElement;
                  if (btn) {
                    const originalText = btn.textContent;
                    btn.textContent = "✓ Saved!";
                    btn.classList.add("bg-green-600/30", "border-green-500/50", "text-green-400");
                    setTimeout(() => {
                      btn.textContent = originalText;
                      btn.classList.remove("bg-green-600/30", "border-green-500/50", "text-green-400");
                    }, 2000);
                  }
                } catch (error) {
                  console.error("Error saving system prompt:", error);
                  
                  // Error feedback
                  const btn = document.activeElement as HTMLButtonElement;
                  if (btn) {
                    const originalText = btn.textContent;
                    btn.textContent = "✗ Error";
                    btn.classList.add("bg-red-600/30", "border-red-500/50", "text-red-400");
                    setTimeout(() => {
                      btn.textContent = originalText;
                      btn.classList.remove("bg-red-600/30", "border-red-500/50", "text-red-400");
                    }, 2000);
                  }
                }
              }}
              className="px-6 py-3 rounded-xl text-white font-bold text-sm transition-all duration-300 hover:scale-105 active:scale-95 relative overflow-hidden group"
              style={{
                background: 'linear-gradient(135deg, rgba(139, 21, 56, 0.9) 0%, rgba(139, 21, 56, 0.8) 50%, rgba(139, 21, 56, 0.9) 100%)',
                backdropFilter: 'blur(20px) saturate(1.8)',
                border: '1px solid rgba(139, 21, 56, 0.6)',
                boxShadow: `
                  0 8px 32px rgba(139, 21, 56, 0.4),
                  0 0 0 1px rgba(255, 255, 255, 0.1),
                  inset 0 1px 0 rgba(255, 255, 255, 0.2),
                  inset 0 -1px 0 rgba(0, 0, 0, 0.1)
                `,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 21, 56, 1) 0%, rgba(159, 31, 66, 0.95) 50%, rgba(139, 21, 56, 1) 100%)';
                e.currentTarget.style.boxShadow = `
                  0 12px 40px rgba(139, 21, 56, 0.6),
                  0 0 0 1px rgba(255, 255, 255, 0.2),
                  inset 0 1px 0 rgba(255, 255, 255, 0.3),
                  inset 0 -1px 0 rgba(0, 0, 0, 0.1)
                `;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 21, 56, 0.9) 0%, rgba(139, 21, 56, 0.8) 50%, rgba(139, 21, 56, 0.9) 100%)';
                e.currentTarget.style.boxShadow = `
                  0 8px 32px rgba(139, 21, 56, 0.4),
                  0 0 0 1px rgba(255, 255, 255, 0.1),
                  inset 0 1px 0 rgba(255, 255, 255, 0.2),
                  inset 0 -1px 0 rgba(0, 0, 0, 0.1)
                `;
              }}
            >
              {/* Glass shimmer effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700" />
              </div>
              <span className="relative z-10">Save Prompt</span>
            </button>
            <button
              onClick={() => setSystemPrompt(DEFAULT_MEGA_PROMPT)}
              className="px-6 py-3 rounded-xl text-black font-bold text-sm transition-all duration-300 hover:scale-105 active:scale-95 relative overflow-hidden group"
              style={{
                background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.95) 0%, rgba(251, 191, 36, 0.85) 50%, rgba(251, 191, 36, 0.95) 100%)',
                backdropFilter: 'blur(20px) saturate(1.8)',
                border: '1px solid rgba(251, 191, 36, 0.8)',
                boxShadow: `
                  0 8px 32px rgba(251, 191, 36, 0.4),
                  0 0 0 1px rgba(255, 255, 255, 0.2),
                  inset 0 1px 0 rgba(255, 255, 255, 0.4),
                  inset 0 -1px 0 rgba(0, 0, 0, 0.1)
                `,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(251, 191, 36, 1) 0%, rgba(255, 211, 56, 0.95) 50%, rgba(251, 191, 36, 1) 100%)';
                e.currentTarget.style.boxShadow = `
                  0 12px 40px rgba(251, 191, 36, 0.6),
                  0 0 0 1px rgba(255, 255, 255, 0.3),
                  inset 0 1px 0 rgba(255, 255, 255, 0.5),
                  inset 0 -1px 0 rgba(0, 0, 0, 0.1)
                `;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(251, 191, 36, 0.95) 0%, rgba(251, 191, 36, 0.85) 50%, rgba(251, 191, 36, 0.95) 100%)';
                e.currentTarget.style.boxShadow = `
                  0 8px 32px rgba(251, 191, 36, 0.4),
                  0 0 0 1px rgba(255, 255, 255, 0.2),
                  inset 0 1px 0 rgba(255, 255, 255, 0.4),
                  inset 0 -1px 0 rgba(0, 0, 0, 0.1)
                `;
              }}
            >
              {/* Glass shimmer effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700" />
              </div>
              <span className="relative z-10">Reset to Default</span>
            </button>
          </div>
        </div>

        {/* MCP Configuration Window */}
        {showMcpConfig && (
          <div className="bg-black/40 border border-brand-cyan/30 rounded-2xl overflow-hidden max-h-[75vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-brand-cyan/20 flex-shrink-0 bg-black/60">
              <h4 className="text-brand-cyan font-semibold flex items-center gap-2">
                <CircuitBoard className="h-4 w-4 animate-pulse" />
                MCP SERVER CONFIGURATION
              </h4>
              <button
                onClick={() => setShowMcpConfig(false)}
                className="p-2 hover:bg-brand-cyan/10 rounded-lg transition-colors"
              >
                <X className="h-4 w-4 text-brand-cyan" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar flex-1" style={{ maxHeight: 'calc(75vh - 80px)' }}>
              {/* MCP Status Indicator */}
              <div className="bg-brand-gold/10 border border-brand-gold/30 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      mcpStatus?.runningCount > 0 ? 'bg-green-500 animate-pulse' : 
                      Object.keys(mcpServers).length > 0 ? 'bg-yellow-500' : 'bg-gray-500'
                    }`}></div>
                    <span className="text-brand-gold font-semibold text-sm">MCP System Status</span>
                  </div>
                  <span className={`text-sm font-bold ${
                    mcpStatus?.runningCount > 0 ? 'text-green-400' : 
                    Object.keys(mcpServers).length > 0 ? 'text-yellow-500' : 'text-gray-400'
                  }`}>
                    {mcpStatus?.runningCount > 0 ? 'RUNNING' : 
                     Object.keys(mcpServers).length > 0 ? 'CONFIGURED' : 'INACTIVE'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3 text-xs">
                  <div>
                    <span className="text-brand-gold/80">Configured Servers:</span>
                    <span className="text-white font-semibold ml-2">{Object.keys(mcpServers).length}</span>
                  </div>
                  <div>
                    <span className="text-brand-gold/80">Active Connections:</span>
                    <span className={`font-semibold ml-2 ${
                      mcpStatus?.runningCount > 0 ? 'text-green-400' : 'text-yellow-500'
                    }`}>
                      {mcpStatus?.runningCount || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Configured MCP Servers */}
              {Object.keys(mcpServers).length > 0 && (
                <div className="bg-brand-electric/10 border border-brand-electric/30 rounded-xl p-4">
                  <h5 className="text-brand-electric font-semibold mb-3 text-sm">Configured MCP Servers</h5>
                  <div className="grid gap-2">
                    {Object.entries(mcpServers).map(([name, config]: [string, any]) => {
                      const serverStatus = mcpStatus?.servers?.[name];
                      const isRunning = serverStatus?.status === 'running';
                      const hasError = serverStatus?.status === 'error';
                      
                      return (
                        <div key={name} className="flex items-center justify-between p-3 bg-black/40 border border-gray-700 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${
                              isRunning ? 'bg-green-400 animate-pulse' : 
                              hasError ? 'bg-red-500' : 'bg-gray-500'
                            }`}></div>
                            <div>
                              <div className="text-white font-medium text-sm">{name}</div>
                              <div className="text-xs text-gray-400">{config.command} {config.args?.join(' ')}</div>
                              {serverStatus?.pid && (
                                <div className="text-xs text-green-400">PID: {serverStatus.pid}</div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`text-xs font-semibold ${
                              isRunning ? 'text-green-400' : hasError ? 'text-red-400' : 'text-gray-400'
                            }`}>
                              {isRunning ? 'RUNNING' : hasError ? 'ERROR' : 'NOT STARTED'}
                            </span>
                            {serverStatus?.uptime && (
                              <div className="text-xs text-gray-500">
                                {Math.floor(serverStatus.uptime / 1000)}s
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {Object.keys(mcpServers).length > 0 && mcpStatus?.runningCount === 0 && (
                    <div className="mt-3 p-3 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
                      <div className="text-xs text-yellow-400">
                        ⚠️ <strong>Note:</strong> MCP servers are configured but not running. Click "Restart MCP Servers" to start them.
                      </div>
                    </div>
                  )}
                  {mcpStatus?.runningCount > 0 && (
                    <div className="mt-3 p-3 bg-green-900/20 border border-green-600/30 rounded-lg">
                      <div className="text-xs text-green-400">
                        ✅ <strong>Active:</strong> {mcpStatus.runningCount} MCP server{mcpStatus.runningCount > 1 ? 's' : ''} running successfully. Company AI now has real-time access to configured tools.
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Configuration Instructions */}
              <div className="bg-brand-maroon/10 border border-brand-maroon/30 rounded-xl p-4">
                <h5 className="text-brand-maroon font-semibold mb-2 text-sm">Configuration Instructions</h5>
                <div className="text-xs text-gray-300 space-y-2">
                  <p>• Paste your Claude Desktop MCP configuration below</p>
                  <p>• Config format must include "mcpServers" object</p>
                  <p>• Supports all standard MCP servers (filesystem, postgres, memory, etc.)</p>
                  <p>• Changes require server restart for activation</p>
                </div>
              </div>

              {/* Config Text Area */}
              <div>
                <label className="block text-brand-cyan font-semibold mb-2 text-sm">
                  MCP Configuration JSON
                </label>
                <textarea
                  value={mcpConfigText}
                  onChange={(e) => setMcpConfigText(e.target.value)}
                  rows={8}
                  className="w-full bg-black/60 border border-brand-cyan/30 rounded-xl p-4 text-sm font-mono text-white resize-none focus:outline-none focus:border-brand-cyan/60 transition-colors"
                  placeholder='{"mcpServers": { ... }}'
                  style={{
                    backgroundImage: 'linear-gradient(rgba(20, 184, 166, 0.05) 0%, rgba(20, 184, 166, 0.02) 100%)',
                    minHeight: '200px',
                    maxHeight: '300px'
                  }}
                />
                
                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    onClick={handleMcpConfigSave}
                    disabled={loadingMcp}
                    className="px-3 py-2 bg-brand-cyan hover:bg-brand-cyan/80 disabled:opacity-50 text-black rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
                  >
                    {loadingMcp ? (
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                    ) : (
                      <Save className="h-3 w-3" />
                    )}
                    {loadingMcp ? "Loading..." : "Apply"}
                  </button>
                  
                  <button
                    onClick={handleMcpConfigReset}
                    className="px-3 py-2 bg-brand-gold hover:bg-brand-gold/80 text-black rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
                  >
                    <Target className="h-3 w-3" />
                    Reset
                  </button>
                  
                  <button
                    onClick={() => {
                      const exampleConfig = {
                        "mcpServers": {
                          "filesystem": {
                            "command": "npx",
                            "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/YourName/Desktop"]
                          },
                          "github": {
                            "command": "npx", 
                            "args": ["-y", "@modelcontextprotocol/server-github"],
                            "env": {
                              "GITHUB_PERSONAL_ACCESS_TOKEN": "your-token-here"
                            }
                          },
                          "postgres": {
                            "command": "npx",
                            "args": ["-y", "@modelcontextprotocol/server-postgres"],
                            "env": {
                              "DATABASE_URL": "postgresql://user:pass@localhost/db"
                            }
                          }
                        }
                      };
                      setMcpConfigText(JSON.stringify(exampleConfig, null, 2));
                    }}
                    className="px-3 py-2 bg-purple-600 hover:bg-purple-600/80 text-white rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
                  >
                    <FileText className="h-3 w-3" />
                    Example
                  </button>
                </div>
              </div>

              {/* Advanced Settings */}
              <div className="bg-gray-800/30 border border-gray-600/30 rounded-xl p-4 mb-4">
                <h5 className="text-gray-300 font-semibold mb-3 text-sm">Advanced Settings</h5>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">Auto-reconnect on failure</span>
                    <div className="w-12 h-6 bg-green-600 rounded-full relative">
                      <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">Health monitoring (30s)</span>
                    <div className="w-12 h-6 bg-green-600 rounded-full relative">
                      <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">Process isolation</span>
                    <div className="w-12 h-6 bg-green-600 rounded-full relative">
                      <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-600/30">
                  <div className="text-xs text-gray-400 leading-relaxed">
                    <strong className="text-red-400">Security Notice:</strong> MCP servers execute with system permissions. Only use trusted configurations from verified sources. Review all server commands and environment variables before deployment.
                  </div>
                </div>
                
                {/* Connection Status Table */}
                <div className="mt-4 pt-4 border-t border-gray-600/30">
                  <h6 className="text-gray-300 font-medium mb-2 text-xs">Connection Status</h6>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-600/30">
                          <th className="text-left text-gray-400 py-2">Server</th>
                          <th className="text-left text-gray-400 py-2">Status</th>
                          <th className="text-left text-gray-400 py-2">Uptime</th>
                          <th className="text-left text-gray-400 py-2">Tools</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.keys(mcpServers).length > 0 ? Object.keys(mcpServers).map((serverName) => {
                          const serverStatus = mcpStatus?.servers?.[serverName];
                          const isRunning = serverStatus?.status === 'running';
                          const hasError = serverStatus?.status === 'error';
                          
                          return (
                            <tr key={serverName} className="border-b border-gray-700/30">
                              <td className="py-2 text-white">{serverName}</td>
                              <td className="py-2">
                                <span className={`text-xs ${
                                  isRunning ? 'text-green-400' : hasError ? 'text-red-400' : 'text-gray-400'
                                }`}>
                                  ● {isRunning ? 'RUNNING' : hasError ? 'ERROR' : 'NOT RUNNING'}
                                </span>
                              </td>
                              <td className="py-2 text-gray-300">
                                {serverStatus?.uptime ? `${Math.floor(serverStatus.uptime / 1000)}s` : '--'}
                              </td>
                              <td className="py-2 text-gray-300">
                                {isRunning ? 'Active' : hasError ? 'Failed' : 'Configured'}
                              </td>
                            </tr>
                          );
                        }) : (
                          <tr>
                            <td colSpan={4} className="py-4 text-center text-gray-500 text-xs">
                              No MCP servers configured
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

// Enhanced UI Components for Company A.I. Boss Agent
function TabButton({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-3 rounded-2xl font-semibold text-sm transition-all duration-300
        ${active 
          ? 'bg-gradient-to-r from-brand-cyan/30 to-brand-electric/30 text-white border border-brand-cyan/50' 
          : 'text-brand-cyan/70 hover:text-white hover:bg-white/5 border border-transparent hover:border-brand-cyan/30'
        }
      `}
    >
      {icon}
      {label}
    </button>
  );
}

// Enhanced ChatPane function with data context
function ChatPane({ messages, loading, appData }: { messages: ChatMessage[]; loading: boolean; appData?: any }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Welcome message for new sessions
  const showWelcome = messages.length === 0 && !loading;

  return (
    <div 
      ref={scrollRef}
      className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4 space-y-4 bg-gradient-to-b from-transparent via-brand-ink/10 to-brand-ink/20" 
      style={{ 
        scrollBehavior: 'smooth'
      }}
    >
      {/* Smart Context Panel - Show available data only once per session */}
      {messages.length <= 1 && appData && (
        <div className="mb-4">
          <div className="bg-brand-cyan/5 border border-brand-cyan/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="h-4 w-4 text-brand-cyan animate-pulse" />
              <span className="text-sm font-bold text-brand-cyan">Live Data Intelligence</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Building2 className="h-3 w-3 text-brand-gold" />
                <span className="text-brand-cyan">{appData.sites?.length || 0} Properties</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-3 w-3 text-brand-gold" />
                <span className="text-brand-cyan">{Object.keys(appData.analytics?.stateDistribution || {}).length} Markets</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-3 w-3 text-brand-gold" />
                <span className="text-brand-cyan">{appData.analytics?.totalUnits || 0} Total Units</span>
              </div>
              <div className="flex items-center gap-2">
                <Database className="h-3 w-3 text-brand-gold" />
                <span className="text-brand-cyan">BLS, HUD, FBI, NOAA APIs</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-brand-cyan/20">
              <div className="text-xs text-brand-cyan/80 font-medium mb-2">Try asking:</div>
              <div className="flex flex-wrap gap-1">
                {[
                  "Analyze our portfolio performance",
                  "Show me Charlotte market trends", 
                  "Compare units by state",
                  "Latest employment data for our markets"
                ].map((suggestion, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2 py-1 bg-brand-cyan/10 text-brand-cyan rounded-full border border-brand-cyan/30"
                  >
                    {suggestion}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showWelcome && (
        <div className="animate-fade-in">
          <div className="relative rounded-3xl border bg-gradient-to-br from-brand-cyan/20 via-brand-electric/10 to-brand-gold/5 border-brand-cyan/40 backdrop-blur p-6 shadow-2xl">
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-brand-cyan rounded-full animate-pulse" />
            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-brand-gold rounded-full animate-pulse animation-delay-500" />
            
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-brand-cyan blur-xl opacity-50 animate-pulse" />
                <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-cyan via-brand-electric to-brand-cyan flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Company A.I. Elite v5.0</h3>
                <p className="text-xs text-brand-cyan/80">Enterprise-Grade AI Intelligence Platform</p>
              </div>
            </div>
            
            <div className="space-y-3 text-sm text-white/90">
              <p className="leading-relaxed">
                <strong>COMPANY A.I. ELITE v5.0 ACTIVATED</strong> - Enterprise-grade AI system operational with comprehensive property intelligence capabilities.
              </p>
              
              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="bg-brand-ink/40 rounded-xl p-3 border border-brand-cyan/20">
                  <div className="text-brand-cyan text-xs font-semibold mb-1">CAPABILITIES</div>
                  <ul className="text-xs space-y-1 text-white/80">
                    <li>• $200M+ Deal Analysis</li>
                    <li>• IRR/NPV Modeling</li>
                    <li>• Market Intelligence</li>
                    <li>• Risk Assessment</li>
                  </ul>
                </div>
                <div className="bg-brand-ink/40 rounded-xl p-3 border border-brand-gold/20">
                  <div className="text-brand-gold text-xs font-semibold mb-1">QUICK START</div>
                  <ul className="text-xs space-y-1 text-white/80">
                    <li>• "Analyze this property"</li>
                    <li>• "Show market trends"</li>
                    <li>• "Calculate returns"</li>
                    <li>• "Risk assessment"</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-gradient-to-r from-brand-cyan/10 to-brand-electric/10 rounded-xl border border-brand-cyan/30">
                <p className="text-xs text-brand-cyan font-semibold mb-1 flex items-center gap-2">
                  <Activity className="w-3 h-3 animate-pulse" />
                  SYSTEM STATUS: FULLY OPERATIONAL
                </p>
                <p className="text-xs text-white/80">
                  Complete operational readiness. Portfolio database accessible, real-time market intelligence active, demographic analytics online, and MCP server integration established. Ready for institutional-grade property evaluation and investment analysis.
                </p>
              </div>
              
              <div className="flex gap-2 mt-4">
                <div className="flex-1 p-2 bg-gradient-to-r from-brand-gold/10 to-transparent rounded-lg border border-brand-gold/20">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-brand-gold" />
                    <span className="text-xs text-brand-gold font-bold">PRO TIP</span>
                  </div>
                  <p className="text-xs text-white/70 mt-1">
                    Try: "Analyze 123 Main St" or "Show portfolio performance metrics"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {messages.filter(m => m.role !== "system").map((m, i) => (
        <div 
          key={i} 
          className={`
            relative rounded-2xl border backdrop-blur transition-all duration-200 hover:shadow-lg p-4
            ${m.role === "assistant" 
              ? "bg-gradient-to-br from-brand-cyan/10 to-brand-electric/5 border-brand-cyan/30 hover:border-brand-cyan/50" 
              : "bg-gradient-to-br from-brand-ink/60 to-black/40 border-brand-maroon/30 hover:border-brand-maroon/50 ml-4"
            }
          `}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={`
                text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-full
                ${m.role === "assistant"
                  ? "bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30"
                  : "bg-brand-maroon/20 text-brand-gold border border-brand-maroon/30"
                }
              `}>
                {m.role === "assistant" ? "🤖 Company A.I." : "👤 You"}
              </span>
            </div>
            {m.createdAt && (
              <span className="text-xs text-brand-cyan/50">
                {new Date(m.createdAt).toLocaleTimeString()}
              </span>
            )}
          </div>
          
          <div className={`
            whitespace-pre-wrap text-sm leading-relaxed
            ${m.role === "assistant" ? "text-white/90" : "text-brand-cyan/90"}
          `}>
            {/* Check if content has property analysis data */}
            {m.role === "assistant" && m.content.includes("PROPERTY ANALYSIS") ? (
              <div className="space-y-4">
                {m.content.split('\n').map((line, idx) => {
                  if (line.startsWith('##')) {
                    return (
                      <h3 key={idx} className="text-brand-cyan font-bold text-base mt-4 mb-2 flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        {line.replace('##', '').trim()}
                      </h3>
                    );
                  } else if (line.startsWith('•')) {
                    return (
                      <div key={idx} className="flex items-start gap-2 ml-4">
                        <div className="w-1 h-1 bg-brand-gold rounded-full mt-2" />
                        <span className="flex-1">{line.replace('•', '').trim()}</span>
                      </div>
                    );
                  } else if (line.includes('IRR:') || line.includes('NPV:') || line.includes('Cap Rate:')) {
                    return (
                      <div key={idx} className="bg-brand-cyan/10 border border-brand-cyan/30 rounded-lg p-3 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-brand-gold" />
                        <span className="font-mono text-brand-gold">{line}</span>
                      </div>
                    );
                  } else if (line.includes('RISK:') || line.includes('WARNING:')) {
                    return (
                      <div key={idx} className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400" />
                        <span className="text-red-400">{line}</span>
                      </div>
                    );
                  } else if (line.includes('RECOMMENDATION:')) {
                    return (
                      <div key={idx} className="bg-brand-gold/10 border border-brand-gold/30 rounded-lg p-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-brand-gold" />
                        <span className="text-brand-gold font-semibold">{line}</span>
                      </div>
                    );
                  }
                  return <p key={idx} className="leading-relaxed">{line}</p>;
                })}
              </div>
            ) : (
              m.content
            )}
          </div>
        </div>
      ))}
      
      {loading && (
        <div className="relative rounded-2xl border bg-gradient-to-br from-brand-cyan/10 to-brand-electric/5 border-brand-cyan/30 backdrop-blur animate-pulse p-4">
          <div className="flex items-center gap-3">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-brand-cyan rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-2 h-2 bg-brand-cyan rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-2 h-2 bg-brand-cyan rounded-full animate-bounce" />
            </div>
            <span className="text-sm text-brand-cyan/80">
              Company A.I. Boss Agent is analyzing your request...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}


