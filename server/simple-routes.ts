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
      email: "demo@bristol.dev",
      firstName: "Demo",
      lastName: "User"
    });
  });

  // OpenRouter models - simple static list
  app.get('/api/openrouter-models', (req, res) => {
    res.json([
      {"id":"openai/gpt-4o","label":"GPT-4o","context":128000},
      {"id":"anthropic/claude-3-5-sonnet","label":"Claude 3.5 Sonnet","context":200000}
    ]);
  });

  // OpenRouter proxy - simple implementation
  app.post('/api/openrouter', async (req, res) => {
    try {
      const { model, messages } = req.body;
      
      const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
      if (!OPENAI_API_KEY) {
        return res.status(500).json({ error: "OpenAI API key not configured" });
      }

      // Use OpenAI directly since we have the key
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o", // Use GPT-4o with our OpenAI key
          messages: messages || [{"role": "user", "content": "Hello"}],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(502).json({ error: "OpenAI API error", details: errorText });
      }

      const json = await response.json();
      const text = json?.choices?.[0]?.message?.content || "No response";
      res.json({ text });
      
    } catch (error: any) {
      console.error("API error:", error);
      res.status(500).json({ error: error?.message || "unknown" });
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