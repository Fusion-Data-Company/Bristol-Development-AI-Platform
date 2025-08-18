import type { Express, Request, Response } from "express";
import { placeholderReplacementService } from "../services/placeholderReplacementService";

export function registerPlaceholderReplacementRoutes(app: Express) {
  
  // Replace Category 1: Property & Market Data placeholders (15 sections)
  app.post('/api/placeholders/replace/category1/:siteId', async (req: Request, res: Response) => {
    try {
      const { siteId } = req.params;
      
      if (!siteId) {
        return res.status(400).json({
          error: 'Site ID is required'
        });
      }

      const result = await placeholderReplacementService.replaceCategory1Placeholders(siteId);

      res.json({
        success: true,
        message: 'Category 1 placeholders replaced with real property and market data',
        ...result
      });

    } catch (error) {
      console.error('Category 1 replacement failed:', error);
      res.status(500).json({
        error: 'Category 1 placeholder replacement failed',
        message: (error as Error).message
      });
    }
  });

  // Replace Category 2: Financial & Economic Data placeholders (12 sections)
  app.post('/api/placeholders/replace/category2/:siteId', async (req: Request, res: Response) => {
    try {
      const { siteId } = req.params;
      
      if (!siteId) {
        return res.status(400).json({
          error: 'Site ID is required'
        });
      }

      const result = await placeholderReplacementService.replaceCategory2Placeholders(siteId);

      res.json({
        success: true,
        message: 'Category 2 placeholders replaced with real financial and economic data',
        ...result
      });

    } catch (error) {
      console.error('Category 2 replacement failed:', error);
      res.status(500).json({
        error: 'Category 2 placeholder replacement failed',
        message: (error as Error).message
      });
    }
  });

  // Replace Category 3: Site & Location Data placeholders (20 sections)
  app.post('/api/placeholders/replace/category3/:siteId', async (req: Request, res: Response) => {
    try {
      const { siteId } = req.params;
      
      if (!siteId) {
        return res.status(400).json({
          error: 'Site ID is required'
        });
      }

      const result = await placeholderReplacementService.replaceCategory3Placeholders(siteId);

      res.json({
        success: true,
        message: 'Category 3 placeholders replaced with real site and location data',
        ...result
      });

    } catch (error) {
      console.error('Category 3 replacement failed:', error);
      res.status(500).json({
        error: 'Category 3 placeholder replacement failed',
        message: (error as Error).message
      });
    }
  });

  // Replace ALL 47 placeholders for a site
  app.post('/api/placeholders/replace/all/:siteId', async (req: Request, res: Response) => {
    try {
      const { siteId } = req.params;
      
      if (!siteId) {
        return res.status(400).json({
          error: 'Site ID is required'
        });
      }

      const result = await placeholderReplacementService.replaceAllPlaceholders(siteId);

      res.json({
        success: true,
        message: 'ALL 47 placeholders successfully replaced with real data!',
        ...result
      });

    } catch (error) {
      console.error('Comprehensive replacement failed:', error);
      res.status(500).json({
        error: 'Comprehensive placeholder replacement failed',
        message: (error as Error).message
      });
    }
  });

  // Get placeholder replacement status for a site
  app.get('/api/placeholders/status/:siteId', async (req: Request, res: Response) => {
    try {
      const { siteId } = req.params;
      
      if (!siteId) {
        return res.status(400).json({
          error: 'Site ID is required'
        });
      }

      const status = await placeholderReplacementService.getPlaceholderStatus(siteId);

      res.json({
        success: true,
        ...status
      });

    } catch (error) {
      console.error('Placeholder status check failed:', error);
      res.status(500).json({
        error: 'Placeholder status check failed',
        message: (error as Error).message
      });
    }
  });

  // Batch replace placeholders across multiple sites
  app.post('/api/placeholders/replace/batch', async (req: Request, res: Response) => {
    try {
      const { siteIds } = req.body;
      
      if (!siteIds || !Array.isArray(siteIds) || siteIds.length === 0) {
        return res.status(400).json({
          error: 'Array of site IDs is required'
        });
      }

      const result = await placeholderReplacementService.batchReplacePlaceholders(siteIds);

      res.json({
        success: true,
        message: `Batch placeholder replacement completed for ${siteIds.length} sites`,
        ...result
      });

    } catch (error) {
      console.error('Batch replacement failed:', error);
      res.status(500).json({
        error: 'Batch placeholder replacement failed',
        message: (error as Error).message
      });
    }
  });

  // Get overall placeholder replacement statistics
  app.get('/api/placeholders/stats', async (req: Request, res: Response) => {
    try {
      // This would query the database for overall statistics
      const stats = {
        totalPlaceholders: 47,
        categories: {
          category1: {
            name: 'Property & Market Data',
            placeholders: 15,
            description: 'Rental comps, cap rates, construction pipeline, absorption rates'
          },
          category2: {
            name: 'Financial & Economic Data', 
            placeholders: 12,
            description: 'Interest rates, employment data, GDP growth, inflation'
          },
          category3: {
            name: 'Site & Location Data',
            placeholders: 20,
            description: 'Demographics, POI, transportation, schools, crime stats'
          }
        },
        dataSourcesAvailable: {
          costar: process.env.COSTAR_API_KEY ? 'configured' : 'missing',
          apartmentList: process.env.APARTMENTLIST_API_KEY ? 'configured' : 'missing',
          bls: process.env.BLS_API_KEY ? 'configured' : 'missing',
          fred: process.env.FRED_API_KEY ? 'configured' : 'missing',
          arcgis: process.env.ARCGIS_TOKEN ? 'configured' : 'missing',
          foursquare: process.env.FOURSQUARE_API_KEY ? 'configured' : 'missing'
        },
        timestamp: new Date().toISOString()
      };

      res.json({
        success: true,
        ...stats
      });

    } catch (error) {
      console.error('Placeholder stats failed:', error);
      res.status(500).json({
        error: 'Placeholder stats retrieval failed',
        message: (error as Error).message
      });
    }
  });
}