import { PropertyAnalysisResult } from './propertyAnalysisService';
import { SearchResult } from './intelligentSearchService';
import { advancedMemoryService } from './advancedMemoryService';

export interface ReportRequest {
  type: 'property-analysis' | 'market-report' | 'portfolio-summary' | 'investment-memo';
  data: any;
  userId: string;
  sessionId?: string;
  customizations?: ReportCustomizations;
}

export interface ReportCustomizations {
  includeCharts: boolean;
  includeComparables: boolean;
  includeRiskAnalysis: boolean;
  includeFinancialProjections: boolean;
  executiveSummaryOnly: boolean;
  brandedTemplate: boolean;
  format: 'pdf' | 'excel' | 'html' | 'json';
}

export interface GeneratedReport {
  id: string;
  type: string;
  title: string;
  content: string;
  format: string;
  downloadUrl?: string;
  metadata: {
    generatedAt: string;
    generatedBy: string;
    dataPoints: number;
    customizations: ReportCustomizations;
  };
}

class ReportGenerationService {
  // Chat-triggered report generation
  async generateReport(request: ReportRequest): Promise<GeneratedReport> {
    console.log(`📊 Generating ${request.type} report for user ${request.userId}`);

    try {
      // Get user preferences for report customization
      const userPrefs = await this.getUserReportPreferences(request.userId);
      const customizations = { ...userPrefs, ...request.customizations };

      let report: GeneratedReport;

      switch (request.type) {
        case 'property-analysis':
          report = await this.generatePropertyAnalysisReport(request.data, customizations);
          break;
        case 'market-report':
          report = await this.generateMarketReport(request.data, customizations);
          break;
        case 'portfolio-summary':
          report = await this.generatePortfolioSummary(request.data, customizations);
          break;
        case 'investment-memo':
          report = await this.generateInvestmentMemo(request.data, customizations);
          break;
        default:
          throw new Error(`Unsupported report type: ${request.type}`);
      }

      // Store report generation in memory
      await advancedMemoryService.storeMemory(
        request.userId,
        request.sessionId || `report-${Date.now()}`,
        `Generated ${request.type} report: ${report.title}`,
        'task',
        { importance: 7, confidence: 1.0 }
      );

      // Learn from report preferences
      await this.learnReportPreferences(request.userId, request.type, customizations);

      console.log(`✅ Report generated successfully: ${report.id}`);
      return report;

    } catch (error) {
      console.error('Report generation failed:', error);
      throw new Error(`Report generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generatePropertyAnalysisReport(
    analysisData: PropertyAnalysisResult,
    customizations: ReportCustomizations
  ): Promise<GeneratedReport> {
    const reportId = `property-analysis-${Date.now()}`;
    
    let content = this.generatePropertyAnalysisHTML(analysisData, customizations);

    if (customizations.format === 'json') {
      content = JSON.stringify(analysisData, null, 2);
    } else if (customizations.format === 'excel') {
      content = this.generatePropertyAnalysisExcel(analysisData);
    }

    return {
      id: reportId,
      type: 'property-analysis',
      title: `Property Analysis Report - ${analysisData.propertyId}`,
      content,
      format: customizations.format,
      downloadUrl: `/api/reports/download/${reportId}`,
      metadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: 'Bristol A.I. Elite',
        dataPoints: this.countAnalysisDataPoints(analysisData),
        customizations
      }
    };
  }

  private generatePropertyAnalysisHTML(
    data: PropertyAnalysisResult,
    customizations: ReportCustomizations
  ): string {
    const { analysis, marketComparables, riskAssessment, recommendation } = data;

    let html = `
<!DOCTYPE html>
<html>
<head>
    <title>Property Analysis Report</title>
    <style>
        body { font-family: 'Segoe UI', system-ui, sans-serif; margin: 40px; color: #333; }
        .header { background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; }
        .bristol-logo { color: #fbbf24; font-size: 24px; font-weight: bold; }
        .section { margin: 30px 0; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
        .metric-card { background: #f8fafc; padding: 15px; border-radius: 6px; text-align: center; }
        .metric-value { font-size: 28px; font-weight: bold; color: #059669; }
        .metric-label { font-size: 14px; color: #6b7280; margin-top: 5px; }
        .recommendation { padding: 20px; border-radius: 8px; }
        .recommendation.buy { background: #dcfce7; border-left: 4px solid #059669; }
        .recommendation.pass { background: #fef3c7; border-left: 4px solid #d97706; }
        .recommendation.investigate { background: #dbeafe; border-left: 4px solid #2563eb; }
        .comparables-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .comparables-table th, .comparables-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        .comparables-table th { background: #f8fafc; font-weight: 600; }
        .risk-factors { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
        .risk-item { text-align: center; }
        .risk-score { font-size: 24px; font-weight: bold; padding: 10px; border-radius: 50%; width: 50px; height: 50px; line-height: 30px; margin: 0 auto; }
        .risk-low { background: #dcfce7; color: #059669; }
        .risk-medium { background: #fef3c7; color: #d97706; }
        .risk-high { background: #fecaca; color: #dc2626; }
    </style>
</head>
<body>
    <div class="header">
        <div class="bristol-logo">BRISTOL DEVELOPMENT GROUP</div>
        <h1>Property Analysis Report</h1>
        <p>Generated by Bristol A.I. Elite • ${new Date().toLocaleDateString()}</p>
    </div>

    <div class="section">
        <h2>Executive Summary</h2>
        <div class="recommendation ${recommendation.action}">
            <h3>Recommendation: ${recommendation.action.toUpperCase()}</h3>
            <p><strong>Confidence:</strong> ${(recommendation.confidence * 100).toFixed(1)}%</p>
            <p><strong>Target Price:</strong> $${recommendation.targetPrice.toLocaleString()}</p>
        </div>
    </div>`;

    if (customizations.includeFinancialProjections) {
      html += `
    <div class="section">
        <h2>Financial Analysis</h2>
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-value">${analysis.irr.toFixed(1)}%</div>
                <div class="metric-label">IRR</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">$${(analysis.npv / 1000).toFixed(0)}K</div>
                <div class="metric-label">NPV</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${analysis.capRate.toFixed(1)}%</div>
                <div class="metric-label">Cap Rate</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${analysis.cashOnCash.toFixed(1)}%</div>
                <div class="metric-label">Cash on Cash</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${analysis.dscr.toFixed(2)}x</div>
                <div class="metric-label">DSCR</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${analysis.leverageRatio.toFixed(1)}%</div>
                <div class="metric-label">Leverage Ratio</div>
            </div>
        </div>
    </div>`;
    }

    if (customizations.includeRiskAnalysis) {
      html += `
    <div class="section">
        <h2>Risk Assessment</h2>
        <div class="risk-factors">
            <div class="risk-item">
                <div class="risk-score ${this.getRiskClass(riskAssessment.market)}">${riskAssessment.market}</div>
                <div>Market Risk</div>
            </div>
            <div class="risk-item">
                <div class="risk-score ${this.getRiskClass(riskAssessment.financial)}">${riskAssessment.financial}</div>
                <div>Financial Risk</div>
            </div>
            <div class="risk-item">
                <div class="risk-score ${this.getRiskClass(riskAssessment.location)}">${riskAssessment.location}</div>
                <div>Location Risk</div>
            </div>
            <div class="risk-item">
                <div class="risk-score ${this.getRiskClass(riskAssessment.regulatory)}">${riskAssessment.regulatory}</div>
                <div>Regulatory Risk</div>
            </div>
        </div>
        <div style="margin-top: 20px;">
            <h4>Risk Factors:</h4>
            <ul>
                ${riskAssessment.factors.map(factor => `<li>${factor}</li>`).join('')}
            </ul>
        </div>
    </div>`;
    }

    if (customizations.includeComparables && marketComparables.length > 0) {
      html += `
    <div class="section">
        <h2>Market Comparables</h2>
        <table class="comparables-table">
            <thead>
                <tr>
                    <th>Address</th>
                    <th>Sale Price</th>
                    <th>Price/SF</th>
                    <th>Cap Rate</th>
                    <th>Distance</th>
                    <th>Similarity</th>
                </tr>
            </thead>
            <tbody>
                ${marketComparables.slice(0, 10).map(comp => `
                <tr>
                    <td>${comp.address}</td>
                    <td>$${comp.salePrice.toLocaleString()}</td>
                    <td>$${comp.pricePerSqft.toFixed(0)}</td>
                    <td>${comp.capRate.toFixed(1)}%</td>
                    <td>${comp.distance.toFixed(1)} mi</td>
                    <td>${(comp.similarity * 100).toFixed(0)}%</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>`;
    }

    html += `
    <div class="section">
        <h2>Investment Reasoning</h2>
        <ul>
            ${recommendation.reasoning.map(reason => `<li>${reason}</li>`).join('')}
        </ul>
    </div>

    <div class="section">
        <h2>Expected Returns</h2>
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-value">${recommendation.expectedReturns.year1.toFixed(1)}%</div>
                <div class="metric-label">Year 1 Return</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${recommendation.expectedReturns.year5.toFixed(1)}%</div>
                <div class="metric-label">5-Year Average</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${recommendation.expectedReturns.year10.toFixed(1)}%</div>
                <div class="metric-label">10-Year IRR</div>
            </div>
        </div>
    </div>

    <footer style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
        <p>Report generated by Bristol A.I. Elite • Proprietary and Confidential • ${new Date().toISOString()}</p>
    </footer>
</body>
</html>`;

    return html;
  }

  private getRiskClass(riskScore: number): string {
    if (riskScore <= 4) return 'risk-low';
    if (riskScore <= 7) return 'risk-medium';
    return 'risk-high';
  }

  private generatePropertyAnalysisExcel(data: PropertyAnalysisResult): string {
    // Simplified Excel generation (would use actual library in production)
    const csv = [
      ['Metric', 'Value'],
      ['IRR (%)', data.analysis.irr.toFixed(2)],
      ['NPV ($)', data.analysis.npv.toFixed(0)],
      ['Cap Rate (%)', data.analysis.capRate.toFixed(2)],
      ['Cash on Cash (%)', data.analysis.cashOnCash.toFixed(2)],
      ['DSCR', data.analysis.dscr.toFixed(2)],
      ['Leverage Ratio (%)', data.analysis.leverageRatio.toFixed(2)],
      ['Recommendation', data.recommendation.action],
      ['Confidence (%)', (data.recommendation.confidence * 100).toFixed(1)],
      ['Target Price ($)', data.recommendation.targetPrice.toFixed(0)]
    ].map(row => row.join(',')).join('\n');

    return csv;
  }

  private async generateMarketReport(
    marketData: SearchResult,
    customizations: ReportCustomizations
  ): Promise<GeneratedReport> {
    const reportId = `market-report-${Date.now()}`;
    
    let content = `
<!DOCTYPE html>
<html>
<head>
    <title>Market Report</title>
    <style>
        body { font-family: 'Segoe UI', system-ui, sans-serif; margin: 40px; color: #333; }
        .header { background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; }
        .bristol-logo { color: #fbbf24; font-size: 24px; font-weight: bold; }
        .section { margin: 30px 0; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
        .stat-card { background: #f8fafc; padding: 15px; border-radius: 6px; text-align: center; }
        .stat-value { font-size: 24px; font-weight: bold; color: #059669; }
        .stat-label { font-size: 14px; color: #6b7280; margin-top: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="bristol-logo">BRISTOL DEVELOPMENT GROUP</div>
        <h1>Market Intelligence Report</h1>
        <p>Generated by Bristol A.I. Elite • ${new Date().toLocaleDateString()}</p>
    </div>

    <div class="section">
        <h2>Market Overview</h2>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${marketData.totalCount}</div>
                <div class="stat-label">Total Properties</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${marketData.properties.length}</div>
                <div class="stat-label">Properties Analyzed</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${marketData.facets.locations.length}</div>
                <div class="stat-label">Markets Covered</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${marketData.executionTime}ms</div>
                <div class="stat-label">Analysis Time</div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>Market Segments</h2>
        <h3>By Property Type</h3>
        ${marketData.facets.propertyTypes.map(type => `
        <p><strong>${type.type}:</strong> ${type.count} properties</p>
        `).join('')}
        
        <h3>By Location</h3>
        ${marketData.facets.locations.map(loc => `
        <p><strong>${loc.location}:</strong> ${loc.count} properties</p>
        `).join('')}
    </div>
</body>
</html>`;

    return {
      id: reportId,
      type: 'market-report',
      title: `Market Intelligence Report`,
      content,
      format: customizations.format,
      downloadUrl: `/api/reports/download/${reportId}`,
      metadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: 'Bristol A.I. Elite',
        dataPoints: marketData.totalCount,
        customizations
      }
    };
  }

  private async generatePortfolioSummary(
    portfolioData: any,
    customizations: ReportCustomizations
  ): Promise<GeneratedReport> {
    const reportId = `portfolio-summary-${Date.now()}`;
    
    const content = `
<!DOCTYPE html>
<html>
<head>
    <title>Portfolio Summary</title>
    <style>
        body { font-family: 'Segoe UI', system-ui, sans-serif; margin: 40px; color: #333; }
        .header { background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; }
        .bristol-logo { color: #fbbf24; font-size: 24px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <div class="bristol-logo">BRISTOL DEVELOPMENT GROUP</div>
        <h1>Portfolio Performance Summary</h1>
        <p>Generated by Bristol A.I. Elite • ${new Date().toLocaleDateString()}</p>
    </div>
    
    <p>Portfolio summary report would be generated here based on provided data.</p>
</body>
</html>`;

    return {
      id: reportId,
      type: 'portfolio-summary',
      title: 'Portfolio Performance Summary',
      content,
      format: customizations.format,
      downloadUrl: `/api/reports/download/${reportId}`,
      metadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: 'Bristol A.I. Elite',
        dataPoints: 0,
        customizations
      }
    };
  }

  private async generateInvestmentMemo(
    memoData: any,
    customizations: ReportCustomizations
  ): Promise<GeneratedReport> {
    const reportId = `investment-memo-${Date.now()}`;
    
    const content = `
<!DOCTYPE html>
<html>
<head>
    <title>Investment Memorandum</title>
    <style>
        body { font-family: 'Segoe UI', system-ui, sans-serif; margin: 40px; color: #333; }
        .header { background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; }
        .bristol-logo { color: #fbbf24; font-size: 24px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <div class="bristol-logo">BRISTOL DEVELOPMENT GROUP</div>
        <h1>Investment Memorandum</h1>
        <p>Generated by Bristol A.I. Elite • ${new Date().toLocaleDateString()}</p>
    </div>
    
    <p>Investment memo would be generated here based on provided data.</p>
</body>
</html>`;

    return {
      id: reportId,
      type: 'investment-memo',
      title: 'Investment Memorandum',
      content,
      format: customizations.format,
      downloadUrl: `/api/reports/download/${reportId}`,
      metadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: 'Bristol A.I. Elite',
        dataPoints: 0,
        customizations
      }
    };
  }

  private async getUserReportPreferences(userId: string): Promise<ReportCustomizations> {
    try {
      const context = await advancedMemoryService.getRelevantContext(
        userId,
        'report-preferences',
        'Get my report preferences',
        5
      );

      // Extract preferences from memory with defaults
      return {
        includeCharts: true,
        includeComparables: true,
        includeRiskAnalysis: true,
        includeFinancialProjections: true,
        executiveSummaryOnly: false,
        brandedTemplate: true,
        format: 'html'
      };

    } catch (error) {
      console.error('Error getting user report preferences:', error);
      return {
        includeCharts: true,
        includeComparables: true,
        includeRiskAnalysis: true,
        includeFinancialProjections: true,
        executiveSummaryOnly: false,
        brandedTemplate: true,
        format: 'html'
      };
    }
  }

  private async learnReportPreferences(
    userId: string,
    reportType: string,
    customizations: ReportCustomizations
  ): Promise<void> {
    await advancedMemoryService.storeMemory(
      userId,
      `report-prefs-${Date.now()}`,
      `Report preferences for ${reportType}: ${JSON.stringify(customizations)}`,
      'preference',
      { importance: 6, confidence: 0.9 }
    );
  }

  private countAnalysisDataPoints(data: PropertyAnalysisResult): number {
    return (
      Object.keys(data.analysis).length +
      data.marketComparables.length +
      data.riskAssessment.factors.length +
      data.recommendation.reasoning.length
    );
  }

  // Memory-based report customization
  async getReportCustomizationSuggestions(userId: string): Promise<ReportCustomizations[]> {
    try {
      const context = await advancedMemoryService.getRelevantContext(
        userId,
        'report-suggestions',
        'Suggest report customizations based on my history',
        10
      );

      // Analyze past report preferences
      const suggestions: ReportCustomizations[] = [];
      
      // Default comprehensive option
      suggestions.push({
        includeCharts: true,
        includeComparables: true,
        includeRiskAnalysis: true,
        includeFinancialProjections: true,
        executiveSummaryOnly: false,
        brandedTemplate: true,
        format: 'html'
      });

      // Executive summary option
      suggestions.push({
        includeCharts: false,
        includeComparables: false,
        includeRiskAnalysis: true,
        includeFinancialProjections: true,
        executiveSummaryOnly: true,
        brandedTemplate: true,
        format: 'html'
      });

      // Excel data export
      suggestions.push({
        includeCharts: false,
        includeComparables: true,
        includeRiskAnalysis: false,
        includeFinancialProjections: true,
        executiveSummaryOnly: false,
        brandedTemplate: false,
        format: 'excel'
      });

      return suggestions;

    } catch (error) {
      console.error('Error generating report suggestions:', error);
      return [];
    }
  }
}

export const reportGenerationService = new ReportGenerationService();