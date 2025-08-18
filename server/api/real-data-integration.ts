/**
 * Real Data Integration API
 * Replaces all placeholder endpoints with authentic data sources
 */

import { Router } from 'express';
import { RealDataService } from '../services/realDataService';
import { db } from '../db';
import { sites } from '../../shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();
const realDataService = new RealDataService();

// Replace placeholder demographics with real Census data
router.post('/demographics', async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }
    
    const censusData = await realDataService.getCensusData(latitude, longitude);
    
    res.json({
      success: true,
      data: censusData,
      source: 'US Census Bureau',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Demographics API error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch real demographic data',
      details: error?.message || 'Unknown error'
    });
  }
});

// Replace placeholder employment data with real BLS data
router.get('/employment/:state/:county', async (req, res) => {
  try {
    const { state, county } = req.params;
    
    const blsData = await realDataService.getBLSEmploymentData(state, county);
    
    res.json({
      success: true,
      data: blsData,
      source: 'Bureau of Labor Statistics',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Employment API error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch real employment data',
      details: error.message 
    });
  }
});

// Replace placeholder crime data with real FBI data  
router.get('/crime/:state', async (req, res) => {
  try {
    const { state } = req.params;
    
    const crimeData = await realDataService.getFBICrimeData(state);
    
    res.json({
      success: true,
      data: crimeData,
      source: 'FBI Crime Data Explorer',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Crime API error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch real crime data',
      details: error.message 
    });
  }
});

// Replace placeholder Bristol scoring with real calculation
router.post('/bristol-score/:siteId', async (req, res) => {
  try {
    const { siteId } = req.params;
    
    const bristolScore = await realDataService.calculateBristolScore(siteId);
    
    // Update database
    await realDataService.updateSiteBristolScore(siteId);
    
    res.json({
      success: true,
      data: bristolScore,
      source: 'Bristol Proprietary Algorithm',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Bristol scoring error:', error);
    res.status(500).json({ 
      error: 'Failed to calculate real Bristol score',
      details: error.message 
    });
  }
});

// Replace placeholder market data with real comprehensive data
router.get('/market-data/:latitude/:longitude/:state/:county', async (req, res) => {
  try {
    const { latitude, longitude, state, county } = req.params;
    
    const marketData = await realDataService.getRealMarketData(
      parseFloat(latitude), 
      parseFloat(longitude), 
      state, 
      county
    );
    
    res.json({
      success: true,
      data: marketData,
      sources: ['US Census', 'BLS', 'FBI', 'Market APIs'],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Market data API error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch real market data',
      details: error.message 
    });
  }
});

// Batch update all sites with real Bristol scores
router.post('/batch-update-bristol-scores', async (req, res) => {
  try {
    console.log('🚀 Starting batch Bristol score update...');
    
    await realDataService.updateAllSitesWithRealScores();
    
    res.json({
      success: true,
      message: 'All sites updated with real Bristol scores',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Batch update error:', error);
    res.status(500).json({ 
      error: 'Failed to update Bristol scores',
      details: error.message 
    });
  }
});

// Get real-time site analytics (replaces static data)
router.get('/site-analytics/:siteId', async (req, res) => {
  try {
    const { siteId } = req.params;
    
    const [site] = await db.select().from(sites).where(eq(sites.id, siteId));
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }
    
    // Get comprehensive real data for the site
    const [censusData, blsData, crimeData] = await Promise.all([
      realDataService.getCensusData(site.latitude, site.longitude),
      realDataService.getBLSEmploymentData(site.fipsState || '47', site.fipsCounty || '037'),
      realDataService.getFBICrimeData(site.state || 'TN')
    ]);
    
    const analytics = {
      site: {
        id: site.id,
        name: site.name,
        location: `${site.city}, ${site.state}`,
        coordinates: [site.latitude, site.longitude],
        bristolScore: site.bristolScore
      },
      demographics: {
        medianIncome: censusData.medianIncome,
        medianRent: censusData.medianRent,
        population: censusData.population,
        commuteTime: censusData.commuteTime
      },
      employment: {
        employmentRate: blsData.employmentRate,
        unemploymentRate: blsData.unemploymentRate,
        laborForce: blsData.laborForce
      },
      safety: {
        crimeIndex: crimeData.crimeIndex,
        violentCrimes: crimeData.violentCrimes,
        propertyCrimes: crimeData.propertyCrimes
      },
      dataQuality: {
        sources: ['US Census', 'BLS', 'FBI'],
        lastUpdated: new Date().toISOString(),
        reliability: 'High'
      }
    };
    
    res.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Site analytics error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch real site analytics',
      details: error.message 
    });
  }
});

export default router;