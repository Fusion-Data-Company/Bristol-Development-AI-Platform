import { Router } from 'express';
import { elevenLabsMCPGateway } from '../services/elevenLabsMCPGateway';
import { seedBristolTeam } from '../services/bristolTeamSeeder';
import crypto from 'crypto';

const router = Router();

// MCP Secret for authentication with ElevenLabs
const MCP_SECRET = process.env.ELEVENLABS_MCP_SECRET || crypto.randomBytes(32).toString('hex');

// Validate HMAC signature from ElevenLabs
function validateSignature(req: any): boolean {
  const signature = req.headers['x-elevenlabs-signature'];
  if (!signature) return false;
  
  const hmac = crypto.createHmac('sha256', MCP_SECRET);
  hmac.update(JSON.stringify(req.body));
  const calculated = hmac.digest('hex');
  
  return signature === calculated;
}

// Main MCP endpoint for ElevenLabs
router.post('/api/mcp/elevenlabs', async (req, res) => {
  try {
    // Validate request signature
    if (process.env.NODE_ENV === 'production' && !validateSignature(req)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { method, params, id } = req.body;
    
    // Handle different MCP methods
    switch (method) {
      case 'tools/list':
        // Return available tools
        const tools = elevenLabsMCPGateway.getToolDefinitions();
        return res.json({
          jsonrpc: '2.0',
          id,
          result: { tools }
        });
        
      case 'tools/execute':
        // Execute a tool
        const { name, arguments: args } = params;
        const result = await elevenLabsMCPGateway.executeTool(
          name, 
          args,
          req.headers['x-conversation-id']
        );
        
        return res.json({
          jsonrpc: '2.0',
          id,
          result
        });
        
      case 'tools/chain':
        // Execute multiple tools
        const { tools: toolChain } = params;
        const results = await elevenLabsMCPGateway.executeToolChain(
          toolChain,
          req.headers['x-conversation-id']
        );
        
        return res.json({
          jsonrpc: '2.0',
          id,
          result: { results }
        });
        
      case 'tools/suggest':
        // Get tool suggestions based on intent
        const { intent } = params;
        const suggestions = await elevenLabsMCPGateway.suggestTools(intent);
        
        return res.json({
          jsonrpc: '2.0',
          id,
          result: { suggestions }
        });
        
      default:
        return res.status(400).json({
          jsonrpc: '2.0',
          id,
          error: {
            code: -32601,
            message: 'Method not found'
          }
        });
    }
  } catch (error) {
    console.error('MCP request error:', error);
    return res.status(500).json({
      jsonrpc: '2.0',
      id: req.body.id,
      error: {
        code: -32603,
        message: 'Internal error',
        data: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

// Tool discovery endpoint
router.get('/api/mcp/tools', (req, res) => {
  const tools = elevenLabsMCPGateway.getToolDefinitions();
  res.json({
    name: 'Bristol Elite MCP Gateway',
    version: '1.0.0',
    tools,
    capabilities: {
      streaming: true,
      batch: true,
      async: true,
      errorHandling: 'circuit-breaker'
    }
  });
});

// Health check endpoint
router.get('/api/mcp/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    tools: elevenLabsMCPGateway.getToolDefinitions().length,
    secret_configured: !!process.env.ELEVENLABS_MCP_SECRET
  });
});

// Server-Sent Events endpoint for real-time updates
router.get('/api/mcp/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date() })}\n\n`);

  // Keep connection alive
  const heartbeat = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: new Date() })}\n\n`);
  }, 30000);

  req.on('close', () => {
    clearInterval(heartbeat);
  });
});

// Initialize Bristol team on startup
router.post('/api/mcp/init-team', async (req, res) => {
  try {
    const result = await seedBristolTeam();
    res.json({
      success: result,
      message: result ? 'Bristol team initialized successfully' : 'Failed to initialize team'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Register MCP server with ElevenLabs (to be called manually or on startup)
router.post('/api/mcp/register', async (req, res) => {
  try {
    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    
    if (!elevenLabsApiKey) {
      return res.status(400).json({
        error: 'ElevenLabs API key not configured'
      });
    }

    const baseUrl = process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000';
    const serverUrl = `https://${baseUrl}/api/mcp/elevenlabs`;
    
    const mcpConfig = {
      name: 'Bristol Elite Cap AI Gateway',
      description: 'Enterprise MCP gateway for Bristol Development Cap AI assistant',
      server_url: serverUrl,
      secret_token: MCP_SECRET,
      http_headers: {
        'X-Bristol-Agent': 'cap-elite-v1',
        'X-MCP-Version': '1.0'
      }
    };

    // Register with ElevenLabs
    const response = await fetch('https://api.elevenlabs.io/v1/convai/mcp-servers', {
      method: 'POST',
      headers: {
        'xi-api-key': elevenLabsApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ config: mcpConfig })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ElevenLabs registration failed: ${error}`);
    }

    const result = await response.json();
    
    console.log('✅ MCP server registered with ElevenLabs:', result.id);
    
    res.json({
      success: true,
      serverId: result.id,
      serverUrl,
      message: 'MCP server successfully registered with ElevenLabs'
    });
  } catch (error) {
    console.error('Failed to register MCP server:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Registration failed'
    });
  }
});

export default router;