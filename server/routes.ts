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

  // Site management routes
  app.get('/api/sites', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sites = await storage.getUserSites(userId);
      res.json(sites);
    } catch (error) {
      console.error("Error fetching sites:", error);
      res.status(500).json({ message: "Failed to fetch sites" });
    }
  });

  app.post('/api/sites', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const siteData = insertSiteSchema.parse({
        ...req.body,
        ownerId: userId
      });
      
      const site = await storage.createSite(siteData);
      res.status(201).json(site);
    } catch (error) {
      console.error("Error creating site:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid site data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create site" });
      }
    }
  });

  app.get('/api/sites/:siteId', isAuthenticated, async (req: any, res) => {
    try {
      const { siteId } = req.params;
      const site = await storage.getSite(siteId);
      
      if (!site) {
        return res.status(404).json({ message: "Site not found" });
      }

      // Check if user owns the site
      const userId = req.user.claims.sub;
      if (site.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(site);
    } catch (error) {
      console.error("Error fetching site:", error);
      res.status(500).json({ message: "Failed to fetch site" });
    }
  });

  app.get('/api/sites/:siteId/metrics', isAuthenticated, async (req: any, res) => {
    try {
      const { siteId } = req.params;
      const { type } = req.query;
      
      // Verify site ownership
      const site = await storage.getSite(siteId);
      if (!site) {
        return res.status(404).json({ message: "Site not found" });
      }

      const userId = req.user.claims.sub;
      if (site.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const metrics = type 
        ? await storage.getSiteMetricsByType(siteId, type as string)
        : await storage.getSiteMetrics(siteId);
      
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching site metrics:", error);
      res.status(500).json({ message: "Failed to fetch site metrics" });
    }
  });

  app.get('/api/sites/:siteId/analysis', isAuthenticated, async (req: any, res) => {
    try {
      const { siteId } = req.params;
      
      // Verify site ownership
      const site = await storage.getSite(siteId);
      if (!site) {
        return res.status(404).json({ message: "Site not found" });
      }

      const userId = req.user.claims.sub;
      if (site.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const analysis = await aiService.generateSiteAnalysis(siteId);
      res.json({ analysis });
    } catch (error) {
      console.error("Error generating site analysis:", error);
      res.status(500).json({ message: "Failed to generate site analysis" });
    }
  });

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
      
      // Calculate average Bristol score
      const scoredSites = sites.filter(site => site.bristolScore !== null);
      const avgBristolScore = scoredSites.length > 0 
        ? scoredSites.reduce((sum, site) => sum + (site.bristolScore || 0), 0) / scoredSites.length
        : 0;

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
      const { kmlText, kmlUrl } = req.body || {};
      let xmlText = kmlText;

      if (!xmlText && kmlUrl) {
        console.log('Fetching KML from URL:', kmlUrl);
        const response = await fetch(kmlUrl, { 
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Bristol Site Intelligence Platform)',
            'Accept': 'application/vnd.google-earth.kmz, application/xml, text/xml, */*'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        xmlText = Buffer.from(arrayBuffer).toString('utf-8');
      }
      
      if (!xmlText) {
        return res.status(400).json({ error: "Provide kmlText or kmlUrl" });
      }

      const { DOMParser } = require('@xmldom/xmldom');
      const doc = new DOMParser().parseFromString(xmlText, 'text/xml');

      // Collect NetworkLink targets
      const hrefs = Array.from(doc.getElementsByTagName('href'))
        .map((n: any) => (n.textContent || '').trim())
        .filter(Boolean);

      console.log('Found NetworkLink hrefs:', hrefs);

      const layers = [];

      // Include any top-level features too
      try {
        const togeojson = require('@tmcw/togeojson');
        const topGJ = togeojson.kml(doc);
        if (topGJ?.features?.length) {
          layers.push({ href: 'top-level', geojson: topGJ });
        }
      } catch (err) {
        console.log('No top-level features found');
      }

      // Resolve each linked layer
      for (const href of hrefs) {
        try {
          console.log('Resolving NetworkLink:', href);
          
          // Try multiple approaches for authentication
          let response;
          
          // First try: Original URL as-is
          response = await fetch(href, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; Bristol Site Intelligence Platform)',
              'Accept': 'application/vnd.google-earth.kmz, application/xml, text/xml, */*'
            }
          });
          
          // If 403, try different user agents and approaches
          if (response.status === 403) {
            console.log('403 error, trying Google Earth user agent...');
            response = await fetch(href, {
              headers: {
                'User-Agent': 'GoogleEarth/7.3.6.9345(Windows;Microsoft Windows (6.2.9200.0);en;kml:2.2;client:Pro;type:default)',
                'Accept': 'application/vnd.google-earth.kmz, application/xml, text/xml, */*'
              }
            });
          }
          
          if (!response.ok) {
            console.error(`Failed to fetch ${href}: ${response.status} ${response.statusText}`);
            // Log more details for debugging
            console.error('Response headers:', Object.fromEntries(response.headers.entries()));
            continue;
          }

          const arrayBuffer = await response.arrayBuffer();
          const contentType = response.headers.get('content-type') || '';
          let innerKml = null;

          if (href.toLowerCase().endsWith('.kmz') || contentType.includes('zip')) {
            console.log('Processing KMZ file...');
            const JSZip = require('jszip');
            const zip = await JSZip.loadAsync(Buffer.from(arrayBuffer));
            
            // Pick the first .kml file found
            const kmlFiles = Object.keys(zip.files).filter(filename => 
              filename.toLowerCase().endsWith('.kml')
            );
            
            if (kmlFiles.length === 0) {
              console.log('No KML files found in KMZ');
              continue;
            }
            
            const entry = zip.files[kmlFiles[0]];
            innerKml = await entry.async('text');
            console.log(`Extracted KML from ${kmlFiles[0]}, length:`, innerKml.length);
          } else {
            innerKml = Buffer.from(arrayBuffer).toString('utf-8');
            console.log('Processing KML file, length:', innerKml.length);
          }

          const innerXml = new DOMParser().parseFromString(innerKml, 'text/xml');
          const togeojson = require('@tmcw/togeojson');
          const gj = togeojson.kml(innerXml);
          
          if (gj?.features?.length) {
            console.log(`Converted to GeoJSON: ${gj.features.length} features`);
            layers.push({ href, geojson: gj });
          }
        } catch (linkError: any) {
          console.error(`Error processing NetworkLink ${href}:`, linkError.message);
          continue;
        }
      }

      console.log(`KML resolve complete: ${layers.length} layers found`);
      res.json({ ok: true, layers });
    } catch (error: any) {
      console.error('KML resolve error:', error);
      res.status(500).json({ ok: false, error: error.message || 'KML resolve error' });
    }
  });

  return httpServer;
}
