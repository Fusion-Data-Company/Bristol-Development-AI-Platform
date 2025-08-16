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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

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
}

export const storage = new DatabaseStorage();
