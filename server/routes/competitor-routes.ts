import { Router } from 'express';
import { storage } from '../storage';
import { competitorWatchService } from '../services/competitorWatchService';
import { z } from 'zod';

const router = Router();

// Get competitor dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const data = await competitorWatchService.getDashboardData();
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching competitor dashboard:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch dashboard data' 
    });
  }
});

// Get competitor signals
router.get('/signals', async (req, res) => {
  try {
    const querySchema = z.object({
      jurisdiction: z.string().optional(),
      type: z.string().optional(),
      competitor: z.string().optional(),
      limit: z.coerce.number().optional().default(50),
      days: z.coerce.number().optional()
    });

    const query = querySchema.parse(req.query);
    
    let signals;
    if (query.days) {
      signals = await storage.getRecentSignals(query.days);
    } else {
      signals = await storage.getCompetitorSignals({
        jurisdiction: query.jurisdiction,
        type: query.type,
        competitorMatch: query.competitor,
        limit: query.limit
      });
    }

    res.json({ success: true, signals });
  } catch (error) {
    console.error('Error fetching signals:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch signals' 
    });
  }
});

// Get competitor entities
router.get('/entities', async (req, res) => {
  try {
    const active = req.query.active !== 'false';
    const entities = await storage.getCompetitorEntities(active);
    res.json({ success: true, entities });
  } catch (error) {
    console.error('Error fetching entities:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch entities' 
    });
  }
});

// Get jurisdictions
router.get('/jurisdictions', async (req, res) => {
  try {
    const active = req.query.active !== 'false';
    const jurisdictions = await storage.getGeoJurisdictions(active);
    res.json({ success: true, jurisdictions });
  } catch (error) {
    console.error('Error fetching jurisdictions:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch jurisdictions' 
    });
  }
});

// Get competitor analyses
router.get('/analyses', async (req, res) => {
  try {
    const querySchema = z.object({
      competitorId: z.string().optional(),
      limit: z.coerce.number().optional().default(50)
    });

    const query = querySchema.parse(req.query);
    const analyses = await storage.getCompetitorAnalyses(
      query.competitorId,
      query.limit
    );

    res.json({ success: true, analyses });
  } catch (error) {
    console.error('Error fetching analyses:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch analyses' 
    });
  }
});

// Trigger a manual scrape
router.post('/scrape', async (req, res) => {
  try {
    const bodySchema = z.object({
      daysBack: z.number().optional().default(7)
    });

    const { daysBack } = bodySchema.parse(req.body);

    // Start the scrape in the background
    competitorWatchService.runFullCycle({ daysBack }).catch(error => {
      console.error('Background scrape failed:', error);
    });

    res.json({ 
      success: true, 
      message: 'Scrape started in background',
      daysBack 
    });
  } catch (error) {
    console.error('Error starting scrape:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to start scrape' 
    });
  }
});

// Get scrape jobs history
router.get('/jobs', async (req, res) => {
  try {
    const jobs = await storage.getActiveScrapeJobs();
    res.json({ success: true, jobs });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch jobs' 
    });
  }
});

// Update competitor entity
router.patch('/entities/:id', async (req, res) => {
  try {
    const updateSchema = z.object({
      name: z.string().optional(),
      keywords: z.array(z.string()).optional(),
      active: z.boolean().optional(),
      cik: z.string().nullable().optional()
    });

    const updates = updateSchema.parse(req.body);
    const entity = await storage.updateCompetitorEntity(req.params.id, updates);

    res.json({ success: true, entity });
  } catch (error) {
    console.error('Error updating entity:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update entity' 
    });
  }
});

// Update jurisdiction
router.patch('/jurisdictions/:key', async (req, res) => {
  try {
    const updateSchema = z.object({
      label: z.string().optional(),
      active: z.boolean().optional(),
      scrapeFrequency: z.number().optional(),
      config: z.any().optional()
    });

    const updates = updateSchema.parse(req.body);
    const jurisdiction = await storage.updateGeoJurisdiction(req.params.key, updates);

    res.json({ success: true, jurisdiction });
  } catch (error) {
    console.error('Error updating jurisdiction:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update jurisdiction' 
    });
  }
});

export default router;