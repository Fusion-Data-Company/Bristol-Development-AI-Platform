// server/routes/comps-annex.ts
import type { Express, Request, Response } from 'express';
import { db } from '../db';
import { compsAnnex, scrapeJobsAnnex } from '@shared/schema';
import { sql, eq, ilike, desc } from 'drizzle-orm';
import { newScrapeJob, getJob, runJobNow } from '../scrapers/runner';

export function registerCompsAnnexRoutes(app: Express) {
  // Get comparables with pagination and search
  app.get('/api/comps-annex', async (req: Request, res: Response) => {
    try {
      const limit = Math.min(Number(req.query.limit ?? 2000), 10000);
      const offset = Number(req.query.offset ?? 0);
      const q = String(req.query.q ?? '').trim();
      
      let whereCondition = undefined;
      if (q) {
        whereCondition = ilike(compsAnnex.canonicalAddress, `%${q}%`);
      }
      
      const rows = await db.select()
        .from(compsAnnex)
        .where(whereCondition)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(compsAnnex.updatedAt));
      
      const totalResult = await db.execute(sql`select count(*)::int as c from comps_annex`);
      const total = totalResult.rows?.[0]?.c || totalResult[0]?.c || 0;
      
      res.json({ rows, total, limit, offset });
    } catch (error) {
      console.error('Error fetching comps:', error);
      res.status(500).json({ error: 'Failed to fetch comparables' });
    }
  });

  // Bulk upsert comparables
  app.post('/api/comps-annex/bulkUpsert', async (req, res) => {
    try {
      const rows = Array.isArray(req.body) ? req.body : [];
      if (!rows.length) return res.json({ ok: true, count: 0 });
      
      const values = rows.map((r) => ({ 
        ...r, 
        updatedAt: new Date(),
        id: r.id || crypto.randomUUID?.() || `comp_${Date.now()}_${Math.random()}`
      }));
      
      let insertedCount = 0;
      for (const value of values) {
        try {
          await db.insert(compsAnnex).values(value).onConflictDoUpdate({
            target: [compsAnnex.canonicalAddress, compsAnnex.unitPlan],
            set: {
              name: sql`excluded.name`, 
              address: sql`excluded.address`, 
              city: sql`excluded.city`, 
              state: sql`excluded.state`, 
              zip: sql`excluded.zip`,
              units: sql`excluded.units`, 
              rentPsf: sql`excluded.rent_psf`, 
              rentPu: sql`excluded.rent_pu`, 
              occupancyPct: sql`excluded.occupancy_pct`, 
              concessionPct: sql`excluded.concession_pct`,
              amenityTags: sql`excluded.amenity_tags`, 
              notes: sql`excluded.notes`, 
              updatedAt: sql`now()`
            },
          });
          insertedCount++;
        } catch (err) {
          console.warn('Error upserting individual comp:', err);
        }
      }
      
      res.json({ ok: true, count: insertedCount });
    } catch (error) {
      console.error('Error bulk upserting comps:', error);
      res.status(500).json({ error: 'Failed to bulk upsert comparables' });
    }
  });

  // Export comparables as CSV
  app.get('/api/comps-annex/export.csv', async (_req, res) => {
    try {
      const rows = await db.select().from(compsAnnex).limit(100000);
      
      if (!rows.length) {
        return res.type('text/csv').send('No data available\n');
      }
      
      const headers = Object.keys(rows[0]);
      const csv = [
        headers.join(','), 
        ...rows.map((r: any) => 
          headers.map(h => {
            const val = r[h];
            if (val === null || val === undefined) return '';
            if (typeof val === 'object') return JSON.stringify(val);
            return JSON.stringify(String(val));
          }).join(',')
        )
      ].join('\n');
      
      res.type('text/csv').send(csv);
    } catch (error) {
      console.error('Error exporting comps:', error);
      res.status(500).json({ error: 'Failed to export comparables' });
    }
  });

  // Start a scrape job
  app.post('/api/comps-annex/scrape', async (req, res) => {
    try {
      const id = await newScrapeJob(req.body);
      // Run job asynchronously
      runJobNow(id).catch((err) => {
        console.error('Scrape job failed:', err);
      });
      res.json({ id, status: 'queued' });
    } catch (error) {
      console.error('Error starting scrape job:', error);
      res.status(500).json({ error: 'Failed to start scrape job' });
    }
  });

  // Import CSV data
  app.post('/api/comps-annex/import', async (req, res) => {
    try {
      // For now, return success - would need multer and CSV parsing
      res.json({ ok: true, count: 0, message: 'CSV import not yet implemented' });
    } catch (error) {
      console.error('Error importing CSV:', error);
      res.status(500).json({ error: 'Failed to import CSV' });
    }
  });

  // Seed with sample data
  app.post('/api/comps-annex/seed', async (req, res) => {
    try {
      // Trigger a scrape job to populate with sample data
      const jobId = await newScrapeJob({
        address: 'Atlanta, GA',
        radius_mi: 10,
        asset_type: 'Multifamily',
        keywords: ['apartments', 'luxury']
      });
      
      // Run the job to populate data
      const count = await runJobNow(jobId);
      
      res.json({ ok: true, count });
    } catch (error) {
      console.error('Error seeding data:', error);
      res.status(500).json({ error: 'Failed to seed data' });
    }
  });

  // Get all scrape jobs
  app.get('/api/comps-annex/jobs', async (req, res) => {
    try {
      const jobs = await db.select().from(scrapeJobsAnnex).orderBy(sql`created_at DESC`).limit(50);
      res.json({ rows: jobs, total: jobs.length });
    } catch (error) {
      console.error('Error fetching jobs:', error);
      res.status(500).json({ error: 'Failed to fetch jobs' });
    }
  });

  // Get scrape job status
  app.get('/api/comps-annex/jobs/:id', async (req, res) => {
    try {
      const job = await getJob(req.params.id);
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }
      res.json(job);
    } catch (error) {
      console.error('Error fetching job status:', error);
      res.status(500).json({ error: 'Failed to fetch job status' });
    }
  });

  // Delete a comparable
  app.delete('/api/comps-annex/:id', async (req, res) => {
    try {
      await db.delete(compsAnnex).where(eq(compsAnnex.id, req.params.id));
      res.json({ ok: true });
    } catch (error) {
      console.error('Error deleting comp:', error);
      res.status(500).json({ error: 'Failed to delete comparable' });
    }
  });

  // Update a single comparable
  app.patch('/api/comps-annex/:id', async (req, res) => {
    try {
      const updates = { ...req.body, updatedAt: new Date() };
      await db.update(compsAnnex)
        .set(updates)
        .where(eq(compsAnnex.id, req.params.id));
      res.json({ ok: true });
    } catch (error) {
      console.error('Error updating comp:', error);
      res.status(500).json({ error: 'Failed to update comparable' });
    }
  });
}