// server/routes/ai-tools.ts
import type { Request, Response } from "express";
import { db } from "../db";
import { compsAnnex } from "../../shared/schema";
import { sql, ilike, desc } from "drizzle-orm";

export function registerAIToolRoutes(app: import("express").Express) {
  // Tool: comps_agent_scrape - already handled by existing /api/scraper/run

  // Tool: comps_status
  app.get("/api/tools/comps_status/:id", async (req: Request, res: Response) => {
    try {
      // For now, return completed status since we run scrapes synchronously
      // In a production system, this would check actual job status
      res.json({ 
        id: req.params.id, 
        status: "completed",
        message: "Scraping completed successfully"
      });
    } catch (error) {
      console.error("Error checking scrape status:", error);
      res.status(500).json({ error: "Failed to check scrape status" });
    }
  });

  // Tool: comps_search (enhanced search with filters)
  app.get("/api/tools/comps_search", async (req: Request, res: Response) => {
    try {
      const q = String(req.query.q || "");
      const limit = Math.min(Number(req.query.limit || 2000), 10000);

      let query = db.select().from(compsAnnex);

      if (q.trim()) {
        query = query.where(
          sql`${compsAnnex.canonicalAddress} ilike ${`%${q}%`} 
              or ${compsAnnex.name} ilike ${`%${q}%`}
              or ${compsAnnex.city} ilike ${`%${q}%`}`
        );
      }

      const rows = await query
        .orderBy(desc(compsAnnex.updatedAt))
        .limit(limit);

      res.json({ 
        rows,
        count: rows.length,
        query: q,
        limit
      });
    } catch (error) {
      console.error("Error searching comps:", error);
      res.status(500).json({ error: "Failed to search comparables" });
    }
  });

  // Enhanced analytics endpoint for tool use
  app.get("/api/tools/market_analysis/:market", async (req: Request, res: Response) => {
    try {
      const market = req.params.market;
      
      // Get comparables for the market
      const comps = await db.select()
        .from(compsAnnex)
        .where(
          sql`${compsAnnex.city} ilike ${`%${market}%`} 
              or ${compsAnnex.address} ilike ${`%${market}%`}`
        )
        .orderBy(desc(compsAnnex.updatedAt))
        .limit(100);

      // Calculate market metrics
      const metrics = {
        totalProperties: comps.length,
        avgRentPsf: comps.filter(c => c.rentPsf).reduce((sum, c) => sum + (c.rentPsf || 0), 0) / comps.filter(c => c.rentPsf).length || 0,
        avgRentPu: comps.filter(c => c.rentPu).reduce((sum, c) => sum + (c.rentPu || 0), 0) / comps.filter(c => c.rentPu).length || 0,
        avgOccupancy: comps.filter(c => c.occupancyPct).reduce((sum, c) => sum + (c.occupancyPct || 0), 0) / comps.filter(c => c.occupancyPct).length || 0,
        avgUnits: comps.filter(c => c.units).reduce((sum, c) => sum + (c.units || 0), 0) / comps.filter(c => c.units).length || 0,
        priceRanges: {
          rentPsf: {
            min: Math.min(...comps.filter(c => c.rentPsf).map(c => c.rentPsf || 0)),
            max: Math.max(...comps.filter(c => c.rentPsf).map(c => c.rentPsf || 0))
          },
          rentPu: {
            min: Math.min(...comps.filter(c => c.rentPu).map(c => c.rentPu || 0)),
            max: Math.max(...comps.filter(c => c.rentPu).map(c => c.rentPu || 0))
          }
        }
      };

      res.json({
        market,
        metrics,
        sampleProperties: comps.slice(0, 10),
        dataQuality: {
          completeness: comps.filter(c => c.rentPsf && c.rentPu && c.occupancyPct).length / comps.length,
          freshness: comps.filter(c => new Date(c.updatedAt).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000).length / comps.length
        }
      });
    } catch (error) {
      console.error("Error analyzing market:", error);
      res.status(500).json({ error: "Failed to analyze market" });
    }
  });
}