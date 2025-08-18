import express, { type Request, Response, NextFunction } from "express";
import cors from 'cors';
import compression from 'compression';
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { 
  requestId,
  securityHeaders,
  smartCompression,
  rateLimiter,
  requestTimer
} from "./middleware/simplifiedMiddleware";
import { 
  initializePerformanceMonitoring 
} from "./middleware/performanceMiddleware";
import { setupHeapSnapshot, logger } from "../src/lib/logger";
import { metricsCollector } from "../src/lib/metrics";

const app = express();

// Trust proxy for rate limiting and IP detection
app.set('trust proxy', 1);

// Simplified middleware stack (exact order matters)
app.use(requestId);
app.use(securityHeaders);
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://*.replit.app', 'https://*.replit.dev']
    : ['http://localhost:3000', 'http://localhost:5000', 'http://0.0.0.0:5000'],
  credentials: true
}));
app.use(smartCompression);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(rateLimiter);
app.use(requestTimer);

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
    logger.info("Starting server initialization with crashless hardening...");
    
    // Setup heap snapshot capability
    setupHeapSnapshot();
    
    // Initialize performance monitoring
    initializePerformanceMonitoring();
    
    // Start metrics collection
    metricsCollector.startPeriodicLogging();
    
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
