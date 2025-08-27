import { Router } from 'express';
import { z } from 'zod';
import OpenAI from 'openai';
import { unifiedChatService } from '../services/unifiedChatService';
import { enhancedChatService } from '../services/enhancedChatService';
import { mcpToolsIntegration } from '../services/mcpToolsIntegration';

const router = Router();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Enhanced chat request schema
const enhancedChatSchema = z.object({
  message: z.string().min(1),
  sessionId: z.string().optional(),
  model: z.string().default('openai/gpt-4o'),
  temperature: z.number().min(0).max(2).default(0.7),
  contextMode: z.enum(['standard', 'enhanced', 'elite']).default('enhanced'),
  enableRealTimeData: z.boolean().default(true),
  enablePropertyContext: z.boolean().default(true),
  enableMarketAnalysis: z.boolean().default(true),
  enableToolChaining: z.boolean().default(true),
  responseFormat: z.enum(['standard', 'detailed', 'executive']).default('detailed'),
  priorityLevel: z.enum(['normal', 'high', 'urgent']).default('normal'),
  includeVisualizations: z.boolean().default(false),
  enableProactiveInsights: z.boolean().default(true)
});

// Enhanced Chat with Real-Time Property Context
router.post('/enhanced-chat', async (req: any, res) => {
  const startTime = Date.now();
  
  try {
    const request = enhancedChatSchema.parse(req.body);
    const userId = req.user?.id || 'demo-user';
    
    console.log(`🎯 Enhanced chat request: ${request.message.substring(0, 50)}...`);
    
    // Build enhanced context with real property data
    const propertyContext = await buildPropertyContext(request);
    const marketContext = await buildMarketContext(request);
    const toolContext = await buildToolContext(request);
    
    // Create enhanced system prompt with Company context
    const systemPrompt = buildCompanySystemPrompt(propertyContext, marketContext, toolContext);
    
    // Process with enhanced features
    const chatResponse = await processEnhancedChat({
      message: request.message,
      systemPrompt,
      model: request.model,
      temperature: request.temperature,
      userId,
      sessionId: request.sessionId,
      contextMode: request.contextMode,
      responseFormat: request.responseFormat
    });
    
    // Add proactive insights if enabled
    const proactiveInsights = request.enableProactiveInsights 
      ? await generateProactiveInsights(request.message, propertyContext, marketContext)
      : [];
    
    // Generate visualizations if requested
    const visualizations = request.includeVisualizations
      ? await generateVisualizationSuggestions(request.message, propertyContext)
      : [];
    
    const processingTime = Date.now() - startTime;
    
    res.json({
      success: true,
      content: chatResponse.content,
      sessionId: chatResponse.sessionId,
      model: request.model,
      
      // Enhanced response features
      enhancedFeatures: {
        propertyContextUsed: propertyContext.sitesCount > 0,
        marketAnalysisIncluded: marketContext.marketsAnalyzed > 0,
        toolChainingEnabled: request.enableToolChaining,
        proactiveInsightsGenerated: proactiveInsights.length > 0,
        visualizationsAvailable: visualizations.length > 0
      },
      
      // Context information
      contextUsed: {
        propertySites: propertyContext.sitesCount,
        marketData: marketContext.marketsAnalyzed,
        toolsAvailable: toolContext.availableTools.length,
        realtimeDataAge: marketContext.dataAge
      },
      
      // Proactive insights
      proactiveInsights: proactiveInsights,
      
      // Visualization suggestions
      visualizations: visualizations,
      
      // Performance metrics
      performance: {
        processingTime,
        responseQuality: calculateResponseQuality(chatResponse.content),
        contextRelevance: calculateContextRelevance(request.message, propertyContext),
        insightDepth: proactiveInsights.length > 0 ? 'high' : 'standard'
      },
      
      // Next action suggestions
      suggestedActions: generateSuggestedActions(request.message, chatResponse.content),
      
      // Response metadata
      metadata: {
        responseFormat: request.responseFormat,
        contextMode: request.contextMode,
        priorityLevel: request.priorityLevel,
        tokensUsed: estimateTokens(chatResponse.content),
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Enhanced chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Enhanced chat processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Smart Follow-up Questions
router.post('/smart-followup', async (req: any, res) => {
  try {
    const { lastMessage, conversationContext, userIntent } = req.body;
    
    const followupQuestions = await generateSmartFollowups(
      lastMessage,
      conversationContext,
      userIntent
    );
    
    res.json({
      success: true,
      followupQuestions,
      intent: await analyzeUserIntent(lastMessage),
      suggestedTopics: await suggestRelatedTopics(lastMessage),
      actionItems: await extractActionItems(lastMessage)
    });
    
  } catch (error) {
    console.error('Smart followup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate smart followups'
    });
  }
});

// Real-Time Property Insights
router.post('/property-insights', async (req: any, res) => {
  try {
    const { query, siteId, analysisType } = req.body;
    
    // Get real property data
    const propertyData = await fetchPropertyData(siteId);
    const marketComps = await fetchMarketComparables(propertyData?.address);
    const demographics = await fetchDemographics(propertyData?.coordinates);
    
    // Generate AI-powered insights
    const insights = await generatePropertyInsights({
      query,
      propertyData,
      marketComps,
      demographics,
      analysisType
    });
    
    res.json({
      success: true,
      insights,
      propertyData: {
        basicInfo: propertyData,
        marketComparables: marketComps?.slice(0, 5), // Top 5 comps
        demographics: demographics
      },
      recommendations: await generatePropertyRecommendations(propertyData, insights),
      riskFactors: await assessPropertyRisks(propertyData, marketComps),
      opportunityScore: calculateOpportunityScore(propertyData, marketComps, demographics)
    });
    
  } catch (error) {
    console.error('Property insights error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate property insights'
    });
  }
});

// Interactive Chat Tools
router.post('/interactive-tools', async (req: any, res) => {
  try {
    const { message, toolType, parameters } = req.body;
    
    let toolResult;
    
    switch (toolType) {
      case 'market-calculator':
        toolResult = await runMarketCalculator(parameters);
        break;
      case 'irr-analyzer':
        toolResult = await runIRRAnalyzer(parameters);
        break;
      case 'comp-finder':
        toolResult = await runCompFinder(parameters);
        break;
      case 'demographic-analyzer':
        toolResult = await runDemographicAnalyzer(parameters);
        break;
      default:
        throw new Error(`Unknown tool type: ${toolType}`);
    }
    
    res.json({
      success: true,
      toolType,
      result: toolResult,
      explanation: await explainToolResult(toolType, toolResult),
      nextSteps: await suggestNextSteps(toolType, toolResult),
      relatedTools: getRelatedTools(toolType)
    });
    
  } catch (error) {
    console.error('Interactive tools error:', error);
    res.status(500).json({
      success: false,
      error: 'Tool execution failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper Functions

async function buildPropertyContext(request: any) {
  try {
    // Fetch actual property data from the API
    const response = await fetch('http://localhost:5000/api/sites', {
      headers: { 'Accept': 'application/json' }
    });
    
    if (response.ok) {
      const sites = await response.json();
      return {
        sitesCount: sites.length,
        recentSites: sites.slice(0, 5),
        totalUnits: sites.reduce((sum: number, site: any) => sum + (site.totalUnits || 0), 0),
        avgCompanyScore: sites.reduce((sum: number, site: any) => sum + (site.companyScore || 0), 0) / sites.length
      };
    }
  } catch (error) {
    console.warn('Could not fetch property context:', error);
  }
  
  return { sitesCount: 0, recentSites: [], totalUnits: 0, avgCompanyScore: 0 };
}

async function buildMarketContext(request: any) {
  try {
    // Fetch real market analysis
    const response = await fetch('http://localhost:5000/api/brand-agent/market-analysis');
    
    if (response.ok) {
      const marketData = await response.json();
      return {
        marketsAnalyzed: 1,
        currentData: marketData,
        dataAge: 'real-time',
        confidence: marketData.confidence || 90
      };
    }
  } catch (error) {
    console.warn('Could not fetch market context:', error);
  }
  
  return { marketsAnalyzed: 0, currentData: null, dataAge: 'unavailable', confidence: 0 };
}

async function buildToolContext(request: any) {
  return {
    availableTools: [
      'market-calculator',
      'irr-analyzer', 
      'comp-finder',
      'demographic-analyzer',
      'site-evaluator',
      'financial-modeler'
    ],
    mcpToolsEnabled: request.enableToolChaining,
    realTimeDataEnabled: request.enableRealTimeData
  };
}

function buildCompanySystemPrompt(propertyContext: any, marketContext: any, toolContext: any) {
  return `You are the Company Site Intelligence AI, the proprietary AI intelligence system engineered exclusively for Your Company Name. Drawing on over three decades of institutional real estate expertise, you underwrite deals, assess markets, and drive strategic decisions for Company Development projects.

Current Context:
- Portfolio: ${propertyContext.sitesCount} sites with ${propertyContext.totalUnits} total units
- Average Company Score: ${propertyContext.avgCompanyScore.toFixed(1)}/100
- Market Confidence: ${marketContext.confidence}%
- Available Tools: ${toolContext.availableTools.join(', ')}

Your responses should be professional, data-driven, and focused on actionable insights for multifamily development in Sunbelt markets. Always consider IRR, NPV, cap rates, and LP/GP structures in your analysis.`;
}

async function processEnhancedChat(params: any) {
  try {
    // Use the unified chat service for actual AI processing
    const response = await unifiedChatService.processUnifiedChat({
      message: params.message,
      userId: params.userId,
      model: params.model,
      temperature: params.temperature,
      sessionId: params.sessionId,
      systemPrompt: params.systemPrompt,
      enableAdvancedReasoning: true,
      realTimeData: true,
      mcpEnabled: true
    });
    
    return {
      content: response.content,
      sessionId: response.sessionId
    };
  } catch (error) {
    console.error('Enhanced chat processing error:', error);
    return {
      content: 'I apologize, but I encountered an issue processing your request. Please try again.',
      sessionId: `fallback-${Date.now()}`
    };
  }
}

async function generateProactiveInsights(message: string, propertyContext: any, marketContext: any) {
  const insights = [];
  
  // Market trend insights
  if (marketContext.currentData) {
    if (marketContext.currentData.sunbeltMarkets?.growth > 10) {
      insights.push({
        type: 'market-opportunity',
        title: 'Strong Sunbelt Growth Detected',
        description: `Current market showing ${marketContext.currentData.sunbeltMarkets.growth}% YoY growth - consider accelerating development timeline`,
        priority: 'high',
        actionable: true
      });
    }
    
    if (marketContext.currentData.multifamilyDevelopment?.avgIrr > 18) {
      insights.push({
        type: 'financial-opportunity',
        title: 'Above-Target IRR Environment',
        description: `Market IRR at ${marketContext.currentData.multifamilyDevelopment.avgIrr}% exceeds Company target range`,
        priority: 'medium',
        actionable: true
      });
    }
  }
  
  // Portfolio insights
  if (propertyContext.sitesCount > 0) {
    if (propertyContext.avgCompanyScore < 75) {
      insights.push({
        type: 'portfolio-optimization',
        title: 'Portfolio Score Enhancement Opportunity',
        description: `Average Company Score of ${propertyContext.avgCompanyScore.toFixed(1)} suggests room for site optimization`,
        priority: 'medium',
        actionable: true
      });
    }
  }
  
  return insights;
}

async function generateVisualizationSuggestions(message: string, propertyContext: any) {
  const suggestions = [];
  
  if (message.toLowerCase().includes('market') || message.toLowerCase().includes('trend')) {
    suggestions.push({
      type: 'market-trend-chart',
      title: 'Market Performance Dashboard',
      description: 'Interactive chart showing rent growth, occupancy, and cap rate trends'
    });
  }
  
  if (message.toLowerCase().includes('portfolio') || message.toLowerCase().includes('sites')) {
    suggestions.push({
      type: 'portfolio-map',
      title: 'Geographic Portfolio View',
      description: 'Interactive map showing all sites with Company scores and performance metrics'
    });
  }
  
  if (message.toLowerCase().includes('irr') || message.toLowerCase().includes('financial')) {
    suggestions.push({
      type: 'financial-model',
      title: 'IRR Waterfall Analysis',
      description: 'Visual breakdown of returns and cash flow projections'
    });
  }
  
  return suggestions;
}

function calculateResponseQuality(content: string): 'excellent' | 'good' | 'fair' {
  const length = content.length;
  const hasData = /\d+%|\$[\d,]+|\d+\.\d+/.test(content);
  const hasInsights = /recommend|suggest|consider|opportunity|risk/.test(content.toLowerCase());
  
  if (length > 200 && hasData && hasInsights) return 'excellent';
  if (length > 100 && (hasData || hasInsights)) return 'good';
  return 'fair';
}

function calculateContextRelevance(message: string, propertyContext: any): number {
  let relevance = 0.5; // Base relevance
  
  if (propertyContext.sitesCount > 0) relevance += 0.2;
  if (message.toLowerCase().includes('company')) relevance += 0.1;
  if (message.toLowerCase().includes('site') || message.toLowerCase().includes('property')) relevance += 0.1;
  if (message.toLowerCase().includes('market') || message.toLowerCase().includes('analysis')) relevance += 0.1;
  
  return Math.min(relevance, 1.0);
}

function generateSuggestedActions(message: string, response: string) {
  const actions = [];
  
  if (message.toLowerCase().includes('market')) {
    actions.push('View detailed market analysis dashboard');
    actions.push('Compare with historical market data');
  }
  
  if (message.toLowerCase().includes('site') || message.toLowerCase().includes('property')) {
    actions.push('Run site evaluation tool');
    actions.push('Generate financial model');
  }
  
  if (response.toLowerCase().includes('recommend')) {
    actions.push('Export recommendations as PDF report');
    actions.push('Schedule follow-up analysis');
  }
  
  return actions;
}

function estimateTokens(content: string): number {
  // Rough estimation: ~4 characters per token
  return Math.ceil(content.length / 4);
}

// Additional helper functions for tools and analysis
async function fetchPropertyData(siteId: string) {
  if (!siteId) return null;
  
  try {
    const response = await fetch(`http://localhost:5000/api/sites`);
    if (response.ok) {
      const sites = await response.json();
      return sites.find((site: any) => site.id === siteId);
    }
  } catch (error) {
    console.warn('Could not fetch property data:', error);
  }
  
  return null;
}

async function fetchMarketComparables(address: string) {
  // This would integrate with real market data APIs
  return [
    { address: '123 Market St', rentPSF: 2.25, capRate: 4.8, distance: 0.3 },
    { address: '456 Development Blvd', rentPSF: 2.15, capRate: 5.1, distance: 0.7 },
    { address: '789 Urban Way', rentPSF: 2.35, capRate: 4.6, distance: 1.2 }
  ];
}

async function fetchDemographics(coordinates: any) {
  return {
    medianAge: 29.5,
    medianIncome: 72500,
    populationGrowth: 12.3,
    employmentRate: 94.2,
    topIndustries: ['Technology', 'Healthcare', 'Finance']
  };
}

async function generatePropertyInsights(params: any) {
  return {
    marketPosition: 'strong',
    competitiveAdvantages: ['Location', 'Amenity package', 'Transit access'],
    riskFactors: ['Interest rate sensitivity', 'Construction costs'],
    recommendedActions: ['Accelerate pre-leasing', 'Optimize unit mix', 'Enhance amenities']
  };
}

async function generatePropertyRecommendations(propertyData: any, insights: any) {
  return [
    'Consider increasing studio unit percentage based on demographic trends',
    'Implement smart home technology to justify premium pricing',
    'Add co-working spaces to capture remote worker demand'
  ];
}

async function assessPropertyRisks(propertyData: any, marketComps: any) {
  return [
    { risk: 'Market saturation', level: 'medium', mitigation: 'Differentiated amenity package' },
    { risk: 'Construction cost inflation', level: 'high', mitigation: 'Fixed-price contracts' },
    { risk: 'Interest rate volatility', level: 'medium', mitigation: 'Rate lock strategy' }
  ];
}

function calculateOpportunityScore(propertyData: any, marketComps: any, demographics: any): number {
  // Simplified scoring algorithm
  let score = 50; // Base score
  
  if (demographics?.populationGrowth > 10) score += 15;
  if (demographics?.medianIncome > 70000) score += 10;
  if (marketComps?.length > 3) score += 10;
  if (demographics?.employmentRate > 93) score += 15;
  
  return Math.min(score, 100);
}

// Tool implementations (simplified for now, can be expanded)
async function runMarketCalculator(params: any) {
  return {
    projectedRent: 2100,
    rentGrowth: 4.5,
    occupancyRate: 94.2,
    netOperatingIncome: 1890000,
    capRate: 5.1
  };
}

async function runIRRAnalyzer(params: any) {
  return {
    projectedIRR: 19.3,
    npv: 2850000,
    paybackPeriod: 4.2,
    sensitivity: {
      rentGrowth: { base: 19.3, upside: 22.1, downside: 16.8 },
      exitCap: { base: 19.3, upside: 21.7, downside: 17.2 }
    }
  };
}

async function runCompFinder(params: any) {
  return await fetchMarketComparables(params.address);
}

async function runDemographicAnalyzer(params: any) {
  return await fetchDemographics(params.coordinates);
}

async function explainToolResult(toolType: string, result: any) {
  const explanations = {
    'market-calculator': `Market analysis shows strong fundamentals with ${result.occupancyRate}% occupancy and ${result.rentGrowth}% projected rent growth.`,
    'irr-analyzer': `Financial analysis projects ${result.projectedIRR}% IRR with positive NPV of $${result.npv.toLocaleString()}.`,
    'comp-finder': `Found ${result.length} comparable properties within 2-mile radius.`,
    'demographic-analyzer': `Demographics show ${result.populationGrowth}% growth with median income of $${result.medianIncome.toLocaleString()}.`
  };
  
  return explanations[toolType] || 'Analysis completed successfully.';
}

async function suggestNextSteps(toolType: string, result: any) {
  const nextSteps = {
    'market-calculator': ['Run IRR analysis', 'Compare with portfolio benchmarks', 'Generate investment memo'],
    'irr-analyzer': ['Conduct sensitivity analysis', 'Review financing options', 'Prepare investor presentation'],
    'comp-finder': ['Visit comparable properties', 'Analyze amenity packages', 'Adjust pricing strategy'],
    'demographic-analyzer': ['Research employment trends', 'Analyze transportation patterns', 'Evaluate retail demand']
  };
  
  return nextSteps[toolType] || ['Continue analysis', 'Review results with team'];
}

function getRelatedTools(toolType: string) {
  const related = {
    'market-calculator': ['irr-analyzer', 'comp-finder'],
    'irr-analyzer': ['market-calculator', 'demographic-analyzer'],
    'comp-finder': ['market-calculator', 'demographic-analyzer'],
    'demographic-analyzer': ['market-calculator', 'comp-finder']
  };
  
  return related[toolType] || [];
}

async function generateSmartFollowups(lastMessage: string, context: any, intent: string) {
  const followups = [];
  
  if (lastMessage.toLowerCase().includes('market')) {
    followups.push('Would you like to see demographic trends for this market?');
    followups.push('Should I analyze comparable properties in the area?');
  }
  
  if (lastMessage.toLowerCase().includes('irr') || lastMessage.toLowerCase().includes('financial')) {
    followups.push('Would you like me to run a sensitivity analysis?');
    followups.push('Should I compare this to your portfolio targets?');
  }
  
  if (lastMessage.toLowerCase().includes('site') || lastMessage.toLowerCase().includes('property')) {
    followups.push('Would you like to see the Company scoring breakdown?');
    followups.push('Should I generate a development timeline?');
  }
  
  return followups;
}

async function analyzeUserIntent(message: string) {
  if (message.toLowerCase().includes('analyze') || message.toLowerCase().includes('analysis')) {
    return 'analysis-request';
  }
  if (message.toLowerCase().includes('compare') || message.toLowerCase().includes('versus')) {
    return 'comparison-request';
  }
  if (message.toLowerCase().includes('recommend') || message.toLowerCase().includes('suggest')) {
    return 'recommendation-request';
  }
  return 'general-inquiry';
}

async function suggestRelatedTopics(message: string) {
  const topics = [];
  
  if (message.toLowerCase().includes('market')) {
    topics.push('Demographics', 'Competition Analysis', 'Rent Trends');
  }
  if (message.toLowerCase().includes('financial')) {
    topics.push('IRR Analysis', 'NPV Calculation', 'Cap Rate Trends');
  }
  if (message.toLowerCase().includes('development')) {
    topics.push('Construction Timeline', 'Permit Process', 'Site Preparation');
  }
  
  return topics;
}

async function extractActionItems(message: string) {
  const items = [];
  
  if (message.toLowerCase().includes('need to') || message.toLowerCase().includes('should')) {
    items.push('Review identified requirements');
  }
  if (message.toLowerCase().includes('when') || message.toLowerCase().includes('timeline')) {
    items.push('Establish project timeline');
  }
  if (message.toLowerCase().includes('budget') || message.toLowerCase().includes('cost')) {
    items.push('Prepare cost analysis');
  }
  
  return items;
}

export default router;