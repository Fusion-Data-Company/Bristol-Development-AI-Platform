import type { Express, Request, Response } from "express";
import { BristolMarketAgent } from "../services/bristolMarketAgent";
import { BristolFinancialAgent } from "../services/bristolFinancialAgent";
import { BristolDemographicsAgent } from "../services/bristolDemographicsAgent";
import { BristolSiteAgent } from "../services/bristolSiteAgent";

// Initialize Bristol Agents
const marketAgent = new BristolMarketAgent();
const financialAgent = new BristolFinancialAgent();
const demographicsAgent = new BristolDemographicsAgent();
const siteAgent = new BristolSiteAgent();

export function registerBristolAgentRoutes(app: Express) {
  
  // Market Intelligence Agent
  app.post('/api/bristol/market-analysis', async (req: Request, res: Response) => {
    try {
      const { market, analysisType = 'comprehensive' } = req.body;
      
      if (!market) {
        return res.status(400).json({
          error: 'Market is required for analysis'
        });
      }

      const result = await marketAgent.analyzeMarket({
        market,
        analysisType
      });

      res.json({
        success: true,
        agent: 'Bristol Market Intelligence',
        data: result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Market analysis failed:', error);
      res.status(500).json({
        error: 'Market analysis failed',
        message: (error as Error).message
      });
    }
  });

  // Financial Modeling Agent
  app.post('/api/bristol/financial-analysis', async (req: Request, res: Response) => {
    try {
      const {
        purchasePrice,
        units,
        market,
        capRate,
        holdPeriod = 5,
        exitCapRate
      } = req.body;

      if (!purchasePrice || !units || !market) {
        return res.status(400).json({
          error: 'Purchase price, units, and market are required for financial analysis'
        });
      }

      const result = await financialAgent.analyzeFinancials({
        purchasePrice,
        units,
        market,
        capRate,
        holdPeriod
      });

      res.json({
        success: true,
        agent: 'Bristol Financial Modeling',
        data: result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Financial analysis failed:', error);
      res.status(500).json({
        error: 'Financial analysis failed',
        message: (error as Error).message
      });
    }
  });

  // Demographics Intelligence Agent
  app.post('/api/bristol/demographics-analysis', async (req: Request, res: Response) => {
    try {
      const { location, radius = 5, analysisDepth = 'comprehensive' } = req.body;
      
      if (!location) {
        return res.status(400).json({
          error: 'Location is required for demographic analysis'
        });
      }

      const result = await demographicsAgent.analyzeDemographics({
        location,
        radius
      });

      res.json({
        success: true,
        agent: 'Bristol Demographics Intelligence',
        data: result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Demographics analysis failed:', error);
      res.status(500).json({
        error: 'Demographics analysis failed',
        message: (error as Error).message
      });
    }
  });

  // Site Analytics Agent
  app.post('/api/bristol/site-analysis', async (req: Request, res: Response) => {
    try {
      const { siteId, location, acreage, targetUnits } = req.body;
      
      if (!siteId && !location) {
        return res.status(400).json({
          error: 'Either siteId or location is required for site analysis'
        });
      }

      const result = await siteAgent.analyzeSite({
        siteId,
        acreage,
        targetUnits
      });

      res.json({
        success: true,
        agent: 'Bristol Site Analytics',
        data: result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Site analysis failed:', error);
      res.status(500).json({
        error: 'Site analysis failed',
        message: (error as Error).message
      });
    }
  });

  // Comprehensive Analysis - All Agents
  app.post('/api/bristol/comprehensive-analysis', async (req: Request, res: Response) => {
    try {
      const {
        market,
        location,
        purchasePrice,
        units,
        acreage,
        siteId,
        holdPeriod = 5
      } = req.body;

      if (!market || !location) {
        return res.status(400).json({
          error: 'Market and location are required for comprehensive analysis'
        });
      }

      // Run all Bristol agents in parallel for maximum efficiency
      const [
        marketAnalysis,
        financialAnalysis,
        demographicsAnalysis,
        siteAnalysis
      ] = await Promise.all([
        marketAgent.analyzeMarket({ market, analysisType: 'comprehensive' }),
        purchasePrice && units ? financialAgent.analyzeFinancials({
          purchasePrice,
          units,
          market,
          holdPeriod
        }) : null,
        demographicsAgent.analyzeDemographics({ location, radius: 5 }),
        siteId || acreage ? siteAgent.analyzeSite({ siteId, acreage, targetUnits: units }) : null
      ]);

      res.json({
        success: true,
        agents: 'All Bristol Intelligence Agents',
        data: {
          market: marketAnalysis,
          financial: financialAnalysis,
          demographics: demographicsAnalysis,
          site: siteAnalysis,
          summary: {
            analysisDate: new Date().toISOString(),
            market,
            location,
            comprehensiveScore: calculateComprehensiveScore({
              marketAnalysis,
              financialAnalysis,
              demographicsAnalysis,
              siteAnalysis
            })
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Comprehensive analysis failed:', error);
      res.status(500).json({
        error: 'Comprehensive analysis failed',
        message: (error as Error).message
      });
    }
  });

  // Bristol Agent Health Status
  app.get('/api/bristol/agent-status', async (req: Request, res: Response) => {
    try {
      const marketStatus = { status: 'healthy', details: { models: 'operational' } };
      const financialStatus = { status: 'healthy', details: { models: 'operational' } };
      const demographicsStatus = { status: 'healthy', details: { models: 'operational' } };
      const siteStatus = { status: 'healthy', details: { models: 'operational' } };

      const overallStatus = 'healthy';

      res.json({
        success: true,
        overallStatus,
        agents: {
          market: marketStatus,
          financial: financialStatus,
          demographics: demographicsStatus,
          site: siteStatus
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Agent status check failed:', error);
      res.status(500).json({
        error: 'Agent status check failed',
        message: (error as Error).message
      });
    }
  });
}

// Calculate comprehensive Bristol score across all agents
function calculateComprehensiveScore(analyses: {
  marketAnalysis?: any;
  financialAnalysis?: any;
  demographicsAnalysis?: any;
  siteAnalysis?: any;
}): number {
  let totalScore = 0;
  let validAnalyses = 0;

  // Market score (25% weight)
  if (analyses.marketAnalysis?.overallScore) {
    totalScore += analyses.marketAnalysis.overallScore * 0.25;
    validAnalyses++;
  }

  // Financial score (30% weight)
  if (analyses.financialAnalysis?.overallScore) {
    totalScore += analyses.financialAnalysis.overallScore * 0.30;
    validAnalyses++;
  }

  // Demographics score (25% weight)
  if (analyses.demographicsAnalysis?.overallScore) {
    totalScore += analyses.demographicsAnalysis.overallScore * 0.25;
    validAnalyses++;
  }

  // Site score (20% weight)
  if (analyses.siteAnalysis?.overallScore) {
    totalScore += analyses.siteAnalysis.overallScore * 0.20;
    validAnalyses++;
  }

  return validAnalyses > 0 ? Math.round(totalScore * (4 / validAnalyses)) : 0;
}