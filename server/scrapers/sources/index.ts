import { apartmentListAdapter } from './apartment-list';
import { rentalsAdapter } from './rentals';
import { loopNetAdapter } from './loopnet';
import { craigslistAdapter } from './craigslist';

export interface ScrapingQuery {
  address: string;
  radius_mi: number;
  asset_type: string;
  keywords: string[];
}

export interface ScrapingResult {
  records: CompRecord[];
  metadata: {
    source: string;
    scraped_at: Date;
    total_found: number;
  };
}

export interface CompRecord {
  id: string;
  source: string;
  sourceUrl?: string;
  name: string;
  address: string;
  city?: string;
  state?: string;
  zip?: string;
  lat?: number;
  lng?: number;
  assetType: string;
  subtype?: string;
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
  scrapedAt?: Date;
}

export interface ScrapingAdapter {
  name: string;
  description: string;
  search(query: ScrapingQuery): Promise<ScrapingResult>;
}

export const adapters: ScrapingAdapter[] = [
  apartmentListAdapter,
  rentalsAdapter,
  loopNetAdapter,
  craigslistAdapter,
];