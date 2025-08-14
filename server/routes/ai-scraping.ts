import { Router } from 'express';
import { db } from '../db';
import { compsAnnex } from '../../shared/schema';
import { normalizeRecord } from '../scrapers/normalizer';
import { randomUUID } from 'crypto';
import { sql, desc } from 'drizzle-orm';

const router = Router();

// Interface for AI-initiated scraping requests
interface AIScrapeRequest {
  urls: string[];
  query?: string;
  extractSchema?: any;
  sessionId?: string;
  userId?: string;
}

// Route for AI agent to initiate property scraping
router.post('/ai-scrape', async (req, res) => {
  try {
    const { urls, query, extractSchema, sessionId, userId } = req.body as AIScrapeRequest;
    
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: 'URLs array is required' });
    }

    console.log(`🤖 AI-initiated scraping: ${urls.length} URLs`);
    
    const results: any[] = [];
    const jobId = randomUUID();
    
    // Default schema for property extraction
    const propertySchema = extractSchema || {
      type: 'object',
      properties: {
        properties: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Property or complex name' },
              address: { type: 'string', description: 'Full street address' },
              city: { type: 'string', description: 'City name' },
              state: { type: 'string', description: 'State abbreviation' },
              zip: { type: 'string', description: 'ZIP code' },
              units: { type: 'number', description: 'Total number of units' },
              rent: { type: 'string', description: 'Rent range or price' },
              rentPerUnit: { type: 'number', description: 'Average rent per unit' },
              rentPerSqft: { type: 'number', description: 'Rent per square foot' },
              amenities: { 
                type: 'array', 
                items: { type: 'string' },
                description: 'List of property amenities'
              },
              yearBuilt: { type: 'number', description: 'Year property was built' },
              occupancy: { type: 'string', description: 'Occupancy status or rate' },
              squareFeet: { type: 'number', description: 'Total or average square footage' },
              assetType: { type: 'string', description: 'Property type (e.g., Multifamily, Apartment)' },
              phone: { type: 'string', description: 'Contact phone number' },
              website: { type: 'string', description: 'Property website URL' }
            }
          }
        }
      }
    };

    // Process each URL
    for (const url of urls.slice(0, 10)) { // Limit to 10 URLs for cost control
      try {
        console.log(`🔥 Processing URL: ${url}`);
        
        // Use Firecrawl to extract property data
        const extractedData = await extractPropertyDataFromUrl(url, propertySchema);
        
        if (extractedData && extractedData.properties) {
          // Normalize and store each property
          for (const rawProperty of extractedData.properties) {
            try {
              const normalized = normalizeRecord({
                ...rawProperty,
                sourceUrl: url,
                source: 'ai_firecrawl',
                jobId
              });
              
              // Store in database
              await db.insert(compsAnnex).values({
                ...normalized,
                id: randomUUID(),
                scrapedAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
                jobId,
                source: 'ai_firecrawl'
              });
              
              results.push(normalized);
            } catch (normalizeError) {
              console.warn('Failed to normalize property:', normalizeError);
            }
          }
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (urlError) {
        console.warn(`Error processing URL ${url}:`, urlError);
      }
    }

    console.log(`✅ AI scraping completed: ${results.length} properties extracted`);
    
    res.json({
      success: true,
      jobId,
      propertiesFound: results.length,
      properties: results,
      metadata: {
        source: 'ai_firecrawl',
        urlsProcessed: urls.slice(0, 10).length,
        totalRequested: urls.length,
        query: query || 'AI-initiated property scraping',
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('AI scraping failed:', error);
    res.status(500).json({ 
      success: false,
      error: 'AI scraping failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper function to extract property data using Firecrawl
async function extractPropertyDataFromUrl(url: string, schema: any): Promise<any> {
  const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
  
  if (!FIRECRAWL_API_KEY) {
    throw new Error('FIRECRAWL_API_KEY not configured');
  }

  const response = await fetch('https://api.firecrawl.dev/v1/extract', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${FIRECRAWL_API_KEY}`
    },
    body: JSON.stringify({
      urls: [url],
      prompt: 'Extract detailed property information including names, addresses, rent prices, amenities, unit counts, and contact details for multifamily/apartment properties.',
      schema,
      allowExternalLinks: false,
      includeSubdomains: false
    })
  });

  if (!response.ok) {
    throw new Error(`Firecrawl API error: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  
  if (result.success && result.data && result.data.length > 0) {
    return result.data[0].extract;
  }
  
  return null;
}

// Route to get recent AI scraping results
router.get('/ai-scrape/recent', async (req, res) => {
  try {
    const recentResults = await db
      .select()
      .from(compsAnnex)
      .where(sql`source = 'ai_firecrawl' AND scraped_at > NOW() - INTERVAL '1 hour'`)
      .orderBy(desc(compsAnnex.scrapedAt))
      .limit(20);
    
    res.json({
      success: true,
      properties: recentResults,
      count: recentResults.length
    });
    
  } catch (error) {
    console.error('Failed to get recent AI scraping results:', error);
    res.status(500).json({ success: false, error: 'Failed to get recent results' });
  }
});

export default router;