// Master Enterprise Orchestrator for Company Development Group
// Coordinates all enterprise systems and provides unified management interface

import { dataAnalyticsEngine } from "./dataAnalytics";
import { complianceEngine } from "./complianceEngine";
import { securityEngine } from "./securityEngine";
import { reportingEngine } from "./reportingEngine";
import { db } from "../db";
import { sites, integrationLogs } from "@shared/schema";
import { getWebSocketService } from "../services/websocketService";

interface SystemStatus {
  component: string;
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  lastCheck: Date;
  details: string;
  metrics?: Record<string, any>;
}

interface EnterpriseHealth {
  overall: 'healthy' | 'warning' | 'critical';
  systems: SystemStatus[];
  alerts: Array<{
    severity: 'low' | 'medium' | 'high' | 'critical';
    component: string;
    message: string;
    timestamp: Date;
  }>;
  recommendations: string[];
}

interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  steps: Array<{
    id: string;
    type: 'analytics' | 'compliance' | 'security' | 'reporting' | 'data_processing';
    action: string;
    parameters: Record<string, any>;
    dependencies: string[];
    timeout: number;
  }>;
  triggers: Array<{
    type: 'schedule' | 'event' | 'manual';
    condition: string;
    parameters: Record<string, any>;
  }>;
  enabled: boolean;
}

export class MasterEnterpriseOrchestrator {
  private systemStatuses: Map<string, SystemStatus> = new Map();
  private workflows: WorkflowDefinition[] = [];
  private activeWorkflows: Map<string, any> = new Map();

  constructor() {
    this.initializeWorkflows();
    this.startSystemMonitoring();
  }

  // System Health Monitoring
  async getSystemHealth(): Promise<EnterpriseHealth> {
    const systems: SystemStatus[] = [];
    const alerts: EnterpriseHealth['alerts'] = [];

    // Check Analytics Engine
    try {
      const analyticsTest = await dataAnalyticsEngine.generateMarketIntelligence({
        dateRange: {
          start: new Date(Date.now() - 24 * 60 * 60 * 1000),
          end: new Date()
        }
      });
      
      systems.push({
        component: 'Data Analytics Engine',
        status: 'healthy',
        lastCheck: new Date(),
        details: 'Analytics engine operational',
        metrics: {
          totalProperties: analyticsTest.totalProperties,
          averageCapRate: analyticsTest.averageCapRate
        }
      });
    } catch (error) {
      systems.push({
        component: 'Data Analytics Engine',
        status: 'critical',
        lastCheck: new Date(),
        details: `Analytics engine error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      
      alerts.push({
        severity: 'critical',
        component: 'Data Analytics Engine',
        message: 'Analytics engine is not responding',
        timestamp: new Date()
      });
    }

    // Check Compliance Engine
    try {
      const complianceStatus = await complianceEngine.getComplianceStatus();
      
      let status: SystemStatus['status'] = 'healthy';
      if (complianceStatus.overall === 'violation') status = 'critical';
      else if (complianceStatus.overall === 'warning') status = 'warning';
      
      systems.push({
        component: 'Compliance Engine',
        status,
        lastCheck: new Date(),
        details: `Compliance status: ${complianceStatus.overall}`,
        metrics: {
          totalRules: complianceStatus.rules.length,
          violations: complianceStatus.violations.length,
          upcomingDeadlines: complianceStatus.upcomingDeadlines.length
        }
      });

      if (complianceStatus.violations.length > 0) {
        alerts.push({
          severity: 'high',
          component: 'Compliance Engine',
          message: `${complianceStatus.violations.length} compliance violations detected`,
          timestamp: new Date()
        });
      }
    } catch (error) {
      systems.push({
        component: 'Compliance Engine',
        status: 'critical',
        lastCheck: new Date(),
        details: `Compliance engine error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    // Check Security Engine
    try {
      const securityDashboard = await securityEngine.getSecurityDashboard();
      
      let status: SystemStatus['status'] = 'healthy';
      if (securityDashboard.systemHealth.status === 'critical') status = 'critical';
      else if (securityDashboard.systemHealth.status === 'warning') status = 'warning';
      
      systems.push({
        component: 'Security Engine',
        status,
        lastCheck: new Date(),
        details: `Security status: ${securityDashboard.systemHealth.status}`,
        metrics: {
          recentEvents: securityDashboard.recentEvents.length,
          activeIncidents: securityDashboard.activeIncidents.length,
          threatMatches: securityDashboard.threatIndicatorMatches
        }
      });

      if (securityDashboard.alertCounts.critical > 0) {
        alerts.push({
          severity: 'critical',
          component: 'Security Engine',
          message: `${securityDashboard.alertCounts.critical} critical security alerts`,
          timestamp: new Date()
        });
      }
    } catch (error) {
      systems.push({
        component: 'Security Engine',
        status: 'critical',
        lastCheck: new Date(),
        details: `Security engine error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    // Check Database Connectivity
    try {
      const dbTest = await db.select().from(sites).limit(1);
      systems.push({
        component: 'Database',
        status: 'healthy',
        lastCheck: new Date(),
        details: 'Database connection healthy',
        metrics: {
          connectionStatus: 'active',
          lastQuery: new Date().toISOString()
        }
      });
    } catch (error) {
      systems.push({
        component: 'Database',
        status: 'critical',
        lastCheck: new Date(),
        details: `Database error: ${error instanceof Error ? error.message : 'Connection failed'}`
      });
      
      alerts.push({
        severity: 'critical',
        component: 'Database',
        message: 'Database connection lost',
        timestamp: new Date()
      });
    }

    // Check Reporting Engine
    try {
      const reportTemplates = await reportingEngine.getReportTemplates();
      systems.push({
        component: 'Reporting Engine',
        status: 'healthy',
        lastCheck: new Date(),
        details: 'Reporting engine operational',
        metrics: {
          totalTemplates: reportTemplates.length,
          scheduledReports: reportTemplates.filter(t => t.autoSchedule).length
        }
      });
    } catch (error) {
      systems.push({
        component: 'Reporting Engine',
        status: 'warning',
        lastCheck: new Date(),
        details: `Reporting engine issue: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    // Determine overall health
    const criticalSystems = systems.filter(s => s.status === 'critical');
    const warningSystems = systems.filter(s => s.status === 'warning');
    
    let overall: EnterpriseHealth['overall'] = 'healthy';
    if (criticalSystems.length > 0) {
      overall = 'critical';
    } else if (warningSystems.length > 0) {
      overall = 'warning';
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (criticalSystems.length > 0) {
      recommendations.push('Immediate attention required for critical systems');
      recommendations.push('Check system logs and restart affected services');
    }
    if (alerts.length > 5) {
      recommendations.push('High alert volume detected - investigate root causes');
    }
    if (warningSystems.length > 2) {
      recommendations.push('Multiple systems showing warnings - schedule maintenance review');
    }

    return {
      overall,
      systems,
      alerts,
      recommendations
    };
  }

  // Workflow Management
  private initializeWorkflows(): void {
    this.workflows = [
      {
        id: 'DAILY_HEALTH_CHECK',
        name: 'Daily System Health Check',
        description: 'Comprehensive daily health check of all enterprise systems',
        steps: [
          {
            id: 'analytics_check',
            type: 'analytics',
            action: 'health_check',
            parameters: {},
            dependencies: [],
            timeout: 30000
          },
          {
            id: 'compliance_check',
            type: 'compliance',
            action: 'run_compliance_check',
            parameters: {},
            dependencies: [],
            timeout: 60000
          },
          {
            id: 'security_check',
            type: 'security',
            action: 'security_scan',
            parameters: {},
            dependencies: [],
            timeout: 45000
          },
          {
            id: 'generate_report',
            type: 'reporting',
            action: 'generate_health_report',
            parameters: { format: 'json' },
            dependencies: ['analytics_check', 'compliance_check', 'security_check'],
            timeout: 30000
          }
        ],
        triggers: [
          {
            type: 'schedule',
            condition: '0 6 * * *', // Daily at 6 AM
            parameters: {}
          }
        ],
        enabled: true
      },
      {
        id: 'SECURITY_INCIDENT_RESPONSE',
        name: 'Security Incident Response Workflow',
        description: 'Automated response to critical security incidents',
        steps: [
          {
            id: 'assess_threat',
            type: 'security',
            action: 'assess_incident',
            parameters: {},
            dependencies: [],
            timeout: 15000
          },
          {
            id: 'containment',
            type: 'security',
            action: 'contain_threat',
            parameters: {},
            dependencies: ['assess_threat'],
            timeout: 30000
          },
          {
            id: 'notify_team',
            type: 'reporting',
            action: 'send_alert',
            parameters: { priority: 'critical' },
            dependencies: ['assess_threat'],
            timeout: 10000
          },
          {
            id: 'compliance_log',
            type: 'compliance',
            action: 'log_incident',
            parameters: {},
            dependencies: ['assess_threat'],
            timeout: 15000
          }
        ],
        triggers: [
          {
            type: 'event',
            condition: 'security_event.severity == critical',
            parameters: {}
          }
        ],
        enabled: true
      },
      {
        id: 'PORTFOLIO_ANALYSIS_WEEKLY',
        name: 'Weekly Portfolio Analysis',
        description: 'Comprehensive weekly portfolio performance analysis',
        steps: [
          {
            id: 'collect_data',
            type: 'analytics',
            action: 'aggregate_portfolio_data',
            parameters: { timeframe: 'weekly' },
            dependencies: [],
            timeout: 120000
          },
          {
            id: 'analyze_performance',
            type: 'analytics',
            action: 'generate_portfolio_analytics',
            parameters: {},
            dependencies: ['collect_data'],
            timeout: 90000
          },
          {
            id: 'market_comparison',
            type: 'analytics',
            action: 'generate_market_intelligence',
            parameters: {},
            dependencies: ['collect_data'],
            timeout: 60000
          },
          {
            id: 'generate_report',
            type: 'reporting',
            action: 'generate_report',
            parameters: { templateId: 'PORTFOLIO_WEEKLY' },
            dependencies: ['analyze_performance', 'market_comparison'],
            timeout: 60000
          }
        ],
        triggers: [
          {
            type: 'schedule',
            condition: '0 9 * * 1', // Mondays at 9 AM
            parameters: {}
          }
        ],
        enabled: true
      }
    ];
  }

  async executeWorkflow(workflowId: string, parameters: Record<string, any> = {}): Promise<{
    success: boolean;
    workflowId: string;
    executionId: string;
    startTime: Date;
    endTime?: Date;
    results: Record<string, any>;
    errors: Array<{ step: string; error: string }>;
  }> {
    const workflow = this.workflows.find(w => w.id === workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const executionId = `EXEC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = new Date();
    const results: Record<string, any> = {};
    const errors: Array<{ step: string; error: string }> = [];

    try {
      // Execute steps in dependency order
      const executedSteps = new Set<string>();
      const pendingSteps = [...workflow.steps];

      while (pendingSteps.length > 0) {
        const readySteps = pendingSteps.filter(step =>
          step.dependencies.every(dep => executedSteps.has(dep))
        );

        if (readySteps.length === 0) {
          throw new Error('Circular dependency detected in workflow steps');
        }

        // Execute ready steps in parallel
        const stepPromises = readySteps.map(async (step) => {
          try {
            const stepResult = await this.executeWorkflowStep(step, { ...parameters, ...results });
            results[step.id] = stepResult;
            executedSteps.add(step.id);
            
            // Broadcast progress via WebSocket
            const wsService = getWebSocketService();
            if (wsService) {
              wsService.broadcastToAll({
                type: 'workflow_progress',
                data: {
                  workflowId,
                  executionId,
                  step: step.id,
                  status: 'completed',
                  result: stepResult
                },
                timestamp: Date.now()
              });
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            errors.push({ step: step.id, error: errorMessage });
            console.error(`Workflow step ${step.id} failed:`, error);
          }
        });

        await Promise.all(stepPromises);

        // Remove completed steps from pending
        readySteps.forEach(step => {
          const index = pendingSteps.indexOf(step);
          if (index > -1) {
            pendingSteps.splice(index, 1);
          }
        });
      }

      const endTime = new Date();
      
      return {
        success: errors.length === 0,
        workflowId,
        executionId,
        startTime,
        endTime,
        results,
        errors
      };
    } catch (error) {
      console.error(`Workflow execution failed:`, error);
      return {
        success: false,
        workflowId,
        executionId,
        startTime,
        endTime: new Date(),
        results,
        errors: [{ step: 'workflow', error: error instanceof Error ? error.message : 'Unknown error' }]
      };
    }
  }

  private async executeWorkflowStep(
    step: WorkflowDefinition['steps'][0],
    context: Record<string, any>
  ): Promise<any> {
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Step ${step.id} timed out`)), step.timeout)
    );

    const execution = this.executeStepAction(step, context);

    return Promise.race([execution, timeout]);
  }

  private async executeStepAction(
    step: WorkflowDefinition['steps'][0],
    context: Record<string, any>
  ): Promise<any> {
    switch (step.type) {
      case 'analytics':
        return await this.executeAnalyticsAction(step.action, { ...step.parameters, ...context });
      case 'compliance':
        return await this.executeComplianceAction(step.action, { ...step.parameters, ...context });
      case 'security':
        return await this.executeSecurityAction(step.action, { ...step.parameters, ...context });
      case 'reporting':
        return await this.executeReportingAction(step.action, { ...step.parameters, ...context });
      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  private async executeAnalyticsAction(action: string, parameters: Record<string, any>): Promise<any> {
    switch (action) {
      case 'health_check':
        return { status: 'healthy', timestamp: new Date().toISOString() };
      case 'aggregate_portfolio_data':
        return await dataAnalyticsEngine.generatePortfolioAnalytics();
      case 'generate_portfolio_analytics':
        return await dataAnalyticsEngine.generatePortfolioAnalytics();
      case 'generate_market_intelligence':
        return await dataAnalyticsEngine.generateMarketIntelligence({});
      default:
        throw new Error(`Unknown analytics action: ${action}`);
    }
  }

  private async executeComplianceAction(action: string, parameters: Record<string, any>): Promise<any> {
    switch (action) {
      case 'run_compliance_check':
        return await complianceEngine.runComplianceCheck();
      case 'log_incident':
        // Would log compliance incident
        return { logged: true, timestamp: new Date().toISOString() };
      default:
        throw new Error(`Unknown compliance action: ${action}`);
    }
  }

  private async executeSecurityAction(action: string, parameters: Record<string, any>): Promise<any> {
    switch (action) {
      case 'security_scan':
        return await securityEngine.getSecurityDashboard();
      case 'assess_incident':
        // Would assess security incident
        return { assessment: 'completed', riskLevel: 'medium' };
      case 'contain_threat':
        // Would contain security threat
        return { containment: 'successful', timestamp: new Date().toISOString() };
      default:
        throw new Error(`Unknown security action: ${action}`);
    }
  }

  private async executeReportingAction(action: string, parameters: Record<string, any>): Promise<any> {
    switch (action) {
      case 'generate_health_report':
        const healthData = await this.getSystemHealth();
        return { report: healthData, format: parameters.format || 'json' };
      case 'generate_report':
        if (parameters.templateId) {
          return await reportingEngine.generateReport(parameters.templateId, parameters);
        }
        throw new Error('templateId required for generate_report action');
      case 'send_alert':
        // Would send alert notification
        return { sent: true, priority: parameters.priority, timestamp: new Date().toISOString() };
      default:
        throw new Error(`Unknown reporting action: ${action}`);
    }
  }

  // System Monitoring
  private startSystemMonitoring(): void {
    // Run health checks every 5 minutes
    setInterval(async () => {
      try {
        const health = await this.getSystemHealth();
        
        // Store system status
        health.systems.forEach(system => {
          this.systemStatuses.set(system.component, system);
        });

        // Trigger workflows based on health status
        if (health.overall === 'critical') {
          // Could trigger incident response workflow
          console.log('Critical system health detected - consider triggering incident response');
        }

        // Broadcast health update via WebSocket
        const wsService = getWebSocketService();
        if (wsService) {
          wsService.broadcastToAll({
            type: 'system_health_update',
            data: health,
            timestamp: Date.now()
          });
        }
      } catch (error) {
        console.error('System monitoring error:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    console.log('✅ Master Enterprise Orchestrator monitoring started');
  }

  // Public API Methods
  async getActiveWorkflows(): Promise<Array<{ workflowId: string; status: string; startTime: Date }>> {
    return Array.from(this.activeWorkflows.entries()).map(([id, workflow]) => ({
      workflowId: id,
      status: workflow.status || 'running',
      startTime: workflow.startTime || new Date()
    }));
  }

  async getWorkflowDefinitions(): Promise<WorkflowDefinition[]> {
    return this.workflows;
  }

  async getSystemStatuses(): Promise<SystemStatus[]> {
    return Array.from(this.systemStatuses.values());
  }

  // Enterprise Dashboard Data
  async getEnterpriseDashboard(): Promise<{
    systemHealth: EnterpriseHealth;
    portfolioSummary: any;
    securityOverview: any;
    complianceStatus: any;
    recentActivity: any[];
    keyMetrics: Record<string, number>;
  }> {
    const [systemHealth, portfolioSummary, securityOverview, complianceStatus] = await Promise.all([
      this.getSystemHealth(),
      dataAnalyticsEngine.generatePortfolioAnalytics(),
      securityEngine.getSecurityDashboard(),
      complianceEngine.getComplianceStatus()
    ]);

    // Get recent activity from integration logs
    const recentActivity = await db
      .select()
      .from(integrationLogs)
      .orderBy(integrationLogs.createdAt)
      .limit(10);

    const keyMetrics = {
      totalProperties: portfolioSummary.geographic.marketExposure.length,
      securityAlerts: securityOverview.alertCounts.critical + securityOverview.alertCounts.high,
      complianceViolations: complianceStatus.violations.length,
      systemHealth: systemHealth.systems.filter(s => s.status === 'healthy').length / systemHealth.systems.length * 100
    };

    return {
      systemHealth,
      portfolioSummary,
      securityOverview,
      complianceStatus,
      recentActivity,
      keyMetrics
    };
  }
}

export const masterOrchestrator = new MasterEnterpriseOrchestrator();