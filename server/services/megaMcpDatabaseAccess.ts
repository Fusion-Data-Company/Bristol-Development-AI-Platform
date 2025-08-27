import { enhancedErrorHandling } from './enhancedErrorHandling';
import { storage } from '../storage';
import { db } from '../db';
import { 
  sites, 
  siteMetrics, 
  chatSessions, 
  chatMessages, 
  integrationLogs, 
  mcpTools,
  snapshots,
  memoryShort,
  memoryLong,
  agentPrompts,
  agentAttachments,
  agentContext,
  agentDecisions,
  marketIntelligence,
  agentExecutions,
  teamUsers,
  comps,
  concessions,
  properties,
  runs,
  compsAnnex,
  scrapeJobsAnnex
} from '@shared/schema';
import { eq, sql, desc, and, or, like } from 'drizzle-orm';

interface MegaMcpDatabaseInterface {
  // Core Data Access
  getAllSites(): Promise<any[]>;
  getSiteById(id: string): Promise<any>;
  getSiteMetrics(siteId: string): Promise<any[]>;
  getPortfolioAnalytics(): Promise<any>;
  
  // Chat & Memory Access
  getChatHistory(sessionId?: string, userId?: string): Promise<any[]>;
  getAgentMemory(userId: string, category?: string): Promise<any>;
  getAgentDecisions(sessionId?: string): Promise<any[]>;
  
  // Market Intelligence
  getMarketIntelligence(category?: string, limit?: number): Promise<any[]>;
  getComparables(siteId?: string): Promise<any[]>;
  getPropertyDetails(siteId: string): Promise<any>;
  
  // Analytics & Insights
  getBristolScoring(siteId?: string): Promise<any>;
  getRunsHistory(type?: string, limit?: number): Promise<any[]>;
  getIntegrationLogs(service?: string, status?: string): Promise<any[]>;
  
  // Advanced Queries
  executeCustomQuery(query: string, params?: any[]): Promise<any>;
  searchProperties(criteria: any): Promise<any[]>;
  getGeographicAnalysis(bounds: any): Promise<any>;
}

export class MegaMcpDatabaseAccess implements MegaMcpDatabaseInterface {
  private errorHandler = enhancedErrorHandling;

  // CORE DATA ACCESS METHODS

  async getAllSites(): Promise<any[]> {
    return this.errorHandler.wrapDatabaseOperation(
      async () => {
        const sitesData = await db.select().from(sites).orderBy(desc(sites.createdAt));
        console.log(`✅ Retrieved ${sitesData.length} sites from database`);
        return sitesData;
      },
      { operation: 'getAllSites', table: 'sites' }
    );
  }

  async getSiteById(id: string): Promise<any> {
    return this.errorHandler.wrapDatabaseOperation(
      async () => {
        const [site] = await db.select().from(sites).where(eq(sites.id, id));
        if (!site) throw new Error(`Site with ID ${id} not found`);
        
        // Get related data
        const metrics = await db.select().from(siteMetrics).where(eq(siteMetrics.siteId, id));
        const comparables = await db.select().from(comps).where(eq(comps.siteId, id));
        const propertyDetails = await db.select().from(properties).where(eq(properties.siteId, id));
        
        return {
          ...site,
          metrics,
          comparables,
          propertyDetails
        };
      },
      { operation: 'getSiteById', table: 'sites', siteId: id }
    );
  }

  async getSiteMetrics(siteId: string): Promise<any[]> {
    return this.errorHandler.wrapDatabaseOperation(
      async () => {
        return await db.select().from(siteMetrics)
          .where(eq(siteMetrics.siteId, siteId))
          .orderBy(desc(siteMetrics.createdAt));
      },
      { operation: 'getSiteMetrics', table: 'site_metrics', siteId }
    );
  }

  async getPortfolioAnalytics(): Promise<any> {
    return this.errorHandler.wrapDatabaseOperation(
      async () => {
        // Complex portfolio analytics query
        const totalSites = await db.select({ count: sql<number>`count(*)` }).from(sites);
        const totalUnits = await db.select({ sum: sql<number>`sum(units_total)` }).from(sites);
        const avgBristolScore = await db.select({ avg: sql<number>`avg(bristol_score)` }).from(sites);
        
        const statusBreakdown = await db.select({
          status: sites.status,
          count: sql<number>`count(*)`
        })
        .from(sites)
        .groupBy(sites.status);

        const stateBreakdown = await db.select({
          state: sites.state,
          count: sql<number>`count(*)`
        })
        .from(sites)
        .groupBy(sites.state)
        .orderBy(desc(sql<number>`count(*)`));

        return {
          overview: {
            totalSites: totalSites[0]?.count || 0,
            totalUnits: totalUnits[0]?.sum || 0,
            avgBristolScore: avgBristolScore[0]?.avg || 0
          },
          statusBreakdown,
          stateBreakdown: stateBreakdown.slice(0, 10) // Top 10 states
        };
      },
      { operation: 'getPortfolioAnalytics', table: 'multiple' }
    );
  }

  // CHAT & MEMORY ACCESS METHODS

  async getChatHistory(sessionId?: string, userId?: string): Promise<any[]> {
    return this.errorHandler.wrapDatabaseOperation(
      async () => {
        let query = db.select({
          id: chatMessages.id,
          sessionId: chatMessages.sessionId,
          role: chatMessages.role,
          content: chatMessages.content,
          metadata: chatMessages.metadata,
          createdAt: chatMessages.createdAt,
          sessionTitle: chatSessions.title,
          userId: chatSessions.userId
        })
        .from(chatMessages)
        .leftJoin(chatSessions, eq(chatMessages.sessionId, chatSessions.id));

        if (sessionId) {
          query = query.where(eq(chatMessages.sessionId, sessionId));
        } else if (userId) {
          query = query.where(eq(chatSessions.userId, userId));
        }

        return await query.orderBy(desc(chatMessages.createdAt)).limit(500);
      },
      { operation: 'getChatHistory', table: 'chat_messages', sessionId, userId }
    );
  }

  async getAgentMemory(userId: string, category?: string): Promise<any> {
    return this.errorHandler.wrapDatabaseOperation(
      async () => {
        let shortTermQuery = db.select().from(memoryShort).where(eq(memoryShort.userId, userId));
        let longTermQuery = db.select().from(memoryLong).where(eq(memoryLong.userId, userId));

        if (category) {
          longTermQuery = longTermQuery.where(eq(memoryLong.category, category));
        }

        const [shortTerm, longTerm] = await Promise.all([
          shortTermQuery.orderBy(desc(memoryShort.createdAt)).limit(50),
          longTermQuery.orderBy(desc(memoryLong.createdAt)).limit(100)
        ]);

        return { shortTerm, longTerm };
      },
      { operation: 'getAgentMemory', table: 'memory', userId, category }
    );
  }

  async getAgentDecisions(sessionId?: string): Promise<any[]> {
    return this.errorHandler.wrapDatabaseOperation(
      async () => {
        let query = db.select().from(agentDecisions);
        
        if (sessionId) {
          query = query.where(eq(agentDecisions.sessionId, sessionId));
        }

        return await query.orderBy(desc(agentDecisions.createdAt)).limit(200);
      },
      { operation: 'getAgentDecisions', table: 'agent_decisions', sessionId }
    );
  }

  // MARKET INTELLIGENCE METHODS

  async getMarketIntelligence(category?: string, limit: number = 100): Promise<any[]> {
    return this.errorHandler.wrapDatabaseOperation(
      async () => {
        let query = db.select().from(marketIntelligence);
        
        if (category) {
          query = query.where(eq(marketIntelligence.category, category));
        }

        return await query.orderBy(desc(marketIntelligence.priority), desc(marketIntelligence.createdAt)).limit(limit);
      },
      { operation: 'getMarketIntelligence', table: 'market_intelligence', category, limit }
    );
  }

  async getComparables(siteId?: string): Promise<any[]> {
    return this.errorHandler.wrapDatabaseOperation(
      async () => {
        let query = db.select({
          id: comps.id,
          siteId: comps.siteId,
          name: comps.name,
          address: comps.address,
          distance: comps.distance,
          units: comps.units,
          yearBuilt: comps.yearBuilt,
          rentMin: comps.rentMin,
          rentMax: comps.rentMax,
          rentAvg: comps.rentAvg,
          occupancyRate: comps.occupancyRate,
          amenities: comps.amenities,
          score: comps.score,
          scoreBreakdown: comps.scoreBreakdown,
          source: comps.source,
          dataDate: comps.dataDate,
          siteName: sites.name,
          siteCity: sites.city,
          siteState: sites.state
        })
        .from(comps)
        .leftJoin(sites, eq(comps.siteId, sites.id));

        if (siteId) {
          query = query.where(eq(comps.siteId, siteId));
        }

        return await query.orderBy(desc(comps.score), desc(comps.createdAt)).limit(200);
      },
      { operation: 'getComparables', table: 'comps', siteId }
    );
  }

  async getPropertyDetails(siteId: string): Promise<any> {
    return this.errorHandler.wrapDatabaseOperation(
      async () => {
        const [property] = await db.select().from(properties).where(eq(properties.siteId, siteId));
        return property;
      },
      { operation: 'getPropertyDetails', table: 'properties', siteId }
    );
  }

  // ANALYTICS & INSIGHTS METHODS

  async getBristolScoring(siteId?: string): Promise<any> {
    return this.errorHandler.wrapDatabaseOperation(
      async () => {
        let query = db.select({
          id: sites.id,
          name: sites.name,
          city: sites.city,
          state: sites.state,
          bristolScore: sites.bristolScore,
          unitsTotal: sites.unitsTotal,
          completionYear: sites.completionYear,
          status: sites.status
        }).from(sites).where(sql`bristol_score IS NOT NULL`);

        if (siteId) {
          query = query.where(eq(sites.id, siteId));
        }

        const results = await query.orderBy(desc(sites.bristolScore));
        
        if (!siteId) {
          // Add scoring distribution analytics
          const distribution = await db.select({
            scoreRange: sql<string>`CASE 
              WHEN bristol_score >= 90 THEN '90-100'
              WHEN bristol_score >= 80 THEN '80-89'
              WHEN bristol_score >= 70 THEN '70-79'
              WHEN bristol_score >= 60 THEN '60-69'
              ELSE 'Below 60'
            END`,
            count: sql<number>`count(*)`
          })
          .from(sites)
          .where(sql`bristol_score IS NOT NULL`)
          .groupBy(sql`CASE 
            WHEN bristol_score >= 90 THEN '90-100'
            WHEN bristol_score >= 80 THEN '80-89'
            WHEN bristol_score >= 70 THEN '70-79'
            WHEN bristol_score >= 60 THEN '60-69'
            ELSE 'Below 60'
          END`);

          return {
            properties: results,
            distribution,
            totalScored: results.length
          };
        }

        return results[0];
      },
      { operation: 'getBristolScoring', table: 'sites', siteId }
    );
  }

  async getRunsHistory(type?: string, limit: number = 50): Promise<any[]> {
    return this.errorHandler.wrapDatabaseOperation(
      async () => {
        let query = db.select().from(runs);
        
        if (type) {
          query = query.where(eq(runs.type, type));
        }

        return await query.orderBy(desc(runs.createdAt)).limit(limit);
      },
      { operation: 'getRunsHistory', table: 'runs', type, limit }
    );
  }

  async getIntegrationLogs(service?: string, status?: string): Promise<any[]> {
    return this.errorHandler.wrapDatabaseOperation(
      async () => {
        let conditions = [];
        
        if (service) {
          conditions.push(eq(integrationLogs.service, service));
        }
        
        if (status) {
          conditions.push(eq(integrationLogs.status, status));
        }

        let query = db.select().from(integrationLogs);
        
        if (conditions.length > 0) {
          query = query.where(and(...conditions));
        }

        return await query.orderBy(desc(integrationLogs.createdAt)).limit(200);
      },
      { operation: 'getIntegrationLogs', table: 'integration_logs', service, status }
    );
  }

  // ADVANCED QUERY METHODS

  async executeCustomQuery(query: string, params: any[] = []): Promise<any> {
    return this.errorHandler.wrapDatabaseOperation(
      async () => {
        // Security check - only allow SELECT statements
        const sanitizedQuery = query.trim().toLowerCase();
        if (!sanitizedQuery.startsWith('select')) {
          throw new Error('Only SELECT queries are allowed for security');
        }

        // Additional security checks
        const dangerousKeywords = ['delete', 'update', 'insert', 'drop', 'alter', 'create'];
        if (dangerousKeywords.some(keyword => sanitizedQuery.includes(keyword))) {
          throw new Error('Query contains restricted keywords');
        }

        const result = await db.execute(sql.raw(query, params));
        console.log(`✅ Custom query executed successfully: ${query.substring(0, 100)}...`);
        return result;
      },
      { operation: 'executeCustomQuery', table: 'custom', query: query.substring(0, 200) }
    );
  }

  async searchProperties(criteria: any): Promise<any[]> {
    return this.errorHandler.wrapDatabaseOperation(
      async () => {
        let conditions = [];
        
        if (criteria.city) {
          conditions.push(like(sites.city, `%${criteria.city}%`));
        }
        
        if (criteria.state) {
          conditions.push(eq(sites.state, criteria.state));
        }
        
        if (criteria.status) {
          conditions.push(eq(sites.status, criteria.status));
        }
        
        if (criteria.minUnits) {
          conditions.push(sql`units_total >= ${criteria.minUnits}`);
        }
        
        if (criteria.maxUnits) {
          conditions.push(sql`units_total <= ${criteria.maxUnits}`);
        }
        
        if (criteria.minBristolScore) {
          conditions.push(sql`bristol_score >= ${criteria.minBristolScore}`);
        }

        let query = db.select().from(sites);
        
        if (conditions.length > 0) {
          query = query.where(and(...conditions));
        }

        return await query.orderBy(desc(sites.bristolScore), desc(sites.createdAt)).limit(100);
      },
      { operation: 'searchProperties', table: 'sites', criteria }
    );
  }

  async getGeographicAnalysis(bounds: any): Promise<any> {
    return this.errorHandler.wrapDatabaseOperation(
      async () => {
        const { north, south, east, west } = bounds;
        
        const sitesInBounds = await db.select().from(sites)
          .where(
            and(
              sql`latitude BETWEEN ${south} AND ${north}`,
              sql`longitude BETWEEN ${west} AND ${east}`
            )
          );

        const stateAnalysis = await db.select({
          state: sites.state,
          count: sql<number>`count(*)`,
          totalUnits: sql<number>`sum(units_total)`,
          avgBristolScore: sql<number>`avg(bristol_score)`
        })
        .from(sites)
        .where(
          and(
            sql`latitude BETWEEN ${south} AND ${north}`,
            sql`longitude BETWEEN ${west} AND ${east}`
          )
        )
        .groupBy(sites.state);

        return {
          sitesInBounds,
          stateAnalysis,
          totalSitesInBounds: sitesInBounds.length,
          bounds
        };
      },
      { operation: 'getGeographicAnalysis', table: 'sites', bounds }
    );
  }

  // UTILITY METHODS

  async getTableCounts(): Promise<any> {
    return this.errorHandler.wrapDatabaseOperation(
      async () => {
        const counts = await Promise.all([
          db.select({ count: sql<number>`count(*)` }).from(sites),
          db.select({ count: sql<number>`count(*)` }).from(siteMetrics),
          db.select({ count: sql<number>`count(*)` }).from(chatSessions),
          db.select({ count: sql<number>`count(*)` }).from(chatMessages),
          db.select({ count: sql<number>`count(*)` }).from(integrationLogs),
          db.select({ count: sql<number>`count(*)` }).from(comps),
          db.select({ count: sql<number>`count(*)` }).from(properties),
          db.select({ count: sql<number>`count(*)` }).from(marketIntelligence)
        ]);

        return {
          sites: counts[0][0]?.count || 0,
          siteMetrics: counts[1][0]?.count || 0,
          chatSessions: counts[2][0]?.count || 0,
          chatMessages: counts[3][0]?.count || 0,
          integrationLogs: counts[4][0]?.count || 0,
          comps: counts[5][0]?.count || 0,
          properties: counts[6][0]?.count || 0,
          marketIntelligence: counts[7][0]?.count || 0
        };
      },
      { operation: 'getTableCounts', table: 'multiple' }
    );
  }

  async getSystemHealth(): Promise<any> {
    return this.errorHandler.wrapDatabaseOperation(
      async () => {
        // Test basic database connectivity and performance
        const startTime = Date.now();
        await db.execute(sql`SELECT 1`);
        const dbResponseTime = Date.now() - startTime;

        const tableCounts = await this.getTableCounts();
        
        return {
          databaseConnected: true,
          responseTime: dbResponseTime,
          tableCounts,
          schemasAccessible: Object.keys(tableCounts).length,
          timestamp: new Date().toISOString()
        };
      },
      { operation: 'getSystemHealth', table: 'system' }
    );
  }
}

export const megaMcpDatabaseAccess = new MegaMcpDatabaseAccess();