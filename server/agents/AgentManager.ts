import { EventEmitter } from 'events';
import { WebSocket } from 'ws';
import { db } from '../db';
import { chatSessions, chatMessages, mcpExecutions } from '../../shared/schema';
import OpenAI from 'openai';

export interface AgentConfig {
  id: string;
  name: string;
  role: string;
  model: string;
  provider: 'openai' | 'openrouter';
  capabilities: string[];
  mcpTools: string[];
}

export interface AgentTask {
  id: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  data: any;
  assignedAgent?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface AgentMessage {
  from: string;
  to: string;
  type: 'task' | 'result' | 'status' | 'broadcast';
  data: any;
  timestamp: Date;
}

export class AgentManager extends EventEmitter {
  private agents: Map<string, AgentConfig> = new Map();
  private tasks: Map<string, AgentTask> = new Map();
  private wsConnections: Map<string, WebSocket> = new Map();
  private openai: OpenAI;
  private openrouter: any;

  constructor() {
    super();
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.initializeAgents();
  }

  private initializeAgents() {
    // Agent 1: Bristol Master Agent (Primary Interface)
    this.registerAgent({
      id: 'bristol-master',
      name: 'Bristol Master Agent',
      role: 'Primary user interface and task orchestrator',
      model: 'gpt-4o', // Using gpt-4o as the newest OpenAI model
      provider: 'openai',
      capabilities: [
        'user_interaction',
        'task_orchestration',
        'result_compilation',
        'decision_making',
        'client_communication'
      ],
      mcpTools: ['query_bristol_data', 'store_memory', 'search_memory']
    });

    // Agent 2: Data Processing Agent (Background Worker)
    this.registerAgent({
      id: 'data-processor',
      name: 'Data Processing Agent',
      role: 'Data collection and processing specialist',
      model: 'gpt-4o',
      provider: 'openai',
      capabilities: [
        'api_integration',
        'data_processing',
        'demographic_analysis',
        'market_data_collection',
        'data_validation'
      ],
      mcpTools: ['get_employment_data', 'get_housing_data', 'get_climate_data', 'fetch_neighborhood_data']
    });

    // Agent 3: Financial Analysis Agent (Investment Modeling)
    this.registerAgent({
      id: 'financial-analyst',
      name: 'Financial Analysis Agent',
      role: 'Real estate financial modeling and investment analysis',
      model: 'claude-3-5-sonnet-20241022',
      provider: 'openrouter',
      capabilities: [
        'irr_calculation',
        'npv_analysis',
        'cap_rate_modeling',
        'deal_structuring',
        'risk_assessment',
        'cash_flow_analysis'
      ],
      mcpTools: ['sequential_property_analysis', 'comparative_market_analysis']
    });

    // Agent 4: Market Intelligence Agent (Competitive Analysis)
    this.registerAgent({
      id: 'market-intelligence',
      name: 'Market Intelligence Agent',
      role: 'Market research and competitive analysis',
      model: 'google/gemini-2.0-flash-exp',
      provider: 'openrouter',
      capabilities: [
        'comparable_analysis',
        'market_trend_analysis',
        'competitive_intelligence',
        'bristol_scoring',
        'risk_evaluation'
      ],
      mcpTools: ['get_crime_statistics', 'get_foursquare_poi', 'fetch_property_value']
    });

    // Agent 5: Lead Management Agent (CRM & Client Relations)
    this.registerAgent({
      id: 'lead-manager',
      name: 'Lead Management Agent',
      role: 'Client relationship and lead pipeline management',
      model: 'perplexity/llama-3.1-sonar-large-128k-online',
      provider: 'openrouter',
      capabilities: [
        'lead_qualification',
        'client_tracking',
        'pipeline_management',
        'follow_up_scheduling',
        'preference_analysis'
      ],
      mcpTools: ['store_lead_info', 'schedule_property_showing', 'track_closing_deadlines']
    });
  }

  private registerAgent(config: AgentConfig) {
    this.agents.set(config.id, config);
    console.log(`🤖 Registered agent: ${config.name} (${config.model})`);
  }

  // Task Management
  public createTask(type: string, data: any, priority: AgentTask['priority'] = 'medium'): string {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const task: AgentTask = {
      id: taskId,
      type,
      priority,
      data,
      status: 'pending',
      createdAt: new Date()
    };

    this.tasks.set(taskId, task);
    this.assignTask(task);
    
    return taskId;
  }

  private assignTask(task: AgentTask) {
    // Task assignment logic based on capabilities
    const agentId = this.selectBestAgent(task.type);
    
    if (agentId) {
      task.assignedAgent = agentId;
      task.status = 'processing';
      this.executeAgentTask(agentId, task);
    } else {
      console.error(`No suitable agent found for task type: ${task.type}`);
    }
  }

  private selectBestAgent(taskType: string): string | null {
    const taskAgentMap: Record<string, string> = {
      'property_analysis': 'financial-analyst',
      'market_research': 'market-intelligence', 
      'data_collection': 'data-processor',
      'lead_management': 'lead-manager',
      'client_interaction': 'bristol-master',
      'financial_modeling': 'financial-analyst',
      'demographic_analysis': 'data-processor',
      'competitive_analysis': 'market-intelligence',
      'deal_structuring': 'financial-analyst'
    };

    return taskAgentMap[taskType] || 'bristol-master';
  }

  // Agent Execution Engine
  private async executeAgentTask(agentId: string, task: AgentTask) {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    try {
      console.log(`🚀 Executing task ${task.id} with ${agent.name}`);
      
      let result;
      if (agent.provider === 'openai') {
        result = await this.executeOpenAITask(agent, task);
      } else {
        result = await this.executeOpenRouterTask(agent, task);
      }

      // Update task status
      task.status = 'completed';
      task.result = result;
      task.completedAt = new Date();

      // Log execution to database
      await this.logExecution(agentId, task, true, undefined);

      // Broadcast result to connected clients
      this.broadcastTaskResult(task);

    } catch (error) {
      console.error(`❌ Agent ${agentId} task failed:`, error);
      
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : String(error);
      task.completedAt = new Date();

      await this.logExecution(agentId, task, false, error instanceof Error ? error.message : String(error));
      this.broadcastTaskResult(task);
    }
  }

  private async executeOpenAITask(agent: AgentConfig, task: AgentTask) {
    const systemPrompt = this.generateSystemPrompt(agent, task);
    
    const response = await this.openai.chat.completions.create({
      model: agent.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(task.data) }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    return {
      content: response.choices[0].message.content,
      model: agent.model,
      agentId: agent.id,
      executionTime: Date.now() - task.createdAt.getTime()
    };
  }

  private async executeOpenRouterTask(agent: AgentConfig, task: AgentTask) {
    // OpenRouter implementation - using fetch to their API
    const systemPrompt = this.generateSystemPrompt(agent, task);
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://bristol.dev',
        'X-Title': 'Bristol Development Platform'
      },
      body: JSON.stringify({
        model: agent.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: JSON.stringify(task.data) }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      model: agent.model,
      agentId: agent.id,
      executionTime: Date.now() - task.createdAt.getTime()
    };
  }

  private generateSystemPrompt(agent: AgentConfig, task: AgentTask): string {
    const basePrompt = `You are the ${agent.name}, a specialized AI agent in the Bristol Development Group intelligence platform.

ROLE: ${agent.role}

CAPABILITIES: ${agent.capabilities.join(', ')}

AVAILABLE MCP TOOLS: ${agent.mcpTools.join(', ')}

TASK TYPE: ${task.type}

INSTRUCTIONS:
- You are part of a multi-agent system working on real estate analysis
- Provide detailed, actionable insights specific to your expertise area
- Include confidence scores and risk assessments where applicable
- Format responses in structured JSON for easy processing
- Focus on delivering institutional-quality analysis

BRISTOL CONTEXT:
- You work for Bristol Development Group, a multifamily real estate developer
- Target markets: Sunbelt regions with population growth
- Investment criteria: IRR >15%, stabilized cap rates 5-7%
- Deal sizes: $10M-$100M multifamily acquisitions and developments`;

    return basePrompt;
  }

  // Communication & Broadcasting
  public addWebSocketConnection(clientId: string, ws: WebSocket) {
    this.wsConnections.set(clientId, ws);
    
    ws.on('close', () => {
      this.wsConnections.delete(clientId);
    });

    // Send agent status on connection
    this.sendAgentStatus(clientId);
  }

  private broadcastTaskResult(task: AgentTask) {
    const message = {
      type: 'task_completed',
      taskId: task.id,
      agentId: task.assignedAgent,
      status: task.status,
      result: task.result,
      error: task.error,
      timestamp: new Date()
    };

    this.wsConnections.forEach((ws, clientId) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }

  private sendAgentStatus(clientId: string) {
    const ws = this.wsConnections.get(clientId);
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    const agentStatuses = Array.from(this.agents.values()).map(agent => ({
      id: agent.id,
      name: agent.name,
      role: agent.role,
      model: agent.model,
      provider: agent.provider,
      capabilities: agent.capabilities.length,
      status: 'active'
    }));

    ws.send(JSON.stringify({
      type: 'agent_status',
      agents: agentStatuses,
      timestamp: new Date()
    }));
  }

  // Database Operations
  private async logExecution(agentId: string, task: AgentTask, success: boolean, errorMessage?: string) {
    try {
      await db.insert(mcpExecutions).values({
        toolName: task.type,
        serverName: agentId,
        parameters: task.data,
        result: task.result,
        success,
        errorMessage,
        executionTime: task.completedAt ? 
          task.completedAt.getTime() - task.createdAt.getTime() : undefined,
        userId: 'demo-user' // TODO: Get from session
      });
    } catch (error) {
      console.error('Failed to log execution:', error);
    }
  }

  // Public API
  public getAgents(): AgentConfig[] {
    return Array.from(this.agents.values());
  }

  public getTaskStatus(taskId: string): AgentTask | undefined {
    return this.tasks.get(taskId);
  }

  public getAllTasks(): AgentTask[] {
    return Array.from(this.tasks.values());
  }

  // Multi-Agent Coordination
  public async orchestratePropertyAnalysis(propertyData: any): Promise<string[]> {
    const tasks = [
      this.createTask('data_collection', { property: propertyData, sources: ['demographics', 'market', 'crime'] }, 'high'),
      this.createTask('financial_modeling', { property: propertyData, analysisType: 'comprehensive' }, 'high'),
      this.createTask('competitive_analysis', { property: propertyData, radius: '5mi' }, 'medium'),
      this.createTask('market_research', { property: propertyData, timeframe: '5years' }, 'medium')
    ];

    console.log(`🎯 Orchestrated property analysis with ${tasks.length} parallel tasks`);
    return tasks;
  }
}

// Singleton instance
export const agentManager = new AgentManager();