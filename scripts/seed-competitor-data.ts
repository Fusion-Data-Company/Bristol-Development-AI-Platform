import { storage } from '../server/storage';
import { JURISDICTIONS, COMPETITOR_ENTITIES, SEC_CIKS } from '../server/config/competitor-config';

async function seedCompetitorData() {
  console.log('🌱 Seeding competitor watch data...');

  try {
    // Seed jurisdictions
    console.log('📍 Adding jurisdictions...');
    for (const [key, config] of Object.entries(JURISDICTIONS)) {
      await storage.upsertGeoJurisdiction({
        key,
        label: config.label,
        state: config.state,
        active: true,
        config: config as any,
        scrapeFrequency: 60, // Every hour by default
      });
      console.log(`  ✅ ${config.label}`);
    }

    // Seed competitor entities
    console.log('🏢 Adding competitor entities...');
    for (const entity of COMPETITOR_ENTITIES) {
      const keywords = entity.keywords || [];
      // Add the entity name itself as a keyword
      if (!keywords.includes(entity.name.toLowerCase())) {
        keywords.push(entity.name.toLowerCase());
      }

      await storage.upsertCompetitorEntity({
        name: entity.name,
        type: entity.type,
        keywords,
        cik: SEC_CIKS[entity.name],
        active: true,
        metadata: {
          source: 'initial_seed',
          addedAt: new Date().toISOString(),
        },
      });
      console.log(`  ✅ ${entity.name} (${entity.type})`);
    }

    console.log('✅ Competitor watch data seeded successfully!');
    
    // Display summary
    const entities = await storage.getCompetitorEntities();
    const jurisdictions = await storage.getGeoJurisdictions();
    
    console.log('\n📊 Summary:');
    console.log(`  - ${jurisdictions.length} jurisdictions`);
    console.log(`  - ${entities.length} competitor entities`);
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

// Run if executed directly
seedCompetitorData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

export { seedCompetitorData };