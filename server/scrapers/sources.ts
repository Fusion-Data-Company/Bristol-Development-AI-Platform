// server/scrapers/sources.ts
import { randomUUID } from 'crypto';

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
    lat: parseNumberLike(x.lat),
    lng: parseNumberLike(x.lng),
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
    unitPlan: x.unitPlan ?? 'Mixed',
    provenance: {
      scraped: true,
      method: x.source,
      timestamp: new Date().toISOString()
    }
  };
}

// Generic HTML scraper adapter (respects robots.txt and terms)
const genericHtmlAdapter: Adapter = {
  name: 'generic-html',
  search: async (q) => {
    // Placeholder for generic web scraping - would need proper implementation
    // For MVP, return empty results
    console.log(`Generic scraper queried for: ${q.address}, ${q.radius_mi}mi, ${q.asset_type}`);
    return { records: [] };
  }
};

// Sample data adapter for demo purposes
const sampleDataAdapter: Adapter = {
  name: 'sample-data',
  search: async (q) => {
    // Generate sample comparable data for demonstration
    const sampleData = [
      {
        source: 'sample-data',
        url: 'https://example.com/property1',
        name: 'Vista Apartments',
        address: '123 Main St',
        city: 'Atlanta',
        state: 'GA',
        zip: '30309',
        lat: 33.7490,
        lng: -84.3880,
        assetType: 'Multifamily',
        subtype: 'Garden Style',
        units: 250,
        yearBuilt: 2018,
        rentPsf: 2.15,
        rentPu: 1850,
        occupancyPct: 92.5,
        concessionPct: 2.0,
        amenityTags: ['Pool', 'Fitness Center', 'Pet Friendly'],
        notes: 'Class A property with premium amenities',
        unitPlan: '1B/1B'
      },
      {
        source: 'sample-data',
        url: 'https://example.com/property2',
        name: 'Brookside Commons',
        address: '456 Oak Ave',
        city: 'Atlanta',
        state: 'GA',
        zip: '30309',
        lat: 33.7520,
        lng: -84.3910,
        assetType: 'Multifamily',
        subtype: 'Mid-Rise',
        units: 180,
        yearBuilt: 2020,
        rentPsf: 2.35,
        rentPu: 2100,
        occupancyPct: 95.0,
        concessionPct: 1.5,
        amenityTags: ['Rooftop Deck', 'Concierge', 'Parking Garage'],
        notes: 'Luxury mid-rise in prime location',
        unitPlan: '2B/2B'
      }
    ];

    // Filter by proximity (simple distance check for demo)
    const filtered = sampleData.filter(item => {
      if (q.address.toLowerCase().includes('atlanta') || q.address.toLowerCase().includes('ga')) {
        return true;
      }
      return false;
    });

    return { 
      records: filtered.map(item => normalizeRecord({
        ...item,
        canonicalAddress: `${item.address}, ${item.city}, ${item.state} ${item.zip}`.toUpperCase()
      }))
    };
  }
};

export const adapters: Adapter[] = [
  sampleDataAdapter,
  genericHtmlAdapter
];