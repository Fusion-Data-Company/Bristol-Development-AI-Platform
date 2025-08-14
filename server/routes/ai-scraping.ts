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
    
    // Import elite real estate schema
    const { ELITE_REAL_ESTATE_SCHEMA } = await import('../mcp-tools/firecrawl-elite-real-estate');
    
    // Use elite schema or provided custom schema
    const propertySchema = extractSchema || ELITE_REAL_ESTATE_SCHEMA;

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
      prompt: `Extract comprehensive multifamily/apartment property data including:
      
      FINANCIAL: Rent ranges, pricing, fees, unit costs, investment metrics, cap rates, NOI
      PROPERTY: Unit counts, square footage, year built, amenities, features, unit mix
      PERFORMANCE: Occupancy rates, lease terms, turnover, concessions, lease-up velocity
      LOCATION: Address details, neighborhood info, walkability, transit scores, nearby attractions
      MANAGEMENT: Contact info, leasing details, management company, office hours
      MARKET: Property class, positioning, competitors, demographics, market analysis
      
      Focus on quantitative data and specific financial metrics. Extract all available investment-grade data.`,
      
      systemPrompt: 'You are an elite real estate data extraction specialist for multifamily investment analysis. Extract detailed, accurate property information focusing on financial metrics, unit counts, rental rates, occupancy data, and market positioning. Be precise with numbers and comprehensive with investment-grade details.',
      
      schema,
      allowExternalLinks: false,
      includeSubdomains: true,
      timeout: 45000,
      waitFor: 3000
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