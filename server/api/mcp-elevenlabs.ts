import { Router } from 'express';
import { elevenLabsMCPGateway } from '../services/elevenLabsMCPGateway';
import { eliteMCPSuperserver } from '../services/eliteMCPSuperserver';
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

// DEPRECATED: Legacy endpoint - ElevenLabs now requires proper MCP protocol
// Use /api/mcp/stream (STREAMABLE_HTTP) or /api/mcp/sse (SSE) instead
router.post('/api/mcp/elevenlabs', async (req, res) => {
  res.status(410).json({
    jsonrpc: '2.0',
    id: req.body?.id || null,
    error: {
      code: -32601,
      message: 'Endpoint deprecated. Use /api/mcp/stream (STREAMABLE_HTTP) or /api/mcp/sse (SSE)',
      data: {
        recommended_endpoints: [
          'https://fee951bd-c543-4c3c-8fbc-a8cb5bc73b65-00-3tuug1k1kd4dd.picard.replit.dev/api/mcp/stream',
          'https://fee951bd-c543-4c3c-8fbc-a8cb5bc73b65-00-3tuug1k1kd4dd.picard.replit.dev/api/mcp/sse'
        ]
      }
    }
  });
});

// TEMPORARY REDIRECT for migration
router.get('/api/mcp/elevenlabs', (req, res) => {
  res.json({
    status: 'deprecated',
    message: 'This endpoint is deprecated. Use proper MCP transport endpoints.',
    correct_urls: {
      streamable_http: 'https://fee951bd-c543-4c3c-8fbc-a8cb5bc73b65-00-3tuug1k1kd4dd.picard.replit.dev/api/mcp/stream',
      sse: 'https://fee951bd-c543-4c3c-8fbc-a8cb5bc73b65-00-3tuug1k1kd4dd.picard.replit.dev/api/mcp/sse'
    }
  });
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
      name: 'Company Elite MCP Superserver',
      version: '2.0.0',
      tools: allTools,
      totalTools: allTools.length,
      health,
      capabilities: [
        'tools/list',
        'tools/call',
        'tools/execute',
        'tools/chain',
        'tools/suggest',
        'memory/store',
        'memory/retrieve',
        'analytics/track'
      ],
      documentation: {
        streamable_http: 'https://fee951bd-c543-4c3c-8fbc-a8cb5bc73b65-00-3tuug1k1kd4dd.picard.replit.dev/api/mcp/stream',
        sse: 'https://fee951bd-c543-4c3c-8fbc-a8cb5bc73b65-00-3tuug1k1kd4dd.picard.replit.dev/api/mcp/sse'
      }
    });
  } catch (error) {
    console.error('Error in tools discovery:', error);
    res.status(500).json({
      error: 'Failed to retrieve tool information',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;