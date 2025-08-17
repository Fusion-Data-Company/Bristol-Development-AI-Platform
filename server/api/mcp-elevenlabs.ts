import { Router } from 'express';
import { elevenLabsMCPGateway } from '../services/elevenLabsMCPGateway';
import { eliteMCPSuperserver } from '../services/eliteMCPSuperserver';
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
        // Return all available tools from superserver
        const superTools = eliteMCPSuperserver.getAvailableTools();
        const legacyTools = elevenLabsMCPGateway.getToolDefinitions();
        const allTools = [...superTools, ...legacyTools];
        return res.json({
          jsonrpc: '2.0',
          id,
          result: { tools: allTools }
        });
        
      case 'tools/execute':
      case 'tools/call':  // Support both method names for compatibility
        // Execute a tool from superserver or legacy gateway
        const { name, arguments: args } = params;
        
        const startTime = Date.now();
        let result;
        
        try {
          // Get user context from request
          const context = {
            userId: req.body.userId || req.headers['x-user-id'] as string,
            sessionId: req.body.sessionId || req.headers['x-session-id'] as string,
            conversationId: req.headers['x-conversation-id'] as string,
            source: 'elevenlabs' as const,
            timestamp: new Date().toISOString()
          };
          
          // Try superserver first
          result = await eliteMCPSuperserver.executeTool(name, args, context);
        } catch (superserverError) {
          // Fallback to legacy gateway
          console.log(`Superserver: ${superserverError}, using legacy gateway for ${name}`);
          result = await elevenLabsMCPGateway.executeTool(
            name, 
            args,
            req.headers['x-conversation-id']
          );
        }
        
        const executionTime = Date.now() - startTime;
        console.log(`Tool ${name} executed in ${executionTime}ms - Status: success`);
        
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

// Tool discovery endpoint - Superserver Edition
router.get('/api/mcp/tools', async (req, res) => {
  try {
    // Get all tools from superserver
    const superTools = eliteMCPSuperserver.getAvailableTools();
    const legacyTools = elevenLabsMCPGateway.getToolDefinitions();
    
    // Combine tools
    const allTools = [...superTools, ...legacyTools.filter(lt => 
      !superTools.find(st => st.name === lt.name)
    )];
    
    // Get health status
    const health = await eliteMCPSuperserver.healthCheck();
    
    res.json({
      name: 'Bristol Elite MCP Superserver',
      version: '2.0.0',
      tools: allTools,
      totalTools: allTools.length,
      categories: health.categories,
      capabilities: {
        streaming: true,
        batch: true,
        async: true,
        errorHandling: 'elite-circuit-breaker',
        sharedMemory: true,
        crossAgentSync: true,
        realTimeData: true,
        aiModels: ['Claude 4.1 Opus', 'GPT-4o', 'Perplexity Sonar', 'DALL-E 3']
      }
    });
  } catch (error) {
    // Fallback to legacy if superserver fails
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
  }
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

// Test endpoint for ElevenLabs agent
router.get('/api/mcp/test-elevenlabs', (req, res) => {
  const tools = eliteMCPSuperserver.getAvailableTools();
  res.json({
    message: 'ElevenLabs MCP Connection Test',
    status: 'connected',
    availableTools: tools.length,
    toolNames: tools.map(t => t.name),
    mcpEndpoint: 'https://' + req.hostname + '/api/mcp/elevenlabs',
    instructions: {
      listTools: 'POST to /api/mcp/elevenlabs with method: "tools/list"',
      callTool: 'POST to /api/mcp/elevenlabs with method: "tools/call" and params: {name, arguments}',
      example: {
        method: 'tools/call',
        params: {
          name: 'verify_user',
          arguments: { name: 'John Smith' }
        }
      }
    }
  });
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

// Simple tool execution endpoint for ElevenLabs widget
router.post('/api/mcp/execute', async (req, res) => {
  try {
    const { tool, args = {} } = req.body;
    
    if (!tool) {
      return res.status(400).json({ error: 'Tool name required' });
    }
    
    // Execute tool via superserver
    const result = await eliteMCPSuperserver.executeTool(tool, args, {
      userId: 'elevenlabs-widget',
      source: 'elevenlabs-widget',
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      tool,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Tool execution error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Tool execution failed'
    });
  }
});

// Simple GET endpoint for ElevenLabs to check available tools
router.get('/api/mcp/available-tools', (req, res) => {
  const tools = eliteMCPSuperserver.getAvailableTools();
  res.json({
    tools: tools.map(t => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters
    })),
    total: tools.length,
    endpoint: '/api/mcp/execute',
    usage: 'POST { tool: "tool_name", args: {...} }'
  });
});

// Webhook endpoint for external triggers from ElevenLabs
router.get('/webhook/trigger', async (req, res) => {
  try {
    const { action, ...params } = req.query;
    
    // Log the webhook call
    console.log('ElevenLabs webhook triggered:', { action, params });
    
    // Handle different webhook actions
    let result;
    switch (action as string) {
      case 'portfolio_summary':
        result = await gateway.executeToolInternal('query_analytics', {
          query: 'portfolio overview',
          type: 'portfolio'
        });
        break;
        
      case 'verify_team_member':
        const name = params.name as string;
        if (!name) {
          return res.status(400).json({ error: 'Name parameter required' });
        }
        result = await gateway.executeToolInternal('verify_user', { name });
        break;
        
      case 'market_research':
        const query = params.query as string || 'latest sunbelt market trends';
        result = await gateway.executeToolInternal('web_search', { query });
        break;
        
      case 'save_note':
        const content = params.content as string;
        if (!content) {
          return res.status(400).json({ error: 'Content parameter required' });
        }
        result = await gateway.executeToolInternal('store_artifact', {
          type: 'note',
          content,
          meta: { source: 'webhook', timestamp: new Date().toISOString() }
        });
        break;
        
      case 'get_last_conversation':
        const userId = params.user_id as string || 'default';
        result = await gateway.executeToolInternal('fetch_last_conversation', { 
          user_id: userId 
        });
        break;
        
      default:
        return res.status(400).json({ 
          error: 'Invalid action',
          available_actions: [
            'portfolio_summary',
            'verify_team_member',
            'market_research', 
            'save_note',
            'get_last_conversation'
          ],
          example: '/api/mcp/webhook/trigger?action=portfolio_summary'
        });
    }
    
    res.json({
      success: true,
      action,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ 
      error: 'Webhook execution failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;