import { Router } from 'express';
import { storage } from '../../storage';
import { marketIntelligenceAgent } from '../../services/marketIntelligenceAgent';
import { insertMarketIntelligenceSchema } from '@shared/schema';
import { z } from 'zod';

const router = Router();

// Get live market intelligence entries
router.get('/entries', async (req, res) => {
  try {
    const { limit, category, priority } = req.query;
    
    let intelligence;
    if (priority && !isNaN(Number(priority))) {
      intelligence = await storage.getMarketIntelligenceByPriority(Number(priority));
    } else {
      intelligence = await storage.getMarketIntelligence(
        limit ? Number(limit) : 50,
        category as string
      );
    }

    // Format for frontend consumption
    const formattedEntries = intelligence.map(entry => ({
      id: entry.id,
      title: entry.title,
      description: entry.description,
      source: entry.source,
      sourceUrl: entry.sourceUrl,
      category: entry.category,
      impact: entry.impact,
      priority: entry.priority,
      bristolImplication: entry.bristolImplication,
      actionRequired: entry.actionRequired,
      processed: entry.processed,
      agentSource: entry.agentSource,
      timestamp: entry.createdAt ? new Date(entry.createdAt).toISOString() : null,
      timeAgo: entry.createdAt ? getTimeAgo(entry.createdAt) : null,
      expiresAt: entry.expiresAt,
      metadata: entry.metadata
    }));

    res.json({
      entries: formattedEntries,
      total: formattedEntries.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching market intelligence:', error);
    res.status(500).json({ error: 'Failed to fetch market intelligence' });
  }
});

// Trigger manual market intelligence gathering
router.post('/gather', async (req, res) => {
  try {
    console.log('🚀 Manual market intelligence gathering triggered');
    
    const shouldExecute = await marketIntelligenceAgent.shouldExecute();
    if (!shouldExecute) {
      return res.json({
        message: 'Agent recently executed, skipping to avoid duplication',
        shouldWait: true
      });
    }

    // Execute in background
    marketIntelligenceAgent.executeMarketIntelligenceGathering()
      .then(result => {
        console.log('✅ Manual intelligence gathering completed:', result);
      })
      .catch(error => {
        console.error('❌ Manual intelligence gathering failed:', error);
      });

    res.json({
      message: 'Market intelligence gathering started',
      executing: true,
      estimatedCompletion: '2-3 minutes'
    });
    
  } catch (error) {
    console.error('Error starting market intelligence gathering:', error);
    res.status(500).json({ error: 'Failed to start intelligence gathering' });
  }
});

// Get agent status and health
router.get('/agent-status', async (req, res) => {
  try {
    const status = await marketIntelligenceAgent.getStatus();
    const executions = await storage.getAgentExecutions('market-intelligence-agent');
    
    res.json({
      ...status,
      recentExecutions: executions.slice(0, 5).map(exec => ({
        id: exec.id,
        status: exec.status,
        startedAt: exec.startedAt,
        completedAt: exec.completedAt,
        duration: exec.duration,
        itemsCreated: exec.itemsCreated,
        errorMessage: exec.errorMessage
      }))
    });
    
  } catch (error) {
    console.error('Error fetching agent status:', error);
    res.status(500).json({ error: 'Failed to fetch agent status' });
  }
});

// Mark intelligence entry as processed
router.patch('/entries/:id/processed', async (req, res) => {
  try {
    const { id } = req.params;
    await storage.markMarketIntelligenceProcessed(id);
    
    res.json({ message: 'Entry marked as processed' });
  } catch (error) {
    console.error('Error marking entry as processed:', error);
    res.status(500).json({ error: 'Failed to mark entry as processed' });
  }
});

// Create manual intelligence entry
router.post('/entries', async (req, res) => {
  try {
    const validatedData = insertMarketIntelligenceSchema.parse(req.body);
    const entry = await storage.createMarketIntelligence(validatedData);
    
    res.status(201).json(entry);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data', details: error.errors });
    }
    console.error('Error creating intelligence entry:', error);
    res.status(500).json({ error: 'Failed to create intelligence entry' });
  }
});

// Clean up expired entries
router.delete('/cleanup', async (req, res) => {
  try {
    await storage.deleteExpiredMarketIntelligence();
    res.json({ message: 'Expired entries cleaned up' });
  } catch (error) {
    console.error('Error cleaning up expired entries:', error);
    res.status(500).json({ error: 'Failed to clean up expired entries' });
  }
});

// Helper function to calculate time ago
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
}

export default router;