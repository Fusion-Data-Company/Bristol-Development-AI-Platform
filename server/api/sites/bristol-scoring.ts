import { Router } from 'express';
import { bristolScoringService } from '../../services/bristolScoringService';
import { db } from '../../db';
import { sites } from '@shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

/**
 * Bristol Scoring API
 * Provides live Bristol rating calculations aligned with development strategy
 */

// Get Bristol score for a specific property
router.get('/:siteId/bristol-score', async (req, res) => {
  try {
    const { siteId } = req.params;
    
    const scoreResult = await bristolScoringService.getBristolScoreDetailed(siteId);
    
    res.json({
      success: true,
      data: scoreResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Bristol score calculation error:', error);
    res.status(500).json({ 
      error: 'Failed to calculate Bristol score',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update Bristol scores for all properties
router.post('/update-all-scores', async (req, res) => {
  try {
    console.log('🎯 Starting comprehensive Bristol score update...');
    
    await bristolScoringService.updateAllBristolScores();
    
    // Get updated statistics
    const allSites = await db.select().from(sites);
    const sitesWithScores = allSites.filter(site => site.bristolScore !== null);
    const avgScore = sitesWithScores.reduce((sum, site) => sum + (site.bristolScore || 0), 0) / sitesWithScores.length;
    
    const scoreDistribution = {
      excellent: sitesWithScores.filter(s => (s.bristolScore || 0) >= 80).length,
      good: sitesWithScores.filter(s => (s.bristolScore || 0) >= 70 && (s.bristolScore || 0) < 80).length,
      fair: sitesWithScores.filter(s => (s.bristolScore || 0) >= 60 && (s.bristolScore || 0) < 70).length,
      poor: sitesWithScores.filter(s => (s.bristolScore || 0) < 60).length
    };
    
    res.json({
      success: true,
      message: 'Bristol scores updated for all properties',
      statistics: {
        totalProperties: allSites.length,
        propertiesScored: sitesWithScores.length,
        averageScore: Math.round(avgScore * 10) / 10,
        scoreDistribution
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Bulk Bristol score update error:', error);
    res.status(500).json({ 
      error: 'Failed to update Bristol scores',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get portfolio Bristol score summary
router.get('/portfolio-summary', async (req, res) => {
  try {
    const allSites = await db.select().from(sites);
    const sitesWithScores = allSites.filter(site => site.bristolScore !== null);
    
    if (sitesWithScores.length === 0) {
      return res.json({
        success: true,
        data: {
          message: 'No Bristol scores calculated yet. Run score update first.',
          totalProperties: allSites.length,
          scoredProperties: 0
        }
      });
    }
    
    const avgScore = sitesWithScores.reduce((sum, site) => sum + (site.bristolScore || 0), 0) / sitesWithScores.length;
    
    // Score distribution
    const scoreDistribution = {
      excellent: sitesWithScores.filter(s => (s.bristolScore || 0) >= 80).length,
      good: sitesWithScores.filter(s => (s.bristolScore || 0) >= 70 && (s.bristolScore || 0) < 80).length,
      fair: sitesWithScores.filter(s => (s.bristolScore || 0) >= 60 && (s.bristolScore || 0) < 70).length,
      poor: sitesWithScores.filter(s => (s.bristolScore || 0) < 60).length
    };
    
    // Top and bottom performers
    const sortedSites = sitesWithScores.sort((a, b) => (b.bristolScore || 0) - (a.bristolScore || 0));
    const topPerformers = sortedSites.slice(0, 5).map(site => ({
      id: site.id,
      name: site.name,
      city: site.city,
      state: site.state,
      bristolScore: site.bristolScore
    }));
    
    const bottomPerformers = sortedSites.slice(-5).reverse().map(site => ({
      id: site.id,
      name: site.name,
      city: site.city,
      state: site.state,
      bristolScore: site.bristolScore
    }));
    
    // Market breakdown
    const marketBreakdown = sitesWithScores.reduce((acc, site) => {
      const market = `${site.city}, ${site.state}`;
      if (!acc[market]) {
        acc[market] = {
          properties: 0,
          totalScore: 0,
          avgScore: 0
        };
      }
      acc[market].properties += 1;
      acc[market].totalScore += site.bristolScore || 0;
      acc[market].avgScore = acc[market].totalScore / acc[market].properties;
      return acc;
    }, {} as Record<string, any>);
    
    res.json({
      success: true,
      data: {
        portfolioMetrics: {
          totalProperties: allSites.length,
          scoredProperties: sitesWithScores.length,
          averageScore: Math.round(avgScore * 10) / 10,
          scoreDistribution
        },
        topPerformers,
        bottomPerformers,
        marketBreakdown: Object.entries(marketBreakdown)
          .map(([market, data]) => ({
            market,
            ...data,
            avgScore: Math.round((data as any).avgScore * 10) / 10
          }))
          .sort((a, b) => b.avgScore - a.avgScore)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Portfolio summary error:', error);
    res.status(500).json({ 
      error: 'Failed to generate portfolio summary',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Quick score update for a single property
router.post('/:siteId/update-score', async (req, res) => {
  try {
    const { siteId } = req.params;
    
    const scoreResult = await bristolScoringService.calculateBristolScore(siteId);
    
    // Update the database
    await db.update(sites)
      .set({ 
        bristolScore: scoreResult.totalScore,
        updatedAt: new Date()
      })
      .where(eq(sites.id, siteId));
    
    res.json({
      success: true,
      message: 'Bristol score updated successfully',
      data: scoreResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Single property score update error:', error);
    res.status(500).json({ 
      error: 'Failed to update Bristol score',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;