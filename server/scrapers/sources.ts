export type Adapter = {
  name: string;
  search: (q: { address: string; radius_mi: number; asset_type: string; keywords: string[] }) => Promise<{ records: any[] }>;
};

function parseNumberLike(text?: string | null) {
  if (!text) return null;
  const t = String(text).replace(/[$,%\s]/g, '').replace(/[^0-9.\-]/g, '');
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function normalizeRecord(x: any) {
  return {
    source: x.source,
    sourceUrl: x.url,
    name: x.name?.trim(),
    address: x.address?.trim(),
    canonicalAddress: x.canonicalAddress ?? x.address?.toUpperCase(),
    city: x.city,
    state: x.state,
    zip: x.zip,
    assetType: x.assetType ?? 'Multifamily',
    subtype: x.subtype,
    units: parseNumberLike(x.units),
    yearBuilt: parseNumberLike(x.yearBuilt),
    rentPsf: parseNumberLike(x.rentPsf),
    rentPu: parseNumberLike(x.rentPu),
    occupancyPct: parseNumberLike(x.occupancyPct),
    concessionPct: parseNumberLike(x.concessionPct),
    amenityTags: Array.isArray(x.amenityTags) ? x.amenityTags : [],
    notes: x.notes?.trim(),
    unitPlan: x.unitPlan ?? 'Standard',
    lat: parseNumberLike(x.lat),
    lng: parseNumberLike(x.lng),
    provenance: x.provenance || {}
  };
}

// Sample data adapter for testing
const sampleDataAdapter: Adapter = {
  name: 'sample-data',
  search: async ({ address, radius_mi, asset_type }) => {
    // Generate realistic sample data based on the search parameters
    const sampleProperties = [
      {
        source: 'sample-data',
        name: 'Bristol Commons',
        address: '1234 Peachtree St',
        city: 'Atlanta',
        state: 'GA',
        zip: '30309',
        canonicalAddress: '1234 PEACHTREE ST',
        assetType: asset_type,
        subtype: 'Luxury',
        units: 245,
        yearBuilt: 2018,
        rentPsf: 2.85,
        rentPu: 1850,
        occupancyPct: 94.2,
        concessionPct: 2.5,
        amenityTags: ['Pool', 'Fitness Center', 'Parking', 'Pet Friendly'],
        notes: 'Luxury multifamily development in Midtown',
        unitPlan: 'Standard',
        lat: 33.7849,
        lng: -84.3888,
        provenance: { source: 'sample-data', timestamp: new Date() }
      },
      {
        source: 'sample-data',
        name: 'Meridian Place',
        address: '567 Spring St',
        city: 'Atlanta',
        state: 'GA',
        zip: '30308',
        canonicalAddress: '567 SPRING ST',
        assetType: asset_type,
        subtype: 'Mid-Rise',
        units: 180,
        yearBuilt: 2020,
        rentPsf: 3.10,
        rentPu: 2100,
        occupancyPct: 97.8,
        concessionPct: 1.0,
        amenityTags: ['Rooftop Deck', 'Concierge', 'Parking', 'Business Center'],
        notes: 'Modern high-rise in downtown core',
        unitPlan: 'Standard',
        lat: 33.7678,
        lng: -84.3889,
        provenance: { source: 'sample-data', timestamp: new Date() }
      },
      {
        source: 'sample-data',
        name: 'Park Avenue Towers',
        address: '890 Piedmont Ave',
        city: 'Atlanta',
        state: 'GA',
        zip: '30309',
        canonicalAddress: '890 PIEDMONT AVE',
        assetType: asset_type,
        subtype: 'High-Rise',
        units: 320,
        yearBuilt: 2016,
        rentPsf: 2.65,
        rentPu: 1725,
        occupancyPct: 91.5,
        concessionPct: 3.2,
        amenityTags: ['Pool', 'Spa', 'Valet', 'Tennis Court', 'Pet Friendly'],
        notes: 'Established luxury tower with premium amenities',
        unitPlan: 'Standard',
        lat: 33.7902,
        lng: -84.3732,
        provenance: { source: 'sample-data', timestamp: new Date() }
      },
      {
        source: 'sample-data',
        name: 'Buckhead Square',
        address: '1122 Lenox Rd',
        city: 'Atlanta',
        state: 'GA',
        zip: '30326',
        canonicalAddress: '1122 LENOX RD',
        assetType: asset_type,
        subtype: 'Luxury',
        units: 195,
        yearBuilt: 2019,
        rentPsf: 3.45,
        rentPu: 2450,
        occupancyPct: 96.1,
        concessionPct: 1.5,
        amenityTags: ['Pool', 'Fitness Center', 'Concierge', 'Wine Storage'],
        notes: 'Premium Buckhead location with upscale finishes',
        unitPlan: 'Standard',
        lat: 33.8484,
        lng: -84.3694,
        provenance: { source: 'sample-data', timestamp: new Date() }
      },
      {
        source: 'sample-data',
        name: 'Tech Square Residences',
        address: '1455 Tech Square Dr',
        city: 'Atlanta',
        state: 'GA',
        zip: '30313',
        canonicalAddress: '1455 TECH SQUARE DR',
        assetType: asset_type,
        subtype: 'Mixed-Use',
        units: 140,
        yearBuilt: 2021,
        rentPsf: 2.95,
        rentPu: 1950,
        occupancyPct: 98.5,
        concessionPct: 0.5,
        amenityTags: ['Coworking', 'Fitness Center', 'Retail', 'Tech Hub'],
        notes: 'Modern mixed-use development near Georgia Tech',
        unitPlan: 'Standard',
        lat: 33.7756,
        lng: -84.3963,
        provenance: { source: 'sample-data', timestamp: new Date() }
      }
    ];

    // Filter and normalize records
    const records = sampleProperties
      .filter(p => p.city.toLowerCase().includes(address.toLowerCase().split(',')[0]) || 
                   address.toLowerCase().includes(p.city.toLowerCase()))
      .map(normalizeRecord);

    return { records };
  }
};

// Generic web scraper adapter (placeholder for real implementation)
const genericWebAdapter: Adapter = {
  name: 'generic-web',
  search: async ({ address, radius_mi, asset_type, keywords }) => {
    // Placeholder for generic web scraping
    // In a real implementation, this would use Cheerio/Playwright to scrape public sources
    // respecting robots.txt and terms of service
    console.log(`Generic web search for ${asset_type} properties near ${address} within ${radius_mi} miles`);
    
    // Return empty for now - real implementation would scrape appropriate sources
    return { records: [] };
  }
};

// Export available adapters
export const adapters: Adapter[] = [
  sampleDataAdapter,
  genericWebAdapter
];