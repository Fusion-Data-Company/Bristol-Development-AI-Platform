import { scrapeFirecrawl } from './firecrawl';

async function testFirecrawl() {
  console.log('🔥 Testing Firecrawl API connectivity...');
  
  const testQuery = {
    address: 'Nashville, TN',
    radius_mi: 5,
    asset_type: 'Multifamily',
    amenities: ['pool', 'fitness'],
    keywords: ['luxury', 'apartment']
  };

  try {
    const result = await scrapeFirecrawl(testQuery);
    console.log('✅ Firecrawl test completed:');
    console.log(`   Records found: ${result.records.length}`);
    console.log(`   Source: ${result.source}`);
    console.log(`   Caveats: ${result.caveats?.join(', ') || 'None'}`);
    
    if (result.meta) {
      console.log(`   Requests used: ${result.meta.requests_used}`);
      console.log(`   Estimated cost: $${result.meta.cost}`);
    }
    
    if (result.records.length > 0) {
      console.log('📋 Sample record:');
      console.log(JSON.stringify(result.records[0], null, 2));
    }
    
    return result;
  } catch (error) {
    console.error('❌ Firecrawl test failed:', error);
    throw error;
  }
}

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testFirecrawl().catch(console.error);
}

export { testFirecrawl };