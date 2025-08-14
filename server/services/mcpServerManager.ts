import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';

interface MCPServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

interface RunningServer {
  name: string;
  process: ChildProcess;
  config: MCPServerConfig;
  status: 'starting' | 'running' | 'stopped' | 'error';
  startTime: Date;
  lastError?: string;
  pid?: number;
}

export class MCPServerManager extends EventEmitter {
  private servers = new Map<string, RunningServer>();
  private configPath: string;

  constructor() {
    super();
    this.configPath = path.join(process.cwd(), 'mcp-config.json');
  }

  async startServer(name: string, config: MCPServerConfig): Promise<boolean> {
    try {
      console.log(`🚀 Starting MCP server: ${name}`);
      console.log(`   Command: ${config.command} ${config.args?.join(' ') || ''}`);

      // Spawn the MCP server process
      const serverProcess = spawn(config.command, config.args || [], {
        env: { ...process.env, ...config.env },
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      });

      const runningServer: RunningServer = {
        name,
        process: serverProcess,
        config,
        status: 'starting',
        startTime: new Date(),
        pid: serverProcess.pid
      };

      this.servers.set(name, runningServer);

      // Handle process events
      serverProcess.on('spawn', () => {
        console.log(`✅ MCP server ${name} spawned with PID: ${serverProcess.pid}`);
        runningServer.status = 'running';
        this.emit('serverStarted', name);
      });

      serverProcess.on('error', (error) => {
        console.error(`❌ MCP server ${name} error:`, error.message);
        runningServer.status = 'error';
        runningServer.lastError = error.message;
        this.emit('serverError', name, error);
      });

      serverProcess.on('exit', (code, signal) => {
        console.log(`🛑 MCP server ${name} exited with code ${code}, signal ${signal}`);
        runningServer.status = 'stopped';
        this.servers.delete(name);
        this.emit('serverStopped', name, code, signal);
      });

      // Handle stdout/stderr
      serverProcess.stdout?.on('data', (data) => {
        console.log(`[${name}] ${data.toString().trim()}`);
      });

      serverProcess.stderr?.on('data', (data) => {
        console.error(`[${name}] ERROR: ${data.toString().trim()}`);
      });

      return true;
    } catch (error) {
      console.error(`Failed to start MCP server ${name}:`, error);
      return false;
    }
  }

  async stopServer(name: string): Promise<boolean> {
    const server = this.servers.get(name);
    if (!server) {
      console.log(`Server ${name} not found or already stopped`);
      return false;
    }

    try {
      console.log(`🛑 Stopping MCP server: ${name} (PID: ${server.pid})`);
      
      // Try graceful shutdown first
      server.process.kill('SIGTERM');
      
      // Force kill after 5 seconds if still running
      setTimeout(() => {
        if (this.servers.has(name)) {
          console.log(`Force killing MCP server: ${name}`);
          server.process.kill('SIGKILL');
        }
      }, 5000);

      return true;
    } catch (error) {
      console.error(`Error stopping server ${name}:`, error);
      return false;
    }
  }

  async stopAllServers(): Promise<void> {
    console.log('🛑 Stopping all MCP servers...');
    const stopPromises = Array.from(this.servers.keys()).map(name => this.stopServer(name));
    await Promise.all(stopPromises);
  }

  async loadAndStartServers(): Promise<void> {
    try {
      if (!fs.existsSync(this.configPath)) {
        console.log('No MCP configuration file found');
        return;
      }

      const configData = fs.readFileSync(this.configPath, 'utf8');
      const config = JSON.parse(configData);
      
      if (!config.mcpServers) {
        console.log('No MCP servers configured');
        return;
      }

      console.log('📋 Loading MCP server configuration...');
      
      for (const [name, serverConfig] of Object.entries(config.mcpServers)) {
        await this.startServer(name, serverConfig as MCPServerConfig);
        // Small delay between server starts
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (error) {
      console.error('Error loading MCP configuration:', error);
    }
  }

  getServerStatus(): Record<string, any> {
    const status: Record<string, any> = {};
    
    this.servers.forEach((server, name) => {
      status[name] = {
        status: server.status,
        pid: server.pid,
        startTime: server.startTime.toISOString(),
        uptime: Date.now() - server.startTime.getTime(),
        lastError: server.lastError,
        command: `${server.config.command} ${server.config.args?.join(' ') || ''}`
      };
    });

    return status;
  }

  getRunningServerCount(): number {
    return Array.from(this.servers.values()).filter(s => s.status === 'running').length;
  }

  isServerRunning(name: string): boolean {
    const server = this.servers.get(name);
    return server?.status === 'running';
  }
}

// Global instance
export const mcpServerManager = new MCPServerManager();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down MCP servers...');
  await mcpServerManager.stopAllServers();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down MCP servers...');
  await mcpServerManager.stopAllServers();
  process.exit(0);
});