import { ScrapeQuery, ScrapeResult } from './agent';
import { normalizeRecord } from './normalizer';
import * as cheerio from 'cheerio';

const SCRAPER_CONCURRENCY = parseInt(process.env.SCRAPER_CONCURRENCY || '2');
const SCRAPER_INTERVAL_MS = parseInt(process.env.SCRAPER_INTERVAL_MS || '1000');

export async function scrapeFallback(query: ScrapeQuery): Promise<ScrapeResult> {
  console.log('🆓 Starting fallback scraping...');
  
  try {
    const targetUrls = buildFallbackTargetUrls(query);
    
    if (targetUrls.length === 0) {
      return {
        records: [],
        source: 'fallback',
        caveats: ['No target URLs configured. Set SCRAPER_SEED_URLS environment variable.']
      };
    }

    console.log(`🆓 Targeting ${targetUrls.length} URLs with fallback scraper`);

    const results: any[] = [];

    // Process URLs sequentially with rate limiting
    for (const url of targetUrls) {
      try {
        const urlResults = await scrapeUrlWithCheerio(url, query);
        results.push(...urlResults);
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, SCRAPER_INTERVAL_MS));
      } catch (error) {
        console.warn(`Failed to scrape ${url}:`, error);
      }
    }
    // Normalize results
    const normalized = results.map(record => normalizeRecord(record));

    return {
      records: normalized,
      source: 'fallback',
      meta: {
        requests_used: targetUrls.length,
        cost: 0, // Free
      },
      caveats: normalized.length === 0 ? ['No properties found in target URLs'] : undefined
    };

  } catch (error) {
    console.error('Fallback scraping failed:', error);
    return {
      records: [],
      source: 'fallback',
      caveats: [`Fallback scraping error: ${error}`]
    };
  }
}

function buildFallbackTargetUrls(query: ScrapeQuery): string[] {
  const urls: string[] = [];
  
  // Get seed URLs from environment
  const seedUrls = process.env.SCRAPER_SEED_URLS?.split(',').map(url => url.trim()) || [];
  
  // Add basic property listing sites if no seeds provided
  if (seedUrls.length === 0) {
    const { city, state } = parseAddressForFallback(query.address);
    
    if (city && state) {
      // Add some public property listing sites (respect robots.txt)
      urls.push(
        `https://www.apartments.com/${city.toLowerCase()}-${state.toLowerCase()}/`,
        `https://www.rentals.com/${city.toLowerCase()}-${state.toLowerCase()}/`,
      );
    }
  } else {
    urls.push(...seedUrls);
  }

  return urls.filter(url => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  });
}

async function scrapeUrlWithCheerio(url: string, query: ScrapeQuery): Promise<any[]> {
  try {
    console.log(`🆓 Scraping ${url}...`);
    
    // Fetch with proper headers
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Company Property Scraper/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract properties using multiple strategies
    const properties = [
      ...extractFromStructuredData($, url),
      ...extractFromCommonSelectors($, url),
      ...extractFromTextPatterns($, url, query)
    ];

    console.log(`🆓 Extracted ${properties.length} properties from ${url}`);
    return properties;

  } catch (error) {
    console.warn(`🆓 Failed to scrape ${url}:`, error);
    return [];
  }
}

function extractFromStructuredData($: cheerio.CheerioAPI, sourceUrl: string): any[] {
  const properties: any[] = [];
  
  // Look for JSON-LD structured data
  $('script[type="application/ld+json"]').each((_, elem) => {
    try {
      const jsonContent = $(elem).html();
      if (!jsonContent) return;
      
      const data = JSON.parse(jsonContent);
      const items = Array.isArray(data) ? data : [data];
      
      items.forEach(item => {
        if (item['@type'] === 'Apartment' || item['@type'] === 'Property') {
          properties.push({
            name: item.name,
            address: item.address?.streetAddress || item.address,
            city: item.address?.addressLocality,
            state: item.address?.addressRegion,
            zip: item.address?.postalCode,
            rentPu: parseFloat(item.priceRange?.replace(/[^\d.]/g, '') || '0') || null,
            amenityTags: item.amenityFeature?.map((a: any) => a.name) || [],
            sourceUrl
          });
        }
      });
    } catch (error) {
      // Ignore JSON parsing errors
    }
  });
  
  return properties;
}

function extractFromCommonSelectors($: cheerio.CheerioAPI, sourceUrl: string): any[] {
  const properties: any[] = [];
  
  // Common property listing selectors
  const selectors = [
    '.property-item, .listing-item, .apartment-item',
    '.property-card, .listing-card, .apartment-card',
    '[data-property], [data-listing], [data-apartment]',
    '.property, .listing, .apartment, .rental'
  ];
  
  selectors.forEach(selector => {
    $(selector).each((_, elem) => {
      const $elem = $(elem);
      
      // Extract basic information
      const name = $elem.find('.property-name, .listing-name, .name, h2, h3').first().text().trim();
      const address = $elem.find('.address, .location, .property-address').first().text().trim();
      const rent = $elem.find('.rent, .price, .cost').first().text().trim();
      
      if (name && address) {
        const property: any = {
          name,
          address,
          sourceUrl
        };
        
        if (rent) {
          const rentValue = rent.replace(/[^\d.]/g, '');
          property.rentPu = parseFloat(rentValue) || null;
        }
        
        // Extract amenities
        const amenityText = $elem.find('.amenities, .features').text().toLowerCase();
        property.amenityTags = extractAmenitiesFromText(amenityText);
        
        properties.push(property);
      }
    });
  });
  
  return properties;
}

function extractFromTextPatterns($: cheerio.CheerioAPI, sourceUrl: string, query: ScrapeQuery): any[] {
  const properties: any[] = [];
  const text = $.text();
  
  // Use regex patterns to find property information
  const addressPattern = /\d+\s+[A-Za-z\s]+(?:St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Blvd|Boulevard|Ln|Lane|Ct|Court)/gi;
  const rentPattern = /\$[\d,]+(?:\.\d{2})?/g;
  
  const addresses = text.match(addressPattern) || [];
  const rents = text.match(rentPattern) || [];
  
  // Create basic property records
  addresses.slice(0, 5).forEach((address, index) => {
    properties.push({
      name: `Property at ${address}`,
      address: address.trim(),
      rentPu: rents[index] ? parseFloat(rents[index].replace(/[$,]/g, '')) : null,
      sourceUrl,
      assetType: query.asset_type || 'Multifamily'
    });
  });
  
  return properties;
}

function parseAddressForFallback(address: string): { city?: string; state?: string } {
  const parts = address.split(',').map(part => part.trim());
  
  if (parts.length >= 2) {
    const lastPart = parts[parts.length - 1];
    const secondLastPart = parts[parts.length - 2];
    
    // Check for state abbreviation
    if (lastPart.length === 2) {
      return {
        state: lastPart.toUpperCase(),
        city: secondLastPart
      };
    }
    
    // Check for state + zip pattern
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

function extractAmenitiesFromText(text: string): string[] {
  const amenities: string[] = [];
  const lowerText = text.toLowerCase();
  
  const commonAmenities = [
    'pool', 'swimming pool', 'fitness center', 'gym', 'spa', 'sauna',
    'tennis court', 'basketball court', 'clubhouse', 'business center',
    'ev charging', 'electric vehicle charging', 'parking', 'garage',
    'dog park', 'dog run', 'pet friendly', 'cats allowed', 'dogs allowed',
    'package receiving', 'concierge', 'doorman', '24-hour security',
    'in-unit laundry', 'washer dryer', 'w/d hookups',
    'balcony', 'patio', 'deck', 'terrace', 'rooftop',
    'near transit', 'metro accessible', 'bus line',
    'shopping nearby', 'dining', 'restaurants',
    'playground', 'kids area', 'family friendly',
    'high-speed internet', 'wifi included', 'smart home',
    'hardwood floors', 'granite counters', 'stainless steel appliances',
    'walk-in closets', 'storage unit', 'extra storage'
  ];
  
  commonAmenities.forEach(amenity => {
    if (lowerText.includes(amenity)) {
      amenities.push(amenity);
    }
  });
  
  return amenities;
}