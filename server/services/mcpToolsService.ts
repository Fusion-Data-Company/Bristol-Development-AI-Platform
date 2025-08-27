import { storage } from '../storage';

interface McpTool {
  name: string;
  description: string;
  endpoint: string;
  method: 'GET' | 'POST';
  parameters?: Record<string, any>;
  category: 'data' | 'analysis' | 'external' | 'storage' | 'workflow' | 'content' | 'utility';
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

    // Real Estate MCP Tools - Memory Server
    this.registerTool({
      name: 'store_property_data',
      description: 'Store property information for analysis and tracking',
      endpoint: '/api/mcp-tools/execute/store_memory',
      method: 'POST',
      category: 'data',
      parameters: { propertyData: 'object' }
    });

    this.registerTool({
      name: 'store_lead_info',
      description: 'Store and manage client lead information',
      endpoint: '/api/mcp-tools/execute/store_memory',
      method: 'POST',
      category: 'data',
      parameters: { leadData: 'object' }
    });

    // Real Estate MCP Tools - Fetch Server
    this.registerTool({
      name: 'fetch_property_value',
      description: 'Scrape property valuation data from public sources',
      endpoint: '/api/mcp-tools/execute/fetch',
      method: 'POST',
      category: 'external',
      parameters: { address: 'string' }
    });

    this.registerTool({
      name: 'fetch_neighborhood_data',
      description: 'Pull neighborhood statistics and amenities',
      endpoint: '/api/mcp-tools/execute/fetch',
      method: 'POST',
      category: 'external',
      parameters: { location: 'string' }
    });

    this.registerTool({
      name: 'get_flood_risk_data',
      description: 'Access FEMA flood maps and risk assessment data',
      endpoint: '/api/mcp-tools/execute/fetch',
      method: 'POST',
      category: 'external',
      parameters: { coordinates: 'string' }
    });

    // Real Estate MCP Tools - Sequential Thinking Server
    this.registerTool({
      name: 'sequential_property_analysis',
      description: 'Step-by-step complex property investment analysis',
      endpoint: '/api/mcp-tools/execute/sequential_thinking',
      method: 'POST',
      category: 'analysis',
      parameters: { analysisType: 'string', propertyData: 'object' }
    });

    this.registerTool({
      name: 'comparative_market_analysis',
      description: 'Multi-property comparison with sequential reasoning',
      endpoint: '/api/mcp-tools/execute/sequential_thinking',
      method: 'POST',
      category: 'analysis',
      parameters: { properties: 'array' }
    });

    // Real Estate MCP Tools - Time Server
    this.registerTool({
      name: 'schedule_property_showing',
      description: 'Schedule and track property showings with time management',
      endpoint: '/api/mcp-tools/execute/time',
      method: 'POST',
      category: 'workflow',
      parameters: { propertyId: 'string', dateTime: 'string' }
    });

    this.registerTool({
      name: 'track_closing_deadlines',
      description: 'Monitor contract deadlines and important dates',
      endpoint: '/api/mcp-tools/execute/time',
      method: 'POST',
      category: 'workflow',
      parameters: { contractData: 'object' }
    });

    this.registerTool({
      name: 'calculate_days_on_market',
      description: 'Calculate property listing duration and market trends',
      endpoint: '/api/mcp-tools/execute/time',
      method: 'POST',
      category: 'workflow',
      parameters: { listingDate: 'string' }
    });

    // Real Estate MCP Tools - EverArt Server
    this.registerTool({
      name: 'generate_property_description',
      description: 'Create compelling property listing descriptions',
      endpoint: '/api/mcp-tools/execute/everart',
      method: 'POST',
      category: 'content',
      parameters: { propertyDetails: 'object' }
    });

    this.registerTool({
      name: 'create_marketing_materials',
      description: 'Generate flyers and marketing content for properties',
      endpoint: '/api/mcp-tools/execute/everart',
      method: 'POST',
      category: 'content',
      parameters: { propertyData: 'object', style: 'string' }
    });

    this.registerTool({
      name: 'process_listing_images',
      description: 'Enhance and process property photos for listings',
      endpoint: '/api/mcp-tools/execute/everart',
      method: 'POST',
      category: 'content',
      parameters: { images: 'array' }
    });

    // Real Estate MCP Tools - Everything Server
    this.registerTool({
      name: 'process_contract_data',
      description: 'Extract and process data from real estate contracts',
      endpoint: '/api/mcp-tools/execute/everything',
      method: 'POST',
      category: 'utility',
      parameters: { contractText: 'string' }
    });

    this.registerTool({
      name: 'convert_data_formats',
      description: 'Transform data between JSON, CSV, and other formats',
      endpoint: '/api/mcp-tools/execute/everything',
      method: 'POST',
      category: 'utility',
      parameters: { data: 'any', targetFormat: 'string' }
    });

    this.registerTool({
      name: 'clean_property_data',
      description: 'Standardize and clean property information',
      endpoint: '/api/mcp-tools/execute/everything',
      method: 'POST',
      category: 'utility',
      parameters: { rawData: 'object' }
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

    // Company Properties Location-Based Search Tools
    this.registerTool({
      name: 'search_company_properties',
      description: 'Search company properties by location, city, state, or criteria',
      endpoint: '/api/sites',
      method: 'GET',
      category: 'data',
      parameters: { 
        q: 'string',         // Search query for names, addresses, cities
        status: 'string',    // Property status filter
        city: 'string',      // City filter
        state: 'string'      // State filter
      }
    });

    this.registerTool({
      name: 'get_company_property_details',
      description: 'Get detailed information about a specific company property including location, units, and metrics',
      endpoint: '/api/sites/{id}',
      method: 'GET',
      category: 'data',
      parameters: { id: 'string' }
    });

    this.registerTool({
      name: 'find_company_properties_near',
      description: 'Find all company properties in a specific city, state, or location area',
      endpoint: '/api/sites',
      method: 'GET', 
      category: 'data',
      parameters: {
        city: 'string',
        state: 'string',
        location: 'string'   // General location search
      }
    });

    this.registerTool({
      name: 'get_company_properties_by_status',
      description: 'Get Company properties filtered by development status (Operating, Pipeline, Completed, Newest)',
      endpoint: '/api/sites',
      method: 'GET',
      category: 'data',
      parameters: { status: 'string' }
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
      const [portfolio, pipeline, market, companyProperties] = await Promise.all([
        this.executeTool('get_portfolio_overview'),
        this.executeTool('get_deal_pipeline'),
        this.executeTool('get_market_analytics'),
        this.executeTool('get_property_sites')
      ]);

      return {
        portfolio: portfolio.data || portfolio,
        pipeline: pipeline.data || pipeline,
        market: market.data || market,
        companyProperties: companyProperties || [],
        propertiesByLocation: this.organizeCompanyPropertiesByLocation(companyProperties || []),
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

  // Organize Company properties by location for easy AI queries
  private organizeCompanyPropertiesByLocation(properties: any[]): any {
    const byState: any = {};
    const byCity: any = {};
    const byStatus: any = {};

    properties.forEach(property => {
      // Group by state
      if (property.state) {
        if (!byState[property.state]) byState[property.state] = [];
        byState[property.state].push(property);
      }

      // Group by city
      if (property.city) {
        if (!byCity[property.city]) byCity[property.city] = [];
        byCity[property.city].push(property);
      }

      // Group by status
      if (property.status) {
        if (!byStatus[property.status]) byStatus[property.status] = [];
        byStatus[property.status].push(property);
      }
    });

    return {
      byState,
      byCity, 
      byStatus,
      totalProperties: properties.length,
      states: Object.keys(byState),
      cities: Object.keys(byCity),
      statuses: Object.keys(byStatus)
    };
  }
}

// Singleton instance
export const mcpToolsService = new McpToolsService();