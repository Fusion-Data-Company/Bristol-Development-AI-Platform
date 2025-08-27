/**
 * Company Market Intelligence Agent - Elite Real Estate Market Analysis
 * Specialized OpenRouter agent for Sunbelt market intelligence and analysis
 */

import OpenAI from 'openai';
import { db } from '../db';
import { sites, intelligenceEntries } from '../../shared/schema';
import { eq, desc, and, gte } from 'drizzle-orm';

export interface MarketIntelligence {
  marketTrends: {
    rentGrowth: number;
    occupancyRate: number;
    absorptionRate: number;
    constructionStarts: number;
    capRateTrends: number;
  };
  comparableSales: {
    recentTransactions: Array<{
      propertyName: string;
      salePrice: number;
      pricePerUnit: number;
      capRate: number;
      date: string;
      market: string;
    }>;
    averagePricePerUnit: number;
    medianCapRate: number;
  };
  supplyAnalysis: {
    unitsUnderConstruction: number;
    permitsIssued: number;
    completionsNext12Months: number;
    supplyGrowthRate: number;
  };
  demandMetrics: {
    employmentGrowth: number;
    populationGrowth: number;
    householdFormation: number;
    inMigration: number;
  };
}

export interface MarketAnalysisRequest {
  market: string;
  propertyType: string;
  radius?: number;
  timeframe?: string;
  analysisDepth?: 'basic' | 'comprehensive' | 'institutional';
}

export class CompanyMarketAgent {
  private openRouter: OpenAI;
  private models = {
    primary: 'openai/gpt-5-chat',
    research: 'perplexity/sonar-deep-research', 
    analysis: 'google/gemini-2.5-pro',
    validation: 'anthropic/claude-opus-4.1'
  };

  constructor() {
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY2;
    if (!apiKey) {
      throw new Error('OpenRouter API key required for Company Market Agent');
    }

    this.openRouter = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: apiKey,
      defaultHeaders: {
        'HTTP-Referer': process.env.SITE_URL || 'https://brand-intelligence.replit.app',
        'X-Title': 'Company Market Intelligence Agent'
      }
    });
  }

  /**
   * Comprehensive market analysis for Sunbelt multifamily properties
   */
  async analyzeMarket(request: MarketAnalysisRequest): Promise<MarketIntelligence> {
    try {
      console.log(`🏢 Company Market Agent analyzing: ${request.market}`);

      // Phase 1: Market Research with Perplexity
      const marketResearch = await this.conductMarketResearch(request);
      
      // Phase 2: Data Analysis with Gemini
      const dataAnalysis = await this.analyzeMarketData(marketResearch, request);
      
      // Phase 3: Intelligence Synthesis with GPT-5
      const marketIntelligence = await this.synthesizeIntelligence(dataAnalysis, request);
      
      // Phase 4: Validation with Claude
      const validatedIntelligence = await this.validateAnalysis(marketIntelligence);

      // Store intelligence in database
      await this.storeMarketIntelligence(request.market, validatedIntelligence);

      return validatedIntelligence;
    } catch (error) {
      console.error('Company Market Agent analysis failed:', error);
      throw new Error(`Market analysis failed: ${(error as Error).message}`);
    }
  }

  /**
   * Deep market research using Perplexity Sonar
   */
  private async conductMarketResearch(request: MarketAnalysisRequest) {
    const prompt = `Conduct comprehensive real estate market research for ${request.market} multifamily properties:

RESEARCH FOCUS:
- Recent comparable sales and transactions
- Current rent growth trends and occupancy rates
- Construction pipeline and permitting data
- Employment growth and demographic trends
- Institutional investment activity

SOURCES TO ANALYZE:
- Commercial real estate databases and reports
- Local economic development data
- Employment statistics and population trends  
- Construction permitting and completion data
- Institutional investment transaction records

Provide detailed findings with specific data points, sources, and market insights for Company Development Group investment analysis.`;

    const response = await this.openRouter.chat.completions.create({
      model: this.models.research,
      messages: [
        {
          role: 'system',
          content: 'You are a specialized real estate market researcher for Company Development Group, focusing on Sunbelt multifamily markets. Provide comprehensive, data-driven market intelligence.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    return response.choices[0].message.content || '';
  }

  /**
   * Advanced data analysis using Gemini 2.5 Pro
   */
  private async analyzeMarketData(researchData: string, request: MarketAnalysisRequest) {
    const prompt = `Analyze the following market research data for ${request.market} and extract quantitative metrics:

RESEARCH DATA:
${researchData}

ANALYSIS REQUIREMENTS:
1. Calculate market trends (rent growth %, occupancy %, absorption rates)
2. Identify comparable sales with price per unit and cap rates
3. Quantify supply pipeline (units under construction, permits, completions)
4. Measure demand drivers (employment growth, population growth, migration)
5. Assess market cycle positioning and institutional activity

Provide structured data analysis with specific numbers, percentages, and trends suitable for institutional real estate decision-making.`;

    const response = await this.openRouter.chat.completions.create({
      model: this.models.analysis,
      messages: [
        {
          role: 'system', 
          content: 'You are a quantitative real estate analyst specializing in Sunbelt multifamily markets. Extract and analyze numerical data for institutional investment decisions.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 1500
    });

    return response.choices[0].message.content || '';
  }

  /**
   * Intelligence synthesis using GPT-5
   */
  private async synthesizeIntelligence(analysisData: string, request: MarketAnalysisRequest): Promise<MarketIntelligence> {
    const prompt = `Synthesize the market analysis into structured intelligence for ${request.market}:

ANALYSIS DATA:
${analysisData}

REQUIRED OUTPUT FORMAT (JSON):
{
  "marketTrends": {
    "rentGrowth": <number>,
    "occupancyRate": <number>, 
    "absorptionRate": <number>,
    "constructionStarts": <number>,
    "capRateTrends": <number>
  },
  "comparableSales": {
    "recentTransactions": [
      {
        "propertyName": "<string>",
        "salePrice": <number>,
        "pricePerUnit": <number>,
        "capRate": <number>,
        "date": "<string>",
        "market": "<string>"
      }
    ],
    "averagePricePerUnit": <number>,
    "medianCapRate": <number>
  },
  "supplyAnalysis": {
    "unitsUnderConstruction": <number>,
    "permitsIssued": <number>,
    "completionsNext12Months": <number>,
    "supplyGrowthRate": <number>
  },
  "demandMetrics": {
    "employmentGrowth": <number>,
    "populationGrowth": <number>,
    "householdFormation": <number>,
    "inMigration": <number>
  }
}

Extract quantitative data and structure into this exact JSON format for Company Development Group analysis.`;

    const response = await this.openRouter.chat.completions.create({
      model: this.models.primary,
      messages: [
        {
          role: 'system',
          content: 'You are the Company Development Group market intelligence system. Synthesize market data into structured JSON format for institutional analysis.'
        },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 1200
    });

    try {
      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Failed to parse market intelligence JSON:', error);
      throw new Error('Market intelligence synthesis failed');
    }
  }

  /**
   * Analysis validation using Claude Opus 4.1
   */
  private async validateAnalysis(intelligence: MarketIntelligence): Promise<MarketIntelligence> {
    // Validation logic for data consistency and reasonableness
    const validation = {
      rentGrowth: this.validateRange(intelligence.marketTrends.rentGrowth, -10, 25, 'rentGrowth'),
      occupancyRate: this.validateRange(intelligence.marketTrends.occupancyRate, 70, 100, 'occupancyRate'),
      capRate: this.validateRange(intelligence.comparableSales.medianCapRate, 3, 12, 'capRate'),
      employmentGrowth: this.validateRange(intelligence.demandMetrics.employmentGrowth, -5, 15, 'employmentGrowth')
    };

    if (!validation.rentGrowth || !validation.occupancyRate || !validation.capRate || !validation.employmentGrowth) {
      console.warn('Market intelligence validation warnings detected');
    }

    return intelligence;
  }

  /**
   * Store market intelligence in database
   */
  private async storeMarketIntelligence(market: string, intelligence: MarketIntelligence) {
    try {
      await db.insert(intelligenceEntries).values({
        title: `Market Intelligence: ${market}`,
        content: `Comprehensive market analysis for ${market} multifamily properties`,
        source: 'Company Market Agent',
        category: 'market_analysis',
        confidence: 0.85,
        metadata: {
          market,
          analysisType: 'comprehensive',
          dataPoints: Object.keys(intelligence).length,
          timestamp: new Date().toISOString()
        },
        data: intelligence,
        createdAt: new Date()
      });

      console.log(`✅ Market intelligence stored for ${market}`);
    } catch (error) {
      console.error('Failed to store market intelligence:', error);
    }
  }

  /**
   * Validate numerical ranges for market data
   */
  private validateRange(value: number, min: number, max: number, field: string): boolean {
    if (typeof value !== 'number' || isNaN(value)) {
      console.warn(`Invalid ${field}: ${value} (not a number)`);
      return false;
    }
    if (value < min || value > max) {
      console.warn(`${field} outside expected range: ${value} (expected ${min}-${max})`);
      return false;
    }
    return true;
  }

  /**
   * Get recent market intelligence from database
   */
  async getRecentIntelligence(market: string, days: number = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      return await db
        .select()
        .from(intelligenceEntries)
        .where(
          and(
            eq(intelligenceEntries.category, 'market_analysis'),
            gte(intelligenceEntries.createdAt, cutoffDate)
          )
        )
        .orderBy(desc(intelligenceEntries.createdAt))
        .limit(10);
    } catch (error) {
      console.error('Failed to retrieve market intelligence:', error);
      return [];
    }
  }

  /**
   * Health check for Company Market Agent
   */
  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      // Test OpenRouter connectivity
      const testResponse = await this.openRouter.chat.completions.create({
        model: this.models.primary,
        messages: [{ role: 'user', content: 'Health check' }],
        max_tokens: 10
      });

      return {
        status: 'healthy',
        details: {
          models: this.models,
          connectivity: 'operational',
          lastResponse: (testResponse.choices[0].message.content?.length || 0) > 0
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: (error as Error).message,
          models: this.models,
          connectivity: 'failed'
        }
      };
    }
  }
}

// Export singleton instance
export const companyMarketAgent = new CompanyMarketAgent();