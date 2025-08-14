#!/usr/bin/env node

/**
 * Bristol PostgreSQL MCP Server
 * Provides database access to the Bristol AI agent
 */

const { Pool } = require('pg');

// Initialize PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// MCP Server Implementation
class PostgresMCPServer {
  constructor() {
    this.name = "postgres";
    this.version = "1.0.0";
    this.tools = [
      {
        name: "query_bristol_data",
        description: "Query Bristol database for sites, metrics, and analytics",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string", 
              description: "SQL query to execute"
            },
            params: {
              type: "array",
              description: "Query parameters",
              items: { type: "string" }
            }
          },
          required: ["query"]
        }
      },
      {
        name: "get_bristol_sites",
        description: "Get all property sites in Bristol database",
        inputSchema: {
          type: "object",
          properties: {
            limit: { type: "number", default: 50 }
          }
        }
      },
      {
        name: "get_site_metrics",
        description: "Get metrics for a specific site",
        inputSchema: {
          type: "object", 
          properties: {
            siteId: { type: "string", description: "Site ID" }
          },
          required: ["siteId"]
        }
      },
      {
        name: "store_property_analysis",
        description: "Store property analysis results",
        inputSchema: {
          type: "object",
          properties: {
            siteId: { type: "string" },
            analysis: { type: "object" },
            timestamp: { type: "string" }
          },
          required: ["siteId", "analysis"]
        }
      }
    ];
  }

  async handleToolCall(toolName, params) {
    try {
      switch (toolName) {
        case "query_bristol_data":
          return await this.queryDatabase(params.query, params.params || []);
          
        case "get_bristol_sites":
          return await this.getBristolSites(params.limit || 50);
          
        case "get_site_metrics":
          return await this.getSiteMetrics(params.siteId);
          
        case "store_property_analysis":
          return await this.storePropertyAnalysis(params);
          
        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    } catch (error) {
      console.error(`Error executing ${toolName}:`, error);
      throw error;
    }
  }

  async queryDatabase(query, params = []) {
    const client = await pool.connect();
    try {
      const result = await client.query(query, params);
      return {
        success: true,
        rows: result.rows,
        rowCount: result.rowCount,
        query: query
      };
    } finally {
      client.release();
    }
  }

  async getBristolSites(limit) {
    const query = `
      SELECT 
        id, name, address, latitude, longitude, 
        bristol_score, status, created_at
      FROM sites 
      ORDER BY bristol_score DESC 
      LIMIT $1
    `;
    return await this.queryDatabase(query, [limit]);
  }

  async getSiteMetrics(siteId) {
    const query = `
      SELECT 
        sm.metric_type, sm.metric_name, sm.value, 
        sm.unit, sm.source, sm.created_at
      FROM site_metrics sm
      WHERE sm.site_id = $1
      ORDER BY sm.created_at DESC
    `;
    return await this.queryDatabase(query, [siteId]);
  }

  async storePropertyAnalysis(params) {
    const query = `
      INSERT INTO property_analysis (site_id, analysis_data, created_at)
      VALUES ($1, $2, $3)
      RETURNING id
    `;
    const timestamp = params.timestamp || new Date().toISOString();
    return await this.queryDatabase(query, [
      params.siteId,
      JSON.stringify(params.analysis),
      timestamp
    ]);
  }
}

// Start server if called directly
if (require.main === module) {
  const server = new PostgresMCPServer();
  
  // Handle STDIO communication
  process.stdin.on('data', async (data) => {
    try {
      const request = JSON.parse(data.toString());
      
      if (request.method === 'tools/list') {
        const response = {
          jsonrpc: "2.0",
          id: request.id,
          result: { tools: server.tools }
        };
        process.stdout.write(JSON.stringify(response) + '\n');
      } 
      else if (request.method === 'tools/call') {
        const { name, arguments: args } = request.params;
        const result = await server.handleToolCall(name, args || {});
        
        const response = {
          jsonrpc: "2.0", 
          id: request.id,
          result: { content: [{ type: "text", text: JSON.stringify(result) }] }
        };
        process.stdout.write(JSON.stringify(response) + '\n');
      }
    } catch (error) {
      const errorResponse = {
        jsonrpc: "2.0",
        id: request?.id || null,
        error: { 
          code: -32603, 
          message: error.message 
        }
      };
      process.stdout.write(JSON.stringify(errorResponse) + '\n');
    }
  });

  console.log("Bristol PostgreSQL MCP Server running on STDIO");
}

module.exports = PostgresMCPServer;