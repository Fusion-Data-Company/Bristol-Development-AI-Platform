import { Router } from 'express';
import { eliteMCPSuperserver } from '../services/eliteMCPSuperserver';

const router = Router();

// SSE endpoint for ElevenLabs MCP connection
router.get('/api/mcp/sse', (req, res) => {
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
  });

  console.log('ElevenLabs SSE connection established');

  // Send initial connection event
  res.write(`data: ${JSON.stringify({
    jsonrpc: '2.0',
    method: 'notifications/initialized',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
        logging: {}
      }
    }
  })}\n\n`);

  // Send tools list immediately
  const tools = eliteMCPSuperserver.getAvailableTools();
  res.write(`data: ${JSON.stringify({
    jsonrpc: '2.0',
    method: 'tools/list',
    result: {
      tools: tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: {
          type: 'object',
          properties: tool.parameters || {},
          required: Object.keys(tool.parameters || {}).filter(key => 
            tool.parameters?.[key]?.required !== false
          )
        }
      }))
    }
  })}\n\n`);

  // Keep connection alive
  const heartbeat = setInterval(() => {
    res.write(`data: ${JSON.stringify({
      jsonrpc: '2.0',
      method: 'notifications/ping',
      params: { timestamp: Date.now() }
    })}\n\n`);
  }, 30000);

  // Handle client disconnect
  req.on('close', () => {
    console.log('ElevenLabs SSE connection closed');
    clearInterval(heartbeat);
    res.end();
  });

  req.on('error', (err) => {
    console.error('ElevenLabs SSE error:', err);
    clearInterval(heartbeat);
    res.end();
  });
});

// Tool execution endpoint for SSE (POST requests)
router.post('/api/mcp/sse/execute', async (req, res) => {
  try {
    console.log('ElevenLabs tool execution request:', JSON.stringify(req.body, null, 2));
    
    const { method, params, id } = req.body;
    
    if (method === 'tools/call') {
      const { name, arguments: args } = params;
      
      const result = await eliteMCPSuperserver.executeTool(
        name,
        args || {},
        {
          userId: req.headers['x-user-id'] as string || 'elevenlabs-user',
          source: 'elevenlabs-sse',
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
    } else {
      res.status(400).json({
        jsonrpc: '2.0',
        id,
        error: {
          code: -32601,
          message: `Method not found: ${method}`
        }
      });
    }
  } catch (error) {
    console.error('Tool execution error:', error);
    res.status(500).json({
      jsonrpc: '2.0',
      id: req.body.id,
      error: {
        code: -32603,
        message: error instanceof Error ? error.message : 'Internal error'
      }
    });
  }
});

export default router;