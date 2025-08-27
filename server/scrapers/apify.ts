import { ScrapeQuery, ScrapeResult } from './agent';
import { normalizeRecord } from './normalizer';

const APIFY_TOKEN = process.env.APIFY_TOKEN;

export async function scrapeApify(query: ScrapeQuery): Promise<ScrapeResult> {
  // Simplified Apify implementation using basic web crawling
  console.log('🕷️ Starting simplified crawling (Apify not available)...');
  
  try {
    const targetUrls = buildApifyTargetUrls(query);
    const properties: any[] = [];
    
    // Basic crawling implementation
    for (const url of targetUrls.slice(0, 3)) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Company Property Scraper/1.0)'
          }
        });
        
        if (response.ok) {
          const html = await response.text();
          const extracted = extractPropertiesFromHtml(html, url, query);
          properties.push(...extracted);
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.warn(`Failed to crawl ${url}:`, error);
      }
    }
    
    const normalized = properties.map(record => normalizeRecord(record));
    
    return {
      records: normalized,
      source: 'apify',
      meta: {
        requests_used: targetUrls.length,
        cost: 0,
      },
      caveats: normalized.length === 0 ? ['No properties extracted from crawled content'] : undefined
    };

  } catch (error) {
    console.error('Apify scraping failed:', error);
    return {
      records: [],
      source: 'apify',
      caveats: [`Apify error: ${error}`]
    };
  }
}

function buildApifyTargetUrls(query: ScrapeQuery): string[] {
  const urls: string[] = [];
  
  // Parse location from address
  const { city, state } = parseAddressForApify(query.address);
  
  if (city && state) {
    const citySlug = city.toLowerCase().replace(/\s+/g, '-');
    const stateSlug = state.toLowerCase();
    
    // Target major apartment listing sites
    urls.push(
      `https://www.apartments.com/${citySlug}-${stateSlug}/`,
      `https://www.apartmentlist.com/${stateSlug}/${citySlug}/`,
      `https://www.rentals.com/${citySlug}-${stateSlug}/`,
      `https://www.rent.com/${citySlug}-${stateSlug}/apartments/`,
      `https://www.realtor.com/apartments/${citySlug}_${stateSlug}/`,
    );
  }

  // Add asset type specific URLs
  if (query.asset_type === 'Condo') {
    urls.push(
      `https://www.condos.com/search/${city}-${state}`,
      `https://www.realtor.com/condos/${city?.toLowerCase()}_${state?.toLowerCase()}/`
    );
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

function parseAddressForApify(address: string): { city?: string; state?: string } {
  // Enhanced address parsing for Apify
  const cleanAddress = address.replace(/[^\w\s,]/g, '').trim();
  const parts = cleanAddress.split(',').map(part => part.trim());
  
  // Try different patterns
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i];
    
    // Check for state abbreviation
    if (part.length === 2 && /^[A-Z]{2}$/i.test(part)) {
      return {
        state: part.toUpperCase(),
        city: parts[i - 1]
      };
    }
    
    // Check for "City, State" pattern
    if (i === parts.length - 1 && part.includes(' ')) {
      const subParts = part.split(' ');
      const lastSubPart = subParts[subParts.length - 1];
      if (lastSubPart.length === 2) {
        return {
          state: lastSubPart.toUpperCase(),
          city: subParts.slice(0, -1).join(' ') || parts[i - 1]
        };
      }
    }
  }
  
  // Fallback: assume last two parts are city, state
  if (parts.length >= 2) {
    return {
      city: parts[parts.length - 2],
      state: parts[parts.length - 1]
    };
  }
  
  return {};
}

function extractPropertiesFromHtml(html: string, sourceUrl: string, query: ScrapeQuery): any[] {
  const properties: any[] = [];
  
  // Extract basic property information from HTML
  const addressPattern = /\d+\s+[A-Za-z\s]+(?:St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Blvd|Boulevard|Ln|Lane|Ct|Court)/gi;
  const rentPattern = /\$[\d,]+(?:\.\d{2})?/g;
  
  const addresses = html.match(addressPattern) || [];
  const rents = html.match(rentPattern) || [];
  
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

function extractPropertiesFromApifyResults(items: any[], query: ScrapeQuery): any[] {
  const properties: any[] = [];
  
  for (const item of items) {
    try {
      const text = item.text || item.content || '';
      const url = item.url || '';
      
      // Skip if content is too short or doesn't seem property-related
      if (text.length < 100 || !containsPropertyKeywords(text)) {
        continue;
      }
      
      // Extract property information using regex patterns
      const extractedProperties = extractPropertyInfoFromText(text, url, query);
      properties.push(...extractedProperties);
      
    } catch (error) {
      console.warn('Error processing Apify item:', error);
    }
  }
  
  return properties;
}

function containsPropertyKeywords(text: string): boolean {
  const keywords = [
    'apartment', 'rental', 'rent', 'lease', 'property', 'unit', 'bedroom', 'bath',
    'sqft', 'square feet', 'amenities', 'pet', 'parking', 'pool', 'fitness',
    'available', 'contact', 'apply', 'tour', 'floor plan'
  ];
  
  const lowerText = text.toLowerCase();
  return keywords.some(keyword => lowerText.includes(keyword));
}

function extractPropertyInfoFromText(text: string, sourceUrl: string, query: ScrapeQuery): any[] {
  const properties: any[] = [];
  
  // Enhanced extraction patterns
  const patterns = {
    address: /(?:\d+\s+)?[A-Za-z\s]+(?:St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Blvd|Boulevard|Ln|Lane|Ct|Court|Way|Pl|Place)(?:\s*#?\d+)?/gi,
    rent: /\$[\d,]+(?:\.\d{2})?(?:\s*\/?\s*(?:month|mo|monthly))?/gi,
    units: /(\d+)\s*(?:units?|apartments?)/gi,
    bedrooms: /(\d+)\s*(?:bed|bedroom|br)\b/gi,
    bathrooms: /(\d+(?:\.\d+)?)\s*(?:bath|bathroom|ba)\b/gi,
    sqft: /(\d+(?:,\d+)?)\s*(?:sq\.?\s*ft\.?|square\s*feet|sqft)\b/gi,
    yearBuilt: /(?:built|constructed|established)[\s:]*(\d{4})/gi,
    amenities: /(?:amenities?|features?)[\s:]*([^.!?]+)/gi
  };
  
  // Find all matches
  const addresses = Array.from(text.matchAll(patterns.address)).map(m => m[0].trim());
  const rents = Array.from(text.matchAll(patterns.rent)).map(m => m[0]);
  const unitsMatches = Array.from(text.matchAll(patterns.units));
  const bedroomMatches = Array.from(text.matchAll(patterns.bedrooms));
  const bathroomMatches = Array.from(text.matchAll(patterns.bathrooms));
  const sqftMatches = Array.from(text.matchAll(patterns.sqft));
  const yearBuiltMatches = Array.from(text.matchAll(patterns.yearBuilt));
  const amenityMatches = Array.from(text.matchAll(patterns.amenities));
  
  // Extract property name from title or heading patterns
  const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i) || 
                    text.match(/^([^\n]+)/) ||
                    text.match(/(?:property|apartment|complex)[\s:]*([^.!?\n]+)/i);
  
  const propertyName = titleMatch ? titleMatch[1].trim() : null;
  
  // Combine extracted data into property records
  addresses.slice(0, 5).forEach((address, index) => {
    const property: any = {
      name: propertyName || `Property at ${address}`,
      address: address,
      sourceUrl: sourceUrl
    };
    
    // Add rent if available
    if (rents[index]) {
      const rentValue = rents[index].replace(/[$,\/month|mo|monthly]/gi, '').trim();
      property.rentPu = parseFloat(rentValue) || null;
    }
    
    // Add units if available
    if (unitsMatches[index]) {
      property.units = parseInt(unitsMatches[index][1]) || null;
    }
    
    // Add bedrooms/bathrooms to derive unit plan
    if (bedroomMatches[index] || bathroomMatches[index]) {
      const beds = bedroomMatches[index] ? bedroomMatches[index][1] : '';
      const baths = bathroomMatches[index] ? bathroomMatches[index][1] : '';
      if (beds || baths) {
        property.unitPlan = `${beds}x${baths}`.replace(/^x|x$/g, '');
      }
    }
    
    // Add square footage
    if (sqftMatches[index]) {
      const sqft = parseInt(sqftMatches[index][1].replace(/,/g, '')) || null;
      if (sqft && property.rentPu) {
        property.rentPsf = property.rentPu / sqft;
      }
    }
    
    // Add year built
    if (yearBuiltMatches[index]) {
      property.yearBuilt = parseInt(yearBuiltMatches[index][1]) || null;
    }
    
    // Extract amenities
    const amenityTags: string[] = [];
    amenityMatches.forEach(match => {
      const amenityText = match[1].toLowerCase();
      const commonAmenities = [
        'pool', 'fitness', 'gym', 'parking', 'pet', 'laundry', 'balcony',
        'air conditioning', 'heating', 'dishwasher', 'microwave', 'elevator'
      ];
      
      commonAmenities.forEach(amenity => {
        if (amenityText.includes(amenity)) {
          amenityTags.push(amenity);
        }
      });
    });
    
    if (amenityTags.length > 0) {
      property.amenityTags = Array.from(new Set(amenityTags));
    }
    
    // Set asset type based on query or content
    property.assetType = query.asset_type || 'Multifamily';
    
    properties.push(property);
  });
  
  return properties;
}