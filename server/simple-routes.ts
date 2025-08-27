import type { Express } from "express";
import { createServer, type Server } from "http";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Simple health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  // Simple auth endpoint - no authentication required
  app.get('/api/auth/user', (req, res) => {
    res.json({ 
      id: "demo-user", 
      email: "demo@yourcompany.com",
      firstName: "Demo",
      lastName: "User"
    });
  });

  // OpenRouter models - ELITE MODELS ONLY as requested by user
  app.get('/api/openrouter-models', async (req, res) => {
    try {
      const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY2 || process.env.OPENROUTER_API_KEY;
      
      if (!OPENROUTER_API_KEY) {
        // Return hardcoded elite models if no API key
        return res.json([
          {"id":"openai/gpt-5-chat","label":"GPT-5 Chat","context":200000},
          {"id":"openai/gpt-5","label":"GPT-5","context":200000},
          {"id":"anthropic/claude-opus-4","label":"Claude Opus 4","context":200000},
          {"id":"anthropic/claude-opus-4.1","label":"Claude Opus 4.1","context":200000},
          {"id":"x-ai/grok-4","label":"Grok 4","context":131072},
          {"id":"google/gemini-2.5-pro","label":"Gemini 2.5 Pro","context":1000000},
          {"id":"perplexity/sonar-deep-research","label":"Perplexity Sonar Deep Research","context":127072}
        ]);
      }

      // Try to fetch from OpenRouter API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch("https://openrouter.ai/api/v1/models", {
        headers: { 
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`OpenRouter models API error: ${response.status}`);
        // Return hardcoded elite models as fallback
        return res.json([
          {"id":"openai/gpt-5-chat","label":"GPT-5 Chat","context":200000},
          {"id":"anthropic/claude-opus-4","label":"Claude Opus 4","context":200000},
          {"id":"x-ai/grok-4","label":"Grok 4","context":131072},
          {"id":"google/gemini-2.5-pro","label":"Gemini 2.5 Pro","context":1000000}
        ]);
      }

      const { data } = await response.json();
      
      // ELITE MODELS ONLY - as specifically requested by user
      const ELITE_MODELS = new Set([
        "openai/gpt-5",
        "openai/gpt-5-chat", 
        "anthropic/claude-opus-4",
        "anthropic/claude-opus-4.1",
        "anthropic/claude-sonnet-4",
        "x-ai/grok-4",
        "google/gemini-2.5-pro",
        "google/gemini-2.5-flash",
        "perplexity/sonar-deep-research",
        "perplexity/sonar-reasoning",
        "perplexity/sonar-pro",
        "perplexity/sonar-reasoning-pro"
      ]);

      const getModelLabel = (slug: string): string => {
        const labelMap: Record<string, string> = {
          "openai/gpt-5": "GPT-5",
          "openai/gpt-5-chat": "GPT-5 Chat",
          "anthropic/claude-opus-4": "Claude Opus 4",
          "anthropic/claude-opus-4.1": "Claude Opus 4.1", 
          "anthropic/claude-sonnet-4": "Claude Sonnet 4",
          "x-ai/grok-4": "Grok 4",
          "google/gemini-2.5-pro": "Gemini 2.5 Pro",
          "google/gemini-2.5-flash": "Gemini 2.5 Flash",
          "perplexity/sonar-deep-research": "Perplexity Sonar Deep Research",
          "perplexity/sonar-reasoning": "Perplexity Sonar Reasoning",
          "perplexity/sonar-pro": "Perplexity Sonar Pro",
          "perplexity/sonar-reasoning-pro": "Perplexity Sonar Reasoning Pro"
        };
        return labelMap[slug] || slug;
      };

      const filtered = (data || [])
        .filter((m: any) => ELITE_MODELS.has(m.id))
        .map((m: any) => ({ 
          id: m.id, 
          label: getModelLabel(m.id),
          context: m.context_length || 0
        }));

      // Prefer GPT-5 Chat as default
      filtered.sort((a: any, b: any) => {
        const preferred = ["openai/gpt-5-chat", "openai/gpt-5", "anthropic/claude-opus-4.1", "x-ai/grok-4"];
        const aIndex = preferred.indexOf(a.id);
        const bIndex = preferred.indexOf(b.id);
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return a.label.localeCompare(b.label);
      });

      // If no elite models found, return hardcoded list
      if (filtered.length === 0) {
        return res.json([
          {"id":"openai/gpt-5-chat","label":"GPT-5 Chat","context":200000},
          {"id":"anthropic/claude-opus-4","label":"Claude Opus 4","context":200000},
          {"id":"x-ai/grok-4","label":"Grok 4","context":131072}
        ]);
      }

      res.json(filtered);
    } catch (error: any) {
      console.warn("OpenRouter models fetch failed:", error.message);
      // Always return elite models as fallback
      res.json([
        {"id":"openai/gpt-5-chat","label":"GPT-5 Chat","context":200000},
        {"id":"openai/gpt-5","label":"GPT-5","context":200000},
        {"id":"anthropic/claude-opus-4","label":"Claude Opus 4","context":200000},
        {"id":"x-ai/grok-4","label":"Grok 4","context":131072},
        {"id":"google/gemini-2.5-pro","label":"Gemini 2.5 Pro","context":1000000}
      ]);
    }
  });

  // OpenRouter proxy - ELITE MODELS chat endpoint
  app.post('/api/openrouter', async (req, res) => {
    try {
      const { model, messages, appData } = req.body;
      
      const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY2 || process.env.OPENROUTER_API_KEY;
      if (!OPENROUTER_API_KEY) {
        return res.status(500).json({ error: "OpenRouter API key not configured. Please add your OpenRouter API key to use AI chat." });
      }

      // Use OpenRouter API for elite models
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://brand-site-intelligence.replit.app",
          "X-Title": "Company Site Intelligence Platform"
        },
        body: JSON.stringify({
          model: model || "openai/gpt-5-chat", // Default to GPT-5 Chat
          messages: messages || [{"role": "user", "content": "Hello"}],
          temperature: 0.7,
          max_tokens: 2000,
          stream: false
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`OpenRouter API error ${response.status}:`, errorText);
        return res.status(502).json({ 
          error: `OpenRouter API error (${response.status})`, 
          details: errorText,
          model: model 
        });
      }

      const json = await response.json();
      const text = json?.choices?.[0]?.message?.content || "No response received from AI model";
      
      res.json({ text });
      
    } catch (error: any) {
      console.error("OpenRouter chat error:", error.message);
      if (error.name === 'AbortError') {
        res.status(408).json({ error: "Request timeout - AI model took too long to respond" });
      } else {
        res.status(500).json({ error: error?.message || "AI chat service unavailable" });
      }
    }
  });

  // Simple sites endpoint
  app.get('/api/sites', (req, res) => {
    res.json([]);
  });

  // Simple analytics endpoint
  app.get('/api/analytics/overview', (req, res) => {
    res.json({ totalSites: 0, activeSites: 0 });
  });

  return httpServer;
}