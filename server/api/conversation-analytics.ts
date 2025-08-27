import { Router } from 'express';
import { z } from 'zod';
import OpenAI from 'openai';

const router = Router();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Conversation analytics schema
const conversationAnalyticsSchema = z.object({
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
    timestamp: z.string().optional(),
    metadata: z.record(z.any()).optional()
  })),
  analysisType: z.enum(['sentiment', 'topics', 'insights', 'performance', 'comprehensive']).default('comprehensive'),
  timeframe: z.enum(['session', 'day', 'week', 'month']).default('session'),
  includeRecommendations: z.boolean().default(true)
});

// Real-time conversation sentiment analysis
router.post('/sentiment-analysis', async (req, res) => {
  try {
    const { conversationHistory } = conversationAnalyticsSchema.parse(req.body);
    
    if (!conversationHistory || conversationHistory.length === 0) {
      return res.json({
        success: true,
        sentiment: { overall: 'neutral', confidence: 0.5, trend: 'stable' },
        insights: ['No conversation data to analyze']
      });
    }

    // Analyze sentiment using OpenAI
    const sentimentPrompt = `Analyze the sentiment of this conversation and provide insights:
    
${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Provide a JSON response with:
{
  "overall": "positive|negative|neutral",
  "confidence": 0.0-1.0,
  "trend": "improving|declining|stable",
  "keyEmotions": ["emotion1", "emotion2"],
  "engagementLevel": "high|medium|low",
  "insights": ["insight1", "insight2"]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: sentimentPrompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3
    });

    const sentimentAnalysis = JSON.parse(response.choices[0].message.content || '{}');
    
    res.json({
      success: true,
      sentiment: sentimentAnalysis,
      analysisTime: new Date().toISOString(),
      messageCount: conversationHistory.length
    });

  } catch (error) {
    console.error('Sentiment analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze conversation sentiment'
    });
  }
});

// Topic extraction and trend analysis
router.post('/topic-analysis', async (req, res) => {
  try {
    const { conversationHistory } = conversationAnalyticsSchema.parse(req.body);
    
    const topicPrompt = `Extract key topics and themes from this real estate development conversation:
    
${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Provide a JSON response with:
{
  "primaryTopics": ["topic1", "topic2"],
  "secondaryTopics": ["topic3", "topic4"],
  "trends": [{"topic": "topic", "frequency": number, "importance": "high|medium|low"}],
  "suggestions": ["suggestion1", "suggestion2"]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: topicPrompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3
    });

    const topicAnalysis = JSON.parse(response.choices[0].message.content || '{}');
    
    // Add Company-specific topic categorization
    const bristolCategories = categorizeCompanyTopics(topicAnalysis.primaryTopics || []);
    
    res.json({
      success: true,
      topics: topicAnalysis,
      bristolCategories,
      analysisTime: new Date().toISOString(),
      recommendations: generateTopicRecommendations(topicAnalysis)
    });

  } catch (error) {
    console.error('Topic analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze conversation topics'
    });
  }
});

// Performance metrics and insights
router.post('/performance-metrics', async (req, res) => {
  try {
    const { conversationHistory, timeframe } = conversationAnalyticsSchema.parse(req.body);
    
    const metrics = calculateConversationMetrics(conversationHistory);
    const insights = await generatePerformanceInsights(conversationHistory, metrics);
    
    res.json({
      success: true,
      metrics: {
        ...metrics,
        timeframe,
        calculatedAt: new Date().toISOString()
      },
      insights,
      benchmarks: getCompanyBenchmarks(),
      recommendations: generatePerformanceRecommendations(metrics)
    });

  } catch (error) {
    console.error('Performance metrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate performance metrics'
    });
  }
});

// Comprehensive conversation insights
router.post('/comprehensive-insights', async (req, res) => {
  try {
    const { conversationHistory, includeRecommendations } = conversationAnalyticsSchema.parse(req.body);
    
    // Run parallel analysis
    const [sentimentResult, topicResult, metricsResult] = await Promise.allSettled([
      analyzeSentimentInternal(conversationHistory),
      analyzeTopicsInternal(conversationHistory),
      calculateConversationMetrics(conversationHistory)
    ]);

    const sentiment = sentimentResult.status === 'fulfilled' ? sentimentResult.value : null;
    const topics = topicResult.status === 'fulfilled' ? topicResult.value : null;
    const metrics = metricsResult.status === 'fulfilled' ? metricsResult.value : null;

    // Generate actionable insights
    const actionableInsights = await generateActionableInsights(
      conversationHistory,
      sentiment,
      topics,
      metrics
    );

    // Generate conversation summary
    const summary = await generateConversationSummary(conversationHistory);

    res.json({
      success: true,
      comprehensive: {
        sentiment,
        topics,
        metrics,
        actionableInsights,
        summary,
        recommendations: includeRecommendations ? 
          await generateComprehensiveRecommendations(sentiment, topics, metrics) : null
      },
      analysisTime: new Date().toISOString(),
      dataQuality: assessDataQuality(conversationHistory)
    });

  } catch (error) {
    console.error('Comprehensive insights error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate comprehensive insights'
    });
  }
});

// Conversation optimization suggestions
router.post('/optimization-suggestions', async (req, res) => {
  try {
    const { conversationHistory } = conversationAnalyticsSchema.parse(req.body);
    
    const optimizationPrompt = `Analyze this Company Development conversation and suggest optimizations:

${conversationHistory.slice(-10).map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Provide JSON with:
{
  "conversationFlow": "excellent|good|needs_improvement",
  "optimizations": [
    {
      "type": "clarity|engagement|efficiency|personalization",
      "suggestion": "specific suggestion",
      "priority": "high|medium|low",
      "impact": "description of expected impact"
    }
  ],
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: optimizationPrompt }],
      response_format: { type: 'json_object' },
      temperature: 0.4
    });

    const optimizations = JSON.parse(response.choices[0].message.content || '{}');
    
    res.json({
      success: true,
      optimizations,
      implementationGuide: generateImplementationGuide(optimizations),
      expectedImpact: calculateExpectedImpact(optimizations),
      nextSteps: generateOptimizationNextSteps(optimizations)
    });

  } catch (error) {
    console.error('Optimization suggestions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate optimization suggestions'
    });
  }
});

// Helper functions

function categorizeCompanyTopics(topics: string[]) {
  const categories = {
    'Market Analysis': topics.filter(t => 
      /market|trend|growth|demographic|economic/i.test(t)
    ),
    'Financial Modeling': topics.filter(t => 
      /irr|npv|cap rate|financial|roi|return/i.test(t)
    ),
    'Site Development': topics.filter(t => 
      /site|location|development|construction|zoning/i.test(t)
    ),
    'Portfolio Management': topics.filter(t => 
      /portfolio|properties|management|strategy/i.test(t)
    )
  };

  return Object.fromEntries(
    Object.entries(categories).filter(([, values]) => values.length > 0)
  );
}

function generateTopicRecommendations(topicAnalysis: any) {
  const recommendations = [];
  
  if (topicAnalysis.primaryTopics?.includes('market')) {
    recommendations.push('Consider scheduling a market deep-dive session');
  }
  if (topicAnalysis.primaryTopics?.includes('financial')) {
    recommendations.push('Review financial models with recent market data');
  }
  if (topicAnalysis.trends?.some((t: any) => t.importance === 'high')) {
    recommendations.push('Focus on high-importance topics in next conversation');
  }
  
  return recommendations;
}

function calculateConversationMetrics(history: any[]) {
  const userMessages = history.filter(msg => msg.role === 'user');
  const assistantMessages = history.filter(msg => msg.role === 'assistant');
  
  return {
    totalMessages: history.length,
    userMessages: userMessages.length,
    assistantMessages: assistantMessages.length,
    averageUserMessageLength: userMessages.reduce((acc, msg) => acc + msg.content.length, 0) / userMessages.length || 0,
    averageAssistantMessageLength: assistantMessages.reduce((acc, msg) => acc + msg.content.length, 0) / assistantMessages.length || 0,
    conversationDepth: history.length > 10 ? 'deep' : history.length > 5 ? 'moderate' : 'shallow',
    engagementScore: calculateEngagementScore(history),
    topicCoherence: calculateTopicCoherence(history)
  };
}

function calculateEngagementScore(history: any[]): number {
  let score = 0.5; // Base score
  
  // Longer conversations indicate higher engagement
  if (history.length > 10) score += 0.2;
  if (history.length > 20) score += 0.1;
  
  // Question asking indicates engagement
  const questions = history.filter(msg => msg.content.includes('?')).length;
  score += Math.min(questions * 0.05, 0.2);
  
  // Varied message lengths indicate thoughtful responses
  const lengths = history.map(msg => msg.content.length);
  const variance = lengths.reduce((acc, len) => acc + Math.pow(len - (lengths.reduce((a, b) => a + b, 0) / lengths.length), 2), 0) / lengths.length;
  if (variance > 1000) score += 0.1;
  
  return Math.min(score, 1.0);
}

function calculateTopicCoherence(history: any[]): number {
  // Simple coherence calculation based on keyword overlap
  const keywords = new Set<string>();
  history.forEach(msg => {
    const words = msg.content.toLowerCase().match(/\w+/g) || [];
    words.filter(word => word.length > 4).forEach(word => keywords.add(word));
  });
  
  return Math.min(keywords.size / 10, 1.0); // Normalized coherence score
}

async function generatePerformanceInsights(history: any[], metrics: any) {
  const insights = [];
  
  if (metrics.engagementScore > 0.8) {
    insights.push('High engagement detected - user is actively participating');
  } else if (metrics.engagementScore < 0.4) {
    insights.push('Low engagement - consider more interactive responses');
  }
  
  if (metrics.conversationDepth === 'deep') {
    insights.push('Deep conversation indicates complex topic exploration');
  }
  
  if (metrics.topicCoherence > 0.7) {
    insights.push('Strong topic coherence - conversation stays focused');
  }
  
  return insights;
}

function getCompanyBenchmarks() {
  return {
    averageConversationLength: 12,
    targetEngagementScore: 0.7,
    optimalMessageLength: 150,
    topicCoherenceTarget: 0.6
  };
}

function generatePerformanceRecommendations(metrics: any) {
  const recommendations = [];
  
  if (metrics.averageAssistantMessageLength > 300) {
    recommendations.push('Consider shorter, more digestible responses');
  }
  
  if (metrics.engagementScore < 0.6) {
    recommendations.push('Ask more engaging questions to increase interaction');
  }
  
  if (metrics.topicCoherence < 0.5) {
    recommendations.push('Focus on maintaining topic consistency');
  }
  
  return recommendations;
}

async function analyzeSentimentInternal(history: any[]) {
  try {
    const recentMessages = history.slice(-5);
    const positiveWords = ['good', 'great', 'excellent', 'perfect', 'amazing', 'helpful'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'useless', 'frustrated'];
    
    let sentimentScore = 0;
    recentMessages.forEach(msg => {
      const content = msg.content.toLowerCase();
      positiveWords.forEach(word => {
        if (content.includes(word)) sentimentScore += 1;
      });
      negativeWords.forEach(word => {
        if (content.includes(word)) sentimentScore -= 1;
      });
    });
    
    const normalizedScore = Math.max(-1, Math.min(1, sentimentScore / recentMessages.length));
    
    return {
      overall: normalizedScore > 0.2 ? 'positive' : normalizedScore < -0.2 ? 'negative' : 'neutral',
      score: normalizedScore,
      confidence: Math.abs(normalizedScore),
      trend: 'stable'
    };
  } catch (error) {
    return { overall: 'neutral', score: 0, confidence: 0.5, trend: 'stable' };
  }
}

async function analyzeTopicsInternal(history: any[]) {
  const topicKeywords = {
    'Market Analysis': ['market', 'analysis', 'trend', 'growth', 'demographic'],
    'Financial Modeling': ['irr', 'npv', 'financial', 'roi', 'cap rate'],
    'Site Development': ['site', 'development', 'construction', 'location'],
    'Portfolio Management': ['portfolio', 'properties', 'management']
  };
  
  const topicCounts: Record<string, number> = {};
  
  history.forEach(msg => {
    const content = msg.content.toLowerCase();
    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      const matches = keywords.filter(keyword => content.includes(keyword)).length;
      topicCounts[topic] = (topicCounts[topic] || 0) + matches;
    });
  });
  
  const sortedTopics = Object.entries(topicCounts)
    .sort(([,a], [,b]) => b - a)
    .map(([topic]) => topic);
  
  return {
    primaryTopics: sortedTopics.slice(0, 3),
    secondaryTopics: sortedTopics.slice(3),
    distribution: topicCounts
  };
}

async function generateActionableInsights(history: any[], sentiment: any, topics: any, metrics: any) {
  const insights = [];
  
  if (sentiment?.overall === 'positive' && metrics?.engagementScore > 0.7) {
    insights.push({
      type: 'opportunity',
      title: 'High-Value Conversation Detected',
      description: 'User is highly engaged with positive sentiment - ideal for deeper discussions',
      action: 'Introduce more complex topics or advanced features'
    });
  }
  
  if (topics?.primaryTopics?.includes('Financial Modeling')) {
    insights.push({
      type: 'tool-suggestion',
      title: 'Financial Tools Relevant',
      description: 'Conversation focused on financial analysis',
      action: 'Suggest using IRR calculator or financial modeling tools'
    });
  }
  
  if (metrics?.conversationDepth === 'shallow') {
    insights.push({
      type: 'engagement',
      title: 'Conversation Depth Enhancement',
      description: 'Short conversation - opportunity to dive deeper',
      action: 'Ask follow-up questions to explore topics more thoroughly'
    });
  }
  
  return insights;
}

async function generateConversationSummary(history: any[]) {
  const recentMessages = history.slice(-5);
  const topics = await analyzeTopicsInternal(history);
  
  return {
    messageCount: history.length,
    primaryFocus: topics.primaryTopics[0] || 'General Discussion',
    keyPoints: recentMessages
      .filter(msg => msg.role === 'user')
      .map(msg => msg.content.substring(0, 100) + (msg.content.length > 100 ? '...' : '')),
    duration: 'session', // Could be calculated from timestamps
    outcome: 'ongoing'
  };
}

async function generateComprehensiveRecommendations(sentiment: any, topics: any, metrics: any) {
  const recommendations = [];
  
  // Sentiment-based recommendations
  if (sentiment?.overall === 'negative') {
    recommendations.push({
      category: 'User Experience',
      priority: 'high',
      suggestion: 'Address user concerns and provide clearer explanations',
      rationale: 'Negative sentiment detected'
    });
  }
  
  // Topic-based recommendations
  if (topics?.primaryTopics?.length > 0) {
    recommendations.push({
      category: 'Content Focus',
      priority: 'medium',
      suggestion: `Continue exploring ${topics.primaryTopics[0]} with more detailed analysis`,
      rationale: 'Primary topic identified'
    });
  }
  
  // Metrics-based recommendations
  if (metrics?.engagementScore < 0.5) {
    recommendations.push({
      category: 'Engagement',
      priority: 'high',
      suggestion: 'Use more interactive elements and ask engaging questions',
      rationale: 'Low engagement score detected'
    });
  }
  
  return recommendations;
}

function generateImplementationGuide(optimizations: any) {
  return {
    immediate: optimizations.optimizations?.filter((opt: any) => opt.priority === 'high') || [],
    shortTerm: optimizations.optimizations?.filter((opt: any) => opt.priority === 'medium') || [],
    longTerm: optimizations.optimizations?.filter((opt: any) => opt.priority === 'low') || []
  };
}

function calculateExpectedImpact(optimizations: any) {
  const highImpactCount = optimizations.optimizations?.filter((opt: any) => opt.priority === 'high').length || 0;
  const mediumImpactCount = optimizations.optimizations?.filter((opt: any) => opt.priority === 'medium').length || 0;
  
  return {
    userSatisfaction: highImpactCount > 0 ? '+15-25%' : '+5-15%',
    engagementRate: mediumImpactCount > 1 ? '+20-30%' : '+10-20%',
    taskCompletion: '+10-20%'
  };
}

function generateOptimizationNextSteps(optimizations: any) {
  const steps = [];
  
  if (optimizations.optimizations?.some((opt: any) => opt.type === 'clarity')) {
    steps.push('Review response clarity and simplify complex explanations');
  }
  
  if (optimizations.optimizations?.some((opt: any) => opt.type === 'engagement')) {
    steps.push('Implement more interactive conversation elements');
  }
  
  if (optimizations.optimizations?.some((opt: any) => opt.type === 'personalization')) {
    steps.push('Enhance user context awareness and personalization');
  }
  
  return steps.length > 0 ? steps : ['Continue monitoring conversation quality'];
}

function assessDataQuality(history: any[]) {
  return {
    completeness: history.length > 5 ? 'high' : history.length > 2 ? 'medium' : 'low',
    recency: 'current', // Assuming real-time data
    relevance: history.some(msg => 
      /bristol|development|market|financial/i.test(msg.content)
    ) ? 'high' : 'medium'
  };
}

export default router;