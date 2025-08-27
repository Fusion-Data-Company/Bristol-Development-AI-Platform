import { EventEmitter } from 'events';
import { WebSocket } from 'ws';
import { db } from '../db';
import { chatSessions, chatMessages, mcpExecutions } from '../../shared/schema';
import OpenAI from 'openai';
import { WebSocketService } from '../services/websocketService';

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
    // Agent 1: Company Master Agent (Primary Interface)
    this.registerAgent({
      id: 'brand-master',
      name: 'Company Master Agent',
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
      mcpTools: ['query_company_data', 'store_memory', 'search_memory']
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
      model: 'anthropic/claude-3.5-sonnet',
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
      model: 'google/gemini-pro-1.5',
      provider: 'openrouter',
      capabilities: [
        'comparable_analysis',
        'market_trend_analysis',
        'competitive_intelligence',
        'company_scoring',
        'risk_evaluation'
      ],
      mcpTools: ['get_crime_statistics', 'get_foursquare_poi', 'fetch_property_value']
    });

    // Agent 5: Lead Management Agent (CRM & Client Relations)
    this.registerAgent({
      id: 'lead-manager',
      name: 'Lead Management Agent',
      role: 'Client relationship and lead pipeline management',
      model: 'gpt-4o-mini',
      provider: 'openai',
      capabilities: [
        'lead_qualification',
        'client_tracking',
        'pipeline_management',
        'follow_up_scheduling',
        'preference_analysis'
      ],
      mcpTools: ['store_lead_info', 'schedule_property_showing', 'track_closing_deadlines']
    });

    // Agent 6: Web Scraping Agent (Property Data Collection)
    this.registerAgent({
      id: 'scraping-agent',
      name: 'Web Scraping Agent',
      role: 'Automated property data collection and comparison analysis',
      model: 'gpt-4o',
      provider: 'openai',
      capabilities: [
        'web_scraping',
        'property_data_extraction',
        'comparable_property_analysis',
        'data_validation',
        'source_verification',
        'rate_limit_management'
      ],
      mcpTools: ['firecrawl_scrape', 'apify_scrape', 'fallback_scrape', 'validate_property_data']
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
      'client_interaction': 'brand-master',
      'financial_modeling': 'financial-analyst',
      'demographic_analysis': 'data-processor',
      'competitive_analysis': 'market-intelligence',
      'deal_structuring': 'financial-analyst',
      'scrape_property_data': 'scraping-agent',
      'scrape_comparables': 'scraping-agent',
      'property_data_extraction': 'scraping-agent',
      'web_scraping': 'scraping-agent'
    };

    return taskAgentMap[taskType] || 'brand-master';
  }

  // Agent Execution Engine with Company Development Industry Prompts
  private async executeAgentTask(agentId: string, task: AgentTask) {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    try {
      console.log(`🚀 Executing task ${task.id} with ${agent.name}`);
      
      let result;
      if (agent.id === 'scraping-agent') {
        result = await this.executeScrapingTask(agent, task);
      } else if (agent.provider === 'openai') {
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
    const systemPrompt = this.getCompanySystemPrompt(agent, task);
    
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
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 OpenRouter attempt ${attempt}/${maxRetries} for ${agent.name}`);
        
        const systemPrompt = this.getCompanySystemPrompt(agent, task);
        
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'X-Title': 'Company Site Intelligence Platform',
            'HTTP-Referer': 'https://brand-development.com',
            'X-Platform': 'replit'
          },
          body: JSON.stringify({
            model: agent.model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: this.formatCompanyTaskPrompt(agent, task) }
            ],
            max_tokens: 4000,
            temperature: 0.3,
            top_p: 0.9,
            frequency_penalty: 0.1,
            presence_penalty: 0.1
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`OpenRouter API error (attempt ${attempt}):`, response.status, errorText);
          
          if (response.status === 429) {
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            continue;
          }
          
          if (response.status === 401 || response.status === 403) {
            throw new Error(`OpenRouter authentication error: Check OPENROUTER_API_KEY`);
          }
          
          if (attempt === maxRetries) {
            throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
          }
          continue;
        }

        const data = await response.json();
        
        if (!data.choices || !data.choices[0]?.message?.content) {
          if (attempt === maxRetries) {
            throw new Error('OpenRouter returned empty response');
          }
          continue;
        }

        console.log(`✅ OpenRouter success for ${agent.name}`);
        return {
          content: data.choices[0].message.content,
          model: agent.model,
          agentId: agent.id,
          usage: data.usage,
          executionTime: Date.now() - task.createdAt.getTime(),
          timestamp: new Date().toISOString()
        };

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`❌ OpenRouter attempt ${attempt} failed:`, lastError.message);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw lastError || new Error('OpenRouter execution failed after all retries');
  }

  private getCompanySystemPrompt(agent: AgentConfig, task?: AgentTask): string {
    const agentSpecificPrompts = {
      'brand-master': `You are the Company Master Agent, the central orchestrator for Company Development Group's AI-powered real estate intelligence platform.

CORE IDENTITY: You are a Fortune 500-grade senior investment principal with 30+ years of institutional real estate experience, specifically focused on multifamily development in high-growth Sunbelt markets.

INSTITUTIONAL EXPERTISE:
• Complex capital stack structuring (LP/GP, preferred equity, mezzanine)
• IRR optimization across 15-25% target ranges
• Cap rate modeling for stabilized assets (5.0-7.5% target range)
• Risk-adjusted NPV calculations with sensitivity analysis
• Deal sizing: $10M-$500M multifamily acquisitions and ground-up developments

DECISION-MAKING AUTHORITY:
• Coordinate analysis across all specialized agents
• Synthesize multi-dimensional investment recommendations
• Override agent conclusions based on market experience
• Escalate high-risk scenarios requiring human intervention
• Apply Company's proprietary 100-point scoring methodology

COMMUNICATION STYLE: Executive-level briefings with precise financial metrics, risk assessments, and actionable investment recommendations.`,

      'data-processor': `You are the Data Processing Agent for Company Development Group, specializing in demographic and economic analysis for multifamily real estate investments.

CORE SPECIALIZATION: Transform raw demographic, economic, and market data into actionable investment intelligence for Sunbelt multifamily developments.

ANALYSIS FRAMEWORKS:
• Population growth trends (target: 2%+ annual growth)
• Employment diversity and wage growth analysis
• Housing supply/demand imbalances
• Migration patterns from high-cost coastal markets
• Household formation rates and rental demand drivers

DATA SOURCES EXPERTISE:
• Census Bureau ACS and population estimates
• Bureau of Labor Statistics employment data
• Bureau of Economic Analysis regional GDP/income
• HUD Fair Market Rent and vacancy surveys
• Local permitting and zoning databases

DELIVERABLES:
• Market fundamentals scorecards (1-100 scale)
• Demographic risk assessments with confidence intervals
• Rental demand projections with seasonal adjustments
• Competitive supply pipeline analysis

OUTPUT FORMAT: Structured data tables with executive summaries highlighting investment-critical metrics.`,

      'financial-analyst': `You are the Financial Analysis Agent for Company Development Group, the institutional-grade financial modeling specialist for multifamily real estate investments.

CORE EXPERTISE: Complex financial modeling, deal structuring, and investment analysis at institutional standards comparable to major REITs and private equity firms.

FINANCIAL MODELING CAPABILITIES:
• 10-year DCF models with multiple exit scenarios
• IRR waterfall calculations for complex capital structures
• Sensitivity analysis across 50+ variables
• Stress testing for recession/downturn scenarios
• LP/GP return optimization and promote structures

COMPANY INVESTMENT CRITERIA:
• Target IRR: 15-25% depending on risk profile
• Stabilized cap rates: 5.0-7.5% for core/core-plus assets
• Minimum equity multiples: 1.8x for core, 2.5x+ for value-add
• Maximum LTV: 75% acquisition, 80% development
• Minimum deal size: $10M (sweet spot: $25-100M)

RISK ASSESSMENT PROTOCOLS:
• Market risk (demand, supply, competition)
• Execution risk (construction, lease-up, management)
• Capital market risk (refinancing, exit environment)
• Regulatory risk (rent control, zoning changes)

DELIVERABLES: Investment committee-ready financial packages with executive summaries, detailed models, and risk-adjusted recommendations.`,

      'market-intelligence': `You are the Market Intelligence Agent for Company Development Group, specializing in competitive analysis and market positioning for multifamily investments.

CORE FUNCTION: Conduct institutional-grade market research and competitive intelligence to identify optimal investment opportunities and risk factors in Sunbelt multifamily markets.

COMPETITIVE ANALYSIS EXPERTISE:
• Comparable property analysis (rent, occupancy, amenities)
• Developer/operator competitive positioning
• Market share analysis by major players
• Pipeline supply analysis (12-36 month forward-looking)
• Absorption rate projections and leasing velocity

COMPANY SCORING METHODOLOGY:
• Location Quality (0-25 points): Transit, employment centers, amenities
• Market Fundamentals (0-25 points): Growth, supply/demand, employment
• Property Quality (0-25 points): Age, condition, amenity package
• Financial Metrics (0-25 points): Rent growth, NOI potential, exit value

MARKET INTELLIGENCE SOURCES:
• CoStar/RealPage market reports
• Local brokerage market surveys
• Municipal planning and zoning data
• Major employer expansion/contraction announcements
• Transportation and infrastructure development plans

RISK IDENTIFICATION:
• Oversupply warnings (>15% annual delivery vs. absorption)
• Major tenant/employer concentration risks
• Regulatory climate changes affecting multifamily
• Infrastructure/transportation disruptions

OUTPUT: Comprehensive market reports with investment recommendations and risk ratings.`,

      'lead-manager': `You are the Lead Management Agent for Company Development Group, responsible for investor relations, deal sourcing, and capital raising activities.

CORE MISSION: Optimize investor engagement, qualify investment opportunities, and manage the deal pipeline to maximize Company's capital deployment efficiency.

INVESTOR RELATIONS EXPERTISE:
• Institutional investor preferences and allocation strategies
• Family office investment criteria and decision-making processes
• High-net-worth individual risk tolerances and return expectations
• Fund marketing and capital raising best practices

DEAL SOURCING & QUALIFICATION:
• Broker relationship management and deal flow optimization
• Off-market opportunity identification and evaluation
• Letter of intent (LOI) negotiation strategies
• Due diligence coordination and timeline management

CAPITAL STACK OPTIMIZATION:
• LP/GP structure recommendations based on investor preferences
• Preferred equity and mezzanine financing strategies
• Joint venture partnership structuring
• Exit strategy alignment with investor goals

CRM & PIPELINE MANAGEMENT:
• Investor communication cadence and content optimization
• Deal pipeline tracking and probability-weighted projections
• Performance reporting and investor update scheduling
• Market intelligence sharing and relationship maintenance

COMPANY VALUE PROPOSITION:
• 30+ years of institutional multifamily experience
• Sunbelt market specialization with local expertise
• Technology-enhanced underwriting and asset management
• Proven track record of risk-adjusted returns

OUTPUT: Investor-ready materials, pipeline reports, and relationship management recommendations.`
    };

    const specificPrompt = agentSpecificPrompts[agent.id as keyof typeof agentSpecificPrompts] || agentSpecificPrompts['brand-master'];
    
    return `${specificPrompt}

CRITICAL OPERATIONAL REQUIREMENTS:
• Always format responses in structured JSON for system integration
• Include confidence scores (0-100) for all recommendations
• Provide executive summaries for C-level decision makers
• Flag high-risk scenarios requiring human review
• Reference Company's proprietary methodologies and investment criteria
• Maintain institutional-quality standards in all analysis

CURRENT TASK CONTEXT: ${task?.type || 'General Analysis'}
EXPECTED DELIVERABLE: Comprehensive analysis with actionable investment recommendations.`;
  }

  private formatCompanyTaskPrompt(agent: AgentConfig, task: AgentTask): string {
    const propertyData = task.data;
    
    return `COMPANY DEVELOPMENT GROUP - INVESTMENT ANALYSIS REQUEST

PROPERTY OVERVIEW:
- Property Name: ${propertyData.name || 'Unnamed Property'}
- Location: ${propertyData.address || 'Address TBD'}
- Unit Count: ${propertyData.units || 'TBD'} units
- Total Square Footage: ${propertyData.sqft ? propertyData.sqft.toLocaleString() : 'TBD'} sq ft
- Analysis Type: ${task.type}

AGENT-SPECIFIC REQUIREMENTS:
${this.getAgentSpecificRequirements(agent.id)}

COMPANY CONTEXT:
- Investment Committee Review: Next quarterly meeting
- Target Market: Sunbelt multifamily opportunities
- Capital Available: $50-500M for qualified deals
- Risk Tolerance: Core-plus to value-add strategies
- Timeline: 30-day preliminary analysis, 90-day final underwriting

DELIVERABLE FORMAT:
Provide a comprehensive JSON response with the following structure:
{
  "executiveSummary": "3-sentence investment recommendation",
  "analysis": {
    "keyFindings": ["Finding 1", "Finding 2", "Finding 3"],
    "riskFactors": ["Risk 1", "Risk 2", "Risk 3"],
    "opportunities": ["Opportunity 1", "Opportunity 2", "Opportunity 3"]
  },
  "recommendations": {
    "investmentDecision": "PROCEED/CAUTION/PASS",
    "confidenceScore": 85,
    "nextSteps": ["Action 1", "Action 2", "Action 3"]
  },
  "metrics": {
    "companyScore": 78,
    "riskRating": "MODERATE",
    "timeToMarket": "6-12 months"
  }
}

Begin your specialized analysis now.`;
  }

  private getAgentSpecificRequirements(agentId: string): string {
    const requirements = {
      'brand-master': 'Provide executive-level coordination and final investment recommendation synthesis',
      'data-processor': 'Focus on demographic trends, employment growth, and housing demand fundamentals',
      'financial-analyst': 'Deliver IRR analysis, cap rate projections, and detailed financial modeling',
      'market-intelligence': 'Analyze competitive landscape, market positioning, and Company scoring methodology',
      'lead-manager': 'Assess investor appeal, capital raising potential, and deal marketability'
    };
    
    return requirements[agentId as keyof typeof requirements] || requirements['brand-master'];
  }

  // Property Analysis Orchestration - FIXED WITH ENHANCED INDIVIDUAL OUTPUTS
  public async orchestratePropertyAnalysis(propertyData: any): Promise<string[]> {
    console.log('🎯 Orchestrated property analysis starting for:', propertyData.name);
    
    // Create specialized tasks for each agent type
    const tasks = [
      {
        type: 'demographic_analysis',
        agentId: 'data-processor',
        data: propertyData
      },
      {
        type: 'financial_modeling',
        agentId: 'financial-analyst', 
        data: propertyData
      },
      {
        type: 'competitive_analysis',
        agentId: 'market-intelligence',
        data: propertyData
      },
      {
        type: 'lead_management',
        agentId: 'lead-manager',
        data: propertyData
      }
    ];

    const taskIds: string[] = [];

    // Create and execute tasks with proper agent assignment
    for (const taskInfo of tasks) {
      const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const task: AgentTask = {
        id: taskId,
        type: taskInfo.type,
        priority: 'high',
        data: taskInfo.data,
        assignedAgent: taskInfo.agentId, // Explicitly assign agent
        status: 'processing',
        createdAt: new Date()
      };

      this.tasks.set(taskId, task);
      taskIds.push(taskId);

      // Execute immediately with assigned agent and FORCE individual output display
      console.log(`🚀 Executing task ${taskId} with ${this.agents.get(taskInfo.agentId)?.name}`);
      
      // Broadcast task start immediately to show in UI
      this.broadcastTaskStart(task);
      
      // Execute task
      this.executeAgentTask(taskInfo.agentId, task);
    }

    console.log(`🎯 Orchestrated property analysis with ${taskIds.length} parallel tasks`);
    return taskIds;
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

  private broadcastTaskStart(task: AgentTask) {
    const agent = this.agents.get(task.assignedAgent || '');
    
    const message = {
      type: 'task_started',
      task: {
        id: task.id,
        type: task.type,
        agentId: task.assignedAgent,
        agentName: agent?.name || task.assignedAgent,
        status: task.status,
        createdAt: task.createdAt,
        agent: agent ? {
          id: agent.id,
          name: agent.name,
          role: agent.role,
          model: agent.model,
          provider: agent.provider
        } : null
      }
    };

    console.log(`📡 Broadcasting task START for ${agent?.name}: ${task.type}`);

    this.wsConnections.forEach((ws, clientId) => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify(message));
          console.log(`✅ Sent task start to client ${clientId}`);
        } catch (error) {
          console.error(`❌ Failed to send task start to client ${clientId}:`, error);
          this.wsConnections.delete(clientId);
        }
      }
    });
    
    // Also emit for EventEmitter listeners
    this.emit('taskStarted', message);
  }

  private broadcastTaskResult(task: AgentTask) {
    const agent = this.agents.get(task.assignedAgent || '');
    
    const message = {
      type: 'task_completed',
      task: {
        id: task.id,
        type: task.type,
        agentId: task.assignedAgent,
        agentName: agent?.name || task.assignedAgent,
        status: task.status,
        result: task.result,
        error: task.error,
        completedAt: task.completedAt,
        agent: agent ? {
          id: agent.id,
          name: agent.name,
          role: agent.role,
          model: agent.model,
          provider: agent.provider
        } : null
      }
    };

    console.log(`📡 Broadcasting task RESULT for ${agent?.name}: ${task.status}`);
    console.log(`📊 Task result content:`, task.result ? String(task.result).substring(0, 100) + '...' : 'No result');

    this.wsConnections.forEach((ws, clientId) => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify(message));
          console.log(`✅ Sent task result to client ${clientId} - Result length: ${task.result?.length || 0}`);
        } catch (error) {
          console.error(`❌ Failed to send task result to client ${clientId}:`, error);
          this.wsConnections.delete(clientId);
        }
      }
    });

    // Also emit via EventEmitter for local listeners
    this.emit('taskCompleted', message);
    this.emit('taskStarted', message);
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

  getTask(taskId: string): AgentTask | undefined {
    return this.tasks.get(taskId);
  }

  getAgents(): AgentConfig[] {
    return Array.from(this.agents.values());
  }

  async getAllTasks(): Promise<AgentTask[]> {
    return Array.from(this.tasks.values());
  }

  // Scraping Agent Execution
  private async executeScrapingTask(agent: AgentConfig, task: AgentTask): Promise<any> {
    console.log(`🕸️ Executing scraping task: ${task.type}`);
    
    try {
      const { scrapeIntent } = task.data;
      
      if (!scrapeIntent) {
        throw new Error('No scrape intent provided for scraping task');
      }

      // Import and execute the scraper
      const { runScrapeAgent } = await import('../scrapers/agent');
      const scrapeResult = await runScrapeAgent(scrapeIntent);
      
      // Insert results into database
      const { randomUUID } = await import('crypto');
      const rows = (scrapeResult.records || []).map(r => ({
        ...r,
        id: randomUUID(),
        jobId: randomUUID(),
        scrapedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      if (rows.length > 0) {
        const { compsAnnex } = await import('../../shared/schema');
        const { db } = await import('../db');
        const { sql } = await import('drizzle-orm');

        // Map scraper results to compsAnnex schema
        const mappedRows = rows.map(r => ({
          id: r.id,
          source: r.source,
          sourceUrl: r.sourceUrl,
          name: r.name,
          address: r.address,
          city: r.city,
          state: r.state,
          zip: r.zip,
          assetType: r.assetType,
          units: r.units,
          yearBuilt: r.yearBuilt,
          rentPsf: r.rentPsf,
          rentPu: r.rentPu,
          occupancyPct: r.occupancyPct,
          concessionPct: r.concessionPct,
          amenityTags: r.amenityTags,
          notes: r.notes,
          canonicalAddress: r.canonicalAddress,
          unitPlan: r.unitPlan,
          scrapedAt: new Date(r.scrapedAt),
          jobId: r.jobId,
          createdAt: new Date(r.createdAt),
          updatedAt: new Date(r.updatedAt)
        }));

        await db.insert(compsAnnex).values(mappedRows).onConflictDoUpdate({
          target: [compsAnnex.canonicalAddress, compsAnnex.unitPlan],
          set: {
            rentPsf: sql`excluded.rent_psf`,
            rentPu: sql`excluded.rent_pu`,
            occupancyPct: sql`excluded.occupancy_pct`,
            concessionPct: sql`excluded.concession_pct`,
            amenityTags: sql`coalesce(excluded.amenity_tags, comps_annex.amenity_tags)`,
            source: sql`coalesce(excluded.source, comps_annex.source)`,
            sourceUrl: sql`coalesce(excluded.source_url, comps_annex.source_url)`,
            scrapedAt: sql`excluded.scraped_at`,
            jobId: sql`excluded.job_id`,
            updatedAt: sql`now()`
          }
        });
      }

      const result = {
        success: true,
        source: scrapeResult.source,
        inserted: rows.length,
        records: rows.slice(0, 5),
        caveats: scrapeResult.caveats || []
      };

      // Send success notification via WebSocket
      this.notifyTaskCompletion(task, result);

      return result;
    } catch (error) {
      console.error('Scraping task failed:', error);
      throw error;
    }
  }

  private notifyTaskCompletion(task: AgentTask, result: any) {
    try {
      // Format notification for WebSocket broadcast
      const notification = {
        type: 'task_completed',
        taskId: task.id,
        taskType: task.type,
        result: result,
        timestamp: new Date()
      };

      // Broadcast to all connected clients
      this.wsConnections.forEach((ws, clientId) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(notification));
        }
      });
    } catch (error) {
      console.error('Failed to notify task completion:', error);
    }
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
}

// Singleton instance
export const agentManager = new AgentManager();