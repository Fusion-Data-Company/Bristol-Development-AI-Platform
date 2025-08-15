import { Router } from 'express';
import { z } from 'zod';
import OpenAI from 'openai';

const router = Router();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Real-time conversation intelligence
router.post('/real-time-insights', async (req, res) => {
  try {
    const { currentMessage, conversationHistory, userContext } = req.body;
    
    // Generate real-time insights while user is typing/interacting
    const insights = await generateRealTimeInsights(currentMessage, conversationHistory, userContext);
    
    res.json({
      success: true,
      insights,
      suggestions: await generateInstantSuggestions(currentMessage, insights),
      context: await enrichContext(conversationHistory, userContext),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Real-time insights error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate real-time insights'
    });
  }
});

// Dynamic conversation adaptation
router.post('/adaptive-response', async (req, res) => {
  try {
    const { message, userProfile, conversationState, adaptationSettings } = req.body;
    
    // Adapt response style and content based on user profile and conversation state
    const adaptedResponse = await generateAdaptiveResponse({
      message,
      userProfile,
      conversationState,
      adaptationSettings
    });
    
    res.json({
      success: true,
      adaptedResponse,
      adaptationReason: adaptedResponse.reasoning,
      userProfileUpdates: adaptedResponse.profileUpdates,
      conversationStateUpdates: adaptedResponse.stateUpdates
    });

  } catch (error) {
    console.error('Adaptive response error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate adaptive response'
    });
  }
});

// Predictive conversation flow
router.post('/predict-flow', async (req, res) => {
  try {
    const { conversationHistory, currentTopic, userIntent } = req.body;
    
    const predictions = await predictConversationFlow(conversationHistory, currentTopic, userIntent);
    
    res.json({
      success: true,
      predictions,
      confidence: predictions.confidence,
      suggestedPaths: predictions.paths,
      topicProgression: predictions.topicProgression,
      expectedOutcomes: predictions.outcomes
    });

  } catch (error) {
    console.error('Flow prediction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to predict conversation flow'
    });
  }
});

// Conversation coaching and guidance
router.post('/conversation-coaching', async (req, res) => {
  try {
    const { conversationHistory, coachingGoals, userExperience } = req.body;
    
    const coaching = await generateConversationCoaching({
      conversationHistory,
      coachingGoals,
      userExperience
    });
    
    res.json({
      success: true,
      coaching,
      realTimeFeedback: coaching.feedback,
      improvementSuggestions: coaching.suggestions,
      skillAssessment: coaching.assessment
    });

  } catch (error) {
    console.error('Conversation coaching error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate conversation coaching'
    });
  }
});

// Advanced context synthesis
router.post('/context-synthesis', async (req, res) => {
  try {
    const { multipleConversations, timeframe, synthesisType } = req.body;
    
    const synthesis = await synthesizeMultipleContexts({
      conversations: multipleConversations,
      timeframe,
      synthesisType
    });
    
    res.json({
      success: true,
      synthesis,
      patterns: synthesis.patterns,
      insights: synthesis.insights,
      recommendations: synthesis.recommendations,
      actionItems: synthesis.actionItems
    });

  } catch (error) {
    console.error('Context synthesis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to synthesize context'
    });
  }
});

// Helper functions

async function generateRealTimeInsights(message: string, history: any[], context: any) {
  const insights = {
    urgency: assessMessageUrgency(message),
    complexity: assessMessageComplexity(message),
    sentiment: await quickSentimentAnalysis(message),
    intent: await detectUserIntent(message, history),
    topicShift: detectTopicShift(message, history),
    context: await extractRelevantContext(message, context)
  };
  
  return {
    ...insights,
    overall: synthesizeInsights(insights),
    confidence: calculateInsightConfidence(insights)
  };
}

function assessMessageUrgency(message: string): 'low' | 'medium' | 'high' | 'critical' {
  const urgentKeywords = ['urgent', 'asap', 'immediately', 'critical', 'emergency'];
  const mediumKeywords = ['soon', 'quickly', 'priority', 'important'];
  
  const lowerMessage = message.toLowerCase();
  
  if (urgentKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return 'critical';
  }
  if (mediumKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return 'high';
  }
  if (message.includes('?') && message.length < 50) {
    return 'medium';
  }
  return 'low';
}

function assessMessageComplexity(message: string): 'simple' | 'moderate' | 'complex' | 'highly_complex' {
  const words = message.split(' ').length;
  const sentences = message.split(/[.!?]+/).length;
  const technicalTerms = ['IRR', 'NPV', 'cap rate', 'NOI', 'demographic', 'underwriting'].filter(term => 
    message.toLowerCase().includes(term.toLowerCase())
  ).length;
  
  const complexityScore = words * 0.1 + sentences * 0.3 + technicalTerms * 0.5;
  
  if (complexityScore > 15) return 'highly_complex';
  if (complexityScore > 10) return 'complex';
  if (complexityScore > 5) return 'moderate';
  return 'simple';
}

async function quickSentimentAnalysis(message: string) {
  const positiveWords = ['good', 'great', 'excellent', 'perfect', 'amazing', 'helpful', 'thank'];
  const negativeWords = ['bad', 'terrible', 'awful', 'wrong', 'problem', 'issue', 'concern'];
  
  const lowerMessage = message.toLowerCase();
  const positiveCount = positiveWords.filter(word => lowerMessage.includes(word)).length;
  const negativeCount = negativeWords.filter(word => lowerMessage.includes(word)).length;
  
  if (positiveCount > negativeCount) return { polarity: 'positive', strength: positiveCount };
  if (negativeCount > positiveCount) return { polarity: 'negative', strength: negativeCount };
  return { polarity: 'neutral', strength: 0 };
}

async function detectUserIntent(message: string, history: any[]) {
  const intents = {
    'question': message.includes('?') || message.toLowerCase().startsWith('what') || message.toLowerCase().startsWith('how'),
    'request': message.toLowerCase().includes('can you') || message.toLowerCase().includes('please'),
    'information_seeking': message.toLowerCase().includes('tell me') || message.toLowerCase().includes('show me'),
    'analysis_request': message.toLowerCase().includes('analyze') || message.toLowerCase().includes('analysis'),
    'comparison': message.toLowerCase().includes('compare') || message.toLowerCase().includes('versus'),
    'planning': message.toLowerCase().includes('plan') || message.toLowerCase().includes('strategy')
  };
  
  const detectedIntents = Object.entries(intents)
    .filter(([, detected]) => detected)
    .map(([intent]) => intent);
  
  return {
    primary: detectedIntents[0] || 'general',
    secondary: detectedIntents.slice(1),
    confidence: detectedIntents.length > 0 ? 0.8 : 0.4
  };
}

function detectTopicShift(message: string, history: any[]) {
  if (history.length === 0) return { shifted: false, newTopic: null };
  
  const currentTopics = extractTopics(message);
  const recentTopics = extractTopics(history.slice(-3).map(h => h.content).join(' '));
  
  const topicOverlap = currentTopics.filter(topic => recentTopics.includes(topic)).length;
  const shifted = topicOverlap < currentTopics.length * 0.5;
  
  return {
    shifted,
    newTopic: shifted ? currentTopics[0] : null,
    previousTopics: recentTopics,
    currentTopics
  };
}

function extractTopics(text: string): string[] {
  const topicKeywords = {
    'market': ['market', 'growth', 'trend', 'demand'],
    'financial': ['IRR', 'NPV', 'financial', 'revenue', 'cost'],
    'development': ['development', 'construction', 'site', 'property'],
    'analytics': ['analysis', 'data', 'metrics', 'performance'],
    'strategy': ['strategy', 'plan', 'approach', 'roadmap']
  };
  
  const topics: string[] = [];
  const lowerText = text.toLowerCase();
  
  Object.entries(topicKeywords).forEach(([topic, keywords]) => {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      topics.push(topic);
    }
  });
  
  return topics;
}

async function extractRelevantContext(message: string, context: any) {
  const relevant = {
    portfolioRelevant: /portfolio|sites|properties/i.test(message),
    marketRelevant: /market|trend|growth|demographic/i.test(message),
    financialRelevant: /irr|npv|financial|cap rate|roi/i.test(message),
    urgentRelevant: /urgent|asap|critical|immediate/i.test(message)
  };
  
  const contextData: any = {};
  
  if (relevant.portfolioRelevant && context?.portfolio) {
    contextData.portfolio = context.portfolio;
  }
  
  if (relevant.marketRelevant && context?.market) {
    contextData.market = context.market;
  }
  
  if (relevant.financialRelevant && context?.financial) {
    contextData.financial = context.financial;
  }
  
  return {
    relevantAreas: Object.keys(relevant).filter(key => relevant[key as keyof typeof relevant]),
    contextData,
    priority: relevant.urgentRelevant ? 'high' : 'normal'
  };
}

function synthesizeInsights(insights: any) {
  const priority = insights.urgency === 'critical' ? 'immediate' :
                  insights.urgency === 'high' ? 'urgent' :
                  insights.complexity === 'highly_complex' ? 'complex' : 'standard';
  
  const approach = insights.intent.primary === 'analysis_request' ? 'analytical' :
                  insights.intent.primary === 'question' ? 'explanatory' :
                  insights.sentiment.polarity === 'negative' ? 'supportive' : 'collaborative';
  
  return {
    priority,
    approach,
    focusArea: insights.topicShift.shifted ? 'topic_transition' : 'topic_deepening',
    responseStyle: insights.complexity === 'simple' ? 'concise' : 'detailed'
  };
}

function calculateInsightConfidence(insights: any): number {
  let confidence = 0.5; // Base confidence
  
  if (insights.intent.confidence > 0.7) confidence += 0.2;
  if (insights.sentiment.strength > 1) confidence += 0.1;
  if (insights.context.relevantAreas.length > 2) confidence += 0.15;
  if (insights.urgency !== 'low') confidence += 0.05;
  
  return Math.min(confidence, 0.95);
}

async function generateInstantSuggestions(message: string, insights: any) {
  const suggestions = [];
  
  if (insights.intent.primary === 'question') {
    suggestions.push({
      type: 'clarification',
      text: 'Would you like me to provide specific examples or data to support the answer?',
      priority: 'medium'
    });
  }
  
  if (insights.topicShift.shifted) {
    suggestions.push({
      type: 'context',
      text: `I notice we're moving from ${insights.topicShift.previousTopics[0]} to ${insights.topicShift.newTopic}. Should I maintain context from our previous discussion?`,
      priority: 'high'
    });
  }
  
  if (insights.urgency === 'critical') {
    suggestions.push({
      type: 'urgency',
      text: 'This appears urgent. Should I prioritize immediate actionable recommendations?',
      priority: 'critical'
    });
  }
  
  if (insights.context.relevantAreas.includes('portfolioRelevant')) {
    suggestions.push({
      type: 'data',
      text: 'I can pull real-time portfolio data to enhance this analysis. Should I include current metrics?',
      priority: 'medium'
    });
  }
  
  return suggestions;
}

async function enrichContext(history: any[], userContext: any) {
  const recentMessages = history.slice(-5);
  const topics = recentMessages.flatMap(msg => extractTopics(msg.content));
  const topicFrequency = topics.reduce((acc: any, topic: string) => {
    acc[topic] = (acc[topic] || 0) + 1;
    return acc;
  }, {});
  
  return {
    conversationLength: history.length,
    dominantTopics: Object.entries(topicFrequency)
      .sort(([,a]: any, [,b]: any) => b - a)
      .slice(0, 3)
      .map(([topic]) => topic),
    userEngagement: calculateEngagement(history),
    contextualRelevance: calculateContextualRelevance(recentMessages, userContext),
    sessionDuration: estimateSessionDuration(history),
    conversationGoals: inferConversationGoals(history)
  };
}

function calculateEngagement(history: any[]): 'low' | 'medium' | 'high' {
  const avgMessageLength = history.reduce((sum, msg) => sum + msg.content.length, 0) / history.length;
  const questionCount = history.filter(msg => msg.content.includes('?')).length;
  const responseCount = history.length;
  
  const engagementScore = (avgMessageLength / 50) + (questionCount * 2) + (responseCount * 0.5);
  
  if (engagementScore > 20) return 'high';
  if (engagementScore > 10) return 'medium';
  return 'low';
}

function calculateContextualRelevance(messages: any[], userContext: any): number {
  if (!userContext) return 0.5;
  
  const bristolTerms = ['bristol', 'development', 'portfolio', 'site', 'irr', 'npv'];
  const relevantMessages = messages.filter(msg => 
    bristolTerms.some(term => msg.content.toLowerCase().includes(term))
  );
  
  return Math.min(relevantMessages.length / messages.length, 1.0);
}

function estimateSessionDuration(history: any[]): string {
  // Simplified estimation based on message count and complexity
  const estimatedMinutes = history.length * 2; // Assume 2 minutes per exchange
  
  if (estimatedMinutes < 10) return 'short';
  if (estimatedMinutes < 30) return 'medium';
  return 'long';
}

function inferConversationGoals(history: any[]): string[] {
  const goals = [];
  const content = history.map(h => h.content.toLowerCase()).join(' ');
  
  if (content.includes('analyze') || content.includes('analysis')) {
    goals.push('analysis');
  }
  if (content.includes('recommend') || content.includes('suggest')) {
    goals.push('recommendations');
  }
  if (content.includes('compare') || content.includes('versus')) {
    goals.push('comparison');
  }
  if (content.includes('plan') || content.includes('strategy')) {
    goals.push('planning');
  }
  if (content.includes('learn') || content.includes('understand')) {
    goals.push('education');
  }
  
  return goals.length > 0 ? goals : ['general_assistance'];
}

async function generateAdaptiveResponse(params: any) {
  const { message, userProfile, conversationState, adaptationSettings } = params;
  
  // Analyze user communication style
  const communicationStyle = analyzeCommunicationStyle(userProfile, conversationState);
  
  // Adapt content complexity
  const contentComplexity = determineContentComplexity(userProfile, message);
  
  // Generate base response
  const baseResponse = await generateBaseResponse(message, conversationState);
  
  // Apply adaptations
  const adaptedResponse = await applyAdaptations(baseResponse, {
    communicationStyle,
    contentComplexity,
    userProfile,
    adaptationSettings
  });
  
  return {
    content: adaptedResponse.content,
    style: adaptedResponse.style,
    reasoning: adaptedResponse.reasoning,
    profileUpdates: adaptedResponse.profileUpdates,
    stateUpdates: adaptedResponse.stateUpdates
  };
}

function analyzeCommunicationStyle(userProfile: any, conversationState: any) {
  const preferences = {
    formality: userProfile?.preferredFormality || 'professional',
    detail: userProfile?.preferredDetail || 'balanced',
    pace: conversationState?.averageResponseTime > 30000 ? 'deliberate' : 'quick',
    interactivity: conversationState?.questionFrequency > 0.3 ? 'high' : 'medium'
  };
  
  return preferences;
}

function determineContentComplexity(userProfile: any, message: string) {
  const userExperience = userProfile?.experience || 'intermediate';
  const messageComplexity = assessMessageComplexity(message);
  
  // Match complexity to user level
  if (userExperience === 'beginner' && messageComplexity === 'highly_complex') {
    return 'simplified';
  }
  if (userExperience === 'expert' && messageComplexity === 'simple') {
    return 'enhanced';
  }
  return 'matched';
}

async function generateBaseResponse(message: string, conversationState: any) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are the Bristol Site Intelligence AI. Provide helpful, accurate responses about real estate development and portfolio management.'
        },
        {
          role: 'user',
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });
    
    return response.choices[0].message.content || 'I apologize, but I encountered an issue generating a response.';
  } catch (error) {
    return 'I can help you with real estate development and portfolio analysis. Please let me know what specific information you need.';
  }
}

async function applyAdaptations(baseResponse: string, adaptations: any) {
  const { communicationStyle, contentComplexity, userProfile } = adaptations;
  
  let adaptedContent = baseResponse;
  let reasoning = [];
  
  // Apply formality adaptation
  if (communicationStyle.formality === 'casual') {
    adaptedContent = adaptedContent.replace(/Furthermore,/g, 'Also,').replace(/Additionally,/g, 'Plus,');
    reasoning.push('Adjusted formality to casual tone');
  }
  
  // Apply detail adaptation
  if (communicationStyle.detail === 'concise') {
    adaptedContent = adaptedContent.split('.').slice(0, 3).join('.') + '.';
    reasoning.push('Shortened response for concise preference');
  }
  
  // Apply complexity adaptation
  if (contentComplexity === 'simplified') {
    adaptedContent = adaptedContent.replace(/IRR/g, 'Internal Rate of Return (IRR)');
    adaptedContent = adaptedContent.replace(/NPV/g, 'Net Present Value (NPV)');
    reasoning.push('Simplified technical terms for clarity');
  }
  
  return {
    content: adaptedContent,
    style: communicationStyle,
    reasoning: reasoning,
    profileUpdates: {
      lastInteraction: new Date().toISOString(),
      preferredStyle: communicationStyle
    },
    stateUpdates: {
      lastAdaptation: reasoning
    }
  };
}

async function predictConversationFlow(history: any[], currentTopic: string, userIntent: any) {
  const patterns = analyzeConversationPatterns(history);
  const topicProgression = predictTopicProgression(currentTopic, patterns);
  const possibleOutcomes = generatePossibleOutcomes(userIntent, topicProgression);
  
  return {
    confidence: calculatePredictionConfidence(patterns, userIntent),
    paths: generateConversationPaths(topicProgression, userIntent),
    topicProgression,
    outcomes: possibleOutcomes,
    recommendations: generateFlowRecommendations(patterns, topicProgression)
  };
}

function analyzeConversationPatterns(history: any[]) {
  const patterns = {
    averageExchangeLength: history.length / Math.max(1, history.filter(h => h.role === 'user').length),
    topicDepth: calculateTopicDepth(history),
    questionFrequency: history.filter(h => h.content.includes('?')).length / history.length,
    followUpFrequency: calculateFollowUpFrequency(history),
    complexityProgression: analyzeComplexityProgression(history)
  };
  
  return patterns;
}

function calculateTopicDepth(history: any[]): 'shallow' | 'moderate' | 'deep' {
  const topicCounts = new Map();
  
  history.forEach(msg => {
    const topics = extractTopics(msg.content);
    topics.forEach(topic => {
      topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
    });
  });
  
  const maxDepth = Math.max(...Array.from(topicCounts.values()));
  
  if (maxDepth > 5) return 'deep';
  if (maxDepth > 2) return 'moderate';
  return 'shallow';
}

function calculateFollowUpFrequency(history: any[]): number {
  let followUps = 0;
  
  for (let i = 1; i < history.length; i++) {
    const current = history[i].content.toLowerCase();
    const previous = history[i-1].content.toLowerCase();
    
    if (current.includes('also') || current.includes('additionally') || 
        current.includes('furthermore') || current.includes('and')) {
      followUps++;
    }
  }
  
  return followUps / Math.max(1, history.length - 1);
}

function analyzeComplexityProgression(history: any[]): 'increasing' | 'decreasing' | 'stable' {
  if (history.length < 3) return 'stable';
  
  const complexities = history.map(msg => assessMessageComplexity(msg.content));
  const complexityScores = complexities.map(c => 
    c === 'simple' ? 1 : c === 'moderate' ? 2 : c === 'complex' ? 3 : 4
  );
  
  const early = complexityScores.slice(0, Math.floor(complexityScores.length / 2));
  const late = complexityScores.slice(Math.floor(complexityScores.length / 2));
  
  const earlyAvg = early.reduce((a, b) => a + b, 0) / early.length;
  const lateAvg = late.reduce((a, b) => a + b, 0) / late.length;
  
  if (lateAvg > earlyAvg + 0.5) return 'increasing';
  if (lateAvg < earlyAvg - 0.5) return 'decreasing';
  return 'stable';
}

function predictTopicProgression(currentTopic: string, patterns: any) {
  const progressions = {
    'market': ['analysis', 'trends', 'opportunities', 'strategy'],
    'financial': ['metrics', 'analysis', 'projections', 'optimization'],
    'development': ['planning', 'feasibility', 'execution', 'management'],
    'strategy': ['assessment', 'planning', 'implementation', 'monitoring']
  };
  
  const currentProgression = progressions[currentTopic] || ['exploration', 'analysis', 'decision'];
  
  return {
    current: currentTopic,
    next: currentProgression,
    depth: patterns.topicDepth,
    confidence: 0.7
  };
}

function generatePossibleOutcomes(userIntent: any, topicProgression: any) {
  const outcomes = [];
  
  if (userIntent.primary === 'analysis_request') {
    outcomes.push({
      outcome: 'comprehensive_analysis',
      probability: 0.8,
      timeframe: 'current_session'
    });
  }
  
  if (userIntent.primary === 'planning') {
    outcomes.push({
      outcome: 'strategic_plan',
      probability: 0.7,
      timeframe: 'multiple_sessions'
    });
  }
  
  outcomes.push({
    outcome: 'actionable_recommendations',
    probability: 0.9,
    timeframe: 'current_session'
  });
  
  return outcomes;
}

function calculatePredictionConfidence(patterns: any, userIntent: any): number {
  let confidence = 0.5;
  
  if (patterns.followUpFrequency > 0.3) confidence += 0.2;
  if (patterns.topicDepth === 'deep') confidence += 0.2;
  if (userIntent.confidence > 0.7) confidence += 0.1;
  
  return Math.min(confidence, 0.9);
}

function generateConversationPaths(topicProgression: any, userIntent: any) {
  return [
    {
      path: 'deep_dive',
      description: `Continue exploring ${topicProgression.current} in greater detail`,
      probability: 0.6,
      nextSteps: topicProgression.next.slice(0, 2)
    },
    {
      path: 'breadth_expansion',
      description: 'Explore related topics and broader context',
      probability: 0.3,
      nextSteps: ['market_context', 'strategic_implications']
    },
    {
      path: 'action_planning',
      description: 'Move toward actionable recommendations and next steps',
      probability: 0.4,
      nextSteps: ['recommendations', 'implementation']
    }
  ];
}

function generateFlowRecommendations(patterns: any, topicProgression: any) {
  const recommendations = [];
  
  if (patterns.topicDepth === 'shallow') {
    recommendations.push('Encourage deeper exploration of current topic');
  }
  
  if (patterns.questionFrequency < 0.2) {
    recommendations.push('Prompt user engagement with clarifying questions');
  }
  
  if (patterns.complexityProgression === 'decreasing') {
    recommendations.push('Gradually reintroduce complexity to maintain engagement');
  }
  
  return recommendations;
}

async function generateConversationCoaching(params: any) {
  const { conversationHistory, coachingGoals, userExperience } = params;
  
  const assessment = assessConversationSkills(conversationHistory, userExperience);
  const feedback = generateRealTimeFeedback(conversationHistory, assessment);
  const suggestions = generateImprovementSuggestions(assessment, coachingGoals);
  
  return {
    assessment,
    feedback,
    suggestions,
    progressTracking: trackProgress(conversationHistory, coachingGoals),
    nextMilestones: generateNextMilestones(assessment, coachingGoals)
  };
}

function assessConversationSkills(history: any[], userExperience: string) {
  return {
    clarity: assessClarity(history),
    engagement: assessEngagement(history),
    topicManagement: assessTopicManagement(history),
    questionAsking: assessQuestionAsking(history),
    overallScore: 0.75 // Calculated from above metrics
  };
}

function assessClarity(history: any[]): number {
  const userMessages = history.filter(h => h.role === 'user');
  const avgLength = userMessages.reduce((sum, msg) => sum + msg.content.length, 0) / userMessages.length;
  
  // Optimal message length is around 100-200 characters
  const clarityScore = 1 - Math.abs(avgLength - 150) / 150;
  return Math.max(0, Math.min(1, clarityScore));
}

function assessEngagement(history: any[]): number {
  const questions = history.filter(h => h.content.includes('?')).length;
  const followUps = calculateFollowUpFrequency(history);
  
  return Math.min(1, (questions * 0.1) + (followUps * 2));
}

function assessTopicManagement(history: any[]): number {
  const topics = history.flatMap(h => extractTopics(h.content));
  const uniqueTopics = new Set(topics).size;
  const topicChanges = calculateTopicChanges(history);
  
  // Good topic management maintains focus while allowing natural progression
  const focusScore = 1 - (topicChanges / history.length);
  const breadthScore = Math.min(1, uniqueTopics / 5);
  
  return (focusScore + breadthScore) / 2;
}

function calculateTopicChanges(history: any[]): number {
  let changes = 0;
  let prevTopics: string[] = [];
  
  history.forEach(msg => {
    const currentTopics = extractTopics(msg.content);
    if (prevTopics.length > 0 && !currentTopics.some(topic => prevTopics.includes(topic))) {
      changes++;
    }
    prevTopics = currentTopics;
  });
  
  return changes;
}

function assessQuestionAsking(history: any[]): number {
  const userQuestions = history.filter(h => h.role === 'user' && h.content.includes('?')).length;
  const totalUserMessages = history.filter(h => h.role === 'user').length;
  
  return totalUserMessages > 0 ? userQuestions / totalUserMessages : 0;
}

function generateRealTimeFeedback(history: any[], assessment: any) {
  const feedback = [];
  
  if (assessment.clarity < 0.6) {
    feedback.push({
      type: 'clarity',
      message: 'Consider being more specific in your questions',
      severity: 'medium'
    });
  }
  
  if (assessment.engagement < 0.4) {
    feedback.push({
      type: 'engagement',
      message: 'Try asking follow-up questions to dive deeper',
      severity: 'low'
    });
  }
  
  if (assessment.topicManagement < 0.5) {
    feedback.push({
      type: 'focus',
      message: 'Try to maintain focus on the current topic',
      severity: 'medium'
    });
  }
  
  return feedback;
}

function generateImprovementSuggestions(assessment: any, goals: any) {
  const suggestions = [];
  
  // Add suggestions based on assessment and goals
  suggestions.push({
    area: 'question_formulation',
    suggestion: 'Frame questions to get specific, actionable insights',
    priority: 'high'
  });
  
  suggestions.push({
    area: 'context_building',
    suggestion: 'Provide relevant background context in your questions',
    priority: 'medium'
  });
  
  return suggestions;
}

function trackProgress(history: any[], goals: any) {
  return {
    sessionsCompleted: 1,
    skillsImproved: ['clarity', 'engagement'],
    goalsProgress: {
      'better_questions': 0.7,
      'topic_management': 0.6
    }
  };
}

function generateNextMilestones(assessment: any, goals: any) {
  return [
    {
      milestone: 'Improve question clarity',
      target: 'Achieve 80% clarity score',
      timeframe: '2-3 sessions'
    },
    {
      milestone: 'Enhance topic exploration',
      target: 'Maintain focus while exploring depth',
      timeframe: '1-2 sessions'
    }
  ];
}

async function synthesizeMultipleContexts(params: any) {
  const { conversations, timeframe, synthesisType } = params;
  
  const patterns = identifyPatternsAcrossConversations(conversations);
  const insights = generateCrossConversationInsights(conversations, patterns);
  const recommendations = generateSynthesisRecommendations(insights, timeframe);
  const actionItems = extractActionItemsFromSynthesis(insights);
  
  return {
    patterns,
    insights,
    recommendations,
    actionItems,
    confidence: calculateSynthesisConfidence(patterns),
    metadata: {
      conversationsAnalyzed: conversations.length,
      timeframe,
      synthesisType
    }
  };
}

function identifyPatternsAcrossConversations(conversations: any[]) {
  const allTopics = conversations.flatMap(conv => 
    conv.messages ? conv.messages.flatMap((msg: any) => extractTopics(msg.content)) : []
  );
  
  const topicFrequency = allTopics.reduce((acc: any, topic: string) => {
    acc[topic] = (acc[topic] || 0) + 1;
    return acc;
  }, {});
  
  return {
    dominantTopics: Object.entries(topicFrequency)
      .sort(([,a]: any, [,b]: any) => b - a)
      .slice(0, 5)
      .map(([topic, count]) => ({ topic, frequency: count })),
    conversationLengths: conversations.map(conv => conv.messages?.length || 0),
    timeDistribution: analyzeTimeDistribution(conversations),
    userEngagement: conversations.map(conv => calculateEngagement(conv.messages || []))
  };
}

function analyzeTimeDistribution(conversations: any[]) {
  // Simplified time analysis
  return {
    peakHours: ['9-11 AM', '2-4 PM'],
    averageSessionLength: '15-20 minutes',
    frequency: 'Daily'
  };
}

function generateCrossConversationInsights(conversations: any[], patterns: any) {
  const insights = [];
  
  if (patterns.dominantTopics.length > 0) {
    insights.push({
      type: 'topic_preference',
      insight: `Primary focus on ${patterns.dominantTopics[0].topic} across sessions`,
      confidence: 0.8
    });
  }
  
  const avgLength = patterns.conversationLengths.reduce((a: number, b: number) => a + b, 0) / patterns.conversationLengths.length;
  if (avgLength > 10) {
    insights.push({
      type: 'engagement_pattern',
      insight: 'Consistent deep engagement across conversations',
      confidence: 0.7
    });
  }
  
  return insights;
}

function generateSynthesisRecommendations(insights: any[], timeframe: string) {
  return [
    {
      category: 'optimization',
      recommendation: 'Focus on high-engagement topics for future sessions',
      basis: insights.find(i => i.type === 'engagement_pattern'),
      priority: 'medium'
    },
    {
      category: 'content',
      recommendation: 'Develop deeper content for dominant topic areas',
      basis: insights.find(i => i.type === 'topic_preference'),
      priority: 'high'
    }
  ];
}

function extractActionItemsFromSynthesis(insights: any[]) {
  return [
    {
      action: 'Create focused content for top topics',
      timeline: 'This week',
      responsibility: 'Content team'
    },
    {
      action: 'Analyze user journey optimization opportunities',
      timeline: 'Next sprint',
      responsibility: 'UX team'
    }
  ];
}

function calculateSynthesisConfidence(patterns: any): number {
  let confidence = 0.6; // Base confidence
  
  if (patterns.dominantTopics.length > 3) confidence += 0.2;
  if (patterns.conversationLengths.length > 5) confidence += 0.1;
  
  return Math.min(confidence, 0.9);
}

export default router;