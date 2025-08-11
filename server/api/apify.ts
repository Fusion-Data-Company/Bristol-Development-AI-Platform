import { Router } from 'express';
import { runs, insertRunSchema } from '../../shared/schema';
import { db } from '../db';
import { eq, sql } from 'drizzle-orm';

const router = Router();

// Check if Apify is configured
const isConfigured = () => {
  return !!process.env.APIFY_API_TOKEN;
};

// Trigger Apify actor
router.post('/actor/:actorId/run', async (req, res) => {
  if (!isConfigured()) {
    return res.status(503).json({
      message: 'Apify not configured. Please add APIFY_API_TOKEN to environment variables.',
      configured: false
    });
  }

  try {
    const { actorId } = req.params;
    const { input = {} } = req.body;
    
    // Create run record
    const [runRecord] = await db
      .insert(runs)
      .values({
        type: 'apify',
        status: 'pending',
        input: input
      })
      .returning();

    // Call Apify API
    const response = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.APIFY_API_TOKEN}`
      },
      body: JSON.stringify(input)
    });

    if (!response.ok) {
      const error = await response.text();
      
      // Update run with error
      await db
        .update(runs)
        .set({
          status: 'failed',
          error: error,
          completedAt: new Date()
        })
        .where(eq(runs.id, runRecord.id));
      
      return res.status(response.status).json({
        message: 'Failed to start Apify actor',
        error,
        runId: runRecord.id
      });
    }

    const result = await response.json();
    
    // Update run with Apify run ID
    await db
      .update(runs)
      .set({
        status: 'running',
        startedAt: new Date(),
        output: { apifyRunId: result.data.id }
      })
      .where(eq(runs.id, runRecord.id));

    res.json({
      configured: true,
      runId: runRecord.id,
      apifyRunId: result.data.id,
      status: 'running'
    });
  } catch (error: any) {
    console.error('Apify error:', error);
    res.status(500).json({
      message: 'Failed to trigger Apify actor',
      error: error.message
    });
  }
});

// Get run status
router.get('/runs/:runId/status', async (req, res) => {
  try {
    const { runId } = req.params;
    
    const [run] = await db
      .select()
      .from(runs)
      .where(eq(runs.id, runId));
    
    if (!run) {
      return res.status(404).json({ message: 'Run not found' });
    }

    // If running, check Apify status
    if (run.status === 'running' && run.output?.apifyRunId) {
      if (!isConfigured()) {
        return res.json(run);
      }

      const response = await fetch(
        `https://api.apify.com/v2/actor-runs/${run.output.apifyRunId}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.APIFY_API_TOKEN}`
          }
        }
      );

      if (response.ok) {
        const result = await response.json();
        const apifyStatus = result.data.status;
        
        // Update local status if changed
        if (apifyStatus === 'SUCCEEDED') {
          await db
            .update(runs)
            .set({
              status: 'completed',
              completedAt: new Date(),
              output: { ...run.output, apifyResult: result.data }
            })
            .where(eq(runs.id, runId));
          
          return res.json({
            ...run,
            status: 'completed',
            apifyStatus: result.data
          });
        } else if (apifyStatus === 'FAILED' || apifyStatus === 'ABORTED') {
          await db
            .update(runs)
            .set({
              status: 'failed',
              completedAt: new Date(),
              error: `Apify run ${apifyStatus}`
            })
            .where(eq(runs.id, runId));
          
          return res.json({
            ...run,
            status: 'failed',
            apifyStatus: result.data
          });
        }
      }
    }

    res.json(run);
  } catch (error: any) {
    console.error('Error getting run status:', error);
    res.status(500).json({
      message: 'Failed to get run status',
      error: error.message
    });
  }
});

// Get dataset items from completed run
router.get('/runs/:runId/dataset', async (req, res) => {
  if (!isConfigured()) {
    return res.status(503).json({
      message: 'Apify not configured',
      configured: false
    });
  }

  try {
    const { runId } = req.params;
    
    const [run] = await db
      .select()
      .from(runs)
      .where(eq(runs.id, runId));
    
    if (!run) {
      return res.status(404).json({ message: 'Run not found' });
    }

    if (run.status !== 'completed' || !run.output?.apifyRunId) {
      return res.status(400).json({ message: 'Run not completed or no Apify run ID' });
    }

    // Get dataset ID from run
    const runResponse = await fetch(
      `https://api.apify.com/v2/actor-runs/${run.output.apifyRunId}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.APIFY_API_TOKEN}`
        }
      }
    );

    if (!runResponse.ok) {
      throw new Error('Failed to get Apify run details');
    }

    const runData = await runResponse.json();
    const datasetId = runData.data.defaultDatasetId;

    // Get dataset items
    const datasetResponse = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.APIFY_API_TOKEN}`
        }
      }
    );

    if (!datasetResponse.ok) {
      throw new Error('Failed to get dataset items');
    }

    const items = await datasetResponse.json();
    res.json(items);
  } catch (error: any) {
    console.error('Error getting dataset:', error);
    res.status(500).json({
      message: 'Failed to get dataset',
      error: error.message
    });
  }
});

// List recent runs
router.get('/runs', async (req, res) => {
  try {
    const recentRuns = await db
      .select()
      .from(runs)
      .where(eq(runs.type, 'apify'))
      .orderBy(sql`${runs.createdAt} DESC`)
      .limit(10);

    res.json(recentRuns);
  } catch (error) {
    console.error('Error listing runs:', error);
    res.status(500).json({ message: 'Failed to list runs' });
  }
});

// Check Apify configuration status
router.get('/status', (req, res) => {
  const configured = isConfigured();
  
  res.json({
    configured,
    message: configured 
      ? 'Apify is configured and ready'
      : 'Apify not configured. Please add APIFY_API_TOKEN to environment variables.'
  });
});

export default router;