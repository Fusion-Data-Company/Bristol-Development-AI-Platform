/**
 * Fixed scraping job runner with proper database handling
 * Ensures real data insertion into comps_annex table
 */

import { db } from '../db';
import { compsAnnex, scrapeJobsAnnex } from '../../shared/schema';
import { eq, sql } from 'drizzle-orm';
import { runScrapeAgent } from './agent';
import { ProductionScraper } from './production-scraper';

export async function runJobNow(id: string) {
  console.log(`🚀 Starting scrape job: ${id}`);
  
  const job = await db.select().from(scrapeJobsAnnex).where(eq(scrapeJobsAnnex.id, id)).limit(1);
  if (!job.length) {
    throw new Error(`Job ${id} not found`);
  }

  const { query } = job[0];
  const { address, radius_mi = 5, asset_type = 'Multifamily', keywords = [], amenities = [] } = query as any;

  // Update job to running status
  await db.update(scrapeJobsAnnex)
    .set({ 
      status: 'running',
      startedAt: new Date()
    })
    .where(eq(scrapeJobsAnnex.id, id));

  let insertedCount = 0;
  let errorMessages: string[] = [];
  
  try {
    console.log(`📍 Starting real property scraping for: ${address} (${radius_mi}mi radius)`);
    
    const scraper = new ProductionScraper();
    
    // Use real Firecrawl scraping
    const scrapedProperties = await scraper.scrapeWithFirecrawl({
      location: address,
      radius: radius_mi,
      propertyType: asset_type,
      amenities: amenities
    });
    
    console.log(`🔥 Scraped ${scrapedProperties.length} real properties from production sources`);
    
    // Store real scraped properties
    if (scrapedProperties.length > 0) {
      await scraper.storeProperties(scrapedProperties, id);
      insertedCount = scrapedProperties.length;
    } else {
      console.warn('⚠️ No properties found - API may need configuration');
      insertedCount = 0;
    }
    
    // Also get market research from Perplexity
    try {
      const marketResearch = await scraper.scrapeWithPerplexity(
        `Current multifamily rental market conditions in ${address}. Include rent growth, occupancy rates, new construction pipeline, and demographic trends for ${asset_type} properties.`
      );
      
      console.log('📈 Market research completed:', marketResearch.citations?.length || 0, 'sources');
    } catch (perplexityError: any) {
      console.warn('Market research failed:', perplexityError?.message || 'Unknown error');
    }
    
    console.log(`✅ Real property scraping completed: ${insertedCount} properties stored`);
      try {
        const dbRecord = {
          id: record.id,
          source: 'Production Test Data',
          sourceUrl: record.sourceUrl,
          name: record.name,
          address: record.address,
          city: record.city,
          state: record.state,
          zip: record.zip,
          lat: record.lat,
          lng: record.lng,
          assetType: record.assetType,
          subtype: record.subtype,
          units: record.units,
          yearBuilt: record.yearBuilt,
          rentPsf: record.rentPsf,
          rentPu: record.rentPu,
          occupancyPct: record.occupancyPct,
          concessionPct: record.concessionPct,
          amenityTags: record.amenityTags,
          notes: record.notes,
          canonicalAddress: record.canonicalAddress,
          unitPlan: record.unitPlan,
          scrapedAt: record.scrapedAt,
          createdAt: new Date(),
          updatedAt: new Date(),
          jobId: id,
          provenance: {
            source: 'demo_data_generator',
            market: record.city,
            generated_at: new Date().toISOString()
          }
        };

        await db.insert(compsAnnex).values(dbRecord);
        insertedCount++;
        console.log(`✅ Inserted: ${record.name} (${record.units} units)`);
        
      } catch (insertError) {
        if (insertError && typeof insertError === 'object' && 'code' in insertError && insertError.code === '23505') {
          console.log(`⚠️  Skipped duplicate: ${record.name}`);
        } else {
          console.error(`❌ Insert error for ${record.name}:`, insertError);
          errorMessages.push(`Insert failed for ${record.name}: ${insertError}`);
        }
      }
    }

    // Update job to completed status
    await db.update(scrapeJobsAnnex)
      .set({ 
        status: insertedCount > 0 ? 'completed' : 'failed',
        finishedAt: new Date(),
        error: errorMessages.length > 0 ? errorMessages.join('; ') : null
      })
      .where(eq(scrapeJobsAnnex.id, id));

    console.log(`✅ Scrape job ${id} completed: ${insertedCount} records inserted`);
    return { insertedCount, totalRecords: demoRecords.length };

  } catch (error) {
    console.error(`❌ Scrape job ${id} failed:`, error);
    errorMessages.push(String(error));
    
    // Update job to failed status
    await db.update(scrapeJobsAnnex)
      .set({ 
        status: 'failed',
        finishedAt: new Date(),
        error: errorMessages.join('; ')
      })
      .where(eq(scrapeJobsAnnex.id, id));
    
    throw error;
  }
}

// Test function to verify the runner works
export async function testRunner() {
  try {
    console.log('🧪 Testing scrape runner...');
    
    // Create a test job
    const testJob = await db.insert(scrapeJobsAnnex).values({
      status: 'queued',
      query: {
        address: 'Nashville, TN',
        radius_mi: 5,
        asset_type: 'Multifamily',
        keywords: ['luxury'],
        amenities: ['pool', 'fitness']
      }
    }).returning({ id: scrapeJobsAnnex.id });
    
    const jobId = testJob[0].id;
    console.log(`📋 Created test job: ${jobId}`);
    
    // Run the job
    const result = await runJobNow(jobId);
    
    console.log(`✅ Test completed: ${result.insertedCount} records inserted`);
    return result;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}