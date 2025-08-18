import { pgTable, text, timestamp, jsonb, integer, boolean, decimal, index, primaryKey } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Competitor intelligence signals - all detected development activities
export const competitorSignals = pgTable('competitor_signals', {
  id: text('id').primaryKey().default('gen_random_uuid()'),
  source: text('source').notNull(), // 'nash_permit' | 'franklin_agenda' | 'metro_planning' etc
  whenIso: timestamp('when_iso', { withTimezone: true }).notNull(),
  jurisdiction: text('jurisdiction').notNull(), // 'Nashville/Davidson County', 'Franklin', etc
  type: text('type').notNull(), // 'Permit' | 'Agenda' | 'Filing' | 'Notice'
  title: text('title').notNull(),
  address: text('address'),
  parcel: text('parcel'),
  url: text('url').notNull(),
  rawData: jsonb('raw_data').notNull(),
  competitorMatch: text('competitor_match'), // Name of matched competitor if found
  confidence: decimal('confidence', { precision: 3, scale: 2 }), // 0.00 to 1.00
  priority: integer('priority').default(5), // 1-10 scale
  analyzed: boolean('analyzed').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
}, (table) => ({
  whenIdx: index('signals_when_idx').on(table.whenIso),
  jurisdictionIdx: index('signals_jurisdiction_idx').on(table.jurisdiction),
  typeIdx: index('signals_type_idx').on(table.type),
  competitorIdx: index('signals_competitor_idx').on(table.competitorMatch)
}));

// Scraping job tracking
export const scrapeJobs = pgTable('scrape_jobs', {
  id: text('id').primaryKey().default('gen_random_uuid()'),
  status: text('status').notNull().default('queued'), // 'queued' | 'running' | 'done' | 'failed'
  source: text('source').notNull(), // Which scraper/source
  query: jsonb('query'), // Query parameters
  startedAt: timestamp('started_at', { withTimezone: true }),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  recordsFound: integer('records_found').default(0),
  recordsNew: integer('records_new').default(0),
  errorMessage: text('error_message'),
  executionTime: integer('execution_time'), // milliseconds
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
}, (table) => ({
  statusIdx: index('jobs_status_idx').on(table.status),
  sourceIdx: index('jobs_source_idx').on(table.source)
}));

// Known competitor entities and subsidiaries
export const competitorEntities = pgTable('competitor_entities', {
  id: text('id').primaryKey().default('gen_random_uuid()'),
  name: text('name').notNull(),
  parentCompany: text('parent_company'),
  type: text('type').notNull().default('company'), // 'company' | 'subsidiary' | 'llc' | 'fund'
  cikNumber: text('cik_number'), // SEC CIK for public companies
  ein: text('ein'), // Employer ID Number
  stateOfIncorporation: text('state_of_incorporation'),
  aliases: jsonb('aliases').default([]), // Array of alternative names
  keywords: jsonb('keywords').default([]), // Search keywords
  active: boolean('active').default(true),
  notes: text('notes'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
}, (table) => ({
  nameIdx: index('entities_name_idx').on(table.name),
  parentIdx: index('entities_parent_idx').on(table.parentCompany),
  cikIdx: index('entities_cik_idx').on(table.cikNumber)
}));

// Geographic jurisdictions configuration
export const geoJurisdictions = pgTable('geo_jurisdictions', {
  id: text('id').primaryKey().default('gen_random_uuid()'),
  key: text('key').notNull().unique(), // 'tn_nashville', 'ga_atlanta'
  label: text('label').notNull(), // 'Nashville/Davidson County, TN'
  state: text('state').notNull(),
  bbox: jsonb('bbox'), // [minLon, minLat, maxLon, maxLat]
  datasets: jsonb('datasets').default([]), // ArcGIS/Socrata endpoints
  agendas: jsonb('agendas').default([]), // Planning/agenda sources
  envNotices: jsonb('env_notices').default([]), // Environmental notice URLs
  active: boolean('active').default(true),
  scrapeFrequency: integer('scrape_frequency').default(180), // minutes
  lastScraped: timestamp('last_scraped', { withTimezone: true }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
}, (table) => ({
  keyIdx: index('jurisdictions_key_idx').on(table.key),
  stateIdx: index('jurisdictions_state_idx').on(table.state),
  activeIdx: index('jurisdictions_active_idx').on(table.active)
}));

// Competitor analysis results from AI
export const competitorAnalysis = pgTable('competitor_analysis', {
  id: text('id').primaryKey().default('gen_random_uuid()'),
  signalIds: jsonb('signal_ids').notNull(), // Array of related signal IDs
  competitorId: text('competitor_id').references(() => competitorEntities.id),
  analysisType: text('analysis_type').notNull(), // 'weekly_summary' | 'deal_alert' | 'pattern_analysis'
  title: text('title').notNull(),
  summary: text('summary').notNull(),
  insights: jsonb('insights').notNull(), // Structured insights
  bristolImplications: text('bristol_implications'),
  recommendedActions: jsonb('recommended_actions'),
  confidence: decimal('confidence', { precision: 3, scale: 2 }),
  aiModel: text('ai_model'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
}, (table) => ({
  competitorIdx: index('analysis_competitor_idx').on(table.competitorId),
  typeIdx: index('analysis_type_idx').on(table.analysisType),
  createdIdx: index('analysis_created_idx').on(table.createdAt)
}));

// Create insert schemas for type safety
export const insertCompetitorSignalSchema = createInsertSchema(competitorSignals);
export const insertScrapeJobSchema = createInsertSchema(scrapeJobs);
export const insertCompetitorEntitySchema = createInsertSchema(competitorEntities);
export const insertGeoJurisdictionSchema = createInsertSchema(geoJurisdictions);
export const insertCompetitorAnalysisSchema = createInsertSchema(competitorAnalysis);

// Export types
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