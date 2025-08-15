// Enterprise API Endpoints for Bristol Development Group
// Provides comprehensive enterprise-grade endpoints for all business functions

import { Router } from "express";
import { masterOrchestrator } from "../enterprise/masterOrchestrator";
import { dataAnalyticsEngine } from "../enterprise/dataAnalytics";
import { complianceEngine } from "../enterprise/complianceEngine";
import { securityEngine } from "../enterprise/securityEngine";
import { reportingEngine } from "../enterprise/reportingEngine";
import { z } from "zod";

const router = Router();

// Input validation schemas
const analyticsQuerySchema = z.object({
  dateRange: z.object({
    start: z.string().transform(str => new Date(str)),
    end: z.string().transform(str => new Date(str))
  }).optional(),
  geography: z.object({
    cities: z.array(z.string()).optional(),
    states: z.array(z.string()).optional(),
    regions: z.array(z.string()).optional()
  }).optional(),
  propertyTypes: z.array(z.string()).optional(),
  metrics: z.array(z.string()).optional(),
  aggregation: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']).optional()
});

const reportGenerationSchema = z.object({
  templateId: z.string(),
  parameters: z.record(z.any()).optional(),
  format: z.enum(['pdf', 'excel', 'json', 'html']).optional(),
  deliverTo: z.array(z.string()).optional()
});

const workflowExecutionSchema = z.object({
  workflowId: z.string(),
  parameters: z.record(z.any()).optional()
});

// ===== SYSTEM HEALTH & MONITORING =====

/**
 * GET /api/enterprise/health
 * Get comprehensive system health status
 */
router.get("/health", async (req, res) => {
  try {
    const health = await masterOrchestrator.getSystemHealth();
    res.json({
      ok: true,
      data: health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Enterprise health check error:", error);
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Health check failed",
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/enterprise/dashboard
 * Get enterprise dashboard with all key metrics
 */
router.get("/dashboard", async (req, res) => {
  try {
    const dashboard = await masterOrchestrator.getEnterpriseDashboard();
    res.json({
      ok: true,
      data: dashboard,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Enterprise dashboard error:", error);
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Dashboard generation failed",
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/enterprise/systems/status
 * Get detailed status of all enterprise systems
 */
router.get("/systems/status", async (req, res) => {
  try {
    const systemStatuses = await masterOrchestrator.getSystemStatuses();
    res.json({
      ok: true,
      data: {
        systems: systemStatuses,
        lastUpdate: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("System status error:", error);
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "System status check failed"
    });
  }
});

// ===== DATA ANALYTICS =====

/**
 * POST /api/enterprise/analytics/market-intelligence
 * Generate comprehensive market intelligence report
 */
router.post("/analytics/market-intelligence", async (req, res) => {
  try {
    const query = analyticsQuerySchema.parse(req.body);
    const marketIntelligence = await dataAnalyticsEngine.generateMarketIntelligence(query);
    
    res.json({
      ok: true,
      data: marketIntelligence,
      metadata: {
        query,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Market intelligence error:", error);
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Market intelligence generation failed"
    });
  }
});

/**
 * GET /api/enterprise/analytics/portfolio
 * Get comprehensive portfolio analytics
 */
router.get("/analytics/portfolio", async (req, res) => {
  try {
    const portfolioAnalytics = await dataAnalyticsEngine.generatePortfolioAnalytics();
    
    res.json({
      ok: true,
      data: portfolioAnalytics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Portfolio analytics error:", error);
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Portfolio analytics generation failed"
    });
  }
});

/**
 * POST /api/enterprise/analytics/risk-assessment
 * Generate comprehensive risk assessment
 */
router.post("/analytics/risk-assessment", async (req, res) => {
  try {
    const query = analyticsQuerySchema.parse(req.body);
    const riskAnalytics = await dataAnalyticsEngine.generateRiskAnalytics(query);
    
    res.json({
      ok: true,
      data: riskAnalytics,
      metadata: {
        query,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Risk assessment error:", error);
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Risk assessment generation failed"
    });
  }
});

/**
 * POST /api/enterprise/analytics/time-series
 * Generate time series analytics for specific metrics
 */
router.post("/analytics/time-series", async (req, res) => {
  try {
    const { metric, ...query } = analyticsQuerySchema.extend({
      metric: z.string()
    }).parse(req.body);
    
    const timeSeriesData = await dataAnalyticsEngine.generateTimeSeriesAnalytics(metric, query);
    
    res.json({
      ok: true,
      data: timeSeriesData,
      metadata: {
        metric,
        query,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Time series analytics error:", error);
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Time series analytics generation failed"
    });
  }
});

/**
 * POST /api/enterprise/analytics/predictive
 * Generate predictive analytics models
 */
router.post("/analytics/predictive", async (req, res) => {
  try {
    const { metric, lookAhead = 12 } = z.object({
      metric: z.string(),
      lookAhead: z.number().optional()
    }).parse(req.body);
    
    const predictions = await dataAnalyticsEngine.generatePredictiveModels(metric, lookAhead);
    
    res.json({
      ok: true,
      data: predictions,
      metadata: {
        metric,
        lookAhead,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Predictive analytics error:", error);
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Predictive analytics generation failed"
    });
  }
});

// ===== COMPLIANCE MANAGEMENT =====

/**
 * GET /api/enterprise/compliance/status
 * Get current compliance status
 */
router.get("/compliance/status", async (req, res) => {
  try {
    const complianceStatus = await complianceEngine.getComplianceStatus();
    res.json({
      ok: true,
      data: complianceStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Compliance status error:", error);
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Compliance status check failed"
    });
  }
});

/**
 * POST /api/enterprise/compliance/check
 * Run compliance checks
 */
router.post("/compliance/check", async (req, res) => {
  try {
    const { ruleId } = z.object({
      ruleId: z.string().optional()
    }).parse(req.body);
    
    const violations = await complianceEngine.runComplianceCheck(ruleId);
    
    res.json({
      ok: true,
      data: {
        violations,
        checkedAt: new Date().toISOString(),
        ruleId: ruleId || 'all'
      }
    });
  } catch (error) {
    console.error("Compliance check error:", error);
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Compliance check failed"
    });
  }
});

/**
 * POST /api/enterprise/compliance/risk-assessment
 * Generate compliance risk assessment
 */
router.post("/compliance/risk-assessment", async (req, res) => {
  try {
    const riskAssessment = await complianceEngine.generateComplianceRiskAssessment();
    
    res.json({
      ok: true,
      data: riskAssessment,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Compliance risk assessment error:", error);
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Compliance risk assessment failed"
    });
  }
});

// ===== SECURITY MANAGEMENT =====

/**
 * GET /api/enterprise/security/dashboard
 * Get security dashboard overview
 */
router.get("/security/dashboard", async (req, res) => {
  try {
    const securityDashboard = await securityEngine.getSecurityDashboard();
    res.json({
      ok: true,
      data: securityDashboard,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Security dashboard error:", error);
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Security dashboard generation failed"
    });
  }
});

/**
 * POST /api/enterprise/security/log-event
 * Log a security event
 */
router.post("/security/log-event", async (req, res) => {
  try {
    const eventData = z.object({
      type: z.enum(['authentication', 'authorization', 'data_access', 'system_change', 'suspicious_activity']),
      severity: z.enum(['info', 'low', 'medium', 'high', 'critical']),
      description: z.string(),
      metadata: z.record(z.any()).optional(),
      userId: z.string().optional(),
      ipAddress: z.string().optional(),
      userAgent: z.string().optional()
    }).parse(req.body);
    
    const event = await securityEngine.logSecurityEvent(
      eventData.type,
      eventData.severity,
      eventData.description,
      eventData.metadata || {},
      eventData.userId,
      eventData.ipAddress,
      eventData.userAgent
    );
    
    res.json({
      ok: true,
      data: event
    });
  } catch (error) {
    console.error("Security event logging error:", error);
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Security event logging failed"
    });
  }
});

/**
 * POST /api/enterprise/security/check-access
 * Check access permissions
 */
router.post("/security/check-access", async (req, res) => {
  try {
    const accessData = z.object({
      userId: z.string(),
      resource: z.string(),
      action: z.string(),
      context: z.record(z.any()).optional()
    }).parse(req.body);
    
    const accessResult = await securityEngine.checkAccessPermission(
      accessData.userId,
      accessData.resource,
      accessData.action,
      accessData.context || {}
    );
    
    res.json({
      ok: true,
      data: accessResult
    });
  } catch (error) {
    console.error("Access check error:", error);
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Access check failed"
    });
  }
});

// ===== REPORTING ENGINE =====

/**
 * GET /api/enterprise/reports/templates
 * Get available report templates
 */
router.get("/reports/templates", async (req, res) => {
  try {
    const templates = await reportingEngine.getReportTemplates();
    res.json({
      ok: true,
      data: templates
    });
  } catch (error) {
    console.error("Report templates error:", error);
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Failed to get report templates"
    });
  }
});

/**
 * POST /api/enterprise/reports/generate
 * Generate a report from template
 */
router.post("/reports/generate", async (req, res) => {
  try {
    const reportRequest = reportGenerationSchema.parse(req.body);
    
    const report = await reportingEngine.generateReport(
      reportRequest.templateId,
      reportRequest.parameters || {}
    );
    
    res.json({
      ok: true,
      data: report
    });
  } catch (error) {
    console.error("Report generation error:", error);
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Report generation failed"
    });
  }
});

/**
 * GET /api/enterprise/reports/history
 * Get report generation history
 */
router.get("/reports/history", async (req, res) => {
  try {
    const { limit = 50 } = z.object({
      limit: z.number().optional()
    }).parse(req.query);
    
    const history = await reportingEngine.getReportHistory(limit);
    
    res.json({
      ok: true,
      data: history
    });
  } catch (error) {
    console.error("Report history error:", error);
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Failed to get report history"
    });
  }
});

/**
 * GET /api/enterprise/dashboards
 * Get available dashboards
 */
router.get("/dashboards", async (req, res) => {
  try {
    const userId = req.headers['user-id'] as string || 'demo-user';
    const dashboards = await reportingEngine.getDashboards(userId);
    
    res.json({
      ok: true,
      data: dashboards
    });
  } catch (error) {
    console.error("Dashboards error:", error);
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Failed to get dashboards"
    });
  }
});

/**
 * GET /api/enterprise/dashboards/:id
 * Get dashboard data
 */
router.get("/dashboards/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['user-id'] as string || 'demo-user';
    
    const dashboardData = await reportingEngine.getDashboardData(id, userId);
    
    res.json({
      ok: true,
      data: dashboardData
    });
  } catch (error) {
    console.error("Dashboard data error:", error);
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Failed to get dashboard data"
    });
  }
});

// ===== WORKFLOW MANAGEMENT =====

/**
 * GET /api/enterprise/workflows
 * Get available workflow definitions
 */
router.get("/workflows", async (req, res) => {
  try {
    const workflows = await masterOrchestrator.getWorkflowDefinitions();
    res.json({
      ok: true,
      data: workflows
    });
  } catch (error) {
    console.error("Workflows error:", error);
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Failed to get workflows"
    });
  }
});

/**
 * POST /api/enterprise/workflows/execute
 * Execute a workflow
 */
router.post("/workflows/execute", async (req, res) => {
  try {
    const workflowRequest = workflowExecutionSchema.parse(req.body);
    
    const execution = await masterOrchestrator.executeWorkflow(
      workflowRequest.workflowId,
      workflowRequest.parameters || {}
    );
    
    res.json({
      ok: true,
      data: execution
    });
  } catch (error) {
    console.error("Workflow execution error:", error);
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Workflow execution failed"
    });
  }
});

/**
 * GET /api/enterprise/workflows/active
 * Get currently active workflows
 */
router.get("/workflows/active", async (req, res) => {
  try {
    const activeWorkflows = await masterOrchestrator.getActiveWorkflows();
    res.json({
      ok: true,
      data: activeWorkflows
    });
  } catch (error) {
    console.error("Active workflows error:", error);
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Failed to get active workflows"
    });
  }
});

/**
 * GET /api/enterprise/workflows/scheduled
 * Get scheduled reports and workflows
 */
router.get("/workflows/scheduled", async (req, res) => {
  try {
    const scheduledReports = await reportingEngine.getScheduledReports();
    res.json({
      ok: true,
      data: {
        reports: scheduledReports,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Scheduled workflows error:", error);
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Failed to get scheduled workflows"
    });
  }
});

export default router;