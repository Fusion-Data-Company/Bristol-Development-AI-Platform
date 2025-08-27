/**
 * Placeholder Replacement API
 * Systematic replacement of ALL 47 identified placeholder sections
 */

import { Router } from 'express';
import { RealDataService } from '../services/realDataService';
import { db } from '../db';
import { sites, siteMetrics } from '../../shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();
const realDataService = new RealDataService();

// API Health Check - validates all real data integrations
router.get('/health', async (req, res) => {
  try {
    const healthChecks = {
      censusAPI: false,
      blsAPI: false,
      fbiAPI: false,
      perplexityAPI: false,
      firecrawlAPI: false,
      database: false,
      bristolScoring: false
    };

    // Test Census API
    try {
      await realDataService.getCensusData(36.1627, -86.7816); // Nashville test
      healthChecks.censusAPI = true;
    } catch (e) {
      console.warn('Census API test failed');
    }

    // Test BLS API  
    try {
      await realDataService.getBLSEmploymentData('47', '037'); // Davidson County test
      healthChecks.blsAPI = true;
    } catch (e) {
      console.warn('BLS API test failed');
    }

    // Test FBI API
    try {
      await realDataService.getFBICrimeData('TN');
      healthChecks.fbiAPI = true;
    } catch (e) {
      console.warn('FBI API test failed');
    }

    // Test Perplexity API
    try {
      if (process.env.PERPLEXITY_API_KEY) {
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.1-sonar-small-128k-online',
            messages: [{ role: 'user', content: 'Test connection' }],
            max_tokens: 10
          }),
        });
        if (response.ok) healthChecks.perplexityAPI = true;
      }
    } catch (e) {
      console.warn('Perplexity API test failed');
    }

    // Test Firecrawl API
    try {
      if (process.env.FIRECRAWL_API_KEY) {
        const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: 'https://www.apartments.com/nashville-tn/',
            formats: ['extract']
          }),
        });
        if (response.ok) healthChecks.firecrawlAPI = true;
      }
    } catch (e) {
      console.warn('Firecrawl API test failed');
    }

    // Test Database
    try {
      await db.select().from(sites).limit(1);
      healthChecks.database = true;
    } catch (e) {
      console.warn('Database test failed');
    }

    // Test Company Scoring
    try {
      const testSites = await db.select().from(sites).limit(1);
      if (testSites.length > 0) {
        await realDataService.calculateCompanyScore(testSites[0].id);
        healthChecks.bristolScoring = true;
      }
    } catch (e) {
      console.warn('Company scoring test failed');
    }

    const healthyServices = Object.values(healthChecks).filter(Boolean).length;
    const totalServices = Object.keys(healthChecks).length;

    res.json({
      success: true,
      overallHealth: `${healthyServices}/${totalServices} services healthy`,
      healthyServices,
      totalServices,
      details: healthChecks,
      apis: {
        census: {
          status: healthChecks.censusAPI ? 'healthy' : 'error',
          endpoint: 'https://api.census.gov/data/2022/acs/acs5',
          keyRequired: false
        },
        bls: {
          status: healthChecks.blsAPI ? 'healthy' : 'error', 
          endpoint: 'https://api.bls.gov/publicAPI/v2/timeseries/data/',
          keyRequired: true,
          configured: !!process.env.BLS_API_KEY
        },
        fbi: {
          status: healthChecks.fbiAPI ? 'healthy' : 'error',
          endpoint: 'https://api.usa.gov/crime/fbi/cde/arrest/state/',
          keyRequired: true,
          configured: !!process.env.FBI_API_KEY
        },
        perplexity: {
          status: healthChecks.perplexityAPI ? 'healthy' : 'error',
          endpoint: 'https://api.perplexity.ai/chat/completions',
          keyRequired: true,
          configured: !!process.env.PERPLEXITY_API_KEY
        },
        firecrawl: {
          status: healthChecks.firecrawlAPI ? 'healthy' : 'error',
          endpoint: 'https://api.firecrawl.dev/v0/scrape', 
          keyRequired: true,
          configured: !!process.env.FIRECRAWL_API_KEY
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Health check error:', error);
    res.status(500).json({
      error: 'Health check failed',
      details: errorMessage
    });
  }
});

// Replace ALL placeholder demographic data with real Census data
router.post('/replace-demographics', async (req, res) => {
  try {
    console.log('🚀 Starting comprehensive demographic data replacement...');
    
    const sites = await db.select().from(sites);
    const results = [];
    
    for (const site of sites) {
      try {
        const realDemographics = await realDataService.getCensusData(site.latitude, site.longitude);
        
        // Update site with real demographic data
        await db.update(sites)
          .set({
            acsProfile: {
              population: realDemographics.population,
              median_rent: realDemographics.medianRent,  
              median_income: realDemographics.medianIncome,
              commute_time: realDemographics.commuteTime,
              tract: realDemographics.tract,
              data_source: 'US Census Bureau',
              updated_at: new Date().toISOString()
            },
            updatedAt: new Date()
          })
          .where(eq(sites.id, site.id));
          
        results.push({
          siteId: site.id,
          name: site.name,
          status: 'success',
          data: realDemographics
        });
        
        console.log(`✅ Updated demographics for ${site.name}`);
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Failed to update demographics for ${site.name}:`, error);
        results.push({
          siteId: site.id,
          name: site.name,
          status: 'failed',
          error: errorMessage
        });
      }
    }
    
    const successful = results.filter(r => r.status === 'success').length;
    
    res.json({
      success: true,
      message: 'Demographic data replacement completed',
      summary: {
        total: sites.length,
        successful,
        failed: sites.length - successful
      },
      results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Demographics replacement error:', error);
    res.status(500).json({
      error: 'Failed to replace demographic data',
      details: errorMessage
    });
  }
});

// Replace ALL placeholder Company scores with real calculations
router.post('/replace-brand-scores', async (req, res) => {
  try {
    console.log('🚀 Starting comprehensive Company score replacement...');
    
    await realDataService.updateAllSitesWithRealScores();
    
    // Get updated scores
    const updatedSites = await db.select().from(sites);
    const scoredSites = updatedSites.filter(s => s.companyScore !== null);
    
    res.json({
      success: true,
      message: 'Company score replacement completed',
      summary: {
        total: updatedSites.length,
        scored: scoredSites.length,
        averageScore: scoredSites.length > 0 ? 
          Math.round(scoredSites.reduce((sum, s) => sum + (s.companyScore || 0), 0) / scoredSites.length) : 0
      },
      scoredSites: scoredSites.map(s => ({
        id: s.id,
        name: s.name,
        score: s.companyScore
      })),
      timestamp: new Date().toISOString()
    });
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Company scores replacement error:', error);
    res.status(500).json({
      error: 'Failed to replace Company scores',
      details: errorMessage
    });
  }
});

// Replace ALL placeholder market data with real API calls
router.post('/replace-market-data', async (req, res) => {
  try {
    console.log('🚀 Starting comprehensive market data replacement...');
    
    const sites = await db.select().from(sites);
    const results = [];
    
    for (const site of sites) {
      try {
        const marketData = await realDataService.getRealMarketData(
          site.latitude,
          site.longitude,
          site.fipsState || '47',
          site.fipsCounty || '037'
        );
        
        // Store in site metrics
        await db.insert(siteMetrics).values({
          siteId: site.id,
          metricType: 'market_data',
          value: JSON.stringify(marketData),
          dataSource: 'Real APIs (Census, BLS, FBI)',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        results.push({
          siteId: site.id,
          name: site.name,
          status: 'success',
          marketData
        });
        
        console.log(`✅ Updated market data for ${site.name}`);
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error: any) {
        console.error(`Failed to update market data for ${site.name}:`, error);
        results.push({
          siteId: site.id,
          name: site.name,
          status: 'failed',
          error: error?.message || 'Unknown error'
        });
      }
    }
    
    const successful = results.filter(r => r.status === 'success').length;
    
    res.json({
      success: true,
      message: 'Market data replacement completed',
      summary: {
        total: sites.length,
        successful,
        failed: sites.length - successful
      },
      results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('Market data replacement error:', error);
    res.status(500).json({
      error: 'Failed to replace market data',
      details: error?.message || 'Unknown error'
    });
  }
});

// Replace ALL placeholders in one comprehensive operation
router.post('/replace-all-placeholders', async (req, res) => {
  try {
    console.log('🚀 Starting COMPREHENSIVE placeholder replacement across all 47 sections...');
    
    const startTime = Date.now();
    const results = {
      demographics: null as any,
      companyScores: null as any,
      marketData: null as any,
      errors: [] as string[]
    };
    
    // Step 1: Replace demographic data
    try {
      const demographicsResponse = await fetch(`${req.protocol}://${req.get('host')}/api/placeholder-replacement/replace-demographics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      results.demographics = await demographicsResponse.json();
    } catch (error: any) {
      results.errors.push(`Demographics replacement failed: ${error.message}`);
    }
    
    // Step 2: Replace Company scores (depends on demographics)
    try {
      const scoresResponse = await fetch(`${req.protocol}://${req.get('host')}/api/placeholder-replacement/replace-brand-scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      results.companyScores = await scoresResponse.json();
    } catch (error: any) {
      results.errors.push(`Company scores replacement failed: ${error.message}`);
    }
    
    // Step 3: Replace market data
    try {
      const marketResponse = await fetch(`${req.protocol}://${req.get('host')}/api/placeholder-replacement/replace-market-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      results.marketData = await marketResponse.json();
    } catch (error: any) {
      results.errors.push(`Market data replacement failed: ${error.message}`);
    }
    
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    const totalSites = results.demographics?.summary?.total || 0;
    const successfulDemographics = results.demographics?.summary?.successful || 0;
    const successfulScores = results.companyScores?.summary?.scored || 0;
    const successfulMarket = results.marketData?.summary?.successful || 0;
    
    res.json({
      success: results.errors.length === 0,
      message: 'Comprehensive placeholder replacement completed',
      duration: `${duration} seconds`,
      summary: {
        totalSites,
        placeholdersSectionsReplaced: {
          demographics: successfulDemographics,
          companyScores: successfulScores,
          marketData: successfulMarket
        },
        overallProgress: `${Math.round(((successfulDemographics + successfulScores + successfulMarket) / (totalSites * 3)) * 100)}% of all placeholders replaced`
      },
      details: results,
      errors: results.errors,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('Comprehensive replacement error:', error);
    res.status(500).json({
      error: 'Failed to replace all placeholders',
      details: error?.message || 'Unknown error'
    });
  }
});

export default router;