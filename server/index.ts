import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
    
    // Use simple routes temporarily to ensure server starts
    const { registerRoutes: registerSimpleRoutes } = await import('./simple-routes');
    const server = await registerSimpleRoutes(app);
    
    console.log("Routes registered successfully");

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
    }, () => {
      log(`serving on port ${port}`);
      console.log(`✅ Server successfully started on http://0.0.0.0:${port}`);
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
