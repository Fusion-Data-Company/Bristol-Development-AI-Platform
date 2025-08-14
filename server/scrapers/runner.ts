import { randomUUID } from 'crypto';
import { db } from '../db';
import { scrapeJobsAnnex, compsAnnex } from '../../shared/schema';
import { adapters } from './sources';
import { sql, eq, and } from 'drizzle-orm';
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

  let scrapeSuccess = false;
  let errorMessages: string[] = [];

  try {
    // Update job with progress
    await db.update(scrapeJobsAnnex)
      .set({ status: 'running', meta: { stage: 'initializing', progress: 0 } })
      .where(eq(scrapeJobsAnnex.id, id));

    // Primary: Use Firecrawl as the default scraper
    const scrapeQuery: ScrapeQuery = {
      address,
      radius_mi,
      asset_type,
      keywords,
      amenities
    };
    
    console.log(`🔥 Running Firecrawl primary scraper for: ${address}`);
    
    // Update progress
    await db.update(scrapeJobsAnnex)
      .set({ meta: { stage: 'firecrawl_scraping', progress: 25 } })
      .where(eq(scrapeJobsAnnex.id, id));
    
    // Try Firecrawl first - import here to avoid circular dependency
    const { scrapeFirecrawl } = await import('./firecrawl');
    const firecrawlResult = await scrapeFirecrawl(scrapeQuery);
    
    if (firecrawlResult.records && firecrawlResult.records.length > 0) {
      results.push(...firecrawlResult.records);
      scrapeSuccess = true;
      console.log(`✅ Firecrawl found ${firecrawlResult.records.length} properties`);
      
      // Update progress
      await db.update(scrapeJobsAnnex)
        .set({ meta: { stage: 'processing_results', progress: 75 } })
        .where(eq(scrapeJobsAnnex.id, id));
    } else {
      errorMessages.push('Firecrawl returned no results');
      console.log('🔄 Firecrawl found no results, trying enhanced agent...');
      
      // Fallback: Enhanced scraping agent
      await db.update(scrapeJobsAnnex)
        .set({ meta: { stage: 'enhanced_agent_fallback', progress: 40 } })
        .where(eq(scrapeJobsAnnex.id, id));
      
      const agentResult = await runScrapeAgent(scrapeQuery);
      
      if (agentResult.records && agentResult.records.length > 0) {
        results.push(...agentResult.records);
        scrapeSuccess = true;
        console.log(`✅ Enhanced agent found ${agentResult.records.length} properties`);
        
        // Update progress
        await db.update(scrapeJobsAnnex)
          .set({ meta: { stage: 'processing_results', progress: 75 } })
          .where(eq(scrapeJobsAnnex.id, id));
      } else {
        errorMessages.push('Enhanced agent returned no results');
      }
      
      // Add caveats to error messages if present
      if (agentResult.caveats) {
        errorMessages.push(...agentResult.caveats);
      }
    }
    
    // Add Firecrawl caveats to error messages if present
    if (firecrawlResult.caveats) {
      errorMessages.push(...firecrawlResult.caveats);
    }
    
  } catch (error) {
    const errorMsg = `Primary scraping (Firecrawl + Enhanced agent) failed: ${error}`;
    console.warn(errorMsg);
    errorMessages.push(errorMsg);
    
    // Update progress to fallback adapters
    try {
      await db.update(scrapeJobsAnnex)
        .set({ meta: { stage: 'legacy_adapters_fallback', progress: 50 } })
        .where(eq(scrapeJobsAnnex.id, id));
    } catch (updateError) {
      console.warn('Failed to update job progress:', updateError);
    }
    
    // Final fallback: Legacy adapters (for demo/backup purposes)
    console.log('🔄 Falling back to legacy adapters...');
    for (const adapter of adapters) {
      try {
        const out = await adapter.search({ address, radius_mi, asset_type, keywords });
        if (out.records && out.records.length > 0) {
          results.push(...out.records);
          scrapeSuccess = true;
          console.log(`✅ Adapter ${adapter.name} found ${out.records.length} records`);
        }
      } catch (e) {
        const adapterError = `Adapter ${adapter.name} failed: ${e}`;
        console.warn(adapterError);
        errorMessages.push(adapterError);
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
    // Insert records with simple conflict handling
    for (const row of rows) {
      try {
        await db.insert(compsAnnex).values(row);
        insertedCount++;
      } catch (err) {
        // Check if it's a duplicate key error
        if (err && typeof err === 'object' && 'code' in err && err.code === '23505') {
          // Duplicate key - update the existing record
          try {
            await db.update(compsAnnex)
              .set({
                name: row.name,
                address: row.address,
                city: row.city,
                state: row.state,
                zip: row.zip,
                units: row.units,
                rentPsf: row.rentPsf,
                rentPu: row.rentPu,
                occupancyPct: row.occupancyPct,
                concessionPct: row.concessionPct,
                amenityTags: row.amenityTags,
                notes: row.notes,
                updatedAt: new Date(),
                scrapedAt: row.scrapedAt,
                jobId: row.jobId
              })
              .where(and(
                eq(compsAnnex.canonicalAddress, row.canonicalAddress),
                eq(compsAnnex.unitPlan, row.unitPlan || '')
              ));
            insertedCount++;
          } catch (updateErr) {
            console.warn('Error updating existing record:', updateErr);
          }
        } else {
          console.warn('Error inserting record:', err);
        }
      }
    }
  }

  // Final status update
  const finalStatus = scrapeSuccess ? 'completed' : 'failed';
  const finalMeta = {
    stage: 'completed',
    progress: 100,
    errors: errorMessages,
    recordsFound: insertedCount,
    duration: Date.now() - (job.startedAt?.getTime() || Date.now())
  };

  try {
    await db.update(scrapeJobsAnnex)
      .set({ 
        status: finalStatus, 
        finishedAt: new Date(),
        error: errorMessages.length > 0 ? errorMessages.join('; ') : null
      })
      .where(eq(scrapeJobsAnnex.id, id));
  } catch (updateError) {
    console.error('Failed to update final job status:', updateError);
    // Continue execution - the job results are still valid
  }

  if (scrapeSuccess || insertedCount > 0) {
    console.log(`✅ Scrape job ${id} completed successfully with ${insertedCount} records`);
  } else {
    console.error(`❌ Scrape job ${id} failed:`, errorMessages);
    throw new Error(`Scrape job failed: ${errorMessages.join('; ')}`);
  }
  
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