import { Router } from 'express';
import { enhancedChatService } from '../services/enhancedChatService';
import { conversationMemory } from '../services/conversationMemory';
import { mcpToolsIntegration } from '../services/mcpToolsIntegration';
import { z } from 'zod';

const router = Router();

// Enhanced conversation request schema
const conversationRequestSchema = z.object({
  message: z.string().min(1),
  sessionId: z.string().optional(),
  model: z.string().default('openai/gpt-4o'),
  sourceInstance: z.enum(['main', 'floating']).default('main'),
  features: z.object({
    mcpTools: z.boolean().default(true),
    conversationMemory: z.boolean().default(true),
    realTimeData: z.boolean().default(true),
    advancedReasoning: z.boolean().default(true),
    personalization: z.boolean().default(true)
  }).default({}),
  preferences: z.object({
    responseStyle: z.enum(['concise', 'detailed', 'comprehensive']).default('detailed'),
    technicalLevel: z.enum(['basic', 'intermediate', 'expert']).default('intermediate'),
    dataVisualization: z.boolean().default(false),
    followUpSuggestions: z.boolean().default(true)
  }).default({})
});

// Advanced conversation endpoint with full context and tool integration
router.post('/chat', async (req: any, res) => {
  try {
    const validatedRequest = conversationRequestSchema.parse(req.body);
    const userId = req.user?.id || 'demo-user';

    // Get conversation context
    let conversationContext = null;
    if (validatedRequest.features.conversationMemory) {
      conversationContext = await conversationMemory.getConversationContext(
        validatedRequest.sessionId || 'temp-session',
        userId
      );
    }

    // Enhanced system prompt with conversation context
    let enhancedSystemPrompt = `You are the Bristol Site Intelligence AI, an elite real estate investment analysis system. You have access to comprehensive MCP tools and conversation memory.`;
    
    if (conversationContext) {
      enhancedSystemPrompt += conversationMemory.generateContextPrompt(conversationContext);
    }

    // Add user preferences to system prompt
    enhancedSystemPrompt += `\n\n## User Preferences
Response Style: ${validatedRequest.preferences.responseStyle}
Technical Level: ${validatedRequest.preferences.technicalLevel}
Follow-up Suggestions: ${validatedRequest.preferences.followUpSuggestions ? 'Include relevant follow-up questions' : 'Keep responses focused'}`;

    // Process message with enhanced context
    const result = await enhancedChatService.processMessage({
      message: validatedRequest.message,
      sessionId: validatedRequest.sessionId,
      model: validatedRequest.model,
      sourceInstance: validatedRequest.sourceInstance,
      mcpEnabled: validatedRequest.features.mcpTools,
      realTimeData: validatedRequest.features.realTimeData,
      enableAdvancedReasoning: validatedRequest.features.advancedReasoning,
      systemPrompt: enhancedSystemPrompt,
      streaming: false
    }, userId);

    // Update conversation memory
    if (validatedRequest.features.conversationMemory && conversationContext) {
      await conversationMemory.updateConversationContext(
        result.sessionId,
        { role: 'user', content: validatedRequest.message }
      );
      await conversationMemory.updateConversationContext(
        result.sessionId,
        { role: 'assistant', content: result.content, metadata: result.metadata }
      );
    }

    // Generate follow-up suggestions if enabled
    let followUpSuggestions: string[] = [];
    if (validatedRequest.preferences.followUpSuggestions) {
      followUpSuggestions = generateFollowUpSuggestions(
        validatedRequest.message,
        result.content,
        result.metadata?.toolsExecuted || []
      );
    }

    // Enhanced response format
    res.json({
      content: result.content,
      sessionId: result.sessionId,
      model: result.model,
      metadata: {
        ...result.metadata,
        conversationAnalytics: conversationContext ? 
          conversationMemory.getConversationAnalytics(result.sessionId) : null,
        responseGenerated: new Date().toISOString(),
        features: validatedRequest.features
      },
      followUpSuggestions,
      toolsAvailable: mcpToolsIntegration.getAvailableTools().map(tool => ({
        name: tool.name,
        description: tool.description
      })),
      success: result.success
    });

  } catch (error) {
    console.error('Advanced conversation error:', error);
    res.status(500).json({
      error: 'Failed to process conversation',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Tool suggestion endpoint
router.post('/suggest-tools', async (req: any, res) => {
  try {
    const { message, context } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const suggestedTools = suggestToolsForMessage(message.toLowerCase());
    
    res.json({
      suggestedTools,
      message: `Based on your request, I recommend using these tools: ${suggestedTools.map(t => t.name).join(', ')}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Tool suggestion error:', error);
    res.status(500).json({
      error: 'Failed to suggest tools',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Conversation analytics endpoint
router.get('/analytics/:sessionId', async (req: any, res) => {
  try {
    const { sessionId } = req.params;
    const analytics = conversationMemory.getConversationAnalytics(sessionId);
    
    if (!analytics) {
      return res.status(404).json({
        error: 'Conversation not found or expired',
        sessionId
      });
    }

    res.json({
      sessionId,
      analytics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      error: 'Failed to get analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Batch tool execution endpoint
router.post('/execute-tools', async (req: any, res) => {
  try {
    const { tools } = req.body;
    const userId = req.user?.id || 'demo-user';
    
    if (!Array.isArray(tools) || tools.length === 0) {
      return res.status(400).json({ error: 'Tools array is required' });
    }

    const results = [];
    
    for (const toolRequest of tools) {
      const { name, parameters } = toolRequest;
      
      try {
        const result = await mcpToolsIntegration.executeTool(name, parameters);
        results.push({
          tool: name,
          success: result.success,
          data: result.data,
          executionTime: result.executionTime,
          error: result.error
        });
      } catch (error) {
        results.push({
          tool: name,
          success: false,
          data: null,
          executionTime: 0,
          error: error instanceof Error ? error.message : 'Tool execution failed'
        });
      }
    }

    res.json({
      results,
      totalExecutionTime: results.reduce((sum, r) => sum + r.executionTime, 0),
      successCount: results.filter(r => r.success).length,
      failureCount: results.filter(r => !r.success).length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Batch tool execution error:', error);
    res.status(500).json({
      error: 'Failed to execute tools',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper functions
function generateFollowUpSuggestions(userMessage: string, assistantResponse: string, toolsUsed: string[]): string[] {
  const suggestions: string[] = [];
  const messageLower = userMessage.toLowerCase();
  
  // Property search follow-ups
  if (messageLower.includes('property') || messageLower.includes('search')) {
    suggestions.push("Would you like me to analyze the demographics of this area?");
    suggestions.push("Should I calculate financial metrics for any specific properties?");
    suggestions.push("Would you like to see comparable properties in nearby areas?");
  }
  
  // Financial analysis follow-ups
  if (messageLower.includes('irr') || messageLower.includes('cap rate') || messageLower.includes('financial')) {
    suggestions.push("Would you like me to run a sensitivity analysis on these metrics?");
    suggestions.push("Should I create different scenario models (optimistic, pessimistic)?");
    suggestions.push("Would you like to see how these metrics compare to market averages?");
  }
  
  // Market analysis follow-ups
  if (messageLower.includes('market') || messageLower.includes('demographic')) {
    suggestions.push("Would you like me to analyze employment trends in this market?");
    suggestions.push("Should I look at comparable markets for investment opportunities?");
    suggestions.push("Would you like to see regulatory or zoning information for this area?");
  }
  
  // Tool-specific follow-ups
  if (toolsUsed.includes('search_properties')) {
    suggestions.push("Would you like me to get detailed financial analysis for any of these properties?");
    suggestions.push("Should I check the regulatory requirements for these locations?");
  }
  
  if (toolsUsed.includes('analyze_demographics')) {
    suggestions.push("Would you like me to search for properties that match these demographics?");
    suggestions.push("Should I analyze risk factors based on this demographic data?");
  }
  
  return suggestions.slice(0, 3); // Return max 3 suggestions
}

function suggestToolsForMessage(message: string): Array<{ name: string; description: string; confidence: number }> {
  const suggestions: Array<{ name: string; description: string; confidence: number }> = [];
  
  // Property search patterns
  if (message.includes('search') && (message.includes('property') || message.includes('properties'))) {
    suggestions.push({
      name: 'search_properties',
      description: 'Search for properties matching your criteria',
      confidence: 0.9
    });
  }
  
  // Demographics patterns
  if (message.includes('demographic') || message.includes('population') || message.includes('income')) {
    suggestions.push({
      name: 'analyze_demographics',
      description: 'Get demographic and economic data for the area',
      confidence: 0.85
    });
  }
  
  // Financial calculation patterns
  if (message.includes('irr') || message.includes('cap rate') || message.includes('calculate') || message.includes('financial')) {
    suggestions.push({
      name: 'calculate_financial_metrics',
      description: 'Calculate investment returns and financial metrics',
      confidence: 0.8
    });
  }
  
  // Market data patterns
  if (message.includes('market') || message.includes('trends') || message.includes('rent')) {
    suggestions.push({
      name: 'get_market_data',
      description: 'Get current market trends and rental data',
      confidence: 0.75
    });
  }
  
  // Comparables patterns
  if (message.includes('comparable') || message.includes('comps') || message.includes('similar')) {
    suggestions.push({
      name: 'search_comparables',
      description: 'Find comparable properties for analysis',
      confidence: 0.8
    });
  }
  
  return suggestions.sort((a, b) => b.confidence - a.confidence);
}

export default router;