import { z } from 'zod';

// Schema for raw scraped data
export const RawRecordSchema = z.object({
  name: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  units: z.union([z.number(), z.string()]).optional(),
  rentPu: z.union([z.number(), z.string()]).optional(),
  rentPsf: z.union([z.number(), z.string()]).optional(),
  occupancyPct: z.union([z.number(), z.string()]).optional(),
  concessionPct: z.union([z.number(), z.string()]).optional(),
  yearBuilt: z.union([z.number(), z.string()]).optional(),
  assetType: z.string().optional(),
  subtype: z.string().optional(),
  amenityTags: z.array(z.string()).optional(),
  sourceUrl: z.string().optional(),
  unitPlan: z.string().optional(),
}).passthrough();

export type RawRecord = z.infer<typeof RawRecordSchema>;

// Normalize raw scraped data to database schema
export function normalizeRecord(raw: any): any {
  try {
    // Basic validation and parsing
    const parsed = RawRecordSchema.parse(raw);
    
    // Create canonical address (uppercase, trimmed, normalized)
    const canonicalAddress = createCanonicalAddress(
      parsed.address,
      parsed.city,
      parsed.state,
      parsed.zip
    );

    // Parse numeric fields safely
    const units = parseNumber(parsed.units);
    const rentPu = parseNumber(parsed.rentPu);
    const rentPsf = parseNumber(parsed.rentPsf);
    const occupancyPct = parseNumber(parsed.occupancyPct);
    const concessionPct = parseNumber(parsed.concessionPct);
    const yearBuilt = parseNumber(parsed.yearBuilt);

    // Derive unit plan if not provided
    const unitPlan = parsed.unitPlan || deriveUnitPlan(parsed.name, units);

    // Normalize asset type
    const assetType = normalizeAssetType(parsed.assetType);

    // Extract and normalize amenities
    const amenityTags = normalizeAmenities(parsed.amenityTags, JSON.stringify(raw));

    return {
      name: cleanString(parsed.name) || 'Unknown Property',
      address: cleanString(parsed.address) || '',
      canonicalAddress,
      city: cleanString(parsed.city) || '',
      state: cleanString(parsed.state) || '',
      zip: cleanString(parsed.zip) || '',
      units,
      rentPu,
      rentPsf,
      occupancyPct,
      concessionPct,
      yearBuilt,
      assetType,
      subtype: cleanString(parsed.subtype),
      unitPlan,
      amenityTags,
      sourceUrl: cleanString(parsed.sourceUrl),
      provenance: 'scraper',
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.warn('Failed to normalize record:', error, raw);
    // Return minimal fallback record
    return {
      name: String(raw.name || 'Unknown Property'),
      address: String(raw.address || ''),
      canonicalAddress: createCanonicalAddress(raw.address, raw.city, raw.state),
      city: String(raw.city || ''),
      state: String(raw.state || ''),
      assetType: 'Multifamily',
      amenityTags: [],
      provenance: 'scraper_fallback',
      updatedAt: new Date().toISOString(),
    };
  }
}

// Helper functions
function createCanonicalAddress(address?: string, city?: string, state?: string, zip?: string): string {
  const parts = [address, city, state, zip].filter(Boolean).map(part => 
    String(part).trim().toUpperCase()
  );
  return parts.join(', ') || 'UNKNOWN';
}

function parseNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;
  
  // Handle string numbers with commas, $ signs, etc.
  if (typeof value === 'string') {
    const cleaned = value.replace(/[$,\s%]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }
  
  if (typeof value === 'number') {
    return isNaN(value) ? null : value;
  }
  
  return null;
}

function cleanString(value: any): string | null {
  if (!value) return null;
  const cleaned = String(value).trim();
  return cleaned === '' ? null : cleaned;
}

function deriveUnitPlan(name?: string, units?: number | null): string | null {
  if (!name && !units) return null;
  
  // Try to extract unit plan from property name
  const nameStr = String(name || '');
  const unitPlanMatch = nameStr.match(/(\d+)x(\d+)/i) || nameStr.match(/(\d+)\s*bed/i);
  
  if (unitPlanMatch) {
    return unitPlanMatch[0].toLowerCase();
  }
  
  // Fallback to units if available
  if (units && units > 0) {
    return `${units}units`;
  }
  
  return null;
}

function normalizeAssetType(assetType?: string): string {
  if (!assetType) return 'Multifamily';
  
  const normalized = assetType.toLowerCase();
  
  if (normalized.includes('multi') || normalized.includes('apartment')) return 'Multifamily';
  if (normalized.includes('condo')) return 'Condo';
  if (normalized.includes('mixed')) return 'Mixed-Use';
  if (normalized.includes('commercial') || normalized.includes('office')) return 'Commercial';
  if (normalized.includes('retail')) return 'Retail';
  if (normalized.includes('industrial')) return 'Industrial';
  
  return 'Multifamily'; // Default fallback
}

function normalizeAmenities(amenityTags?: string[], fullText?: string): string[] {
  const amenities = new Set<string>();
  
  // Add provided amenity tags
  if (amenityTags) {
    amenityTags.forEach(tag => {
      const cleaned = cleanString(tag);
      if (cleaned) amenities.add(cleaned);
    });
  }
  
  // Extract amenities from full text if available
  if (fullText) {
    const text = fullText.toLowerCase();
    const commonAmenities = [
      'pool', 'fitness', 'gym', 'spa', 'sauna', 'tennis', 'basketball',
      'clubhouse', 'lounge', 'coworking', 'business center',
      'ev charging', 'electric vehicle', 'parking', 'garage',
      'dog park', 'dog run', 'pet', 'dog wash',
      'package', 'concierge', 'doorman', 'security',
      'washer', 'dryer', 'in-unit laundry', 'w/d',
      'balcony', 'patio', 'terrace', 'rooftop',
      'transit', 'metro', 'subway', 'bus',
      'shopping', 'dining', 'restaurant',
      'playground', 'kids', 'family',
      'wifi', 'internet', 'smart home',
      'hardwood', 'granite', 'stainless steel',
      'walk-in closet', 'storage', 'pantry'
    ];
    
    commonAmenities.forEach(amenity => {
      if (text.includes(amenity)) {
        amenities.add(amenity);
      }
    });
  }
  
  return Array.from(amenities).filter(Boolean);
}