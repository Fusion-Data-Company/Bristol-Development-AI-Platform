import { ScrapeQuery, ScrapeResult } from './agent';
import { normalizeRecord } from './normalizer';

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const FIRECRAWL_BASE_URL = 'https://api.firecrawl.dev/v1';

interface FirecrawlResponse {
  success: boolean;
  data?: {
    content?: string;
    html?: string;
    metadata?: any;
    extract?: any;
  };
  error?: string;
}

export async function scrapeFirecrawl(query: ScrapeQuery): Promise<ScrapeResult> {
  if (!FIRECRAWL_API_KEY) {
    return {
      records: [],
      source: 'firecrawl',
      caveats: ['FIRECRAWL_API_KEY not configured']
    };
  }

  try {
    const targetUrls = buildTargetUrls(query);
    console.log(`🔥 Firecrawl targeting ${targetUrls.length} URLs`);

    const results: any[] = [];
    let totalRequests = 0;

    for (const url of targetUrls.slice(0, 5)) { // Limit to 5 URLs to control costs
      try {
        const response = await scrapeUrl(url, query);
        totalRequests++;
        
        if (response.success && response.data) {
          const extracted = extractPropertyData(response.data, query);
          results.push(...extracted);
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.warn(`Firecrawl error for ${url}:`, error);
      }
    }

    // Normalize results
    const normalized = results.map(record => normalizeRecord(record));

    return {
      records: normalized,
      source: 'firecrawl',
      meta: {
        requests_used: totalRequests,
        cost: totalRequests * 0.01, // Estimated cost per request
      },
      caveats: results.length === 0 ? ['No properties found in target URLs'] : undefined
    };
  } catch (error) {
    console.error('Firecrawl scraping failed:', error);
    return {
      records: [],
      source: 'firecrawl',
      caveats: [`Firecrawl error: ${error}`]
    };
  }
}

async function scrapeUrl(url: string, query: ScrapeQuery): Promise<FirecrawlResponse> {
  const response = await fetch(`${FIRECRAWL_BASE_URL}/scrape`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${FIRECRAWL_API_KEY}`
    },
    body: JSON.stringify({
      url,
      formats: ['extract', 'html'],
      extract: {
        schema: {
          type: 'object',
          properties: {
            properties: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  address: { type: 'string' },
                  units: { type: 'number' },
                  rent: { type: 'string' },
                  amenities: { type: 'array', items: { type: 'string' } },
                  yearBuilt: { type: 'number' },
                  occupancy: { type: 'string' }
                }
              }
            }
          }
        }
      },
      includeTags: ['div', 'section', 'article'],
      onlyMainContent: true
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

function buildTargetUrls(query: ScrapeQuery): string[] {
  const urls: string[] = [];
  
  // Add seed URLs from environment
  const seedUrls = process.env.SCRAPER_SEED_URLS?.split(',') || [];
  urls.push(...seedUrls.map(url => url.trim()).filter(Boolean));

  // Build search URLs based on query
  const { city, state } = parseAddress(query.address);
  
  if (city && state) {
    // Add common apartment listing sites
    urls.push(
      `https://www.apartments.com/${city.toLowerCase()}-${state.toLowerCase()}/`,
      `https://www.rentals.com/${city.toLowerCase()}-${state.toLowerCase()}/`,
      `https://www.apartmentlist.com/${state.toLowerCase()}/${city.toLowerCase()}/`,
      `https://www.rent.com/${city.toLowerCase()}-${state.toLowerCase()}/apartments`,
    );
  }

  // Filter duplicates and invalid URLs
  return Array.from(new Set(urls)).filter(url => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  });
}

function parseAddress(address: string): { city?: string; state?: string } {
  // Simple address parsing - could be enhanced with geocoding API
  const parts = address.split(',').map(part => part.trim());
  
  if (parts.length >= 2) {
    const lastPart = parts[parts.length - 1];
    const secondLastPart = parts[parts.length - 2];
    
    // Check if last part looks like state (2 letters)
    if (lastPart.length === 2) {
      return {
        state: lastPart.toUpperCase(),
        city: secondLastPart
      };
    }
    
    // Check if last part has state + zip
    const stateZipMatch = lastPart.match(/([A-Z]{2})\s+\d{5}/);
    if (stateZipMatch) {
      return {
        state: stateZipMatch[1],
        city: secondLastPart
      };
    }
  }
  
  return {};
}

function extractPropertyData(data: any, query: ScrapeQuery): any[] {
  const properties: any[] = [];
  
  // Try extract schema first
  if (data.extract?.properties) {
    properties.push(...data.extract.properties);
  }
  
  // Fallback to HTML parsing if extract didn't work
  if (properties.length === 0 && data.html) {
    const htmlProperties = parseHtmlForProperties(data.html, query);
    properties.push(...htmlProperties);
  }
  
  return properties;
}

function parseHtmlForProperties(html: string, query: ScrapeQuery): any[] {
  // Basic HTML parsing for common property listing patterns
  const properties: any[] = [];
  
  // This is a simplified parser - in production, you'd want more sophisticated parsing
  const addressRegex = /\d+\s+[A-Za-z\s]+(?:St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Blvd|Boulevard|Ln|Lane|Ct|Court)/gi;
  const rentRegex = /\$[\d,]+(?:\.\d{2})?/g;
  const unitRegex = /(\d+)\s*(?:units?|beds?|bedrooms?)/gi;
  
  const addresses = html.match(addressRegex) || [];
  const rents = html.match(rentRegex) || [];
  
  // Create basic property records from patterns found
  addresses.slice(0, 10).forEach((address, index) => {
    properties.push({
      name: `Property at ${address}`,
      address: address.trim(),
      rent: rents[index] || null,
      sourceUrl: 'extracted_from_html'
    });
  });
  
  return properties;
}