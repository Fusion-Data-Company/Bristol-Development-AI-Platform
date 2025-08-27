// Enterprise Security Engine for Company Development Group
// Provides comprehensive security monitoring, threat detection, and incident response

import { db } from "../db";
import { users, integrationLogs, chatSessions, agentDecisions } from "@shared/schema";
import { eq, and, gte, lte, desc, count, sql } from "drizzle-orm";
import crypto from "crypto";

interface SecurityEvent {
  id: string;
  type: 'authentication' | 'authorization' | 'data_access' | 'system_change' | 'suspicious_activity';
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  description: string;
  metadata: Record<string, any>;
  timestamp: Date;
  status: 'detected' | 'investigating' | 'resolved' | 'false_positive';
}

interface ThreatIndicator {
  id: string;
  type: 'ip' | 'domain' | 'hash' | 'pattern';
  value: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  description: string;
  createdAt: Date;
  expiresAt?: Date;
}

interface SecurityPolicy {
  id: string;
  name: string;
  category: 'access_control' | 'data_protection' | 'monitoring' | 'incident_response';
  rules: Array<{
    condition: string;
    action: 'allow' | 'deny' | 'alert' | 'quarantine';
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
  enabled: boolean;
  lastUpdated: Date;
}

interface SecurityIncident {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'contained' | 'resolved' | 'closed';
  assignedTo?: string;
  events: SecurityEvent[];
  timeline: Array<{
    timestamp: Date;
    action: string;
    user: string;
    details: string;
  }>;
  resolution?: string;
  createdAt: Date;
  resolvedAt?: Date;
}

export class SecurityEngine {
  private events: SecurityEvent[] = [];
  private threatIndicators: ThreatIndicator[] = [];
  private policies: SecurityPolicy[] = [];
  private incidents: SecurityIncident[] = [];
  private anomalyDetectionThresholds = {
    maxLoginAttempts: 5,
    maxAPICallsPerMinute: 100,
    maxDataExportSize: 1024 * 1024 * 100, // 100MB
    maxConcurrentSessions: 10,
    suspiciousLoginTimeWindow: 60 * 60 * 1000, // 1 hour
  };

  constructor() {
    this.initializeDefaultPolicies();
    this.initializeThreatIndicators();
  }

  private initializeDefaultPolicies(): void {
    this.policies = [
      {
        id: 'MULTI_FACTOR_AUTH',
        name: 'Multi-Factor Authentication Required',
        category: 'access_control',
        rules: [
          {
            condition: 'user_role IN ("admin", "analyst") AND mfa_enabled = false',
            action: 'deny',
            severity: 'high'
          }
        ],
        enabled: true,
        lastUpdated: new Date()
      },
      {
        id: 'DATA_EXPORT_LIMITS',
        name: 'Data Export Size Limits',
        category: 'data_protection',
        rules: [
          {
            condition: 'export_size > 100MB',
            action: 'alert',
            severity: 'medium'
          },
          {
            condition: 'export_size > 1GB',
            action: 'deny',
            severity: 'high'
          }
        ],
        enabled: true,
        lastUpdated: new Date()
      },
      {
        id: 'ANOMALOUS_LOGIN_DETECTION',
        name: 'Anomalous Login Pattern Detection',
        category: 'monitoring',
        rules: [
          {
            condition: 'login_failure_count > 5 IN 1h',
            action: 'alert',
            severity: 'medium'
          },
          {
            condition: 'login_from_multiple_countries IN 1h',
            action: 'alert',
            severity: 'high'
          }
        ],
        enabled: true,
        lastUpdated: new Date()
      }
    ];
  }

  private initializeThreatIndicators(): void {
    // Initialize with common threat indicators
    this.threatIndicators = [
      {
        id: 'MALICIOUS_IP_1',
        type: 'ip',
        value: '192.168.1.100', // Example malicious IP
        severity: 'high',
        source: 'threat_intelligence_feed',
        description: 'Known botnet IP address',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      },
      {
        id: 'SUSPICIOUS_PATTERN_1',
        type: 'pattern',
        value: 'rapid_successive_logins',
        severity: 'medium',
        source: 'behavioral_analysis',
        description: 'Pattern indicating potential credential stuffing attack',
        createdAt: new Date()
      }
    ];
  }

  // Event Detection and Logging
  async logSecurityEvent(
    type: SecurityEvent['type'],
    severity: SecurityEvent['severity'],
    description: string,
    metadata: Record<string, any> = {},
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<SecurityEvent> {
    const event: SecurityEvent = {
      id: crypto.randomUUID(),
      type,
      severity,
      userId,
      ipAddress,
      userAgent,
      description,
      metadata,
      timestamp: new Date(),
      status: 'detected'
    };

    this.events.push(event);

    // Auto-escalate critical events to incidents
    if (severity === 'critical') {
      await this.createIncidentFromEvent(event);
    }

    // Check for anomalies and patterns
    await this.analyzeEventForAnomalies(event);

    // Store in database for persistence
    await this.persistSecurityEvent(event);

    return event;
  }

  private async persistSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      await db.insert(integrationLogs).values({
        service: 'security_engine',
        action: `security_event_${event.type}`,
        payload: {
          eventId: event.id,
          type: event.type,
          severity: event.severity === 'info' ? 'low' : event.severity,
          description: event.description,
          metadata: event.metadata
        },
        status: 'success',
        userId: event.userId
      });
    } catch (error) {
      console.error('Failed to persist security event:', error);
    }
  }

  // Anomaly Detection
  private async analyzeEventForAnomalies(event: SecurityEvent): Promise<void> {
    switch (event.type) {
      case 'authentication':
        await this.detectAuthenticationAnomalies(event);
        break;
      case 'data_access':
        await this.detectDataAccessAnomalies(event);
        break;
      case 'system_change':
        await this.detectSystemChangeAnomalies(event);
        break;
    }
  }

  private async detectAuthenticationAnomalies(event: SecurityEvent): Promise<void> {
    if (!event.userId || !event.ipAddress) return;

    // Check for multiple failed login attempts
    const recentFailedLogins = this.events.filter(e => 
      e.type === 'authentication' &&
      e.userId === event.userId &&
      e.metadata.action === 'login_failed' &&
      e.timestamp.getTime() > Date.now() - this.anomalyDetectionThresholds.suspiciousLoginTimeWindow
    );

    if (recentFailedLogins.length >= this.anomalyDetectionThresholds.maxLoginAttempts) {
      await this.logSecurityEvent(
        'suspicious_activity',
        'high',
        `Multiple failed login attempts detected for user ${event.userId}`,
        {
          failedAttempts: recentFailedLogins.length,
          timeWindow: '1 hour',
          recommendation: 'Consider temporary account lockout'
        },
        event.userId,
        event.ipAddress
      );
    }

    // Check for logins from new locations (simplified geolocation check)
    const recentLogins = this.events.filter(e =>
      e.type === 'authentication' &&
      e.userId === event.userId &&
      e.metadata.action === 'login_success' &&
      e.timestamp.getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000 // 7 days
    );

    const uniqueIPs = Array.from(new Set(recentLogins.map(e => e.ipAddress).filter(ip => ip !== undefined)));
    if (uniqueIPs.length > 3) {
      await this.logSecurityEvent(
        'suspicious_activity',
        'medium',
        `User logging in from multiple IP addresses`,
        {
          uniqueIPs: uniqueIPs.length,
          timeWindow: '7 days',
          recommendation: 'Verify user identity'
        },
        event.userId,
        event.ipAddress
      );
    }
  }

  private async detectDataAccessAnomalies(event: SecurityEvent): Promise<void> {
    if (!event.userId) return;

    // Check for unusual data access patterns
    const recentDataAccess = this.events.filter(e =>
      e.type === 'data_access' &&
      e.userId === event.userId &&
      e.timestamp.getTime() > Date.now() - 24 * 60 * 60 * 1000 // 24 hours
    );

    // Check for bulk data exports
    const exportSize = event.metadata.exportSize || 0;
    if (exportSize > this.anomalyDetectionThresholds.maxDataExportSize) {
      await this.logSecurityEvent(
        'suspicious_activity',
        'high',
        `Large data export detected`,
        {
          exportSize,
          threshold: this.anomalyDetectionThresholds.maxDataExportSize,
          recommendation: 'Review export legitimacy'
        },
        event.userId
      );
    }

    // Check for access to sensitive data
    if (event.metadata.dataType === 'financial' || event.metadata.dataType === 'personal') {
      const sensitiveAccess = recentDataAccess.filter(e =>
        e.metadata.dataType === 'financial' || e.metadata.dataType === 'personal'
      );

      if (sensitiveAccess.length > 10) {
        await this.logSecurityEvent(
          'suspicious_activity',
          'medium',
          `High volume access to sensitive data`,
          {
            accessCount: sensitiveAccess.length,
            timeWindow: '24 hours',
            recommendation: 'Review access patterns'
          },
          event.userId
        );
      }
    }
  }

  private async detectSystemChangeAnomalies(event: SecurityEvent): Promise<void> {
    // Check for unusual system configuration changes
    if (event.metadata.changeType === 'user_permissions') {
      await this.logSecurityEvent(
        'suspicious_activity',
        'medium',
        `User permission changes detected`,
        {
          changedUser: event.metadata.targetUser,
          permissions: event.metadata.permissions,
          recommendation: 'Verify authorization for permission changes'
        },
        event.userId
      );
    }

    // Check for system configuration changes during off-hours
    const hour = event.timestamp.getHours();
    if ((hour < 6 || hour > 22) && event.metadata.changeType === 'system_config') {
      await this.logSecurityEvent(
        'suspicious_activity',
        'medium',
        `System configuration change during off-hours`,
        {
          time: event.timestamp.toISOString(),
          changeType: event.metadata.changeType,
          recommendation: 'Verify authorized maintenance window'
        },
        event.userId
      );
    }
  }

  // Threat Intelligence
  async checkThreatIndicators(ipAddress?: string, domain?: string, hash?: string): Promise<ThreatIndicator[]> {
    const matches: ThreatIndicator[] = [];

    for (const indicator of this.threatIndicators) {
      // Check if indicator has expired
      if (indicator.expiresAt && indicator.expiresAt < new Date()) {
        continue;
      }

      switch (indicator.type) {
        case 'ip':
          if (ipAddress && indicator.value === ipAddress) {
            matches.push(indicator);
          }
          break;
        case 'domain':
          if (domain && indicator.value === domain) {
            matches.push(indicator);
          }
          break;
        case 'hash':
          if (hash && indicator.value === hash) {
            matches.push(indicator);
          }
          break;
      }
    }

    // Log threat indicator matches
    for (const match of matches) {
      await this.logSecurityEvent(
        'suspicious_activity',
        match.severity,
        `Threat indicator match detected: ${match.description}`,
        {
          indicatorType: match.type,
          indicatorValue: match.value,
          source: match.source
        }
      );
    }

    return matches;
  }

  // Incident Management
  async createIncidentFromEvent(event: SecurityEvent): Promise<SecurityIncident> {
    const incident: SecurityIncident = {
      id: crypto.randomUUID(),
      title: `Security Incident: ${event.description}`,
      description: `Auto-generated incident from ${event.severity} security event`,
      severity: event.severity,
      status: 'open',
      events: [event],
      timeline: [
        {
          timestamp: new Date(),
          action: 'incident_created',
          user: 'security_engine',
          details: 'Incident auto-created from security event'
        }
      ],
      createdAt: new Date()
    };

    this.incidents.push(incident);
    return incident;
  }

  async updateIncident(
    incidentId: string,
    updates: Partial<Pick<SecurityIncident, 'status' | 'assignedTo' | 'resolution'>>
  ): Promise<SecurityIncident> {
    const incident = this.incidents.find(i => i.id === incidentId);
    if (!incident) {
      throw new Error(`Incident not found: ${incidentId}`);
    }

    // Update incident properties
    Object.assign(incident, updates);

    // Add timeline entry
    incident.timeline.push({
      timestamp: new Date(),
      action: 'incident_updated',
      user: updates.assignedTo || 'system',
      details: `Incident status changed to ${updates.status}`
    });

    // Set resolution timestamp if resolved
    if (updates.status === 'resolved' || updates.status === 'closed') {
      incident.resolvedAt = new Date();
    }

    return incident;
  }

  // Security Monitoring
  async getSecurityDashboard(): Promise<{
    alertCounts: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    recentEvents: SecurityEvent[];
    activeIncidents: SecurityIncident[];
    threatIndicatorMatches: number;
    systemHealth: {
      status: 'healthy' | 'warning' | 'critical';
      issues: string[];
    };
  }> {
    const recentEvents = this.events
      .filter(e => e.timestamp.getTime() > Date.now() - 24 * 60 * 60 * 1000)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 50);

    const alertCounts = {
      critical: recentEvents.filter(e => e.severity === 'critical').length,
      high: recentEvents.filter(e => e.severity === 'high').length,
      medium: recentEvents.filter(e => e.severity === 'medium').length,
      low: recentEvents.filter(e => e.severity === 'low').length,
    };

    const activeIncidents = this.incidents.filter(i =>
      i.status === 'open' || i.status === 'investigating' || i.status === 'contained'
    );

    const threatIndicatorMatches = this.events.filter(e =>
      e.type === 'suspicious_activity' &&
      e.metadata.indicatorType &&
      e.timestamp.getTime() > Date.now() - 24 * 60 * 60 * 1000
    ).length;

    // Determine system health
    let systemHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
    const issues: string[] = [];

    if (alertCounts.critical > 0) {
      systemHealth = 'critical';
      issues.push(`${alertCounts.critical} critical security alerts`);
    } else if (alertCounts.high > 5) {
      systemHealth = 'warning';
      issues.push(`${alertCounts.high} high-severity security alerts`);
    }

    if (activeIncidents.length > 0) {
      if (systemHealth !== 'critical') {
        systemHealth = 'warning';
      }
      issues.push(`${activeIncidents.length} active security incidents`);
    }

    return {
      alertCounts,
      recentEvents,
      activeIncidents,
      threatIndicatorMatches,
      systemHealth: {
        status: systemHealth,
        issues
      }
    };
  }

  // Access Control
  async checkAccessPermission(
    userId: string,
    resource: string,
    action: string,
    context: Record<string, any> = {}
  ): Promise<{
    granted: boolean;
    reason?: string;
    requiredPermissions?: string[];
  }> {
    // Log access attempt
    await this.logSecurityEvent(
      'authorization',
      'info',
      `Access check: ${action} on ${resource}`,
      {
        resource,
        action,
        context
      },
      userId
    );

    // Simple role-based access control (would be more sophisticated in production)
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    
    if (!user.length) {
      return {
        granted: false,
        reason: 'User not found'
      };
    }

    // Check for suspicious activity that might warrant access restriction
    const recentSuspiciousActivity = this.events.filter(e =>
      e.type === 'suspicious_activity' &&
      e.userId === userId &&
      e.timestamp.getTime() > Date.now() - 60 * 60 * 1000 // 1 hour
    );

    if (recentSuspiciousActivity.length > 0) {
      await this.logSecurityEvent(
        'authorization',
        'medium',
        `Access denied due to recent suspicious activity`,
        {
          resource,
          action,
          suspiciousEvents: recentSuspiciousActivity.length
        },
        userId
      );

      return {
        granted: false,
        reason: 'Access restricted due to suspicious activity'
      };
    }

    // Default allow for authenticated users (would implement proper RBAC in production)
    return {
      granted: true
    };
  }

  // Data Encryption and Protection
  encryptSensitiveData(data: string, keyId: string = 'default'): string {
    // In production, would use proper key management service
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return `${iv.toString('hex')}:${encrypted}`;
  }

  decryptSensitiveData(encryptedData: string, keyId: string = 'default'): string {
    // In production, would use proper key management service
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
    
    const [ivHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    
    const decipher = crypto.createDecipher(algorithm, key);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // Security Reporting
  async generateSecurityReport(
    startDate: Date,
    endDate: Date,
    includeDetails: boolean = false
  ): Promise<{
    period: { startDate: Date; endDate: Date };
    summary: {
      totalEvents: number;
      criticalEvents: number;
      incidents: number;
      threatMatches: number;
      averageResolutionTime: number;
    };
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    topThreats: Array<{
      type: string;
      count: number;
      description: string;
    }>;
    recommendations: string[];
    details?: SecurityEvent[];
  }> {
    const periodEvents = this.events.filter(e =>
      e.timestamp >= startDate && e.timestamp <= endDate
    );

    const periodIncidents = this.incidents.filter(i =>
      i.createdAt >= startDate && i.createdAt <= endDate
    );

    const eventsByType = periodEvents.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const eventsBySeverity = periodEvents.reduce((acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const threatMatches = periodEvents.filter(e =>
      e.type === 'suspicious_activity' && e.metadata.indicatorType
    );

    const resolvedIncidents = periodIncidents.filter(i => i.resolvedAt);
    const averageResolutionTime = resolvedIncidents.length > 0
      ? resolvedIncidents.reduce((sum, incident) => {
          const resolutionTime = incident.resolvedAt!.getTime() - incident.createdAt.getTime();
          return sum + resolutionTime;
        }, 0) / resolvedIncidents.length / (1000 * 60 * 60) // Convert to hours
      : 0;

    const recommendations = [
      'Implement multi-factor authentication for all admin accounts',
      'Regular security awareness training for all users',
      'Automated threat detection and response procedures',
      'Regular security policy reviews and updates'
    ];

    return {
      period: { startDate, endDate },
      summary: {
        totalEvents: periodEvents.length,
        criticalEvents: eventsBySeverity.critical || 0,
        incidents: periodIncidents.length,
        threatMatches: threatMatches.length,
        averageResolutionTime
      },
      eventsByType,
      eventsBySeverity,
      topThreats: [
        {
          type: 'Authentication Anomalies',
          count: periodEvents.filter(e => e.type === 'authentication').length,
          description: 'Unusual login patterns and failed authentication attempts'
        },
        {
          type: 'Data Access Violations',
          count: periodEvents.filter(e => e.type === 'data_access').length,
          description: 'Unauthorized or suspicious data access patterns'
        }
      ],
      recommendations,
      details: includeDetails ? periodEvents : undefined
    };
  }
}

export const securityEngine = new SecurityEngine();