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

  async executeTool(toolName: string, payload: any, userId?: string): Promise<ToolResult> {
    const wsService = getWebSocketService();
    
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
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      
      // Log the error
      await storage.createIntegrationLog({
        service: "mcp",
        action: toolName,
        payload,
        status: "error",
        error: errorMsg,
        userId
      });

      // Broadcast error
      wsService?.broadcastToolExecution(toolName, "error", { error: errorMsg });

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

  async getAvailableTools(): Promise<McpTool[]> {
    return Array.from(this.tools.values());
  }
}

export const mcpService = new McpService();
