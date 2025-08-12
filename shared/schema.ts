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

// Site Intelligence Tables - Bristol Development Format
export const sites = pgTable("sites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").references(() => users.id),
  status: varchar("status").notNull().default("Completed"), // Operating, Pipeline, Completed, Newest, Other
  name: varchar("name").notNull(),
  addrLine1: text("addr_line1"),
  addrLine2: text("addr_line2"),
  city: varchar("city"),
  state: varchar("state"),
  postalCode: varchar("postal_code"),
  country: varchar("country").default("USA"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  acreage: real("acreage"),
  unitsTotal: integer("units_total"),
  units1b: integer("units_1b"),
  units2b: integer("units_2b"),
  units3b: integer("units_3b"),
  avgSf: real("avg_sf"),
  completionYear: integer("completion_year"),
  parkingSpaces: integer("parking_spaces"),
  sourceUrl: text("source_url"),
  notes: text("notes"),
  // ACS Demographics fields
  fipsState: text("fips_state"),
  fipsCounty: text("fips_county"),
  geoidTract: text("geoid_tract"),
  acsYear: text("acs_year"),
  acsProfile: jsonb("acs_profile"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_sites_name").on(table.name),
  index("idx_sites_city_state").on(table.city, table.state),
  index("idx_sites_geo").on(table.latitude, table.longitude),
]);

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

// Comps table for comparable property analysis
export const comps = pgTable("comps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  siteId: varchar("site_id").references(() => sites.id),
  name: varchar("name").notNull(),
  address: text("address").notNull(),
  distance: real("distance"), // miles from site
  units: integer("units"),
  yearBuilt: integer("year_built"),
  rentMin: real("rent_min"),
  rentMax: real("rent_max"),
  rentAvg: real("rent_avg"),
  occupancyRate: real("occupancy_rate"), // percentage
  amenities: jsonb("amenities"), // array of amenity features
  concessions: jsonb("concessions"), // current concession offers
  score: integer("score"), // 1-100 Bristol methodology score
  scoreBreakdown: jsonb("score_breakdown"), // detailed scoring by category
  source: varchar("source"), // apartments.com, apify, manual
  dataDate: timestamp("data_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Concessions table for tracking incentives
export const concessions = pgTable("concessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  compId: varchar("comp_id").references(() => comps.id),
  type: varchar("type").notNull(), // free_rent, reduced_deposit, waived_fees
  description: text("description"),
  value: real("value"), // dollar value or months
  validUntil: timestamp("valid_until"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Properties table for detailed property information
export const properties = pgTable("properties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  siteId: varchar("site_id").references(() => sites.id),
  parcelNumber: varchar("parcel_number"),
  ownerName: varchar("owner_name"),
  assessedValue: real("assessed_value"),
  taxAmount: real("tax_amount"),
  landUse: varchar("land_use"),
  buildingArea: real("building_area"), // square feet
  yearBuilt: integer("year_built"),
  source: varchar("source"), // county_assessor, arcgis, manual
  dataDate: timestamp("data_date"),
  // ACS Demographics fields
  fipsState: text("fips_state"),
  fipsCounty: text("fips_county"),
  geoidTract: text("geoid_tract"),
  acsYear: text("acs_year"),
  acsProfile: jsonb("acs_profile"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Runs table for tracking data collection runs
export const runs = pgTable("runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type").notNull(), // apify, census, hud, arcgis, n8n
  status: varchar("status").notNull(), // pending, running, completed, failed
  input: jsonb("input"),
  output: jsonb("output"),
  error: text("error"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Files table for uploaded documents
export const files = pgTable("files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  siteId: varchar("site_id").references(() => sites.id),
  fileName: varchar("file_name").notNull(),
  fileType: varchar("file_type").notNull(), // kml, kmz, pdf, xlsx, csv
  fileSize: integer("file_size"), // bytes
  url: text("url"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Short-term memory for AI context
export const memoryShort = pgTable("memory_short", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  sessionId: varchar("session_id").references(() => chatSessions.id),
  key: varchar("key").notNull(),
  value: jsonb("value").notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Long-term memory for AI learning
export const memoryLong = pgTable("memory_long", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  category: varchar("category").notNull(), // preferences, patterns, insights
  key: varchar("key").notNull(),
  value: jsonb("value").notNull(),
  confidence: real("confidence"), // 0-1 confidence score
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tools registry for external integrations
export const tools = pgTable("tools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  baseUrl: text("base_url").notNull(),
  apiKey: text("api_key"), // encrypted
  notes: text("notes"),
  enabled: boolean("enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Snapshots table for saving tool results
export const snapshots = pgTable("snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  tool: varchar("tool").notNull(), // bls, bea, hud
  params: jsonb("params").notNull(),
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
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

export const updateSiteSchema = insertSiteSchema.partial();

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

export const insertCompSchema = createInsertSchema(comps).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertConcessionSchema = createInsertSchema(concessions).omit({
  id: true,
  createdAt: true,
});

export const insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
  createdAt: true,
});

export const insertRunSchema = createInsertSchema(runs).omit({
  id: true,
  createdAt: true,
});

export const insertFileSchema = createInsertSchema(files).omit({
  id: true,
  createdAt: true,
});

export const insertMemoryShortSchema = createInsertSchema(memoryShort).omit({
  id: true,
  createdAt: true,
});

export const insertMemoryLongSchema = createInsertSchema(memoryLong).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertToolSchema = createInsertSchema(tools).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSnapshotSchema = createInsertSchema(snapshots).omit({
  id: true,
  createdAt: true,
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
export type Comp = typeof comps.$inferSelect;
export type InsertComp = z.infer<typeof insertCompSchema>;
export type Concession = typeof concessions.$inferSelect;
export type InsertConcession = z.infer<typeof insertConcessionSchema>;
export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Run = typeof runs.$inferSelect;
export type InsertRun = z.infer<typeof insertRunSchema>;
export type File = typeof files.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;
export type MemoryShort = typeof memoryShort.$inferSelect;
export type InsertMemoryShort = z.infer<typeof insertMemoryShortSchema>;
export type MemoryLong = typeof memoryLong.$inferSelect;
export type InsertMemoryLong = z.infer<typeof insertMemoryLongSchema>;
export type Tool = typeof tools.$inferSelect;
export type InsertTool = z.infer<typeof insertToolSchema>;
export type Snapshot = typeof snapshots.$inferSelect;
export type InsertSnapshot = z.infer<typeof insertSnapshotSchema>;
