import { Router } from 'express';
import { eliteMCPSuperserver } from '../services/eliteMCPSuperserver';

// Convert tool parameters to proper MCP JSON Schema format
function convertToMCPSchema(parameters: any): any {
  const schema: any = {};
  
  for (const [key, value] of Object.entries(parameters)) {
    if (typeof value === 'object' && value !== null) {
      const param = value as any;
      schema[key] = {
        type: param.type || 'string',
        description: param.description || `Parameter ${key}`,
        ...(param.enum && { enum: param.enum }),
        ...(param.default !== undefined && { default: param.default }),
        ...(param.minimum !== undefined && { minimum: param.minimum }),
        ...(param.maximum !== undefined && { maximum: param.maximum })
      };
    } else {
      schema[key] = {
        type: 'string',
        description: `Parameter ${key}`
      };
    }
  }
  
  return schema;
}

// Extract required fields from parameters
function getRequiredFields(parameters: any): string[] {
  const required: string[] = [];
  
  for (const [key, value] of Object.entries(parameters)) {
    if (typeof value === 'object' && value !== null) {
      const param = value as any;
      if (param.required === true || param.required !== false) {
        required.push(key);
      }
    }
  }
  
  return required;
}

const router = Router();

// STREAMABLE_HTTP endpoint for ElevenLabs MCP - follows MCP protocol exactly
router.post('/api/mcp/stream', async (req, res) => {
  try {
    console.log('ElevenLabs STREAMABLE_HTTP request:', JSON.stringify(req.body, null, 2));
    
    const { jsonrpc, method, params, id } = req.body;
    
    // Validate JSON-RPC format
    if (jsonrpc !== '2.0') {
      return res.status(400).json({
        jsonrpc: '2.0',
        id,
        error: { code: -32600, message: 'Invalid Request - missing or invalid jsonrpc version' }
      });
    }
    
    switch (method) {
      case 'initialize':
        // MCP initialization
        res.json({
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {},
              resources: {},
              prompts: {},
              logging: {}
            },
            serverInfo: {
              name: 'Bristol Elite MCP Server',
              version: '2.0.0'
            }
          }
        });
        break;
        
      case 'tools/list':
        // List available tools with proper MCP schema compliance
        const tools = eliteMCPSuperserver.getAvailableTools();
        res.json({
          jsonrpc: '2.0',
          id,
          result: {
            tools: tools.map(tool => ({
              name: tool.name,
              description: tool.description,
              inputSchema: {
                type: 'object',
                properties: convertToMCPSchema(tool.parameters || {}),
                required: getRequiredFields(tool.parameters || {}),
                additionalProperties: false
              }
            }))
          }
        });
        break;
        
      case 'tools/call':
        // Execute a tool
        const { name, arguments: args } = params;
        
        if (!name) {
          return res.status(400).json({
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: 'Invalid params - tool name required' }
          });
        }
        
        try {
          const result = await eliteMCPSuperserver.executeTool(
            name,
            args || {},
            {
              userId: req.headers['x-user-id'] as string || 'elevenlabs-stream',
              source: 'elevenlabs-stream',
              timestamp: new Date().toISOString()
            }
          );
          
          res.json({
            jsonrpc: '2.0',
            id,
            result: {
              content: [
                {
                  type: 'text',
                  text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
                }
              ]
            }
          });
        } catch (toolError) {
          console.error('Tool execution error:', toolError);
          res.status(500).json({
            jsonrpc: '2.0',
            id,
            error: {
              code: -32603,
              message: `Tool execution failed: ${toolError instanceof Error ? toolError.message : 'Unknown error'}`
            }
          });
        }
        break;
        
      case 'notifications/initialized':
        // Client notification that it's initialized
        res.json({
          jsonrpc: '2.0',
          id,
          result: {}
        });
        break;
        
      default:
        res.status(400).json({
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `Method not found: ${method}` }
        });
    }
    
  } catch (error) {
    console.error('MCP stream error:', error);
    res.status(500).json({
      jsonrpc: '2.0',
      id: req.body?.id,
      error: {
        code: -32603,
        message: error instanceof Error ? error.message : 'Internal error'
      }
    });
  }
});

// Health check endpoint for MCP server
router.get('/api/mcp/stream/health', (req, res) => {
  res.json({
    status: 'healthy',
    transport: 'STREAMABLE_HTTP',
    protocol: 'MCP 2024-11-05',
    tools_available: eliteMCPSuperserver.getAvailableTools().length,
    timestamp: new Date().toISOString()
  });
});

export default router;