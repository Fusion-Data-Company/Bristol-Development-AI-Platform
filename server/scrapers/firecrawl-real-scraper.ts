/**
 * Real Firecrawl Scraper - Replaces placeholder jobs with working functionality
 * This implements the actual scraping logic that the placeholder jobs were supposed to do
 */

import { randomUUID } from 'crypto';
import { db } from '../db';
import { compsAnnex, scrapeJobsAnnex } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { normalizeRecord } from './normalizer';

interface FirecrawlJob {
  id: string;
  query: {
    address: string;
    keywords: string[];
    amenities: string[];
    radius_mi: number;
    asset_type: string;
  };
  status: 'pending' | 'running' | 'completed' | 'failed';
}

interface PropertyResult {
  propertyName?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  totalUnits?: number;
  rentRange?: string;
  averageRent?: number;
  amenities?: string[];
  yearBuilt?: number;
  propertyClass?: string;
  managementCompany?: string;
  website?: string;
  sourceUrl?: string;
}

export class FirecrawlRealScraper {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.FIRECRAWL_API_KEY!;
    if (!this.apiKey) {
      throw new Error('FIRECRAWL_API_KEY is required');
    }
  }

  async executeJob(jobId: string): Promise<void> {
    try {
      console.log(`🔥 Starting real Firecrawl job: ${jobId}`);
      
      // Get job details
      const jobResult = await db.select()
        .from(scrapeJobsAnnex)
        .where(eq(scrapeJobsAnnex.id, jobId))
        .limit(1);

      if (!jobResult.length) {
        throw new Error(`Job ${jobId} not found`);
      }

      const job = jobResult[0] as FirecrawlJob;
      
      // Update status to running
      await db.update(scrapeJobsAnnex)
        .set({ 
          status: 'running',
          startedAt: new Date()
        })
        .where(eq(scrapeJobsAnnex.id, jobId));

      // Build search query based on job parameters
      const searchQuery = this.buildSearchQuery(job.query);
      console.log(`🔍 Search query: ${searchQuery}`);

      // Execute Firecrawl search
      const searchResults = await this.performFirecrawlSearch(searchQuery);
      
      if (searchResults.length === 0) {
        console.log(`⚠️ No results found for query: ${searchQuery}`);
      }

      // Extract property data from results
      const properties = await this.extractPropertiesFromResults(searchResults);
      
      // Store results in database
      const storedCount = await this.storeProperties(properties, jobId);
      
      // Update job as completed
      await db.update(scrapeJobsAnnex)
        .set({ 
          status: 'completed',
          finishedAt: new Date(),
          meta: { propertiesFound: storedCount, searchQuery }
        })
        .where(eq(scrapeJobsAnnex.id, jobId));

      console.log(`✅ Job ${jobId} completed: ${storedCount} properties stored`);

    } catch (error) {
      console.error(`❌ Job ${jobId} failed:`, error);
      
      // Update job as failed
      await db.update(scrapeJobsAnnex)
        .set({ 
          status: 'failed',
          finishedAt: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        .where(eq(scrapeJobsAnnex.id, jobId));
    }
  }

  private buildSearchQuery(query: any): string {
    const { address, keywords, amenities, asset_type } = query;
    
    const parts = [
      asset_type || 'multifamily',
      'apartments',
      'properties',
      ...keywords,
      `in ${address}`
    ];

    if (amenities && amenities.length > 0) {
      parts.push(`with ${amenities.join(' ')}`);
    }

    return parts.join(' ').toLowerCase();
  }

  private async performFirecrawlSearch(query: string): Promise<any[]> {
    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        query,
        limit: 15,
        lang: 'en',
        country: 'us',
        scrapeOptions: {
          formats: ['extract', 'markdown'],
          onlyMainContent: true,
          waitFor: 2000,
          timeout: 30000,
          schema: {
            type: 'object',
            properties: {
              properties: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    propertyName: { type: 'string' },
                    address: { type: 'string' },
                    city: { type: 'string' },
                    state: { type: 'string' },
                    zipCode: { type: 'string' },
                    totalUnits: { type: 'number' },
                    rentRange: { type: 'string' },
                    averageRent: { type: 'number' },
                    amenities: { type: 'array', items: { type: 'string' } },
                    yearBuilt: { type: 'number' },
                    propertyClass: { type: 'string' },
                    managementCompany: { type: 'string' },
                    website: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Firecrawl search failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result.success ? result.data : [];
  }

  private async extractPropertiesFromResults(searchResults: any[]): Promise<PropertyResult[]> {
    const properties: PropertyResult[] = [];

    for (const result of searchResults) {
      if (result.extract && result.extract.properties) {
        for (const property of result.extract.properties) {
          properties.push({
            ...property,
            sourceUrl: result.url
          });
        }
      }
    }

    return properties;
  }

  private async storeProperties(properties: PropertyResult[], jobId: string): Promise<number> {
    let storedCount = 0;

    for (const property of properties) {
      try {
        const normalized = normalizeRecord({
          name: property.propertyName || 'Unknown Property',
          address: property.address || '',
          city: property.city || '',
          state: property.state || '',
          zip: property.zipCode || '',
          units: property.totalUnits || null,
          assetType: 'Multifamily',
          subtype: property.propertyClass || 'Unknown',
          yearBuilt: property.yearBuilt || null,
          amenityTags: property.amenities || [],
          notes: `Management: ${property.managementCompany || 'N/A'}`,
          source: 'firecrawl_real',
          sourceUrl: property.sourceUrl || '',
          rentPu: property.averageRent || null,
          jobId
        });

        await db.insert(compsAnnex).values({
          ...normalized,
          id: randomUUID(),
          scrapedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        });

        storedCount++;
      } catch (error) {
        console.warn('Failed to store property:', error);
      }
    }

    return storedCount;
  }
}

// Function to process all pending jobs
export async function processAllPendingJobs(): Promise<void> {
  const scraper = new FirecrawlRealScraper();
  
  const pendingJobs = await db.select()
    .from(scrapeJobsAnnex)
    .where(eq(scrapeJobsAnnex.status, 'running'));

  console.log(`📋 Found ${pendingJobs.length} running jobs to process`);

  for (const job of pendingJobs) {
    try {
      await scraper.executeJob(job.id);
    } catch (error) {
      console.error(`Failed to process job ${job.id}:`, error);
    }
  }
}

// Function to create a new real scraping job
export async function createRealScrapingJob(query: any): Promise<string> {
  const jobId = randomUUID();
  
  await db.insert(scrapeJobsAnnex).values({
    query,
    status: 'pending',
    createdAt: new Date()
  });

  // Process the job immediately
  const scraper = new FirecrawlRealScraper();
  setImmediate(() => scraper.executeJob(jobId));

  return jobId;
}