import OpenAI from "openai";
import { storage } from "../storage";
import { getWebSocketService } from "./websocketService";
import { mcpService } from "./mcpService";
import type { InsertChatMessage } from "@shared/schema";

interface DataContext {
  sites: any[];
  analytics: any;
  realTimeMetrics: any;
  integrationStatus: any;
  mcpTools: any[];
  currentSession?: any;
}

interface ToolExecution {
  name: string;
  input: any;
  result?: any;
  error?: string;
  timestamp: Date;
}

export class EnhancedAIService {
  private openai: OpenAI;
  private dataContext: Map<string, DataContext> = new Map();
  private activeTools: Map<string, ToolExecution> = new Map();

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is required");
    }
    this.openai = new OpenAI({ apiKey });
  }

  // Comprehensive data aggregation for AI context
  async aggregateDataContext(sessionId: string, userId: string): Promise<DataContext> {
    try {
      const wsService = getWebSocketService();
      
      // Broadcast data collection start
      if (wsService) {
        wsService.broadcastToAll({
          type: "system",
          data: { message: "Collecting real-time data context..." },
          timestamp: Date.now()
        });
      }

      // Aggregate all available data sources
      const [sites, analytics, mcpTools] = await Promise.all([
        this.getUserSites(userId),
        this.getAnalyticsData(userId),
        mcpService.getAvailableTools().catch(() => [])
      ]);

      // Get real-time metrics from various APIs
      const realTimeMetrics = await this.collectRealTimeMetrics();
      
      // Get integration status
      const integrationStatus = await this.getIntegrationStatus();

      const context: DataContext = {
        sites,
        analytics,
        realTimeMetrics,
        integrationStatus,
        mcpTools,
        currentSession: await storage.getChatSession(sessionId)
      };

      // Cache the context
      this.dataContext.set(sessionId, context);
      
      // Broadcast completion
      if (wsService) {
        wsService.broadcastToAll({
          type: "system",
          data: { message: "Data context aggregated successfully" },
          timestamp: Date.now()
        });
      }
      
      return context;
    } catch (error) {
      console.error("Error aggregating data context:", error);
      throw error;
    }
  }

  // Enhanced AI chat with real-time data integration
  async processEnhancedMessage(
    sessionId: string,
    userMessage: string,
    userId: string,
    options: {
      useRealTimeData?: boolean;
      executeMCPTools?: boolean;
      model?: string;
    } = {}
  ): Promise<any> {
    try {
      const { useRealTimeData = true, executeMCPTools = true, model = "gpt-4o" } = options;
      
      // Store user message
      const userChatMessage: InsertChatMessage = {
        sessionId,
        role: "user",
        content: userMessage,
        metadata: { enhanced: true, options }
      };
      await storage.createChatMessage(userChatMessage);

      // Get comprehensive data context if requested
      let dataContext: DataContext | null = null;
      if (useRealTimeData) {
        dataContext = await this.aggregateDataContext(sessionId, userId);
      }

      // Get conversation history
      const messages = await storage.getSessionMessages(sessionId);
      
      // Construct enhanced system prompt with data context and MCP tools
      const systemPrompt = this.buildEnhancedSystemPrompt(dataContext, executeMCPTools);
      
      // Convert to OpenAI format with function calling
      const openAIMessages = [
        { role: "system" as const, content: systemPrompt },
        ...messages.slice(-10).map(msg => ({
          role: msg.role as "user" | "assistant",
          content: msg.content
        }))
      ];

      // Prepare function definitions for MCP tools
      const functions = executeMCPTools ? this.buildMCPFunctions() : [];

      // Call AI service (OpenAI or OpenRouter) with function calling capabilities
      let completion;
      
      if (model.startsWith('anthropic/') || model.startsWith('google/') || model.startsWith('meta/')) {
        // Use OpenRouter for non-OpenAI models
        const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY2 || process.env.OPENAI_API_KEY;
        
        if (!OPENROUTER_API_KEY) {
          throw new Error("OpenRouter API key not configured for this model");
        }

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.REPLIT_DOMAINS?.split(",")[0] || "http://localhost:5000",
            "X-Title": "Real Estate Intelligence Platform"
          },
          body: JSON.stringify({
            model: model,
            messages: openAIMessages,
            temperature: 0.3,
            max_tokens: 4000
          })
        });

        if (!response.ok) {
          throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
        }

        completion = await response.json();
      } else {
        // Use OpenAI directly for GPT models
        completion = await this.openai.chat.completions.create({
          model: model, // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: openAIMessages,
          functions: functions.length > 0 ? functions : undefined,
          function_call: functions.length > 0 ? "auto" : undefined,
          temperature: 0.3,
          max_tokens: 4000
        });
      }

      const assistantMessage = completion.choices[0].message;
      let finalResponse = assistantMessage.content || "";
      let toolResults: any[] = [];

      // Handle function calls (MCP tool executions)
      if (assistantMessage.function_call && executeMCPTools) {
        try {
          const toolName = assistantMessage.function_call.name;
          const toolArgs = JSON.parse(assistantMessage.function_call.arguments);
          
          // Execute the MCP tool
          const toolResult = await mcpService.executeTool(toolName, toolArgs, userId);
          toolResults.push({
            tool: toolName,
            input: toolArgs,
            result: toolResult
          });

          // Get AI interpretation of tool results
          const interpretationMessages = [
            { role: "system" as const, content: "Interpret and summarize the following tool execution results for the user." },
            { role: "user" as const, content: `Tool: ${toolName}\nInput: ${JSON.stringify(toolArgs)}\nResult: ${JSON.stringify(toolResult)}` }
          ];

          const interpretation = await this.openai.chat.completions.create({
            model: model, // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
            messages: interpretationMessages,
            temperature: 0.2,
            max_tokens: 1000
          });

          finalResponse = interpretation.choices[0].message.content || "Tool executed successfully.";
        } catch (error) {
          console.error("Error executing MCP tool:", error);
          finalResponse += `\n\nNote: There was an error executing the requested tool: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
      }

      // Store AI response with metadata
      const aiChatMessage: InsertChatMessage = {
        sessionId,
        role: "assistant",
        content: finalResponse,
        metadata: {
          enhanced: true,
          model,
          dataContextUsed: !!dataContext,
          toolsExecuted: toolResults,
          processingTime: Date.now()
        }
      };
      
      const savedMessage = await storage.createChatMessage(aiChatMessage);

      // Broadcast the response via WebSocket
      const wsService = getWebSocketService();
      if (wsService) {
        wsService.broadcastToAll({
          type: "message",
          sessionId,
          data: savedMessage,
          timestamp: Date.now()
        });
      }

      return {
        success: true,
        message: savedMessage,
        toolResults,
        dataContext: dataContext ? Object.keys(dataContext) : null
      };

    } catch (error) {
      console.error("Enhanced AI Service Error:", error);
      
      // Store error message
      const errorMessage: InsertChatMessage = {
        sessionId,
        role: "assistant",
        content: `I encountered an error processing your request: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        metadata: { error: true, enhanced: true }
      };
      
      const savedMessage = await storage.createChatMessage(errorMessage);
      
      return {
        success: false,
        message: savedMessage,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Build enhanced system prompt with comprehensive data context
  private buildEnhancedSystemPrompt(dataContext: DataContext | null, includeMCPTools: boolean): string {
    let prompt = `You are the Real Estate Intelligence AI Assistant, an expert in real estate development, market analysis, and property intelligence.

You have access to comprehensive real-time data about properties, market conditions, demographics, and economic indicators. You can analyze this data to provide insights, recommendations, and actionable intelligence.

Core Capabilities:
- Real estate market analysis and property evaluation
- Demographic and economic data interpretation
- Company scoring methodology and site assessment
- Market opportunity identification
- Risk analysis and mitigation strategies
- Investment recommendations and financial modeling

Communication Style:
- Professional but approachable
- Data-driven insights with clear explanations
- Actionable recommendations
- Acknowledge data sources and limitations
`;

    if (dataContext) {
      prompt += `\n\nCURRENT DATA CONTEXT:

PROPERTIES (${dataContext.sites?.length || 0} total):
${JSON.stringify(dataContext.sites?.slice(0, 10), null, 2) || 'No properties available'}

ANALYTICS OVERVIEW:
${JSON.stringify(dataContext.analytics, null, 2) || 'No analytics available'}

REAL-TIME METRICS:
${JSON.stringify(dataContext.realTimeMetrics, null, 2) || 'No real-time metrics available'}

INTEGRATION STATUS:
${JSON.stringify(dataContext.integrationStatus, null, 2) || 'No integration status available'}
`;
    }

    if (includeMCPTools) {
      prompt += `\n\nAVAILABLE TOOLS:
You have access to MCP (Model Context Protocol) tools for data collection and analysis:

- n8n.trigger: Execute workflow automation
- apify.scrape: Scrape property and market data
- metrics.write: Store calculated metrics
- census.fetch: Get demographic data
- hud.fmr: Fetch fair market rent data

Use these tools when you need to gather additional data or perform specific analyses.`;
    }

    return prompt;
  }

  // Build MCP function definitions for OpenAI function calling
  private buildMCPFunctions(): any[] {
    try {
      // Return empty array for now - will be implemented when MCP tools are ready
      return [];
    } catch (error) {
      console.error("Error building MCP functions:", error);
      return [];
    }
  }

  // Collect real-time metrics from various sources
  private async collectRealTimeMetrics(): Promise<any> {
    try {
      // This would integrate with your existing API tools
      const metrics = {
        timestamp: new Date().toISOString(),
        economicIndicators: {
          // These would come from your BLS/BEA tools
          unemploymentRate: null,
          gdpGrowth: null,
          incomeData: null
        },
        marketConditions: {
          // These would come from your HUD/FBI/NOAA tools  
          vacancyRates: null,
          crimeStats: null,
          weatherData: null
        },
        systemStatus: {
          databaseConnected: true,
          apisOperational: true,
          lastUpdate: new Date().toISOString()
        }
      };

      return metrics;
    } catch (error) {
      console.error("Error collecting real-time metrics:", error);
      return { error: "Failed to collect real-time metrics" };
    }
  }

  // Get user sites with enhanced data
  private async getUserSites(userId: string): Promise<any[]> {
    try {
      const sites = await storage.getUserSites(userId);
      // Add any additional enrichment here
      return sites;
    } catch (error) {
      console.error("Error fetching user sites:", error);
      return [];
    }
  }

  // Get analytics data
  private async getAnalyticsData(userId: string): Promise<any> {
    try {
      // This would aggregate data from your analytics endpoints
      return {
        overview: "Analytics data placeholder",
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      return null;
    }
  }

  // Get integration status
  private async getIntegrationStatus(): Promise<any> {
    try {
      return {
        apis: {
          bls: "operational",
          bea: "operational", 
          hud: "operational",
          fbi: "operational",
          noaa: "operational",
          foursquare: "operational"
        },
        database: "connected",
        websockets: "active",
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      console.error("Error getting integration status:", error);
      return { error: "Failed to get integration status" };
    }
  }

  // Real-time data monitoring
  async startDataMonitoring(sessionId: string): Promise<void> {
    const wsService = getWebSocketService();
    
    // Start periodic data updates
    const interval = setInterval(async () => {
      try {
        const context = this.dataContext.get(sessionId);
        if (context) {
          // Update real-time metrics
          const newMetrics = await this.collectRealTimeMetrics();
          context.realTimeMetrics = newMetrics;
          
          // Broadcast updates
          if (wsService) {
            wsService.broadcastToAll({
              type: "data_update",
              sessionId,
              data: newMetrics,
              timestamp: Date.now()
            });
          }
        }
      } catch (error) {
        console.error("Error in data monitoring:", error);
      }
    }, 30000); // Update every 30 seconds

    // Store interval for cleanup
    setTimeout(() => {
      clearInterval(interval);
      this.dataContext.delete(sessionId);
    }, 3600000); // Clean up after 1 hour
  }
}

export const enhancedAIService = new EnhancedAIService();