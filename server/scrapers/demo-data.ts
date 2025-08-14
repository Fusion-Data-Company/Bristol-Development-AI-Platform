/**
 * Demo data generator for testing and demonstration purposes
 * Creates realistic comparable property data for major Sunbelt markets
 */

import { randomUUID } from 'crypto';

export interface DemoProperty {
  id: string;
  source: string;
  sourceUrl?: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
  assetType: string;
  subtype?: string;
  units: number;
  yearBuilt: number;
  rentPsf: number;
  rentPu: number;
  occupancyPct: number;
  concessionPct: number;
  amenityTags: string[];
  notes: string;
  canonicalAddress: string;
  unitPlan: string;
  scrapedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  jobId?: string;
}

// Market-specific data for major Sunbelt cities
const MARKET_DATA = {
  nashville: {
    lat: 36.1627, lng: -86.7816,
    properties: [
      {
        name: "The Gulch Flats", address: "415 Church St", zip: "37219",
        units: 324, yearBuilt: 2018, rentPsf: 2.85, rentPu: 2450,
        occupancy: 94.2, amenities: ["pool", "fitness", "rooftop", "concierge"]
      },
      {
        name: "Music Row Towers", address: "1808 Division St", zip: "37203",
        units: 256, yearBuilt: 2020, rentPsf: 3.10, rentPu: 2680,
        occupancy: 96.8, amenities: ["pool", "fitness", "parking", "pet-friendly"]
      },
      {
        name: "Broadway Commons", address: "1200 Broadway", zip: "37203",
        units: 189, yearBuilt: 2019, rentPsf: 2.95, rentPu: 2590,
        occupancy: 92.1, amenities: ["rooftop", "fitness", "co-working", "parking"]
      }
    ]
  },
  atlanta: {
    lat: 33.7490, lng: -84.3880,
    properties: [
      {
        name: "Midtown Heights", address: "1050 Peachtree St", zip: "30309",
        units: 412, yearBuilt: 2017, rentPsf: 2.75, rentPu: 2380,
        occupancy: 95.3, amenities: ["pool", "fitness", "concierge", "parking"]
      },
      {
        name: "Buckhead Square", address: "3060 Pharr Court", zip: "30305",
        units: 298, yearBuilt: 2019, rentPsf: 3.25, rentPu: 2890,
        occupancy: 97.2, amenities: ["pool", "fitness", "rooftop", "valet"]
      },
      {
        name: "Beltline Lofts", address: "650 Glen Iris Dr", zip: "30308",
        units: 167, yearBuilt: 2021, rentPsf: 2.90, rentPu: 2520,
        occupancy: 93.7, amenities: ["fitness", "co-working", "pet-friendly", "parking"]
      }
    ]
  },
  austin: {
    lat: 30.2672, lng: -97.7431,
    properties: [
      {
        name: "South Lamar District", address: "1800 S Lamar Blvd", zip: "78704",
        units: 285, yearBuilt: 2020, rentPsf: 3.15, rentPu: 2750,
        occupancy: 96.1, amenities: ["pool", "fitness", "rooftop", "co-working"]
      },
      {
        name: "Rainey Street Residences", address: "90 Rainey St", zip: "78701",
        units: 203, yearBuilt: 2019, rentPsf: 3.40, rentPu: 2980,
        occupancy: 98.5, amenities: ["pool", "concierge", "rooftop", "valet"]
      },
      {
        name: "East Austin Commons", address: "1200 E 6th St", zip: "78702",
        units: 156, yearBuilt: 2018, rentPsf: 2.95, rentPu: 2580,
        occupancy: 94.8, amenities: ["fitness", "co-working", "pet-friendly", "parking"]
      }
    ]
  },
  charlotte: {
    lat: 35.2271, lng: -80.8431,
    properties: [
      {
        name: "Uptown Plaza", address: "500 N Tryon St", zip: "28202",
        units: 356, yearBuilt: 2018, rentPsf: 2.60, rentPu: 2280,
        occupancy: 94.7, amenities: ["pool", "fitness", "concierge", "parking"]
      },
      {
        name: "SouthEnd Station", address: "1200 S Tryon St", zip: "28203",
        units: 289, yearBuilt: 2020, rentPsf: 2.85, rentPu: 2450,
        occupancy: 96.3, amenities: ["pool", "fitness", "rooftop", "co-working"]
      }
    ]
  }
};

export function generateDemoData(address: string, radius_mi: number = 5): DemoProperty[] {
  // Determine market based on address
  const addressLower = address.toLowerCase();
  let market: keyof typeof MARKET_DATA = 'nashville';
  
  if (addressLower.includes('atlanta') || addressLower.includes('ga')) market = 'atlanta';
  else if (addressLower.includes('austin') || addressLower.includes('tx')) market = 'austin';
  else if (addressLower.includes('charlotte') || addressLower.includes('nc')) market = 'charlotte';
  else if (addressLower.includes('nashville') || addressLower.includes('tn')) market = 'nashville';

  const marketData = MARKET_DATA[market];
  const now = new Date();
  
  return marketData.properties.map((prop, index) => {
    // Add some random variation to coordinates within radius
    const latVariation = (Math.random() - 0.5) * (radius_mi * 0.0145);
    const lngVariation = (Math.random() - 0.5) * (radius_mi * 0.0145);
    
    const property: DemoProperty = {
      id: randomUUID(),
      source: 'Demo Market Data',
      sourceUrl: `https://example.com/property/${prop.name.toLowerCase().replace(/\s+/g, '-')}`,
      name: prop.name,
      address: prop.address,
      city: market.charAt(0).toUpperCase() + market.slice(1),
      state: market === 'nashville' ? 'TN' : market === 'atlanta' ? 'GA' : market === 'austin' ? 'TX' : 'NC',
      zip: prop.zip,
      lat: marketData.lat + latVariation,
      lng: marketData.lng + lngVariation,
      assetType: 'Multifamily',
      subtype: prop.units > 300 ? 'High-Rise' : prop.units > 150 ? 'Mid-Rise' : 'Low-Rise',
      units: prop.units,
      yearBuilt: prop.yearBuilt,
      rentPsf: prop.rentPsf + (Math.random() - 0.5) * 0.3, // Add slight variation
      rentPu: prop.rentPu + Math.floor((Math.random() - 0.5) * 200),
      occupancyPct: prop.occupancy + (Math.random() - 0.5) * 4,
      concessionPct: Math.random() * 3, // 0-3% concessions
      amenityTags: prop.amenities,
      notes: `Class A multifamily property in ${market}. Recently built with modern amenities.`,
      canonicalAddress: `${prop.address}, ${market.charAt(0).toUpperCase() + market.slice(1)}, ${market === 'nashville' ? 'TN' : market === 'atlanta' ? 'GA' : market === 'austin' ? 'TX' : 'NC'} ${prop.zip}`,
      unitPlan: `${prop.units}-unit`,
      scrapedAt: new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000), // Random time in last 24h
      createdAt: now,
      updatedAt: now
    };
    
    return property;
  });
}

export function generateSampleJob(address: string) {
  return {
    address,
    radius_mi: 5,
    asset_type: 'Multifamily',
    keywords: ['luxury', 'modern'],
    amenities: ['pool', 'fitness']
  };
}