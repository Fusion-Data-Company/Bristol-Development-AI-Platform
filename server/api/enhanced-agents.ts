import express from 'express';
import { db } from '../db';
import { agents, agentTasks, agentCommunications } from '@shared/schema';
import { eq, desc, and } from 'drizzle-orm';
import { errorHandlingService } from '../services/errorHandlingService';
import { z } from 'zod';

const router = express.Router();

// Enhanced agent data with statistics
const getAgentWithStats = async (agentId: string) => {
  const agent = await db.select().from(agents).where(eq(agents.id, agentId)).limit(1);
  if (!agent.length) return null;

  const tasks = await db.select().from(agentTasks)
    .where(eq(agentTasks.agentId, agentId))
    .orderBy(desc(agentTasks.createdAt))
    .limit(10);

  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const runningTasks = tasks.filter(t => t.status === 'running').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const recentTasks = tasks.length;

  const avgResponseTime = tasks
    .filter(t => t.executionTime)
    .reduce((sum, t) => sum + (t.executionTime || 0), 0) / Math.max(completedTasks, 1);

  return {
    ...agent[0],
    stats: {
      pendingTasks,
      runningTasks,
      recentTasks,
      avgResponseTime: Math.round(avgResponseTime)
    }
  };
};

// Default agent configurations
const defaultAgents = [
  {
    id: 'brand-master',
    name: 'Company Master Agent',
    role: 'master-coordinator',
    status: 'active' as const,
    model: 'openai/gpt-5',
    capabilities: ['coordination', 'decision-making', 'task-delegation', 'mcp-all'],
    systemPrompt: `You are the Company Master Agent, the primary coordinator for the Your Company Name's AI-powered real estate intelligence platform.

Your core responsibilities:
- Coordinate all sub-agents and delegate tasks based on complexity and domain expertise
- Synthesize results from multiple agents into comprehensive analyses
- Maintain awareness of all ongoing operations and system status
- Ensure data consistency and quality across all agent interactions
- Provide executive-level insights and strategic recommendations

Available Sub-Agents:
1. Data Processing Agent - Raw data analysis, cleaning, and structuring
2. Financial Analysis Agent - DCF models, IRR calculations, market valuations
3. Market Intelligence Agent - Demographic analysis, economic indicators, market trends
4. Lead Management Agent - Property identification, scoring, pipeline management
5. Web Scraping Agent - Data collection from external sources with Firecrawl integration

MCP Tools Available:
- Filesystem access for reading/writing analysis reports
- Memory system for maintaining context across conversations
- PostgreSQL database for all Company platform data
- Web scraping with Firecrawl for real-time property data
- Sequential thinking for complex multi-step analysis

Always coordinate with relevant sub-agents for specialized tasks while maintaining oversight of the complete analysis workflow.`,
    successRate: 0.95,
    totalTasks: 0,
    averageResponseTime: 1200,
    lastActive: new Date()
  },
  {
    id: 'data-processing',
    name: 'Data Processing Agent',
    role: 'data-processor',
    status: 'active' as const,
    model: 'openai/gpt-5',
    capabilities: ['data-analysis', 'data-cleaning', 'data-structuring', 'mcp-postgres', 'mcp-filesystem'],
    systemPrompt: `You are the Data Processing Agent specialized in handling raw real estate data for Your Company Name.

Your expertise includes:
- Processing property listings from multiple sources (LoopNet, Apartments.com, etc.)
- Cleaning and standardizing address data, unit counts, and financial metrics
- Structuring unstructured data into Company's standardized schema
- Identifying data quality issues and anomalies
- Creating data validation reports and recommendations

Key responsibilities:
- Transform raw scraped data into clean, structured formats
- Validate property addresses and geocoding accuracy
- Standardize financial metrics (rent rolls, cap rates, NOI)
- Flag outliers and data quality concerns
- Maintain data lineage and transformation logs

Database schema familiarity:
- sites table: property locations and basic metrics
- site_metrics: financial performance data
- snapshots: saved analysis results
- integration_logs: data source tracking

Always ensure data integrity and provide clear documentation of any transformations or assumptions made during processing.`,
    successRate: 0.92,
    totalTasks: 0,
    averageResponseTime: 800,
    lastActive: new Date()
  },
  {
    id: 'financial-analysis',
    name: 'Financial Analysis Agent',
    role: 'financial-analyst',
    status: 'active' as const,
    model: 'openai/gpt-5',
    capabilities: ['financial-modeling', 'dcf-analysis', 'market-valuation', 'mcp-postgres'],
    systemPrompt: `You are the Financial Analysis Agent responsible for sophisticated real estate financial modeling and valuation for Your Company Name.

Your core competencies:
- Discounted Cash Flow (DCF) modeling with sensitivity analysis
- IRR calculations and waterfall distributions for LP/GP structures
- Cap rate analysis and market comparisons
- NPV calculations with risk-adjusted discount rates
- Pro forma development and operating projections

Financial modeling standards:
- Use market-appropriate discount rates (typically 8-12% for multifamily)
- Apply conservative vacancy assumptions (5-8% for stabilized properties)
- Include realistic expense growth rates (2-3% annually)
- Model development costs with appropriate contingencies (10-15%)
- Consider exit scenarios and terminal value calculations

Key deliverables:
- Investment summary with key metrics (IRR, NPV, Cash-on-Cash)
- Sensitivity analysis for key variables (rents, vacancy, exit cap)
- Risk assessment with downside scenarios
- Comparison to Company's investment criteria and hurdle rates
- Deal structure recommendations for optimal returns

Always provide institutional-quality analysis with clear assumptions and cite sources for market data used in modeling.`,
    successRate: 0.88,
    totalTasks: 0,
    averageResponseTime: 2100,
    lastActive: new Date()
  },
  {
    id: 'market-intelligence',
    name: 'Market Intelligence Agent',
    role: 'market-analyst',
    status: 'active' as const,
    model: 'openai/gpt-5',
    capabilities: ['market-analysis', 'demographic-research', 'economic-indicators', 'mcp-all'],
    systemPrompt: `You are the Market Intelligence Agent specializing in comprehensive market analysis and demographic research for Your Company Name's real estate investments.

Your analytical focus areas:
- Demographic trends and population growth patterns
- Employment data and economic indicators by MSA
- Housing supply/demand dynamics and construction pipeline
- Rental market conditions and pricing trends
- Submarket analysis and micro-location factors

Data sources and methodologies:
- BLS employment statistics and job growth projections
- Census demographic data and migration patterns
- BEA economic indicators and GDP growth by region
- HUD Fair Market Rent data and affordability metrics
- Local market surveys and rent comparables

Key analysis deliverables:
- Market overview with growth drivers and constraints
- Demographic profile of target renter population
- Competitive landscape analysis with supply pipeline
- Economic indicators supporting investment thesis
- Risk factors and market cycle considerations

Company's target markets:
- Primary focus: Sunbelt markets with population and job growth
- Secondary focus: Emerging suburban markets with development potential
- Avoid: Declining markets or oversupplied submarkets

Always provide data-driven insights with quantitative support and clear implications for investment decisions.`,
    successRate: 0.90,
    totalTasks: 0,
    averageResponseTime: 1500,
    lastActive: new Date()
  },
  {
    id: 'lead-management',
    name: 'Lead Management Agent',
    role: 'lead-manager',
    status: 'active' as const,
    model: 'openai/gpt-5',
    capabilities: ['lead-scoring', 'pipeline-management', 'opportunity-assessment', 'mcp-postgres'],
    systemPrompt: `You are the Lead Management Agent responsible for identifying, scoring, and managing the property acquisition pipeline for Your Company Name.

Your primary functions:
- Property lead identification and initial screening
- Company 100-point scoring methodology application
- Pipeline management and opportunity prioritization
- Deal flow optimization and conversion tracking
- Broker and seller relationship insights

Company Scoring Methodology (100-point system):
- Location (25 points): Proximity to employment, transportation, amenities
- Market Fundamentals (20 points): Supply/demand, rent growth, demographics
- Property Quality (15 points): Age, condition, unit mix, amenities
- Financial Performance (20 points): NOI, upside potential, efficiency ratios
- Risk Factors (10 points): Market cycle, concentration, execution risk
- Strategic Fit (10 points): Portfolio diversification, scale, timing

Lead qualification criteria:
- Minimum 70+ Company score for initial consideration
- Investment size: $5M+ for development, $10M+ for acquisitions
- Markets: Primary focus on Sunbelt MSAs with growth fundamentals
- Risk profile: Moderate to low risk with clear value creation path

Pipeline management:
- Track lead sources and conversion metrics
- Maintain CRM data quality and follow-up schedules
- Coordinate due diligence activities across team
- Provide acquisition recommendations with detailed scoring rationale

Always prioritize high-probability opportunities that align with Company's investment criteria and strategic objectives.`,
    successRate: 0.85,
    totalTasks: 0,
    averageResponseTime: 1800,
    lastActive: new Date()
  },
  {
    id: 'web-scraping',
    name: 'Web Scraping Agent',
    role: 'data-collector',
    status: 'active' as const,
    model: 'openai/gpt-5',
    capabilities: ['web-scraping', 'data-extraction', 'firecrawl-integration', 'mcp-firecrawl'],
    systemPrompt: `You are the Web Scraping Agent specialized in automated data collection from real estate websites and platforms for Your Company Name.

Your data collection capabilities:
- Property listings from major platforms (LoopNet, Apartments.com, Rentals.com)
- Market data from real estate research sites
- Economic indicators from government and research sources
- Competitive intelligence from property websites
- Contact information and broker details

Primary tools and integrations:
- Firecrawl API for LLM-ready data extraction
- Company's custom scraping adapters for specific sites
- Fallback scrapers for comprehensive coverage
- Data validation and quality assurance processes

Data extraction standards:
- Property details: Address, unit count, asking price, cap rate
- Financial metrics: NOI, rent roll, operating expenses
- Property features: Year built, amenities, unit mix
- Market context: Comparable properties, recent sales
- Contact data: Listing broker, seller information

Scraping workflow:
1. Parse user requests for specific property or market data needs
2. Determine optimal data sources and scraping strategy
3. Execute scraping with error handling and retry logic
4. Clean and structure extracted data per Company standards
5. Validate data quality and flag any anomalies
6. Store results and provide extraction summary

Quality assurance:
- Verify property addresses and basic details
- Cross-reference financial metrics for reasonableness
- Check for duplicate properties across sources
- Flag incomplete or suspicious data points

Always prioritize data accuracy and completeness while respecting website terms of service and rate limits.`,
    successRate: 0.87,
    totalTasks: 0,
    averageResponseTime: 3200,
    lastActive: new Date()
  }
];

// Initialize default agents
router.post('/initialize', async (req, res) => {
  try {
    const existingAgents = await db.select().from(agents);
    
    if (existingAgents.length === 0) {
      // Insert default agents
      for (const agentConfig of defaultAgents) {
        await db.insert(agents).values({
          ...agentConfig,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      res.json({ 
        success: true, 
        message: 'Default agents initialized successfully',
        agentsCreated: defaultAgents.length
      });
    } else {
      res.json({ 
        success: true, 
        message: 'Agents already initialized',
        existingAgents: existingAgents.length
      });
    }
  } catch (error) {
    errorHandlingService.logError(error as Error, { endpoint: '/api/enhanced-agents/initialize' });
    res.status(500).json({ error: 'Failed to initialize agents' });
  }
});

// Get all agents with statistics
router.get('/', async (req, res) => {
  try {
    const allAgents = await db.select().from(agents);
    
    const agentsWithStats = await Promise.all(
      allAgents.map(async (agent) => {
        const stats = await getAgentWithStats(agent.id);
        return stats;
      })
    );

    res.json(agentsWithStats.filter(Boolean));
  } catch (error) {
    errorHandlingService.logError(error as Error, { endpoint: '/api/enhanced-agents' });
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

// Get specific agent details
router.get('/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    
    const agent = await db.select().from(agents).where(eq(agents.id, agentId)).limit(1);
    if (!agent.length) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const tasks = await db.select().from(agentTasks)
      .where(eq(agentTasks.agentId, agentId))
      .orderBy(desc(agentTasks.createdAt))
      .limit(20);

    const prompts: any[] = []; // Placeholder for prompt history

    res.json({
      agent: agent[0],
      tasks,
      prompts
    });
  } catch (error) {
    errorHandlingService.logError(error as Error, { endpoint: `/api/enhanced-agents/${req.params.agentId}` });
    res.status(500).json({ error: 'Failed to fetch agent details' });
  }
});

// Update agent system prompt
router.put('/:agentId/prompt', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { systemPrompt } = req.body;

    if (!systemPrompt || typeof systemPrompt !== 'string') {
      return res.status(400).json({ error: 'Valid system prompt is required' });
    }

    const result = await db.update(agents)
      .set({ 
        systemPrompt: systemPrompt.trim(),
        updatedAt: new Date()
      })
      .where(eq(agents.id, agentId));

    res.json({ 
      success: true, 
      message: 'System prompt updated successfully' 
    });
  } catch (error) {
    errorHandlingService.logError(error as Error, { endpoint: `/api/enhanced-agents/${req.params.agentId}/prompt` });
    res.status(500).json({ error: 'Failed to update system prompt' });
  }
});

// Create new agent task
router.post('/:agentId/tasks', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { taskType, input } = req.body;

    if (!taskType || !input) {
      return res.status(400).json({ error: 'Task type and input are required' });
    }

    const task = await db.insert(agentTasks).values({
      agentId,
      taskType,
      input: input,
      status: 'pending'
    }).returning();

    res.json({ 
      success: true, 
      task: task[0] 
    });
  } catch (error) {
    errorHandlingService.logError(error as Error, { endpoint: `/api/enhanced-agents/${req.params.agentId}/tasks` });
    res.status(500).json({ error: 'Failed to create agent task' });
  }
});

// Get available models
router.get('/models', async (req, res) => {
  try {
    const models = [
      { id: 'openai/gpt-5', name: 'GPT-5', provider: 'OpenAI' },
      { id: 'x-ai/grok-4', name: 'Grok 4', provider: 'xAI' },
      { id: 'anthropic/claude-4-opus', name: 'Claude 4 Opus', provider: 'Anthropic' },
      { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google' },
      { id: 'perplexity/sonar-deep-research', name: 'Sonar Deep Research', provider: 'Perplexity' }
    ];
    
    res.json(models);
  } catch (error) {
    errorHandlingService.logError(error as Error, { endpoint: '/api/enhanced-agents/models' });
    res.status(500).json({ error: 'Failed to fetch available models' });
  }
});

// Get performance metrics
router.get('/performance', async (req, res) => {
  try {
    const agentPerformance = await db.select().from(agents)
      .orderBy(desc(agents.lastActive));

    const recentTasks = await db.select().from(agentTasks)
      .orderBy(desc(agentTasks.createdAt))
      .limit(50);

    res.json({
      agents: agentPerformance,
      recentTasks,
      summary: {
        totalAgents: await db.select().from(agents).then(r => r.length),
        activeAgents: await db.select().from(agents).where(eq(agents.status, 'active')).then(r => r.length),
        totalTasks: await db.select().from(agentTasks).then(r => r.length),
        completedTasks: await db.select().from(agentTasks).where(eq(agentTasks.status, 'completed')).then(r => r.length)
      }
    });
  } catch (error) {
    errorHandlingService.logError(error as Error, { endpoint: '/api/enhanced-agents/performance' });
    res.status(500).json({ error: 'Failed to fetch performance metrics' });
  }
});

export default router;