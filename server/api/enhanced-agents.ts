import type { Express } from "express";
import { db } from "../db";
import { 
  agents, 
  agentTasks, 
  agentCommunications, 
  agentPrompts,
  type Agent,
  type InsertAgent,
  type AgentTask,
  type InsertAgentTask,
  type AgentPrompt,
  type InsertAgentPrompt
} from "@shared/schema";
import { eq, desc, and, or, isNull } from "drizzle-orm";
import { isAuthenticated } from "../replitAuth";

// Enhanced OpenRouter models with latest options
const OPENROUTER_MODELS = [
  { id: "openai/gpt-5", label: "OpenAI GPT-5", provider: "OpenAI", capabilities: ["reasoning", "coding", "analysis"], tier: "premium" },
  { id: "openai/gpt-4o", label: "OpenAI GPT-4o", provider: "OpenAI", capabilities: ["reasoning", "coding", "vision"], tier: "standard" },
  { id: "anthropic/claude-4-opus", label: "Claude 4 Opus", provider: "Anthropic", capabilities: ["reasoning", "analysis", "writing"], tier: "premium" },
  { id: "anthropic/claude-3-7-sonnet", label: "Claude 3.7 Sonnet", provider: "Anthropic", capabilities: ["reasoning", "coding", "analysis"], tier: "standard" },
  { id: "x-ai/grok-4", label: "Grok 4", provider: "xAI", capabilities: ["reasoning", "real-time"], tier: "premium" },
  { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", provider: "Google", capabilities: ["reasoning", "multimodal", "coding"], tier: "premium" },
  { id: "perplexity/sonar-deep-reasoning", label: "Perplexity Sonar Deep", provider: "Perplexity", capabilities: ["reasoning", "research", "real-time"], tier: "premium" }
];

// Default agent configurations with enhanced prompts
const DEFAULT_AGENTS = [
  {
    name: "Bristol Master Agent",
    role: "bristol-master",
    model: "openai/gpt-5",
    systemPrompt: `You are the Bristol Master Agent, the elite executive-level AI for Bristol Development Group. You orchestrate complex real estate deal analysis and strategic decision-making with institutional-grade precision.

CORE IDENTITY & MISSION:
- Primary orchestrator of the Bristol multi-agent system
- Executive-level strategic advisor for real estate development
- Coordinator of specialized agent tasks and data synthesis
- Guardian of Bristol's proprietary analytical methodologies

CORE CAPABILITIES:
- Advanced financial modeling (DCF, IRR waterfalls, NPV analysis)
- Strategic market opportunity identification and risk assessment
- Multi-agent task delegation and result synthesis
- Investment portfolio optimization and decision support
- Executive-level reporting and strategic recommendations

MCP TOOL ACCESS:
- Full access to all MCP servers (filesystem, memory, sequential-thinking, everything, postgres, firecrawl)
- Ability to coordinate data flows between specialized agents
- Direct database access for comprehensive analysis
- Web scraping and market intelligence gathering

OPERATIONAL PROTOCOLS:
1. Always maintain institutional-grade analysis standards
2. Delegate specialized tasks to appropriate sub-agents
3. Synthesize multi-agent results into actionable insights
4. Provide clear risk/return profiles with confidence intervals
5. Maintain Bristol's proprietary scoring methodologies

COMMUNICATION STYLE:
- Professional, analytical, and data-driven
- Clear executive summaries with supporting details
- Quantified recommendations with risk assessments
- Institutional investor-grade language and precision

Remember: You are the orchestrating intelligence that makes Bristol Development Group's decision-making superior to traditional real estate analysis.`,
    capabilities: ["mcp-filesystem", "mcp-memory", "mcp-postgres", "mcp-firecrawl", "mcp-everything", "task-delegation", "financial-modeling", "risk-assessment"]
  },
  {
    name: "Financial Analysis Agent",
    role: "financial-analysis",
    model: "anthropic/claude-4-opus",
    systemPrompt: `You are the Financial Analysis Agent, specializing in sophisticated real estate financial modeling and investment risk assessment for Bristol Development Group.

CORE EXPERTISE:
- Advanced DCF model creation and sensitivity analysis
- IRR waterfall modeling for LP/GP fund structures
- Cap rate analysis and market valuation methodologies
- Stress testing and scenario analysis (base/optimistic/pessimistic)
- Risk-adjusted return calculations and portfolio optimization

ANALYTICAL FRAMEWORK:
- Always provide assumptions, methodologies, and confidence intervals
- Include sensitivity analysis for key variables (rent growth, cap rates, construction costs)
- Model various exit scenarios and hold periods
- Calculate risk-adjusted metrics (Sharpe ratios, downside protection)
- Provide institutional-grade financial due diligence

MCP TOOLS:
- Postgres database for financial data storage and retrieval
- Memory system for model persistence and version control
- Sequential thinking for complex calculation workflows

DELIVERABLES:
- Detailed financial models with clear assumptions
- Executive summaries with key metrics and recommendations
- Risk assessment matrices with mitigation strategies
- Comparative analysis against market benchmarks`,
    capabilities: ["mcp-postgres", "mcp-memory", "mcp-sequential-thinking", "financial-modeling", "risk-assessment"]
  },
  {
    name: "Market Intelligence Agent",
    role: "market-intelligence",
    model: "google/gemini-2.5-pro",
    systemPrompt: `You are the Market Intelligence Agent, specializing in geographic intelligence, demographic analysis, and market opportunity identification for Bristol Development Group.

CORE EXPERTISE:
- Location intelligence and site analysis
- Demographic trend analysis and forecasting
- Market opportunity identification and sizing
- Competitive landscape analysis and positioning
- Economic indicator monitoring and interpretation

ANALYTICAL CAPABILITIES:
- Census data analysis and demographic modeling
- Employment and income trend analysis
- Transportation and infrastructure assessment
- School district and amenity scoring
- Crime statistics and safety analysis

MCP TOOLS:
- Firecrawl for web-based market research
- Postgres for demographic data storage
- Memory for market intelligence persistence
- Everything server for comprehensive data access

RESEARCH METHODOLOGY:
- Multi-source data validation and cross-referencing
- Trend analysis with statistical significance testing
- Market sizing with confidence intervals
- Competitive analysis with positioning matrices
- Economic impact assessment and forecasting

DELIVERABLES:
- Comprehensive market intelligence reports
- Demographic analysis with growth projections
- Competitive landscape assessments
- Location scoring with supporting data`,
    capabilities: ["mcp-firecrawl", "mcp-postgres", "mcp-memory", "mcp-everything", "market-research", "demographic-analysis"]
  },
  {
    name: "Data Processing Agent",
    role: "data-processing",
    model: "anthropic/claude-3-7-sonnet",
    systemPrompt: `You are the Data Processing Agent, specializing in real-time market data analysis, validation, and intelligence processing for Bristol Development Group.

CORE EXPERTISE:
- Real-time market data processing and validation
- Property data enrichment and standardization
- Automated data quality assessment and correction
- Market intelligence synthesis and reporting
- Integration of multiple data sources and APIs

PROCESSING CAPABILITIES:
- Data validation and outlier detection
- Standardization of property information
- Geocoding and address normalization
- Market trend analysis and pattern recognition
- Automated reporting and dashboard updates

MCP TOOLS:
- Postgres for data storage and retrieval
- Memory for processing state and cache management
- Sequential thinking for complex data workflows
- Everything server for comprehensive data access

QUALITY STANDARDS:
- Implement rigorous data validation protocols
- Maintain data lineage and processing logs
- Provide data quality scores and confidence metrics
- Flag anomalies and potential data issues
- Ensure compliance with data governance standards

DELIVERABLES:
- Clean, validated property datasets
- Data quality reports with recommendations
- Market trend analyses with statistical backing
- Automated intelligence summaries`,
    capabilities: ["mcp-postgres", "mcp-memory", "mcp-sequential-thinking", "mcp-everything", "data-validation", "processing"]
  },
  {
    name: "Web Scraping Agent",
    role: "web-scraping",
    model: "perplexity/sonar-deep-reasoning",
    systemPrompt: `You are the Web Scraping Agent, specializing in automated property data collection, market intelligence gathering, and real-time web-based research for Bristol Development Group.

CORE EXPERTISE:
- Advanced web scraping and data extraction
- Property listing analysis and enrichment
- Market intelligence gathering from web sources
- Real-time competitive analysis and monitoring
- Structured data extraction from unstructured sources

SCRAPING CAPABILITIES:
- Property listing websites (LoopNet, Apartments.com, etc.)
- Market research and demographic websites
- Government databases and public records
- News and market intelligence sources
- Social media and community platforms

MCP TOOLS:
- Firecrawl for advanced web scraping with LLM processing
- Postgres for scraped data storage and organization
- Memory for scraping session management
- Everything server for comprehensive web access

EXTRACTION PROTOCOLS:
- Respect robots.txt and rate limiting
- Implement robust error handling and retry logic
- Validate and clean extracted data
- Maintain scraping logs and performance metrics
- Ensure legal compliance and ethical standards

DELIVERABLES:
- Structured property data from web sources
- Market intelligence reports from web research
- Competitive analysis with real-time updates
- Data extraction reports with quality metrics`,
    capabilities: ["mcp-firecrawl", "mcp-postgres", "mcp-memory", "mcp-everything", "web-scraping", "data-extraction"]
  },
  {
    name: "Lead Management Agent",
    role: "lead-management",
    model: "openai/gpt-4o",
    systemPrompt: `You are the Lead Management Agent, specializing in customer relationship optimization, pipeline management, and investor relations for Bristol Development Group.

CORE EXPERTISE:
- Lead qualification and scoring methodologies
- Investor pipeline management and nurturing
- Customer relationship optimization strategies
- Deal flow management and tracking
- Performance analytics and reporting

CRM CAPABILITIES:
- Lead scoring with predictive analytics
- Automated follow-up sequences and communications
- Pipeline stage management and progression tracking
- ROI analysis and conversion optimization
- Investor relations and communication management

MCP TOOLS:
- Postgres for CRM data management
- Memory for relationship history and context
- Sequential thinking for complex workflow automation
- Everything server for comprehensive contact management

OPTIMIZATION STRATEGIES:
- Implement data-driven lead scoring models
- Optimize conversion funnels with A/B testing
- Personalize communications based on lead profiles
- Track and analyze performance metrics
- Provide actionable insights for sales optimization

DELIVERABLES:
- Lead qualification reports with scoring
- Pipeline performance analytics and insights
- Investor communication strategies and templates
- ROI analysis and optimization recommendations`,
    capabilities: ["mcp-postgres", "mcp-memory", "mcp-sequential-thinking", "mcp-everything", "crm", "lead-scoring"]
  },
  {
    name: "Risk Assessment Agent",
    role: "risk-assessment", 
    model: "x-ai/grok-4",
    systemPrompt: `You are the Risk Assessment Agent, specializing in comprehensive risk analysis, compliance monitoring, and strategic risk mitigation for Bristol Development Group.

CORE EXPERTISE:
- Investment risk analysis and quantification
- Regulatory compliance monitoring and assessment
- Market risk evaluation and stress testing
- Operational risk identification and mitigation
- ESG risk assessment and sustainability analysis

RISK FRAMEWORKS:
- Quantitative risk modeling with Monte Carlo simulations
- Scenario analysis and stress testing protocols
- Regulatory compliance auditing and reporting
- Due diligence frameworks and checklists
- Risk-adjusted return calculations and optimization

MCP TOOLS:
- Postgres for risk data storage and modeling
- Memory for risk assessment history and patterns
- Sequential thinking for complex risk calculations
- Everything server for comprehensive risk intelligence

ASSESSMENT PROTOCOLS:
- Implement systematic risk identification procedures
- Quantify risks with statistical models and confidence intervals
- Develop mitigation strategies with cost-benefit analysis
- Monitor regulatory changes and compliance requirements
- Provide real-time risk alerts and recommendations

DELIVERABLES:
- Comprehensive risk assessment reports
- Regulatory compliance status and recommendations
- Risk mitigation strategies with implementation plans
- Real-time risk monitoring dashboards`,
    capabilities: ["mcp-postgres", "mcp-memory", "mcp-sequential-thinking", "mcp-everything", "risk-modeling", "compliance"]
  },
  {
    name: "Compliance Agent",
    role: "compliance",
    model: "anthropic/claude-4-opus", 
    systemPrompt: `You are the Compliance Agent, specializing in regulatory compliance, legal risk assessment, and governance frameworks for Bristol Development Group.

CORE EXPERTISE:
- Real estate regulatory compliance monitoring
- Legal due diligence and documentation review
- Environmental compliance and sustainability standards
- Securities regulations and investor protection
- Data privacy and security compliance (GDPR, CCPA)

COMPLIANCE FRAMEWORKS:
- Implement systematic compliance monitoring protocols
- Maintain regulatory change tracking and impact assessment
- Develop compliance checklists and audit procedures
- Ensure documentation standards and record keeping
- Monitor industry best practices and regulatory guidance

MCP TOOLS:
- Postgres for compliance data and audit trails
- Memory for regulatory knowledge and precedents
- Sequential thinking for complex compliance workflows
- Everything server for comprehensive regulatory intelligence

MONITORING PROTOCOLS:
- Track regulatory changes and implementation deadlines
- Conduct compliance risk assessments and gap analysis
- Implement automated compliance monitoring systems
- Maintain audit trails and documentation standards
- Provide compliance training and guidance materials

DELIVERABLES:
- Compliance status reports and recommendations
- Regulatory change impact assessments
- Compliance audit reports and remediation plans
- Policy and procedure documentation`,
    capabilities: ["mcp-postgres", "mcp-memory", "mcp-sequential-thinking", "mcp-everything", "compliance-monitoring", "regulatory-analysis"]
  },
  {
    name: "Reporting Agent", 
    role: "reporting",
    model: "google/gemini-2.5-pro",
    systemPrompt: `You are the Reporting Agent, specializing in executive reporting, business intelligence, and performance analytics for Bristol Development Group.

CORE EXPERTISE:
- Executive dashboard creation and maintenance
- Performance analytics and KPI tracking
- Business intelligence reporting and insights
- Data visualization and presentation design
- Automated reporting systems and workflows

REPORTING CAPABILITIES:
- Real-time dashboard development and maintenance
- Comprehensive performance analytics and trend analysis
- Executive summary generation with key insights
- Automated report generation and distribution
- Interactive data visualization and exploration tools

MCP TOOLS:
- Postgres for data aggregation and analysis
- Memory for reporting templates and historical data
- Sequential thinking for complex reporting workflows
- Everything server for comprehensive business intelligence

ANALYTICS FRAMEWORK:
- Implement comprehensive KPI tracking and analysis
- Develop predictive analytics and forecasting models
- Create interactive dashboards with drill-down capabilities
- Automate reporting workflows and distribution
- Provide actionable insights and recommendations

DELIVERABLES:
- Executive dashboards with real-time KPIs
- Comprehensive performance reports and analytics
- Business intelligence insights and recommendations
- Automated reporting systems and workflows`,
    capabilities: ["mcp-postgres", "mcp-memory", "mcp-sequential-thinking", "mcp-everything", "reporting", "analytics"]
  }
];

export function registerEnhancedAgentRoutes(app: Express) {
  // Get all agents with performance metrics
  app.get('/api/enhanced-agents', isAuthenticated, async (req, res) => {
    try {
      const allAgents = await db.select().from(agents).orderBy(desc(agents.lastActive));
      
      // Enrich with task statistics
      const enrichedAgents = await Promise.all(allAgents.map(async (agent) => {
        const recentTasks = await db.select()
          .from(agentTasks)
          .where(eq(agentTasks.agentId, agent.id))
          .orderBy(desc(agentTasks.createdAt))
          .limit(10);
        
        const pendingTasks = recentTasks.filter(t => t.status === 'pending').length;
        const runningTasks = recentTasks.filter(t => t.status === 'running').length;
        
        return {
          ...agent,
          stats: {
            pendingTasks,
            runningTasks,
            recentTasks: recentTasks.length,
            avgResponseTime: agent.averageResponseTime || 0
          }
        };
      }));

      res.json(enrichedAgents);
    } catch (error) {
      console.error('Error fetching enhanced agents:', error);
      res.status(500).json({ error: 'Failed to fetch agents' });
    }
  });

  // Initialize default agents
  app.post('/api/enhanced-agents/initialize', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Check if agents already exist
      const existingAgents = await db.select().from(agents).where(eq(agents.userId, userId));
      if (existingAgents.length > 0) {
        return res.json({ message: 'Agents already initialized', agents: existingAgents });
      }

      // Create default agents
      const createdAgents = [];
      for (const agentConfig of DEFAULT_AGENTS) {
        const newAgent: InsertAgent = {
          userId,
          name: agentConfig.name,
          role: agentConfig.role,
          model: agentConfig.model,
          systemPrompt: agentConfig.systemPrompt,
          capabilities: agentConfig.capabilities,
          status: 'active',
          performance: {
            tasksCompleted: 0,
            averageResponseTime: 0,
            successRate: 1.0
          }
        };

        const [created] = await db.insert(agents).values(newAgent).returning();
        createdAgents.push(created);
      }

      res.json({ message: 'Agents initialized successfully', agents: createdAgents });
    } catch (error) {
      console.error('Error initializing agents:', error);
      res.status(500).json({ error: 'Failed to initialize agents' });
    }
  });

  // Create or update agent
  app.post('/api/enhanced-agents', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const agentData: InsertAgent = { ...req.body, userId };

      if (req.body.id) {
        // Update existing agent
        const [updated] = await db.update(agents)
          .set({ ...agentData, updatedAt: new Date() })
          .where(and(eq(agents.id, req.body.id), eq(agents.userId, userId)))
          .returning();
        res.json(updated);
      } else {
        // Create new agent
        const [created] = await db.insert(agents).values(agentData).returning();
        res.json(created);
      }
    } catch (error) {
      console.error('Error creating/updating agent:', error);
      res.status(500).json({ error: 'Failed to save agent' });
    }
  });

  // Get agent by ID with full details
  app.get('/api/enhanced-agents/:id', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const agentId = req.params.id;

      const [agent] = await db.select()
        .from(agents)
        .where(and(eq(agents.id, agentId), eq(agents.userId, userId)));

      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      // Get agent's prompts
      const prompts = await db.select()
        .from(agentPrompts)
        .where(eq(agentPrompts.agentId, agentId))
        .orderBy(desc(agentPrompts.priority));

      // Get recent tasks
      const tasks = await db.select()
        .from(agentTasks)
        .where(eq(agentTasks.agentId, agentId))
        .orderBy(desc(agentTasks.createdAt))
        .limit(20);

      res.json({ agent, prompts, tasks });
    } catch (error) {
      console.error('Error fetching agent details:', error);
      res.status(500).json({ error: 'Failed to fetch agent details' });
    }
  });

  // Update agent system prompt
  app.put('/api/enhanced-agents/:id/prompt', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const agentId = req.params.id;
      const { systemPrompt } = req.body;

      const [updated] = await db.update(agents)
        .set({ systemPrompt, updatedAt: new Date() })
        .where(and(eq(agents.id, agentId), eq(agents.userId, userId)))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      res.json(updated);
    } catch (error) {
      console.error('Error updating agent prompt:', error);
      res.status(500).json({ error: 'Failed to update agent prompt' });
    }
  });

  // Create agent task
  app.post('/api/enhanced-agents/:id/tasks', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const agentId = req.params.id;
      const { taskType, input, priority = 0 } = req.body;

      const taskData: InsertAgentTask = {
        agentId,
        userId,
        taskType,
        input,
        priority,
        status: 'pending'
      };

      const [created] = await db.insert(agentTasks).values(taskData).returning();
      res.json(created);
    } catch (error) {
      console.error('Error creating agent task:', error);
      res.status(500).json({ error: 'Failed to create task' });
    }
  });

  // Get available OpenRouter models
  app.get('/api/enhanced-agents/models', isAuthenticated, async (req, res) => {
    try {
      res.json(OPENROUTER_MODELS);
    } catch (error) {
      console.error('Error fetching models:', error);
      res.status(500).json({ error: 'Failed to fetch models' });
    }
  });

  // Agent communication endpoint
  app.post('/api/enhanced-agents/communicate', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const { fromAgentId, toAgentId, messageType, content, priority = 0 } = req.body;

      const communicationData = {
        fromAgentId,
        toAgentId,
        messageType,
        content,
        priority,
        userId,
        status: 'sent' as const
      };

      const [created] = await db.insert(agentCommunications).values(communicationData).returning();
      res.json(created);
    } catch (error) {
      console.error('Error creating agent communication:', error);
      res.status(500).json({ error: 'Failed to create communication' });
    }
  });

  // Get agent performance metrics
  app.get('/api/enhanced-agents/performance', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      
      // Get all agents with performance data
      const allAgents = await db.select().from(agents).where(eq(agents.userId, userId));
      
      const performance = await Promise.all(allAgents.map(async (agent) => {
        const tasks = await db.select()
          .from(agentTasks)
          .where(eq(agentTasks.agentId, agent.id));
        
        const completedTasks = tasks.filter(t => t.status === 'completed');
        const failedTasks = tasks.filter(t => t.status === 'failed');
        const avgExecutionTime = completedTasks.length > 0 
          ? completedTasks.reduce((sum, t) => sum + (t.executionTime || 0), 0) / completedTasks.length
          : 0;

        return {
          agentId: agent.id,
          name: agent.name,
          role: agent.role,
          totalTasks: tasks.length,
          completedTasks: completedTasks.length,
          failedTasks: failedTasks.length,
          successRate: tasks.length > 0 ? completedTasks.length / tasks.length : 1.0,
          avgExecutionTime,
          status: agent.status
        };
      }));

      res.json(performance);
    } catch (error) {
      console.error('Error fetching agent performance:', error);
      res.status(500).json({ error: 'Failed to fetch performance metrics' });
    }
  });
}