import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, PanelLeftOpen, Send, Settings, Database, MessageSquare } from "lucide-react";

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
        
        // Set default model - prefer GPT-4o, then Claude 3.5 Sonnet, then first available
        const preferred = models.find(m => m.id === "openai/gpt-4o") || 
                         models.find(m => m.id === "anthropic/claude-3.5-sonnet") ||
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
          "fixed top-24 left-0 z-50 group flex items-center gap-2 pl-2 pr-3 py-2",
          "bg-gradient-to-r from-bristol-maroon to-bristol-ink text-white rounded-r-2xl shadow-xl",
          "backdrop-blur border border-white/10 hover:from-bristol-ink hover:to-bristol-maroon transition-all duration-300"
        )}
        aria-label="Open Bristol Analyst"
      >
        <PanelLeftOpen className="h-5 w-5" />
        <span className="hidden sm:block text-sm font-medium">Bristol AI Analyst</span>
      </button>

      {/* Slideout Panel */}
      {open && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />

          {/* Panel */}
          <div className="absolute inset-y-0 left-0 w-[92vw] sm:w-[560px] bg-bristol-ink text-neutral-100 shadow-2xl border-r border-bristol-cyan/20 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-bristol-cyan/20 bg-gradient-to-r from-bristol-maroon/20 to-bristol-ink">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-bristol-cyan" />
                <span className="font-semibold bg-gradient-to-r from-bristol-cyan to-white bg-clip-text text-transparent">
                  Bristol Development — AI Analyst
                </span>
              </div>
              <button onClick={() => setOpen(false)} className="p-2 hover:bg-white/5 rounded-lg transition-colors" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Controls */}
            <div className="px-4 py-3 flex flex-wrap items-center gap-3 border-b border-bristol-cyan/20 bg-black/20">
              {modelError && (
                <div className="w-full text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {modelError}
                </div>
              )}
              <select
                className="bg-black/40 border border-bristol-cyan/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-bristol-cyan disabled:opacity-50"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                disabled={modelList.length === 0}
              >
                {modelList.length === 0 ? (
                  <option value="">Loading models...</option>
                ) : (
                  modelList.map((m: ModelOption) => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))
                )}
              </select>

              <div className="ml-auto flex items-center gap-2 text-xs text-bristol-cyan/70">
                <span className="hidden sm:block">Context objects:</span>
                <span className="px-2 py-1 rounded bg-bristol-cyan/10 border border-bristol-cyan/30">
                  {Object.keys(appData || {}).length}
                </span>
              </div>
            </div>

            {/* Tabs */}
            <div className="px-4 pt-3 flex items-center gap-2 text-sm">
              <TabButton icon={<MessageSquare className="h-4 w-4" />} active={activeTab === "chat"} label="Chat" onClick={() => setActiveTab("chat")} />
              <TabButton icon={<Database className="h-4 w-4" />} active={activeTab === "data"} label="Data" onClick={() => setActiveTab("data")} />
              <TabButton icon={<Settings className="h-4 w-4" />} active={activeTab === "admin"} label="Admin" onClick={() => setActiveTab("admin")} />
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

            {/* Composer */}
            {activeTab === "chat" && (
              <div className="border-t border-bristol-cyan/20 p-3 flex items-center gap-2 bg-black/20">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey ? handleSend() : null}
                  placeholder={loading ? "Waiting for reply…" : "Ask about properties, comps, demographics, market trends…"}
                  disabled={loading}
                  className="flex-1 bg-black/40 border border-bristol-cyan/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-bristol-cyan disabled:opacity-60"
                />
                <button
                  onClick={handleSend}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-bristol-cyan to-bristol-maroon text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
                >
                  <Send className="h-4 w-4" />
                  Send
                </button>
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
        "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs sm:text-sm transition-all",
        active 
          ? "bg-gradient-to-r from-bristol-cyan to-bristol-maroon text-white border-bristol-cyan" 
          : "bg-black/20 text-white border-bristol-cyan/30 hover:bg-bristol-cyan/10"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function ChatPane({ messages, loading }: { messages: ChatMessage[]; loading: boolean }) {
  return (
    <div className="h-full overflow-y-auto px-4 py-3 space-y-3">
      {messages.filter(m => m.role !== "system").map((m, i) => (
        <div 
          key={i} 
          className={cx(
            "p-3 rounded-lg border",
            m.role === "assistant" 
              ? "bg-bristol-cyan/5 border-bristol-cyan/20" 
              : "bg-black/30 border-bristol-maroon/30"
          )}
        >
          <div className="text-[10px] uppercase tracking-wide opacity-60 mb-1 text-bristol-cyan">
            {m.role}
          </div>
          <div className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</div>
        </div>
      ))}
      {loading && (
        <div className="p-3 rounded-lg border bg-bristol-cyan/5 border-bristol-cyan/20 animate-pulse text-sm">
          AI is analyzing your data…
        </div>
      )}
    </div>
  );
}

function DataPane({ data }: { data: any }) {
  return (
    <div className="h-full overflow-y-auto p-4">
      <pre className="text-xs leading-relaxed bg-black/40 p-3 rounded-lg border border-bristol-cyan/20 overflow-x-auto text-bristol-cyan/80">
        {safeStringify(data, 2)}
      </pre>
      <p className="text-xs text-bristol-cyan/60 mt-3">
        This shows all the data context available to the AI analyst including properties, demographics, and external API data.
      </p>
    </div>
  );
}

function AdminPane({ systemPrompt, setSystemPrompt, onSave }: { systemPrompt: string; setSystemPrompt: (v: string) => void; onSave: () => void }) {
  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-bristol-cyan/20">
        <div className="text-sm font-medium text-bristol-cyan">System Prompt (Bristol Mega Prompt)</div>
        <div className="text-xs text-bristol-cyan/60">This defines the AI analyst's behavior and knowledge base.</div>
      </div>
      <div className="p-3 flex-1 min-h-0">
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          className="w-full h-full text-sm bg-black/40 border border-bristol-cyan/30 rounded-lg p-3 focus:outline-none focus:border-bristol-cyan text-white"
          placeholder="Enter the system prompt..."
        />
      </div>
      <div className="p-3 border-t border-bristol-cyan/20 flex justify-end">
        <button 
          onClick={onSave} 
          className="px-3 py-2 rounded-lg bg-gradient-to-r from-bristol-cyan to-bristol-maroon text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Save Prompt
        </button>
      </div>
    </div>
  );
}