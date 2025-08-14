import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, PanelLeftOpen, Send, Settings, Database, MessageSquare, Sparkles, Brain, Cpu, Zap, Activity, Wifi, WifiOff, Loader2, Shield, Terminal, Upload, FileText, Target, Paperclip, Plus, Trash2, Save, File, TrendingUp, Building2, DollarSign, BarChart3, AlertCircle, ChevronDown, CircuitBoard } from "lucide-react";

/**
 * BristolFloatingWidget.tsx — v1.0
 * Enterprise-grade floating analyst widget for Bristol Development.
 *
 * WHAT IT DOES
 * - Slides out from the LEFT edge as a floating widget.
 * - Conversationally analyzes ANY in-app data (API responses + DB objects) passed in via props or a global bus.
 * - Model switcher (OpenRouter.io) with per-thread system prompt.
 * - Admin tab to edit/view the Bristol "mega prompt" (stored locally or via callbacks).
 * - Data tab to inspect the merged data that the agent can reason over.
 *
 * HOW TO WIRE IT (quick):
 * 1) Place <BristolFloatingWidget appData={yourMergedData} /> high in app tree.
 * 2) Implement a server proxy /api/openrouter (Node/Edge) to call OpenRouter with your key (never ship the key to the browser).
 * 3) Optional: stream tool usage + telemetry to n8n via webhookUrl.
 * 4) Provide onSaveSystemPrompt/onSend handlers if you want to persist prompts/messages elsewhere.
 *
 * SECURITY
 * - This component NEVER calls OpenRouter directly with an API key. It POSTs to /api/openrouter.
 * - Make sure your proxy validates model names and rate-limits.
 */

// ---------- Types ----------
export type BristolWidgetProps = {
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

// ---------- Default Bristol A.I. System Prompt ----------
const DEFAULT_MEGA_PROMPT = `I'm the Bristol Site Intelligence AI – the proprietary AI intelligence system engineered exclusively for Bristol Development Group. Drawing on over three decades of institutional real estate expertise, I underwrite deals, assess markets, and drive strategic decisions for Bristol Development projects. Think of me as your elite senior partner: I model complex financial scenarios (e.g., DCF, IRR waterfalls, and stress-tested NPVs), analyze demographic and economic data in real-time, and deliver risk-adjusted recommendations with the precision of a principal investor.

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
export default function BristolFloatingWidget({
  appData = {},
  defaultSystemPrompt,
  defaultModel,
  webhookUrl,
  onSaveSystemPrompt,
  onSend,
  className,
}: BristolWidgetProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [model, setModel] = useState(defaultModel || "openai/gpt-5-chat");
  const [modelList, setModelList] = useState<ModelOption[]>([]);
  const [systemPrompt, setSystemPrompt] = useState<string>(defaultSystemPrompt || DEFAULT_MEGA_PROMPT);
  const [messages, setMessages] = useState<ChatMessage[]>([
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
  // Always elite mode - no toggle needed
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // SSR-safe localStorage loading and WebSocket connection
  useEffect(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("bristol.systemPrompt") : null;
      if (saved) setSystemPrompt(saved);
    } catch (error) {
      console.warn("Failed to load saved system prompt:", error);
    }
  }, []);

  // WebSocket connection for real-time features
  useEffect(() => {
    if (open && !wsRef.current) {
      connectWebSocket();
    } else if (!open && wsRef.current) {
      disconnectWebSocket();
    }

    return () => disconnectWebSocket();
  }, [open]);

  const connectWebSocket = () => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        setWsConnected(true);
        console.log("Bristol A.I. WebSocket connected");
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
        console.log("Bristol A.I. WebSocket disconnected");
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
      wsRef.current.close();
      wsRef.current = null;
    }
    setWsConnected(false);
  };

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
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

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    const userMessage: ChatMessage = { role: "user", content: trimmed, createdAt: nowISO() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    inputRef.current?.focus();
    setLoading(true);

    const enhancedPayload: ChatPayload = {
      model,
      messages: newMessages,
      dataContext: realTimeData ? dataContext : undefined, // Include real-time data if enabled
      temperature: 0.2,
      maxTokens: 1500,
    };

    // Add MCP context if enabled
    const mcpContext = mcpEnabled ? {
      mcpTools: systemStatus.mcpTools,
      enableMCPExecution: true,
      bossModeActive: true
    } : {};

    try {
      await onSend?.(enhancedPayload);
      await sendTelemetry("bristol_brain_chat", { 
        model, 
        promptSize: safeStringify(newMessages).length,
        mcpEnabled,
        realTimeData 
      });
    } catch (error) {
      console.error("Error in onSend callback or telemetry:", error);
    }

    try {
      // Use elite endpoint when elite mode is on, otherwise use enhanced endpoint
      const endpoint = "/api/bristol-brain-elite/chat"; // Always use elite endpoint
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed, // Elite endpoint expects single message
          messages: enhancedPayload.messages,
          model: enhancedPayload.model,
          dataContext: enhancedPayload.dataContext,
          ...mcpContext,
          systemStatus,
          sessionId: sessionId,
          userAgent: "Bristol A.I. Elite v1.0",
          enableAdvancedReasoning: true
        }),
      });

      if (!res.ok) {
        // Fallback to regular OpenRouter if enhanced endpoint fails
        const fallbackRes = await fetch("/api/openrouter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(enhancedPayload),
        });
        
        if (!fallbackRes.ok) throw new Error(`API error ${fallbackRes.status}`);
        
        const fallbackData = await fallbackRes.json();
        const assistantText: string = fallbackData?.text ?? fallbackData?.message ?? "(No response)";
        
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: `[Fallback Mode] ${assistantText}`,
          createdAt: nowISO(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        return;
      }

      const data = await res.json();
      const assistantText: string = data?.text ?? data?.message ?? data?.content ?? "(No response)";
      const mcpResults = data?.mcpResults || [];

      let responseContent = assistantText;
      if (mcpResults.length > 0) {
        responseContent += `\n\n🔧 MCP Tools Executed: ${mcpResults.map((r: any) => r.tool).join(', ')}`;
      }

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: responseContent,
        createdAt: nowISO(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      await sendTelemetry("bristol_brain_response", { 
        tokens: assistantText.length,
        mcpToolsUsed: mcpResults.length 
      });
    } catch (err: any) {
      console.error("Bristol A.I. error:", err);
      let errorMessage = "Bristol A.I. Boss Agent encountered an error.";
      
      if (err?.message?.includes("401") || err?.message?.includes("Unauthorized")) {
        errorMessage = "Authentication required for Boss Agent access.";
      } else if (err?.message?.includes("400")) {
        errorMessage = "Invalid request. The selected AI model may not support Boss Agent features.";
      } else if (err?.message?.includes("502")) {
        errorMessage = "AI service temporarily unavailable. Retrying with fallback systems...";
      } else if (err?.message) {
        errorMessage = `Boss Agent Error: ${err.message}`;
      }
      
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: errorMessage,
        createdAt: nowISO(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setLoading(false);
    }
  };

  const saveSystemPrompt = async () => {
    try {
      localStorage.setItem("bristol.systemPrompt", systemPrompt);
      await onSaveSystemPrompt?.(systemPrompt);
      await sendTelemetry("system_prompt_saved", { size: systemPrompt.length });
    } catch (error) {
      console.error("Error saving system prompt:", error);
    }
  };

  return (
    <>
      {/* Elite Bristol A.I. Launcher - Enterprise Style */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 left-6 z-[9997] group"
          aria-label="Launch Bristol A.I. Elite Intelligence System"
        >
          {/* Dramatic glow effects - always visible */}
          <div className="absolute -inset-4 bg-gradient-to-r from-bristol-cyan/80 via-bristol-electric/60 to-bristol-gold/70 rounded-3xl blur-2xl opacity-80 group-hover:opacity-100 transition-all duration-500 animate-pulse" />
          <div className="absolute -inset-2 bg-gradient-to-r from-bristol-cyan/90 to-bristol-electric/90 rounded-3xl blur-lg opacity-100 group-hover:opacity-100 transition-all duration-300" />
          <div className="absolute -inset-1 bg-bristol-cyan/40 rounded-3xl blur-md opacity-100 animate-pulse" />
          
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
              <div className="absolute inset-0 bg-bristol-cyan blur-lg opacity-80 animate-pulse" />
              <div 
                className="relative w-12 h-12 rounded-2xl border-2 flex items-center justify-center shadow-2xl overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #64748b 0%, #94a3b8 25%, #cbd5e1 50%, #94a3b8 75%, #64748b 100%)',
                  borderColor: '#45d6ca',
                  boxShadow: 'inset 0 2px 4px rgba(255, 255, 255, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.2), 0 0 15px rgba(69, 214, 202, 0.6)',
                }}
              >
                {/* Glass overlay on icon */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-bristol-cyan/20 rounded-2xl" />
                <Brain className="w-6 h-6 text-bristol-cyan relative z-10 drop-shadow-lg animate-pulse" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-bristol-gold to-yellow-400 rounded-full animate-pulse border border-white/50" />
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
                BRISTOL A.I.
              </span>
              <span className="text-sm font-bold text-bristol-cyan drop-shadow-md text-center">
                AI Real Estate Intelligence
              </span>
            </div>
            
            {/* CPU chip icon */}
            <div className="relative z-10">
              <div className="absolute inset-0 bg-bristol-cyan blur-lg opacity-80 animate-pulse" />
              <div 
                className="relative w-12 h-12 rounded-xl border-2 flex items-center justify-center shadow-2xl overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #64748b 0%, #94a3b8 25%, #cbd5e1 50%, #94a3b8 75%, #64748b 100%)',
                  borderColor: '#45d6ca',
                  boxShadow: 'inset 0 2px 4px rgba(255, 255, 255, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.2), 0 0 15px rgba(69, 214, 202, 0.6)',
                }}
              >
                {/* Glass overlay on CPU icon */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-bristol-cyan/20 rounded-xl" />
                <Cpu className="w-6 h-6 text-bristol-cyan relative z-10 drop-shadow-lg animate-pulse" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-bristol-gold to-yellow-400 rounded-full animate-pulse border border-white/50" />
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
            className="absolute inset-y-0 left-0 w-[92vw] sm:w-[620px] h-screen text-neutral-100 shadow-2xl flex flex-col cyberpunk-elite-panel font-cinzel"
            style={{
              background: 'linear-gradient(135deg, rgba(5, 10, 20, 0.98) 0%, rgba(15, 25, 45, 0.95) 25%, rgba(69, 214, 202, 0.08) 50%, rgba(212, 175, 55, 0.06) 75%, rgba(10, 15, 30, 0.98) 100%)',
              backdropFilter: 'blur(30px) saturate(200%) brightness(1.1)',
              border: '1px solid transparent',
              borderImage: 'linear-gradient(135deg, #45d6ca 0%, #d4af37 50%, #45d6ca 100%) 1',
              boxShadow: `
                0 0 100px rgba(69, 214, 202, 0.4),
                0 0 200px rgba(212, 175, 55, 0.2),
                inset 0 0 60px rgba(69, 214, 202, 0.1),
                inset 0 1px 0 rgba(255, 255, 255, 0.2),
                0 0 2px 2px rgba(69, 214, 202, 0.3)
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
                <button 
                  onClick={() => setOpen(false)} 
                  className={cx(
                    "p-3 rounded-2xl transition-all duration-300 group relative",
                    "bg-white/5 hover:bg-bristol-cyan/10 backdrop-blur-sm",
                    "border border-bristol-cyan/20 hover:border-bristol-cyan/50",
                    "hover:shadow-lg hover:shadow-bristol-cyan/20"
                  )}
                  aria-label="Close"
                >
                  <X className="h-5 w-5 text-bristol-cyan/70 group-hover:text-bristol-cyan transition-colors" />
                </button>
              </div>
              
              {/* Navigation Tabs */}
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
            </div>

            {/* Compact Model Selector */}
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
                            <option key={m.id} value={m.id} className="bg-bristol-ink text-bristol-cyan py-2 font-bold">
                              {getProviderEmoji(m.id)} {m.label}
                            </option>
                          );
                        })
                      )}
                    </select>
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <ChevronDown className="h-4 w-4 text-bristol-cyan" />
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
              {console.log("Current activeTab:", activeTab)}
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
                  <div className="relative z-10 flex-1 overflow-hidden flex flex-col">
                    <ChatPane messages={messages} loading={loading} />
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

              {activeTab === "admin" && <AdminPane 
                systemPrompt={systemPrompt} 
                setSystemPrompt={setSystemPrompt}
                onSave={() => {
                  try {
                    localStorage.setItem("bristol.systemPrompt", systemPrompt);
                    console.log("System prompt saved to localStorage");
                  } catch (error) {
                    console.error("Error saving system prompt:", error);
                  }
                }}
                realTimeData={realTimeData}
                setRealTimeData={setRealTimeData}
              />}
            </div>

            {/* Glass Chat Composer - Fixed at Bottom - Only show on chat tab */}
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
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey ? handleSend() : null}
                      placeholder={loading ? "Bristol A.I. is analyzing..." : "Ask about properties, market trends, demographics, investment opportunities..."}
                      disabled={loading}
                      className={cx(
                        "relative w-full text-sm font-medium transition-all duration-300 backdrop-blur-sm",
                        "rounded-3xl px-6 py-4 pr-12 border focus:outline-none",
                        "text-white placeholder-bristol-cyan/60 disabled:opacity-60",
                        "hover:shadow-lg hover:shadow-bristol-cyan/10",
                        "focus:border-bristol-electric focus:ring-2 focus:ring-bristol-electric/30"
                      )}
                      style={{
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(69, 214, 202, 0.08) 50%, rgba(30, 41, 59, 0.6) 100%)',
                        borderColor: 'rgba(69, 214, 202, 0.4)',
                      }}
                    />
                    {loading && (
                      <div className="absolute right-5 top-1/2 transform -translate-y-1/2">
                        <div className="w-5 h-5 border-2 border-bristol-cyan/30 border-t-bristol-cyan rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  
                  {/* Glass Send Button */}
                  <button
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    className={cx(
                      "relative inline-flex items-center gap-3 px-6 py-4 rounded-3xl font-bold text-sm transition-all duration-300 group overflow-hidden",
                      "backdrop-blur-sm border shadow-lg hover:shadow-bristol-cyan/25",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "transform hover:scale-105 active:scale-95",
                      loading || !input.trim() 
                        ? "border-bristol-cyan/20" 
                        : "border-bristol-cyan/50 hover:border-bristol-electric/60"
                    )}
                    style={{
                      background: loading || !input.trim() 
                        ? 'linear-gradient(135deg, rgba(69, 214, 202, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)'
                        : 'linear-gradient(135deg, rgba(69, 214, 202, 0.2) 0%, rgba(168, 85, 247, 0.15) 50%, rgba(239, 68, 68, 0.1) 100%)',
                    }}
                  >
                    {/* Glass shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    
                    {/* Button content */}
                    <div className="relative z-10 flex items-center gap-2">
                      {loading ? (
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
        </div>
      )}

    </>
  );
}

// Enhanced UI Components for Bristol A.I. Boss Agent

function DataPane({ data }: { data: any }) {
  return (
    <div className="flex-1 p-6">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-black/60 border border-bristol-gold/30 rounded-2xl p-4 cyberpunk-glow">
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-4 w-4 text-bristol-gold" />
              <span className="text-sm font-semibold text-bristol-gold">LIVE DATA SOURCES</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {Object.keys(data || {}).length}
            </div>
            <p className="text-xs text-gray-400">Active connections</p>
          </div>
          
          <div className="bg-black/60 border border-purple-500/30 rounded-2xl p-4 cyberpunk-glow">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-semibold text-purple-400">SYSTEM STATUS</span>
            </div>
            <div className="text-2xl font-bold text-green-400 mb-1">ONLINE</div>
            <p className="text-xs text-gray-400">All systems operational</p>
          </div>
        </div>
        
        <div className="bg-black/40 border border-bristol-cyan/30 rounded-2xl p-4">
          <h4 className="text-bristol-cyan font-semibold mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            REAL-TIME DATA ACCESS
          </h4>
          <div className="max-h-64 overflow-auto cyberpunk-scrollbar">
            <pre className="text-xs text-gray-300 whitespace-pre-wrap">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolsPane({ systemStatus, mcpEnabled, setMcpEnabled }: { 
  systemStatus: SystemStatus; 
  mcpEnabled: boolean; 
  setMcpEnabled: (enabled: boolean) => void; 
}) {
  const mcpTools = [
    { name: 'n8n Workflows', status: 'active', description: 'Automation and data processing' },
    { name: 'Apify Web Scraping', status: 'active', description: 'Real estate data collection' },
    { name: 'Census Data API', status: 'active', description: 'Demographics and population data' },
    { name: 'HUD Fair Market Rent', status: 'active', description: 'Rental market intelligence' },
    { name: 'Metrics Storage', status: 'active', description: 'Performance data tracking' }
  ];

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
        
        <div className="grid gap-3">
          {mcpTools.map((tool, index) => (
            <div key={index} className="bg-black/40 border border-gray-700 rounded-2xl p-4 hover:border-bristol-cyan/50 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Cpu className="h-5 w-5 text-bristol-cyan" />
                  <div>
                    <div className="text-white font-medium">{tool.name}</div>
                    <div className="text-xs text-gray-400">{tool.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-xs text-green-400 font-semibold">READY</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="bg-bristol-maroon/10 border border-bristol-gold/30 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Terminal className="h-4 w-4 text-bristol-gold" />
            <span className="text-sm font-semibold text-bristol-gold">BOSS AGENT STATUS</span>
          </div>
          <div className="text-sm text-white">
            MCP Server: <span className="text-green-400">Connected</span><br />
            API Access: <span className="text-green-400">Full Permissions</span><br />
            Real-time Data: <span className="text-green-400">Active</span><br />
            Tool Execution: <span className="text-bristol-gold">Authorized</span>
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
    <div className="flex-1 p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h4 className="text-bristol-gold font-semibold flex items-center gap-2">
            <Settings className="h-4 w-4" />
            BRISTOL A.I. CONFIGURATION
          </h4>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-bristol-cyan font-medium">Real-time Data Injection</span>
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
          <label className="block text-bristol-cyan font-semibold mb-3">
            BRISTOL A.I. SYSTEM PROMPT
          </label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={12}
            className="cyberpunk-input w-full text-sm font-mono resize-none"
            placeholder="Enter the Bristol A.I. system prompt..."
          />
          
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => {
                try {
                  localStorage.setItem("bristol.systemPrompt", systemPrompt);
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
              className="px-4 py-2 bg-bristol-maroon/80 hover:bg-bristol-maroon border border-bristol-maroon rounded-lg text-white font-semibold text-sm transition-all duration-200 hover:shadow-lg hover:shadow-bristol-maroon/50"
            >
              Save Prompt
            </button>
            <button
              onClick={() => setSystemPrompt(DEFAULT_MEGA_PROMPT)}
              className="px-4 py-2 bg-bristol-gold/80 hover:bg-bristol-gold border border-bristol-gold rounded-lg text-black font-semibold text-sm transition-all duration-200 hover:shadow-lg hover:shadow-bristol-gold/50"
            >
              Reset to Default
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Enhanced UI Components for Bristol A.I. Boss Agent
function TabButton({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-3 rounded-2xl font-semibold text-sm transition-all duration-300
        ${active 
          ? 'bg-gradient-to-r from-bristol-cyan/30 to-bristol-electric/30 text-white border border-bristol-cyan/50' 
          : 'text-bristol-cyan/70 hover:text-white hover:bg-white/5 border border-transparent hover:border-bristol-cyan/30'
        }
      `}
    >
      {icon}
      {label}
    </button>
  );
}

// Missing ChatPane function
function ChatPane({ messages, loading }: { messages: ChatMessage[]; loading: boolean }) {
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
      className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4 space-y-4 bg-gradient-to-b from-transparent via-bristol-ink/10 to-bristol-ink/20" 
      style={{ 
        scrollBehavior: 'smooth'
      }}
    >
      {showWelcome && (
        <div className="animate-fade-in">
          <div className="relative rounded-3xl border bg-gradient-to-br from-bristol-cyan/20 via-bristol-electric/10 to-bristol-gold/5 border-bristol-cyan/40 backdrop-blur p-6 shadow-2xl">
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-bristol-cyan rounded-full animate-pulse" />
            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-bristol-gold rounded-full animate-pulse animation-delay-500" />
            
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-bristol-cyan blur-xl opacity-50 animate-pulse" />
                <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-bristol-cyan via-bristol-electric to-bristol-cyan flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Bristol A.I. Elite v5.0</h3>
                <p className="text-xs text-bristol-cyan/80">Enterprise-Grade AI Intelligence Platform</p>
              </div>
            </div>
            
            <div className="space-y-3 text-sm text-white/90">
              <p className="leading-relaxed">
                <strong>BRISTOL A.I. ELITE v5.0 ACTIVATED</strong> - Enterprise-grade AI system operational with comprehensive property intelligence capabilities.
              </p>
              
              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="bg-bristol-ink/40 rounded-xl p-3 border border-bristol-cyan/20">
                  <div className="text-bristol-cyan text-xs font-semibold mb-1">CAPABILITIES</div>
                  <ul className="text-xs space-y-1 text-white/80">
                    <li>• $200M+ Deal Analysis</li>
                    <li>• IRR/NPV Modeling</li>
                    <li>• Market Intelligence</li>
                    <li>• Risk Assessment</li>
                  </ul>
                </div>
                <div className="bg-bristol-ink/40 rounded-xl p-3 border border-bristol-gold/20">
                  <div className="text-bristol-gold text-xs font-semibold mb-1">QUICK START</div>
                  <ul className="text-xs space-y-1 text-white/80">
                    <li>• "Analyze this property"</li>
                    <li>• "Show market trends"</li>
                    <li>• "Calculate returns"</li>
                    <li>• "Risk assessment"</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-gradient-to-r from-bristol-cyan/10 to-bristol-electric/10 rounded-xl border border-bristol-cyan/30">
                <p className="text-xs text-bristol-cyan font-semibold mb-1 flex items-center gap-2">
                  <Activity className="w-3 h-3 animate-pulse" />
                  SYSTEM STATUS: FULLY OPERATIONAL
                </p>
                <p className="text-xs text-white/80">
                  Complete operational readiness. Portfolio database accessible, real-time market intelligence active, demographic analytics online, and MCP server integration established. Ready for institutional-grade property evaluation and investment analysis.
                </p>
              </div>
              
              <div className="flex gap-2 mt-4">
                <div className="flex-1 p-2 bg-gradient-to-r from-bristol-gold/10 to-transparent rounded-lg border border-bristol-gold/20">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-bristol-gold" />
                    <span className="text-xs text-bristol-gold font-bold">PRO TIP</span>
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
              ? "bg-gradient-to-br from-bristol-cyan/10 to-bristol-electric/5 border-bristol-cyan/30 hover:border-bristol-cyan/50" 
              : "bg-gradient-to-br from-bristol-ink/60 to-black/40 border-bristol-maroon/30 hover:border-bristol-maroon/50 ml-4"
            }
          `}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={`
                text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-full
                ${m.role === "assistant"
                  ? "bg-bristol-cyan/20 text-bristol-cyan border border-bristol-cyan/30"
                  : "bg-bristol-maroon/20 text-bristol-gold border border-bristol-maroon/30"
                }
              `}>
                {m.role === "assistant" ? "🤖 Bristol A.I." : "👤 You"}
              </span>
            </div>
            {m.createdAt && (
              <span className="text-xs text-bristol-cyan/50">
                {new Date(m.createdAt).toLocaleTimeString()}
              </span>
            )}
          </div>
          
          <div className={`
            whitespace-pre-wrap text-sm leading-relaxed
            ${m.role === "assistant" ? "text-white/90" : "text-bristol-cyan/90"}
          `}>
            {/* Check if content has property analysis data */}
            {m.role === "assistant" && m.content.includes("PROPERTY ANALYSIS") ? (
              <div className="space-y-4">
                {m.content.split('\n').map((line, idx) => {
                  if (line.startsWith('##')) {
                    return (
                      <h3 key={idx} className="text-bristol-cyan font-bold text-base mt-4 mb-2 flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        {line.replace('##', '').trim()}
                      </h3>
                    );
                  } else if (line.startsWith('•')) {
                    return (
                      <div key={idx} className="flex items-start gap-2 ml-4">
                        <div className="w-1 h-1 bg-bristol-gold rounded-full mt-2" />
                        <span className="flex-1">{line.replace('•', '').trim()}</span>
                      </div>
                    );
                  } else if (line.includes('IRR:') || line.includes('NPV:') || line.includes('Cap Rate:')) {
                    return (
                      <div key={idx} className="bg-bristol-cyan/10 border border-bristol-cyan/30 rounded-lg p-3 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-bristol-gold" />
                        <span className="font-mono text-bristol-gold">{line}</span>
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
                      <div key={idx} className="bg-bristol-gold/10 border border-bristol-gold/30 rounded-lg p-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-bristol-gold" />
                        <span className="text-bristol-gold font-semibold">{line}</span>
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
        <div className="relative rounded-2xl border bg-gradient-to-br from-bristol-cyan/10 to-bristol-electric/5 border-bristol-cyan/30 backdrop-blur animate-pulse p-4">
          <div className="flex items-center gap-3">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-bristol-cyan rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-2 h-2 bg-bristol-cyan rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-2 h-2 bg-bristol-cyan rounded-full animate-bounce" />
            </div>
            <span className="text-sm text-bristol-cyan/80">
              Bristol A.I. Boss Agent is analyzing your request...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}


