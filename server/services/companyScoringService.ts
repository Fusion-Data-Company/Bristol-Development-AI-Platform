/**
 * Company Scoring Service
 * Proprietary 100-point scoring methodology for multifamily development opportunities
 * Aligned with Your Company Name's institutional investment criteria
 */

import { db } from '../db';
import { sites } from '@shared/schema';
import { eq } from 'drizzle-orm';

export interface CompanyScoreComponents {
  demographics: number;      // 30 points - Population, income, education
  marketDynamics: number;    // 25 points - Supply/demand, rent growth, occupancy
  location: number;          // 20 points - Transit, amenities, employment centers
  financial: number;         // 15 points - Cap rates, IRR potential, financing
  riskAdjustment: number;    // 10 points - Regulatory, market timing, competition
}

export interface CompanyScoreResult {
  totalScore: number;
  components: CompanyScoreComponents;
  grade: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D';
  recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'AVOID';
  rationale: string;
  lastCalculated: Date;
}

export class CompanyScoringService {
  
  /**
   * Calculate comprehensive Company score for a property
   */
  async calculateCompanyScore(siteId: string): Promise<CompanyScoreResult> {
    // Get site data
    const site = await db.select().from(sites).where(eq(sites.id, siteId)).limit(1);
    if (!site.length) {
      throw new Error(`Site ${siteId} not found`);
    }

    const siteData = site[0];
    const acsProfile = siteData.acsProfile as any;

    // Calculate component scores
    const components: CompanyScoreComponents = {
      demographics: this.calculateDemographicsScore(acsProfile, siteData),
      marketDynamics: this.calculateMarketDynamicsScore(siteData),
      location: this.calculateLocationScore(siteData),
      financial: this.calculateFinancialScore(siteData),
      riskAdjustment: this.calculateRiskAdjustmentScore(siteData)
    };

    // Calculate total score
    const totalScore = Math.round(
      components.demographics + 
      components.marketDynamics + 
      components.location + 
      components.financial + 
      components.riskAdjustment
    );

    // Determine grade and recommendation
    const grade = this.getGrade(totalScore);
    const recommendation = this.getRecommendation(totalScore);
    const rationale = this.generateRationale(components, totalScore, siteData);

    return {
      totalScore,
      components,
      grade,
      recommendation,
      rationale,
      lastCalculated: new Date()
    };
  }

  /**
   * Demographics scoring (30 points max)
   * Key factors: Median income, population growth, education levels
   */
  private calculateDemographicsScore(acsProfile: any, siteData: any): number {
    let score = 0;

    // Median income component (15 points)
    const medianIncome = acsProfile?.median_income || 0;
    if (medianIncome >= 80000) score += 15;
    else if (medianIncome >= 65000) score += 12;
    else if (medianIncome >= 50000) score += 9;
    else if (medianIncome >= 40000) score += 6;
    else if (medianIncome >= 30000) score += 3;

    // Population density and growth (10 points)
    const population = acsProfile?.population || 0;
    if (population >= 5000) score += 10;
    else if (population >= 3000) score += 8;
    else if (population >= 2000) score += 6;
    else if (population >= 1000) score += 4;
    else if (population >= 500) score += 2;

    // Market rent analysis (5 points)
    const medianRent = acsProfile?.median_rent || 0;
    const rentToIncomeRatio = medianIncome > 0 ? (medianRent * 12) / medianIncome : 0;
    if (rentToIncomeRatio >= 0.25 && rentToIncomeRatio <= 0.35) score += 5;
    else if (rentToIncomeRatio >= 0.20 && rentToIncomeRatio <= 0.40) score += 3;
    else if (rentToIncomeRatio >= 0.15 && rentToIncomeRatio <= 0.45) score += 1;

    return Math.min(score, 30);
  }

  /**
   * Market dynamics scoring (25 points max)
   * Key factors: Supply constraints, demand drivers, rent growth potential
   */
  private calculateMarketDynamicsScore(siteData: any): number {
    let score = 0;

    // Market position - Sunbelt preference (10 points)
    const sunbeltStates = ['TX', 'FL', 'GA', 'NC', 'SC', 'TN', 'AZ', 'NV'];
    if (sunbeltStates.includes(siteData.state)) {
      score += 10;
    } else if (['VA', 'CO', 'UT'].includes(siteData.state)) {
      score += 7;
    } else {
      score += 3;
    }

    // Unit mix optimization (8 points)
    const totalUnits = siteData.unitsTotal || 0;
    const units1b = siteData.units1b || 0;
    const units2b = siteData.units2b || 0;
    
    if (totalUnits > 0) {
      const unit1bPct = units1b / totalUnits;
      const unit2bPct = units2b / totalUnits;
      
      // Optimal mix: 50-70% 1BR, 25-40% 2BR
      if (unit1bPct >= 0.50 && unit1bPct <= 0.70 && unit2bPct >= 0.25 && unit2bPct <= 0.40) {
        score += 8;
      } else if (unit1bPct >= 0.40 && unit1bPct <= 0.80) {
        score += 5;
      } else {
        score += 2;
      }
    }

    // Property scale and efficiency (7 points)
    if (totalUnits >= 200) score += 7;
    else if (totalUnits >= 150) score += 6;
    else if (totalUnits >= 100) score += 5;
    else if (totalUnits >= 50) score += 3;
    else if (totalUnits >= 25) score += 1;

    return Math.min(score, 25);
  }

  /**
   * Location scoring (20 points max)
   * Key factors: Transit access, employment centers, amenities
   */
  private calculateLocationScore(siteData: any): number {
    let score = 0;

    // Metro market tier (12 points)
    const tier1Markets = ['Nashville', 'Austin', 'Raleigh', 'Charlotte', 'Atlanta', 'Tampa', 'Phoenix'];
    const tier2Markets = ['Jacksonville', 'Orlando', 'Memphis', 'Louisville', 'Birmingham'];
    
    if (tier1Markets.includes(siteData.city)) {
      score += 12;
    } else if (tier2Markets.includes(siteData.city)) {
      score += 8;
    } else {
      score += 4;
    }

    // Property age and vintage (5 points)
    const currentYear = new Date().getFullYear();
    const propertyAge = currentYear - (siteData.completionYear || currentYear);
    
    if (propertyAge <= 5) score += 5;
    else if (propertyAge <= 10) score += 4;
    else if (propertyAge <= 15) score += 3;
    else if (propertyAge <= 25) score += 2;
    else score += 1;

    // Parking ratio (3 points)
    const totalUnits = siteData.unitsTotal || 0;
    const parkingRatio = totalUnits > 0 ? (siteData.parkingSpaces || 0) / totalUnits : 0;
    if (parkingRatio >= 1.5) score += 3;
    else if (parkingRatio >= 1.2) score += 2;
    else if (parkingRatio >= 1.0) score += 1;

    return Math.min(score, 20);
  }

  /**
   * Financial scoring (15 points max)
   * Key factors: IRR potential, cap rate compression, financing availability
   */
  private calculateFinancialScore(siteData: any): number {
    let score = 0;

    // Asset size and institutional quality (8 points)
    const totalUnits = siteData.unitsTotal || 0;
    const avgSf = siteData.avgSf || 0;
    
    if (totalUnits >= 100 && avgSf >= 800) score += 8;
    else if (totalUnits >= 75 && avgSf >= 700) score += 6;
    else if (totalUnits >= 50 && avgSf >= 600) score += 4;
    else if (totalUnits >= 25) score += 2;

    // Rent growth potential (4 points)
    const acsProfile = siteData.acsProfile as any;
    const medianRent = acsProfile?.median_rent || 0;
    const medianIncome = acsProfile?.median_income || 0;
    
    // Lower rent-to-income ratios suggest upside potential
    if (medianIncome > 0) {
      const rentToIncomeRatio = (medianRent * 12) / medianIncome;
      if (rentToIncomeRatio <= 0.25) score += 4;
      else if (rentToIncomeRatio <= 0.30) score += 3;
      else if (rentToIncomeRatio <= 0.35) score += 2;
    }

    // Development quality proxy (3 points)
    if (siteData.status === 'Operating' && siteData.completionYear) {
      score += 3;
    } else if (siteData.status === 'Operating') {
      score += 2;
    } else {
      score += 1;
    }

    return Math.min(score, 15);
  }

  /**
   * Risk adjustment scoring (10 points max)
   * Key factors: Regulatory environment, market timing, competition
   */
  private calculateRiskAdjustmentScore(siteData: any): number {
    let score = 0;

    // Regulatory environment by state (5 points)
    const lowRegStates = ['TX', 'FL', 'TN', 'NC', 'SC', 'GA'];
    const medRegStates = ['AZ', 'NV', 'VA', 'CO'];
    
    if (lowRegStates.includes(siteData.state)) {
      score += 5;
    } else if (medRegStates.includes(siteData.state)) {
      score += 3;
    } else {
      score += 1;
    }

    // Market liquidity and exit potential (3 points)
    const totalUnits = siteData.unitsTotal || 0;
    if (totalUnits >= 100) score += 3;
    else if (totalUnits >= 50) score += 2;
    else score += 1;

    // Portfolio diversification benefit (2 points)
    // This would check against existing portfolio but simplified for now
    score += 2;

    return Math.min(score, 10);
  }

  /**
   * Convert numerical score to letter grade
   */
  private getGrade(score: number): CompanyScoreResult['grade'] {
    if (score >= 90) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 80) return 'A-';
    if (score >= 75) return 'B+';
    if (score >= 70) return 'B';
    if (score >= 65) return 'B-';
    if (score >= 60) return 'C+';
    if (score >= 55) return 'C';
    if (score >= 50) return 'C-';
    return 'D';
  }

  /**
   * Convert numerical score to investment recommendation
   */
  private getRecommendation(score: number): CompanyScoreResult['recommendation'] {
    if (score >= 80) return 'STRONG_BUY';
    if (score >= 70) return 'BUY';
    if (score >= 60) return 'HOLD';
    return 'AVOID';
  }

  /**
   * Generate detailed rationale for the score
   */
  private generateRationale(components: CompanyScoreComponents, totalScore: number, siteData: any): string {
    const strongPoints = [];
    const weakPoints = [];

    // Analyze component strengths and weaknesses
    if (components.demographics >= 24) strongPoints.push('strong demographic profile');
    else if (components.demographics <= 15) weakPoints.push('demographic challenges');

    if (components.marketDynamics >= 20) strongPoints.push('favorable market dynamics');
    else if (components.marketDynamics <= 15) weakPoints.push('market headwinds');

    if (components.location >= 16) strongPoints.push('premium location');
    else if (components.location <= 12) weakPoints.push('location constraints');

    if (components.financial >= 12) strongPoints.push('solid financial metrics');
    else if (components.financial <= 8) weakPoints.push('financial concerns');

    if (components.riskAdjustment >= 8) strongPoints.push('low regulatory risk');
    else if (components.riskAdjustment <= 6) weakPoints.push('elevated risk profile');

    let rationale = `${siteData.name} scores ${totalScore}/100 in Company's proprietary analysis. `;

    if (strongPoints.length > 0) {
      rationale += `Key strengths include ${strongPoints.join(', ')}. `;
    }

    if (weakPoints.length > 0) {
      rationale += `Areas of concern: ${weakPoints.join(', ')}. `;
    }

    // Add investment thesis
    if (totalScore >= 80) {
      rationale += 'This asset meets Company institutional investment criteria with strong fundamentals and attractive risk-adjusted returns.';
    } else if (totalScore >= 70) {
      rationale += 'Solid investment opportunity with good fundamentals, suitable for value-add strategy.';
    } else if (totalScore >= 60) {
      rationale += 'Marginal investment case requiring careful due diligence and conservative underwriting.';
    } else {
      rationale += 'Below Company investment thresholds. Significant operational or market improvements needed.';
    }

    return rationale;
  }

  /**
   * Calculate and update Company scores for all properties
   */
  async updateAllCompanyScores(): Promise<void> {
    const allSites = await db.select().from(sites);
    
    for (const site of allSites) {
      try {
        const scoreResult = await this.calculateCompanyScore(site.id);
        
        // Update the database with the calculated score
        await db.update(sites)
          .set({ 
            companyScore: scoreResult.totalScore,
            updatedAt: new Date()
          })
          .where(eq(sites.id, site.id));
          
        console.log(`✅ Updated Company score for ${site.name}: ${scoreResult.totalScore}/100`);
      } catch (error) {
        console.error(`❌ Failed to calculate Company score for ${site.name}:`, error);
      }
    }
  }

  /**
   * Get Company score with detailed breakdown
   */
  async getCompanyScoreDetailed(siteId: string): Promise<CompanyScoreResult> {
    return this.calculateCompanyScore(siteId);
  }
}

export const companyScoringService = new CompanyScoringService();