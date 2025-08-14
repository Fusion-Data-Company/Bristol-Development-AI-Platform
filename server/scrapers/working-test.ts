/**
 * Working test for production-ready scraping with real data insertion
 */

import { db } from '../db';
import { compsAnnex, scrapeJobsAnnex } from '../../shared/schema';
import { generateDemoData } from './demo-data';

export async function insertProductionTestData() {
  try {
    console.log('🚀 Inserting additional production test data...');
    
    // Generate realistic data for multiple markets
    const markets = [
      { address: 'Atlanta, GA', count: 3 },
      { address: 'Austin, TX', count: 2 },
      { address: 'Charlotte, NC', count: 2 }
    ];
    
    let totalInserted = 0;
    
    for (const market of markets) {
      console.log(`📍 Generating data for ${market.address}...`);
      const properties = generateDemoData(market.address, 8);
      
      for (let i = 0; i < market.count && i < properties.length; i++) {
        const property = properties[i];
        
        try {
          const record = {
            id: property.id,
            source: 'Production Test Data',
            sourceUrl: property.sourceUrl,
            name: property.name,
            address: property.address,
            city: property.city,
            state: property.state,
            zip: property.zip,
            lat: property.lat,
            lng: property.lng,
            assetType: property.assetType,
            subtype: property.subtype,
            units: property.units,
            yearBuilt: property.yearBuilt,
            rentPsf: property.rentPsf,
            rentPu: property.rentPu,
            occupancyPct: property.occupancyPct,
            concessionPct: property.concessionPct,
            amenityTags: property.amenityTags,
            notes: property.notes,
            canonicalAddress: property.canonicalAddress,
            unitPlan: property.unitPlan,
            scrapedAt: property.scrapedAt,
            createdAt: property.createdAt,
            updatedAt: property.updatedAt,
            jobId: 'production-test-batch',
            provenance: {
              source: 'production_test_data',
              market: property.city,
              generated_at: new Date().toISOString()
            }
          };
          
          await db.insert(compsAnnex).values(record);
          totalInserted++;
          console.log(`✅ Inserted: ${property.name} (${property.city}, ${property.state})`);
          
        } catch (error) {
          // Skip duplicates
          if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
            console.log(`⚠️  Skipped duplicate: ${property.name}`);
          } else {
            console.error(`❌ Error inserting ${property.name}:`, error);
          }
        }
      }
    }
    
    console.log(`🎉 Production test data insertion complete: ${totalInserted} new records`);
    return totalInserted;
    
  } catch (error) {
    console.error('❌ Failed to insert production test data:', error);
    throw error;
  }
}