// Enterprise Compliance & Regulatory Engine for Your Company Name
// Provides comprehensive compliance monitoring, regulatory tracking, and audit capabilities

import { db } from "../db";
import { sites, integrationLogs, agentDecisions } from "@shared/schema";
import { eq, and, gte, lte, desc, count, sql } from "drizzle-orm";

interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  category: 'financial' | 'environmental' | 'zoning' | 'safety' | 'data' | 'governance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  automated: boolean;
  frequency: 'continuous' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  lastCheck?: Date;
  status: 'compliant' | 'warning' | 'violation' | 'unknown';
}

interface ComplianceViolation {
  id: string;
  ruleId: string;
  propertyId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  remediation: string;
  deadline?: Date;
  status: 'open' | 'investigating' | 'remediated' | 'risk_accepted';
  assignedTo?: string;
  detectedAt: Date;
  resolvedAt?: Date;
}

interface AuditReport {
  id: string;
  type: 'internal' | 'external' | 'regulatory' | 'financial';
  scope: string[];
  auditor: string;
  startDate: Date;
  endDate?: Date;
  status: 'planned' | 'in_progress' | 'review' | 'completed';
  findings: ComplianceViolation[];
  recommendations: string[];
  executiveSummary: string;
}

interface RegulatoryRequirement {
  id: string;
  jurisdiction: string;
  category: string;
  requirement: string;
  effectiveDate: Date;
  deadlineDate?: Date;
  applicableProperties: string[];
  status: 'pending' | 'compliant' | 'non_compliant';
  documentation: string[];
}

export class ComplianceEngine {
  private complianceRules: ComplianceRule[] = [
    {
      id: 'GDPR_DATA_RETENTION',
      name: 'GDPR Data Retention Compliance',
      description: 'Ensure personal data is not retained beyond legal requirements',
      category: 'data',
      severity: 'high',
      automated: true,
      frequency: 'daily',
      status: 'compliant'
    },
    {
      id: 'FINANCIAL_DISCLOSURE',
      name: 'Financial Disclosure Requirements',
      description: 'Ensure all material financial information is properly disclosed',
      category: 'financial',
      severity: 'critical',
      automated: false,
      frequency: 'quarterly',
      status: 'compliant'
    },
    {
      id: 'ENVIRONMENTAL_IMPACT',
      name: 'Environmental Impact Assessment',
      description: 'Monitor and report environmental impact metrics',
      category: 'environmental',
      severity: 'medium',
      automated: true,
      frequency: 'monthly',
      status: 'warning'
    },
    {
      id: 'ZONING_COMPLIANCE',
      name: 'Zoning and Land Use Compliance',
      description: 'Ensure all properties comply with local zoning regulations',
      category: 'zoning',
      severity: 'high',
      automated: false,
      frequency: 'quarterly',
      status: 'compliant'
    },
    {
      id: 'SAFETY_STANDARDS',
      name: 'Building Safety Standards',
      description: 'Monitor compliance with building safety and fire codes',
      category: 'safety',
      severity: 'critical',
      automated: false,
      frequency: 'annually',
      status: 'compliant'
    },
    {
      id: 'CORPORATE_GOVERNANCE',
      name: 'Corporate Governance Standards',
      description: 'Ensure proper governance procedures and documentation',
      category: 'governance',
      severity: 'high',
      automated: false,
      frequency: 'quarterly',
      status: 'compliant'
    }
  ];

  private violations: ComplianceViolation[] = [];
  private auditReports: AuditReport[] = [];
  private regulatoryRequirements: RegulatoryRequirement[] = [];

  // Core Compliance Monitoring
  async runComplianceCheck(ruleId?: string): Promise<ComplianceViolation[]> {
    const rulesToCheck = ruleId 
      ? this.complianceRules.filter(rule => rule.id === ruleId)
      : this.complianceRules.filter(rule => rule.automated);

    const newViolations: ComplianceViolation[] = [];

    for (const rule of rulesToCheck) {
      try {
        const violations = await this.checkSpecificRule(rule);
        newViolations.push(...violations);
        
        // Update rule status
        rule.lastCheck = new Date();
        rule.status = violations.length > 0 ? 'violation' : 'compliant';
      } catch (error) {
        console.error(`Error checking compliance rule ${rule.id}:`, error);
        rule.status = 'unknown';
      }
    }

    // Store new violations
    this.violations.push(...newViolations);

    return newViolations;
  }

  private async checkSpecificRule(rule: ComplianceRule): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = [];

    switch (rule.id) {
      case 'GDPR_DATA_RETENTION':
        return await this.checkDataRetention();
      
      case 'ENVIRONMENTAL_IMPACT':
        return await this.checkEnvironmentalCompliance();
      
      case 'FINANCIAL_DISCLOSURE':
        return await this.checkFinancialDisclosure();
      
      default:
        return violations;
    }
  }

  private async checkDataRetention(): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = [];
    
    // Check for data older than retention period (7 years for financial, 3 years for operational)
    const financialRetentionDate = new Date();
    financialRetentionDate.setFullYear(financialRetentionDate.getFullYear() - 7);
    
    const operationalRetentionDate = new Date();
    operationalRetentionDate.setFullYear(operationalRetentionDate.getFullYear() - 3);

    // Check integration logs for old data
    const oldLogs = await db
      .select({ count: count() })
      .from(integrationLogs)
      .where(lte(integrationLogs.createdAt, operationalRetentionDate));

    if (oldLogs[0]?.count > 0) {
      violations.push({
        id: `DATA_RETENTION_${Date.now()}`,
        ruleId: 'GDPR_DATA_RETENTION',
        severity: 'medium',
        description: `${oldLogs[0].count} integration log records exceed data retention period`,
        remediation: 'Archive or delete old integration logs according to data retention policy',
        status: 'open',
        detectedAt: new Date()
      });
    }

    return violations;
  }

  private async checkEnvironmentalCompliance(): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = [];
    
    // Check for properties missing environmental assessments
    const propertiesWithoutAssessments = await db
      .select({ id: sites.id, name: sites.name })
      .from(sites)
      .where(sql`${sites.notes} NOT LIKE '%environmental%' OR ${sites.notes} IS NULL`);

    if (propertiesWithoutAssessments.length > 0) {
      violations.push({
        id: `ENV_ASSESSMENT_${Date.now()}`,
        ruleId: 'ENVIRONMENTAL_IMPACT',
        severity: 'medium',
        description: `${propertiesWithoutAssessments.length} properties missing environmental impact documentation`,
        remediation: 'Conduct environmental assessments for all properties and document in property notes',
        status: 'open',
        detectedAt: new Date()
      });
    }

    return violations;
  }

  private async checkFinancialDisclosure(): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = [];
    
    // Check for missing financial disclosures in agent decisions
    const recentDecisions = await db
      .select({ count: count() })
      .from(agentDecisions)
      .where(
        and(
          eq(agentDecisions.decisionType, 'investment'),
          gte(agentDecisions.createdAt, new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))
        )
      );

    if (recentDecisions[0]?.count === 0) {
      violations.push({
        id: `FINANCIAL_DISCLOSURE_${Date.now()}`,
        ruleId: 'FINANCIAL_DISCLOSURE',
        severity: 'high',
        description: 'No investment decisions recorded in the last 90 days - potential disclosure gap',
        remediation: 'Ensure all investment decisions are properly documented and disclosed',
        status: 'open',
        detectedAt: new Date()
      });
    }

    return violations;
  }

  // Audit Management
  async createAuditReport(
    type: AuditReport['type'],
    scope: string[],
    auditor: string
  ): Promise<AuditReport> {
    const auditReport: AuditReport = {
      id: `AUDIT_${Date.now()}`,
      type,
      scope,
      auditor,
      startDate: new Date(),
      status: 'planned',
      findings: [],
      recommendations: [],
      executiveSummary: ''
    };

    this.auditReports.push(auditReport);
    return auditReport;
  }

  async executeAudit(auditId: string): Promise<AuditReport> {
    const audit = this.auditReports.find(a => a.id === auditId);
    if (!audit) {
      throw new Error(`Audit not found: ${auditId}`);
    }

    audit.status = 'in_progress';
    
    // Run compliance checks for audit scope
    const findings: ComplianceViolation[] = [];
    
    for (const ruleId of audit.scope) {
      const violations = await this.runComplianceCheck(ruleId);
      findings.push(...violations);
    }

    audit.findings = findings;
    
    // Generate recommendations based on findings
    audit.recommendations = this.generateRecommendations(findings);
    
    // Generate executive summary
    audit.executiveSummary = this.generateExecutiveSummary(findings);
    
    audit.status = 'review';
    
    return audit;
  }

  private generateRecommendations(findings: ComplianceViolation[]): string[] {
    const recommendations: string[] = [];
    
    const criticalFindings = findings.filter(f => f.severity === 'critical');
    const highFindings = findings.filter(f => f.severity === 'high');
    
    if (criticalFindings.length > 0) {
      recommendations.push(
        'Immediate action required: Address all critical compliance violations within 24 hours'
      );
    }
    
    if (highFindings.length > 0) {
      recommendations.push(
        'High priority: Resolve high-severity compliance issues within 7 days'
      );
    }
    
    // Category-specific recommendations
    const dataViolations = findings.filter(f => f.ruleId.includes('DATA'));
    if (dataViolations.length > 0) {
      recommendations.push(
        'Implement automated data retention policies to prevent GDPR violations'
      );
    }
    
    const environmentalViolations = findings.filter(f => f.ruleId.includes('ENVIRONMENTAL'));
    if (environmentalViolations.length > 0) {
      recommendations.push(
        'Establish regular environmental impact assessment procedures'
      );
    }
    
    return recommendations;
  }

  private generateExecutiveSummary(findings: ComplianceViolation[]): string {
    const critical = findings.filter(f => f.severity === 'critical').length;
    const high = findings.filter(f => f.severity === 'high').length;
    const medium = findings.filter(f => f.severity === 'medium').length;
    const low = findings.filter(f => f.severity === 'low').length;
    
    let summary = `Compliance Audit Summary: ${findings.length} total findings identified. `;
    
    if (critical > 0) {
      summary += `${critical} critical issues require immediate attention. `;
    }
    
    if (high > 0) {
      summary += `${high} high-priority issues should be resolved within 7 days. `;
    }
    
    if (medium + low > 0) {
      summary += `${medium + low} medium/low priority issues for ongoing improvement. `;
    }
    
    if (findings.length === 0) {
      summary = 'No compliance violations found. All monitored areas are compliant.';
    }
    
    return summary;
  }

  // Regulatory Tracking
  async addRegulatoryRequirement(requirement: Omit<RegulatoryRequirement, 'id'>): Promise<RegulatoryRequirement> {
    const newRequirement: RegulatoryRequirement = {
      id: `REQ_${Date.now()}`,
      ...requirement
    };
    
    this.regulatoryRequirements.push(newRequirement);
    return newRequirement;
  }

  async trackRegulatoryDeadlines(): Promise<RegulatoryRequirement[]> {
    const upcomingDeadlines = this.regulatoryRequirements.filter(req => {
      if (!req.deadlineDate) return false;
      
      const daysUntilDeadline = Math.ceil(
        (req.deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      
      return daysUntilDeadline <= 30 && daysUntilDeadline > 0;
    });
    
    return upcomingDeadlines.sort((a, b) => 
      (a.deadlineDate?.getTime() || 0) - (b.deadlineDate?.getTime() || 0)
    );
  }

  // Risk Assessment
  async generateComplianceRiskAssessment(): Promise<{
    overallRisk: 'low' | 'medium' | 'high' | 'critical';
    riskFactors: Array<{
      category: string;
      risk: string;
      impact: 'low' | 'medium' | 'high' | 'critical';
      likelihood: 'low' | 'medium' | 'high';
      mitigation: string;
    }>;
    recommendations: string[];
  }> {
    const openViolations = this.violations.filter(v => v.status === 'open');
    const criticalViolations = openViolations.filter(v => v.severity === 'critical');
    const highViolations = openViolations.filter(v => v.severity === 'high');
    
    let overallRisk: 'low' | 'medium' | 'high' | 'critical' = 'low';
    
    if (criticalViolations.length > 0) {
      overallRisk = 'critical';
    } else if (highViolations.length > 2) {
      overallRisk = 'high';
    } else if (openViolations.length > 5) {
      overallRisk = 'medium';
    }
    
    const riskFactors = [
      {
        category: 'Data Protection',
        risk: 'GDPR non-compliance leading to regulatory fines',
        impact: 'critical' as const,
        likelihood: 'medium' as const,
        mitigation: 'Implement automated data retention and deletion procedures'
      },
      {
        category: 'Financial Reporting',
        risk: 'Inadequate financial disclosure resulting in regulatory action',
        impact: 'high' as const,
        likelihood: 'low' as const,
        mitigation: 'Establish regular financial reporting and disclosure procedures'
      },
      {
        category: 'Environmental',
        risk: 'Environmental violations leading to project delays and fines',
        impact: 'medium' as const,
        likelihood: 'medium' as const,
        mitigation: 'Conduct regular environmental impact assessments'
      }
    ];
    
    const recommendations = [
      'Implement continuous compliance monitoring system',
      'Establish regular compliance training for all staff',
      'Create compliance dashboard for real-time monitoring',
      'Develop automated remediation procedures where possible'
    ];
    
    return {
      overallRisk,
      riskFactors,
      recommendations
    };
  }

  // Reporting and Analytics
  async generateComplianceReport(
    startDate: Date,
    endDate: Date,
    category?: ComplianceRule['category']
  ) {
    const relevantRules = category 
      ? this.complianceRules.filter(rule => rule.category === category)
      : this.complianceRules;
    
    const relevantViolations = this.violations.filter(violation => {
      const violationDate = violation.detectedAt;
      return violationDate >= startDate && violationDate <= endDate;
    });
    
    const complianceMetrics = {
      totalRules: relevantRules.length,
      compliantRules: relevantRules.filter(rule => rule.status === 'compliant').length,
      violationsDetected: relevantViolations.length,
      violationsResolved: relevantViolations.filter(v => v.status === 'remediated').length,
      averageResolutionTime: this.calculateAverageResolutionTime(relevantViolations),
      riskDistribution: {
        critical: relevantViolations.filter(v => v.severity === 'critical').length,
        high: relevantViolations.filter(v => v.severity === 'high').length,
        medium: relevantViolations.filter(v => v.severity === 'medium').length,
        low: relevantViolations.filter(v => v.severity === 'low').length,
      }
    };
    
    return {
      reportPeriod: { startDate, endDate },
      category,
      metrics: complianceMetrics,
      rules: relevantRules,
      violations: relevantViolations,
      generatedAt: new Date()
    };
  }

  private calculateAverageResolutionTime(violations: ComplianceViolation[]): number {
    const resolvedViolations = violations.filter(v => v.resolvedAt);
    
    if (resolvedViolations.length === 0) return 0;
    
    const totalResolutionTime = resolvedViolations.reduce((sum, violation) => {
      if (!violation.resolvedAt) return sum;
      
      const resolutionTime = violation.resolvedAt.getTime() - violation.detectedAt.getTime();
      return sum + resolutionTime;
    }, 0);
    
    return totalResolutionTime / resolvedViolations.length / (1000 * 60 * 60 * 24); // Convert to days
  }

  // Public API Methods
  async getComplianceStatus(): Promise<{
    overall: 'compliant' | 'warning' | 'violation';
    rules: ComplianceRule[];
    violations: ComplianceViolation[];
    upcomingDeadlines: RegulatoryRequirement[];
  }> {
    const openViolations = this.violations.filter(v => v.status === 'open');
    const criticalViolations = openViolations.filter(v => v.severity === 'critical');
    
    let overall: 'compliant' | 'warning' | 'violation' = 'compliant';
    
    if (criticalViolations.length > 0) {
      overall = 'violation';
    } else if (openViolations.length > 0) {
      overall = 'warning';
    }
    
    const upcomingDeadlines = await this.trackRegulatoryDeadlines();
    
    return {
      overall,
      rules: this.complianceRules,
      violations: openViolations,
      upcomingDeadlines
    };
  }
}

export const complianceEngine = new ComplianceEngine();