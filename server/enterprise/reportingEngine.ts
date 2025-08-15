// Enterprise Reporting Engine for Bristol Development Group
// Provides comprehensive reporting, dashboards, and business intelligence

import { db } from "../db";
import { sites, siteMetrics, compsAnnex, agentDecisions, chatSessions, integrationLogs } from "@shared/schema";
import { eq, sql, and, gte, lte, desc, count, avg, sum } from "drizzle-orm";
import { dataAnalyticsEngine } from "./dataAnalytics";
import { complianceEngine } from "./complianceEngine";
import { securityEngine } from "./securityEngine";

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'executive' | 'operational' | 'financial' | 'compliance' | 'technical';
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually' | 'on_demand';
  recipients: string[];
  parameters: Record<string, any>;
  sqlQueries?: string[];
  dataSource: 'database' | 'analytics' | 'external_api' | 'combined';
  format: 'pdf' | 'excel' | 'json' | 'html' | 'dashboard';
  autoSchedule: boolean;
  lastGenerated?: Date;
  nextScheduled?: Date;
}

interface ReportData {
  id: string;
  templateId: string;
  title: string;
  generatedAt: Date;
  generatedBy: string;
  format: string;
  data: any;
  metadata: {
    parameters: Record<string, any>;
    executionTime: number;
    dataSource: string;
    recordCount: number;
  };
  deliveryStatus: 'pending' | 'sent' | 'failed';
  deliveredAt?: Date;
}

interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'map' | 'gauge' | 'trend';
  title: string;
  dataSource: string;
  query: string;
  refreshInterval: number; // seconds
  parameters: Record<string, any>;
  visualization: {
    chartType?: 'line' | 'bar' | 'pie' | 'scatter' | 'heatmap';
    colors?: string[];
    layout?: Record<string, any>;
  };
  permissions: {
    viewRoles: string[];
    editRoles: string[];
  };
}

interface Dashboard {
  id: string;
  name: string;
  description: string;
  category: 'executive' | 'operations' | 'analytics' | 'compliance';
  widgets: DashboardWidget[];
  layout: Array<{
    widgetId: string;
    position: { x: number; y: number; width: number; height: number };
  }>;
  permissions: {
    viewRoles: string[];
    editRoles: string[];
  };
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  lastModified: Date;
}

export class ReportingEngine {
  private reportTemplates: ReportTemplate[] = [];
  private dashboards: Dashboard[] = [];
  private reportHistory: ReportData[] = [];

  constructor() {
    this.initializeDefaultTemplates();
    this.initializeDefaultDashboards();
  }

  private initializeDefaultTemplates(): void {
    this.reportTemplates = [
      {
        id: 'EXEC_WEEKLY_SUMMARY',
        name: 'Executive Weekly Summary',
        description: 'High-level summary of key metrics and portfolio performance',
        category: 'executive',
        frequency: 'weekly',
        recipients: ['executives@bristol.com'],
        parameters: {
          includePortfolioPerformance: true,
          includeMarketTrends: true,
          includeRiskMetrics: true,
          includeMajorTransactions: true
        },
        dataSource: 'combined',
        format: 'pdf',
        autoSchedule: true
      },
      {
        id: 'PORTFOLIO_MONTHLY',
        name: 'Monthly Portfolio Performance Report',
        description: 'Detailed portfolio analysis with property-level metrics',
        category: 'operational',
        frequency: 'monthly',
        recipients: ['portfolio@bristol.com', 'analysts@bristol.com'],
        parameters: {
          includePropertyMetrics: true,
          includeComparableAnalysis: true,
          includeOccupancyTrends: true,
          includeFinancialMetrics: true
        },
        dataSource: 'analytics',
        format: 'excel',
        autoSchedule: true
      },
      {
        id: 'COMPLIANCE_QUARTERLY',
        name: 'Quarterly Compliance Report',
        description: 'Comprehensive compliance status and regulatory updates',
        category: 'compliance',
        frequency: 'quarterly',
        recipients: ['compliance@bristol.com', 'legal@bristol.com'],
        parameters: {
          includeViolations: true,
          includeRiskAssessment: true,
          includeRegulatoryChanges: true,
          includeAuditResults: true
        },
        dataSource: 'combined',
        format: 'pdf',
        autoSchedule: true
      },
      {
        id: 'MARKET_ANALYSIS_WEEKLY',
        name: 'Weekly Market Intelligence Report',
        description: 'Market trends, competitive analysis, and investment opportunities',
        category: 'financial',
        frequency: 'weekly',
        recipients: ['acquisitions@bristol.com', 'analysts@bristol.com'],
        parameters: {
          includeMarketTrends: true,
          includeCompetitorActivity: true,
          includeNewOpportunities: true,
          includePricingAnalysis: true
        },
        dataSource: 'analytics',
        format: 'html',
        autoSchedule: true
      },
      {
        id: 'TECHNICAL_DAILY',
        name: 'Daily System Health Report',
        description: 'System performance, security events, and operational metrics',
        category: 'technical',
        frequency: 'daily',
        recipients: ['it@bristol.com', 'security@bristol.com'],
        parameters: {
          includeSystemMetrics: true,
          includeSecurityEvents: true,
          includeIntegrationStatus: true,
          includePerformanceMetrics: true
        },
        dataSource: 'database',
        format: 'json',
        autoSchedule: true
      }
    ];

    // Schedule initial reports
    this.scheduleReports();
  }

  private initializeDefaultDashboards(): void {
    this.dashboards = [
      {
        id: 'EXEC_DASHBOARD',
        name: 'Executive Dashboard',
        description: 'High-level KPIs and portfolio overview for executives',
        category: 'executive',
        widgets: [
          {
            id: 'portfolio_value',
            type: 'metric',
            title: 'Total Portfolio Value',
            dataSource: 'analytics',
            query: 'SELECT SUM(estimated_value) FROM portfolio_summary',
            refreshInterval: 3600,
            parameters: {},
            visualization: { colors: ['#2563eb'] },
            permissions: { viewRoles: ['executive', 'analyst'], editRoles: ['admin'] }
          },
          {
            id: 'occupancy_trend',
            type: 'chart',
            title: 'Portfolio Occupancy Trend',
            dataSource: 'analytics',
            query: 'SELECT month, avg_occupancy FROM monthly_occupancy ORDER BY month',
            refreshInterval: 1800,
            parameters: { timeframe: '12M' },
            visualization: { chartType: 'line', colors: ['#059669'] },
            permissions: { viewRoles: ['executive', 'analyst'], editRoles: ['admin'] }
          },
          {
            id: 'market_performance',
            type: 'chart',
            title: 'Market Performance Comparison',
            dataSource: 'analytics',
            query: 'SELECT market, performance_index FROM market_comparison',
            refreshInterval: 3600,
            parameters: {},
            visualization: { chartType: 'bar', colors: ['#dc2626', '#059669'] },
            permissions: { viewRoles: ['executive', 'analyst'], editRoles: ['admin'] }
          }
        ],
        layout: [
          { widgetId: 'portfolio_value', position: { x: 0, y: 0, width: 4, height: 2 } },
          { widgetId: 'occupancy_trend', position: { x: 4, y: 0, width: 8, height: 4 } },
          { widgetId: 'market_performance', position: { x: 0, y: 2, width: 4, height: 4 } }
        ],
        permissions: { viewRoles: ['executive'], editRoles: ['admin'] },
        isPublic: false,
        createdBy: 'system',
        createdAt: new Date(),
        lastModified: new Date()
      },
      {
        id: 'OPERATIONS_DASHBOARD',
        name: 'Operations Dashboard',
        description: 'Operational metrics and property management KPIs',
        category: 'operations',
        widgets: [
          {
            id: 'property_count',
            type: 'metric',
            title: 'Total Properties',
            dataSource: 'database',
            query: 'SELECT COUNT(*) as count FROM sites',
            refreshInterval: 900,
            parameters: {},
            visualization: { colors: ['#2563eb'] },
            permissions: { viewRoles: ['operations', 'analyst'], editRoles: ['admin'] }
          },
          {
            id: 'maintenance_requests',
            type: 'gauge',
            title: 'Open Maintenance Requests',
            dataSource: 'database',
            query: 'SELECT COUNT(*) as count FROM maintenance_requests WHERE status = "open"',
            refreshInterval: 300,
            parameters: {},
            visualization: { colors: ['#dc2626'] },
            permissions: { viewRoles: ['operations', 'maintenance'], editRoles: ['admin'] }
          },
          {
            id: 'lease_expirations',
            type: 'table',
            title: 'Upcoming Lease Expirations',
            dataSource: 'database',
            query: 'SELECT property, tenant, expiration_date FROM leases WHERE expiration_date <= CURRENT_DATE + INTERVAL "90 days"',
            refreshInterval: 3600,
            parameters: {},
            visualization: {},
            permissions: { viewRoles: ['operations', 'leasing'], editRoles: ['admin'] }
          }
        ],
        layout: [
          { widgetId: 'property_count', position: { x: 0, y: 0, width: 3, height: 2 } },
          { widgetId: 'maintenance_requests', position: { x: 3, y: 0, width: 3, height: 2 } },
          { widgetId: 'lease_expirations', position: { x: 0, y: 2, width: 6, height: 4 } }
        ],
        permissions: { viewRoles: ['operations', 'manager'], editRoles: ['admin'] },
        isPublic: false,
        createdBy: 'system',
        createdAt: new Date(),
        lastModified: new Date()
      }
    ];
  }

  // Report Generation
  async generateReport(templateId: string, parameters: Record<string, any> = {}): Promise<ReportData> {
    const template = this.reportTemplates.find(t => t.id === templateId);
    if (!template) {
      throw new Error(`Report template not found: ${templateId}`);
    }

    const startTime = Date.now();
    const reportId = `REPORT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      let reportData: any;

      switch (template.dataSource) {
        case 'database':
          reportData = await this.generateDatabaseReport(template, parameters);
          break;
        case 'analytics':
          reportData = await this.generateAnalyticsReport(template, parameters);
          break;
        case 'external_api':
          reportData = await this.generateExternalAPIReport(template, parameters);
          break;
        case 'combined':
          reportData = await this.generateCombinedReport(template, parameters);
          break;
        default:
          throw new Error(`Unsupported data source: ${template.dataSource}`);
      }

      const executionTime = Date.now() - startTime;

      const report: ReportData = {
        id: reportId,
        templateId,
        title: `${template.name} - ${new Date().toLocaleDateString()}`,
        generatedAt: new Date(),
        generatedBy: 'system', // Would be actual user in production
        format: template.format,
        data: reportData,
        metadata: {
          parameters: { ...template.parameters, ...parameters },
          executionTime,
          dataSource: template.dataSource,
          recordCount: this.getRecordCount(reportData)
        },
        deliveryStatus: 'pending'
      };

      this.reportHistory.push(report);

      // Auto-deliver if configured
      if (template.recipients.length > 0) {
        await this.deliverReport(report, template.recipients);
      }

      // Update template last generated timestamp
      template.lastGenerated = new Date();

      return report;
    } catch (error) {
      console.error(`Error generating report ${templateId}:`, error);
      throw error;
    }
  }

  private async generateDatabaseReport(template: ReportTemplate, parameters: Record<string, any>): Promise<any> {
    const reportData: any = {};

    // Execute SQL queries if defined
    if (template.sqlQueries) {
      for (const query of template.sqlQueries) {
        const result = await db.execute(sql.raw(query));
        reportData[`query_${template.sqlQueries.indexOf(query)}`] = result;
      }
    }

    // Generate standard sections based on template category
    switch (template.category) {
      case 'technical':
        reportData.systemMetrics = await this.getSystemMetrics();
        reportData.securityEvents = await this.getSecurityEvents();
        reportData.integrationStatus = await this.getIntegrationStatus();
        break;
      case 'operational':
        reportData.portfolioSummary = await this.getPortfolioSummary();
        reportData.propertyMetrics = await this.getPropertyMetrics();
        break;
    }

    return reportData;
  }

  private async generateAnalyticsReport(template: ReportTemplate, parameters: Record<string, any>): Promise<any> {
    const reportData: any = {};

    switch (template.category) {
      case 'financial':
        reportData.marketAnalysis = await dataAnalyticsEngine.generateMarketIntelligence({
          dateRange: {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days
            end: new Date()
          }
        });
        reportData.portfolioAnalytics = await dataAnalyticsEngine.generatePortfolioAnalytics();
        break;
      case 'operational':
        reportData.portfolioAnalytics = await dataAnalyticsEngine.generatePortfolioAnalytics();
        reportData.riskMetrics = await dataAnalyticsEngine.generateRiskAnalytics({});
        break;
    }

    return reportData;
  }

  private async generateCombinedReport(template: ReportTemplate, parameters: Record<string, any>): Promise<any> {
    const reportData: any = {};

    switch (template.category) {
      case 'executive':
        // Combine multiple data sources for executive summary
        reportData.portfolioSummary = await this.getPortfolioSummary();
        reportData.marketAnalysis = await dataAnalyticsEngine.generateMarketIntelligence({});
        reportData.riskMetrics = await dataAnalyticsEngine.generateRiskAnalytics({});
        reportData.complianceStatus = await complianceEngine.getComplianceStatus();
        reportData.securitySummary = await securityEngine.getSecurityDashboard();
        break;
      case 'compliance':
        reportData.complianceStatus = await complianceEngine.getComplianceStatus();
        reportData.riskAssessment = await complianceEngine.generateComplianceRiskAssessment();
        reportData.securityEvents = await this.getSecurityEvents();
        break;
    }

    return reportData;
  }

  private async generateExternalAPIReport(template: ReportTemplate, parameters: Record<string, any>): Promise<any> {
    // Implementation for external API data sources
    return { message: 'External API reports not yet implemented' };
  }

  // Dashboard Management
  async createDashboard(dashboard: Omit<Dashboard, 'id' | 'createdAt' | 'lastModified'>): Promise<Dashboard> {
    const newDashboard: Dashboard = {
      ...dashboard,
      id: `DASH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      lastModified: new Date()
    };

    this.dashboards.push(newDashboard);
    return newDashboard;
  }

  async updateDashboard(dashboardId: string, updates: Partial<Dashboard>): Promise<Dashboard> {
    const dashboard = this.dashboards.find(d => d.id === dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard not found: ${dashboardId}`);
    }

    Object.assign(dashboard, updates);
    dashboard.lastModified = new Date();

    return dashboard;
  }

  async getDashboardData(dashboardId: string, userId: string): Promise<{
    dashboard: Dashboard;
    widgetData: Record<string, any>;
  }> {
    const dashboard = this.dashboards.find(d => d.id === dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard not found: ${dashboardId}`);
    }

    // Check permissions (simplified - would use proper RBAC in production)
    // if (!this.checkDashboardPermission(dashboard, userId, 'view')) {
    //   throw new Error('Access denied to dashboard');
    // }

    const widgetData: Record<string, any> = {};

    for (const widget of dashboard.widgets) {
      try {
        widgetData[widget.id] = await this.executeWidgetQuery(widget);
      } catch (error) {
        console.error(`Error executing widget query for ${widget.id}:`, error);
        widgetData[widget.id] = { error: 'Failed to load data' };
      }
    }

    return {
      dashboard,
      widgetData
    };
  }

  private async executeWidgetQuery(widget: DashboardWidget): Promise<any> {
    switch (widget.dataSource) {
      case 'database':
        const result = await db.execute(sql.raw(widget.query));
        return result;
      case 'analytics':
        // Execute analytics queries through dataAnalyticsEngine
        return await this.executeAnalyticsQuery(widget.query, widget.parameters);
      default:
        throw new Error(`Unsupported data source: ${widget.dataSource}`);
    }
  }

  private async executeAnalyticsQuery(query: string, parameters: Record<string, any>): Promise<any> {
    // Route analytics queries to appropriate methods
    if (query.includes('portfolio_summary')) {
      return await dataAnalyticsEngine.generatePortfolioAnalytics();
    } else if (query.includes('market_comparison')) {
      return await dataAnalyticsEngine.generateMarketIntelligence({});
    } else if (query.includes('monthly_occupancy')) {
      return await dataAnalyticsEngine.generateTimeSeriesAnalytics('occupancy_rates', {
        aggregation: 'monthly'
      });
    }

    return { message: 'Query not mapped to analytics function' };
  }

  // Report Delivery
  private async deliverReport(report: ReportData, recipients: string[]): Promise<void> {
    try {
      // In production, would integrate with email service
      console.log(`Delivering report ${report.id} to ${recipients.join(', ')}`);
      
      // Simulate delivery
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      report.deliveryStatus = 'sent';
      report.deliveredAt = new Date();
    } catch (error) {
      console.error(`Failed to deliver report ${report.id}:`, error);
      report.deliveryStatus = 'failed';
    }
  }

  // Scheduling
  private scheduleReports(): void {
    for (const template of this.reportTemplates) {
      if (template.autoSchedule && !template.nextScheduled) {
        template.nextScheduled = this.calculateNextSchedule(template.frequency);
      }
    }
  }

  private calculateNextSchedule(frequency: ReportTemplate['frequency']): Date {
    const now = new Date();
    
    switch (frequency) {
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case 'weekly':
        const nextWeek = new Date(now);
        nextWeek.setDate(now.getDate() + 7);
        return nextWeek;
      case 'monthly':
        const nextMonth = new Date(now);
        nextMonth.setMonth(now.getMonth() + 1);
        return nextMonth;
      case 'quarterly':
        const nextQuarter = new Date(now);
        nextQuarter.setMonth(now.getMonth() + 3);
        return nextQuarter;
      case 'annually':
        const nextYear = new Date(now);
        nextYear.setFullYear(now.getFullYear() + 1);
        return nextYear;
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  // Helper Methods
  private getRecordCount(data: any): number {
    if (Array.isArray(data)) {
      return data.length;
    } else if (typeof data === 'object' && data !== null) {
      return Object.keys(data).length;
    }
    return 1;
  }

  private async getSystemMetrics(): Promise<any> {
    const recentLogs = await db
      .select({
        service: integrationLogs.service,
        successCount: count(),
      })
      .from(integrationLogs)
      .where(
        and(
          eq(integrationLogs.status, 'success'),
          gte(integrationLogs.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000))
        )
      )
      .groupBy(integrationLogs.service);

    return {
      integrationStatus: recentLogs,
      timestamp: new Date().toISOString()
    };
  }

  private async getSecurityEvents(): Promise<any> {
    // Would integrate with security engine
    return await securityEngine.getSecurityDashboard();
  }

  private async getIntegrationStatus(): Promise<any> {
    const integrationStatus = await db
      .select({
        service: integrationLogs.service,
        lastCall: sql<Date>`MAX(${integrationLogs.createdAt})`,
        totalCalls: count(),
        successfulCalls: sql<number>`COUNT(CASE WHEN ${integrationLogs.status} = 'success' THEN 1 END)`,
      })
      .from(integrationLogs)
      .where(gte(integrationLogs.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)))
      .groupBy(integrationLogs.service);

    return integrationStatus;
  }

  private async getPortfolioSummary(): Promise<any> {
    const portfolioSummary = await db
      .select({
        totalProperties: count(sites.id),
        totalUnits: sum(sites.unitsTotal),
        avgSqft: avg(sites.avgSf),
        avgCompletionYear: avg(sites.completionYear),
      })
      .from(sites);

    return portfolioSummary[0];
  }

  private async getPropertyMetrics(): Promise<any> {
    const propertyMetrics = await db
      .select({
        siteId: siteMetrics.siteId,
        metricType: siteMetrics.metricType,
        metricName: siteMetrics.metricName,
        value: siteMetrics.value,
        unit: siteMetrics.unit,
      })
      .from(siteMetrics)
      .orderBy(desc(siteMetrics.createdAt))
      .limit(100);

    return propertyMetrics;
  }

  // Public API Methods
  async getReportTemplates(): Promise<ReportTemplate[]> {
    return this.reportTemplates;
  }

  async getReportHistory(limit: number = 50): Promise<ReportData[]> {
    return this.reportHistory
      .sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime())
      .slice(0, limit);
  }

  async getDashboards(userId: string): Promise<Dashboard[]> {
    // In production, would filter by user permissions
    return this.dashboards;
  }

  async getScheduledReports(): Promise<Array<{ template: ReportTemplate; nextRun: Date }>> {
    return this.reportTemplates
      .filter(t => t.autoSchedule && t.nextScheduled)
      .map(template => ({
        template,
        nextRun: template.nextScheduled!
      }))
      .sort((a, b) => a.nextRun.getTime() - b.nextRun.getTime());
  }
}

export const reportingEngine = new ReportingEngine();