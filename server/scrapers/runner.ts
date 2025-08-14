import { randomUUID } from 'crypto';
import { db } from '../db';
import { scrapeJobsAnnex, compsAnnex } from '../../shared/schema';
import { adapters } from './sources';
import { sql, eq } from 'drizzle-orm';
import { runScrapeAgent, ScrapeQuery } from './agent';

export async function newScrapeJob(query: any) {
  const id = randomUUID();
  await db.insert(scrapeJobsAnnex).values({ 
    id, 
    status: 'queued', 
    query 
  });
  return id;
}

export async function getJob(id: string) {
  const rows = await db.select().from(scrapeJobsAnnex).where(eq(scrapeJobsAnnex.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function runJobNow(id: string) {
  // Update job status to running
  await db.update(scrapeJobsAnnex)
    .set({ status: 'running', startedAt: new Date() })
    .where(eq(scrapeJobsAnnex.id, id));

  const job = await getJob(id);
  if (!job) throw new Error('job not found');

  const { address, radius_mi = 5, asset_type = 'Multifamily', keywords = [], amenities = [] } = (job.query as any) || {};
  const results: any[] = [];

  try {
    // Use the enhanced scraping agent
    const scrapeQuery: ScrapeQuery = {
      address,
      radius_mi,
      asset_type,
      keywords,
      amenities
    };
    
    console.log('🤖 Running enhanced scraping agent...');
    const agentResult = await runScrapeAgent(scrapeQuery);
    results.push(...agentResult.records);
    
    console.log(`✅ Agent found ${agentResult.records.length} properties`);
  } catch (error) {
    console.warn('Enhanced scraping agent failed, falling back to adapters:', error);
    
    // Fallback to existing adapters
    for (const adapter of adapters) {
      try {
        const out = await adapter.search({ address, radius_mi, asset_type, keywords });
        results.push(...out.records);
      } catch (e) {
        console.warn(`Adapter ${adapter.name} failed:`, e);
        // continue with other adapters
      }
    }
  }

  // Deduplicate by canonical address + unit plan
  const byKey = new Map<string, any>();
  for (const r of results) {
    const key = `${(r.canonicalAddress || '').toLowerCase()}|${(r.unitPlan || '').toLowerCase()}`;
    if (!byKey.has(key)) {
      byKey.set(key, r);
    }
  }

  // Prepare records for upsert
  const rows = Array.from(byKey.values()).map(r => ({
    ...r,
    jobId: id,
    scrapedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  }));

  let insertedCount = 0;
  if (rows.length) {
    // Upsert each record individually with proper conflict handling
    for (const row of rows) {
      try {
        await db.insert(compsAnnex).values(row).onConflictDoUpdate({
          target: [compsAnnex.canonicalAddress, compsAnnex.unitPlan],
          set: {
            name: sql`excluded.name`,
            address: sql`excluded.address`,
            city: sql`excluded.city`,
            state: sql`excluded.state`,
            zip: sql`excluded.zip`,
            units: sql`excluded.units`,
            rentPsf: sql`excluded.rent_psf`,
            rentPu: sql`excluded.rent_pu`,
            occupancyPct: sql`excluded.occupancy_pct`,
            concessionPct: sql`excluded.concession_pct`,
            amenityTags: sql`excluded.amenity_tags`,
            notes: sql`excluded.notes`,
            updatedAt: sql`now()`,
            scrapedAt: sql`excluded.scraped_at`,
            jobId: sql`excluded.job_id`
          },
        });
        insertedCount++;
      } catch (err) {
        console.warn('Error upserting individual record:', err);
      }
    }
  }

  // Update job status to done
  await db.update(scrapeJobsAnnex)
    .set({ 
      status: 'done', 
      finishedAt: new Date(),
      recordsInserted: insertedCount 
    })
    .where(eq(scrapeJobsAnnex.id, id));

  return { insertedCount, totalRecords: rows.length };
}

export async function runJobWithError(id: string, error: string) {
  await db.update(scrapeJobsAnnex)
    .set({ 
      status: 'error', 
      finishedAt: new Date(),
      error: error.substring(0, 2000) // Truncate to fit column length
    })
    .where(eq(scrapeJobsAnnex.id, id));
}