import express from 'express';
import fs from 'fs';
import path from 'path';

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
    // In a real implementation, this would:
    // 1. Stop all currently running MCP server processes
    // 2. Read the updated configuration
    // 3. Start new MCP server processes based on the config
    
    // For now, we'll simulate the restart process
    const configData = fs.readFileSync(MCP_CONFIG_PATH, 'utf8');
    const config = JSON.parse(configData);
    
    console.log('MCP Configuration Updated - Servers Configured:');
    Object.entries(config.mcpServers || {}).forEach(([name, serverConfig]: [string, any]) => {
      console.log(`  - ${name}: ${serverConfig.command} ${serverConfig.args?.join(' ') || ''}`);
    });
    console.log('Note: In production, these would spawn as actual MCP server processes');

    // Simulate restart delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    res.json({
      ok: true,
      message: 'MCP configuration updated successfully',
      configuredServers: Object.keys(config.mcpServers || {}),
      activeConnections: 0, // None actually running in this demo
      note: 'Servers configured but not actively spawned in demo mode',
      restartedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error restarting MCP servers:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to restart MCP servers'
    });
  }
});

// Get MCP server status
router.get('/status', async (req, res) => {
  try {
    const configExists = fs.existsSync(MCP_CONFIG_PATH);
    let serverCount = 0;
    let configData = null;

    if (configExists) {
      configData = JSON.parse(fs.readFileSync(MCP_CONFIG_PATH, 'utf8'));
      serverCount = Object.keys(configData.mcpServers || {}).length;
    }

    res.json({
      ok: true,
      status: {
        configExists,
        serverCount,
        healthy: true,
        lastCheck: new Date().toISOString(),
        configPath: MCP_CONFIG_PATH
      }
    });

  } catch (error) {
    console.error('Error getting MCP status:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to get MCP status'
    });
  }
});

export default router;