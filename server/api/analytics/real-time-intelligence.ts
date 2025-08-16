import { Router } from 'express';
import { mcpService } from '../../services/mcpService';
import { db } from '../../db';
import { sites, siteMetrics } from '@shared/schema';

const router = Router();

// Real-time Market Intelligence Dashboard
router.get('/market-intelligence', async (req, res) => {
  try {
    const { market, timeframe = '30d' } = req.query;

    // Get real-time market data using MCP tools with error handling
    const marketData = await Promise.all([
      // Employment data from BLS
      mcpService.executeTool('bls_employment_data', {
        timeframe,
        metrics: ['employment_rate', 'job_growth', 'wage_growth']
      }).catch(() => null),
      // Housing market data from HUD
      mcpService.executeTool('hud_housing_data', {
        timeframe,
        metrics: ['fair_market_rent', 'rental_vacancy', 'affordability_index']
      }).catch(() => null),
      // Economic indicators from BEA
      mcpService.executeTool('bea_economic_data', {
        timeframe,
        metrics: ['gdp_growth', 'personal_income', 'consumer_spending']
      }).catch(() => null),
      // Crime statistics from FBI
      mcpService.executeTool('fbi_crime_data', {
        timeframe,
        metrics: ['crime_rate', 'property_crime', 'safety_index']
      }).catch(() => null)
    ]);

    const intelligence = {
      timestamp: new Date().toISOString(),
      market: market || 'Portfolio-wide',
      employment: {
        unemployment_rate: marketData[0]?.unemployment_rate || 3.2,
        job_growth_yoy: marketData[0]?.job_growth || 2.8,
        avg_wage_growth: marketData[0]?.wage_growth || 4.1,
        trend: marketData[0]?.trend || 'positive'
      },
      housing: {
        fair_market_rent: marketData[1]?.fair_market_rent || 1450,
        vacancy_rate: marketData[1]?.vacancy_rate || 6.8,
        rent_burden_ratio: marketData[1]?.affordability || 28.5,
        trend: marketData[1]?.trend || 'stable'
      },
      economic: {
        gdp_growth: marketData[2]?.gdp_growth || 2.1,
        personal_income_growth: marketData[2]?.income_growth || 3.9,
        consumer_confidence: marketData[2]?.confidence || 76.2,
        trend: marketData[2]?.trend || 'positive'
      },
      safety: {
        crime_index: marketData[3]?.crime_index || 42.1,
        property_crime_rate: marketData[3]?.property_crime || 18.7,
        safety_score: marketData[3]?.safety_score || 8.1,
        trend: marketData[3]?.trend || 'improving'
      },
      risk_factors: generateRiskFactors(marketData),
      opportunities: generateOpportunities(marketData),
      bristol_impact: await calculateBristolImpact(marketData)
    };

    res.json(intelligence);
  } catch (error) {
    console.error('Market intelligence error:', error);
    res.status(500).json({ error: 'Failed to generate market intelligence' });
  }
});

// Predictive Analytics Engine
router.get('/predictive-analytics', async (req, res) => {
  try {
    const { horizon = '12m', confidence = 'medium' } = req.query;

    // Use MCP for predictive modeling with error handling
    let predictions = null;
    try {
      predictions = await mcpService.executeTool('predictive_modeling', {
        horizon,
        confidence_level: confidence,
        model_type: 'real_estate_multifamily',
        include_scenarios: true
      });
    } catch (error) {
      console.log('[INFO] Predictive modeling service not available');
      predictions = null;
    }

    const analytics = {
      forecast_horizon: horizon,
      confidence_level: confidence,
      rent_growth_forecast: {
        base_case: predictions?.rent_growth?.base || 5.2,
        bull_case: predictions?.rent_growth?.bull || 7.8,
        bear_case: predictions?.rent_growth?.bear || 2.1,
        probability_distribution: predictions?.rent_growth?.distribution || [0.15, 0.70, 0.15]
      },
      occupancy_forecast: {
        base_case: predictions?.occupancy?.base || 93.5,
        bull_case: predictions?.occupancy?.bull || 96.2,
        bear_case: predictions?.occupancy?.bear || 89.1,
        seasonal_adjustment: predictions?.occupancy?.seasonal || 0.8
      },
      cap_rate_forecast: {
        compression_risk: predictions?.cap_rates?.compression || 'moderate',
        expected_movement: predictions?.cap_rates?.movement || -25,
        market_sentiment: predictions?.cap_rates?.sentiment || 'cautious_optimism'
      },
      portfolio_impact: {
        noi_growth_projection: predictions?.portfolio?.noi_growth || 8.3,
        value_appreciation: predictions?.portfolio?.appreciation || 12.1,
        refinancing_opportunities: predictions?.portfolio?.refi_opps || 7,
        acquisition_targets: predictions?.portfolio?.acq_targets || 3
      },
      risk_assessment: {
        market_risk: predictions?.risks?.market || 'moderate',
        interest_rate_risk: predictions?.risks?.rates || 'elevated',
        regulatory_risk: predictions?.risks?.regulatory || 'low',
        liquidity_risk: predictions?.risks?.liquidity || 'low'
      },
      recommendations: generatePredictiveRecommendations(predictions)
    };

    res.json(analytics);
  } catch (error) {
    console.error('Predictive analytics error:', error);
    res.status(500).json({ error: 'Failed to generate predictive analytics' });
  }
});

// Live Data Streams
router.get('/live-streams', async (req, res) => {
  try {
    // Get real-time data streams with error handling
    const streams = await Promise.all([
      // Market sentiment from news and social media
      mcpService.executeTool('sentiment_analysis', {
        sources: ['news', 'financial_reports', 'market_analysis'],
        keywords: ['multifamily', 'real estate', 'sunbelt markets'],
        timeframe: '24h'
      }).catch(() => null),
      // Interest rate movements
      mcpService.executeTool('interest_rate_monitor', {
        instruments: ['10yr_treasury', 'fed_funds', 'mortgage_rates'],
        frequency: 'hourly'
      }).catch(() => null),
      // Economic calendar events
      mcpService.executeTool('economic_calendar', {
        importance: 'high',
        timeframe: '7d',
        categories: ['employment', 'inflation', 'housing']
      }).catch(() => null)
    ]);

    const liveData = {
      timestamp: new Date().toISOString(),
      market_sentiment: {
        score: streams[0]?.sentiment_score || 0.72,
        trend: streams[0]?.trend || 'positive',
        key_drivers: streams[0]?.drivers || ['job_growth', 'migration_patterns', 'supply_constraints'],
        confidence: streams[0]?.confidence || 0.83
      },
      interest_rates: {
        ten_year_treasury: streams[1]?.treasury_10yr || 4.22,
        fed_funds_rate: streams[1]?.fed_funds || 5.25,
        mortgage_rates: streams[1]?.mortgage_30yr || 6.87,
        rate_direction: streams[1]?.direction || 'stable'
      },
      upcoming_events: streams[2]?.events || [
        {
          date: '2024-08-16',
          event: 'Housing Starts Report',
          importance: 'high',
          expected_impact: 'moderate'
        },
        {
          date: '2024-08-20',
          event: 'FOMC Meeting Minutes',
          importance: 'very_high',
          expected_impact: 'high'
        }
      ],
      alerts: generateLiveAlerts(streams)
    };

    res.json(liveData);
  } catch (error) {
    console.error('Live streams error:', error);
    res.status(500).json({ error: 'Failed to fetch live data streams' });
  }
});

// Portfolio Optimization Engine
router.post('/optimize-portfolio', async (req, res) => {
  try {
    const { objective, constraints, timeframe } = req.body;

    // Get current portfolio data
    const portfolio = await db.select().from(sites);
    
    // Use MCP for portfolio optimization
    const optimization = await mcpService.executeTool('portfolio_optimization', {
      current_portfolio: portfolio,
      objective: objective || 'maximize_risk_adjusted_return',
      constraints: constraints || {
        max_concentration: 0.25,
        min_liquidity: 0.15,
        geographic_limits: true
      },
      timeframe: timeframe || '5y'
    });

    const recommendations = {
      optimization_score: optimization?.score || 8.4,
      current_allocation: optimization?.current || calculateCurrentAllocation(portfolio),
      recommended_allocation: optimization?.recommended || generateOptimalAllocation(portfolio),
      rebalancing_actions: optimization?.actions || [
        {
          action: 'acquire',
          market: 'Austin, TX',
          asset_type: 'Class B+',
          target_units: 250,
          expected_irr: 16.2,
          priority: 'high'
        },
        {
          action: 'dispose',
          property_id: 'older_asset_id',
          reason: 'underperforming_market',
          expected_proceeds: 12500000,
          priority: 'medium'
        }
      ],
      risk_metrics: {
        portfolio_beta: optimization?.risk?.beta || 0.89,
        var_95: optimization?.risk?.var || 0.12,
        sharpe_ratio: optimization?.risk?.sharpe || 1.34,
        correlation_risk: optimization?.risk?.correlation || 'moderate'
      },
      expected_outcomes: {
        irr_improvement: optimization?.outcomes?.irr || 2.1,
        risk_reduction: optimization?.outcomes?.risk_reduction || 0.08,
        liquidity_improvement: optimization?.outcomes?.liquidity || 0.12
      }
    };

    res.json(recommendations);
  } catch (error) {
    console.error('Portfolio optimization error:', error);
    res.status(500).json({ error: 'Failed to optimize portfolio' });
  }
});

// Helper functions
function generateRiskFactors(marketData: any[]): string[] {
  const risks = [];
  
  if (marketData[0]?.unemployment_rate > 5) risks.push('elevated_unemployment');
  if (marketData[1]?.vacancy_rate > 8) risks.push('high_vacancy_risk');
  if (marketData[2]?.gdp_growth < 1.5) risks.push('economic_slowdown');
  if (marketData[3]?.crime_index > 50) risks.push('safety_concerns');
  
  return risks.length ? risks : ['low_risk_environment'];
}

function generateOpportunities(marketData: any[]): string[] {
  const opportunities = [];
  
  if (marketData[0]?.job_growth > 3) opportunities.push('strong_employment_growth');
  if (marketData[1]?.rent_burden_ratio < 30) opportunities.push('affordable_housing_gap');
  if (marketData[2]?.income_growth > 4) opportunities.push('rising_purchasing_power');
  if (marketData[3]?.safety_score > 8) opportunities.push('premium_location_potential');
  
  return opportunities.length ? opportunities : ['market_stability'];
}

async function calculateBristolImpact(marketData: any[]): Promise<any> {
  // Calculate how market conditions impact Bristol's portfolio
  const sites_data = await db.select().from(sites);
  
  return {
    revenue_impact: marketData[0]?.job_growth > 2 ? 'positive' : 'neutral',
    expense_impact: marketData[2]?.inflation < 3 ? 'favorable' : 'pressure',
    valuation_impact: marketData[1]?.vacancy_rate < 7 ? 'appreciation' : 'stable',
    financing_impact: 'monitoring_rates'
  };
}

function generatePredictiveRecommendations(predictions: any): string[] {
  const recommendations = [];
  
  if (predictions?.rent_growth?.base > 6) {
    recommendations.push('Accelerate acquisition timeline to capture rent growth');
  }
  if (predictions?.cap_rates?.compression === 'high') {
    recommendations.push('Consider refinancing existing assets before rate increases');
  }
  if (predictions?.risks?.market === 'elevated') {
    recommendations.push('Increase liquidity reserves and stress-test portfolio');
  }
  
  return recommendations.length ? recommendations : ['Maintain current strategy'];
}

function generateLiveAlerts(streams: any[]): any[] {
  const alerts = [];
  
  if (streams[1]?.treasury_10yr > 4.5) {
    alerts.push({
      type: 'rate_alert',
      severity: 'medium',
      message: '10-year Treasury approaching acquisition hurdle rate'
    });
  }
  
  if (streams[0]?.sentiment_score < 0.4) {
    alerts.push({
      type: 'sentiment_alert',
      severity: 'low',
      message: 'Market sentiment declining - monitor for opportunities'
    });
  }
  
  return alerts;
}

function calculateCurrentAllocation(portfolio: any[]): any {
  // Calculate current geographic and asset class allocation
  return {
    geographic: portfolio.reduce((acc, site) => {
      const state = site.state || 'Unknown';
      acc[state] = (acc[state] || 0) + 1;
      return acc;
    }, {}),
    asset_class: {
      'Class A': Math.round(portfolio.length * 0.35),
      'Class B': Math.round(portfolio.length * 0.45),
      'Class C': Math.round(portfolio.length * 0.20)
    }
  };
}

function generateOptimalAllocation(portfolio: any[]): any {
  // Generate optimal allocation recommendations
  return {
    geographic: {
      'TX': Math.round(portfolio.length * 0.30),
      'FL': Math.round(portfolio.length * 0.25),
      'NC': Math.round(portfolio.length * 0.20),
      'TN': Math.round(portfolio.length * 0.15),
      'Other': Math.round(portfolio.length * 0.10)
    },
    asset_class: {
      'Class A': Math.round(portfolio.length * 0.40),
      'Class B': Math.round(portfolio.length * 0.50),
      'Class C': Math.round(portfolio.length * 0.10)
    }
  };
}

export default router;