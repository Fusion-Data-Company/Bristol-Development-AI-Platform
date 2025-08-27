import { Router } from 'express';
import { eliteMCPSuperserver } from '../services/eliteMCPSuperserver';
import { db } from '../db';
import { teamUsers } from '@shared/schema';

const router = Router();

// Main webhook endpoint for ElevenLabs
router.post('/webhook/elevenlabs', async (req, res) => {
  try {
    console.log('ElevenLabs webhook received:', JSON.stringify(req.body, null, 2));
    
    // Handle webhook verification (ElevenLabs sends this on initial setup)
    if (req.body.challenge) {
      console.log('Webhook verification challenge received');
      return res.json({ challenge: req.body.challenge });
    }
    
    // Handle tool execution requests
    const { action, params, context } = req.body;
    
    if (action === 'execute_tool') {
      const { tool_name, args } = params || {};
      
      // Execute the tool
      const result = await eliteMCPSuperserver.executeTool(
        tool_name,
        args || {},
        {
          userId: context?.user_id || 'elevenlabs-webhook',
          source: 'elevenlabs',
          timestamp: new Date().toISOString()
        }
      );
      
      return res.json({
        success: true,
        result,
        timestamp: new Date().toISOString()
      });
    }
    
    // Handle specific MCP tool calls directly
    if (req.body.tool) {
      const result = await eliteMCPSuperserver.executeTool(
        req.body.tool,
        req.body.args || {},
        {
          userId: req.body.user_id || 'elevenlabs-user',
          source: 'elevenlabs',
          timestamp: new Date().toISOString()
        }
      );
      
      return res.json({
        success: true,
        tool: req.body.tool,
        result,
        timestamp: new Date().toISOString()
      });
    }
    
    // Default response for unknown webhook types
    res.json({
      success: true,
      message: 'Webhook received',
      available_tools: eliteMCPSuperserver.getAvailableTools().map(t => t.name)
    });
    
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET endpoint for testing/verification
router.get('/webhook/elevenlabs', (req, res) => {
  res.json({
    status: 'active',
    message: 'ElevenLabs webhook endpoint is ready',
    available_tools: [
      'verify_user',
      'fetch_last_conversation',
      'log_conversation',
      'query_analytics',
      'store_artifact'
    ],
    total_tools: eliteMCPSuperserver.getAvailableTools().length,
    instructions: 'POST to this endpoint with {tool: "tool_name", args: {...}}'
  });
});

// Simple tool list endpoint
router.get('/webhook/elevenlabs/tools', (req, res) => {
  const tools = eliteMCPSuperserver.getAvailableTools();
  res.json({
    tools: tools.map(t => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters
    })),
    count: tools.length
  });
});

export default router;