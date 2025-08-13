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
      {/* Launcher Button (fixed on left) */}
      <button
        onClick={() => setOpen(true)}
        className={cx(
          "fixed top-24 left-0 z-50 group flex items-center gap-2 pl-2 pr-4 py-3",
          "bg-gradient-to-r from-bristol-maroon via-bristol-ink to-bristol-electric text-white rounded-r-2xl shadow-2xl",
          "backdrop-blur-md border border-bristol-cyan/30 hover:from-bristol-electric hover:via-bristol-maroon hover:to-bristol-ink",
          "transition-all duration-500 transform hover:scale-105 hover:shadow-bristol-cyan/20 hover:shadow-lg",
          "font-serif relative overflow-hidden"
        )}
        aria-label="Open Bristol Analyst"
      >
        {/* Animated background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-bristol-cyan/20 to-bristol-electric/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Content */}
        <div className="relative z-10 flex items-center gap-2">
          <Brain className="h-5 w-5 text-bristol-cyan group-hover:text-white transition-colors duration-300" />
          <span className="hidden sm:block text-sm font-semibold tracking-wide">
            Bristol AI Analyst
          </span>
          <Sparkles className="h-3 w-3 text-bristol-gold/70 group-hover:text-bristol-gold transition-all duration-300 group-hover:scale-110" />
        </div>
      </button>

      {/* Slideout Panel */}
      {open && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />

          {/* Panel */}
          <div className="absolute inset-y-0 left-0 w-[92vw] sm:w-[580px] bg-bristol-ink/95 text-neutral-100 shadow-2xl border-r border-bristol-cyan/30 flex flex-col backdrop-blur-xl">
            {/* Header with premium Bristol branding */}
            <div className="relative overflow-hidden">
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-bristol-maroon/30 via-bristol-ink to-bristol-electric/20" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-bristol-ink/50" />
              
              {/* Header content */}
              <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-bristol-cyan/30">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Cpu className="h-6 w-6 text-bristol-cyan animate-pulse" />
                    <div className="absolute inset-0 h-6 w-6 text-bristol-electric/50 animate-spin">
                      <Sparkles className="h-6 w-6" />
                    </div>
                  </div>
                  <div>
                    <h1 className="font-serif font-bold text-lg bg-gradient-to-r from-bristol-cyan via-white to-bristol-gold bg-clip-text text-transparent">
                      Bristol Development
                    </h1>
                    <p className="text-xs text-bristol-cyan/80 font-medium tracking-wide uppercase">
                      AI Intelligence Platform
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setOpen(false)} 
                  className="p-2 hover:bg-bristol-cyan/10 rounded-xl transition-all duration-200 group border border-bristol-cyan/20 hover:border-bristol-cyan/40" 
                  aria-label="Close"
                >
                  <X className="h-5 w-5 text-bristol-cyan/70 group-hover:text-bristol-cyan transition-colors" />
                </button>
              </div>
            </div>

            {/* Premium Controls */}
            <div className="px-6 py-4 border-b border-bristol-cyan/20 bg-gradient-to-r from-black/30 to-bristol-ink/50">
              {modelError && (
                <div className="mb-3 text-xs text-red-300 bg-red-500/20 border border-red-400/30 rounded-xl px-4 py-3 backdrop-blur">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                    {modelError}
                  </div>
                </div>
              )}
              
              <div className="flex flex-wrap items-center gap-4">
                {/* Elite Model Selector */}
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs text-bristol-cyan/80 font-medium uppercase tracking-wide mb-2">
                    Elite AI Model
                  </label>
                  <select
                    className={cx(
                      "w-full bg-bristol-ink/80 border border-bristol-cyan/40 rounded-xl px-4 py-3 text-sm",
                      "focus:outline-none focus:border-bristol-electric focus:ring-2 focus:ring-bristol-electric/20",
                      "disabled:opacity-50 font-medium text-bristol-cyan backdrop-blur transition-all duration-200",
                      "hover:border-bristol-cyan/60"
                    )}
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    disabled={modelList.length === 0}
                  >
                    {modelList.length === 0 ? (
                      <option value="">🔄 Loading Elite Models...</option>
                    ) : (
                      modelList.map((m: ModelOption) => (
                        <option key={m.id} value={m.id} className="bg-bristol-ink text-white">
                          ✨ {m.label}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Data Context Badge */}
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs text-bristol-cyan/80 font-medium uppercase tracking-wide">
                    Live Data
                  </span>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-bristol-cyan/20 to-bristol-electric/20 border border-bristol-cyan/30">
                    <Database className="h-4 w-4 text-bristol-cyan" />
                    <span className="text-sm font-bold text-white">
                      {Object.keys(appData || {}).length}
                    </span>
                    <span className="text-xs text-bristol-cyan/70">objects</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Premium Tab Navigation */}
            <div className="px-6 pt-4 pb-2 bg-gradient-to-b from-bristol-ink/30 to-transparent">
              <div className="flex items-center gap-3">
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
                  label="System" 
                  onClick={() => setActiveTab("admin")} 
                />
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 min-h-0">
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

            {/* Premium Chat Composer */}
            {activeTab === "chat" && (
              <div className="border-t border-bristol-cyan/30 bg-gradient-to-r from-bristol-ink/80 to-black/60 backdrop-blur">
                <div className="px-6 py-4 flex items-center gap-3">
                  <div className="flex-1 relative">
                    <input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey ? handleSend() : null}
                      placeholder={loading ? "AI is analyzing your data..." : "Ask about properties, market analysis, demographics, investment opportunities..."}
                      disabled={loading}
                      className={cx(
                        "w-full bg-bristol-ink/60 border border-bristol-cyan/40 rounded-2xl px-4 py-3 pr-12 text-sm",
                        "focus:outline-none focus:border-bristol-electric focus:ring-2 focus:ring-bristol-electric/20",
                        "disabled:opacity-60 placeholder-bristol-cyan/60 text-white transition-all duration-200",
                        "hover:border-bristol-cyan/60 backdrop-blur"
                      )}
                    />
                    {loading && (
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-bristol-cyan/30 border-t-bristol-cyan rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    className={cx(
                      "inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold text-sm transition-all duration-200",
                      "bg-gradient-to-r from-bristol-cyan to-bristol-electric text-white shadow-lg",
                      "hover:from-bristol-electric hover:to-bristol-maroon hover:shadow-bristol-cyan/20",
                      "disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-105",
                      "border border-bristol-cyan/30 hover:border-bristol-electric/50"
                    )}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Send</span>
                      </>
                    )}
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
        "relative flex items-center gap-2 px-4 py-2 rounded-xl border text-xs sm:text-sm font-medium transition-all duration-300 group",
        active 
          ? "bg-gradient-to-r from-bristol-cyan/20 to-bristol-electric/20 text-bristol-cyan border-bristol-cyan/50 shadow-lg shadow-bristol-cyan/10" 
          : "bg-bristol-ink/40 text-bristol-cyan/70 border-bristol-cyan/20 hover:bg-bristol-cyan/10 hover:text-bristol-cyan hover:border-bristol-cyan/40"
      )}
    >
      {/* Active indicator */}
      {active && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-bristol-cyan to-bristol-electric rounded-t" />
      )}
      
      {/* Content */}
      <span className={cx("transition-colors", active ? "text-bristol-cyan" : "group-hover:text-bristol-cyan")}>
        {icon}
      </span>
      <span className="tracking-wide">{label}</span>
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