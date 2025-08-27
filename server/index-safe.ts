import express, { type Request, Response, NextFunction } from "express";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    console.log("🚀 Starting Company Site Intelligence Platform...");
    
    // Step 1: Create basic HTTP server
    console.log("📡 Creating HTTP server...");
    const { createServer } = await import("http");
    const server = createServer(app);
    console.log("✅ HTTP server created");

    // Step 2: Add health check first
    app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        services: {
          server: 'running',
          auth: 'simplified'
        }
      });
    });
    console.log("✅ Health check endpoint registered");

    // Step 3: Add simplified auth endpoint (no DB dependency)
    app.get('/api/auth/user', (req, res) => {
      res.json({ 
        id: "demo-user", 
        email: "demo@bristol.dev",
        firstName: "Demo",
        lastName: "User"
      });
    });
    console.log("✅ Simplified auth endpoint registered");

    // Step 4: Add OpenRouter models endpoint
    app.get('/api/openrouter-models', async (req, res) => {
      try {
        const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY2 || process.env.OPENROUTER_API_KEY;
        
        if (!OPENROUTER_API_KEY) {
          // Return hardcoded elite models if no API key
          return res.json([
            {"id":"openai/gpt-5-chat","label":"GPT-5 Chat","context":200000},
            {"id":"anthropic/claude-opus-4","label":"Claude Opus 4","context":200000},
            {"id":"x-ai/grok-4","label":"Grok 4","context":131072},
            {"id":"google/gemini-2.5-pro","label":"Gemini 2.5 Pro","context":1000000}
          ]);
        }

        // Try to fetch from OpenRouter with timeout
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
          throw new Error(`OpenRouter API error: ${response.status}`);
        }

        const { data } = await response.json();
        const ELITE_MODELS = new Set([
          "openai/gpt-5", "openai/gpt-5-chat",
          "anthropic/claude-opus-4", "anthropic/claude-opus-4.1",
          "x-ai/grok-4", "google/gemini-2.5-pro",
          "perplexity/sonar-deep-research"
        ]);

        const filtered = (data || [])
          .filter((m: any) => ELITE_MODELS.has(m.id))
          .map((m: any) => ({ 
            id: m.id, 
            label: m.name || m.id,
            context: m.context_length || 0
          }));

        res.json(filtered);
      } catch (error: any) {
        console.warn("OpenRouter models fetch failed:", error.message);
        // Fallback to hardcoded elite models
        res.json([
          {"id":"openai/gpt-5-chat","label":"GPT-5 Chat","context":200000},
          {"id":"anthropic/claude-opus-4","label":"Claude Opus 4","context":200000}
        ]);
      }
    });
    console.log("✅ OpenRouter models endpoint registered");

    // Step 5: Add OpenRouter chat endpoint
    app.post('/api/openrouter', async (req, res) => {
      try {
        const { model, messages } = req.body;
        const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY2 || process.env.OPENROUTER_API_KEY;
        
        if (!OPENROUTER_API_KEY) {
          return res.status(500).json({ error: "OpenRouter API key not configured" });
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "HTTP-Referer": "https://brand-site-intelligence.replit.app",
            "X-Title": "Company Site Intelligence Platform"
          },
          body: JSON.stringify({
            model: model || "openai/gpt-5-chat",
            messages: messages || [{"role": "user", "content": "Hello"}],
            temperature: 0.7,
            max_tokens: 1000,
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          return res.status(502).json({ error: "OpenRouter API error", details: errorText });
        }

        const json = await response.json();
        const text = json?.choices?.[0]?.message?.content || "No response";
        res.json({ text });
        
      } catch (error: any) {
        console.error("OpenRouter chat error:", error.message);
        res.status(500).json({ error: error?.message || "Chat service unavailable" });
      }
    });
    console.log("✅ OpenRouter chat endpoint registered");

    // Step 6: Add basic endpoints for the app
    app.get('/api/sites', (req, res) => {
      res.json([]);
    });

    app.get('/api/analytics/overview', (req, res) => {
      res.json({ totalSites: 0, activeSites: 0 });
    });
    console.log("✅ Basic app endpoints registered");

    // Step 7: Error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error("Express error:", err);
      res.status(status).json({ message });
    });

    // Step 8: Setup Vite (with timeout protection)
    if (app.get("env") === "development") {
      console.log("🔧 Setting up Vite development server...");
      try {
        await Promise.race([
          setupVite(app, server),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Vite setup timeout")), 10000)
          )
        ]);
        console.log("✅ Vite development server ready");
      } catch (error: any) {
        console.warn("Vite setup failed, serving static files:", error.message);
        serveStatic(app);
      }
    } else {
      serveStatic(app);
    }

    // Step 9: Start server
    const port = parseInt(process.env.PORT || '5000', 10);
    console.log(`🌐 Starting server on port ${port}...`);
    
    await new Promise<void>((resolve, reject) => {
      const serverTimeout = setTimeout(() => {
        reject(new Error("Server bind timeout"));
      }, 5000);

      server.listen({
        port,
        host: "0.0.0.0",
        reusePort: true,
      }, () => {
        clearTimeout(serverTimeout);
        console.log(`✅ Company Site Intelligence Platform running on http://0.0.0.0:${port}`);
        log(`serving on port ${port}`);
        resolve();
      });

      server.on('error', (error: any) => {
        clearTimeout(serverTimeout);
        reject(error);
      });
    });
    
  } catch (error: any) {
    console.error("❌ Server startup failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();