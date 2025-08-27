import { Router } from 'express';
import { db } from '../db';
import { compsAnnex } from '../../shared/schema';
import { normalizeRecord } from '../scrapers/normalizer';
import { randomUUID } from 'crypto';
import { sql, desc } from 'drizzle-orm';
import { eliteExtractionEngine } from '../scrapers/elite-extraction-engine';
import { deepCrawlAnalyzer } from '../scrapers/deep-crawl-analyzer';

const router = Router();

// Import elite configurations
import { 
  ELITE_REAL_ESTATE_SCHEMA,
  ELITE_SEARCH_CONFIG,
  ELITE_CRAWL_CONFIG,
  ELITE_EXTRACT_CONFIG,
  DEFAULT_REAL_ESTATE_QUERIES
} from '../mcp-tools/firecrawl-elite-real-estate';

interface EliteSearchRequest {
  query: string;
  location?: string;
  propertyType?: string;
  limit?: number;
  sessionId?: string;
  userId?: string;
}

interface EliteCrawlRequest {
  url: string;
  maxDepth?: number;
  maxUrls?: number;
  sessionId?: string;
  userId?: string;
}

interface EliteExtractRequest {
  urls: string[];
  extractionFocus?: string;
  propertyClass?: string;
  sessionId?: string;
  userId?: string;
}

interface EliteResearchRequest {
  query: string;
  maxDepth?: number;
  timeLimit?: number;
  maxUrls?: number;
  sessionId?: string;
  userId?: string;
}

// Elite Property Search
router.post('/elite-search', async (req, res) => {
  try {
    const { query, location, propertyType = 'multifamily', limit = 20, sessionId, userId } = req.body as EliteSearchRequest;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    console.log(`🏢 Elite property search: "${query}" in ${location || 'all markets'}`);
    
    const jobId = randomUUID();
    const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
    
    if (!FIRECRAWL_API_KEY) {
      return res.status(500).json({ error: 'Firecrawl API key not configured' });
    }

    // Enhanced search query with location and property type
    const enhancedQuery = location 
      ? `${query} ${propertyType} properties in ${location}`
      : `${query} ${propertyType} properties`;

    const searchConfig = {
      ...ELITE_SEARCH_CONFIG,
      limit: Math.min(limit, 50)
    };

    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`
      },
      body: JSON.stringify({
        query: enhancedQuery,
        ...searchConfig
      })
    });

    if (!response.ok) {
      throw new Error(`Firecrawl search failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const properties = await processSearchResults(result, jobId);
    
    console.log(`✅ Elite search completed: ${properties.length} properties found`);
    
    res.json({
      success: true,
      jobId,
      propertiesFound: properties.length,
      properties,
      metadata: {
        source: 'company_elite_search',
        query: enhancedQuery,
        location,
        propertyType,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Elite search failed:', error);
    res.status(500).json({ 
      success: false,
      error: 'Elite search failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Elite Property Crawl - REAL IMPLEMENTATION  
router.post('/elite-crawl', async (req, res) => {
  try {
    const { url, maxDepth = 3, maxUrls = 25, sessionId, userId } = req.body as EliteCrawlRequest;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log(`🕷️ REAL Elite property crawl: ${url} (depth: ${maxDepth}, maxUrls: ${maxUrls})`);
    
    // Use the real deep crawl analyzer
    const result = await deepCrawlAnalyzer.performDeepCrawl({
      startUrls: [url],
      crawlDepth: Math.min(maxDepth, 4),
      propertyTypes: ['Multifamily', 'Apartment'],
      marketFocus: 'sunbelt',
      analysisType: 'market_survey'
    });
    
    console.log(`✅ REAL Elite crawl completed: ${result.propertiesFound} properties discovered`);
    
    res.json({
      success: result.success,
      jobId: result.jobId,
      urlsCrawled: result.urlsCrawled,
      propertiesFound: result.propertiesFound,
      results: result.results,
      metadata: {
        ...result.metadata,
        source: 'company_elite_crawl_real',
        engineType: 'deep_crawl_analyzer'
      }
    });
    
  } catch (error) {
    console.error('REAL Elite crawl failed:', error);
    res.status(500).json({ 
      success: false,
      error: 'Elite crawl failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Elite Property Extract - REAL IMPLEMENTATION
router.post('/elite-extract', async (req, res) => {
  try {
    const { urls, extractionFocus = 'financial', propertyClass = 'A', sessionId, userId } = req.body as EliteExtractRequest;
    
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: 'URLs array is required' });
    }

    console.log(`🎯 REAL Elite property extract: ${urls.length} URLs (focus: ${extractionFocus})`);
    
    // Use the real elite extraction engine
    const result = await eliteExtractionEngine.extractPropertiesFromUrls({
      urls: urls.slice(0, 15), // Limit for performance
      extractionFocus: extractionFocus as any,
      propertyClass: propertyClass as any,
      sessionId,
      userId
    });
    
    console.log(`✅ REAL Elite extract completed: ${result.propertiesExtracted} properties stored`);
    
    res.json({
      success: result.success,
      jobId: result.jobId,
      propertiesFound: result.propertiesExtracted,
      properties: result.properties,
      metadata: {
        ...result.metadata,
        source: 'company_elite_extract_real',
        urlsProcessed: urls.slice(0, 15).length,
        engineType: 'elite_extraction_engine'
      }
    });
    
  } catch (error) {
    console.error('REAL Elite extract failed:', error);
    res.status(500).json({ 
      success: false,
      error: 'Elite extract failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Elite Market Research
router.post('/elite-research', async (req, res) => {
  try {
    const { query, maxDepth = 3, timeLimit = 180, maxUrls = 50, sessionId, userId } = req.body as EliteResearchRequest;
    
    if (!query) {
      return res.status(400).json({ error: 'Research query is required' });
    }

    console.log(`🔬 Elite market research: "${query}" (depth: ${maxDepth}, time: ${timeLimit}s)`);
    
    const jobId = randomUUID();
    const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
    
    if (!FIRECRAWL_API_KEY) {
      return res.status(500).json({ error: 'Firecrawl API key not configured' });
    }

    const response = await fetch('https://api.firecrawl.dev/v1/deep-research', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`
      },
      body: JSON.stringify({
        query,
        maxDepth: Math.min(maxDepth, 5),
        timeLimit: Math.min(timeLimit, 300),
        maxUrls: Math.min(maxUrls, 100)
      })
    });

    if (!response.ok) {
      throw new Error(`Firecrawl research failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    res.json({
      success: true,
      jobId,
      analysis: result.data?.finalAnalysis || result.data,
      sources: result.data?.sources || [],
      metadata: {
        source: 'company_elite_research',
        query,
        maxDepth,
        timeLimit,
        maxUrls,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Elite research failed:', error);
    res.status(500).json({ 
      success: false,
      error: 'Elite research failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper Functions
async function processSearchResults(searchResult: any, jobId: string): Promise<any[]> {
  const properties: any[] = [];
  
  if (searchResult.success && searchResult.data) {
    for (const item of searchResult.data) {
      if (item.extract && item.extract.properties) {
        for (const property of item.extract.properties) {
          try {
            const normalized = normalizeRecord({
              ...property,
              sourceUrl: item.url,
              source: 'company_elite_search',
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
              source: 'company_elite_search'
            });
            
            properties.push(normalized);
          } catch (error) {
            console.warn('Failed to process search result:', error);
          }
        }
      }
    }
  }
  
  return properties;
}

async function processExtractResults(extractResult: any, jobId: string): Promise<any[]> {
  const properties: any[] = [];
  
  if (extractResult.success && extractResult.data) {
    for (const item of extractResult.data) {
      if (item.extract && item.extract.properties) {
        for (const property of item.extract.properties) {
          try {
            const normalized = normalizeRecord({
              ...property,
              sourceUrl: item.url,
              source: 'company_elite_extract',
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
              source: 'company_elite_extract'
            });
            
            properties.push(normalized);
          } catch (error) {
            console.warn('Failed to process extract result:', error);
          }
        }
      }
    }
  }
  
  return properties;
}

function customizeExtractionPrompt(focus: string, propertyClass?: string): string {
  const basePrompt = 'Extract comprehensive multifamily/apartment property data';
  const classInfo = propertyClass ? ` for ${propertyClass}-class properties` : '';
  
  switch (focus) {
    case 'financial':
      return `${basePrompt}${classInfo} focusing on: rent ranges, pricing, fees, investment metrics, cap rates, NOI, price per unit, rental rates, concessions, and all financial performance data.`;
    
    case 'units':
      return `${basePrompt}${classInfo} focusing on: total units, unit mix (studio/1BR/2BR/3BR+), square footage, floor plans, unit features, occupancy rates, and unit-level details.`;
    
    case 'amenities':
      return `${basePrompt}${classInfo} focusing on: property amenities, unit features, community facilities, parking, pet policies, services, and resident perks.`;
    
    case 'location':
      return `${basePrompt}${classInfo} focusing on: address details, neighborhood info, walkability scores, transit access, nearby attractions, school districts, and location intelligence.`;
    
    case 'management':
      return `${basePrompt}${classInfo} focusing on: management company, contact information, leasing details, office hours, websites, and operational information.`;
    
    default:
      return `${basePrompt}${classInfo} including: financial metrics, unit details, amenities, location data, management info, and market positioning. Extract all available investment-grade data.`;
  }
}

export default router;