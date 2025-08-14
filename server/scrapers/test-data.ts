/**
 * Production-ready test data insertion
 * Populates the database with realistic market data for testing
 */

import { db } from '../db';
import { compsAnnex } from '../../shared/schema';
import { generateDemoData } from './demo-data';

export async function insertTestData() {
  try {
    console.log('🚀 Inserting production test data...');
    
    // Generate realistic data for major Sunbelt markets
    const markets = [
      { address: 'Nashville, TN', count: 5 },
      { address: 'Atlanta, GA', count: 4 },
      { address: 'Austin, TX', count: 3 },
      { address: 'Charlotte, NC', count: 2 }
    ];
    
    let totalInserted = 0;
    
    for (const market of markets) {
      console.log(`📍 Generating data for ${market.address}...`);
      const properties = generateDemoData(market.address, 10);
      
      for (const property of properties.slice(0, market.count)) {
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
            updatedAt: property.updatedAt
          };
          
          await db.insert(compsAnnex).values(record);
          totalInserted++;
          console.log(`✅ Inserted: ${property.name}`);
          
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
    
    console.log(`🎉 Production test data insertion complete: ${totalInserted} records`);
    return totalInserted;
    
  } catch (error) {
    console.error('❌ Failed to insert test data:', error);
    throw error;
  }
}

export async function clearTestData() {
  try {
    const result = await db.delete(compsAnnex).where(
      compsAnnex.source = 'Production Test Data'
    );
    console.log('🗑️  Cleared test data');
    return result;
  } catch (error) {
    console.error('❌ Failed to clear test data:', error);
    throw error;
  }
}