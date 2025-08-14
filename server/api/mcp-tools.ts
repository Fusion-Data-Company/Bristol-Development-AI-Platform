import express from 'express';
import { mcpToolsService } from '../services/mcpToolsService';

const router = express.Router();

// Get all available MCP tools
router.get('/', async (req, res) => {
  try {
    const tools = mcpToolsService.getAvailableTools();
    res.json({
      ok: true,
      tools,
      count: tools.length,
      categories: {
        data: mcpToolsService.getToolsByCategory('data').length,
        analysis: mcpToolsService.getToolsByCategory('analysis').length,
        external: mcpToolsService.getToolsByCategory('external').length,
        storage: mcpToolsService.getToolsByCategory('storage').length
      }
    });
  } catch (error) {
    console.error('Error getting MCP tools:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to get MCP tools'
    });
  }
});

// Execute a specific MCP tool
router.post('/execute/:toolName', async (req, res) => {
  try {
    const { toolName } = req.params;
    const parameters = req.body;

    const result = await mcpToolsService.executeTool(toolName, parameters);
    
    res.json({
      ok: true,
      tool: toolName,
      result,
      executedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Error executing MCP tool ${req.params.toolName}:`, error);
    res.status(500).json({
      ok: false,
      error: `Failed to execute tool: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
});

// Get MCP system status
router.get('/status', async (req, res) => {
  try {
    const status = await mcpToolsService.getSystemStatus();
    res.json({
      ok: true,
      status
    });
  } catch (error) {
    console.error('Error getting MCP status:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to get MCP status'
    });
  }
});

// Get AI context data (aggregated data for AI assistant)
router.get('/ai-context', async (req, res) => {
  try {
    const context = await mcpToolsService.getAiContext();
    res.json({
      ok: true,
      context,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting AI context:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to get AI context'
    });
  }
});

export default router;