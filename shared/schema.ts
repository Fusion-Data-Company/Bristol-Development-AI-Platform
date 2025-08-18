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
  bristolScore: real("bristol_score"), // Bristol 100-point scoring methodology
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

// Bristol team members for Cap verification
export const bristolUsers = pgTable("bristol_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  email: varchar("email").unique(),
  role: varchar("role").notNull(),
  department: varchar("department"),
  accessLevel: varchar("access_level").default("standard"), // admin, full, standard
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_bristol_users_name").on(table.name),
  index("idx_bristol_users_email").on(table.email),
]);

// Conversation sessions for Cap's state management
export const conversationSessions = pgTable("conversation_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => bristolUsers.id),
  conversationId: varchar("conversation_id").notNull().unique(),
  summary: text("summary"),
  tags: text("tags").array(), // Array of tags
  context: jsonb("context"), // Full context data
  status: varchar("status").default("active"),
  startedAt: timestamp("started_at").defaultNow(),
  lastActive: timestamp("last_active").defaultNow(),
  endedAt: timestamp("ended_at"),
}, (table) => [
  index("idx_conversation_sessions_user").on(table.userId),
  index("idx_conversation_sessions_id").on(table.conversationId),
]);

// MCP tool execution logs for monitoring
export const mcpToolExecutions = pgTable("mcp_tool_executions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => conversationSessions.conversationId),
  toolName: varchar("tool_name").notNull(),
  inputParams: jsonb("input_params"),
  outputData: jsonb("output_data"),
  executionTimeMs: integer("execution_time_ms"),
  status: varchar("status"), // success, error, timeout
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Analytics cache for performance
export const analyticsCache = pgTable("analytics_cache", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  queryHash: varchar("query_hash").notNull().unique(),
  queryType: varchar("query_type").notNull(),
  data: jsonb("data").notNull(),
  metadata: jsonb("metadata"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_analytics_cache_hash").on(table.queryHash),
  index("idx_analytics_cache_expires").on(table.expiresAt),
]);

// Document artifacts storage for Cap
export const artifacts = pgTable("artifacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => bristolUsers.id),
  conversationId: varchar("conversation_id"),
  type: varchar("type").notNull(), // memo, report, email_draft, etc.
  content: text("content").notNull(),
  metadata: jsonb("metadata"),
  version: integer("version").default(1),
  parentId: varchar("parent_id"), // For versioning
  createdAt: timestamp("created_at").defaultNow(),
});

// Task management for Cap
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id"),
  userId: varchar("user_id").references(() => bristolUsers.id),
  title: varchar("title").notNull(),
  description: text("description"),
  priority: varchar("priority"), // P0, P1, P2, P3
  status: varchar("status").default("pending"),
  owner: varchar("owner"),
  dueDate: timestamp("due_date"),
  dependencies: jsonb("dependencies"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Market Intelligence entries for live updates
export const marketIntelligence = pgTable("market_intelligence", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  source: varchar("source").notNull(), // news outlet, report, etc.
  sourceUrl: text("source_url"),
  category: varchar("category").notNull(), // monetary_policy, demographics, development, capital_markets, regulatory, etc.
  impact: varchar("impact").notNull(), // high, medium, low
  priority: integer("priority").notNull().default(5), // 1-10, higher is more urgent
  bristolImplication: text("bristol_implication"),
  actionRequired: boolean("action_required").default(false),
  expiresAt: timestamp("expires_at"),
  processed: boolean("processed").default(false),
  agentSource: varchar("agent_source"), // which agent/system generated this
  metadata: jsonb("metadata"), // additional data like citations, analysis, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_market_intelligence_category").on(table.category),
  index("idx_market_intelligence_priority").on(table.priority),
  index("idx_market_intelligence_created").on(table.createdAt),
  index("idx_market_intelligence_expires").on(table.expiresAt),
]);

// Agent execution logs for tracking automated market intelligence gathering
export const agentExecutions = pgTable("agent_executions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentName: varchar("agent_name").notNull(),
  executionType: varchar("execution_type").notNull(), // scheduled, manual, triggered
  status: varchar("status").notNull(), // running, completed, failed, cancelled
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  duration: integer("duration"), // in milliseconds
  itemsProcessed: integer("items_processed").default(0),
  itemsCreated: integer("items_created").default(0),
  errorMessage: text("error_message"),
  executionData: jsonb("execution_data"), // search queries, results summary, etc.
  nextScheduledAt: timestamp("next_scheduled_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_agent_executions_agent").on(table.agentName),
  index("idx_agent_executions_status").on(table.status),
  index("idx_agent_executions_scheduled").on(table.nextScheduledAt),
]);

// Zod schemas for type safety and validation
export const insertMarketIntelligenceSchema = createInsertSchema(marketIntelligence).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAgentExecutionSchema = createInsertSchema(agentExecutions).omit({
  id: true,
  createdAt: true,
});

// TypeScript types
export type MarketIntelligence = typeof marketIntelligence.$inferSelect;
export type InsertMarketIntelligence = typeof marketIntelligence.$inferInsert;
export type AgentExecution = typeof agentExecutions.$inferSelect;
export type InsertAgentExecution = z.infer<typeof insertAgentExecutionSchema>;

// Intelligence entries table for AI analysis results
export const intelligenceEntries = pgTable("intelligence_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  source: varchar("source").notNull(), // Bristol agents, MCP tools, etc.
  category: varchar("category").notNull(), // market_analysis, site_analysis, financial_analysis, demographic_analysis
  confidence: real("confidence"), // 0-1 confidence score
  metadata: jsonb("metadata"), // Additional structured data
  data: jsonb("data"), // Main analysis results
  createdAt: timestamp("created_at").defaultNow(),
});

// Type exports for original tables
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Site = typeof sites.$inferSelect;
export type InsertSite = typeof sites.$inferInsert;
export type SiteMetric = typeof siteMetrics.$inferSelect;
export type InsertSiteMetric = typeof siteMetrics.$inferInsert;
export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = typeof chatSessions.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;
export type IntelligenceEntry = typeof intelligenceEntries.$inferSelect;
export type InsertIntelligenceEntry = typeof intelligenceEntries.$inferInsert;

// Bristol score field now included in main sites table

// Type exports for Cap-specific tables
export type BristolUser = typeof bristolUsers.$inferSelect;
export type InsertBristolUser = typeof bristolUsers.$inferInsert;
export type ConversationSession = typeof conversationSessions.$inferSelect;
export type InsertConversationSession = typeof conversationSessions.$inferInsert;
export type MCPToolExecution = typeof mcpToolExecutions.$inferSelect;
export type InsertMCPToolExecution = typeof mcpToolExecutions.$inferInsert;
export type AnalyticsCache = typeof analyticsCache.$inferSelect;
export type InsertAnalyticsCache = typeof analyticsCache.$inferInsert;
export type Artifact = typeof artifacts.$inferSelect;
export type InsertArtifact = typeof artifacts.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;
// Remove duplicate InsertAgentExecution type

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

// Enhanced Multi-Agent System Architecture
export const agents = pgTable("agents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  name: varchar("name").notNull(),
  role: varchar("role").notNull(), // bristol-master, data-processing, financial-analysis, market-intelligence, lead-management, web-scraping, risk-assessment, compliance, reporting
  status: varchar("status").notNull().default("active"), // active, inactive, busy, error
  model: varchar("model").default("gpt-4o"), // OpenRouter model to use
  systemPrompt: text("system_prompt").notNull(),
  capabilities: jsonb("capabilities"), // JSON array of MCP tools this agent can use
  performance: jsonb("performance"), // Performance metrics and statistics
  lastActive: timestamp("last_active").defaultNow(),
  totalTasks: integer("total_tasks").default(0),
  successRate: real("success_rate").default(1.0),
  averageResponseTime: real("avg_response_time"), // in milliseconds
  metadata: jsonb("metadata"), // Additional configuration
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Agent task queue and execution tracking
export const agentTasks = pgTable("agent_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").references(() => agents.id),
  sessionId: varchar("session_id").references(() => chatSessions.id),
  userId: varchar("user_id").references(() => users.id),
  taskType: varchar("task_type").notNull(), // analysis, research, calculation, scraping, reporting
  input: jsonb("input").notNull(),
  output: jsonb("output"),
  status: varchar("status").notNull().default("pending"), // pending, running, completed, failed
  priority: integer("priority").default(0), // Higher number = higher priority
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  errorMessage: text("error_message"),
  executionTime: real("execution_time"), // in milliseconds
  mcpToolsUsed: jsonb("mcp_tools_used"), // Array of MCP tools used
  createdAt: timestamp("created_at").defaultNow(),
});

// Agent communication and data sharing
export const agentCommunications = pgTable("agent_communications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromAgentId: varchar("from_agent_id").references(() => agents.id),
  toAgentId: varchar("to_agent_id").references(() => agents.id),
  sessionId: varchar("session_id").references(() => chatSessions.id),
  messageType: varchar("message_type").notNull(), // data_share, task_request, result_notification, coordination
  content: jsonb("content").notNull(),
  priority: integer("priority").default(0),
  status: varchar("status").notNull().default("sent"), // sent, received, processed
  createdAt: timestamp("created_at").defaultNow(),
});

// Agent system prompts and configurations (enhanced)
export const agentPrompts = pgTable("agent_prompts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").references(() => agents.id),
  userId: varchar("user_id").references(() => users.id),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(), // system, project, context, persona, instruction
  content: text("content").notNull(),
  active: boolean("active").default(true),
  priority: integer("priority").default(0), // Higher priority prompts get injected first
  version: integer("version").default(1),
  parentId: varchar("parent_id"), // For versioning and history
  metadata: jsonb("metadata"), // Additional configuration
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Agent file attachments
export const agentAttachments = pgTable("agent_attachments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => chatSessions.id),
  userId: varchar("user_id").references(() => users.id),
  fileName: varchar("file_name").notNull(),
  fileType: varchar("file_type").notNull(),
  fileSize: integer("file_size"),
  url: text("url"),
  content: text("content"), // Extracted text content for context
  metadata: jsonb("metadata"), // Parsed structured data
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Agent conversation context
export const agentContext = pgTable("agent_context", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => chatSessions.id),
  userId: varchar("user_id").references(() => users.id),
  type: varchar("type").notNull(), // deal, property, market, competitor, strategy
  entityId: varchar("entity_id"), // Reference to specific deal/property/etc
  context: jsonb("context").notNull(),
  relevance: real("relevance"), // 0-1 score
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Agent decision logs for audit trail
export const agentDecisions = pgTable("agent_decisions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => chatSessions.id),
  userId: varchar("user_id").references(() => users.id),
  decisionType: varchar("decision_type").notNull(), // investment, risk, recommendation
  entityId: varchar("entity_id"), // Reference to deal/property
  decision: jsonb("decision").notNull(), // Structured decision data
  reasoning: text("reasoning").notNull(),
  confidence: real("confidence"), // 0-1 score
  outcome: varchar("outcome"), // approved, rejected, pending
  impactValue: real("impact_value"), // Estimated $ impact
  createdAt: timestamp("created_at").defaultNow(),
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

// Bristol Comparables Annex tables
export const compsAnnex = pgTable('comps_annex', {
  id: varchar('id', { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  source: varchar('source', { length: 64 }).notNull(),
  sourceUrl: varchar('source_url', { length: 2048 }),
  name: varchar('name', { length: 256 }).notNull(),
  address: varchar('address', { length: 512 }).notNull(),
  city: varchar('city', { length: 128 }),
  state: varchar('state', { length: 16 }),
  zip: varchar('zip', { length: 16 }),
  lat: real('lat'),
  lng: real('lng'),
  assetType: varchar('asset_type', { length: 64 }).notNull(),
  subtype: varchar('subtype', { length: 64 }),
  units: integer('units'),
  yearBuilt: integer('year_built'),
  rentPsf: real('rent_psf'),
  rentPu: real('rent_pu'),
  occupancyPct: real('occupancy_pct'),
  concessionPct: real('concession_pct'),
  amenityTags: jsonb('amenity_tags'),
  notes: varchar('notes', { length: 2048 }),
  canonicalAddress: varchar('canonical_address', { length: 512 }).notNull(),
  unitPlan: varchar('unit_plan', { length: 64 }),
  scrapedAt: timestamp('scraped_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  jobId: varchar('job_id', { length: 64 }),
  provenance: jsonb('provenance'),
  // Enhanced comparable analysis fields
  capRate: real('cap_rate'),
  noi: real('noi'),
  pricePerUnit: real('price_per_unit'),
  pricePerSqft: real('price_per_sqft'),
  totalSqft: integer('total_sqft'),
  parkingRatio: real('parking_ratio'),
  lotSize: real('lot_size'),
  stories: integer('stories'),
  constructionType: varchar('construction_type', { length: 64 }),
  unitMix: jsonb('unit_mix'),
  marketRentPsf: real('market_rent_psf'),
  effectiveRentPsf: real('effective_rent_psf'),
  leaseUpStatus: varchar('lease_up_status', { length: 64 }),
  developer: varchar('developer', { length: 128 }),
  propertyManager: varchar('property_manager', { length: 128 }),
}, (t) => ({
  addrIdx: index('comps_annex_addr_idx').on(t.canonicalAddress),
  planIdx: index('comps_annex_plan_idx').on(t.unitPlan),
}));

export const scrapeJobsAnnex = pgTable('scrape_jobs_annex', {
  id: varchar('id', { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  status: varchar('status', { length: 24 }).notNull(), // queued|running|done|error
  query: jsonb('query').notNull(),
  meta: jsonb('meta'), // progress and stage information
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  error: varchar('error', { length: 2048 }),
});

export const compEventsAnnex = pgTable('comp_events_annex', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  compId: varchar('comp_id').notNull(),
  type: varchar('type', { length: 32 }).notNull(), // create|update|edit|merge|dedupe
  diff: jsonb('diff'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
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
}).extend({
  // Allow null values for optional fields to prevent validation errors
  ownerId: z.string().nullable().optional(),
  addrLine1: z.string().nullable().optional(),
  addrLine2: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  acreage: z.number().nullable().optional(),
  unitsTotal: z.number().nullable().optional(),
  units1b: z.number().nullable().optional(),
  units2b: z.number().nullable().optional(),
  units3b: z.number().nullable().optional(),
  avgSf: z.number().nullable().optional(),
  completionYear: z.number().nullable().optional(),
  parkingSpaces: z.number().nullable().optional(),
  sourceUrl: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  fipsState: z.string().nullable().optional(),
  fipsCounty: z.string().nullable().optional(),
  geoidTract: z.string().nullable().optional(),
  acsYear: z.string().nullable().optional(),
  acsProfile: z.any().nullable().optional(),
  bristolScore: z.number().nullable().optional(),
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

export const insertAgentPromptSchema = createInsertSchema(agentPrompts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAgentAttachmentSchema = createInsertSchema(agentAttachments).omit({
  id: true,
  createdAt: true,
});

export const insertAgentContextSchema = createInsertSchema(agentContext).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAgentDecisionSchema = createInsertSchema(agentDecisions).omit({
  id: true,
  createdAt: true,
});

export const insertCompsAnnexSchema = createInsertSchema(compsAnnex).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertScrapeJobsAnnexSchema = createInsertSchema(scrapeJobsAnnex).omit({
  id: true,
  createdAt: true,
});

export const insertCompEventsAnnexSchema = createInsertSchema(compEventsAnnex).omit({
  id: true,
  createdAt: true,
});

// Remove duplicate type exports - they are already defined above
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

// Bristol AI MCP Execution Logs
export const mcpExecutions = pgTable("mcp_executions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  toolName: varchar("tool_name").notNull(),
  serverName: varchar("server_name").notNull(),
  parameters: jsonb("parameters"),
  result: jsonb("result"),
  success: boolean("success").notNull(),
  errorMessage: text("error_message"),
  executionTime: integer("execution_time"), // milliseconds
  userId: varchar("user_id").references(() => users.id),
  sessionId: varchar("session_id").references(() => chatSessions.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMcpExecutionSchema = createInsertSchema(mcpExecutions).omit({
  id: true,
  createdAt: true,
});

export type McpExecution = typeof mcpExecutions.$inferSelect;
export type InsertMcpExecution = z.infer<typeof insertMcpExecutionSchema>;
export type AgentPrompt = typeof agentPrompts.$inferSelect;
export type InsertAgentPrompt = z.infer<typeof insertAgentPromptSchema>;
export type AgentAttachment = typeof agentAttachments.$inferSelect;
export type InsertAgentAttachment = z.infer<typeof insertAgentAttachmentSchema>;
export type AgentContext = typeof agentContext.$inferSelect;
export type InsertAgentContext = z.infer<typeof insertAgentContextSchema>;
export type AgentDecision = typeof agentDecisions.$inferSelect;
export type InsertAgentDecision = z.infer<typeof insertAgentDecisionSchema>;
export type CompsAnnex = typeof compsAnnex.$inferSelect;
export type InsertCompsAnnex = z.infer<typeof insertCompsAnnexSchema>;
export type ScrapeJobsAnnex = typeof scrapeJobsAnnex.$inferSelect;
export type InsertScrapeJobsAnnex = z.infer<typeof insertScrapeJobsAnnexSchema>;
export type CompEventsAnnex = typeof compEventsAnnex.$inferSelect;
export type InsertCompEventsAnnex = z.infer<typeof insertCompEventsAnnexSchema>;

// Enhanced Multi-Agent System Types
export const insertAgentSchema = createInsertSchema(agents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAgentTaskSchema = createInsertSchema(agentTasks).omit({
  id: true,
  createdAt: true,
});

export const insertAgentCommunicationSchema = createInsertSchema(agentCommunications).omit({
  id: true,
  createdAt: true,
});

export type Agent = typeof agents.$inferSelect;
export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type AgentTask = typeof agentTasks.$inferSelect;
export type InsertAgentTask = z.infer<typeof insertAgentTaskSchema>;
export type AgentCommunication = typeof agentCommunications.$inferSelect;
export type InsertAgentCommunication = z.infer<typeof insertAgentCommunicationSchema>;

// Competitor Watch Tables
export const competitorSignals = pgTable("competitor_signals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type").notNull(), // permit, agenda, sec_filing, entity_filing, news
  jurisdiction: varchar("jurisdiction").notNull(),
  source: varchar("source").notNull(),
  sourceId: varchar("source_id"),
  title: varchar("title", { length: 500 }).notNull(),
  address: text("address"),
  whenIso: timestamp("when_iso").notNull(),
  link: text("link"),
  rawData: jsonb("raw_data"),
  competitorMatch: varchar("competitor_match"),
  confidence: real("confidence"),
  priority: integer("priority"),
  analyzed: boolean("analyzed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_competitor_signals_type").on(table.type),
  index("idx_competitor_signals_jurisdiction").on(table.jurisdiction),
  index("idx_competitor_signals_competitor").on(table.competitorMatch),
  index("idx_competitor_signals_when").on(table.whenIso),
]);

export const scrapeJobs = pgTable("scrape_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  status: varchar("status").notNull(), // queued, running, done, failed
  source: varchar("source").notNull(),
  query: jsonb("query"),
  recordsFound: integer("records_found"),
  recordsNew: integer("records_new"),
  startedAt: timestamp("started_at"),
  finishedAt: timestamp("finished_at"),
  executionTime: integer("execution_time"), // milliseconds
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const competitorEntities = pgTable("competitor_entities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  type: varchar("type").notNull(), // company, person
  keywords: text("keywords").array(),
  cik: varchar("cik"), // SEC CIK number if public
  active: boolean("active").default(true),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_competitor_entities_active").on(table.active),
]);

export const geoJurisdictions = pgTable("geo_jurisdictions", {
  key: varchar("key").primaryKey(),
  label: varchar("label").notNull(),
  state: varchar("state", { length: 2 }).notNull(),
  active: boolean("active").default(true),
  config: jsonb("config"),
  scrapeFrequency: integer("scrape_frequency"), // minutes
  lastScraped: timestamp("last_scraped"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const competitorAnalysis = pgTable("competitor_analysis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  signalId: varchar("signal_id").references(() => competitorSignals.id),
  competitorId: varchar("competitor_id").notNull(),
  analysis: text("analysis").notNull(),
  impact: varchar("impact"), // low, medium, high, critical
  confidence: real("confidence"),
  recommendations: text("recommendations").array(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_competitor_analysis_signal").on(table.signalId),
  index("idx_competitor_analysis_competitor").on(table.competitorId),
]);

// Competitor Watch Schema Types
export const insertCompetitorSignalSchema = createInsertSchema(competitorSignals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertScrapeJobSchema = createInsertSchema(scrapeJobs).omit({
  id: true,
  createdAt: true,
});

export const insertCompetitorEntitySchema = createInsertSchema(competitorEntities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGeoJurisdictionSchema = createInsertSchema(geoJurisdictions).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertCompetitorAnalysisSchema = createInsertSchema(competitorAnalysis).omit({
  id: true,
  createdAt: true,
});

export type CompetitorSignal = typeof competitorSignals.$inferSelect;
export type InsertCompetitorSignal = z.infer<typeof insertCompetitorSignalSchema>;
export type ScrapeJob = typeof scrapeJobs.$inferSelect;
export type InsertScrapeJob = z.infer<typeof insertScrapeJobSchema>;
export type CompetitorEntity = typeof competitorEntities.$inferSelect;
export type InsertCompetitorEntity = z.infer<typeof insertCompetitorEntitySchema>;
export type GeoJurisdiction = typeof geoJurisdictions.$inferSelect;
export type InsertGeoJurisdiction = z.infer<typeof insertGeoJurisdictionSchema>;
export type CompetitorAnalysis = typeof competitorAnalysis.$inferSelect;
export type InsertCompetitorAnalysis = z.infer<typeof insertCompetitorAnalysisSchema>;
