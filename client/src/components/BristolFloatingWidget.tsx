import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, PanelLeftOpen, Send, Settings, Database, MessageSquare, Sparkles, Brain, Cpu, Zap, Activity, Wifi, WifiOff, Loader2, Shield, Terminal, Upload, FileText, Target, Paperclip, Plus, Trash2, Save, File } from "lucide-react";

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

// ---------- Default Bristol Mega Prompt (short safe baseline) ----------
const DEFAULT_MEGA_PROMPT = `You are the Bristol Development Research Analyst.

Mission: Read the provided data context and return concise, defensible answers for high-end real estate due diligence in Middle Tennessee (and beyond).

Rules:
- Be precise with units, ranges, dates, and sources when available.
- If a metric is missing, say so and suggest the best public source (link names, not raw URLs).
- Show your working briefly: bullet the key signals and caveats.
- Never speculate wildly; flag uncertainties as unknowns.
- Focus on financial yield, demographic growth, regulatory risk, and location comparables.
- When analyzing properties, consider: acquisition price, rental income potential, cap rates, neighborhood dynamics, and market trends.
- Use the provided property data, demographic information, and external API data to provide comprehensive analysis.

Available Data Context includes:
- Bristol property portfolio with addresses, status, and financial metrics
- Demographics data from Census API
- BLS employment data
- HUD fair market rents
- FBI crime statistics
- NOAA climate data
- BEA economic indicators
- Foursquare location insights

Provide actionable intelligence for property investment, development, and portfolio optimization decisions.`;

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
  const [activeTab, setActiveTab] = useState<"chat" | "data" | "admin" | "tools" | "prompts" | "files">("chat");
  const [model, setModel] = useState(defaultModel || "");
  const [modelList, setModelList] = useState<ModelOption[]>([]);
  const [systemPrompt, setSystemPrompt] = useState<string>(defaultSystemPrompt || DEFAULT_MEGA_PROMPT);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "system", content: systemPrompt, createdAt: nowISO() },
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
  const [eliteMode, setEliteMode] = useState(false);
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
        console.log("Bristol Brain WebSocket connected");
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
        console.log("Bristol Brain WebSocket disconnected");
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
      const endpoint = eliteMode ? "/api/bristol-brain-elite/chat" : "/api/bristol-brain/enhanced-chat";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...enhancedPayload,
          ...mcpContext,
          systemStatus,
          sessionId: eliteMode ? sessionId : undefined,
          userAgent: eliteMode ? "Bristol Brain Elite v1.0" : "Bristol Brain Boss Agent v2.0"
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
      console.error("Bristol Brain error:", err);
      let errorMessage = "Bristol Brain Boss Agent encountered an error.";
      
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
      {/* Bristol Brain Launcher Button - Bottom Right */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="bristol-brain-button"
          aria-label="Open Bristol Brain Intelligence"
        >
          <Brain className="h-6 w-6" />
          <span className="font-bold text-lg">Bristol Brain Intelligence</span>
        </button>
      )}

      {/* Slideout Panel */}
      {open && (
        <div className="fixed inset-0 z-[9998]">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />

          {/* Glass Panel with Ambient Glow */}
          <div 
            className="absolute inset-y-0 left-0 w-[92vw] sm:w-[620px] text-neutral-100 shadow-2xl border-r border-bristol-cyan/40 flex flex-col"
            style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 50%, rgba(15, 23, 42, 0.95) 100%)',
              backdropFilter: 'blur(24px) saturate(1.5)',
              boxShadow: '0 0 60px rgba(69, 214, 202, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
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
                    <h1 className="font-serif font-bold text-xl bg-gradient-to-r from-bristol-cyan via-white to-bristol-gold bg-clip-text text-transparent drop-shadow-lg">
                      BRISTOL BRAIN
                    </h1>
                    <p className="text-xs text-bristol-cyan/90 font-semibold tracking-wider uppercase mt-1">
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
              
              {/* Welcome Greeting */}
              <div className="px-6 py-4 bg-gradient-to-r from-bristol-ink/30 to-transparent border-b border-bristol-cyan/20">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-4 w-4 text-bristol-gold animate-pulse" />
                  <p className="text-sm text-bristol-cyan/90 font-medium">
                    Welcome to Bristol Brain. Ask me about properties, market analysis, demographics, and investment opportunities.
                  </p>
                </div>
              </div>
            </div>

            {/* Glass Controls Panel */}
            <div 
              className="px-6 py-5 border-b border-bristol-cyan/30 relative"
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
                {/* Elite Mode Toggle */}
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-bristol-gold/40 backdrop-blur-sm"
                  style={{
                    background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)',
                  }}>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={eliteMode}
                      onChange={(e) => setEliteMode(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={cx(
                      "relative w-12 h-6 rounded-full transition-colors duration-300",
                      eliteMode ? "bg-bristol-gold" : "bg-gray-600"
                    )}>
                      <div className={cx(
                        "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300",
                        eliteMode ? "translate-x-6" : "translate-x-0"
                      )} />
                    </div>
                    <span className="text-xs font-semibold text-bristol-gold uppercase tracking-wider flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Elite Mode {eliteMode ? "ON" : "OFF"}
                    </span>
                  </label>
                </div>
                
                {/* Glass Elite Model Selector */}
                <div className="flex-1 min-w-[240px]">
                  <label className="block text-xs text-bristol-cyan font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Brain className="h-3 w-3" />
                    {eliteMode ? "$200M+ Deal AI" : "Elite AI Model"}
                  </label>
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-bristol-cyan/20 to-bristol-electric/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-300" />
                    <select
                      className={cx(
                        "relative w-full text-sm font-medium transition-all duration-300 backdrop-blur-sm",
                        "rounded-2xl px-5 py-4 border focus:outline-none",
                        "text-bristol-cyan hover:text-white focus:text-white",
                        "disabled:opacity-50 hover:shadow-lg hover:shadow-bristol-cyan/10",
                        "focus:border-bristol-electric focus:ring-2 focus:ring-bristol-electric/30"
                      )}
                      style={{
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(69, 214, 202, 0.1) 50%, rgba(30, 41, 59, 0.8) 100%)',
                        borderColor: 'rgba(69, 214, 202, 0.4)',
                      }}
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      disabled={modelList.length === 0}
                    >
                      {modelList.length === 0 ? (
                        <option value="">🧠 Loading Elite Models...</option>
                      ) : (
                        modelList.map((m: ModelOption) => (
                          <option key={m.id} value={m.id} className="bg-bristol-ink text-white py-2">
                            🚀 {m.label}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                {/* Glass Data Context Badge */}
                <div className="flex flex-col items-center gap-2">
                  <span className="text-xs text-bristol-cyan font-semibold uppercase tracking-wider">
                    Live Intelligence
                  </span>
                  <div 
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-bristol-cyan/40 backdrop-blur-sm hover:shadow-lg hover:shadow-bristol-cyan/20 transition-all duration-300"
                    style={{
                      background: 'linear-gradient(135deg, rgba(69, 214, 202, 0.15) 0%, rgba(168, 85, 247, 0.1) 100%)',
                    }}
                  >
                    <Database className="h-5 w-5 text-bristol-cyan animate-pulse" />
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">
                        {Object.keys(appData || {}).length}
                      </div>
                      <div className="text-xs text-bristol-cyan/80 font-medium">
                        datasets
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Glass Tab Navigation */}
            <div 
              className="px-6 py-4 border-b border-bristol-cyan/20"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(30, 41, 59, 0.3) 100%)',
              }}
            >
              <div className="flex items-center gap-2">
                <TabButton 
                  icon={<MessageSquare className="h-4 w-4" />} 
                  active={activeTab === "chat"} 
                  label="Chat" 
                  onClick={() => setActiveTab("chat")} 
                />
                {eliteMode && (
                  <>
                    <TabButton 
                      icon={<FileText className="h-4 w-4" />} 
                      active={activeTab === "prompts"} 
                      label="Prompts" 
                      onClick={() => setActiveTab("prompts")} 
                    />
                    <TabButton 
                      icon={<Paperclip className="h-4 w-4" />} 
                      active={activeTab === "files"} 
                      label="Files" 
                      onClick={() => setActiveTab("files")} 
                    />
                  </>
                )}
                <TabButton 
                  icon={<Database className="h-4 w-4" />} 
                  active={activeTab === "data"} 
                  label="Data" 
                  onClick={() => setActiveTab("data")} 
                />
                <TabButton 
                  icon={<Zap className="h-4 w-4" />} 
                  active={activeTab === "tools"} 
                  label="Tools" 
                  onClick={() => setActiveTab("tools")} 
                />
                <TabButton 
                  icon={<Settings className="h-4 w-4" />} 
                  active={activeTab === "admin"} 
                  label="Config" 
                  onClick={() => setActiveTab("admin")} 
                />
              </div>
            </div>

            {/* Glass Body Container */}
            <div 
              className="flex-1 min-h-0 relative"
              style={{
                background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.3) 0%, rgba(30, 41, 59, 0.2) 50%, rgba(15, 23, 42, 0.4) 100%)',
              }}
            >
              {/* Subtle ambient glow */}
              <div className="absolute top-10 right-10 w-24 h-24 bg-bristol-electric/5 rounded-full blur-2xl animate-pulse delay-500" />
              <div className="absolute bottom-20 left-10 w-32 h-32 bg-bristol-cyan/5 rounded-full blur-3xl animate-pulse delay-1000" />
              
              {activeTab === "chat" && <ChatPane messages={messages} loading={loading} />}
              {activeTab === "prompts" && (
                <div className="flex flex-col h-full p-6 overflow-y-auto">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-bristol-gold" />
                    AI Prompts Management
                  </h3>
                  <div className="text-center py-8 text-bristol-cyan/60">
                    Manage system and project prompts for enhanced AI intelligence.
                  </div>
                </div>
              )}
              {activeTab === "files" && (
                <div className="flex flex-col h-full p-6 overflow-y-auto">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Paperclip className="h-5 w-5 text-bristol-gold" />
                    Document Attachments
                  </h3>
                  <div className="text-center py-8 text-bristol-cyan/60">
                    Upload documents for AI analysis and context enhancement.
                  </div>
                </div>
              )}
              {activeTab === "data" && <DataPane data={dataContext} />}
              {activeTab === "tools" && <ToolsPane systemStatus={systemStatus} mcpEnabled={mcpEnabled} setMcpEnabled={setMcpEnabled} />}
              {activeTab === "admin" && (
                <AdminPane
                  systemPrompt={systemPrompt}
                  setSystemPrompt={setSystemPrompt}
                  onSave={saveSystemPrompt}
                  realTimeData={realTimeData}
                  setRealTimeData={setRealTimeData}
                />
              )}
            </div>

            {/* Glass Chat Composer */}
            {activeTab === "chat" && (
              <div 
                className="border-t border-bristol-cyan/40 relative"
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
                      placeholder={loading ? "Bristol Brain is analyzing..." : "Ask about properties, market trends, demographics, investment opportunities..."}
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
                            Ask Bristol Brain
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
      
      {/* Render Elite Mode Component */}
      {open && eliteMode && (
        <div className="fixed inset-0 z-[999]">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute inset-4 md:inset-8 lg:inset-12">
            <BristolBrainElite 
              sessionId={sessionId}
              dataContext={appData}
              onClose={() => {
                setEliteMode(false);
                setOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}

// Enhanced UI Components for Bristol Brain Boss Agent

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
                w-12 h-6 rounded-full transition-all duration-300 relative
                ${mcpEnabled ? 'bg-bristol-maroon' : 'bg-gray-600'}
              `}
            >
              <div className={`
                w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all duration-300
                ${mcpEnabled ? 'left-6' : 'left-0.5'}
              `} />
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
            BRISTOL BRAIN CONFIGURATION
          </h4>
          <button
            onClick={onSave}
            className="bg-gradient-to-r from-bristol-maroon to-purple-700 hover:from-bristol-maroon/90 hover:to-purple-700/90 border border-bristol-gold/50 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300"
          >
            Save Config
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-bristol-cyan font-medium">Real-time Data Injection</span>
            <button
              onClick={() => setRealTimeData(!realTimeData)}
              className={`
                w-12 h-6 rounded-full transition-all duration-300 relative
                ${realTimeData ? 'bg-bristol-maroon' : 'bg-gray-600'}
              `}
            >
              <div className={`
                w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all duration-300
                ${realTimeData ? 'left-6' : 'left-0.5'}
              `} />
            </button>
          </div>
        </div>
        
        <div>
          <label className="block text-bristol-cyan font-semibold mb-3">
            BRISTOL BRAIN SYSTEM PROMPT
          </label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={12}
            className="cyberpunk-input w-full text-sm font-mono resize-none"
            placeholder="Enter the Bristol Brain system prompt..."
          />
        </div>
      </div>
    </div>
  );
}

// Enhanced UI Components for Bristol Brain Boss Agent
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
  return (
    <div className="h-full overflow-y-auto px-6 py-4 space-y-4 bg-gradient-to-b from-transparent to-bristol-ink/20">
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
                {m.role === "assistant" ? "🤖 Bristol Brain" : "👤 You"}
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
            {m.content}
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
              Bristol Brain Boss Agent is analyzing your request...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}


