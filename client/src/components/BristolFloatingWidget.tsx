import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, PanelLeftOpen, Send, Settings, Database, MessageSquare, Sparkles, Brain, Cpu } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState<"chat" | "data" | "admin">("chat");
  const [model, setModel] = useState(defaultModel || "");
  const [modelList, setModelList] = useState<ModelOption[]>([]);
  const [systemPrompt, setSystemPrompt] = useState<string>(defaultSystemPrompt || DEFAULT_MEGA_PROMPT);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "system", content: systemPrompt, createdAt: nowISO() },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [modelError, setModelError] = useState<string>("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  // SSR-safe localStorage loading
  useEffect(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("bristol.systemPrompt") : null;
      if (saved) setSystemPrompt(saved);
    } catch (error) {
      console.warn("Failed to load saved system prompt:", error);
    }
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

    const payload: ChatPayload = {
      model,
      messages: newMessages,
      dataContext, // IMPORTANT: gives the model the live app data
      temperature: 0.2,
      maxTokens: 1200,
    };

    try {
      await onSend?.(payload);
      await sendTelemetry("chat_send", { model, promptSize: safeStringify(newMessages).length });
    } catch (error) {
      console.error("Error in onSend callback or telemetry:", error);
    }

    try {
      // The proxy should call OpenRouter, inject the dataContext into the system or tool context, and stream back tokens
      const res = await fetch("/api/openrouter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Proxy error ${res.status}`);

      // Supports both JSON and text-stream; here we do simple JSON for clarity
      const data = await res.json();
      const assistantText: string = data?.text ?? data?.message ?? "(No response)";

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: assistantText,
        createdAt: nowISO(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      await sendTelemetry("chat_receive", { tokens: assistantText.length });
    } catch (err: any) {
      console.error("Full error object:", err);
      let errorMessage = "Failed to reach model proxy.";
      
      if (err?.message?.includes("401") || err?.message?.includes("Unauthorized")) {
        errorMessage = "Authentication required. Please make sure you're logged in.";
      } else if (err?.message?.includes("400")) {
        errorMessage = "Invalid request. The selected model may not be available.";
      } else if (err?.message?.includes("502")) {
        errorMessage = "OpenRouter API error. Please try again or select a different model.";
      } else if (err?.message) {
        errorMessage = `Error: ${err.message}`;
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
      {/* Bristol Brain Launcher Button */}
      <div
        onClick={() => setOpen(true)}
        className="bristol-brain-button"
        style={{
          filter: 'drop-shadow(0 0 20px rgba(0, 191, 255, 0.4))',
        }}
        aria-label="Open Bristol Brain"
      >
        {/* Animated glow rings */}
        <div style={{
          position: 'absolute',
          inset: '-8px',
          background: 'linear-gradient(to right, rgba(0, 191, 255, 0.2), rgba(0, 191, 255, 0.2), rgba(139, 21, 56, 0.2))',
          borderRadius: '50%',
          opacity: '0',
          animation: 'pulse 2s infinite',
          transition: 'opacity 0.5s',
        }} />
        <div style={{
          position: 'absolute',
          inset: '-4px', 
          background: 'linear-gradient(to right, rgba(0, 191, 255, 0.3), rgba(0, 191, 255, 0.3))',
          borderRadius: '50%',
          opacity: '0',
          animation: 'ping 3s infinite',
          transition: 'opacity 0.7s',
        }} />
        
        {/* Content */}
        <div style={{
          position: 'relative',
          zIndex: '10',
          display: 'flex',
          alignItems: 'center', 
          gap: '12px',
          color: 'white'
        }}>
          <div style={{ position: 'relative' }}>
            <Brain style={{ 
              height: '24px', 
              width: '24px', 
              color: '#00bfff',
              filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.5))'
            }} />
            <div style={{
              position: 'absolute',
              inset: '0',
              height: '24px',
              width: '24px',
              color: 'rgba(0, 191, 255, 0.5)',
              animation: 'pulse 2s infinite',
              opacity: '0.5',
            }}>
              <Sparkles style={{ height: '24px', width: '24px' }} />
            </div>
          </div>
          <div style={{ display: window.innerWidth >= 640 ? 'block' : 'none' }}>
            <div style={{
              fontSize: '14px',
              fontWeight: 'bold',
              letterSpacing: '0.05em',
              color: '#00bfff',
              transition: 'color 0.3s',
            }}>
              BRISTOL BRAIN
            </div>
            <div style={{
              fontSize: '12px',
              color: 'rgba(255, 178, 0, 0.8)',
              fontWeight: '500',
              transition: 'color 0.3s',
            }}>
              AI Intelligence
            </div>
          </div>
          <Cpu style={{ 
            height: '16px', 
            width: '16px', 
            color: 'rgba(255, 178, 0, 0.7)',
            transition: 'all 0.3s',
          }} />
        </div>
      </div>

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
                {/* Glass Elite Model Selector */}
                <div className="flex-1 min-w-[240px]">
                  <label className="block text-xs text-bristol-cyan font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Brain className="h-3 w-3" />
                    Elite AI Model
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
                  label="AI Chat" 
                  onClick={() => setActiveTab("chat")} 
                />
                <TabButton 
                  icon={<Database className="h-4 w-4" />} 
                  active={activeTab === "data"} 
                  label="Live Data" 
                  onClick={() => setActiveTab("data")} 
                />
                <TabButton 
                  icon={<Settings className="h-4 w-4" />} 
                  active={activeTab === "admin"} 
                  label="Brain Config" 
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
              {activeTab === "data" && <DataPane data={dataContext} />}
              {activeTab === "admin" && (
                <AdminPane
                  systemPrompt={systemPrompt}
                  setSystemPrompt={setSystemPrompt}
                  onSave={saveSystemPrompt}
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
    </>
  );
}

// ---------- Subcomponents ----------
function TabButton({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "relative flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-300 group overflow-hidden",
        "backdrop-blur-sm border hover:shadow-lg hover:shadow-bristol-cyan/20",
        active 
          ? "text-white border-bristol-cyan/60 shadow-lg shadow-bristol-cyan/15" 
          : "text-bristol-cyan/80 border-bristol-cyan/30 hover:text-bristol-cyan hover:border-bristol-cyan/50"
      )}
      style={{
        background: active 
          ? 'linear-gradient(135deg, rgba(69, 214, 202, 0.2) 0%, rgba(168, 85, 247, 0.15) 50%, rgba(69, 214, 202, 0.1) 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(69, 214, 202, 0.05) 100%)',
      }}
    >
      {/* Glass shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
      
      {/* Active glow */}
      {active && (
        <div className="absolute inset-0 bg-gradient-to-r from-bristol-cyan/10 to-bristol-electric/10 animate-pulse" />
      )}
      
      {/* Content */}
      <span className={cx("relative z-10 transition-all duration-300", active ? "text-bristol-cyan scale-110" : "group-hover:text-bristol-cyan group-hover:scale-105")}>
        {icon}
      </span>
      <span className="relative z-10 tracking-wide font-semibold">{label}</span>
    </button>
  );
}

function ChatPane({ messages, loading }: { messages: ChatMessage[]; loading: boolean }) {
  return (
    <div className="h-full overflow-y-auto px-6 py-4 space-y-4 bg-gradient-to-b from-transparent to-bristol-ink/20">
      {messages.filter(m => m.role !== "system").map((m, i) => (
        <div 
          key={i} 
          className={cx(
            "relative rounded-2xl border backdrop-blur transition-all duration-200 hover:shadow-lg",
            m.role === "assistant" 
              ? "bg-gradient-to-br from-bristol-cyan/10 to-bristol-electric/5 border-bristol-cyan/30 hover:border-bristol-cyan/50" 
              : "bg-gradient-to-br from-bristol-ink/60 to-black/40 border-bristol-maroon/30 hover:border-bristol-maroon/50 ml-4"
          )}
        >
          {/* Message header */}
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <div className="flex items-center gap-2">
              <span className={cx(
                "text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-full",
                m.role === "assistant"
                  ? "bg-bristol-cyan/20 text-bristol-cyan border border-bristol-cyan/30"
                  : "bg-bristol-maroon/20 text-bristol-gold border border-bristol-maroon/30"
              )}>
                {m.role === "assistant" ? "🤖 Bristol AI" : "👤 You"}
              </span>
            </div>
            {m.createdAt && (
              <span className="text-xs text-bristol-cyan/50">
                {new Date(m.createdAt).toLocaleTimeString()}
              </span>
            )}
          </div>
          
          {/* Message content */}
          <div className="px-4 pb-4">
            <div className={cx(
              "whitespace-pre-wrap text-sm leading-relaxed",
              m.role === "assistant" ? "text-white/90" : "text-bristol-cyan/90"
            )}>
              {m.content}
            </div>
          </div>
        </div>
      ))}
      
      {loading && (
        <div className="relative rounded-2xl border bg-gradient-to-br from-bristol-cyan/10 to-bristol-electric/5 border-bristol-cyan/30 backdrop-blur animate-pulse">
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-bristol-cyan rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-2 h-2 bg-bristol-cyan rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-2 h-2 bg-bristol-cyan rounded-full animate-bounce" />
            </div>
            <span className="text-sm text-bristol-cyan/80">
              Bristol AI is analyzing your data and market conditions...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function DataPane({ data }: { data: any }) {
  const dataKeys = Object.keys(data || {});
  
  return (
    <div className="h-full overflow-y-auto bg-gradient-to-b from-bristol-ink/20 to-transparent">
      {/* Data overview header */}
      <div className="sticky top-0 bg-bristol-ink/80 backdrop-blur border-b border-bristol-cyan/20 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-bristol-cyan">Live Data Context</h3>
            <p className="text-xs text-bristol-cyan/70 mt-1">
              Real-time data available to Bristol AI for analysis
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-bristol-cyan/20 to-bristol-electric/20 border border-bristol-cyan/30">
            <Database className="h-4 w-4 text-bristol-cyan" />
            <span className="text-sm font-bold text-white">{dataKeys.length}</span>
            <span className="text-xs text-bristol-cyan/70">datasets</span>
          </div>
        </div>
      </div>

      {/* Data content */}
      <div className="p-6 space-y-4">
        {dataKeys.length > 0 ? (
          dataKeys.map((key, i) => (
            <div key={key} className="border border-bristol-cyan/20 rounded-2xl bg-gradient-to-br from-bristol-ink/40 to-black/20 backdrop-blur">
              <div className="px-4 py-3 border-b border-bristol-cyan/20 bg-bristol-cyan/5">
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-bristol-cyan/20 text-bristol-cyan px-2 py-1 rounded-full font-medium">
                    {i + 1}
                  </span>
                  <span className="font-medium text-bristol-cyan">{key}</span>
                  <span className="text-xs text-bristol-cyan/60 ml-auto">
                    {Array.isArray(data[key]) ? `${data[key].length} items` : typeof data[key]}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <pre className="text-xs leading-relaxed overflow-x-auto text-bristol-cyan/80 whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {safeStringify(data[key], 2)}
                </pre>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <Database className="h-12 w-12 text-bristol-cyan/30 mx-auto mb-4" />
            <h3 className="text-bristol-cyan/60 font-medium mb-2">No Data Available</h3>
            <p className="text-xs text-bristol-cyan/40 max-w-md mx-auto">
              Bristol AI will have access to live property data, demographics, and market intelligence once data sources are connected.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminPane({ systemPrompt, setSystemPrompt, onSave }: { systemPrompt: string; setSystemPrompt: (v: string) => void; onSave: () => void }) {
  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-bristol-ink/20 to-transparent">
      {/* Admin header */}
      <div className="px-6 py-4 border-b border-bristol-cyan/20 bg-gradient-to-r from-bristol-ink/40 to-black/20 backdrop-blur">
        <div className="flex items-center gap-3">
          <Settings className="h-5 w-5 text-bristol-cyan" />
          <div>
            <h3 className="font-semibold text-bristol-cyan">System Configuration</h3>
            <p className="text-xs text-bristol-cyan/70 mt-1">
              Configure Bristol AI analyst behavior and expertise
            </p>
          </div>
        </div>
      </div>

      {/* Prompt editor */}
      <div className="flex-1 min-h-0 p-6">
        <div className="h-full flex flex-col">
          <div className="mb-4">
            <label className="block text-sm font-medium text-bristol-cyan mb-2">
              Bristol Mega Prompt
            </label>
            <p className="text-xs text-bristol-cyan/60 mb-4">
              This system prompt defines Bristol AI's expertise, knowledge base, and analytical approach for real estate intelligence.
            </p>
          </div>
          
          <div className="flex-1 min-h-0">
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className={cx(
                "w-full h-full text-sm leading-relaxed resize-none",
                "bg-bristol-ink/60 border border-bristol-cyan/40 rounded-2xl p-4",
                "focus:outline-none focus:border-bristol-electric focus:ring-2 focus:ring-bristol-electric/20",
                "text-white placeholder-bristol-cyan/50 transition-all duration-200",
                "hover:border-bristol-cyan/60 backdrop-blur"
              )}
              placeholder="Enter the Bristol AI system prompt that defines expertise, analytical approach, and knowledge domains..."
            />
          </div>
        </div>
      </div>

      {/* Save controls */}
      <div className="px-6 py-4 border-t border-bristol-cyan/20 bg-gradient-to-r from-bristol-ink/60 to-black/40 backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="text-xs text-bristol-cyan/60">
            Changes are saved locally and used for all future AI conversations
          </div>
          <button 
            onClick={onSave} 
            className={cx(
              "inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold text-sm",
              "bg-gradient-to-r from-bristol-cyan to-bristol-electric text-white shadow-lg",
              "hover:from-bristol-electric hover:to-bristol-maroon hover:shadow-bristol-cyan/20",
              "transition-all duration-200 transform hover:scale-105",
              "border border-bristol-cyan/30 hover:border-bristol-electric/50"
            )}
          >
            <Settings className="h-4 w-4" />
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}