import { Router } from 'express';
import { z } from 'zod';
import OpenAI from 'openai';

const router = Router();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Recommendation request schema
const recommendationSchema = z.object({
  context: z.object({
    userProfile: z.object({
      role: z.string().optional(),
      experience: z.string().optional(),
      preferences: z.record(z.any()).optional()
    }).optional(),
    currentTask: z.string().optional(),
    conversationHistory: z.array(z.any()).optional(),
    portfolioData: z.object({
      sites: z.array(z.any()).optional(),
      performance: z.record(z.any()).optional()
    }).optional(),
    marketConditions: z.record(z.any()).optional()
  }),
  recommendationType: z.enum([
    'next-actions',
    'market-opportunities',
    'portfolio-optimization',
    'financial-strategies',
    'risk-mitigation',
    'comprehensive'
  ]).default('next-actions'),
  urgency: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  includeRationale: z.boolean().default(true)
});

// Smart next action recommendations
router.post('/next-actions', async (req, res) => {
  try {
    const { context, urgency, includeRationale } = recommendationSchema.parse(req.body);
    
    // Get real Company portfolio data
    const portfolioContext = await fetchPortfolioContext();
    const marketContext = await fetchMarketContext();
    
    // Generate AI-powered recommendations
    const prompt = `As the Company Site Intelligence AI, analyze the current context and provide specific next action recommendations:

Context:
- Current Task: ${context.currentTask || 'General portfolio management'}
- Portfolio: ${portfolioContext.sitesCount} sites, ${portfolioContext.totalUnits} units
- Market Conditions: ${marketContext.confidence}% confidence, ${marketContext.currentData?.sunbeltMarkets?.growth}% growth
- Urgency Level: ${urgency}

Provide JSON response with actionable recommendations:
{
  "immediateActions": [
    {
      "action": "specific action description",
      "priority": "high|medium|low",
      "timeframe": "immediate|today|this_week|this_month",
      "rationale": "why this action is important",
      "expectedImpact": "description of expected outcome"
    }
  ],
  "strategicActions": [
    {
      "action": "strategic action description",
      "priority": "high|medium|low",
      "timeframe": "this_month|next_quarter|long_term",
      "rationale": "strategic reasoning",
      "expectedImpact": "long-term benefit description"
    }
  ],
  "riskConsiderations": ["risk1", "risk2"],
  "successMetrics": ["metric1", "metric2"]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.4
    });

    const recommendations = JSON.parse(response.choices[0].message.content || '{}');
    
    // Enhance with real Company data
    const enhancedRecommendations = await enhanceWithCompanyData(recommendations, portfolioContext, marketContext);
    
    res.json({
      success: true,
      recommendations: enhancedRecommendations,
      context: {
        portfolioSnapshot: portfolioContext,
        marketSnapshot: marketContext,
        analysisTime: new Date().toISOString()
      },
      confidence: calculateRecommendationConfidence(recommendations, context),
      implementationGuide: generateImplementationGuide(enhancedRecommendations)
    });

  } catch (error) {
    console.error('Next actions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate next action recommendations'
    });
  }
});

// Market opportunity identification
router.post('/market-opportunities', async (req, res) => {
  try {
    const { context } = recommendationSchema.parse(req.body);
    
    const marketData = await fetchMarketContext();
    
    // Identify opportunities based on real market data
    const opportunities = await identifyMarketOpportunities(marketData, context);
    
    // Generate AI insights for each opportunity
    const enhancedOpportunities = await Promise.all(
      opportunities.map(async (opp) => {
        const insight = await generateOpportunityInsight(opp, marketData);
        return { ...opp, aiInsight: insight };
      })
    );

    res.json({
      success: true,
      opportunities: enhancedOpportunities,
      marketContext: marketData,
      prioritization: prioritizeOpportunities(enhancedOpportunities),
      actionPlan: generateOpportunityActionPlan(enhancedOpportunities),
      riskAssessment: assessOpportunityRisks(enhancedOpportunities)
    });

  } catch (error) {
    console.error('Market opportunities error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to identify market opportunities'
    });
  }
});

// Portfolio optimization recommendations
router.post('/portfolio-optimization', async (req, res) => {
  try {
    const { context } = recommendationSchema.parse(req.body);
    
    const portfolioData = await fetchPortfolioContext();
    const marketData = await fetchMarketContext();
    
    // Analyze portfolio performance
    const optimizations = await analyzePortfolioOptimizations(portfolioData, marketData, context);
    
    res.json({
      success: true,
      optimizations,
      currentPerformance: portfolioData,
      improvementPotential: calculateImprovementPotential(optimizations),
      implementationRoadmap: generateOptimizationRoadmap(optimizations),
      expectedReturns: calculateExpectedReturns(optimizations, portfolioData)
    });

  } catch (error) {
    console.error('Portfolio optimization error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate portfolio optimization recommendations'
    });
  }
});

// Financial strategy recommendations
router.post('/financial-strategies', async (req, res) => {
  try {
    const { context } = recommendationSchema.parse(req.body);
    
    const marketData = await fetchMarketContext();
    const portfolioData = await fetchPortfolioContext();
    
    // Generate financial strategy recommendations
    const strategies = await generateFinancialStrategies(context, marketData, portfolioData);
    
    res.json({
      success: true,
      strategies,
      marketConditions: marketData,
      riskProfile: generateRiskProfile(strategies),
      capitalRequirements: calculateCapitalRequirements(strategies),
      returnProjections: generateReturnProjections(strategies),
      scenarioAnalysis: generateScenarioAnalysis(strategies)
    });

  } catch (error) {
    console.error('Financial strategies error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate financial strategy recommendations'
    });
  }
});

// Risk mitigation recommendations
router.post('/risk-mitigation', async (req, res) => {
  try {
    const { context } = recommendationSchema.parse(req.body);
    
    const portfolioData = await fetchPortfolioContext();
    const marketData = await fetchMarketContext();
    
    // Identify and analyze risks
    const risks = await identifyPortfolioRisks(portfolioData, marketData);
    const mitigations = await generateRiskMitigations(risks, context);
    
    res.json({
      success: true,
      riskAssessment: risks,
      mitigationStrategies: mitigations,
      priorityMatrix: createRiskPriorityMatrix(risks),
      contingencyPlans: generateContingencyPlans(risks),
      monitoringFramework: createRiskMonitoringFramework(risks)
    });

  } catch (error) {
    console.error('Risk mitigation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate risk mitigation recommendations'
    });
  }
});

// Comprehensive recommendation engine
router.post('/comprehensive', async (req, res) => {
  try {
    const { context, urgency } = recommendationSchema.parse(req.body);
    
    // Run all recommendation engines in parallel
    const [nextActions, opportunities, optimizations, strategies, risks] = await Promise.allSettled([
      generateNextActionsInternal(context, urgency),
      identifyMarketOpportunitiesInternal(context),
      analyzePortfolioOptimizationsInternal(context),
      generateFinancialStrategiesInternal(context),
      identifyPortfolioRisksInternal(context)
    ]);

    const comprehensiveRecommendations = {
      nextActions: nextActions.status === 'fulfilled' ? nextActions.value : null,
      opportunities: opportunities.status === 'fulfilled' ? opportunities.value : null,
      optimizations: optimizations.status === 'fulfilled' ? optimizations.value : null,
      strategies: strategies.status === 'fulfilled' ? strategies.value : null,
      risks: risks.status === 'fulfilled' ? risks.value : null
    };

    // Generate overall priority ranking
    const priorityRanking = generateOverallPriorities(comprehensiveRecommendations);
    
    // Create integrated action plan
    const integratedActionPlan = createIntegratedActionPlan(comprehensiveRecommendations);
    
    res.json({
      success: true,
      comprehensive: comprehensiveRecommendations,
      priorityRanking,
      integratedActionPlan,
      executionTimeline: generateExecutionTimeline(integratedActionPlan),
      successMetrics: defineSuccessMetrics(comprehensiveRecommendations),
      reviewSchedule: createReviewSchedule(integratedActionPlan)
    });

  } catch (error) {
    console.error('Comprehensive recommendations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate comprehensive recommendations'
    });
  }
});

// Helper functions

async function fetchPortfolioContext() {
  try {
    const response = await fetch('http://localhost:5000/api/sites');
    if (response.ok) {
      const sites = await response.json();
      return {
        sitesCount: sites.length,
        totalUnits: sites.reduce((sum: number, site: any) => sum + (site.totalUnits || 0), 0),
        avgCompanyScore: sites.reduce((sum: number, site: any) => sum + (site.companyScore || 0), 0) / sites.length,
        sites: sites.slice(0, 5) // Sample sites for context
      };
    }
  } catch (error) {
    console.warn('Could not fetch portfolio context:', error);
  }
  
  return { sitesCount: 0, totalUnits: 0, avgCompanyScore: 0, sites: [] };
}

async function fetchMarketContext() {
  try {
    const response = await fetch('http://localhost:5000/api/brand-agent/market-analysis');
    if (response.ok) {
      const marketData = await response.json();
      return {
        currentData: marketData,
        confidence: marketData.confidence || 90,
        lastUpdated: new Date().toISOString()
      };
    }
  } catch (error) {
    console.warn('Could not fetch market context:', error);
  }
  
  return { currentData: null, confidence: 0, lastUpdated: new Date().toISOString() };
}

async function enhanceWithCompanyData(recommendations: any, portfolioContext: any, marketContext: any) {
  // Add Company-specific context to recommendations
  if (recommendations.immediateActions) {
    recommendations.immediateActions.forEach((action: any) => {
      if (action.action.toLowerCase().includes('market')) {
        action.companyContext = `Current market growth: ${marketContext.currentData?.sunbeltMarkets?.growth}%`;
      }
      if (action.action.toLowerCase().includes('portfolio')) {
        action.companyContext = `Portfolio: ${portfolioContext.sitesCount} sites, avg score: ${portfolioContext.avgCompanyScore.toFixed(1)}`;
      }
    });
  }
  
  return recommendations;
}

function calculateRecommendationConfidence(recommendations: any, context: any): number {
  let confidence = 0.7; // Base confidence
  
  if (context.portfolioData?.sites?.length > 10) confidence += 0.1;
  if (context.marketConditions) confidence += 0.1;
  if (context.conversationHistory?.length > 5) confidence += 0.1;
  
  return Math.min(confidence, 0.95);
}

function generateImplementationGuide(recommendations: any) {
  return {
    immediate: recommendations.immediateActions?.filter((a: any) => a.timeframe === 'immediate') || [],
    shortTerm: recommendations.immediateActions?.filter((a: any) => a.timeframe === 'today' || a.timeframe === 'this_week') || [],
    longTerm: recommendations.strategicActions || []
  };
}

async function identifyMarketOpportunities(marketData: any, context: any) {
  const opportunities = [];
  
  if (marketData.currentData?.sunbeltMarkets?.growth > 10) {
    opportunities.push({
      type: 'market-expansion',
      title: 'Sunbelt Market Growth Acceleration',
      description: `Strong ${marketData.currentData.sunbeltMarkets.growth}% YoY growth in target markets`,
      priority: 'high',
      potential: 'high',
      timeframe: 'immediate'
    });
  }
  
  if (marketData.currentData?.multifamilyDevelopment?.avgIrr > 18) {
    opportunities.push({
      type: 'development-opportunity',
      title: 'Above-Target IRR Environment',
      description: `Current market IRR at ${marketData.currentData.multifamilyDevelopment.avgIrr}%`,
      priority: 'high',
      potential: 'high',
      timeframe: 'this_quarter'
    });
  }
  
  opportunities.push({
    type: 'demographic-shift',
    title: 'Millennial-Gen Z Market Demand',
    description: 'Strong demographic trends supporting multifamily demand',
    priority: 'medium',
    potential: 'medium',
    timeframe: 'ongoing'
  });
  
  return opportunities;
}

async function generateOpportunityInsight(opportunity: any, marketData: any) {
  const prompt = `Provide strategic insights for this Company Development opportunity:

Opportunity: ${opportunity.title}
Description: ${opportunity.description}
Market Context: ${JSON.stringify(marketData.currentData, null, 2)}

Provide specific actionable insights and implementation strategies.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6,
      max_tokens: 300
    });

    return response.choices[0].message.content || 'Insight generation unavailable';
  } catch (error) {
    return 'Strategic opportunity with high potential for Company portfolio expansion';
  }
}

function prioritizeOpportunities(opportunities: any[]) {
  return opportunities
    .sort((a, b) => {
      const priorityScore = { high: 3, medium: 2, low: 1 };
      const potentialScore = { high: 3, medium: 2, low: 1 };
      
      const scoreA = (priorityScore[a.priority as keyof typeof priorityScore] || 1) + 
                     (potentialScore[a.potential as keyof typeof potentialScore] || 1);
      const scoreB = (priorityScore[b.priority as keyof typeof priorityScore] || 1) + 
                     (potentialScore[b.potential as keyof typeof potentialScore] || 1);
      
      return scoreB - scoreA;
    })
    .map((opp, index) => ({ ...opp, rank: index + 1 }));
}

function generateOpportunityActionPlan(opportunities: any[]) {
  return {
    immediate: opportunities.filter(opp => opp.timeframe === 'immediate'),
    shortTerm: opportunities.filter(opp => opp.timeframe === 'this_quarter'),
    longTerm: opportunities.filter(opp => opp.timeframe === 'ongoing'),
    resourceRequirements: 'Analysis and due diligence resources',
    successCriteria: 'Market entry completion and performance targets'
  };
}

function assessOpportunityRisks(opportunities: any[]) {
  return opportunities.map(opp => ({
    opportunity: opp.title,
    risks: ['Market volatility', 'Competition', 'Regulatory changes'],
    mitigation: 'Thorough due diligence and phased approach',
    riskLevel: opp.priority === 'high' ? 'medium' : 'low'
  }));
}

async function analyzePortfolioOptimizations(portfolioData: any, marketData: any, context: any) {
  const optimizations = [];
  
  if (portfolioData.avgCompanyScore < 75) {
    optimizations.push({
      type: 'scoring-improvement',
      title: 'Company Score Enhancement',
      description: `Current average score of ${portfolioData.avgCompanyScore.toFixed(1)} indicates optimization potential`,
      impact: 'high',
      effort: 'medium',
      timeframe: '6-12 months'
    });
  }
  
  if (portfolioData.sitesCount > 30) {
    optimizations.push({
      type: 'portfolio-consolidation',
      title: 'Portfolio Optimization',
      description: 'Large portfolio size presents consolidation opportunities',
      impact: 'medium',
      effort: 'high',
      timeframe: '12-18 months'
    });
  }
  
  optimizations.push({
    type: 'market-alignment',
    title: 'Market Strategy Alignment',
    description: 'Align portfolio strategy with current market conditions',
    impact: 'high',
    effort: 'low',
    timeframe: '3-6 months'
  });
  
  return optimizations;
}

function calculateImprovementPotential(optimizations: any[]) {
  const highImpactCount = optimizations.filter(opt => opt.impact === 'high').length;
  const mediumImpactCount = optimizations.filter(opt => opt.impact === 'medium').length;
  
  return {
    portfolioValue: `+${(highImpactCount * 15 + mediumImpactCount * 8)}%`,
    operationalEfficiency: `+${(highImpactCount * 20 + mediumImpactCount * 12)}%`,
    riskReduction: `+${(highImpactCount * 10 + mediumImpactCount * 6)}%`
  };
}

function generateOptimizationRoadmap(optimizations: any[]) {
  return {
    phase1: optimizations.filter(opt => opt.timeframe === '3-6 months'),
    phase2: optimizations.filter(opt => opt.timeframe === '6-12 months'),
    phase3: optimizations.filter(opt => opt.timeframe === '12-18 months'),
    dependencies: 'Market analysis completion and resource allocation',
    milestones: ['Assessment complete', 'Implementation started', 'Results measured']
  };
}

function calculateExpectedReturns(optimizations: any[], portfolioData: any) {
  const baseValue = portfolioData.sitesCount * 1000000; // Simplified calculation
  const improvementFactor = optimizations.length * 0.05; // 5% per optimization
  
  return {
    currentValue: baseValue,
    projectedValue: baseValue * (1 + improvementFactor),
    improvementAmount: baseValue * improvementFactor,
    roi: `${(improvementFactor * 100).toFixed(1)}%`
  };
}

async function generateFinancialStrategies(context: any, marketData: any, portfolioData: any) {
  const strategies = [];
  
  if (marketData.currentData?.multifamilyDevelopment?.avgIrr > 18) {
    strategies.push({
      type: 'accelerated-development',
      title: 'Accelerated Development Strategy',
      description: 'Capitalize on high IRR environment with increased development pace',
      capitalRequired: '$50-100M',
      expectedReturn: '20-25% IRR',
      riskLevel: 'medium',
      timeframe: '18-24 months'
    });
  }
  
  strategies.push({
    type: 'portfolio-refinancing',
    title: 'Portfolio Refinancing Strategy',
    description: 'Optimize capital structure across existing portfolio',
    capitalRequired: '$20-40M',
    expectedReturn: '15-20% IRR improvement',
    riskLevel: 'low',
    timeframe: '6-12 months'
  });
  
  strategies.push({
    type: 'market-expansion',
    title: 'Geographic Market Expansion',
    description: 'Enter new high-growth Sunbelt markets',
    capitalRequired: '$75-150M',
    expectedReturn: '18-22% IRR',
    riskLevel: 'medium-high',
    timeframe: '24-36 months'
  });
  
  return strategies;
}

function generateRiskProfile(strategies: any[]) {
  const riskLevels = strategies.map(s => s.riskLevel);
  const overallRisk = riskLevels.includes('high') ? 'medium-high' : 
                     riskLevels.includes('medium-high') ? 'medium' : 'low-medium';
  
  return {
    overall: overallRisk,
    factors: ['Market volatility', 'Interest rate changes', 'Competition', 'Regulatory risk'],
    mitigation: 'Diversification and phased implementation',
    monitoring: 'Monthly risk assessment and quarterly strategy review'
  };
}

function calculateCapitalRequirements(strategies: any[]) {
  const totalCapital = strategies.reduce((sum, strategy) => {
    const amount = parseInt(strategy.capitalRequired.replace(/[^0-9]/g, '')) * 1000000;
    return sum + amount;
  }, 0);
  
  return {
    totalRequired: totalCapital,
    byStrategy: strategies.map(s => ({
      strategy: s.title,
      amount: s.capitalRequired
    })),
    sources: ['Institutional equity', 'Debt financing', 'Joint ventures'],
    timing: 'Staged deployment over 12-24 months'
  };
}

function generateReturnProjections(strategies: any[]) {
  return {
    conservative: '15-18% IRR',
    base: '18-22% IRR',
    optimistic: '22-26% IRR',
    cashOnCash: '8-12%',
    totalReturn: '25-35%',
    paybackPeriod: '4-6 years'
  };
}

function generateScenarioAnalysis(strategies: any[]) {
  return {
    bullCase: {
      assumptions: 'Strong market growth, favorable rates',
      returns: '22-26% IRR',
      probability: '30%'
    },
    baseCase: {
      assumptions: 'Moderate growth, stable conditions',
      returns: '18-22% IRR',
      probability: '50%'
    },
    bearCase: {
      assumptions: 'Market slowdown, higher rates',
      returns: '12-16% IRR',
      probability: '20%'
    }
  };
}

async function identifyPortfolioRisks(portfolioData: any, marketData: any) {
  return [
    {
      type: 'market-risk',
      title: 'Market Cyclicality',
      description: 'Exposure to real estate market cycles',
      probability: 'medium',
      impact: 'high',
      currentLevel: 'medium'
    },
    {
      type: 'interest-rate-risk',
      title: 'Interest Rate Sensitivity',
      description: 'Portfolio sensitivity to rate changes',
      probability: 'high',
      impact: 'medium',
      currentLevel: 'medium-high'
    },
    {
      type: 'concentration-risk',
      title: 'Geographic Concentration',
      description: 'Concentration in Sunbelt markets',
      probability: 'low',
      impact: 'medium',
      currentLevel: 'low'
    }
  ];
}

async function generateRiskMitigations(risks: any[], context: any) {
  return risks.map(risk => ({
    risk: risk.title,
    mitigations: [
      'Implement hedging strategies',
      'Diversify across markets and asset types',
      'Maintain strong liquidity reserves',
      'Regular stress testing and scenario planning'
    ],
    timeline: '3-6 months implementation',
    cost: 'Low-medium',
    effectiveness: 'High'
  }));
}

function createRiskPriorityMatrix(risks: any[]) {
  return risks.map(risk => ({
    risk: risk.title,
    priority: risk.probability === 'high' && risk.impact === 'high' ? 'critical' :
              risk.probability === 'high' || risk.impact === 'high' ? 'high' : 'medium',
    immediateAction: risk.probability === 'high' && risk.impact === 'high'
  }));
}

function generateContingencyPlans(risks: any[]) {
  return risks.map(risk => ({
    risk: risk.title,
    triggers: ['Market downturn indicators', 'Rate increase signals', 'Portfolio performance decline'],
    responses: ['Reduce leverage', 'Accelerate asset sales', 'Implement cost reduction'],
    timeline: 'Immediate to 30 days',
    resources: 'Management team and external advisors'
  }));
}

function createRiskMonitoringFramework(risks: any[]) {
  return {
    metrics: ['Portfolio NOI', 'Occupancy rates', 'Market cap rates', 'Interest rate spreads'],
    frequency: 'Monthly reporting with quarterly deep dives',
    thresholds: 'Predefined alert levels for key metrics',
    reporting: 'Executive dashboard with exception reporting',
    review: 'Quarterly risk committee meetings'
  };
}

// Internal helper functions for comprehensive recommendations
async function generateNextActionsInternal(context: any, urgency: string) {
  return {
    immediateActions: [
      {
        action: 'Review Q4 portfolio performance metrics',
        priority: 'high',
        timeframe: 'today',
        rationale: 'End-of-year performance assessment critical for planning',
        expectedImpact: 'Informed decision making for 2025 strategy'
      }
    ],
    strategicActions: [
      {
        action: 'Develop 2025 market expansion strategy',
        priority: 'high',
        timeframe: 'this_month',
        rationale: 'Strong market conditions favor expansion',
        expectedImpact: 'Portfolio growth and diversification'
      }
    ]
  };
}

async function identifyMarketOpportunitiesInternal(context: any) {
  return await identifyMarketOpportunities(await fetchMarketContext(), context);
}

async function analyzePortfolioOptimizationsInternal(context: any) {
  return await analyzePortfolioOptimizations(
    await fetchPortfolioContext(),
    await fetchMarketContext(),
    context
  );
}

async function generateFinancialStrategiesInternal(context: any) {
  return await generateFinancialStrategies(
    context,
    await fetchMarketContext(),
    await fetchPortfolioContext()
  );
}

async function identifyPortfolioRisksInternal(context: any) {
  return await identifyPortfolioRisks(
    await fetchPortfolioContext(),
    await fetchMarketContext()
  );
}

function generateOverallPriorities(recommendations: any) {
  const priorities = [];
  
  if (recommendations.nextActions?.immediateActions) {
    priorities.push(...recommendations.nextActions.immediateActions.map((a: any) => ({
      ...a,
      category: 'immediate-action'
    })));
  }
  
  if (recommendations.opportunities) {
    priorities.push(...recommendations.opportunities.slice(0, 3).map((o: any) => ({
      ...o,
      category: 'opportunity'
    })));
  }
  
  return priorities.sort((a, b) => {
    const priorityScore = { high: 3, medium: 2, low: 1 };
    return (priorityScore[b.priority as keyof typeof priorityScore] || 1) - 
           (priorityScore[a.priority as keyof typeof priorityScore] || 1);
  });
}

function createIntegratedActionPlan(recommendations: any) {
  return {
    week1: recommendations.nextActions?.immediateActions || [],
    month1: recommendations.opportunities?.filter((o: any) => o.timeframe === 'immediate') || [],
    quarter1: recommendations.strategies?.filter((s: any) => s.timeframe.includes('6-12')) || [],
    ongoing: recommendations.risks?.map((r: any) => ({ action: `Monitor ${r.title}`, category: 'risk-management' })) || []
  };
}

function generateExecutionTimeline(actionPlan: any) {
  return {
    immediate: actionPlan.week1.length,
    shortTerm: actionPlan.month1.length,
    mediumTerm: actionPlan.quarter1.length,
    ongoing: actionPlan.ongoing.length,
    totalInitiatives: Object.values(actionPlan).reduce((sum: number, items: any) => sum + items.length, 0)
  };
}

function defineSuccessMetrics(recommendations: any) {
  return {
    financial: ['Portfolio IRR > 20%', 'NOI growth > 10%', 'Occupancy > 95%'],
    operational: ['Company scores > 80', 'Project completion on time', 'Cost efficiency gains'],
    strategic: ['Market expansion targets met', 'Risk mitigation implemented', 'Portfolio optimization achieved']
  };
}

function createReviewSchedule(actionPlan: any) {
  return {
    weekly: 'Immediate action progress review',
    monthly: 'Strategic initiative status and market update',
    quarterly: 'Comprehensive performance and strategy review',
    annually: 'Full portfolio assessment and strategy refresh'
  };
}

export default router;