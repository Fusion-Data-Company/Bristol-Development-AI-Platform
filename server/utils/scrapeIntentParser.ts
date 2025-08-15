interface ScrapeIntent {
  address: string;
  radius_mi: number;
  asset_type: string;
  amenities: string[];
  keywords: string[];
}

export function parseScrapeIntent(message: string): ScrapeIntent | null {
  const lowerMessage = message.toLowerCase();

  // Check for scrape intent
  const scrapePatterns = [
    /scrape\s+comps?\s+(?:for|near|in)\s+(.+)/i,
    /pull\s+(?:comps?|comparables)\s+(?:for|near|in)\s+(.+)/i,
    /get\s+(?:data|properties)\s+(?:for|near|in)\s+(.+)/i,
    /search\s+properties\s+(?:for|near|in)\s+(.+)/i,
    /find\s+properties\s+(?:for|near|in)\s+(.+)/i
  ];

  let matchedPattern = null;
  for (const pattern of scrapePatterns) {
    const match = message.match(pattern);
    if (match) {
      matchedPattern = match[1];
      break;
    }
  }

  if (!matchedPattern) return null;

  // Extract address (everything before asset type or amenities)
  const addressMatch = matchedPattern.match(/^([^,]+(?:,\s*[A-Z]{2})?)/i);
  const address = addressMatch ? addressMatch[1].trim() : matchedPattern.split(/\s+(?:multifamily|apartment|condo|office|retail)/i)[0].trim();

  if (!address) return null;

  // Extract radius
  const radiusMatch = message.match(/(\d+)\s*(?:mile|mi|radius)/i);
  const radius_mi = radiusMatch ? parseInt(radiusMatch[1]) : 5;

  // Extract asset type
  let asset_type = 'Multifamily';
  const assetTypePatterns = [
    { pattern: /multifamily|apartment|apt/i, type: 'Multifamily' },
    { pattern: /condo|condominium/i, type: 'Condo' },
    { pattern: /office/i, type: 'Office' },
    { pattern: /retail/i, type: 'Retail' },
    { pattern: /industrial/i, type: 'Industrial' },
    { pattern: /mixed.use/i, type: 'Mixed Use' }
  ];

  for (const { pattern, type } of assetTypePatterns) {
    if (pattern.test(message)) {
      asset_type = type;
      break;
    }
  }

  // Extract amenities
  const amenities: string[] = [];
  const amenityPatterns = [
    { pattern: /pool/i, amenity: 'pool' },
    { pattern: /fitness|gym/i, amenity: 'fitness' },
    { pattern: /parking|garage/i, amenity: 'parking' },
    { pattern: /balcony/i, amenity: 'balcony' },
    { pattern: /laundry/i, amenity: 'laundry' },
    { pattern: /pet.friendly|pets?/i, amenity: 'pet friendly' },
    { pattern: /elevator/i, amenity: 'elevator' },
    { pattern: /concierge/i, amenity: 'concierge' },
    { pattern: /rooftop/i, amenity: 'rooftop' },
    { pattern: /ev.charg|electric.charg/i, amenity: 'ev charging' },
    { pattern: /dog.park/i, amenity: 'dog park' },
    { pattern: /cowork/i, amenity: 'coworking' }
  ];

  for (const { pattern, amenity } of amenityPatterns) {
    if (pattern.test(message)) {
      amenities.push(amenity);
    }
  }

  // Extract keywords
  const keywords: string[] = [];
  const keywordPatterns = [
    { pattern: /luxury|luxurious/i, keyword: 'luxury' },
    { pattern: /downtown|urban/i, keyword: 'downtown' },
    { pattern: /waterfront|water.view/i, keyword: 'waterfront' },
    { pattern: /new.construction|newly.built/i, keyword: 'new construction' },
    { pattern: /historic|heritage/i, keyword: 'historic' },
    { pattern: /gated|secure/i, keyword: 'gated' }
  ];

  for (const { pattern, keyword } of keywordPatterns) {
    if (pattern.test(message)) {
      keywords.push(keyword);
    }
  }

  return {
    address,
    radius_mi,
    asset_type,
    amenities,
    keywords
  };
}

export function formatScrapeResults(data: any): string {
  const { inserted, source, records = [], caveats = [] } = data;

  let response = `🏢 **Bristol Scraping Complete**\n\n`;
  response += `📊 **Summary:** Found ${inserted} properties using ${source} scraper\n\n`;

  if (records.length > 0) {
    response += `🎯 **Top Properties:**\n`;
    records.slice(0, 5).forEach((record: any, idx: number) => {
      response += `${idx + 1}. **${record.name}**\n`;
      response += `   📍 ${record.address}\n`;
      if (record.rentPu) response += `   💰 $${record.rentPu.toLocaleString()}/unit\n`;
      if (record.units) response += `   🏗️ ${record.units} units\n`;
      if (record.amenityTags?.length) response += `   ✨ ${record.amenityTags.join(', ')}\n`;
      response += `\n`;
    });
  }

  if (caveats.length > 0) {
    response += `⚠️ **Scraping Notes:**\n`;
    caveats.forEach((caveat: string) => {
      response += `• ${caveat}\n`;
    });
    response += `\n`;
  }

  response += `✅ All data has been added to the Comparables database and is available in the Comparables Annex page.`;

  return response;
}