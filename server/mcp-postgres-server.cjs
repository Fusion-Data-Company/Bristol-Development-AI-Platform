#!/usr/bin/env node

// PostgreSQL MCP Server for Bristol Development Group
// Provides database access tools for the AI agent through Claude Desktop MCP integration

const { Pool } = require('pg');

// Debug environment variables
console.log('DATABASE_URL available:', process.env.DATABASE_URL ? 'Yes' : 'No');
if (process.env.DATABASE_URL) {
  const url = new URL(process.env.DATABASE_URL);
  console.log('Database host:', url.hostname);
} else {
  console.error('❌ DATABASE_URL environment variable not found');
}

// Initialize PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Test database connection on startup
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL MCP Server connected to database');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL MCP Server connection failed:', error.message);
    console.error('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    return false;
  }
}

// MCP Server Implementation
class PostgresMCPServer {
  constructor() {
    // Test connection on startup
    testConnection();
    this.name = "postgres";
    this.version = "1.0.0";
    this.tools = [
      {
        name: "query_bristol_database",
        description: "Execute SQL queries against the Bristol Development database for comprehensive property analysis",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string", 
              description: "SQL query to execute (SELECT statements only for data safety)"
            },
            params: {
              type: "array",
              description: "Query parameters for prepared statements",
              items: { type: "string" }
            }
          },
          required: ["query"]
        }
      },
      {
        name: "get_bristol_portfolio",
        description: "Get comprehensive Bristol Development Group property portfolio with metrics",
        inputSchema: {
          type: "object",
          properties: {
            limit: { type: "number", default: 100 },
            status: { type: "string", description: "Filter by status: Operating, Pipeline, Completed, Newest" },
            city: { type: "string", description: "Filter by city" },
            state: { type: "string", description: "Filter by state" }
          }
        }
      },
      {
        name: "get_property_analysis",
        description: "Get detailed property analysis including demographics, metrics, and comparable data",
        inputSchema: {
          type: "object", 
          properties: {
            siteId: { type: "string", description: "Site ID for analysis" },
            includeComps: { type: "boolean", default: true, description: "Include comparable properties" },
            includeMetrics: { type: "boolean", default: true, description: "Include demographic and market metrics" }
          },
          required: ["siteId"]
        }
      },
      {
        name: "analyze_market_trends",
        description: "Analyze market trends and patterns across Bristol properties",
        inputSchema: {
          type: "object",
          properties: {
            region: { type: "string", description: "Geographic region to analyze" },
            timeframe: { type: "string", description: "Time period: 1Y, 2Y, 5Y", default: "1Y" },
            metrics: { type: "array", items: { type: "string" }, description: "Specific metrics to analyze" }
          }
        }
      },
      {
        name: "store_analysis_results",
        description: "Store property analysis results and decisions in the database",
        inputSchema: {
          type: "object",
          properties: {
            siteId: { type: "string" },
            analysisType: { type: "string", description: "Type of analysis: underwriting, screening, due_diligence" },
            results: { type: "object", description: "Analysis results data" },
            recommendation: { type: "string", description: "Investment recommendation" },
            confidence: { type: "number", description: "Confidence score 0-1" }
          },
          required: ["siteId", "analysisType", "results"]
        }
      },
      {
        name: "get_comparables_analysis",
        description: "Get comprehensive comparable properties analysis with Bristol scoring methodology",
        inputSchema: {
          type: "object",
          properties: {
            address: { type: "string", description: "Subject property address" },
            radius: { type: "number", default: 5, description: "Search radius in miles" },
            assetType: { type: "string", description: "Property type filter" },
            minUnits: { type: "number", description: "Minimum unit count" },
            maxUnits: { type: "number", description: "Maximum unit count" }
          },
          required: ["address"]
        }
      },
      {
        name: "update_property_metrics",
        description: "Update property metrics and KPIs in the database",
        inputSchema: {
          type: "object",
          properties: {
            siteId: { type: "string" },
            metrics: { 
              type: "object",
              description: "Metrics to update: NOI, cap_rate, occupancy, rent_psf, etc."
            }
          },
          required: ["siteId", "metrics"]
        }
      },
      {
        name: "get_integration_status",
        description: "Get status of external data integrations and API connections",
        inputSchema: {
          type: "object",
          properties: {
            service: { type: "string", description: "Specific service to check" }
          }
        }
      }
    ];
  }

  async handleToolCall(toolName, params) {
    try {
      switch (toolName) {
        case "query_bristol_database":
          return await this.queryDatabase(params.query, params.params || []);
          
        case "get_bristol_portfolio":
          return await this.getBristolPortfolio(params);
          
        case "get_property_analysis":
          return await this.getPropertyAnalysis(params);
          
        case "analyze_market_trends":
          return await this.analyzeMarketTrends(params);
          
        case "store_analysis_results":
          return await this.storeAnalysisResults(params);
          
        case "get_comparables_analysis":
          return await this.getComparablesAnalysis(params);
          
        case "update_property_metrics":
          return await this.updatePropertyMetrics(params);
          
        case "get_integration_status":
          return await this.getIntegrationStatus(params);
          
        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    } catch (error) {
      return {
        error: error.message,
        tool: toolName,
        timestamp: new Date().toISOString()
      };
    }
  }

  async queryDatabase(query, params = []) {
    // Security: Only allow SELECT statements for data safety
    const trimmedQuery = query.trim().toLowerCase();
    if (!trimmedQuery.startsWith('select')) {
      throw new Error('Only SELECT queries are allowed for safety. Use specific tools for data modifications.');
    }

    const client = await pool.connect();
    try {
      const result = await client.query(query, params);
      return {
        success: true,
        rows: result.rows,
        rowCount: result.rowCount,
        query: query,
        timestamp: new Date().toISOString()
      };
    } finally {
      client.release();
    }
  }

  async getBristolPortfolio(params) {
    const { limit = 100, status, city, state } = params;
    
    let query = `
      SELECT 
        s.*,
        COUNT(sm.id) as metrics_count,
        AVG(CASE WHEN sm.metric_name = 'median_household_income' THEN sm.value END) as avg_income,
        AVG(CASE WHEN sm.metric_name = 'population_density' THEN sm.value END) as population_density
      FROM sites s
      LEFT JOIN site_metrics sm ON s.id = sm.site_id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramIndex = 1;
    
    if (status) {
      query += ` AND s.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }
    
    if (city) {
      query += ` AND LOWER(s.city) = LOWER($${paramIndex})`;
      queryParams.push(city);
      paramIndex++;
    }
    
    if (state) {
      query += ` AND LOWER(s.state) = LOWER($${paramIndex})`;
      queryParams.push(state);
      paramIndex++;
    }
    
    query += `
      GROUP BY s.id
      ORDER BY s.created_at DESC
      LIMIT $${paramIndex}
    `;
    queryParams.push(limit);

    return await this.queryDatabase(query, queryParams);
  }

  async getPropertyAnalysis(params) {
    const { siteId, includeComps = true, includeMetrics = true } = params;
    
    const analysis = {
      site: null,
      metrics: [],
      comparables: [],
      analysis_timestamp: new Date().toISOString()
    };

    // Get base site data
    const siteResult = await this.queryDatabase(
      'SELECT * FROM sites WHERE id = $1',
      [siteId]
    );
    
    if (!siteResult.rows.length) {
      throw new Error(`Site not found: ${siteId}`);
    }
    
    analysis.site = siteResult.rows[0];

    // Get metrics if requested
    if (includeMetrics) {
      const metricsResult = await this.queryDatabase(
        'SELECT * FROM site_metrics WHERE site_id = $1 ORDER BY metric_type, metric_name',
        [siteId]
      );
      analysis.metrics = metricsResult.rows;
    }

    // Get comparables if requested
    if (includeComps) {
      const compsResult = await this.queryDatabase(`
        SELECT ca.*, 
               ST_Distance(
                 ST_MakePoint($2, $3)::geography,
                 ST_MakePoint(ca.lng, ca.lat)::geography
               ) / 1609.34 as distance_miles
        FROM comps_annex ca
        WHERE ca.lat IS NOT NULL 
          AND ca.lng IS NOT NULL
          AND ST_Distance(
            ST_MakePoint($2, $3)::geography,
            ST_MakePoint(ca.lng, ca.lat)::geography
          ) / 1609.34 <= 10
        ORDER BY distance_miles
        LIMIT 20
      `, [siteId, analysis.site.longitude, analysis.site.latitude]);
      
      analysis.comparables = compsResult.rows;
    }

    return {
      success: true,
      data: analysis,
      timestamp: new Date().toISOString()
    };
  }

  async analyzeMarketTrends(params) {
    const { region, timeframe = '1Y', metrics = [] } = params;
    
    // Calculate date threshold based on timeframe
    const dateThreshold = new Date();
    switch (timeframe) {
      case '1Y':
        dateThreshold.setFullYear(dateThreshold.getFullYear() - 1);
        break;
      case '2Y':
        dateThreshold.setFullYear(dateThreshold.getFullYear() - 2);
        break;
      case '5Y':
        dateThreshold.setFullYear(dateThreshold.getFullYear() - 5);
        break;
    }

    const trendsQuery = `
      SELECT 
        s.city,
        s.state,
        COUNT(*) as property_count,
        AVG(s.units_total) as avg_units,
        AVG(s.avg_sf) as avg_sqft,
        AVG(CASE WHEN sm.metric_name = 'median_household_income' THEN sm.value END) as avg_income,
        AVG(CASE WHEN sm.metric_name = 'unemployment_rate' THEN sm.value END) as unemployment_rate,
        AVG(CASE WHEN ca.rent_psf IS NOT NULL THEN ca.rent_psf END) as avg_rent_psf
      FROM sites s
      LEFT JOIN site_metrics sm ON s.id = sm.site_id
      LEFT JOIN comps_annex ca ON s.city = ca.city AND s.state = ca.state
      WHERE s.created_at >= $1
        ${region ? 'AND (LOWER(s.city) LIKE LOWER($2) OR LOWER(s.state) LIKE LOWER($2))' : ''}
      GROUP BY s.city, s.state
      HAVING COUNT(*) > 0
      ORDER BY property_count DESC
    `;

    const params_array = [dateThreshold.toISOString()];
    if (region) {
      params_array.push(`%${region}%`);
    }

    return await this.queryDatabase(trendsQuery, params_array);
  }

  async storeAnalysisResults(params) {
    const { siteId, analysisType, results, recommendation, confidence } = params;
    
    const insertQuery = `
      INSERT INTO agent_decisions (
        site_id, decision_type, decision, reasoning, confidence, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `;

    return await this.queryDatabase(insertQuery, [
      siteId,
      analysisType,
      JSON.stringify(results),
      recommendation || 'No recommendation provided',
      confidence || 0.5
    ]);
  }

  async getComparablesAnalysis(params) {
    const { address, radius = 5, assetType, minUnits, maxUnits } = params;
    
    // This would ideally geocode the address first, but for now use a text search
    let query = `
      SELECT 
        ca.*,
        CASE 
          WHEN ca.rent_psf IS NOT NULL AND ca.units IS NOT NULL THEN 
            (ca.rent_psf * 12 * ca.total_sqft) / ca.units 
        END as estimated_annual_rent_per_unit,
        CASE 
          WHEN ca.noi IS NOT NULL AND ca.price_per_unit IS NOT NULL AND ca.units IS NOT NULL THEN 
            ca.noi / (ca.price_per_unit * ca.units) * 100
        END as estimated_cap_rate
      FROM comps_annex ca
      WHERE 1=1
    `;

    const queryParams = [];
    let paramIndex = 1;

    // Simple address matching - in production would use geocoding
    if (address) {
      query += ` AND (LOWER(ca.address) LIKE LOWER($${paramIndex}) OR LOWER(ca.city) LIKE LOWER($${paramIndex}))`;
      queryParams.push(`%${address}%`);
      paramIndex++;
    }

    if (assetType) {
      query += ` AND LOWER(ca.asset_type) = LOWER($${paramIndex})`;
      queryParams.push(assetType);
      paramIndex++;
    }

    if (minUnits) {
      query += ` AND ca.units >= $${paramIndex}`;
      queryParams.push(minUnits);
      paramIndex++;
    }

    if (maxUnits) {
      query += ` AND ca.units <= $${paramIndex}`;
      queryParams.push(maxUnits);
      paramIndex++;
    }

    query += ` ORDER BY ca.created_at DESC LIMIT 50`;

    return await this.queryDatabase(query, queryParams);
  }

  async updatePropertyMetrics(params) {
    const { siteId, metrics } = params;
    
    // Insert or update metrics
    const results = [];
    
    for (const [metricName, value] of Object.entries(metrics)) {
      const upsertQuery = `
        INSERT INTO site_metrics (site_id, metric_type, metric_name, value, source, created_at)
        VALUES ($1, 'financial', $2, $3, 'bristol_ai_agent', NOW())
        ON CONFLICT (site_id, metric_name) 
        DO UPDATE SET value = $3, created_at = NOW()
        RETURNING *
      `;
      
      const result = await this.queryDatabase(upsertQuery, [siteId, metricName, value]);
      results.push(result.rows[0]);
    }

    return {
      success: true,
      updated_metrics: results,
      timestamp: new Date().toISOString()
    };
  }

  async getIntegrationStatus(params) {
    const { service } = params;
    
    let query = `
      SELECT 
        il.service,
        il.status,
        COUNT(*) as total_calls,
        COUNT(CASE WHEN il.status = 'success' THEN 1 END) as successful_calls,
        COUNT(CASE WHEN il.status = 'error' THEN 1 END) as failed_calls,
        MAX(il.created_at) as last_call
      FROM integration_logs il
      WHERE il.created_at >= NOW() - INTERVAL '24 hours'
    `;

    const queryParams = [];
    if (service) {
      query += ` AND il.service = $1`;
      queryParams.push(service);
    }

    query += ` GROUP BY il.service, il.status ORDER BY last_call DESC`;

    return await this.queryDatabase(query, queryParams);
  }
}

// MCP Communication Protocol
class MCPTransport {
  constructor(server) {
    this.server = server;
  }

  async start() {
    // Handle STDIO communication for MCP
    process.stdin.on('data', async (data) => {
      try {
        const request = JSON.parse(data.toString());
        
        if (request.method === 'tools/list') {
          const response = {
            jsonrpc: "2.0",
            id: request.id,
            result: {
              tools: this.server.tools
            }
          };
          this.sendResponse(response);
        }
        
        else if (request.method === 'tools/call') {
          const { name: toolName, arguments: toolArgs } = request.params;
          const result = await this.server.handleToolCall(toolName, toolArgs);
          
          const response = {
            jsonrpc: "2.0",
            id: request.id,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result, null, 2)
                }
              ]
            }
          };
          this.sendResponse(response);
        }
        
        else if (request.method === 'initialize') {
          const response = {
            jsonrpc: "2.0",
            id: request.id,
            result: {
              protocolVersion: "2024-11-05",
              capabilities: {
                tools: {}
              },
              serverInfo: {
                name: this.server.name,
                version: this.server.version
              }
            }
          };
          this.sendResponse(response);
        }
        
      } catch (error) {
        const errorResponse = {
          jsonrpc: "2.0",
          id: request?.id || null,
          error: {
            code: -32000,
            message: error.message
          }
        };
        this.sendResponse(errorResponse);
      }
    });

    // Handle process cleanup
    process.on('SIGINT', () => {
      pool.end();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      pool.end();
      process.exit(0);
    });
  }

  sendResponse(response) {
    process.stdout.write(JSON.stringify(response) + '\n');
  }
}

// Start the MCP server
async function main() {
  try {
    // Test database connection
    const client = await pool.connect();
    client.release();
    
    const server = new PostgresMCPServer();
    const transport = new MCPTransport(server);
    
    await transport.start();
    
    // Send server info to stderr for debugging
    process.stderr.write(`Bristol PostgreSQL MCP Server started successfully\n`);
    
  } catch (error) {
    process.stderr.write(`Failed to start PostgreSQL MCP Server: ${error.message}\n`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { PostgresMCPServer, MCPTransport };