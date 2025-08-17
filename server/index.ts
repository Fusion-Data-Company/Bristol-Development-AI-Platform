import express, { type Request, Response, NextFunction } from "express";
import cors from 'cors';
import compression from 'compression';
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { 
  securityHeaders, 
  rateLimiters, 
  sanitizeInput, 
  limitRequestSize, 
  ipProtection, 
  enhancedLogging, 
  validateContentType,
  corsConfig,
  emergencyShutdown
} from "./middleware/securityMiddleware";

const app = express();

// Enhanced security and performance middleware
app.use(securityHeaders);
app.use(cors(corsConfig));
app.use(compression({ threshold: 1024 })); // Compress responses > 1KB
app.use(emergencyShutdown);
app.use(ipProtection);
app.use(enhancedLogging);
app.use(limitRequestSize(50)); // 50MB max request size
app.use(validateContentType(['application/json', 'application/x-www-form-urlencoded', 'multipart/form-data']));
app.use(sanitizeInput);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Apply general rate limiting to all routes
app.use(rateLimiters.general);

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
    console.log("Starting server initialization...");
    
    // Register full routes including tools API
    const server = await registerRoutes(app);
    
    console.log("Routes registered successfully");
    
    // Initialize scheduler service for automated tasks
    const { schedulerService } = await import("./services/schedulerService");
    await schedulerService.initialize();
    console.log("Scheduler service initialized");

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      console.error("Express error handler:", err);
    });

    // Setup Vite in development
    if (app.get("env") === "development") {
      console.log("Setting up Vite development server...");
      await setupVite(app, server);
      console.log("Vite setup completed");
    } else {
      serveStatic(app);
    }

    // Start server
    const port = parseInt(process.env.PORT || '5000', 10);
    console.log(`Attempting to bind to port ${port}...`);
    
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, async () => {
      log(`serving on port ${port}`);
      console.log(`✅ Server successfully started on http://0.0.0.0:${port}`);
      
      // Initialize MCP servers after main server is running
      try {
        const { mcpServerManager } = await import('./services/mcpServerManager');
        setTimeout(() => {
          mcpServerManager.loadAndStartServers().catch(console.error);
        }, 3000);
      } catch (error) {
        console.error('Failed to initialize MCP server manager:', error);
      }

      // Start stability monitoring
      try {
        const { stabilityService } = await import('./services/stabilityService');
        stabilityService.startMonitoring(30000); // 30 second intervals
      } catch (error) {
        console.error('Failed to start stability monitoring:', error);
      }
    });

    // Handle server errors
    server.on('error', (error: any) => {
      console.error("Server error:", error);
      process.exit(1);
    });
    
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();
