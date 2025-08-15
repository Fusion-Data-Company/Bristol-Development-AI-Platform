// Enterprise Data Analytics Engine for Bristol Development Group
// Provides advanced analytics, reporting, and business intelligence capabilities

import { db } from "../db";
import { sites, siteMetrics, compsAnnex, agentDecisions } from "@shared/schema";
import { eq, sql, and, gte, lte, desc, asc, count, avg, sum } from "drizzle-orm";

interface AnalyticsQuery {
  dateRange?: { start: Date; end: Date };
  geography?: { cities?: string[]; states?: string[]; regions?: string[] };
  propertyTypes?: string[];
  metrics?: string[];
  aggregation?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
}

interface MarketMetrics {
  totalProperties: number;
  totalUnits: number;
  averageCapRate: number;
  averageRentPsf: number;
  occupancyRate: number;
  marketVelocity: number;
  priceAppreciation: number;
  demographics: {
    medianIncome: number;
    populationGrowth: number;
    employmentRate: number;
  };
}

interface PortfolioAnalytics {
  performance: {
    totalNOI: number;
    totalValue: number;
    weightedAvgCapRate: number;
    portfolioYield: number;
    diversificationScore: number;
  };
  geographic: {
    marketExposure: Array<{ market: string; allocation: number; performance: number }>;
    concentrationRisk: number;
  };
  trends: {
    acquisitionVelocity: number;
    dispositionActivity: number;
    developmentPipeline: number;
  };
}

interface RiskMetrics {
  marketRisk: {
    concentrationRisk: number;
    cyclicalExposure: number;
    economicSensitivity: number;
  };
  propertyRisk: {
    ageProfile: number;
    maintenanceReserves: number;
    tenantConcentration: number;
  };
  financialRisk: {
    leverageRatio: number;
    debtServiceCoverage: number;
    liquidity: number;
  };
}

export class DataAnalyticsEngine {
  
  // Market Intelligence Analytics
  async generateMarketIntelligence(query: AnalyticsQuery): Promise<MarketMetrics> {
    const { dateRange, geography, propertyTypes } = query;
    
    // Build dynamic query based on filters
    let baseQuery = db
      .select({
        totalProperties: count(sites.id),
        totalUnits: sum(sites.unitsTotal),
        avgSqft: avg(sites.avgSf),
        avgCompletion: avg(sites.completionYear),
      })
      .from(sites);

    // Apply filters
    const conditions = [];
    
    if (dateRange) {
      conditions.push(
        and(
          gte(sites.createdAt, dateRange.start),
          lte(sites.createdAt, dateRange.end)
        )
      );
    }

    if (geography?.cities?.length) {
      conditions.push(sql`${sites.city} = ANY(${geography.cities})`);
    }

    if (geography?.states?.length) {
      conditions.push(sql`${sites.state} = ANY(${geography.states})`);
    }

    // Execute base property metrics
    const propertyMetrics = await baseQuery.where(and(...conditions));

    // Get financial metrics from comparables
    const financialMetrics = await db
      .select({
        avgCapRate: avg(compsAnnex.capRate),
        avgRentPsf: avg(compsAnnex.rentPsf),
        avgOccupancy: avg(compsAnnex.occupancyPct),
        avgNOI: avg(compsAnnex.noi),
      })
      .from(compsAnnex)
      .where(
        and(
          geography?.cities?.length ? sql`${compsAnnex.city} = ANY(${geography.cities})` : sql`1=1`,
          dateRange ? gte(compsAnnex.createdAt, dateRange.start) : sql`1=1`
        )
      );

    // Get demographic data
    const demographicMetrics = await db
      .select({
        medianIncome: avg(siteMetrics.value),
      })
      .from(siteMetrics)
      .where(eq(siteMetrics.metricName, 'median_household_income'));

    // Calculate market velocity and trends
    const marketVelocity = await this.calculateMarketVelocity(query);
    const priceAppreciation = await this.calculatePriceAppreciation(query);

    return {
      totalProperties: Number(propertyMetrics[0]?.totalProperties || 0),
      totalUnits: Number(propertyMetrics[0]?.totalUnits || 0),
      averageCapRate: Number(financialMetrics[0]?.avgCapRate || 0),
      averageRentPsf: Number(financialMetrics[0]?.avgRentPsf || 0),
      occupancyRate: Number(financialMetrics[0]?.avgOccupancy || 0),
      marketVelocity,
      priceAppreciation,
      demographics: {
        medianIncome: Number(demographicMetrics[0]?.medianIncome || 0),
        populationGrowth: 0, // Would need time-series data
        employmentRate: 0, // Would need employment metrics
      },
    };
  }

  // Portfolio Performance Analytics
  async generatePortfolioAnalytics(userId?: string): Promise<PortfolioAnalytics> {
    // Get portfolio composition
    const portfolioComposition = await db
      .select({
        market: sql<string>`${sites.city} || ', ' || ${sites.state}`,
        propertyCount: count(sites.id),
        totalUnits: sum(sites.unitsTotal),
        totalSqft: sum(sites.avgSf),
        avgCompletionYear: avg(sites.completionYear),
      })
      .from(sites)
      .groupBy(sites.city, sites.state)
      .orderBy(desc(count(sites.id)));

    // Calculate portfolio metrics
    const totalProperties = portfolioComposition.reduce((sum, market) => sum + Number(market.propertyCount), 0);
    const totalUnits = portfolioComposition.reduce((sum, market) => sum + Number(market.totalUnits || 0), 0);

    // Geographic allocation analysis
    const marketExposure = portfolioComposition.map(market => ({
      market: market.market,
      allocation: (market.propertyCount / totalProperties) * 100,
      performance: 0, // Would need performance metrics
    }));

    // Calculate concentration risk (Herfindahl-Hirschman Index)
    const concentrationRisk = marketExposure.reduce((sum, market) => {
      const marketShare = market.allocation / 100;
      return sum + (marketShare * marketShare);
    }, 0) * 10000; // Scale to 0-10000

    // Get recent activity trends
    const recentActivity = await db
      .select({
        month: sql<string>`DATE_TRUNC('month', ${sites.createdAt})`,
        acquisitions: count(sites.id),
      })
      .from(sites)
      .where(gte(sites.createdAt, new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)))
      .groupBy(sql`DATE_TRUNC('month', ${sites.createdAt})`)
      .orderBy(asc(sql`DATE_TRUNC('month', ${sites.createdAt})`));

    const acquisitionVelocity = recentActivity.length > 0 
      ? recentActivity.reduce((sum, month) => sum + Number(month.acquisitions), 0) / recentActivity.length
      : 0;

    return {
      performance: {
        totalNOI: 0, // Would need financial data
        totalValue: 0, // Would need valuation data
        weightedAvgCapRate: 0, // Would need cap rate data
        portfolioYield: 0, // Would need yield calculations
        diversificationScore: 100 - concentrationRisk / 100, // Inverse of concentration
      },
      geographic: {
        marketExposure,
        concentrationRisk,
      },
      trends: {
        acquisitionVelocity,
        dispositionActivity: 0, // Would need disposition tracking
        developmentPipeline: 0, // Would need development pipeline data
      },
    };
  }

  // Risk Assessment Analytics
  async generateRiskAnalytics(query: AnalyticsQuery): Promise<RiskMetrics> {
    // Geographic concentration risk
    const geoConcentration = await db
      .select({
        state: sites.state,
        count: count(sites.id),
      })
      .from(sites)
      .groupBy(sites.state);

    const totalProperties = geoConcentration.reduce((sum, state) => sum + state.count, 0);
    const concentrationRisk = geoConcentration.reduce((sum, state) => {
      const share = state.count / totalProperties;
      return sum + (share * share);
    }, 0) * 100;

    // Property age analysis
    const currentYear = new Date().getFullYear();
    const ageAnalysis = await db
      .select({
        avgAge: sql<number>`AVG(${currentYear} - ${sites.completionYear})`,
        oldestProperty: sql<number>`MAX(${currentYear} - ${sites.completionYear})`,
        newestProperty: sql<number>`MIN(${currentYear} - ${sites.completionYear})`,
      })
      .from(sites)
      .where(sql`${sites.completionYear} IS NOT NULL`);

    // Financial metrics from decisions
    const financialDecisions = await db
      .select({
        avgConfidence: avg(agentDecisions.confidence),
        riskLevel: sql<number>`
          CASE 
            WHEN AVG(${agentDecisions.confidence}) >= 0.8 THEN 1
            WHEN AVG(${agentDecisions.confidence}) >= 0.6 THEN 2
            WHEN AVG(${agentDecisions.confidence}) >= 0.4 THEN 3
            ELSE 4
          END
        `,
      })
      .from(agentDecisions)
      .where(eq(agentDecisions.decisionType, 'investment'));

    return {
      marketRisk: {
        concentrationRisk,
        cyclicalExposure: 50, // Would need economic cycle analysis
        economicSensitivity: 60, // Would need correlation analysis
      },
      propertyRisk: {
        ageProfile: ageAnalysis[0]?.avgAge || 0,
        maintenanceReserves: 85, // Would need maintenance reserve calculations
        tenantConcentration: 25, // Would need tenant data
      },
      financialRisk: {
        leverageRatio: 65, // Would need debt/equity ratios
        debtServiceCoverage: 1.35, // Would need DSCR calculations
        liquidity: 80, // Would need liquidity analysis
      },
    };
  }

  // Time Series Analytics
  async generateTimeSeriesAnalytics(metric: string, query: AnalyticsQuery) {
    const { dateRange, aggregation = 'monthly' } = query;
    
    const dateGrouping = {
      daily: "DATE_TRUNC('day', created_at)",
      weekly: "DATE_TRUNC('week', created_at)",
      monthly: "DATE_TRUNC('month', created_at)",
      quarterly: "DATE_TRUNC('quarter', created_at)",
      yearly: "DATE_TRUNC('year', created_at)",
    };

    const groupByClause = dateGrouping[aggregation];

    if (metric === 'property_acquisitions') {
      const data = await db
        .select({
          period: sql<string>`${sql.raw(groupByClause)}`,
          count: count(sites.id),
          totalUnits: sum(sites.unitsTotal),
          avgUnits: avg(sites.unitsTotal),
        })
        .from(sites)
        .where(
          dateRange 
            ? and(
                gte(sites.createdAt, dateRange.start),
                lte(sites.createdAt, dateRange.end)
              )
            : sql`1=1`
        )
        .groupBy(sql.raw(groupByClause))
        .orderBy(asc(sql.raw(groupByClause)));
      
      return data.map(d => ({
        ...d,
        count: Number(d.count),
        totalUnits: Number(d.totalUnits || 0),
        avgUnits: Number(d.avgUnits || 0)
      }));
    }

    if (metric === 'market_rent_trends') {
      const data = await db
        .select({
          period: sql<string>`${sql.raw(groupByClause.replace('created_at', 'scraped_at'))}`,
          avgRentPsf: avg(compsAnnex.rentPsf),
          avgRentPu: avg(compsAnnex.rentPu),
          medianRentPsf: sql<number>`PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ${compsAnnex.rentPsf})`,
        })
        .from(compsAnnex)
        .where(
          and(
            sql`${compsAnnex.rentPsf} IS NOT NULL`,
            dateRange 
              ? and(
                  gte(compsAnnex.scrapedAt, dateRange.start),
                  lte(compsAnnex.scrapedAt, dateRange.end)
                )
              : sql`1=1`
          )
        )
        .groupBy(sql.raw(groupByClause.replace('created_at', 'scraped_at')))
        .orderBy(asc(sql.raw(groupByClause.replace('created_at', 'scraped_at'))));
      
      return data.map(d => ({
        ...d,
        avgRentPsf: Number(d.avgRentPsf || 0),
        avgRentPu: Number(d.avgRentPu || 0),
        medianRentPsf: Number(d.medianRentPsf || 0)
      }));
    }

    throw new Error(`Unsupported metric: ${metric}`);
  }

  // Comparative Analytics
  async generateComparativeAnalysis(propertyIds: string[]) {
    if (propertyIds.length < 2) {
      throw new Error('At least 2 properties required for comparative analysis');
    }

    const properties = await db
      .select()
      .from(sites)
      .where(sql`${sites.id} = ANY(${propertyIds})`);

    // Get metrics for each property
    const metrics = await db
      .select({
        siteId: siteMetrics.siteId,
        metricType: siteMetrics.metricType,
        metricName: siteMetrics.metricName,
        value: siteMetrics.value,
        unit: siteMetrics.unit,
      })
      .from(siteMetrics)
      .where(sql`${siteMetrics.siteId} = ANY(${propertyIds})`);

    // Group metrics by property
    const propertyMetrics = properties.map(property => ({
      ...property,
      metrics: metrics.filter(m => m.siteId === property.id),
    }));

    // Calculate comparative ratios and rankings
    const comparativeAnalysis = {
      properties: propertyMetrics,
      rankings: {
        byUnits: [...properties].sort((a, b) => (b.unitsTotal || 0) - (a.unitsTotal || 0)),
        bySize: [...properties].sort((a, b) => (b.avgSf || 0) - (a.avgSf || 0)),
        byAge: [...properties].sort((a, b) => (b.completionYear || 0) - (a.completionYear || 0)),
      },
      statistics: {
        avgUnits: properties.reduce((sum, p) => sum + (p.unitsTotal || 0), 0) / properties.length,
        avgSqft: properties.reduce((sum, p) => sum + (p.avgSf || 0), 0) / properties.length,
        avgAge: properties.reduce((sum, p) => {
          const age = p.completionYear ? new Date().getFullYear() - p.completionYear : 0;
          return sum + age;
        }, 0) / properties.length,
      },
    };

    return comparativeAnalysis;
  }

  // Predictive Analytics
  async generatePredictiveModels(metric: string, lookAhead: number = 12) {
    // Simple linear regression for trend prediction
    const historicalData = await this.generateTimeSeriesAnalytics(metric, {
      dateRange: {
        start: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000), // 2 years back
        end: new Date(),
      },
      aggregation: 'monthly',
    });

    if (!Array.isArray(historicalData) || historicalData.length < 3) {
      throw new Error('Insufficient historical data for prediction');
    }

    // Simple linear trend calculation
    const n = historicalData.length;
    const sumX = historicalData.reduce((sum, _, i) => sum + i, 0);
    const sumY = historicalData.reduce((sum, d) => sum + (d.count || d.avgRentPsf || 0), 0);
    const sumXY = historicalData.reduce((sum, d, i) => sum + i * (d.count || d.avgRentPsf || 0), 0);
    const sumX2 = historicalData.reduce((sum, _, i) => sum + i * i, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Generate predictions
    const predictions = [];
    for (let i = 0; i < lookAhead; i++) {
      const futureIndex = n + i;
      const predictedValue = slope * futureIndex + intercept;
      
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + i + 1);
      
      predictions.push({
        period: futureDate.toISOString().substring(0, 7), // YYYY-MM format
        predicted_value: Math.max(0, predictedValue), // Ensure non-negative
        confidence: Math.max(0.1, 0.9 - (i * 0.05)), // Decreasing confidence over time
      });
    }

    return {
      historical: historicalData,
      predictions,
      model: {
        type: 'linear_regression',
        slope,
        intercept,
        r_squared: this.calculateRSquared(historicalData, slope, intercept),
      },
    };
  }

  // Helper Methods
  private async calculateMarketVelocity(query: AnalyticsQuery): Promise<number> {
    const recentSales = await db
      .select({
        count: count(compsAnnex.id),
      })
      .from(compsAnnex)
      .where(
        gte(compsAnnex.scrapedAt, new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))
      );

    return recentSales[0]?.count || 0;
  }

  private async calculatePriceAppreciation(query: AnalyticsQuery): Promise<number> {
    // Calculate year-over-year price appreciation
    const currentYear = await db
      .select({
        avgPrice: avg(compsAnnex.pricePerUnit),
      })
      .from(compsAnnex)
      .where(
        gte(compsAnnex.scrapedAt, new Date(Date.now() - 365 * 24 * 60 * 60 * 1000))
      );

    const previousYear = await db
      .select({
        avgPrice: avg(compsAnnex.pricePerUnit),
      })
      .from(compsAnnex)
      .where(
        and(
          gte(compsAnnex.scrapedAt, new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000)),
          lte(compsAnnex.scrapedAt, new Date(Date.now() - 365 * 24 * 60 * 60 * 1000))
        )
      );

    const current = currentYear[0]?.avgPrice || 0;
    const previous = previousYear[0]?.avgPrice || 0;

    return previous > 0 ? ((current - previous) / previous) * 100 : 0;
  }

  private calculateRSquared(data: any[], slope: number, intercept: number): number {
    const mean = data.reduce((sum, d, i) => sum + (d.count || d.avgRentPsf || 0), 0) / data.length;
    
    let totalSumSquares = 0;
    let residualSumSquares = 0;

    data.forEach((d: any, i) => {
      const actual = Number(d.count || d.avgRentPsf || 0);
      const predicted = slope * i + intercept;
      
      totalSumSquares += Math.pow(actual - mean, 2);
      residualSumSquares += Math.pow(actual - predicted, 2);
    });

    return totalSumSquares > 0 ? 1 - (residualSumSquares / totalSumSquares) : 0;
  }

  // Export Analytics Methods
  async exportAnalyticsReport(
    reportType: 'portfolio' | 'market' | 'risk' | 'comparative',
    format: 'json' | 'csv' | 'excel',
    query: AnalyticsQuery
  ) {
    let data;

    switch (reportType) {
      case 'portfolio':
        data = await this.generatePortfolioAnalytics();
        break;
      case 'market':
        data = await this.generateMarketIntelligence(query);
        break;
      case 'risk':
        data = await this.generateRiskAnalytics(query);
        break;
      default:
        throw new Error(`Unsupported report type: ${reportType}`);
    }

    return {
      reportType,
      format,
      data,
      generatedAt: new Date().toISOString(),
      query,
    };
  }
}

export const dataAnalyticsEngine = new DataAnalyticsEngine();