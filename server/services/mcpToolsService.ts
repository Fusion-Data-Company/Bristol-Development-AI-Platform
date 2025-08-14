import { storage } from '../storage';

interface McpTool {
  name: string;
  description: string;
  endpoint: string;
  method: 'GET' | 'POST';
  parameters?: Record<string, any>;
  category: 'data' | 'analysis' | 'external' | 'storage';
}

export class McpToolsService {
  private tools: Map<string, McpTool> = new Map();

  constructor() {
    this.initializeTools();
  }

  private initializeTools() {
    // Core data access tools
    this.registerTool({
      name: 'get_portfolio_overview',
      description: 'Get complete portfolio analytics and metrics',
      endpoint: '/api/analytics/overview',
      method: 'GET',
      category: 'data'
    });

    this.registerTool({
      name: 'get_employment_data',
      description: 'Get real-time BLS employment statistics',
      endpoint: '/api/tools/bls-employment',
      method: 'GET',
      category: 'external'
    });

    this.registerTool({
      name: 'get_housing_data',
      description: 'Get HUD fair market rent and housing data',
      endpoint: '/api/tools/hud-housing',
      method: 'GET',
      category: 'external'
    });

    this.registerTool({
      name: 'get_crime_statistics',
      description: 'Get FBI crime statistics and safety metrics',
      endpoint: '/api/tools/fbi-crime',
      method: 'GET',
      category: 'external'
    });

    this.registerTool({
      name: 'get_climate_data',
      description: 'Get NOAA weather and climate information',
      endpoint: '/api/tools/noaa-climate',
      method: 'GET',
      category: 'external'
    });

    this.registerTool({
      name: 'get_property_sites',
      description: 'Access complete property database',
      endpoint: '/api/sites',
      method: 'GET',
      category: 'data'
    });

    this.registerTool({
      name: 'get_deal_pipeline',
      description: 'Get investment pipeline and deal flow data',
      endpoint: '/api/analytics/pipeline',
      method: 'GET',
      category: 'analysis'
    });

    this.registerTool({
      name: 'get_market_analytics',
      description: 'Get market distribution and performance metrics',
      endpoint: '/api/analytics/market',
      method: 'GET',
      category: 'analysis'
    });

    this.registerTool({
      name: 'get_demographics',
      description: 'Get real-time demographic and census data',
      endpoint: '/api/address-demographics',
      method: 'GET',
      category: 'external'
    });

    this.registerTool({
      name: 'get_foursquare_poi',
      description: 'Get points of interest and location data',
      endpoint: '/api/tools/foursquare',
      method: 'GET',
      category: 'external'
    });

    this.registerTool({
      name: 'get_saved_snapshots',
      description: 'Access previously saved analysis results',
      endpoint: '/api/snapshots',
      method: 'GET',
      category: 'storage'
    });

    this.registerTool({
      name: 'save_analysis_snapshot',
      description: 'Save analysis results for future reference',
      endpoint: '/api/snapshots',
      method: 'POST',
      category: 'storage'
    });
  }

  registerTool(tool: McpTool) {
    this.tools.set(tool.name, tool);
  }

  async executeTool(toolName: string, parameters?: Record<string, any>): Promise<any> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new Error(`Tool ${toolName} not found`);
    }

    try {
      let url = tool.endpoint;
      
      // Add query parameters for GET requests
      if (tool.method === 'GET' && parameters) {
        const searchParams = new URLSearchParams(parameters);
        url += `?${searchParams.toString()}`;
      }

      const response = await fetch(`http://localhost:5000${url}`, {
        method: tool.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: tool.method === 'POST' ? JSON.stringify(parameters) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Log tool execution for monitoring
      console.log(`MCP Tool Executed: ${toolName}`, {
        endpoint: tool.endpoint,
        method: tool.method,
        success: true,
        timestamp: new Date().toISOString()
      });

      return result;
    } catch (error) {
      console.error(`MCP Tool Error: ${toolName}`, error);
      throw error;
    }
  }

  getAvailableTools(): McpTool[] {
    return Array.from(this.tools.values());
  }

  getToolsByCategory(category: string): McpTool[] {
    return Array.from(this.tools.values()).filter(tool => tool.category === category);
  }

  async getSystemStatus(): Promise<any> {
    const tools = this.getAvailableTools();
    const status = {
      totalTools: tools.length,
      categories: {
        data: this.getToolsByCategory('data').length,
        analysis: this.getToolsByCategory('analysis').length,
        external: this.getToolsByCategory('external').length,
        storage: this.getToolsByCategory('storage').length
      },
      lastChecked: new Date().toISOString(),
      healthy: true
    };

    return status;
  }

  // Real-time data aggregation for AI context
  async getAiContext(): Promise<any> {
    try {
      const [portfolio, pipeline, market] = await Promise.all([
        this.executeTool('get_portfolio_overview'),
        this.executeTool('get_deal_pipeline'),
        this.executeTool('get_market_analytics')
      ]);

      return {
        portfolio: portfolio.data || portfolio,
        pipeline: pipeline.data || pipeline,
        market: market.data || market,
        timestamp: new Date().toISOString(),
        toolsAvailable: this.tools.size
      };
    } catch (error) {
      console.error('Error getting AI context:', error);
      return {
        error: 'Failed to aggregate AI context',
        toolsAvailable: this.tools.size,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Singleton instance
export const mcpToolsService = new McpToolsService();