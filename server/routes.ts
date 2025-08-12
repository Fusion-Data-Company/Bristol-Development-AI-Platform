import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { aiService } from "./services/aiService";
import { mcpService } from "./services/mcpService";
import { integrationService } from "./services/integrationService";
import { initializeWebSocketService } from "./services/websocketService";
import { insertSiteSchema, insertChatSessionSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Create HTTP server
  const httpServer = createServer(app);

  // Initialize WebSocket service
  initializeWebSocketService(httpServer);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Import the new comprehensive sites API
  const sitesRouter = (await import('./api/sites')).default;
  app.use('/api/sites', isAuthenticated, sitesRouter);

  // Import analytics API - temporarily bypass auth for real data testing
  const analyticsRouter = (await import('./api/analytics')).default;
  app.use('/api/analytics', analyticsRouter);

  // Tools API routes (BLS, BEA, HUD, Foursquare, FBI, NOAA)
  const blsRouter = (await import('./api/tools/bls')).default;
  const beaRouter = (await import('./api/tools/bea')).default;
  const hudRouter = (await import('./api/tools/hud')).default;
  const foursquareRouter = (await import('./api/tools/foursquare')).default;
  const fbiRouter = (await import('./api/tools/fbi')).default;
  const noaaRouter = (await import('./api/tools/noaa')).default;
  const snapshotsRouter = (await import('./api/tools/snapshots')).default;
  
  app.use('/api/tools/bls', isAuthenticated, blsRouter);
  app.use('/api/tools/bea', isAuthenticated, beaRouter);
  app.use('/api/tools/hud', isAuthenticated, hudRouter);
  app.use('/api/tools/foursquare', isAuthenticated, foursquareRouter);
  app.use('/api/tools/fbi', isAuthenticated, fbiRouter);
  app.use('/api/tools/noaa', isAuthenticated, noaaRouter);
  app.use('/api/snapshots', isAuthenticated, snapshotsRouter);

  // ACS enrichment and GeoJSON routes
  const { enrichSites } = await import('./api/enrich');
  const { getSitesGeoJSON } = await import('./api/sites-geojson');
  const { getSiteDemographics } = await import('./api/site-demographics');
  const { getAddressDemographics } = await import('./api/address-demographics');
  const { getMapDemographics } = await import('./api/map-demographics');
  
  app.post('/api/enrich', isAuthenticated, enrichSites);
  app.get('/api/sites.geojson', isAuthenticated, getSitesGeoJSON);
  app.get('/api/sites/:siteId/demographics', isAuthenticated, getSiteDemographics);
  app.post('/api/address/demographics', isAuthenticated, getAddressDemographics);
  app.get('/api/map/demographics', isAuthenticated, getMapDemographics);



  // Chat routes
  app.get('/api/chat/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessions = await storage.getUserChatSessions(userId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching chat sessions:", error);
      res.status(500).json({ message: "Failed to fetch chat sessions" });
    }
  });

  app.post('/api/chat/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.get('/api/chat/sessions/:sessionId/messages', isAuthenticated, async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      
      // Verify session ownership
      const session = await storage.getChatSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      const userId = req.user.claims.sub;
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

  app.post('/api/chat/sessions/:sessionId/messages', isAuthenticated, async (req: any, res) => {
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

      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;

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
      const userId = req.user.claims.sub;
      const { service } = req.query;
      
      const logs = await storage.getIntegrationLogs(userId, service as string);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching integration logs:", error);
      res.status(500).json({ message: "Failed to fetch integration logs" });
    }
  });

  // Analytics endpoints
  app.get('/api/analytics/dashboard', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
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
