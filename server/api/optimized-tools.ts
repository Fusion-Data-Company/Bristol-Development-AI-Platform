import express, { Request, Response } from 'express';
import { propertyAnalysisService } from '../services/propertyAnalysisService';
import { intelligentSearchService } from '../services/intelligentSearchService';
import { reportGenerationService } from '../services/reportGenerationService';
import { enhancedToolOrchestrationService } from '../services/enhancedToolOrchestrationService';

export const optimizedToolsRouter = express.Router();

// Property Analysis Endpoints
optimizedToolsRouter.post('/property-analysis/:propertyId', async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;
    const { acquisitionPrice, loanAmount, interestRate } = req.body;
    const userId = (req as any).user?.id || 'demo-user';

    const analysis = await propertyAnalysisService.analyzeProperty(
      propertyId,
      userId,
      acquisitionPrice,
      loanAmount,
      interestRate
    );

    res.json({
      success: true,
      analysis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Property analysis failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Analysis failed'
    });
  }
});

optimizedToolsRouter.post('/market-analysis/:propertyId', async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;
    const userId = (req as any).user?.id || 'demo-user';

    const cma = await propertyAnalysisService.runCMA(propertyId, userId);

    res.json({
      success: true,
      cma,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Market analysis failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Analysis failed'
    });
  }
});

// Intelligent Search Endpoints
optimizedToolsRouter.post('/intelligent-search', async (req: Request, res: Response) => {
  try {
    const { query, filters, limit, offset } = req.body;
    const userId = (req as any).user?.id || 'demo-user';

    const searchResult = await intelligentSearchService.searchProperties(
      query || '',
      userId,
      filters,
      limit,
      offset
    );

    res.json({
      success: true,
      ...searchResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Intelligent search failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Search failed'
    });
  }
});

optimizedToolsRouter.get('/search-suggestions', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'demo-user';

    const suggestions = await intelligentSearchService.getPersonalizedSearchSuggestions(userId);

    res.json({
      success: true,
      suggestions,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Search suggestions failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get suggestions'
    });
  }
});

optimizedToolsRouter.post('/context-filtering', async (req: Request, res: Response) => {
  try {
    const { dataType, conversationContext, sessionId } = req.body;
    const userId = (req as any).user?.id || 'demo-user';

    const results = await intelligentSearchService.filterDataByContext(
      userId,
      sessionId || `context-${Date.now()}`,
      dataType,
      conversationContext
    );

    res.json({
      success: true,
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Context filtering failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Filtering failed'
    });
  }
});

// Report Generation Endpoints
optimizedToolsRouter.post('/generate-report', async (req: Request, res: Response) => {
  try {
    const { type, data, customizations, sessionId } = req.body;
    const userId = (req as any).user?.id || 'demo-user';

    const reportRequest = {
      type: type || 'property-analysis',
      data,
      userId,
      sessionId,
      customizations
    };

    const report = await reportGenerationService.generateReport(reportRequest);

    res.json({
      success: true,
      report,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Report generation failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Report generation failed'
    });
  }
});

optimizedToolsRouter.get('/report-customizations', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'demo-user';

    const suggestions = await reportGenerationService.getReportCustomizationSuggestions(userId);

    res.json({
      success: true,
      suggestions,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Report customization suggestions failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get suggestions'
    });
  }
});

// Tool Orchestration Endpoints
optimizedToolsRouter.post('/orchestrate/:chainId', async (req: Request, res: Response) => {
  try {
    const { chainId } = req.params;
    const { initialInput, sessionId } = req.body;
    const userId = (req as any).user?.id || 'demo-user';

    const result = await enhancedToolOrchestrationService.orchestrateToolChain(
      chainId,
      userId,
      sessionId || `orchestration-${Date.now()}`,
      initialInput
    );

    res.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Tool orchestration failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Orchestration failed'
    });
  }
});

optimizedToolsRouter.post('/tool-recommendations', async (req: Request, res: Response) => {
  try {
    const { conversationContext, sessionId } = req.body;
    const userId = (req as any).user?.id || 'demo-user';

    const recommendations = await enhancedToolOrchestrationService.recommendToolChains(
      userId,
      sessionId || `recommendations-${Date.now()}`,
      conversationContext
    );

    res.json({
      success: true,
      recommendations,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Tool recommendations failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get recommendations'
    });
  }
});

optimizedToolsRouter.get('/available-tool-chains', async (req: Request, res: Response) => {
  try {
    const toolChains = enhancedToolOrchestrationService.getAvailableToolChains();

    res.json({
      success: true,
      toolChains,
      count: toolChains.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to get tool chains:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get tool chains'
    });
  }
});

optimizedToolsRouter.post('/auto-orchestration', async (req: Request, res: Response) => {
  try {
    const { triggerEvent, eventData } = req.body;
    const userId = (req as any).user?.id || 'demo-user';

    const results = await enhancedToolOrchestrationService.executeAutomaticToolChains(
      userId,
      triggerEvent,
      eventData
    );

    res.json({
      success: true,
      results,
      count: results.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Auto orchestration failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Auto orchestration failed'
    });
  }
});

// Health check endpoint
optimizedToolsRouter.get('/health', async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      status: 'operational',
      services: {
        propertyAnalysis: 'ready',
        intelligentSearch: 'ready',
        reportGeneration: 'ready',
        toolOrchestration: 'ready'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Health check failed'
    });
  }
});

export default optimizedToolsRouter;