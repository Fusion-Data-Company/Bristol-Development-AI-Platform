import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  real,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Site Intelligence Tables
export const sites = pgTable("sites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  address: text("address").notNull(),
  city: varchar("city").notNull(),
  state: varchar("state").notNull(),
  zipCode: varchar("zip_code").notNull(),
  latitude: real("latitude"),
  longitude: real("longitude"),
  acreage: real("acreage"),
  zoning: varchar("zoning"),
  status: varchar("status").notNull().default("active"), // active, under_review, archived
  bristolScore: integer("bristol_score"), // 1-100 Bristol methodology score
  ownerId: varchar("owner_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const siteMetrics = pgTable("site_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  siteId: varchar("site_id").references(() => sites.id).notNull(),
  metricType: varchar("metric_type").notNull(), // demographic, economic, housing, etc.
  metricName: varchar("metric_name").notNull(),
  value: real("value").notNull(),
  unit: varchar("unit"), // percentage, dollars, count, etc.
  source: varchar("source").notNull(), // census_acs, hud_fmr, bls, fema, arcgis
  dataDate: timestamp("data_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatSessions = pgTable("chat_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: varchar("title"),
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => chatSessions.id).notNull(),
  role: varchar("role").notNull(), // user, assistant, system
  content: text("content").notNull(),
  metadata: jsonb("metadata"), // tool calls, function results, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

export const integrationLogs = pgTable("integration_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  service: varchar("service").notNull(), // apify, n8n, microsoft365, arcgis
  action: varchar("action").notNull(),
  payload: jsonb("payload"),
  response: jsonb("response"),
  status: varchar("status").notNull(), // success, error, pending
  error: text("error"),
  userId: varchar("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const mcpTools = pgTable("mcp_tools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  description: text("description"),
  schema: jsonb("schema").notNull(),
  enabled: boolean("enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

export const insertSiteSchema = createInsertSchema(sites).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSiteMetricSchema = createInsertSchema(siteMetrics).omit({
  id: true,
  createdAt: true,
});

export const insertChatSessionSchema = createInsertSchema(chatSessions).omit({
  id: true,
  lastMessageAt: true,
  createdAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertIntegrationLogSchema = createInsertSchema(integrationLogs).omit({
  id: true,
  createdAt: true,
});

export const insertMcpToolSchema = createInsertSchema(mcpTools).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Site = typeof sites.$inferSelect;
export type InsertSite = z.infer<typeof insertSiteSchema>;
export type SiteMetric = typeof siteMetrics.$inferSelect;
export type InsertSiteMetric = z.infer<typeof insertSiteMetricSchema>;
export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type IntegrationLog = typeof integrationLogs.$inferSelect;
export type InsertIntegrationLog = z.infer<typeof insertIntegrationLogSchema>;
export type McpTool = typeof mcpTools.$inferSelect;
export type InsertMcpTool = z.infer<typeof insertMcpToolSchema>;
