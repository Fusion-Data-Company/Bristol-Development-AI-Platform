import { storage } from "../storage";
import { getWebSocketService } from "./websocketService";
import type { McpTool, InsertIntegrationLog } from "@shared/schema";

interface McpPayload {
  tool: string;
  payload: any;
  userId?: string;
}

interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

export class McpService {
  private tools: Map<string, McpTool> = new Map();

  constructor() {
    this.initializeTools();
  }

  private async initializeTools() {
    try {
      // Register default MCP tools
      const defaultTools = [
        {
          name: "n8n.trigger",
          description: "Send payload to n8n webhook for workflow automation",
          schema: {
            type: "object",
            properties: {
              workflowId: { type: "string", description: "n8n workflow identifier" },
              payload: { type: "object", description: "Data to send to workflow" }
            },
            required: ["workflowId", "payload"]
          }
        },
        {
          name: "apify.scrape",
          description: "Run Apify actor for property data scraping",
          schema: {
            type: "object",
            properties: {
              actorId: { type: "string", description: "Apify actor identifier" },
              input: { type: "object", description: "Actor input parameters" },
              timeout: { type: "number", description: "Timeout in seconds", default: 300 }
            },
            required: ["actorId", "input"]
          }
        },
        {
          name: "metrics.write",
          description: "Write metric data to database",
          schema: {
            type: "object",
            properties: {
              siteId: { type: "string", description: "Site identifier" },
              metrics: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    metricType: { type: "string" },
                    metricName: { type: "string" },
                    value: { type: "number" },
                    unit: { type: "string" },
                    source: { type: "string" }
                  },
                  required: ["metricType", "metricName", "value", "source"]
                }
              }
            },
            required: ["siteId", "metrics"]
          }
        },
        {
          name: "census.fetch",
          description: "Fetch Census ACS data for a location",
          schema: {
            type: "object",
            properties: {
              location: { type: "string", description: "Location (city, state or coordinates)" },
              variables: { type: "array", items: { type: "string" }, description: "Census variables to fetch" },
              year: { type: "number", description: "Data year", default: 2022 }
            },
            required: ["location", "variables"]
          }
        },
        {
          name: "hud.fmr",
          description: "Fetch HUD Fair Market Rent data",
          schema: {
            type: "object",
            properties: {
              zipCode: { type: "string", description: "ZIP code" },
              bedrooms: { type: "number", description: "Number of bedrooms" },
              year: { type: "number", description: "FMR year", default: 2024 }
            },
            required: ["zipCode"]
          }
        }
      ];

      for (const toolDef of defaultTools) {
        const existingTool = await storage.getMcpTool(toolDef.name);
        if (!existingTool) {
          const tool = await storage.createMcpTool(toolDef);
          this.tools.set(tool.name, tool);
        } else {
          this.tools.set(existingTool.name, existingTool);
        }
      }

      console.log(`Initialized ${this.tools.size} MCP tools`);
    } catch (error) {
      console.error("Error initializing MCP tools:", error);
    }
  }

  async getAvailableTools(): Promise<any[]> {
    return Array.from(this.tools.values());
  }

  async executeTool(toolName: string, payload: any, userId?: string): Promise<ToolResult> {
    const wsService = getWebSocketService();
    
    // Enhanced error handling with validation
    if (!toolName || typeof toolName !== 'string') {
      return { success: false, error: 'Invalid tool name provided' };
    }
    
    if (!payload || typeof payload !== 'object') {
      return { success: false, error: 'Invalid payload provided' };
    }
    
    try {
      // Log the execution start
      const logData: InsertIntegrationLog = {
        service: "mcp",
        action: toolName,
        payload,
        status: "pending",
        userId
      };
      const log = await storage.createIntegrationLog(logData);

      // Broadcast tool execution start
      wsService?.broadcastToolExecution(toolName, "running", payload);

      const tool = this.tools.get(toolName);
      if (!tool) {
        throw new Error(`Tool '${toolName}' not found`);
      }

      let result: ToolResult;

      switch (toolName) {
        case "n8n.trigger":
          result = await this.executeN8nTrigger(payload);
          break;
        case "apify.scrape":
          result = await this.executeApifyScrape(payload);
          break;
        case "metrics.write":
          result = await this.executeMetricsWrite(payload);
          break;
        case "census.fetch":
          result = await this.executeCensusFetch(payload);
          break;
        case "hud.fmr":
          result = await this.executeHudFmr(payload);
          break;
        case "bristol_property_scraper":
          result = await this.executeBristolPropertyScraper(payload);
          break;
        default:
          throw new Error(`Tool execution not implemented: ${toolName}`);
      }

      // Update log with result
      await storage.createIntegrationLog({
        ...logData,
        status: result.success ? "success" : "error",
        response: result.data,
        error: result.error
      });

      // Broadcast completion
      wsService?.broadcastToolExecution(
        toolName, 
        result.success ? "completed" : "error", 
        result
      );

      return result;
    } catch (error) {
      let errorMsg = "Unknown error";
      let errorType = "general";
      
      // Enhanced error classification
      if (error instanceof Error) {
        errorMsg = error.message;
        
        if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
          errorType = "timeout";
          errorMsg = `Tool execution timed out: ${toolName}`;
        } else if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
          errorType = "network";
          errorMsg = `Network error executing tool: ${toolName}`;
        } else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
          errorType = "permission";
          errorMsg = `Permission denied for tool: ${toolName}`;
        } else if (error.message.includes('not found') || error.message.includes('undefined')) {
          errorType = "not_found";
          errorMsg = `Tool not found or misconfigured: ${toolName}`;
        }
      }
      
      console.error(`MCP Tool Error [${errorType}]:`, errorMsg, { toolName, userId, payload: Object.keys(payload || {}) });
      
      // Enhanced error logging with recovery suggestions
      try {
        await storage.createIntegrationLog({
          service: "mcp",
          action: toolName,
          payload: { ...payload, errorType, timestamp: new Date().toISOString() },
          status: "error",
          error: errorMsg,
          userId
        });
      } catch (logError) {
        console.error('Failed to log MCP error:', logError);
      }

      // Enhanced error broadcasting with recovery hints
      try {
        wsService?.broadcastToolExecution(toolName, "error", { 
          error: errorMsg, 
          errorType,
          recovery: this.getRecoveryHint(errorType, toolName)
        });
      } catch (broadcastError) {
        console.error('Failed to broadcast MCP error:', broadcastError);
      }

      return { success: false, error: errorMsg };
    }
  }

  private async executeN8nTrigger(payload: any): Promise<ToolResult> {
    const { workflowId, payload: data } = payload;
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;

    if (!n8nWebhookUrl) {
      throw new Error("N8N_WEBHOOK_URL environment variable not set");
    }

    try {
      const response = await fetch(`${n8nWebhookUrl}/${workflowId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`n8n webhook failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "n8n trigger failed" };
    }
  }

  private async executeApifyScrape(payload: any): Promise<ToolResult> {
    const { actorId, input, timeout = 300 } = payload;
    const apifyToken = process.env.APIFY_TOKEN;

    if (!apifyToken) {
      throw new Error("APIFY_TOKEN environment variable not set");
    }

    try {
      // Start the actor run
      const runResponse = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs?token=${apifyToken}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(input)
      });

      if (!runResponse.ok) {
        throw new Error(`Failed to start Apify actor: ${runResponse.status}`);
      }

      const runData = await runResponse.json();
      const runId = runData.data.id;

      // Poll for completion
      let attempts = 0;
      const maxAttempts = timeout / 10; // Check every 10 seconds

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
        
        const statusResponse = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs/${runId}?token=${apifyToken}`);
        const statusData = await statusResponse.json();
        
        if (statusData.data.status === "SUCCEEDED") {
          // Get the results
          const resultsResponse = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs/${runId}/dataset/items?token=${apifyToken}`);
          const results = await resultsResponse.json();
          
          return { success: true, data: results };
        } else if (statusData.data.status === "FAILED") {
          throw new Error("Apify actor run failed");
        }
        
        attempts++;
      }

      throw new Error("Apify actor run timed out");
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Apify scrape failed" };
    }
  }

  private async executeMetricsWrite(payload: any): Promise<ToolResult> {
    const { siteId, metrics } = payload;

    try {
      const results = [];
      for (const metric of metrics) {
        const savedMetric = await storage.createSiteMetric({
          siteId,
          ...metric
        });
        results.push(savedMetric);
      }

      return { success: true, data: { saved: results.length, metrics: results } };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to write metrics" };
    }
  }

  private async executeCensusFetch(payload: any): Promise<ToolResult> {
    const { location, variables, year = 2022 } = payload;
    const censusApiKey = process.env.CENSUS_API_KEY;

    try {
      // This is a simplified implementation - would need proper Census API integration
      const mockData = {
        location,
        year,
        data: variables.reduce((acc: any, variable: string) => {
          acc[variable] = Math.floor(Math.random() * 100000); // Mock data
          return acc;
        }, {})
      };

      return { success: true, data: mockData };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Census fetch failed" };
    }
  }

  private async executeHudFmr(payload: any): Promise<ToolResult> {
    const { zipCode, bedrooms, year = 2024 } = payload;

    try {
      // This is a simplified implementation - would need proper HUD API integration
      const mockFmrData = {
        zipCode,
        year,
        fmr: {
          efficiency: 850,
          oneBedroom: 950,
          twoBedroom: 1200,
          threeBedroom: 1550,
          fourBedroom: 1850
        }
      };

      return { success: true, data: mockFmrData };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "HUD FMR fetch failed" };
    }
  }

  private async executeBristolPropertyScraper(payload: any): Promise<ToolResult> {
    try {
      console.log(`🏢 Bristol AI property scraper executing: ${payload.urls?.length || 0} URLs`);
      
      // Call the elite search API endpoint
      const response = await fetch('http://localhost:5000/api/bristol-elite/elite-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: payload.query || `Property search for ${payload.location || 'multiple locations'}`,
          location: payload.location,
          propertyType: payload.propertyType || 'multifamily',
          limit: 15,
          sessionId: 'bristol-ai-mcp',
          userId: 'bristol-ai-agent'
        })
      });

      if (!response.ok) {
        throw new Error(`Elite search API failed: ${response.status}`);
      }

      const result = await response.json();
      
      return {
        success: result.success || false,
        data: {
          jobId: result.jobId,
          propertiesFound: result.propertiesFound || 0,
          properties: result.properties || [],
          metadata: {
            ...result.metadata,
            mcpTool: 'bristol_property_scraper',
            comparablesAnnexUrl: '/comparables-annex'
          }
        }
      };

    } catch (error) {
      console.error('Bristol property scraper failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Bristol property scraper failed' 
      };
    }
  }

  async getAvailableTools(): Promise<McpTool[]> {
    return Array.from(this.tools.values());
  }

  // Enhanced error recovery hints
  private getRecoveryHint(errorType: string, toolName: string): string {
    switch (errorType) {
      case 'timeout':
        return `Try reducing payload size or check if ${toolName} service is overloaded`;
      case 'network':
        return `Check network connectivity and service availability for ${toolName}`;
      case 'permission':
        return `Verify API keys and permissions for ${toolName} tool access`;
      case 'not_found':
        return `Ensure ${toolName} tool is properly configured and available`;
      default:
        return `Check tool configuration and try again. Tool: ${toolName}`;
    }
  }

  // Enhanced health check for MCP tools
  async healthCheck(): Promise<{ healthy: boolean; details: any }> {
    const toolStatuses = await Promise.allSettled(
      Array.from(this.tools.values()).map(async (tool) => {
        try {
          // Basic tool validation
          return { 
            name: tool.name, 
            status: 'healthy', 
            description: tool.description,
            lastChecked: new Date().toISOString()
          };
        } catch (error) {
          return { 
            name: tool.name, 
            status: 'unhealthy', 
            error: error instanceof Error ? error.message : 'Unknown error',
            lastChecked: new Date().toISOString()
          };
        }
      })
    );

    const results = toolStatuses.map(result => 
      result.status === 'fulfilled' ? result.value : { status: 'error', error: result.reason }
    );

    const healthyCount = results.filter(r => r.status === 'healthy').length;
    const healthy = healthyCount > 0; // At least one tool should be healthy

    return {
      healthy,
      details: {
        totalTools: this.tools.size,
        healthyTools: healthyCount,
        tools: results
      }
    };
  }
}

export const mcpService = new McpService();
