import {
  users,
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
  competitorSignals,
  scrapeJobs,
  competitorEntities,
  geoJurisdictions,
  competitorAnalysis,
  type User,
  type UpsertUser,
  type Site,
  type InsertSite,
  type SiteMetric,
  type InsertSiteMetric,
  type ChatSession,
  type InsertChatSession,
  type ChatMessage,
  type InsertChatMessage,
  type IntegrationLog,
  type InsertIntegrationLog,
  type McpTool,
  type InsertMcpTool,
  type Snapshot,
  type InsertSnapshot,
  type MemoryShort,
  type InsertMemoryShort,
  type MemoryLong,
  type InsertMemoryLong,
  type AgentPrompt,
  type InsertAgentPrompt,
  type AgentAttachment,
  type InsertAgentAttachment,
  type AgentContext,
  type InsertAgentContext,
  type AgentDecision,
  type InsertAgentDecision,
  type MarketIntelligence,
  type InsertMarketIntelligence,
  type AgentExecution,
  type InsertAgentExecution,
  type CompetitorSignal,
  type InsertCompetitorSignal,
  type ScrapeJob,
  type InsertScrapeJob,
  type CompetitorEntity,
  type InsertCompetitorEntity,
  type GeoJurisdiction,
  type InsertGeoJurisdiction,
  type CompetitorAnalysis,
  type InsertCompetitorAnalysis,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, gte } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Site operations
  createSite(site: InsertSite): Promise<Site>;
  getSite(id: string): Promise<Site | undefined>;
  getAllSites(): Promise<Site[]>;
  getUserSites(userId: string): Promise<Site[]>;
  updateSite(id: string, updates: Partial<InsertSite>): Promise<Site>;
  deleteSite(id: string): Promise<void>;
  
  // Site metrics operations
  createSiteMetric(metric: InsertSiteMetric): Promise<SiteMetric>;
  getSiteMetrics(siteId: string): Promise<SiteMetric[]>;
  getAllSiteMetrics(): Promise<SiteMetric[]>;
  getSiteMetricsByType(siteId: string, metricType: string): Promise<SiteMetric[]>;
  
  // Chat operations
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  getUserChatSessions(userId: string): Promise<ChatSession[]>;
  getChatSession(sessionId: string): Promise<ChatSession | undefined>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getSessionMessages(sessionId: string): Promise<ChatMessage[]>;
  updateChatSessionTimestamp(sessionId: string): Promise<void>;
  
  // Integration logs
  createIntegrationLog(log: InsertIntegrationLog): Promise<IntegrationLog>;
  getIntegrationLogs(userId?: string, service?: string): Promise<IntegrationLog[]>;
  
  // MCP tools
  getMcpTools(): Promise<McpTool[]>;
  getMcpTool(name: string): Promise<McpTool | undefined>;
  createMcpTool(tool: InsertMcpTool): Promise<McpTool>;
  updateMcpTool(id: string, updates: Partial<InsertMcpTool>): Promise<McpTool>;
  
  // Snapshots
  createSnapshot(snapshot: InsertSnapshot): Promise<Snapshot>;
  getUserSnapshots(userId: string, tool?: string): Promise<Snapshot[]>;
  deleteSnapshot(id: string, userId: string): Promise<void>;
  
  // Memory operations
  createMemoryShort(memory: InsertMemoryShort): Promise<MemoryShort>;
  getMemoryShort(userId: string, sessionId?: string): Promise<MemoryShort[]>;
  deleteExpiredMemoryShort(): Promise<void>;
  deleteMemoryShort(id: string): Promise<void>;
  getExpiredShortTermMemory(): Promise<MemoryShort[]>;
  
  createMemoryLong(memory: InsertMemoryLong): Promise<MemoryLong>;
  getMemoryLong(userId: string, category?: string): Promise<MemoryLong[]>;
  updateMemoryLong(id: string, updates: Partial<InsertMemoryLong>): Promise<MemoryLong>;
  
  // Agent prompts
  createAgentPrompt(prompt: InsertAgentPrompt): Promise<AgentPrompt>;
  getAgentPrompts(userId?: string, type?: string): Promise<AgentPrompt[]>;
  updateAgentPrompt(id: string, updates: Partial<InsertAgentPrompt>): Promise<AgentPrompt>;
  deleteAgentPrompt(id: string): Promise<void>;
  
  // Agent attachments
  createAgentAttachment(attachment: InsertAgentAttachment): Promise<AgentAttachment>;
  getSessionAttachments(sessionId: string): Promise<AgentAttachment[]>;
  deleteAgentAttachment(id: string): Promise<void>;
  
  // Agent context
  createAgentContext(context: InsertAgentContext): Promise<AgentContext>;
  getSessionContext(sessionId: string): Promise<AgentContext[]>;
  updateAgentContext(id: string, updates: Partial<InsertAgentContext>): Promise<AgentContext>;
  deleteExpiredContext(): Promise<void>;
  
  // Agent decisions
  createAgentDecision(decision: InsertAgentDecision): Promise<AgentDecision>;
  getSessionDecisions(sessionId: string): Promise<AgentDecision[]>;
  getUserDecisions(userId: string, limit?: number): Promise<AgentDecision[]>;
  
  // Market Intelligence operations
  createMarketIntelligence(intelligence: InsertMarketIntelligence): Promise<MarketIntelligence>;
  getMarketIntelligence(limit?: number, category?: string): Promise<MarketIntelligence[]>;
  getMarketIntelligenceByPriority(minPriority?: number): Promise<MarketIntelligence[]>;
  updateMarketIntelligence(id: string, updates: Partial<InsertMarketIntelligence>): Promise<MarketIntelligence>;
  deleteExpiredMarketIntelligence(): Promise<void>;
  markMarketIntelligenceProcessed(id: string): Promise<void>;
  
  // Agent Execution operations
  createAgentExecution(execution: InsertAgentExecution): Promise<AgentExecution>;
  getAgentExecutions(agentName?: string, status?: string): Promise<AgentExecution[]>;
  updateAgentExecution(id: string, updates: Partial<InsertAgentExecution>): Promise<AgentExecution>;
  getScheduledAgentExecutions(): Promise<AgentExecution[]>;
  
  // Competitor intelligence operations
  createCompetitorSignal(signal: InsertCompetitorSignal): Promise<CompetitorSignal>;
  getCompetitorSignals(filters?: { jurisdiction?: string; type?: string; competitorMatch?: string; limit?: number }): Promise<CompetitorSignal[]>;
  getRecentSignals(days?: number): Promise<CompetitorSignal[]>;
  updateCompetitorSignal(id: string, updates: Partial<InsertCompetitorSignal>): Promise<CompetitorSignal>;
  
  // Scrape job operations
  createScrapeJob(job: InsertScrapeJob): Promise<ScrapeJob>;
  getScrapeJob(id: string): Promise<ScrapeJob | undefined>;
  updateScrapeJob(id: string, updates: Partial<InsertScrapeJob>): Promise<ScrapeJob>;
  getActiveScrapeJobs(): Promise<ScrapeJob[]>;
  
  // Competitor entity operations
  createCompetitorEntity(entity: InsertCompetitorEntity): Promise<CompetitorEntity>;
  getCompetitorEntities(active?: boolean): Promise<CompetitorEntity[]>;
  getCompetitorEntity(id: string): Promise<CompetitorEntity | undefined>;
  updateCompetitorEntity(id: string, updates: Partial<InsertCompetitorEntity>): Promise<CompetitorEntity>;
  
  // Jurisdiction operations
  createGeoJurisdiction(jurisdiction: InsertGeoJurisdiction): Promise<GeoJurisdiction>;
  getGeoJurisdictions(active?: boolean): Promise<GeoJurisdiction[]>;
  getGeoJurisdiction(key: string): Promise<GeoJurisdiction | undefined>;
  updateGeoJurisdiction(key: string, updates: Partial<InsertGeoJurisdiction>): Promise<GeoJurisdiction>;
  
  // Competitor analysis operations
  createCompetitorAnalysis(analysis: InsertCompetitorAnalysis): Promise<CompetitorAnalysis>;
  getCompetitorAnalyses(competitorId?: string, limit?: number): Promise<CompetitorAnalysis[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Site operations
  async createSite(site: InsertSite): Promise<Site> {
    const [newSite] = await db.insert(sites).values(site).returning();
    return newSite;
  }

  async getSite(id: string): Promise<Site | undefined> {
    const [site] = await db.select().from(sites).where(eq(sites.id, id));
    return site;
  }

  async getAllSites(): Promise<Site[]> {
    return await db.select().from(sites).orderBy(desc(sites.createdAt));
  }

  async getUserSites(userId: string): Promise<Site[]> {
    // For now, return all sites since ownerId might be null for existing data
    // TODO: Filter by userId when ownerId is properly populated
    return await db.select().from(sites).orderBy(desc(sites.createdAt));
  }

  async updateSite(id: string, updates: Partial<InsertSite>): Promise<Site> {
    const [updatedSite] = await db
      .update(sites)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(sites.id, id))
      .returning();
    return updatedSite;
  }

  async deleteSite(id: string): Promise<void> {
    await db.delete(sites).where(eq(sites.id, id));
  }

  // Site metrics operations
  async createSiteMetric(metric: InsertSiteMetric): Promise<SiteMetric> {
    const [newMetric] = await db.insert(siteMetrics).values(metric).returning();
    return newMetric;
  }

  async getSiteMetrics(siteId: string): Promise<SiteMetric[]> {
    return await db.select().from(siteMetrics).where(eq(siteMetrics.siteId, siteId));
  }

  async getAllSiteMetrics(): Promise<SiteMetric[]> {
    return await db.select().from(siteMetrics).orderBy(desc(siteMetrics.createdAt));
  }

  async getSiteMetricsByType(siteId: string, metricType: string): Promise<SiteMetric[]> {
    return await db
      .select()
      .from(siteMetrics)
      .where(and(eq(siteMetrics.siteId, siteId), eq(siteMetrics.metricType, metricType)));
  }

  // Chat operations
  async createChatSession(session: InsertChatSession): Promise<ChatSession> {
    const [newSession] = await db.insert(chatSessions).values(session).returning();
    return newSession;
  }

  async getUserChatSessions(userId: string): Promise<ChatSession[]> {
    return await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.userId, userId))
      .orderBy(desc(chatSessions.lastMessageAt));
  }

  async getChatSession(sessionId: string): Promise<ChatSession | undefined> {
    const [session] = await db.select().from(chatSessions).where(eq(chatSessions.id, sessionId));
    return session;
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db.insert(chatMessages).values(message).returning();
    
    // Update session timestamp
    await this.updateChatSessionTimestamp(message.sessionId);
    
    return newMessage;
  }

  async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(chatMessages.createdAt);
  }

  async updateChatSessionTimestamp(sessionId: string): Promise<void> {
    await db
      .update(chatSessions)
      .set({ lastMessageAt: new Date() })
      .where(eq(chatSessions.id, sessionId));
  }

  // Integration logs
  async createIntegrationLog(log: InsertIntegrationLog): Promise<IntegrationLog> {
    const [newLog] = await db.insert(integrationLogs).values(log).returning();
    return newLog;
  }

  async getIntegrationLogs(userId?: string, service?: string): Promise<IntegrationLog[]> {
    const conditions = [];
    if (userId) conditions.push(eq(integrationLogs.userId, userId));
    if (service) conditions.push(eq(integrationLogs.service, service));

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    return await db
      .select()
      .from(integrationLogs)
      .where(whereCondition)
      .orderBy(desc(integrationLogs.createdAt))
      .limit(100);
  }

  // MCP tools
  async getMcpTools(): Promise<McpTool[]> {
    return await db.select().from(mcpTools).where(eq(mcpTools.enabled, true));
  }

  async getMcpTool(name: string): Promise<McpTool | undefined> {
    const [tool] = await db.select().from(mcpTools).where(eq(mcpTools.name, name));
    return tool;
  }

  async createMcpTool(tool: InsertMcpTool): Promise<McpTool> {
    const [newTool] = await db.insert(mcpTools).values(tool).returning();
    return newTool;
  }

  async updateMcpTool(id: string, updates: Partial<InsertMcpTool>): Promise<McpTool> {
    const [updatedTool] = await db
      .update(mcpTools)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(mcpTools.id, id))
      .returning();
    return updatedTool;
  }

  // Snapshots
  async createSnapshot(snapshot: InsertSnapshot): Promise<Snapshot> {
    const [newSnapshot] = await db.insert(snapshots).values(snapshot).returning();
    return newSnapshot;
  }

  async getUserSnapshots(userId: string, tool?: string): Promise<Snapshot[]> {
    const conditions = [eq(snapshots.userId, userId)];
    if (tool) conditions.push(eq(snapshots.tool, tool));

    const whereCondition = conditions.length > 1 ? and(...conditions) : conditions[0];

    return await db
      .select()
      .from(snapshots)
      .where(whereCondition)
      .orderBy(desc(snapshots.createdAt));
  }

  async deleteSnapshot(id: string, userId: string): Promise<void> {
    await db
      .delete(snapshots)
      .where(and(eq(snapshots.id, id), eq(snapshots.userId, userId)));
  }

  // Memory operations
  async createMemoryShort(memory: InsertMemoryShort): Promise<MemoryShort> {
    const [newMemory] = await db.insert(memoryShort).values(memory).returning();
    return newMemory;
  }

  async getMemoryShort(userId: string, sessionId?: string): Promise<MemoryShort[]> {
    const conditions = [eq(memoryShort.userId, userId)];
    if (sessionId) conditions.push(eq(memoryShort.sessionId, sessionId));
    
    return await db
      .select()
      .from(memoryShort)
      .where(conditions.length > 1 ? and(...conditions) : conditions[0])
      .orderBy(desc(memoryShort.createdAt));
  }

  async deleteExpiredMemoryShort(): Promise<void> {
    await db
      .delete(memoryShort)
      .where(sql`${memoryShort.expiresAt} IS NOT NULL AND ${memoryShort.expiresAt} < NOW()`);
  }

  async deleteMemoryShort(id: string): Promise<void> {
    await db.delete(memoryShort).where(eq(memoryShort.id, id));
  }

  async getExpiredShortTermMemory(): Promise<MemoryShort[]> {
    return await db
      .select()
      .from(memoryShort)
      .where(sql`${memoryShort.expiresAt} IS NOT NULL AND ${memoryShort.expiresAt} < NOW()`);
  }

  async createMemoryLong(memory: InsertMemoryLong): Promise<MemoryLong> {
    const [newMemory] = await db.insert(memoryLong).values(memory).returning();
    return newMemory;
  }

  async getMemoryLong(userId: string, category?: string): Promise<MemoryLong[]> {
    const conditions = [eq(memoryLong.userId, userId)];
    if (category) conditions.push(eq(memoryLong.category, category));
    
    return await db
      .select()
      .from(memoryLong)
      .where(conditions.length > 1 ? and(...conditions) : conditions[0])
      .orderBy(desc(memoryLong.confidence), desc(memoryLong.lastUsed));
  }

  async updateMemoryLong(id: string, updates: Partial<InsertMemoryLong>): Promise<MemoryLong> {
    const [updated] = await db
      .update(memoryLong)
      .set({ ...updates, updatedAt: new Date(), lastUsed: new Date() })
      .where(eq(memoryLong.id, id))
      .returning();
    return updated;
  }

  // Agent prompts
  async createAgentPrompt(prompt: InsertAgentPrompt): Promise<AgentPrompt> {
    const [newPrompt] = await db.insert(agentPrompts).values(prompt).returning();
    return newPrompt;
  }

  async getAgentPrompts(userId?: string, type?: string): Promise<AgentPrompt[]> {
    const conditions = [];
    if (userId) conditions.push(eq(agentPrompts.userId, userId));
    if (type) conditions.push(eq(agentPrompts.type, type));
    conditions.push(eq(agentPrompts.active, true));
    
    return await db
      .select()
      .from(agentPrompts)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(agentPrompts.priority), agentPrompts.createdAt);
  }

  async updateAgentPrompt(id: string, updates: Partial<InsertAgentPrompt>): Promise<AgentPrompt> {
    const [updated] = await db
      .update(agentPrompts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(agentPrompts.id, id))
      .returning();
    return updated;
  }

  async deleteAgentPrompt(id: string): Promise<void> {
    await db.delete(agentPrompts).where(eq(agentPrompts.id, id));
  }

  // Agent attachments
  async createAgentAttachment(attachment: InsertAgentAttachment): Promise<AgentAttachment> {
    const [newAttachment] = await db.insert(agentAttachments).values(attachment).returning();
    return newAttachment;
  }

  async getSessionAttachments(sessionId: string): Promise<AgentAttachment[]> {
    return await db
      .select()
      .from(agentAttachments)
      .where(eq(agentAttachments.sessionId, sessionId))
      .orderBy(desc(agentAttachments.createdAt));
  }

  async deleteAgentAttachment(id: string): Promise<void> {
    await db.delete(agentAttachments).where(eq(agentAttachments.id, id));
  }

  // Agent context
  async createAgentContext(context: InsertAgentContext): Promise<AgentContext> {
    const [newContext] = await db.insert(agentContext).values(context).returning();
    return newContext;
  }

  async getSessionContext(sessionId: string): Promise<AgentContext[]> {
    return await db
      .select()
      .from(agentContext)
      .where(eq(agentContext.sessionId, sessionId))
      .orderBy(desc(agentContext.relevance), desc(agentContext.createdAt));
  }

  async updateAgentContext(id: string, updates: Partial<InsertAgentContext>): Promise<AgentContext> {
    const [updated] = await db
      .update(agentContext)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(agentContext.id, id))
      .returning();
    return updated;
  }

  async deleteExpiredContext(): Promise<void> {
    await db
      .delete(agentContext)
      .where(sql`${agentContext.expiresAt} IS NOT NULL AND ${agentContext.expiresAt} < NOW()`);
  }

  // Agent decisions
  async createAgentDecision(decision: InsertAgentDecision): Promise<AgentDecision> {
    const [newDecision] = await db.insert(agentDecisions).values(decision).returning();
    return newDecision;
  }

  async getSessionDecisions(sessionId: string): Promise<AgentDecision[]> {
    return await db
      .select()
      .from(agentDecisions)
      .where(eq(agentDecisions.sessionId, sessionId))
      .orderBy(desc(agentDecisions.createdAt));
  }

  async getUserDecisions(userId: string, limit: number = 100): Promise<AgentDecision[]> {
    return await db
      .select()
      .from(agentDecisions)
      .where(eq(agentDecisions.userId, userId))
      .orderBy(desc(agentDecisions.createdAt))
      .limit(limit);
  }

  // Market Intelligence operations
  async createMarketIntelligence(intelligence: InsertMarketIntelligence): Promise<MarketIntelligence> {
    const [newIntelligence] = await db.insert(marketIntelligence).values(intelligence).returning();
    return newIntelligence;
  }

  async getMarketIntelligence(limit: number = 50, category?: string): Promise<MarketIntelligence[]> {
    if (category) {
      return await db
        .select()
        .from(marketIntelligence)
        .where(eq(marketIntelligence.category, category))
        .orderBy(desc(marketIntelligence.priority), desc(marketIntelligence.createdAt))
        .limit(limit);
    }

    return await db
      .select()
      .from(marketIntelligence)
      .orderBy(desc(marketIntelligence.priority), desc(marketIntelligence.createdAt))
      .limit(limit);
  }

  async getMarketIntelligenceByPriority(minPriority: number = 7): Promise<MarketIntelligence[]> {
    return await db
      .select()
      .from(marketIntelligence)
      .where(sql`${marketIntelligence.priority} >= ${minPriority}`)
      .orderBy(desc(marketIntelligence.priority), desc(marketIntelligence.createdAt));
  }

  async updateMarketIntelligence(id: string, updates: Partial<InsertMarketIntelligence>): Promise<MarketIntelligence> {
    const [updated] = await db
      .update(marketIntelligence)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(marketIntelligence.id, id))
      .returning();
    return updated;
  }

  async deleteExpiredMarketIntelligence(): Promise<void> {
    await db
      .delete(marketIntelligence)
      .where(sql`${marketIntelligence.expiresAt} IS NOT NULL AND ${marketIntelligence.expiresAt} < NOW()`);
  }

  async markMarketIntelligenceProcessed(id: string): Promise<void> {
    await db
      .update(marketIntelligence)
      .set({ processed: true, updatedAt: new Date() })
      .where(eq(marketIntelligence.id, id));
  }

  // Agent Execution operations
  async createAgentExecution(execution: InsertAgentExecution): Promise<AgentExecution> {
    const [newExecution] = await db.insert(agentExecutions).values(execution).returning();
    return newExecution;
  }

  async getAgentExecutions(agentName?: string, status?: string): Promise<AgentExecution[]> {
    const conditions = [];
    if (agentName) {
      conditions.push(eq(agentExecutions.agentName, agentName));
    }
    if (status) {
      conditions.push(eq(agentExecutions.status, status));
    }

    if (conditions.length > 0) {
      return await db
        .select()
        .from(agentExecutions)
        .where(and(...conditions))
        .orderBy(desc(agentExecutions.startedAt));
    }

    return await db
      .select()
      .from(agentExecutions)
      .orderBy(desc(agentExecutions.startedAt));
  }

  async updateAgentExecution(id: string, updates: Partial<InsertAgentExecution>): Promise<AgentExecution> {
    const [updated] = await db
      .update(agentExecutions)
      .set(updates)
      .where(eq(agentExecutions.id, id))
      .returning();
    return updated;
  }

  async getScheduledAgentExecutions(): Promise<AgentExecution[]> {
    return await db
      .select()
      .from(agentExecutions)
      .where(sql`${agentExecutions.nextScheduledAt} IS NOT NULL AND ${agentExecutions.nextScheduledAt} <= NOW()`)
      .orderBy(agentExecutions.nextScheduledAt);
  }

  // Competitor intelligence operations
  async createCompetitorSignal(signal: InsertCompetitorSignal): Promise<CompetitorSignal> {
    const [newSignal] = await db.insert(competitorSignals).values(signal).returning();
    return newSignal;
  }

  async getCompetitorSignals(filters?: { 
    jurisdiction?: string; 
    type?: string; 
    competitorMatch?: string; 
    limit?: number 
  }): Promise<CompetitorSignal[]> {
    const conditions = [];
    if (filters?.jurisdiction) {
      conditions.push(eq(competitorSignals.jurisdiction, filters.jurisdiction));
    }
    if (filters?.type) {
      conditions.push(eq(competitorSignals.type, filters.type));
    }
    if (filters?.competitorMatch) {
      conditions.push(eq(competitorSignals.competitorMatch, filters.competitorMatch));
    }

    let query = db.select().from(competitorSignals);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    query = query.orderBy(desc(competitorSignals.whenIso)) as any;
    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }

    return await query;
  }

  async getRecentSignals(days: number = 7): Promise<CompetitorSignal[]> {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);
    
    return await db
      .select()
      .from(competitorSignals)
      .where(gte(competitorSignals.whenIso, daysAgo))
      .orderBy(desc(competitorSignals.whenIso));
  }

  async updateCompetitorSignal(id: string, updates: Partial<InsertCompetitorSignal>): Promise<CompetitorSignal> {
    const [updated] = await db
      .update(competitorSignals)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(competitorSignals.id, id))
      .returning();
    return updated;
  }

  // Scrape job operations
  async createScrapeJob(job: InsertScrapeJob): Promise<ScrapeJob> {
    const [newJob] = await db.insert(scrapeJobs).values(job).returning();
    return newJob;
  }

  async getScrapeJob(id: string): Promise<ScrapeJob | undefined> {
    const [job] = await db.select().from(scrapeJobs).where(eq(scrapeJobs.id, id));
    return job;
  }

  async updateScrapeJob(id: string, updates: Partial<InsertScrapeJob>): Promise<ScrapeJob> {
    const [updated] = await db
      .update(scrapeJobs)
      .set(updates)
      .where(eq(scrapeJobs.id, id))
      .returning();
    return updated;
  }

  async getActiveScrapeJobs(): Promise<ScrapeJob[]> {
    return await db
      .select()
      .from(scrapeJobs)
      .where(sql`${scrapeJobs.status} IN ('queued', 'running')`)
      .orderBy(desc(scrapeJobs.createdAt));
  }

  // Competitor entity operations
  async createCompetitorEntity(entity: InsertCompetitorEntity): Promise<CompetitorEntity> {
    const [newEntity] = await db.insert(competitorEntities).values(entity).returning();
    return newEntity;
  }

  async getCompetitorEntities(active: boolean = true): Promise<CompetitorEntity[]> {
    if (active) {
      return await db
        .select()
        .from(competitorEntities)
        .where(eq(competitorEntities.active, true))
        .orderBy(competitorEntities.name);
    }
    return await db.select().from(competitorEntities).orderBy(competitorEntities.name);
  }

  async getCompetitorEntity(id: string): Promise<CompetitorEntity | undefined> {
    const [entity] = await db.select().from(competitorEntities).where(eq(competitorEntities.id, id));
    return entity;
  }

  async updateCompetitorEntity(id: string, updates: Partial<InsertCompetitorEntity>): Promise<CompetitorEntity> {
    const [updated] = await db
      .update(competitorEntities)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(competitorEntities.id, id))
      .returning();
    return updated;
  }

  async upsertCompetitorEntity(entity: InsertCompetitorEntity): Promise<CompetitorEntity> {
    const [existing] = await db
      .select()
      .from(competitorEntities)
      .where(eq(competitorEntities.name, entity.name));
    
    if (existing) {
      return await this.updateCompetitorEntity(existing.id, entity);
    }
    return await this.createCompetitorEntity(entity);
  }

  // Jurisdiction operations
  async createGeoJurisdiction(jurisdiction: InsertGeoJurisdiction): Promise<GeoJurisdiction> {
    const [newJurisdiction] = await db.insert(geoJurisdictions).values(jurisdiction).returning();
    return newJurisdiction;
  }

  async upsertGeoJurisdiction(jurisdiction: InsertGeoJurisdiction): Promise<GeoJurisdiction> {
    const existing = await this.getGeoJurisdiction(jurisdiction.key);
    if (existing) {
      return await this.updateGeoJurisdiction(jurisdiction.key, jurisdiction);
    }
    return await this.createGeoJurisdiction(jurisdiction);
  }

  async getGeoJurisdictions(active: boolean = true): Promise<GeoJurisdiction[]> {
    if (active) {
      return await db
        .select()
        .from(geoJurisdictions)
        .where(eq(geoJurisdictions.active, true))
        .orderBy(geoJurisdictions.label);
    }
    return await db.select().from(geoJurisdictions).orderBy(geoJurisdictions.label);
  }

  async getGeoJurisdiction(key: string): Promise<GeoJurisdiction | undefined> {
    const [jurisdiction] = await db.select().from(geoJurisdictions).where(eq(geoJurisdictions.key, key));
    return jurisdiction;
  }

  async updateGeoJurisdiction(key: string, updates: Partial<InsertGeoJurisdiction>): Promise<GeoJurisdiction> {
    const [updated] = await db
      .update(geoJurisdictions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(geoJurisdictions.key, key))
      .returning();
    return updated;
  }

  // Competitor analysis operations
  async createCompetitorAnalysis(analysis: InsertCompetitorAnalysis): Promise<CompetitorAnalysis> {
    const [newAnalysis] = await db.insert(competitorAnalysis).values(analysis).returning();
    return newAnalysis;
  }

  async getCompetitorAnalyses(competitorId?: string, limit: number = 50): Promise<CompetitorAnalysis[]> {
    if (competitorId) {
      return await db
        .select()
        .from(competitorAnalysis)
        .where(eq(competitorAnalysis.competitorId, competitorId))
        .orderBy(desc(competitorAnalysis.createdAt))
        .limit(limit);
    }
    return await db
      .select()
      .from(competitorAnalysis)
      .orderBy(desc(competitorAnalysis.createdAt))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
