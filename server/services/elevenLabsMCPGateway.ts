import { db } from '../db';
import { 
  teamUsers, 
  conversationSessions, 
  mcpToolExecutions,
  analyticsCache,
  artifacts,
  tasks,
  sites,
  marketIntelligence,
  type TeamUser,
  type ConversationSession,
  type InsertConversationSession,
  type InsertMCPToolExecution,
  type InsertArtifact,
  type InsertTask
} from '@shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import crypto from 'crypto';
import { mcpIntegrationService } from './mcpIntegrationService';
import { eliteMCPOrchestrationService } from './eliteMCPOrchestrationService';
import { marketIntelligenceAgent } from './marketIntelligenceAgent';
import { propertyAnalysisService } from './propertyAnalysisService';
import { enhancedAIService } from './enhancedAIService';

// Claude 4 Configuration via OpenRouter
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

interface MCPGatewayConfig {
  // Model selection for OpenRouter - Using Claude 4
  primaryModel: string;
  fallbackModels: string[];
  specializedModels: {
    analysis: string;
    summarization: string;
    verification: string;
  };
  
  // Performance settings
  timeout: {
    simple: number;
    complex: number;
    research: number;
  };
  
  // Error handling
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelay: number;
  };
}

const config: MCPGatewayConfig = {
  primaryModel: 'anthropic/claude-opus-4.1', // Claude 4.1 Opus - Best performance
  fallbackModels: [
    'anthropic/claude-opus-4',     // Claude 4 Opus as first fallback
    'anthropic/claude-3.5-sonnet', // Claude 3.5 Sonnet as secondary fallback
  ],
  specializedModels: {
    analysis: 'perplexity/sonar-pro',        // For market research
    summarization: 'anthropic/claude-3-haiku', // Fast summaries
    verification: 'openai/gpt-4o-mini'       // Quick verifications
  },
  timeout: {
    simple: 3000,   // 3s for simple queries
    complex: 15000, // 15s for complex analysis
    research: 30000 // 30s for deep research
  },
  retryPolicy: {
    maxRetries: 3,
    backoffMultiplier: 2,
    initialDelay: 1000
  }
};

// Tool definitions for Cap
interface MCPTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  handler: (params: any) => Promise<any>;
  timeout?: number;
  cacheable?: boolean;
}

// Circuit breaker for error handling
class CircuitBreaker {
  private failures = 0;
  private lastFailTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private readonly threshold = 5;
  private readonly timeout = 60000; // 1 minute

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      const timeSinceLastFail = Date.now() - this.lastFailTime;
      if (timeSinceLastFail > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
        this.failures = 0;
      }
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailTime = Date.now();
      
      if (this.failures >= this.threshold) {
        this.state = 'OPEN';
      }
      throw error;
    }
  }

  reset() {
    this.state = 'CLOSED';
    this.failures = 0;
    this.lastFailTime = 0;
  }
}

export class ElevenLabsMCPGateway {
  private tools: Map<string, MCPTool> = new Map();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private teamCache: Map<string, TeamUser> = new Map();
  
  constructor() {
    this.initializeTools();
    this.loadCompanyTeam();
  }

  private async loadCompanyTeam() {
    try {
      // Load Company team members from database
      const team = await db.select().from(teamUsers).where(eq(teamUsers.isActive, true));
      team.forEach(member => {
        this.teamCache.set(member.name.toLowerCase(), member);
      });
      console.log(`✅ Loaded ${team.length} Company team members into cache`);
    } catch (error) {
      console.error('Failed to load Company team:', error);
    }
  }

  private initializeTools() {
    // Tool 1: Verify User
    this.tools.set('verify_user', {
      name: 'verify_user',
      description: 'Verify user against Company team roster',
      parameters: { name: { type: 'string', required: true } },
      handler: async (params) => {
        const { name } = params;
        const normalizedName = name.toLowerCase().trim();
        
        // Check cache first
        if (this.teamCache.has(normalizedName)) {
          const user = this.teamCache.get(normalizedName);
          return {
            verified: true,
            user: {
              id: user!.id,
              name: user!.name,
              role: user!.role,
              accessLevel: user!.accessLevel
            }
          };
        }

        // Check database for variations
        const dbUser = await db.select()
          .from(teamUsers)
          .where(
            and(
              sql`LOWER(${teamUsers.name}) LIKE ${`%${normalizedName}%`}`,
              eq(teamUsers.isActive, true)
            )
          )
          .limit(1);

        if (dbUser.length > 0) {
          this.teamCache.set(normalizedName, dbUser[0]);
          return {
            verified: true,
            user: {
              id: dbUser[0].id,
              name: dbUser[0].name,
              role: dbUser[0].role,
              accessLevel: dbUser[0].accessLevel
            }
          };
        }

        return {
          verified: false,
          message: 'User not found in Company team roster'
        };
      },
      timeout: config.timeout.simple
    });

    // Tool 2: Fetch Last Conversation
    this.tools.set('fetch_last_conversation', {
      name: 'fetch_last_conversation',
      description: 'Retrieve previous conversation context',
      parameters: { user_id: { type: 'string', required: true } },
      handler: async (params) => {
        const { user_id } = params;
        
        const lastSession = await db.select()
          .from(conversationSessions)
          .where(eq(conversationSessions.userId, user_id))
          .orderBy(desc(conversationSessions.lastActive))
          .limit(1);

        if (lastSession.length > 0) {
          return {
            found: true,
            session: {
              conversationId: lastSession[0].conversationId,
              summary: lastSession[0].summary,
              tags: lastSession[0].tags,
              context: lastSession[0].context,
              lastActive: lastSession[0].lastActive
            }
          };
        }

        return {
          found: false,
          message: 'No previous conversation found'
        };
      },
      timeout: config.timeout.simple,
      cacheable: true
    });

    // Tool 3: Log Conversation
    this.tools.set('log_conversation', {
      name: 'log_conversation',
      description: 'Save conversation state',
      parameters: {
        user_id: { type: 'string', required: true },
        summary: { type: 'string', required: true },
        tags: { type: 'array', required: true },
        timestamp: { type: 'string', required: true },
        convo_id: { type: 'string', required: true }
      },
      handler: async (params) => {
        const { user_id, summary, tags, timestamp, convo_id } = params;
        
        try {
          // Check if conversation exists
          const existing = await db.select()
            .from(conversationSessions)
            .where(eq(conversationSessions.conversationId, convo_id))
            .limit(1);

          if (existing.length > 0) {
            // Update existing
            await db.update(conversationSessions)
              .set({
                summary,
                tags,
                lastActive: new Date(timestamp),
                context: { ...existing[0].context, lastUpdate: timestamp }
              })
              .where(eq(conversationSessions.conversationId, convo_id));
          } else {
            // Create new
            const newSession: InsertConversationSession = {
              userId: user_id,
              conversationId: convo_id,
              summary,
              tags,
              context: { timestamp, initialSummary: summary },
              status: 'active',
              startedAt: new Date(timestamp),
              lastActive: new Date(timestamp)
            };
            await db.insert(conversationSessions).values(newSession);
          }

          return {
            success: true,
            conversationId: convo_id
          };
        } catch (error) {
          console.error('Failed to log conversation:', error);
          return {
            success: false,
            error: 'Failed to save conversation state'
          };
        }
      },
      timeout: config.timeout.simple
    });

    // Tool 4: Query Analytics
    this.tools.set('query_analytics', {
      name: 'query_analytics',
      description: 'Fetch Company portfolio analytics',
      parameters: {
        query: { type: 'string', required: true },
        type: { type: 'string', enum: ['project', 'portfolio', 'metric_set'] }
      },
      handler: async (params) => {
        const { query, type } = params;
        
        // Check cache first
        const cacheKey = crypto.createHash('md5').update(`${query}:${type}`).digest('hex');
        const cached = await db.select()
          .from(analyticsCache)
          .where(
            and(
              eq(analyticsCache.queryHash, cacheKey),
              sql`${analyticsCache.expiresAt} > NOW()`
            )
          )
          .limit(1);

        if (cached.length > 0) {
          return cached[0].data;
        }

        // Fetch fresh data based on type
        let result: any;
        
        switch (type) {
          case 'portfolio':
            // Get all sites and aggregate metrics
            const allSites = await db.select().from(sites);
            const totalUnits = allSites.reduce((sum, site) => sum + (site.unitsTotal || 0), 0);
            const avgSf = allSites.reduce((sum, site) => sum + (site.avgSf || 0), 0) / allSites.length;
            
            result = {
              totalSites: allSites.length,
              totalUnits,
              averageSqFt: avgSf,
              markets: [...new Set(allSites.map(s => `${s.city}, ${s.state}`))],
              metrics: {
                occupancy: 94.5, // Would come from real data
                avgRentPerSf: 1.85,
                totalValuation: totalUnits * 250000 // Simplified calculation
              }
            };
            break;
            
          case 'project':
            // Get specific project data
            const projectSites = await db.select()
              .from(sites)
              .where(sql`LOWER(${sites.name}) LIKE ${`%${query.toLowerCase()}%`}`)
              .limit(5);
            
            result = {
              projects: projectSites.map(site => ({
                name: site.name,
                location: `${site.city}, ${site.state}`,
                units: site.unitsTotal,
                status: site.status,
                metrics: site.acsProfile
              }))
            };
            break;
            
          case 'metric_set':
            // Get market intelligence
            const intelligence = await db.select()
              .from(marketIntelligence)
              .where(eq(marketIntelligence.processed, false))
              .orderBy(desc(marketIntelligence.priority))
              .limit(10);
            
            result = {
              marketUpdates: intelligence.map(item => ({
                title: item.title,
                impact: item.impact,
                companyImplication: item.companyImplication
              }))
            };
            break;
            
          default:
            result = { error: 'Unknown query type' };
        }

        // Cache the result
        await db.insert(analyticsCache).values({
          queryHash: cacheKey,
          queryType: type,
          data: result,
          metadata: { query, timestamp: new Date() },
          expiresAt: new Date(Date.now() + 3600000) // 1 hour cache
        });

        return result;
      },
      timeout: config.timeout.complex,
      cacheable: true
    });

    // Tool 5: Store Artifact
    this.tools.set('store_artifact', {
      name: 'store_artifact',
      description: 'Save documents and reports',
      parameters: {
        type: { type: 'string', required: true },
        content: { type: 'string', required: true },
        meta: { type: 'object' }
      },
      handler: async (params) => {
        const { type, content, meta } = params;
        
        try {
          const artifact: InsertArtifact = {
            userId: meta?.userId,
            conversationId: meta?.conversationId,
            type,
            content,
            metadata: meta,
            version: 1
          };
          
          const result = await db.insert(artifacts).values(artifact).returning();
          
          return {
            success: true,
            artifactId: result[0].id,
            type: result[0].type
          };
        } catch (error) {
          console.error('Failed to store artifact:', error);
          return {
            success: false,
            error: 'Failed to save artifact'
          };
        }
      },
      timeout: config.timeout.simple
    });

    // Tool 6: Web Search (using Perplexity via OpenRouter)
    this.tools.set('web_search', {
      name: 'web_search',
      description: 'External market research',
      parameters: { query: { type: 'string', required: true } },
      handler: async (params) => {
        const { query } = params;
        
        try {
          // Use Perplexity Sonar for real-time web search
          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://company.replit.app',
              'X-Title': 'Company Cap AI'
            },
            body: JSON.stringify({
              model: config.specializedModels.analysis,
              messages: [
                {
                  role: 'system',
                  content: 'You are a real estate market research analyst for Company Development Group. Provide accurate, current market data and insights.'
                },
                {
                  role: 'user',
                  content: query
                }
              ],
              max_tokens: 2000,
              temperature: 0.3
            })
          });

          if (!response.ok) {
            throw new Error(`Search failed: ${response.statusText}`);
          }

          const data = await response.json();
          return {
            success: true,
            results: data.choices[0].message.content,
            source: 'perplexity_sonar',
            timestamp: new Date()
          };
        } catch (error) {
          console.error('Web search failed:', error);
          
          // Fallback to cached data or error message
          return {
            success: false,
            error: 'Unable to perform web search at this time',
            suggestion: 'Try using query_analytics for internal data'
          };
        }
      },
      timeout: config.timeout.research
    });

    console.log(`✅ Initialized ${this.tools.size} MCP tools for Cap`);
  }

  // Main execution method with intelligent routing
  async executeTool(toolName: string, params: any, conversationId?: string): Promise<any> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      return {
        error: `Tool ${toolName} not found`,
        availableTools: Array.from(this.tools.keys())
      };
    }

    // Get or create circuit breaker for this tool
    if (!this.circuitBreakers.has(toolName)) {
      this.circuitBreakers.set(toolName, new CircuitBreaker());
    }
    const circuitBreaker = this.circuitBreakers.get(toolName)!;

    // Log execution start
    const startTime = Date.now();
    let status = 'success';
    let errorMessage: string | undefined;
    let result: any;

    try {
      // Execute with timeout and circuit breaker
      result = await Promise.race([
        circuitBreaker.execute(() => tool.handler(params)),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Tool execution timeout')), 
          tool.timeout || config.timeout.complex)
        )
      ]);
    } catch (error) {
      status = 'error';
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Implement retry logic for transient failures
      if (this.shouldRetry(error)) {
        console.log(`Retrying ${toolName} after error: ${errorMessage}`);
        await this.delay(config.retryPolicy.initialDelay);
        
        try {
          result = await tool.handler(params);
          status = 'success';
          errorMessage = undefined;
        } catch (retryError) {
          console.error(`Retry failed for ${toolName}:`, retryError);
          result = {
            error: 'Tool execution failed after retry',
            details: retryError instanceof Error ? retryError.message : 'Unknown error'
          };
        }
      } else {
        result = {
          error: errorMessage,
          fallback: this.getFallbackSuggestion(toolName)
        };
      }
    }

    // Log execution details
    const executionTime = Date.now() - startTime;
    if (conversationId) {
      try {
        const execution: InsertMCPToolExecution = {
          conversationId,
          toolName,
          inputParams: params,
          outputData: result,
          executionTimeMs: executionTime,
          status,
          errorMessage
        };
        await db.insert(mcpToolExecutions).values(execution);
      } catch (logError) {
        console.error('Failed to log tool execution:', logError);
      }
    }

    console.log(`Tool ${toolName} executed in ${executionTime}ms - Status: ${status}`);
    return result;
  }

  // Execute multiple tools in parallel
  async executeToolChain(tools: Array<{ name: string; params: any }>, conversationId?: string): Promise<any[]> {
    const promises = tools.map(({ name, params }) => 
      this.executeTool(name, params, conversationId)
    );
    
    return Promise.allSettled(promises).then(results => 
      results.map((result, index) => ({
        tool: tools[index].name,
        status: result.status,
        result: result.status === 'fulfilled' ? result.value : { error: result.reason }
      }))
    );
  }

  // Intelligent tool suggestion based on intent
  async suggestTools(userIntent: string): Promise<string[]> {
    // Use Claude 4 to analyze intent and suggest tools
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.primaryModel,
          messages: [
            {
              role: 'system',
              content: `You are Cap's tool selection assistant. Based on the user's intent, suggest which tools to use from: ${Array.from(this.tools.keys()).join(', ')}. Return only a JSON array of tool names.`
            },
            {
              role: 'user',
              content: userIntent
            }
          ],
          max_tokens: 200,
          temperature: 0.2,
          response_format: { type: 'json_object' }
        })
      });

      const data = await response.json();
      const suggestions = JSON.parse(data.choices[0].message.content);
      return suggestions.tools || [];
    } catch (error) {
      console.error('Failed to get tool suggestions:', error);
      return [];
    }
  }

  private shouldRetry(error: any): boolean {
    const retryableErrors = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'];
    return retryableErrors.some(e => error?.code === e) || 
           error?.message?.includes('timeout');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getFallbackSuggestion(toolName: string): string {
    const fallbacks: Record<string, string> = {
      web_search: 'Try using query_analytics for internal data',
      query_analytics: 'Check if the database connection is active',
      verify_user: 'Ensure the user name matches exactly as registered'
    };
    return fallbacks[toolName] || 'Please try again or contact support';
  }

  // Get all available tools for registration
  getToolDefinitions() {
    return Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }));
  }
}

// Export singleton instance
export const elevenLabsMCPGateway = new ElevenLabsMCPGateway();