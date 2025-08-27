# REPLIT BUILDER — MEGA PROMPT (Your Company Comparables Annex)

**Goal:** Build a **flagship Comparables Annex** for Your Company Name. This is a Google‑Sheets‑scale page with inline editing, virtualization, tactical web scraping, storage, CSV import/export, and AI tool access so the Your Company Agent can launch scrapes and reuse comps on demand.

**Stack (use existing project conventions):** Express + TypeScript server, Drizzle ORM + Neon (Postgres), Vite + React 18 on the client, TanStack Table v8 + React Query, free‑first scraping (Cheerio/undici), optional Playwright via env flag. Router on client is **wouter**.

**Important execution rules for the Builder**

- **Do not stop** after the first file change. Execute steps **sequentially** until 100% of tasks are complete.
- If an existing file is present, **merge non‑destructively**; don’t delete working code.
- After each step, run a quick self‑check (lint/typecheck/build quick dev run). If an error appears, **fix before moving on**.
- If any required env var or dependency is missing, **add it** and update README notes at the end.
- Respect robots/terms for scraping; implement only generic/free adapters here.

---

## TASK A — Data Model (Drizzle + Neon)

### A1. Create/merge Drizzle schema

Create `server/db/schema.comps.ts` with the tables below. If the file exists, ensure these tables and columns are present.

```ts
// server/db/schema.comps.ts
import { pgTable, serial, varchar, integer, numeric, timestamp, jsonb, index } from 'drizzle-orm/pg-core';

export const comps = pgTable('comps', {
  id: serial('id').primaryKey(),
  source: varchar('source', { length: 64 }).notNull(),
  sourceUrl: varchar('source_url', { length: 2048 }),
  name: varchar('name', { length: 256 }).notNull(),
  address: varchar('address', { length: 512 }).notNull(),
  city: varchar('city', { length: 128 }),
  state: varchar('state', { length: 16 }),
  zip: varchar('zip', { length: 16 }),
  lat: numeric('lat', { precision: 10, scale: 6 }),
  lng: numeric('lng', { precision: 10, scale: 6 }),
  assetType: varchar('asset_type', { length: 64 }).notNull(),
  subtype: varchar('subtype', { length: 64 }),
  units: integer('units'),
  yearBuilt: integer('year_built'),
  rentPsf: numeric('rent_psf', { precision: 10, scale: 2 }),
  rentPu: numeric('rent_pu', { precision: 10, scale: 0 }),
  occupancyPct: numeric('occupancy_pct', { precision: 5, scale: 2 }),
  concessionPct: numeric('concession_pct', { precision: 5, scale: 2 }),
  amenityTags: jsonb('amenity_tags'),
  notes: varchar('notes', { length: 2048 }),
  canonicalAddress: varchar('canonical_address', { length: 512 }).notNull(),
  unitPlan: varchar('unit_plan', { length: 64 }),
  scrapedAt: timestamp('scraped_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  jobId: varchar('job_id', { length: 64 }),
  provenance: jsonb('provenance'),
}, (t) => ({
  addrIdx: index('comps_addr_idx').on(t.canonicalAddress),
  planIdx: index('comps_plan_idx').on(t.unitPlan),
}));

export const scrapeJobs = pgTable('scrape_jobs', {
  id: varchar('id', { length: 64 }).primaryKey(),
  status: varchar('status', { length: 24 }).notNull(), // queued|running|done|error
  query: jsonb('query').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  error: varchar('error', { length: 2048 }),
});

export const compEvents = pgTable('comp_events', {
  id: serial('id').primaryKey(),
  compId: integer('comp_id').notNull(),
  type: varchar('type', { length: 32 }).notNull(), // create|update|edit|merge|dedupe
  diff: jsonb('diff'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
```

### A2. Ensure DB connection helper exists

Create `server/db/conn.ts` if missing.

```ts
// server/db/conn.ts
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL missing');

const client = neon(url);
export const db = drizzle(client);
```

### A3. Migration

If you’re using Drizzle Kit, generate and run migrations. Otherwise, run `CREATE TABLE` via your usual path based on the schema above. Confirm the three tables exist.

---

## TASK B — Backend Routes (Express)

### B1. Comparables routes

Create `server/routes/comps.ts` with list, bulkUpsert, export, scrape launcher, job status.

```ts
// server/routes/comps.ts
import type { Express, Request, Response } from 'express';
import { db } from '../db/conn';
import { comps, scrapeJobs } from '../db/schema.comps';
import { sql, eq, ilike } from 'drizzle-orm';
import { newScrapeJob, getJob, runJobNow } from '../scrapers/runner';

export function registerCompRoutes(app: Express) {
  app.get('/api/comps', async (req: Request, res: Response) => {
    const limit = Math.min(Number(req.query.limit ?? 2000), 10000);
    const offset = Number(req.query.offset ?? 0);
    const q = String(req.query.q ?? '').trim();
    const where = q ? ilike(comps.canonicalAddress, `%${q}%`) : undefined as any;
    const rows = await db.select().from(comps).where(where).limit(limit).offset(offset).orderBy(comps.updatedAt);
    const total = await db.execute(sql`select count(*)::int as c from comps`);
    res.json({ rows, total: Number((total as any)[0].c) });
  });

  app.post('/api/comps/bulkUpsert', async (req, res) => {
    const rows = Array.isArray(req.body) ? req.body : [];
    if (!rows.length) return res.json({ ok: true, count: 0 });
    const values = rows.map((r) => ({ ...r, updatedAt: new Date() }));
    await db.insert(comps).values(values).onConflictDoUpdate({
      target: [comps.canonicalAddress, comps.unitPlan],
      set: {
        name: sql`excluded.name`, address: sql`excluded.address`, city: sql`excluded.city`, state: sql`excluded.state`, zip: sql`excluded.zip`,
        units: sql`excluded.units`, rent_psf: sql`excluded.rent_psf`, rent_pu: sql`excluded.rent_pu`, occupancy_pct: sql`excluded.occupancy_pct`, concession_pct: sql`excluded.concession_pct`,
        amenity_tags: sql`excluded.amenity_tags`, notes: sql`excluded.notes`, updated_at: sql`now()`
      },
    });
    res.json({ ok: true, count: values.length });
  });

  app.get('/api/comps/export.csv', async (_req, res) => {
    const rows = await db.select().from(comps).limit(100000);
    const headers = Object.keys(rows[0] ?? {});
    const csv = [headers.join(','), ...rows.map((r: any) => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))].join('\n');
    res.type('text/csv').send(csv);
  });

  app.post('/api/comps/scrape', async (req, res) => {
    const id = await newScrapeJob(req.body);
    runJobNow(id).catch(()=>{});
    res.json({ id, status: 'queued' });
  });

  app.get('/api/comps/jobs/:id', async (req, res) => {
    const job = await getJob(req.params.id);
    res.json(job);
  });
}
```

### B2. Register routes

Open your main route registrar (e.g., `server/routes/index.ts` or wherever you register API routes) and add:

```ts
import { registerCompRoutes } from './comps';

export function registerRoutes(app: import('express').Express, state?: any) {
  // ...existing routes
  registerCompRoutes(app);
}
```

---

## TASK C — Scraper Pipeline (free‑first)

### C1. Runner

Create `server/scrapers/runner.ts` to orchestrate jobs and upserts.

```ts
// server/scrapers/runner.ts
import { randomUUID } from 'crypto';
import { db } from '../db/conn';
import { scrapeJobs, comps } from '../db/schema.comps';
import { adapters } from './sources';
import { sql } from 'drizzle-orm';

export async function newScrapeJob(query: any) {
  const id = randomUUID();
  await db.insert(scrapeJobs).values({ id, status: 'queued', query });
  return id;
}

export async function getJob(id: string) {
  const rows: any = await db.execute(sql`select * from scrape_jobs where id=${id} limit 1`);
  return rows[0] ?? null;
}

export async function runJobNow(id: string) {
  await db.execute(sql`update scrape_jobs set status='running', started_at=now() where id=${id}`);
  const job: any = (await db.execute(sql`select * from scrape_jobs where id=${id} limit 1`))[0];
  if (!job) throw new Error('job not found');

  const { address, radius_mi = 5, asset_type = 'Multifamily', keywords = [] } = job.query || {};
  const results: any[] = [];

  for (const adapter of adapters) {
    try {
      const out = await adapter.search({ address, radius_mi, asset_type, keywords });
      results.push(...out.records);
    } catch (e) {
      // continue
    }
  }

  const byKey = new Map<string, any>();
  for (const r of results) {
    const key = `${(r.canonicalAddress||'').toLowerCase()}|${(r.unitPlan||'').toLowerCase()}`;
    if (!byKey.has(key)) byKey.set(key, r);
  }

  const rows = Array.from(byKey.values()).map(r => ({ ...r, jobId: id, scrapedAt: new Date() }));
  if (rows.length) {
    // upsert recent fields
    for (const r of rows) {
      await db.insert(comps).values(r as any).onConflictDoUpdate({
        target: [comps.canonicalAddress, comps.unitPlan],
        set: { rentPsf: sql`excluded.rent_psf`, rentPu: sql`excluded.rent_pu`, occupancyPct: sql`excluded.occupancy_pct`, concessionPct: sql`excluded.concession_pct`, updatedAt: sql`now()` },
      });
    }
  }

  await db.execute(sql`update scrape_jobs set status='done', finished_at=now() where id=${id}`);
  return rows.length;
}
```

### C2. Adapters (generic HTML, pluggable)

Create `server/scrapers/sources.ts` with a generic adapter. (Later add site‑specific ones. Respect robots/terms.)

```ts
// server/scrapers/sources.ts
import * as cheerio from 'cheerio';

export type Adapter = {
  name: string;
  search: (q: { address: string; radius_mi: number; asset_type: string; keywords: string[] }) => Promise<{ records: any[] }>;
};

function parseNumberLike(text?: string | null) {
  if (!text) return null;
  const t = String(text).replace(/[$,%\s]/g, '').replace(/[^0-9.\-]/g, '');
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function normalizeRecord(x: any) {
  return {
    source: x.source,
    sourceUrl: x.url,
    name: x.name?.trim(),
    address: x.address?.trim(),
    canonicalAddress: x.canonicalAddress ?? x.address?.toUpperCase(),
    city: x.city, state: x.state, zip: x.zip,
    assetType: x.assetType ?? 'Multifamily',
    units: parseNumberLike(x.units),
    rentPsf: parseNumberLike(x.rentPsf),
    rentPu: parseNumberLike(x.rentPu),
    occupancyPct: parseNumberLike(
```
