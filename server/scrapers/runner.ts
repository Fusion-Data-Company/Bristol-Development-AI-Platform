// server/scrapers/runner.ts
import { randomUUID } from 'crypto';
import { db } from '../db';
import { scrapeJobsAnnex, compsAnnex } from '@shared/schema';
import { sql, eq } from 'drizzle-orm';

export async function newScrapeJob(query: any) {
  const id = randomUUID();
  await db.insert(scrapeJobsAnnex).values({ id, status: 'queued', query });
  return id;
}

export async function getJob(id: string) {
  const rows = await db.select().from(scrapeJobsAnnex).where(eq(scrapeJobsAnnex.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function runJobNow(id: string) {
  await db.update(scrapeJobsAnnex)
    .set({ status: 'running', startedAt: new Date() })
    .where(eq(scrapeJobsAnnex.id, id));
    
  const job = await getJob(id);
  if (!job) throw new Error('job not found');

  const query = job.query || {};
  const { address, radius_mi = 5, asset_type = 'Multifamily', keywords = [] } = query as any;
  const results: any[] = [];

  // Dynamic import of adapters 
  try {
    const sourcesModule = await import('./sources');
    const adapters = sourcesModule.adapters || [];
    
    for (const adapter of adapters) {
      try {
        const out = await adapter.search({ address, radius_mi, asset_type, keywords });
        results.push(...out.records);
      } catch (e) {
        console.warn(`Adapter ${adapter.name} failed:`, e);
        // continue with other adapters
      }
    }
  } catch (e) {
    console.warn('Could not load sources module:', e);
  }

  // Deduplicate by canonical address + unit plan
  const byKey = new Map<string, any>();
  for (const r of results) {
    const key = `${(r.canonicalAddress||'').toLowerCase()}|${(r.unitPlan||'').toLowerCase()}`;
    if (!byKey.has(key)) byKey.set(key, r);
  }

  const rows = Array.from(byKey.values()).map(r => ({ 
    ...r, 
    jobId: id, 
    scrapedAt: new Date(),
    id: randomUUID()
  }));
  
  if (rows.length) {
    // Upsert records - update existing or insert new
    for (const row of rows) {
      try {
        await db.insert(compsAnnex).values(row as any)
          .onConflictDoUpdate({
            target: [compsAnnex.canonicalAddress, compsAnnex.unitPlan],
            set: { 
              rentPsf: sql`excluded.rent_psf`, 
              rentPu: sql`excluded.rent_pu`, 
              occupancyPct: sql`excluded.occupancy_pct`, 
              concessionPct: sql`excluded.concession_pct`, 
              updatedAt: sql`now()`,
              jobId: sql`excluded.job_id`,
              scrapedAt: sql`excluded.scraped_at`
            },
          });
      } catch (err) {
        console.warn('Error upserting comp:', err);
        // Continue with other records
      }
    }
  }

  await db.update(scrapeJobsAnnex)
    .set({ status: 'done', finishedAt: new Date() })
    .where(eq(scrapeJobsAnnex.id, id));
    
  return rows.length;
}