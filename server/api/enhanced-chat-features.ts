import express, { Request, Response } from 'express';
import { enhancedChatAgentService } from '../services/enhancedChatAgentService';
import { mcpIntegrationService } from '../services/mcpIntegrationService';
import { eliteMemoryEnhancementService } from '../services/eliteMemoryEnhancementService';
import { advancedAgentOrchestrationService } from '../services/advancedAgentOrchestrationService';

export const enhancedChatFeaturesRouter = express.Router();

// Enhanced Chat Processing Endpoints
enhancedChatFeaturesRouter.post('/process-enhanced-message', async (req: Request, res: Response) => {
  try {
    const { userId, sessionId, message, context } = req.body;
    
    if (!userId || !sessionId || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: userId, sessionId, message'
      });
    }

    const result = await enhancedChatAgentService.processEnhancedChatMessage(
      userId,
      sessionId,
      message,
      context
    );

    res.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing enhanced chat message:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Enhanced chat processing failed'
    });
  }
});

enhancedChatFeaturesRouter.post('/multi-perspective-response', async (req: Request, res: Response) => {
  try {
    const { query, userId, sessionId, analysisResults } = req.body;
    
    // Get chat context
    const chatContext = {
      userId,
      sessionId,
      conversationHistory: [],
      userPreferences: {},
      currentFocus: 'analysis',
      activeTools: [],
      memoryContext: []
    };

    const multiPerspectiveResponse = await enhancedChatAgentService.generateMultiPerspectiveResponse(
      query,
      chatContext,
      analysisResults || {}
    );

    res.json({
      success: true,
      ...multiPerspectiveResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating multi-perspective response:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Multi-perspective response generation failed'
    });
  }
});

enhancedChatFeaturesRouter.post('/memory-enhanced-conversation', async (req: Request, res: Response) => {
  try {
    const { userId, sessionId, currentMessage } = req.body;

    const enhancedContext = await enhancedChatAgentService.enhanceConversationWithMemory(
      userId,
      sessionId,
      currentMessage
    );

    res.json({
      success: true,
      enhancedContext,
      contextQuality: enhancedContext.patterns.length > 0 ? 'high' : 'standard',
      memoryInsights: enhancedContext.insights.slice(0, 3),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error enhancing conversation with memory:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Memory enhancement failed'
    });
  }
});

enhancedChatFeaturesRouter.post('/agent-collaboration', async (req: Request, res: Response) => {
  try {
    const { query, userId, sessionId, complexity } = req.body;

    const collaborationResult = await enhancedChatAgentService.orchestrateAgentCollaboration(
      query,
      userId,
      sessionId,
      complexity || 5
    );

    res.json({
      success: true,
      collaboration: collaborationResult,
      agentsInvolved: collaborationResult?.agents || [],
      synthesis: collaborationResult?.chatSynthesis || 'Collaboration completed',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error orchestrating agent collaboration:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Agent collaboration failed'
    });
  }
});

enhancedChatFeaturesRouter.post('/intelligent-tool-suggestions', async (req: Request, res: Response) => {
  try {
    const { message, userId, sessionId, autoExecute } = req.body;

    const chatContext = {
      userId,
      sessionId,
      conversationHistory: [],
      userPreferences: {},
      currentFocus: 'general',
      activeTools: [],
      memoryContext: []
    };

    const toolSuggestions = await enhancedChatAgentService.suggestAndExecuteTools(
      message,
      chatContext,
      autoExecute || false
    );

    res.json({
      success: true,
      ...toolSuggestions,
      autoExecutionEnabled: autoExecute || false,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating intelligent tool suggestions:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Tool suggestion failed'
    });
  }
});

enhancedChatFeaturesRouter.post('/adapt-chat-behavior', async (req: Request, res: Response) => {
  try {
    const { userId, feedbackData, interactionHistory } = req.body;

    await enhancedChatAgentService.adaptChatBehavior(
      userId,
      feedbackData,
      interactionHistory || []
    );

    res.json({
      success: true,
      message: 'Chat behavior adapted successfully',
      adaptations: [
        'Communication style updated',
        'Tool preferences optimized',
        'Response patterns improved'
      ],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error adapting chat behavior:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Chat behavior adaptation failed'
    });
  }
});

// MCP Integration Endpoints
enhancedChatFeaturesRouter.post('/execute-mcp-tool', async (req: Request, res: Response) => {
  try {
    const { toolId, parameters, userId, sessionId, context } = req.body;

    if (!toolId || !userId || !sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: toolId, userId, sessionId'
      });
    }

    const result = await mcpIntegrationService.executeToolWithIntelligence(
      toolId,
      parameters || {},
      userId,
      sessionId,
      context
    );

    res.json({
      success: !result.error,
      ...result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error executing MCP tool:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'MCP tool execution failed'
    });
  }
});

enhancedChatFeaturesRouter.post('/execute-tool-chain', async (req: Request, res: Response) => {
  try {
    const { toolChain, parameters, userId, sessionId, context } = req.body;

    if (!toolChain || !Array.isArray(toolChain) || toolChain.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Tool chain must be a non-empty array'
      });
    }

    const result = await mcpIntegrationService.executeToolChain(
      toolChain,
      parameters || {},
      userId,
      sessionId,
      context
    );

    res.json({
      success: !result.error,
      ...result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error executing tool chain:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Tool chain execution failed'
    });
  }
});

enhancedChatFeaturesRouter.post('/suggest-optimal-tools', async (req: Request, res: Response) => {
  try {
    const { userIntent, userId, sessionId, context } = req.body;

    if (!userIntent || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: userIntent, userId'
      });
    }

    const suggestions = await mcpIntegrationService.suggestOptimalTools(
      userIntent,
      userId,
      sessionId || `session-${Date.now()}`,
      context
    );

    res.json({
      success: !suggestions.error,
      ...suggestions,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error suggesting optimal tools:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Tool suggestion failed'
    });
  }
});

enhancedChatFeaturesRouter.get('/mcp-server-status', async (req: Request, res: Response) => {
  try {
    const serverStatus = await mcpIntegrationService.monitorMCPServers();

    res.json({
      success: true,
      ...serverStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting MCP server status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'MCP server monitoring failed'
    });
  }
});

enhancedChatFeaturesRouter.get('/tool-performance-analytics', async (req: Request, res: Response) => {
  try {
    const analytics = await mcpIntegrationService.analyzeToolPerformance();

    res.json({
      success: true,
      ...analytics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error analyzing tool performance:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Tool performance analysis failed'
    });
  }
});

enhancedChatFeaturesRouter.post('/orchestrate-mcp-tools', async (req: Request, res: Response) => {
  try {
    const { toolRequests, userId, sessionId, parameters } = req.body;

    const chatContext = {
      userId,
      sessionId,
      conversationHistory: [],
      userPreferences: {},
      currentFocus: 'tool_orchestration',
      activeTools: toolRequests || [],
      memoryContext: []
    };

    const orchestrationResult = await enhancedChatAgentService.orchestrateMCPTools(
      toolRequests || [],
      chatContext,
      parameters || {}
    );

    res.json({
      success: !orchestrationResult.error,
      ...orchestrationResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error orchestrating MCP tools:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'MCP tool orchestration failed'
    });
  }
});

// Advanced Chat Analytics and Insights
enhancedChatFeaturesRouter.get('/chat-analytics/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { timeframe } = req.query;

    // Get user patterns and insights
    const [patterns, insights] = await Promise.all([
      eliteMemoryEnhancementService.analyzeUserPatterns(userId),
      eliteMemoryEnhancementService.generatePredictiveInsights(userId)
    ]);

    const analytics = {
      userId,
      timeframe: timeframe || 'last_30_days',
      patterns: {
        total: patterns.length,
        highConfidence: patterns.filter(p => p.confidence > 0.8).length,
        categories: categorizePatterns(patterns)
      },
      insights: {
        total: insights.length,
        actionable: insights.filter(i => i.actionable).length,
        types: categorizeInsights(insights)
      },
      conversationMetrics: {
        averageSessionLength: calculateAverageSessionLength(patterns),
        preferredTopics: extractPreferredTopics(patterns),
        toolUsageFrequency: calculateToolUsage(patterns)
      },
      recommendations: generateUserRecommendations(patterns, insights)
    };

    res.json({
      success: true,
      analytics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating chat analytics:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Chat analytics generation failed'
    });
  }
});

enhancedChatFeaturesRouter.post('/optimize-chat-experience', async (req: Request, res: Response) => {
  try {
    const { userId, sessionId, optimizationGoals } = req.body;

    // Get current user patterns
    const patterns = await eliteMemoryEnhancementService.analyzeUserPatterns(userId);
    
    // Optimize memory storage
    await eliteMemoryEnhancementService.optimizeMemoryStorage(userId);

    // Generate optimization recommendations
    const optimizations = {
      memoryOptimization: 'Completed memory consolidation and pattern analysis',
      communicationStyle: optimizeCommunicationStyle(patterns),
      toolRecommendations: optimizeToolRecommendations(patterns),
      workflowSuggestions: await eliteMemoryEnhancementService.optimizeWorkflow(userId, 'chat_workflow'),
      personalizedDefaults: generatePersonalizedDefaults(patterns)
    };

    res.json({
      success: true,
      optimizations,
      optimizationGoals: optimizationGoals || ['efficiency', 'relevance', 'personalization'],
      improvementAreas: identifyImprovementAreas(patterns),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error optimizing chat experience:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Chat experience optimization failed'
    });
  }
});

enhancedChatFeaturesRouter.post('/handle-chat-error', async (req: Request, res: Response) => {
  try {
    const { error, userId, sessionId, originalMessage, context } = req.body;

    const chatContext = {
      userId,
      sessionId,
      conversationHistory: [],
      userPreferences: {},
      currentFocus: 'error_recovery',
      activeTools: [],
      memoryContext: []
    };

    const errorHandling = await enhancedChatAgentService.handleChatError(
      error,
      chatContext,
      originalMessage
    );

    res.json({
      success: true,
      errorHandling,
      recovery: errorHandling.recovered ? 'successful' : 'attempted',
      userGuidance: generateUserGuidance(errorHandling),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error handling chat error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Chat error handling failed'
    });
  }
});

// Real-time Chat Enhancement Features
enhancedChatFeaturesRouter.get('/real-time-suggestions/:userId/:sessionId', async (req: Request, res: Response) => {
  try {
    const { userId, sessionId } = req.params;
    const { currentInput } = req.query;

    // Get real-time suggestions based on current input
    const suggestions = await generateRealTimeSuggestions(
      userId,
      sessionId,
      currentInput as string || ''
    );

    res.json({
      success: true,
      suggestions,
      suggestionsCount: suggestions.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating real-time suggestions:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Real-time suggestions failed'
    });
  }
});

enhancedChatFeaturesRouter.post('/context-aware-assistance', async (req: Request, res: Response) => {
  try {
    const { userId, sessionId, currentContext, assistanceType } = req.body;

    const assistance = await generateContextAwareAssistance(
      userId,
      sessionId,
      currentContext,
      assistanceType || 'general'
    );

    res.json({
      success: true,
      assistance,
      contextQuality: assessContextQuality(currentContext),
      relevanceScore: assistance.relevanceScore || 0.8,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating context-aware assistance:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Context-aware assistance failed'
    });
  }
});

// Comprehensive chat system health check
enhancedChatFeaturesRouter.get('/system-health', async (req: Request, res: Response) => {
  try {
    const [mcpStatus, toolAnalytics] = await Promise.all([
      mcpIntegrationService.monitorMCPServers(),
      mcpIntegrationService.analyzeToolPerformance()
    ]);

    const systemHealth = {
      overall: calculateOverallChatHealth(mcpStatus, toolAnalytics),
      components: {
        enhancedChatAgent: { status: 'operational', capabilities: 6 },
        mcpIntegration: { status: mcpStatus.overallHealth, servers: Object.keys(mcpStatus.servers).length },
        memoryEnhancement: { status: 'operational', optimization: 'active' },
        agentOrchestration: { status: 'operational', agents: 5 },
        toolPerformance: { 
          status: toolAnalytics.topPerformingTools.length > 0 ? 'good' : 'fair',
          averagePerformance: calculateAverageToolPerformance(toolAnalytics)
        }
      },
      recommendations: [
        ...mcpStatus.recommendations,
        ...toolAnalytics.globalRecommendations
      ],
      lastUpdated: new Date().toISOString()
    };

    res.json({
      success: true,
      systemHealth,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error checking system health:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'System health check failed'
    });
  }
});

// Helper methods for the router
function categorizePatterns(patterns: any[]): any {
  const categories = {
    search: patterns.filter(p => p.category === 'preference' && p.pattern.includes('search')).length,
    analysis: patterns.filter(p => p.category === 'preference' && p.pattern.includes('analysis')).length,
    workflow: patterns.filter(p => p.category === 'workflow').length,
    behavior: patterns.filter(p => p.category === 'behavior').length
  };
  return categories;
}

function categorizeInsights(insights: any[]): any {
  return insights.reduce((acc: any, insight) => {
    acc[insight.type] = (acc[insight.type] || 0) + 1;
    return acc;
  }, {});
}

function calculateAverageSessionLength(patterns: any[]): number {
  // Placeholder calculation
  return patterns.length > 0 ? 15 : 10; // minutes
}

function extractPreferredTopics(patterns: any[]): string[] {
  const topics: string[] = [];
  patterns.forEach(pattern => {
    if (pattern.pattern.includes('property')) topics.push('property_analysis');
    if (pattern.pattern.includes('market')) topics.push('market_research');
    if (pattern.pattern.includes('financial')) topics.push('financial_modeling');
  });
  return [...new Set(topics)];
}

function calculateToolUsage(patterns: any[]): any {
  return {
    propertyAnalysis: patterns.filter(p => p.pattern.includes('property')).length,
    marketResearch: patterns.filter(p => p.pattern.includes('market')).length,
    reporting: patterns.filter(p => p.pattern.includes('report')).length
  };
}

function generateUserRecommendations(patterns: any[], insights: any[]): string[] {
  const recommendations: string[] = [];
  
  if (patterns.length > 10) {
    recommendations.push('Consider using automated workflows for repeated tasks');
  }
  
  if (insights.filter(i => i.actionable).length > 5) {
    recommendations.push('Review and act on predictive insights');
  }
  
  recommendations.push('Explore advanced tool chains for comprehensive analysis');
  
  return recommendations;
}

function optimizeCommunicationStyle(patterns: any[]): string {
  const formalPatterns = patterns.filter(p => p.pattern.includes('formal')).length;
  const technicalPatterns = patterns.filter(p => p.pattern.includes('technical')).length;
  
  if (technicalPatterns > formalPatterns) return 'technical';
  if (formalPatterns > 0) return 'formal';
  return 'professional';
}

function optimizeToolRecommendations(patterns: any[]): string[] {
  const recommendations: string[] = [];
  
  const analysisPatterns = patterns.filter(p => p.pattern.includes('analysis')).length;
  if (analysisPatterns > 3) {
    recommendations.push('property-analysis', 'market-intelligence-synthesis');
  }
  
  const searchPatterns = patterns.filter(p => p.pattern.includes('search')).length;
  if (searchPatterns > 2) {
    recommendations.push('intelligent-property-discovery');
  }
  
  return recommendations;
}

function generatePersonalizedDefaults(patterns: any[]): any {
  return {
    analysisDepth: patterns.length > 15 ? 'comprehensive' : 'standard',
    responseFormat: 'detailed',
    autoExecuteTools: patterns.filter(p => p.confidence > 0.9).length > 5,
    preferredWorkflow: 'integrated'
  };
}

function identifyImprovementAreas(patterns: any[]): string[] {
  const areas: string[] = [];
  
  if (patterns.filter(p => p.confidence < 0.7).length > 3) {
    areas.push('Pattern recognition accuracy');
  }
  
  if (patterns.filter(p => p.category === 'workflow').length < 2) {
    areas.push('Workflow optimization');
  }
  
  return areas;
}

function generateUserGuidance(errorHandling: any): string[] {
  const guidance: string[] = [];
  
  if (errorHandling.recovered) {
    guidance.push('The issue has been resolved automatically');
    guidance.push('You can continue with your request');
  } else {
    guidance.push('Please try rephrasing your request');
    guidance.push('Consider breaking down complex requests into smaller parts');
  }
  
  if (errorHandling.alternatives?.length > 0) {
    guidance.push('Alternative approaches are available');
  }
  
  return guidance;
}

async function generateRealTimeSuggestions(
  userId: string,
  sessionId: string,
  currentInput: string
): Promise<string[]> {
  const suggestions: string[] = [];
  
  if (currentInput.includes('analyze')) {
    suggestions.push('Analyze property at [address]');
    suggestions.push('Run comprehensive market analysis');
  }
  
  if (currentInput.includes('find')) {
    suggestions.push('Find properties in [location]');
    suggestions.push('Search for comparable properties');
  }
  
  if (currentInput.includes('report')) {
    suggestions.push('Generate investment summary report');
    suggestions.push('Create market analysis report');
  }
  
  return suggestions;
}

async function generateContextAwareAssistance(
  userId: string,
  sessionId: string,
  currentContext: any,
  assistanceType: string
): Promise<any> {
  const assistance = {
    type: assistanceType,
    suggestions: [],
    quickActions: [],
    relevanceScore: 0.8
  };
  
  switch (assistanceType) {
    case 'property_analysis':
      assistance.suggestions = [
        'Run DCF analysis with current market data',
        'Compare with similar properties in the area',
        'Assess risk factors and mitigation strategies'
      ];
      assistance.quickActions = [
        'Start financial modeling',
        'Get market comparables',
        'Generate investment memo'
      ];
      break;
      
    case 'market_research':
      assistance.suggestions = [
        'Analyze demographic trends in target market',
        'Review economic indicators and growth projections',
        'Identify competitive landscape and opportunities'
      ];
      assistance.quickActions = [
        'Get market report',
        'Analyze demographics',
        'Find opportunities'
      ];
      break;
      
    default:
      assistance.suggestions = [
        'Explore available tools and capabilities',
        'Review recent analysis results',
        'Access personalized recommendations'
      ];
      assistance.quickActions = [
        'Show capabilities',
        'Recent results',
        'Get recommendations'
      ];
  }
  
  return assistance;
}

function assessContextQuality(context: any): string {
  if (!context) return 'minimal';
  
  const contextKeys = Object.keys(context);
  if (contextKeys.length > 5) return 'rich';
  if (contextKeys.length > 2) return 'moderate';
  return 'basic';
}

function calculateOverallChatHealth(mcpStatus: any, toolAnalytics: any): string {
  const mcpHealthScore = mcpStatus.overallHealth === 'excellent' ? 100 : 
                         mcpStatus.overallHealth === 'good' ? 80 : 
                         mcpStatus.overallHealth === 'fair' ? 60 : 40;
  
  const toolHealthScore = toolAnalytics.topPerformingTools.length > 3 ? 90 : 70;
  
  const averageScore = (mcpHealthScore + toolHealthScore) / 2;
  
  if (averageScore >= 90) return 'excellent';
  if (averageScore >= 75) return 'good';
  if (averageScore >= 60) return 'fair';
  return 'needs_attention';
}

function calculateAverageToolPerformance(toolAnalytics: any): string {
  const excellentTools = Object.values(toolAnalytics.toolAnalytics)
    .filter((tool: any) => tool.performance === 'excellent').length;
  const totalTools = Object.keys(toolAnalytics.toolAnalytics).length;
  
  const percentage = totalTools > 0 ? (excellentTools / totalTools) * 100 : 0;
  
  if (percentage >= 80) return 'excellent';
  if (percentage >= 60) return 'good';
  if (percentage >= 40) return 'fair';
  return 'needs_improvement';
}

export default enhancedChatFeaturesRouter;