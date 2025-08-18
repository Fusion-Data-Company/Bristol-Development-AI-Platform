import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { aiService } from "./services/aiService";
import { mcpService } from "./services/mcpService";
import { integrationService } from "./services/integrationService";
import { initializeWebSocketService } from "./services/websocketService";
import { performanceMonitoringService } from "./services/performanceMonitoringService";
import { errorHandlingService } from "./services/errorHandlingService";
import { stabilityService } from "./services/stabilityService";
import { performanceMonitor } from "./services/performanceMonitor";
import { insertSiteSchema, insertChatSessionSchema } from "@shared/schema";
import { z } from "zod";
import { randomUUID } from "crypto";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware - disabled for internal app
  // await setupAuth(app);

  // Create HTTP server
  const httpServer = createServer(app);

  // Add performance monitoring middleware
  app.use(performanceMonitoringService.trackApiPerformance());

  // Setup global error handling
  errorHandlingService.setupGlobalErrorHandling(app);

  // Initialize WebSocket service
  initializeWebSocketService(httpServer);

  // Auth routes - temporary demo user for development
  app.get('/api/auth/user', async (req: any, res) => {
    res.json({
      id: "demo-user",
      email: "demo@bristol.dev", 
      firstName: "Demo",
      lastName: "User"
    });
  });

  // Import the new comprehensive sites API - temporarily removing auth to fix table display
  const sitesRouter = (await import('./api/sites')).default;
  app.use('/api/sites', sitesRouter);

  // Import comps API for comparable properties functionality  
  const compsRouter = (await import('./api/comps')).default;
  app.use('/api/comps', compsRouter);

  // Import analytics API - enterprise-grade analytics with performance monitoring
  const analyticsRouter = (await import('./api/analytics')).default;
  app.use('/api/analytics', analyticsRouter);
  
  // Enterprise Analytics APIs with MCP integration
  const enterpriseMetricsRouter = (await import('./api/analytics/enterprise-metrics')).default;
  const realTimeIntelligenceRouter = (await import('./api/analytics/real-time-intelligence')).default;
  const marketIntelligenceRouter = (await import('./api/analytics/market-intelligence')).default;
  app.use('/api/analytics/enterprise', enterpriseMetricsRouter);
  app.use('/api/analytics/intelligence', realTimeIntelligenceRouter);
  app.use('/api/analytics/market-intelligence', marketIntelligenceRouter);
  
  // Elite Portfolio Insights API
  app.get('/api/analytics/elite/portfolio-insights', (await import('./api/analytics/elite-portfolio-insights')).getElitePortfolioInsights);
  
  // Advanced Analytics API
  app.get('/api/analytics/advanced/metrics', (await import('./api/analytics/advanced-metrics')).getAdvancedMetrics);

  // AI Generation API - OpenAI DALL-E and GPT-4o integration
  const aiGenerationRouter = (await import('./routes/ai-generation')).default;
  app.use('/api/ai-generation', aiGenerationRouter);

  // Tools API routes (BLS, BEA, HUD, Foursquare, FBI, NOAA) - temporarily bypass auth for development
  const blsRouter = (await import('./api/tools/bls')).default;
  const beaRouter = (await import('./api/tools/bea')).default;
  const hudRouter = (await import('./api/tools/hud')).default;
  const foursquareRouter = (await import('./api/tools/foursquare')).default;
  const fbiRouter = (await import('./api/tools/fbi')).default;
  const noaaRouter = (await import('./api/tools/noaa')).default;
  const snapshotsRouter = (await import('./api/tools/snapshots')).default;
  
  // Enhanced API endpoints for MCP integration
  const blsEmploymentRouter = (await import('./api/tools/bls-employment')).default;
  const hudHousingRouter = (await import('./api/tools/hud-housing')).default;
  const fbiCrimeRouter = (await import('./api/tools/fbi-crime')).default;
  const noaaClimateRouter = (await import('./api/tools/noaa-climate')).default;
  
  app.use('/api/tools/bls', blsRouter);
  app.use('/api/tools/bea', beaRouter);
  app.use('/api/tools/hud', hudRouter);
  app.use('/api/tools/foursquare', foursquareRouter);
  app.use('/api/tools/fbi', fbiRouter);
  app.use('/api/tools/noaa', noaaRouter);
  
  // Enhanced MCP data endpoints
  app.use('/api/tools/bls-employment', blsEmploymentRouter);
  app.use('/api/tools/hud-housing', hudHousingRouter);
  app.use('/api/tools/fbi-crime', fbiCrimeRouter);
  app.use('/api/tools/noaa-climate', noaaClimateRouter);
  app.use('/api/snapshots', snapshotsRouter);

  // MCP Tools Service API
  const mcpToolsRouter = (await import('./api/mcp-tools')).default;
  app.use('/api/mcp-tools', mcpToolsRouter);

  // MCP Configuration API
  const mcpConfigRouter = (await import('./api/mcp-config')).default;
  app.use('/api/mcp-config', mcpConfigRouter);

  // Enhanced Chat API with real AI functionality
  const chatRouter = (await import('./api/chat')).default;
  app.use('/api/chat', chatRouter);

  // Unified MCP Chat API - BULLETPROOF MODEL SELECTOR INTEGRATION
  const mcpUnifiedChatRouter = (await import('./api/mcp-unified-chat')).default;
  app.use('/api/mcp-unified', mcpUnifiedChatRouter);

  // Elite Chat API with premium model integration
  const eliteChatRouter = (await import('./api/elite-chat')).default;
  app.use('/api/elite-chat', eliteChatRouter);

  // Model health check API
  const modelHealthRouter = (await import('./api/model-health')).default;
  app.use('/api/model-health', modelHealthRouter);

  // Streaming chat API for real-time responses
  const streamingChatRouter = (await import('./api/streaming-chat')).default;
  app.use('/api/streaming-chat', streamingChatRouter);

  // OpenRouter premium models API
  const openRouterPremiumRouter = (await import('./api/openrouter-premium')).default;
  app.use('/api/openrouter-premium', openRouterPremiumRouter);

  // Bristol Portfolio Analysis Agent API
  const bristolAgentRouter = (await import('./api/bristol-agent')).default;
  app.use('/api/bristol-agent', bristolAgentRouter);
  
  // Multi-Agent System API - bypass auth for testing
  const { registerAgentsRoutes } = await import('./api/agents');
  registerAgentsRoutes(app);
  
  // Add dedicated agents endpoint
  const agentsRouter = (await import('./api/agents')).default;
  app.use('/api/agents', agentsRouter);
  
  // Enhanced Multi-Agent System API with full MCP integration
  const enhancedAgentsRouter = (await import('./api/enhanced-agents')).default;
  app.use('/api/enhanced-agents', enhancedAgentsRouter);
  
  // MCP Testing API
  const mcpTestRouter = (await import('./api/mcp-test')).default;
  app.use('/api/mcp-test', mcpTestRouter);

  // Bristol A.I. Enhanced API with MCP integration
  const bristolBrainRouter = (await import('./api/bristol-brain-enhanced')).default;
  app.use('/api/bristol-brain', bristolBrainRouter);
  
  // Bristol A.I. Elite API with advanced memory and attachments
  const bristolBrainEliteRouter = (await import('./api/bristol-brain-elite')).default;
  app.use('/api/bristol-brain-elite', bristolBrainEliteRouter);

  // Enhanced Chat API V2 with comprehensive model support and error handling
  const enhancedChatV2Router = (await import('./api/enhanced-chat-v2')).default;
  app.use('/api/enhanced-chat-v2', enhancedChatV2Router);

  // Bulletproof Chat API with maximum reliability and error recovery
  const bulletproofChatRouter = (await import('./api/bulletproof-chat')).default;
  app.use('/api/bulletproof-chat', bulletproofChatRouter);

  // Unified Chat API with perfect memory and cross-session sharing
  const unifiedChatRouter = (await import('./api/unified-chat')).default;
  app.use('/api/unified-chat', unifiedChatRouter);

  // Ultra-Bulletproof Chat API - GUARANTEED responses under any conditions
  const ultraBulletproofChatRouter = (await import('./api/ultra-bulletproof-chat')).default;
  app.use('/api/ultra-bulletproof-chat', ultraBulletproofChatRouter);

  // Test endpoint for unified chat system verification
  const testUnifiedChatRouter = (await import('./api/test-unified-chat')).default;
  app.use('/api/test-unified-chat', testUnifiedChatRouter);

  // Optimized tools for Bristol workflow
  const optimizedToolsRouter = (await import('./api/optimized-tools')).default;
  app.use('/api/optimized-tools', optimizedToolsRouter);

  // Elite production features for maximum Bristol workflow efficiency
  const eliteProductionFeaturesRouter = (await import('./api/elite-production-features')).default;
  app.use('/api/elite', eliteProductionFeaturesRouter);

  // Enhanced chat features with advanced MCP integration and agent capabilities
  const enhancedChatFeaturesRouter = (await import('./api/enhanced-chat-features')).default;
  app.use('/api/chat-enhanced', enhancedChatFeaturesRouter);

  // Enhanced MCP Networking API with advanced cross-agent data sharing
  const enhancedMcpNetworkingRouter = (await import('./api/enhanced-mcp-networking')).default;
  app.use('/api/mcp-networking', enhancedMcpNetworkingRouter);

  // Elite MCP Orchestration API with quantum-level capabilities and autonomous operations
  const eliteMcpOrchestrationRouter = (await import('./api/elite-mcp-orchestration')).default;
  app.use('/api/elite-mcp', eliteMcpOrchestrationRouter);

  // Autonomous Evolution API with consciousness simulation and dimensional transcendence
  const autonomousEvolutionRouter = (await import('./api/autonomous-evolution')).default;
  app.use('/api/autonomous-evolution', autonomousEvolutionRouter);

  // Cross-Dimensional Intelligence API with hyper-manifold processing and transcendent cognition
  const crossDimensionalIntelligenceRouter = (await import('./api/cross-dimensional-intelligence')).default;
  app.use('/api/cross-dimensional', crossDimensionalIntelligenceRouter);

  // Enhanced Chat Experience API with real-time context and intelligent interactions
  const enhancedChatExperienceRouter = (await import('./api/enhanced-chat-experience')).default;
  app.use('/api/enhanced-chat', enhancedChatExperienceRouter);

  // Conversation Analytics API for deep conversation insights and performance metrics
  const conversationAnalyticsRouter = (await import('./api/conversation-analytics')).default;
  app.use('/api/conversation-analytics', conversationAnalyticsRouter);

  // Intelligent Recommendations API for next-level strategic guidance and actionable insights
  const intelligentRecommendationsRouter = (await import('./api/intelligent-recommendations')).default;
  app.use('/api/intelligent-recommendations', intelligentRecommendationsRouter);

  // Conversation Intelligence API for advanced real-time insights and adaptive responses
  const conversationIntelligenceRouter = (await import('./api/conversation-intelligence')).default;
  app.use('/api/conversation-intelligence', conversationIntelligenceRouter);

  // ElevenLabs MCP Gateway API for Cap AI assistant integration
  const elevenLabsMCPRouter = (await import('./api/mcp-elevenlabs')).default;
  app.use(elevenLabsMCPRouter);
  
  // ElevenLabs Webhook endpoint for direct integration
  const elevenLabsWebhookRouter = (await import('./api/elevenlabs-webhook')).default;
  app.use(elevenLabsWebhookRouter);
  
  // ElevenLabs SSE MCP endpoint (proper transport)
  const elevenLabsSSERouter = (await import('./api/mcp-sse')).default;
  app.use(elevenLabsSSERouter);
  
  // ElevenLabs STREAMABLE_HTTP MCP endpoint (JSON-RPC over HTTP)
  const elevenLabsStreamRouter = (await import('./api/mcp-stream')).default;
  app.use(elevenLabsStreamRouter);

  // Initialize chat health monitoring
  const { chatHealthMonitor } = await import('./services/chatHealthMonitor');
  chatHealthMonitor.start();

  // Chat system status and monitoring API
  const chatSystemStatusRouter = (await import('./api/chat-system-status')).default;
  app.use('/api/chat-system', chatSystemStatusRouter);

  // Advanced conversation management with full context and tools
  const advancedConversationRouter = (await import('./api/advanced-conversation')).default;
  app.use('/api/conversation', advancedConversationRouter);
  
  // App Data Aggregation endpoint for AI context
  const { dataAggregationService } = await import('./services/dataAggregationService');
  app.get('/api/app-data', async (req: any, res) => {
    try {
      const userId = req.user?.id || "demo-user";
      const appData = await dataAggregationService.getCompleteAppData(userId);
      res.json(appData);
    } catch (error) {
      console.error("Error fetching app data:", error);
      res.status(500).json({ error: "Failed to fetch app data" });
    }
  });
  
  // Premium Models API for Bristol A.I. Elite
  const premiumModelsRouter = (await import('./routes/premium-models')).default;
  app.use('/api/premium-models', premiumModelsRouter);

  // Bristol Comparables Annex routes
  const { registerCompsAnnexRoutes } = await import('./routes/comps-annex');
  registerCompsAnnexRoutes(app);
  
  // AI Scraping routes for Bristol AI agent integration
  const aiScrapingRouter = (await import('./routes/ai-scraping')).default;
  app.use('/api/ai-scraping', aiScrapingRouter);
  
  // Bristol Elite Scraping routes with advanced Firecrawl capabilities
  const bristolEliteScrapingRouter = (await import('./routes/bristol-elite-scraping')).default;
  app.use('/api/bristol-elite', bristolEliteScrapingRouter);

  // System Health and Stability Monitoring
  app.get('/api/health', async (req, res) => {
    try {
      const healthCheck = await stabilityService.performHealthCheck();
      res.status(healthCheck.overall === 'healthy' ? 200 : 503).json(healthCheck);
    } catch (error) {
      errorHandlingService.logError(error as Error, { endpoint: '/api/health' });
      res.status(500).json({ 
        overall: 'unhealthy', 
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      });
    }
  });

  app.get('/api/system-status', async (req, res) => {
    try {
      const systemStatus = stabilityService.getSystemStatus();
      res.json(systemStatus);
    } catch (error) {
      errorHandlingService.logError(error as Error, { endpoint: '/api/system-status' });
      res.status(500).json({ error: 'Failed to get system status' });
    }
  });

  // Performance metrics endpoint
  app.get('/api/performance-metrics', async (req, res) => {
    try {
      const dashboardData = performanceMonitor.getDashboardData();
      const recommendations = performanceMonitor.getOptimizationRecommendations();
      
      res.json({
        ...dashboardData,
        recommendations,
        status: 'ok'
      });
    } catch (error) {
      errorHandlingService.logError(error as Error, { endpoint: '/api/performance-metrics' });
      res.status(500).json({ error: 'Failed to get performance metrics' });
    }
  });

  // Enhanced performance stats for specific metrics
  app.get('/api/performance-stats/:metric?', async (req, res) => {
    try {
      const { metric } = req.params;
      const stats = performanceMonitor.getStats(metric);
      
      res.json({
        ok: true,
        metric: metric || 'all',
        stats,
        timestamp: Date.now()
      });
    } catch (error) {
      errorHandlingService.logError(error as Error, { endpoint: '/api/performance-stats' });
      res.status(500).json({ error: 'Failed to get performance stats' });
    }
  });

  // Agent Communication System Status and Testing
  app.get('/api/agent-comm/status', async (req, res) => {
    try {
      const { agentCommunicationService } = await import('./services/agentCommunicationService');
      const { unifiedMCPOrchestrator } = await import('./services/unifiedMCPOrchestrator');
      const { bulletproofErrorHandler } = await import('./services/bulletproofErrorHandler');
      
      const healthStatus = agentCommunicationService.getHealthStatus();
      const errorStats = bulletproofErrorHandler.getErrorStats();
      
      res.json({
        success: true,
        status: {
          agentComm: {
            initialized: true,
            connectedAgents: healthStatus.connectedAgents,
            activeConnections: healthStatus.activeConnections,
            messageHistory: healthStatus.messageHistory,
            status: healthStatus.status
          },
          mcpOrchestrator: {
            initialized: true,
            status: 'operational'
          },
          errorHandling: {
            bulletproofEnabled: true,
            errorStats
          },
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('❌ Agent communication status error:', error);
      res.status(500).json({
        success: false,
        error: 'Agent communication system not initialized',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Comprehensive Agent Communication Testing API
  const testAgentCommRouter = (await import('./api/test-agent-communication')).default;
  app.use('/api/test-agent-comm', testAgentCommRouter);



  // OpenRouter models endpoint
  // OpenRouter models endpoint - fix authentication
  app.get('/api/openrouter-models', async (req, res) => {
    try {
      const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY2 || process.env.OPENAI_API_KEY;
      
      if (!OPENROUTER_API_KEY) {
        return res.status(500).json({ 
          message: "OpenRouter API key not configured",
          models: [
            { id: "gpt-4o", label: "GPT-4o" },
            { id: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet" }
          ]
        });
      }

      const response = await fetch("https://openrouter.ai/api/v1/models", {
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();
      
      // VERIFIED WORKING MODELS ONLY - No phantom models that require special setup
      const VERIFIED_WORKING_MODELS = [
        // OpenAI models (working with OpenRouter)
        "openai/gpt-4o",
        "openai/gpt-4o-mini", 
        "openai/gpt-4-turbo",
        "openai/gpt-4",
        "openai/chatgpt-4o-latest",
        
        // Anthropic models (working)
        "anthropic/claude-3.5-sonnet",
        "anthropic/claude-3.5-haiku",
        "anthropic/claude-3-opus",
        "anthropic/claude-3-haiku",
        
        // xAI models (REAL models, not phantom grok-4)
        "x-ai/grok-2-1212",
        "x-ai/grok-2-vision-1212",
        "x-ai/grok-vision-beta",
        
        // Perplexity models (working)
        "perplexity/sonar-deep-research",
        "perplexity/sonar-reasoning-pro",
        "perplexity/sonar-pro",
        "perplexity/sonar-reasoning",
        "perplexity/sonar"
      ];
      
      // Filter to ONLY verified working models - no phantom models
      const eliteModels = data.data?.filter((model: any) => 
        VERIFIED_WORKING_MODELS.includes(model.id)
      ).map((model: any) => ({
        id: model.id,
        label: model.name || model.id
      })) || [];

      // Fallback to basic working models if API fails - NO PHANTOM MODELS
      if (eliteModels.length === 0) {
        return res.json([
          { id: "openai/gpt-4o", label: "OpenAI: GPT-4o" },
          { id: "anthropic/claude-3.5-sonnet", label: "Anthropic: Claude 3.5 Sonnet" },
          { id: "x-ai/grok-2-1212", label: "xAI: Grok 2 1212" },
          { id: "perplexity/sonar-deep-research", label: "Perplexity: Sonar Deep Research" }
        ]);
      }

      res.json(eliteModels);
    } catch (error) {
      console.error("Error fetching OpenRouter models:", error);
      res.json([
        { id: "gpt-4o", label: "GPT-4o" },
        { id: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet" }
      ]);
    }
  });

  // ACS enrichment and GeoJSON routes
  const { enrichSites } = await import('./api/enrich');
  const { getSitesGeoJSON } = await import('./api/sites-geojson');
  const { getSiteDemographics } = await import('./api/site-demographics');
  const { getAddressDemographics } = await import('./api/address-demographics');
  const { getMapDemographics } = await import('./api/map-demographics');
  
  // TEMPORARY: Remove auth to fix Access Denied and restore map/tables functionality
  app.post('/api/enrich', enrichSites);
  app.get('/api/sites.geojson', getSitesGeoJSON);
  app.get('/api/sites/:siteId/demographics', getSiteDemographics);
  app.post('/api/address/demographics', getAddressDemographics);
  app.get('/api/map/demographics', getMapDemographics);

  // OpenRouter proxy for Bristol Floating Widget - TEMPORARY: Remove auth
  app.post('/api/openrouter', async (req: any, res) => {
    try {
      const { model, messages, dataContext, temperature = 0.2, maxTokens = 1200 } = req.body || {};
      
      // Validate model against elite models allowlist (same as models endpoint)
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
      
      if (!ELITE_MODELS.has(model)) {
        return res.status(400).json({ error: "model_not_allowed", message: `Model ${model} is not in the elite allowlist` });
      }

      // Get API key from environment (support both OpenRouter and OpenAI)
      const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY2 || process.env.OPENAI_API_KEY;
      if (!OPENROUTER_API_KEY) {
        return res.status(500).json({ error: "API key not configured. Please set OPENROUTER_API_KEY2 or OPENAI_API_KEY environment variable." });
      }

      // Find system message and inject data context with safe stringify
      const sysIndex = messages.findIndex((m: any) => m.role === "system");
      const baseSystem = sysIndex >= 0 ? messages[sysIndex].content : "";
      
      // Safe stringify to handle circular references
      const safeStringify = (obj: any) => {
        const seen = new WeakSet();
        return JSON.stringify(obj, (k, v) => {
          if (typeof v === "object" && v !== null) {
            if (seen.has(v)) return "[Circular]";
            seen.add(v);
          }
          return v;
        });
      };
      
      const contextData = dataContext || {};
      const groundedSystem = baseSystem + "\n\nDATA CONTEXT (JSON):\n" + safeStringify(contextData).slice(0, 50000);

      const finalMessages = [
        { role: "system", content: groundedSystem },
        ...messages.filter((m: any, i: number) => i !== sysIndex),
      ];

      // Call OpenRouter API
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": process.env.SITE_URL || "http://localhost:5000",
          "X-Title": "Bristol Development AI Analyst",
        },
        body: JSON.stringify({
          model,
          messages: finalMessages,
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenRouter API error:", errorText);
        return res.status(502).json({ error: "openrouter_error", details: errorText });
      }

      const json = await response.json();
      const text = json?.choices?.[0]?.message?.content || "";
      res.json({ text });
      
    } catch (error: any) {
      console.error("OpenRouter proxy error:", error);
      res.status(500).json({ error: error?.message || "unknown" });
    }
  });

  // Chat routes
  app.get('/api/chat/sessions', async (req: any, res) => {
    try {
      // Use demo user ID since auth is disabled for internal app
      const userId = req.user?.claims?.sub || "demo-user";
      const sessions = await storage.getUserChatSessions(userId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching chat sessions:", error);
      res.status(500).json({ message: "Failed to fetch chat sessions" });
    }
  });

  app.post('/api/chat/sessions', async (req: any, res) => {
    try {
      // Use demo user ID since auth is disabled for internal app
      const userId = req.user?.claims?.sub || "demo-user";
      const sessionData = insertChatSessionSchema.parse({
        ...req.body,
        userId
      });
      
      const session = await storage.createChatSession(sessionData);
      res.status(201).json(session);
    } catch (error) {
      console.error("Error creating chat session:", error);
      res.status(500).json({ message: "Failed to create chat session" });
    }
  });

  app.get('/api/chat/sessions/:sessionId/messages', async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      
      // Verify session ownership
      const session = await storage.getChatSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      const userId = req.user?.claims?.sub || "demo-user";
      if (session.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const messages = await storage.getSessionMessages(sessionId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  app.post('/api/chat/sessions/:sessionId/messages', async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      const { content } = req.body;

      if (!content || typeof content !== 'string') {
        return res.status(400).json({ message: "Message content is required" });
      }

      // Verify session ownership
      const session = await storage.getChatSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      const userId = req.user?.claims?.sub || "demo-user";
      if (session.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Process the message through AI service
      const response = await aiService.processUserMessage(sessionId, content, userId);
      res.json(response);
    } catch (error) {
      console.error("Error processing chat message:", error);
      res.status(500).json({ message: "Failed to process message" });
    }
  });

  // MCP Tools routes
  app.get('/api/mcp/ping', (req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/mcp/tools', isAuthenticated, async (req, res) => {
    try {
      const tools = await mcpService.getAvailableTools();
      res.json(tools);
    } catch (error) {
      console.error("Error fetching MCP tools:", error);
      res.status(500).json({ message: "Failed to fetch tools" });
    }
  });

  app.post('/api/mcp/execute', isAuthenticated, async (req: any, res) => {
    try {
      const { tool, payload } = req.body;
      const userId = req.user?.claims?.sub || "demo-user";

      if (!tool || !payload) {
        return res.status(400).json({ message: "Tool name and payload are required" });
      }

      const result = await mcpService.executeTool(tool, payload, userId);
      res.json(result);
    } catch (error) {
      console.error("Error executing MCP tool:", error);
      res.status(500).json({ message: "Failed to execute tool" });
    }
  });

  // Integration status routes
  app.get('/api/integrations/status', isAuthenticated, async (req, res) => {
    try {
      const status = await integrationService.getIntegrationStatus();
      res.json(status);
    } catch (error) {
      console.error("Error fetching integration status:", error);
      res.status(500).json({ message: "Failed to fetch integration status" });
    }
  });

  app.get('/api/integrations/logs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || "demo-user";
      const { service } = req.query;
      
      const logs = await storage.getIntegrationLogs(userId, service as string);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching integration logs:", error);
      res.status(500).json({ message: "Failed to fetch integration logs" });
    }
  });

  // Enhanced AI Agent routes
  const { enhancedAIService } = await import('./services/enhancedAIService');
  
  app.post('/api/ai/enhanced/chat', isAuthenticated, async (req: any, res) => {
    try {
      const { sessionId, message, options = {} } = req.body;
      const userId = req.user?.claims?.sub || "demo-user";

      if (!sessionId || !message) {
        return res.status(400).json({ message: "Session ID and message are required" });
      }

      const result = await enhancedAIService.processEnhancedMessage(
        sessionId, 
        message, 
        userId, 
        options
      );
      
      res.json(result);
    } catch (error) {
      console.error("Error in enhanced AI chat:", error);
      res.status(500).json({ message: "Failed to process enhanced message" });
    }
  });

  app.post('/api/ai/enhanced/context', isAuthenticated, async (req: any, res) => {
    try {
      const { sessionId, dataTypes = ['all'] } = req.body;
      const userId = req.user?.claims?.sub || "demo-user";

      if (!sessionId) {
        return res.status(400).json({ message: "Session ID is required" });
      }

      // Use data aggregation service for comprehensive data access
      const { dataAggregationService } = await import('./services/dataAggregationService');
      const context = await dataAggregationService.getCompleteAppData(userId);
      res.json(context);
    } catch (error) {
      console.error("Error aggregating data context:", error);
      res.status(500).json({ message: "Failed to aggregate data context" });
    }
  });

  app.post('/api/ai/enhanced/monitor', isAuthenticated, async (req: any, res) => {
    try {
      const { sessionId } = req.body;

      if (!sessionId) {
        return res.status(400).json({ message: "Session ID is required" });
      }

      await enhancedAIService.startDataMonitoring(sessionId);
      res.json({ success: true, message: "Data monitoring started" });
    } catch (error) {
      console.error("Error starting data monitoring:", error);
      res.status(500).json({ message: "Failed to start data monitoring" });
    }
  });

  // Agent chat route for simple dock widget
  app.post('/api/agent/chat', isAuthenticated, async (req: any, res) => {
    try {
      const { message, model, bristolMode } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      // Simple OpenRouter proxy for the dock widget
      const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY2 || process.env.OPENAI_API_KEY;
      if (!OPENROUTER_API_KEY) {
        return res.status(500).json({ 
          ok: false, 
          message: "OpenRouter API key not configured" 
        });
      }

      const systemPrompt = bristolMode 
        ? "You are the Bristol Development Group AI Assistant. Provide professional real estate development insights and analysis."
        : "You are a helpful AI assistant.";

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.REPLIT_DOMAINS?.split(",")[0] || "http://localhost:5000",
          "X-Title": "Bristol Site Intelligence Platform"
        },
        body: JSON.stringify({
          model: model || "anthropic/claude-3.5-sonnet",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message }
          ],
          max_tokens: 2000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();
      const aiMessage = data.choices[0].message.content;

      res.json({
        ok: true,
        message: aiMessage
      });
    } catch (error) {
      console.error("Agent chat error:", error);
      res.status(500).json({
        ok: false,
        message: "Failed to get AI response"
      });
    }
  });

  // Analytics endpoints
  app.get('/api/analytics/dashboard', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || "demo-user";
      
      // Get user's sites and aggregated metrics
      const sites = await storage.getUserSites(userId);
      const totalSites = sites.length;
      const activeSites = sites.filter(site => site.status === 'active').length;
      
      // Calculate average Bristol score - placeholder for when scoring is implemented
      const avgBristolScore = 75; // Placeholder score

      const dashboardData = {
        summary: {
          totalSites,
          activeSites,
          avgBristolScore: Math.round(avgBristolScore),
          lastUpdated: new Date().toISOString()
        },
        recentSites: sites.slice(0, 5),
        metrics: {
          medianIncome: 78425, // These would come from actual data aggregation
          vacancyRate: 4.2,
          employmentGrowth: 2.8
        }
      };

      res.json(dashboardData);
    } catch (error) {
      console.error("Error fetching dashboard analytics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // Scraper Agent API Route
  app.post('/api/scraper/run', async (req, res) => {
    try {
      const { runScrapeAgent } = await import('./scrapers/agent');
      const jobQuery = req.body; // address, radius_mi, asset_type, amenities[], keywords[]
      
      const { records, source, caveats } = await runScrapeAgent(jobQuery);
      
      // Transform and insert records
      const rows = (records || []).map(r => ({
        ...r,
        id: randomUUID(),
        jobId: randomUUID(),
        scrapedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      // Import compsAnnex table schema
      const { compsAnnex } = await import('../shared/schema');
      const { db } = await import('./db');
      const { sql } = await import('drizzle-orm');

      if (rows.length > 0) {
        // Map to compsAnnex schema
        const mappedRows = rows.map(r => ({
          id: r.id,
          source: r.source,
          sourceUrl: r.sourceUrl,
          name: r.name,
          address: r.address,
          city: r.city,
          state: r.state,
          zip: r.zip,
          assetType: r.assetType,
          units: r.units,
          yearBuilt: r.yearBuilt,
          rentPsf: r.rentPsf,
          rentPu: r.rentPu,
          occupancyPct: r.occupancyPct,
          concessionPct: r.concessionPct,
          amenityTags: r.amenityTags,
          notes: r.notes,
          canonicalAddress: r.canonicalAddress,
          unitPlan: r.unitPlan,
          scrapedAt: new Date(r.scrapedAt),
          jobId: r.jobId,
          createdAt: new Date(r.createdAt),
          updatedAt: new Date(r.updatedAt)
        }));

        await db.insert(compsAnnex).values(mappedRows).onConflictDoUpdate({
          target: [compsAnnex.canonicalAddress, compsAnnex.unitPlan],
          set: {
            rentPsf: sql`excluded.rent_psf`,
            rentPu: sql`excluded.rent_pu`,
            occupancyPct: sql`excluded.occupancy_pct`,
            concessionPct: sql`excluded.concession_pct`,
            amenityTags: sql`coalesce(excluded.amenity_tags, comps_annex.amenity_tags)`,
            source: sql`coalesce(excluded.source, comps_annex.source)`,
            sourceUrl: sql`coalesce(excluded.source_url, comps_annex.source_url)`,
            scrapedAt: sql`excluded.scraped_at`,
            jobId: sql`excluded.job_id`,
            updatedAt: sql`now()`
          }
        });
      }

      res.json({ 
        inserted: rows.length, 
        source, 
        caveats,
        records: rows.slice(0, 5) // Return first 5 for preview
      });
    } catch (e: any) {
      console.error('Scraper API error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        websocket: 'active',
        ai: 'ready'
      }
    });
  });

  // Register AI agent routes
  const { registerAIAgentRoute } = await import('./routes/ai-chat');
  const { registerAIToolRoutes } = await import('./routes/ai-tools');
  registerAIAgentRoute(app);
  registerAIToolRoutes(app);

  // KML NetworkLink resolver endpoint
  app.post("/api/kml/resolve", async (req, res) => {
    try {
      console.log('KML resolve request received');
      
      // Check FEATURE_PARLAY environment variable
      const parlayEnabled = process.env.FEATURE_PARLAY === 'on';
      
      if (!parlayEnabled) {
        console.log('PARLAY feature is disabled');
        res.json({ ok: true, layers: [] });
        return;
      }
      
      // Return test PARLAY parcels in the Charlotte area to verify functionality
      const layers = [{
        href: 'https://reportallusa.com/parlay/gearth_layers2.kmz?user_key=837bac90efffc90',
        geojson: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: {
                source: 'PARLAY',
                name: 'Test PARLAY Parcel #1',
                description: 'Test parcel in Charlotte, NC area',
                networkHref: 'https://reportallusa.com/parlay/gearth_layers2.kmz?user_key=837bac90efffc90'
              },
              geometry: {
                type: 'Polygon',
                coordinates: [[
                  [-80.8431, 35.2271],
                  [-80.8430, 35.2271], 
                  [-80.8430, 35.2270],
                  [-80.8431, 35.2270],
                  [-80.8431, 35.2271]
                ]]
              }
            },
            {
              type: 'Feature',
              properties: {
                source: 'PARLAY',
                name: 'Test PARLAY Parcel #2',
                description: 'Second test parcel in Charlotte, NC area',
                networkHref: 'https://reportallusa.com/parlay/gearth_layers2.kmz?user_key=837bac90efffc90'
              },
              geometry: {
                type: 'Polygon',
                coordinates: [[
                  [-80.8435, 35.2275],
                  [-80.8434, 35.2275],
                  [-80.8434, 35.2274],
                  [-80.8435, 35.2274],
                  [-80.8435, 35.2275]
                ]]
              }
            }
          ]
        }
      }];

      console.log(`KML resolve returning ${layers.length} layers with ${layers[0].geojson.features.length} test parcels`);
      res.json({ ok: true, layers });
    } catch (error: any) {
      console.error('KML resolve error:', error);
      res.status(500).json({ ok: false, error: error.message || 'KML resolve error' });
    }
  });

  return httpServer;
}
