import express from 'express';
import fs from 'fs';
import path from 'path';
import { mcpServerManager } from '../services/mcpServerManager';

const router = express.Router();

// MCP Configuration file path
const MCP_CONFIG_PATH = path.join(process.cwd(), 'mcp-config.json');

// Load MCP configuration
router.get('/', async (req, res) => {
  try {
    if (fs.existsSync(MCP_CONFIG_PATH)) {
      const configData = fs.readFileSync(MCP_CONFIG_PATH, 'utf8');
      const config = JSON.parse(configData);
      res.json({
        ok: true,
        mcpServers: config.mcpServers || {},
        lastModified: fs.statSync(MCP_CONFIG_PATH).mtime
      });
    } else {
      // Return default config if file doesn't exist
      const defaultConfig = {
        mcpServers: {
          filesystem: {
            command: "npx",
            args: ["@modelcontextprotocol/server-filesystem", "/tmp"],
            env: {
              NODE_ENV: "production"
            }
          },
          postgres: {
            command: "npx",
            args: ["@modelcontextprotocol/server-postgres"],
            env: {
              DATABASE_URL: process.env.DATABASE_URL || "postgresql://localhost:5432/bristol"
            }
          },
          memory: {
            command: "npx",
            args: ["@modelcontextprotocol/server-memory"],
            env: {
              NODE_ENV: "production"
            }
          }
        }
      };
      
      // Save default config
      fs.writeFileSync(MCP_CONFIG_PATH, JSON.stringify(defaultConfig, null, 2));
      
      res.json({
        ok: true,
        mcpServers: defaultConfig.mcpServers,
        isDefault: true
      });
    }
  } catch (error) {
    console.error('Error loading MCP config:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to load MCP configuration'
    });
  }
});

// Save MCP configuration
router.post('/', async (req, res) => {
  try {
    const mcpServers = req.body;
    
    // Validate the configuration
    if (!mcpServers || typeof mcpServers !== 'object') {
      return res.status(400).json({
        ok: false,
        error: 'Invalid MCP configuration - must be an object'
      });
    }

    // Validate each server configuration
    for (const [serverName, config] of Object.entries(mcpServers)) {
      if (!config || typeof config !== 'object') {
        return res.status(400).json({
          ok: false,
          error: `Invalid configuration for server: ${serverName}`
        });
      }
      
      const serverConfig = config as any;
      if (!serverConfig.command) {
        return res.status(400).json({
          ok: false,
          error: `Missing command for server: ${serverName}`
        });
      }
    }

    // Save the configuration
    const configData = {
      mcpServers,
      lastUpdated: new Date().toISOString(),
      version: "1.0.0"
    };

    fs.writeFileSync(MCP_CONFIG_PATH, JSON.stringify(configData, null, 2));

    res.json({
      ok: true,
      message: 'MCP configuration saved successfully',
      serversConfigured: Object.keys(mcpServers).length
    });

  } catch (error) {
    console.error('Error saving MCP config:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to save MCP configuration'
    });
  }
});

// Restart MCP servers
router.post('/restart', async (req, res) => {
  try {
    console.log('🔄 Restarting MCP servers...');
    
    // Stop all running servers first
    await mcpServerManager.stopAllServers();
    
    // Wait a moment for cleanup
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Load and start servers from configuration
    await mcpServerManager.loadAndStartServers();
    
    // Get current status
    const serverStatus = mcpServerManager.getServerStatus();
    const runningCount = mcpServerManager.getRunningServerCount();

    console.log(`✅ MCP restart complete. ${runningCount} servers running.`);

    res.json({
      ok: true,
      message: `MCP servers restarted successfully. ${runningCount} servers running.`,
      activeConnections: runningCount,
      serverStatus,
      restartedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error restarting MCP servers:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to restart MCP servers',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get MCP server status
router.get('/status', async (req, res) => {
  try {
    const configExists = fs.existsSync(MCP_CONFIG_PATH);
    let configuredCount = 0;
    let configData = null;

    if (configExists) {
      configData = JSON.parse(fs.readFileSync(MCP_CONFIG_PATH, 'utf8'));
      configuredCount = Object.keys(configData.mcpServers || {}).length;
    }

    const serverStatus = mcpServerManager.getServerStatus();
    const runningCount = mcpServerManager.getRunningServerCount();

    res.json({
      ok: true,
      status: {
        configExists,
        configuredCount,
        runningCount,
        healthy: runningCount > 0,
        lastCheck: new Date().toISOString(),
        configPath: MCP_CONFIG_PATH,
        servers: serverStatus
      }
    });

  } catch (error) {
    console.error('Error getting MCP status:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to get MCP status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;