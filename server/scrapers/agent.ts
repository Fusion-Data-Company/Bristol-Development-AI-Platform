import { promises as fs } from 'fs';
import path from 'path';
import cheerio from 'cheerio';
import scrapeIt from 'scrape-it';
import PQueue from 'p-queue';

interface ScrapeQuery {
  address: string;
  radius_mi: number;
  asset_type: string;
  amenities?: string[];
  keywords?: string[];
}

interface ScrapeResult {
  source: string;
  sourceUrl: string;
  name: string;
  address: string;
  city?: string;
  state?: string;
  zip?: string;
  assetType: string;
  units?: number;
  yearBuilt?: number;
  rentPsf?: number;
  rentPu?: number;
  occupancyPct?: number;
  concessionPct?: number;
  amenityTags?: string[];
  notes?: string;
  canonicalAddress: string;
  unitPlan?: string;
}

interface AgentResponse {
  records: ScrapeResult[];
  source: string;
  caveats: string[];
}

const queue = new PQueue({ 
  concurrency: parseInt(process.env.SCRAPER_CONCURRENCY || '2'), 
  interval: parseInt(process.env.SCRAPER_INTERVAL_MS || '1000'), 
  intervalCap: parseInt(process.env.SCRAPER_INTERVAL_CAP || '4') 
});

export async function runScrapeAgent(query: ScrapeQuery): Promise<AgentResponse> {
  console.log('Starting scrape agent with query:', query);
  
  const caveats: string[] = [];
  let records: ScrapeResult[] = [];
  let source = 'fallback';

  // Try Firecrawl first (premium scraping)
  if (process.env.FIRECRAWL_API_KEY) {
    try {
      console.log('Attempting Firecrawl scraping...');
      const firecrawlResults = await runFirecrawlScrape(query);
      if (firecrawlResults.length > 0) {
        records = firecrawlResults;
        source = 'firecrawl';
        console.log(`Firecrawl found ${records.length} records`);
      }
    } catch (error: any) {
      console.warn('Firecrawl failed:', error.message);
      caveats.push('Firecrawl API failed: ' + error.message);
    }
  } else {
    caveats.push('Firecrawl API key not configured');
  }

  // Try Apify if Firecrawl failed
  if (records.length === 0 && process.env.APIFY_TOKEN) {
    try {
      console.log('Attempting Apify scraping...');
      const apifyResults = await runApifyScrape(query);
      if (apifyResults.length > 0) {
        records = apifyResults;
        source = 'apify';
        console.log(`Apify found ${records.length} records`);
      }
    } catch (error: any) {
      console.warn('Apify failed:', error.message);
      caveats.push('Apify API failed: ' + error.message);
    }
  } else if (records.length === 0) {
    caveats.push('Apify token not configured');
  }

  // Fallback to ScrapeIt + Cheerio
  if (records.length === 0) {
    try {
      console.log('Using fallback scraping...');
      const fallbackResults = await runFallbackScrape(query);
      records = fallbackResults;
      source = 'fallback';
      console.log(`Fallback found ${records.length} records`);
    } catch (error: any) {
      console.warn('Fallback scraping failed:', error.message);
      caveats.push('Fallback scraping failed: ' + error.message);
    }
  }

  // Process and enhance records
  records = records.map(record => ({
    ...record,
    canonicalAddress: canonicalizeAddress(record.address),
    amenityTags: extractAmenities(record.notes || '', query.amenities),
    unitPlan: generateUnitPlan(record)
  }));

  return { records, source, caveats };
}

async function runFirecrawlScrape(query: ScrapeQuery): Promise<ScrapeResult[]> {
  // Firecrawl integration - requires API key
  const firecrawlEndpoint = 'https://api.firecrawl.dev/v0/scrape';
  
  const searchUrls = generateSearchUrls(query);
  const results: ScrapeResult[] = [];

  for (const url of searchUrls) {
    try {
      const response = await fetch(firecrawlEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url,
          extractorOptions: {
            mode: 'llm-extraction',
            extractionPrompt: `Extract real estate property data from this page. Focus on:
            - Property name and address
            - Asset type (apartment, condo, office, retail)
            - Number of units
            - Year built
            - Rent per square foot and per unit
            - Occupancy percentage
            - Amenities (pool, fitness, parking, etc.)
            Return data in JSON format.`
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const extracted = parseFirecrawlResponse(data, url);
        results.push(...extracted);
      }
    } catch (error) {
      console.warn(`Firecrawl failed for ${url}:`, error);
    }
  }

  return results;
}

async function runApifyScrape(query: ScrapeQuery): Promise<ScrapeResult[]> {
  // Apify integration - requires token
  const { ApifyApi } = await import('apify');
  const apifyClient = new ApifyApi({ token: process.env.APIFY_TOKEN });

  const input = {
    searchTerms: [
      `${query.asset_type} properties near ${query.address}`,
      `apartments for rent ${query.address}`,
      `real estate ${query.address} ${query.radius_mi} miles`
    ],
    maxResults: 50,
    includeMetadata: true
  };

  try {
    const run = await apifyClient.actor('dhrumil/real-estate-scraper').call(input);
    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
    
    return items.map((item: any) => parseApifyItem(item)).filter(Boolean);
  } catch (error) {
    console.error('Apify scraping failed:', error);
    return [];
  }
}

async function runFallbackScrape(query: ScrapeQuery): Promise<ScrapeResult[]> {
  const seedUrls = (process.env.SCRAPER_SEED_URLS || '').split(',').filter(Boolean);
  const results: ScrapeResult[] = [];

  if (seedUrls.length === 0) {
    console.warn('No seed URLs configured for fallback scraping');
    return [];
  }

  for (const baseUrl of seedUrls) {
    try {
      const searchUrl = `${baseUrl}/search?q=${encodeURIComponent(query.address)}&type=${query.asset_type}`;
      
      const scraped = await scrapeIt(searchUrl, {
        properties: {
          listItem: '.property-listing, .listing-item, .property-card',
          data: {
            name: '.property-name, .listing-title, h3, h4',
            address: '.property-address, .address, .location',
            price: '.price, .rent, .rental-price',
            units: '.units, .bedrooms, .unit-count',
            amenities: '.amenities, .features',
            url: {
              attr: 'href',
              selector: 'a'
            }
          }
        }
      });

      for (const prop of scraped.data.properties || []) {
        const result = parseFallbackProperty(prop, baseUrl);
        if (result) {
          results.push(result);
        }
      }
    } catch (error) {
      console.warn(`Fallback scraping failed for ${baseUrl}:`, error);
    }
  }

  return results;
}

function generateSearchUrls(query: ScrapeQuery): string[] {
  const baseUrls = [
    'https://www.apartments.com',
    'https://www.rentals.com',
    'https://www.realtor.com'
  ];

  return baseUrls.map(base => 
    `${base}/search?location=${encodeURIComponent(query.address)}&radius=${query.radius_mi}&type=${query.asset_type}`
  );
}

function parseFirecrawlResponse(data: any, sourceUrl: string): ScrapeResult[] {
  try {
    const extracted = data.llm_extraction || data.extractedData || {};
    if (extracted.properties && Array.isArray(extracted.properties)) {
      return extracted.properties.map((prop: any) => ({
        source: 'firecrawl',
        sourceUrl,
        name: prop.name || 'Property',
        address: prop.address || '',
        city: prop.city,
        state: prop.state,
        zip: prop.zip,
        assetType: prop.assetType || 'apartment',
        units: parseInt(prop.units) || undefined,
        yearBuilt: parseInt(prop.yearBuilt) || undefined,
        rentPsf: parseFloat(prop.rentPsf) || undefined,
        rentPu: parseFloat(prop.rentPu) || undefined,
        occupancyPct: parseFloat(prop.occupancy) || undefined,
        amenityTags: prop.amenities || [],
        notes: prop.description || '',
        canonicalAddress: '',
        unitPlan: ''
      }));
    }
  } catch (error) {
    console.warn('Failed to parse Firecrawl response:', error);
  }
  return [];
}

function parseApifyItem(item: any): ScrapeResult | null {
  try {
    return {
      source: 'apify',
      sourceUrl: item.url || '',
      name: item.title || item.name || 'Property',
      address: item.address || '',
      city: item.city,
      state: item.state,
      zip: item.zipCode,
      assetType: item.propertyType || 'apartment',
      units: parseInt(item.units) || undefined,
      yearBuilt: parseInt(item.yearBuilt) || undefined,
      rentPsf: parseFloat(item.pricePerSqft) || undefined,
      rentPu: parseFloat(item.rent) || undefined,
      occupancyPct: parseFloat(item.occupancy) || undefined,
      amenityTags: item.amenities || [],
      notes: item.description || '',
      canonicalAddress: '',
      unitPlan: ''
    };
  } catch (error) {
    console.warn('Failed to parse Apify item:', error);
    return null;
  }
}

function parseFallbackProperty(prop: any, baseUrl: string): ScrapeResult | null {
  try {
    const rentMatch = (prop.price || '').match(/\$?([\d,]+)/);
    const unitsMatch = (prop.units || '').match(/(\d+)/);

    return {
      source: 'fallback',
      sourceUrl: prop.url ? new URL(prop.url, baseUrl).href : baseUrl,
      name: prop.name || 'Property',
      address: prop.address || '',
      assetType: 'apartment',
      units: unitsMatch ? parseInt(unitsMatch[1]) : undefined,
      rentPu: rentMatch ? parseInt(rentMatch[1].replace(/,/g, '')) : undefined,
      amenityTags: extractAmenitiesFromText(prop.amenities || ''),
      notes: prop.amenities || '',
      canonicalAddress: '',
      unitPlan: ''
    };
  } catch (error) {
    console.warn('Failed to parse fallback property:', error);
    return null;
  }
}

function canonicalizeAddress(address: string): string {
  return address
    .toLowerCase()
    .replace(/\b(street|st|avenue|ave|road|rd|drive|dr|boulevard|blvd)\b/g, (match) => {
      const abbrevs: Record<string, string> = {
        'street': 'st', 'avenue': 'ave', 'road': 'rd', 
        'drive': 'dr', 'boulevard': 'blvd'
      };
      return abbrevs[match] || match;
    })
    .replace(/\s+/g, ' ')
    .trim();
}

function extractAmenities(text: string, targetAmenities?: string[]): string[] {
  const amenityKeywords = [
    'pool', 'fitness', 'gym', 'parking', 'garage', 'balcony', 'deck',
    'dishwasher', 'laundry', 'ac', 'heating', 'pet friendly', 'elevator',
    'concierge', 'doorman', 'rooftop', 'garden', 'clubhouse'
  ];

  const found = amenityKeywords.filter(keyword => 
    text.toLowerCase().includes(keyword)
  );

  if (targetAmenities) {
    found.push(...targetAmenities.filter(amenity =>
      text.toLowerCase().includes(amenity.toLowerCase())
    ));
  }

  return [...new Set(found)];
}

function extractAmenitiesFromText(text: string): string[] {
  const amenityPatterns = [
    /pool/i, /fitness|gym/i, /parking|garage/i, /balcony/i,
    /laundry/i, /pet.friendly/i, /elevator/i, /ac|air.conditioning/i
  ];

  return amenityPatterns
    .map(pattern => pattern.test(text) ? pattern.source.replace(/[\/\\gi]/g, '') : null)
    .filter(Boolean) as string[];
}

function generateUnitPlan(record: ScrapeResult): string {
  const parts = [];
  if (record.units) parts.push(`${record.units}u`);
  if (record.rentPsf) parts.push(`$${record.rentPsf}psf`);
  if (record.rentPu) parts.push(`$${record.rentPu}pu`);
  return parts.join('|');
}