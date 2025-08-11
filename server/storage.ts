import {
  users,
  sites,
  siteMetrics,
  chatSessions,
  chatMessages,
  integrationLogs,
  mcpTools,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Site operations
  createSite(site: InsertSite): Promise<Site>;
  getSite(id: string): Promise<Site | undefined>;
  getUserSites(userId: string): Promise<Site[]>;
  updateSite(id: string, updates: Partial<InsertSite>): Promise<Site>;
  deleteSite(id: string): Promise<void>;
  
  // Site metrics operations
  createSiteMetric(metric: InsertSiteMetric): Promise<SiteMetric>;
  getSiteMetrics(siteId: string): Promise<SiteMetric[]>;
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

  async getUserSites(userId: string): Promise<Site[]> {
    return await db.select().from(sites).where(eq(sites.ownerId, userId)).orderBy(desc(sites.createdAt));
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
}

export const storage = new DatabaseStorage();
