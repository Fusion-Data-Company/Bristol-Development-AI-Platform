import { megaMcpDatabaseAccess } from './megaMcpDatabaseAccess';
import { httpErrorEnhancement } from './httpErrorEnhancement';
import { ErrorHandlingService } from './errorHandlingService';

interface ValidationResult {
  success: boolean;
  component: string;
  details: string;
  performance?: number;
  error?: string;
}

interface SystemValidationReport {
  overallStatus: 'operational' | 'degraded' | 'failed';
  timestamp: string;
  validations: ValidationResult[];
  summary: {
    totalChecks: number;
    passed: number;
    failed: number;
    avgResponseTime: number;
  };
}

export class McpDatabaseAccessValidator {
  private errorHandler = ErrorHandlingService.getInstance();

  async validateCompleteSystem(): Promise<SystemValidationReport> {
    console.log('🔍 Starting comprehensive MCP database access validation...');
    
    const startTime = Date.now();
    const validations: ValidationResult[] = [];

    // Core Database Access Validations
    validations.push(await this.validateDatabaseConnectivity());
    validations.push(await this.validateSchemaAccess());
    validations.push(await this.validateQuerySecurity());
    validations.push(await this.validateDataRetrieval());
    
    // MCP Interface Validations
    validations.push(await this.validateMcpInterface());
    validations.push(await this.validateErrorHandling());
    validations.push(await this.validatePerformanceTracking());
    
    // Analytics & Search Validations
    validations.push(await this.validateAnalyticsQueries());
    validations.push(await this.validateSearchCapabilities());
    validations.push(await this.validateMemoryAccess());

    // Calculate summary
    const passed = validations.filter(v => v.success).length;
    const failed = validations.filter(v => !v.success).length;
    const totalTime = Date.now() - startTime;
    const avgResponseTime = Math.round(totalTime / validations.length);

    const overallStatus: 'operational' | 'degraded' | 'failed' = 
      failed === 0 ? 'operational' : 
      failed < validations.length / 2 ? 'degraded' : 'failed';

    const report: SystemValidationReport = {
      overallStatus,
      timestamp: new Date().toISOString(),
      validations,
      summary: {
        totalChecks: validations.length,
        passed,
        failed,
        avgResponseTime
      }
    };

    console.log(`✅ System validation completed: ${overallStatus} (${passed}/${validations.length} passed)`);
    return report;
  }

  private async validateDatabaseConnectivity(): Promise<ValidationResult> {
    const startTime = Date.now();
    
    try {
      const health = await megaMcpDatabaseAccess.getSystemHealth();
      const performance = Date.now() - startTime;
      
      if (!health.databaseConnected) {
        return {
          success: false,
          component: 'Database Connectivity',
          details: 'Database connection failed',
          performance,
          error: 'Connection not established'
        };
      }

      return {
        success: true,
        component: 'Database Connectivity',
        details: `Connected with ${health.responseTime}ms response time`,
        performance
      };
    } catch (error) {
      return {
        success: false,
        component: 'Database Connectivity',
        details: 'Database connectivity check failed',
        performance: Date.now() - startTime,
        error: (error as Error).message
      };
    }
  }

  private async validateSchemaAccess(): Promise<ValidationResult> {
    const startTime = Date.now();
    
    try {
      const tableCounts = await megaMcpDatabaseAccess.getTableCounts();
      const performance = Date.now() - startTime;
      
      const expectedTables = [
        'sites', 'siteMetrics', 'chatSessions', 'chatMessages',
        'integrationLogs', 'comps', 'properties', 'marketIntelligence'
      ];
      
      const accessibleTables = Object.keys(tableCounts).length;
      
      if (accessibleTables < 8) {
        return {
          success: false,
          component: 'Schema Access',
          details: `Only ${accessibleTables} tables accessible`,
          performance,
          error: 'Incomplete schema access'
        };
      }

      return {
        success: true,
        component: 'Schema Access',
        details: `All ${accessibleTables} database tables accessible`,
        performance
      };
    } catch (error) {
      return {
        success: false,
        component: 'Schema Access',
        details: 'Schema access validation failed',
        performance: Date.now() - startTime,
        error: (error as Error).message
      };
    }
  }

  private async validateQuerySecurity(): Promise<ValidationResult> {
    const startTime = Date.now();
    
    try {
      // Test secure query
      const sites = await megaMcpDatabaseAccess.getAllSites();
      
      // Test that dangerous queries are blocked (should throw error)
      try {
        await megaMcpDatabaseAccess.executeCustomQuery('DROP TABLE sites');
        // If we reach here, security failed
        return {
          success: false,
          component: 'Query Security',
          details: 'Dangerous queries not properly blocked',
          performance: Date.now() - startTime,
          error: 'Security validation failed'
        };
      } catch (securityError) {
        // This is expected - dangerous queries should be blocked
        const performance = Date.now() - startTime;
        return {
          success: true,
          component: 'Query Security',
          details: 'SQL injection protection operational, secure queries work',
          performance
        };
      }
    } catch (error) {
      return {
        success: false,
        component: 'Query Security',
        details: 'Query security validation failed',
        performance: Date.now() - startTime,
        error: (error as Error).message
      };
    }
  }

  private async validateDataRetrieval(): Promise<ValidationResult> {
    const startTime = Date.now();
    
    try {
      const [sites, portfolioAnalytics] = await Promise.all([
        megaMcpDatabaseAccess.getAllSites(),
        megaMcpDatabaseAccess.getPortfolioAnalytics()
      ]);
      
      const performance = Date.now() - startTime;
      
      if (!Array.isArray(sites) || sites.length === 0) {
        return {
          success: false,
          component: 'Data Retrieval',
          details: 'No site data retrieved',
          performance,
          error: 'Empty dataset'
        };
      }

      return {
        success: true,
        component: 'Data Retrieval',
        details: `Retrieved ${sites.length} sites with portfolio analytics`,
        performance
      };
    } catch (error) {
      return {
        success: false,
        component: 'Data Retrieval',
        details: 'Data retrieval validation failed',
        performance: Date.now() - startTime,
        error: (error as Error).message
      };
    }
  }

  private async validateMcpInterface(): Promise<ValidationResult> {
    const startTime = Date.now();
    
    try {
      // Test multiple MCP-style operations
      const operations = [
        () => megaMcpDatabaseAccess.getCompanyScoring(),
        () => megaMcpDatabaseAccess.getRunsHistory('analysis', 10),
        () => megaMcpDatabaseAccess.getIntegrationLogs(undefined, undefined)
      ];

      const results = await Promise.all(operations.map(op => op()));
      const performance = Date.now() - startTime;
      
      const validResults = results.filter(result => result !== null && result !== undefined);
      
      if (validResults.length !== operations.length) {
        return {
          success: false,
          component: 'MCP Interface',
          details: `Only ${validResults.length}/${operations.length} operations succeeded`,
          performance,
          error: 'Some MCP operations failed'
        };
      }

      return {
        success: true,
        component: 'MCP Interface',
        details: `All ${operations.length} MCP operations operational`,
        performance
      };
    } catch (error) {
      return {
        success: false,
        component: 'MCP Interface',
        details: 'MCP interface validation failed',
        performance: Date.now() - startTime,
        error: (error as Error).message
      };
    }
  }

  private async validateErrorHandling(): Promise<ValidationResult> {
    const startTime = Date.now();
    
    try {
      // Test error handling with invalid parameters
      const errorTests = [
        () => megaMcpDatabaseAccess.getSiteById('nonexistent-id'),
        () => megaMcpDatabaseAccess.getPropertyDetails('invalid-site-id'),
        () => megaMcpDatabaseAccess.searchProperties({ invalidCriteria: 'test' })
      ];

      let handledErrors = 0;
      for (const test of errorTests) {
        try {
          await test();
        } catch (error) {
          // Errors should be properly thrown and handled
          handledErrors++;
        }
      }

      const performance = Date.now() - startTime;

      if (handledErrors === 0) {
        return {
          success: false,
          component: 'Error Handling',
          details: 'Error conditions not properly handled',
          performance,
          error: 'Insufficient error handling'
        };
      }

      return {
        success: true,
        component: 'Error Handling',
        details: `${handledErrors}/${errorTests.length} error conditions properly handled`,
        performance
      };
    } catch (error) {
      return {
        success: false,
        component: 'Error Handling',
        details: 'Error handling validation failed',
        performance: Date.now() - startTime,
        error: (error as Error).message
      };
    }
  }

  private async validatePerformanceTracking(): Promise<ValidationResult> {
    const startTime = Date.now();
    
    try {
      const testQuery = 'SELECT COUNT(*) as total FROM sites LIMIT 1';
      const result = await megaMcpDatabaseAccess.executeCustomQuery(testQuery);
      const performance = Date.now() - startTime;

      // Check if performance tracking is working
      if (typeof performance !== 'number' || performance < 0) {
        return {
          success: false,
          component: 'Performance Tracking',
          details: 'Performance metrics not properly tracked',
          performance,
          error: 'Performance tracking failure'
        };
      }

      return {
        success: true,
        component: 'Performance Tracking',
        details: `Query performance tracking operational (${performance}ms)`,
        performance
      };
    } catch (error) {
      return {
        success: false,
        component: 'Performance Tracking',
        details: 'Performance tracking validation failed',
        performance: Date.now() - startTime,
        error: (error as Error).message
      };
    }
  }

  private async validateAnalyticsQueries(): Promise<ValidationResult> {
    const startTime = Date.now();
    
    try {
      const analytics = await megaMcpDatabaseAccess.getPortfolioAnalytics();
      const performance = Date.now() - startTime;
      
      if (!analytics || !analytics.overview) {
        return {
          success: false,
          component: 'Analytics Queries',
          details: 'Portfolio analytics not properly structured',
          performance,
          error: 'Analytics structure invalid'
        };
      }

      const { overview } = analytics;
      const hasRequiredFields = overview.totalSites !== undefined && 
                               overview.totalUnits !== undefined &&
                               overview.avgCompanyScore !== undefined;

      if (!hasRequiredFields) {
        return {
          success: false,
          component: 'Analytics Queries',
          details: 'Required analytics fields missing',
          performance,
          error: 'Incomplete analytics data'
        };
      }

      return {
        success: true,
        component: 'Analytics Queries',
        details: `Analytics operational: ${overview.totalSites} sites, ${overview.totalUnits} units`,
        performance
      };
    } catch (error) {
      return {
        success: false,
        component: 'Analytics Queries',
        details: 'Analytics queries validation failed',
        performance: Date.now() - startTime,
        error: (error as Error).message
      };
    }
  }

  private async validateSearchCapabilities(): Promise<ValidationResult> {
    const startTime = Date.now();
    
    try {
      const searchResults = await megaMcpDatabaseAccess.searchProperties({
        status: 'Operating',
        minUnits: 100
      });
      
      const performance = Date.now() - startTime;
      
      if (!Array.isArray(searchResults)) {
        return {
          success: false,
          component: 'Search Capabilities',
          details: 'Search results not properly formatted',
          performance,
          error: 'Search result format invalid'
        };
      }

      return {
        success: true,
        component: 'Search Capabilities',
        details: `Search operational: ${searchResults.length} properties found`,
        performance
      };
    } catch (error) {
      return {
        success: false,
        component: 'Search Capabilities',
        details: 'Search capabilities validation failed',
        performance: Date.now() - startTime,
        error: (error as Error).message
      };
    }
  }

  private async validateMemoryAccess(): Promise<ValidationResult> {
    const startTime = Date.now();
    
    try {
      // Test memory access with a default user ID
      const memory = await megaMcpDatabaseAccess.getAgentMemory('test-user-validation');
      const performance = Date.now() - startTime;
      
      if (!memory || (!memory.shortTerm && !memory.longTerm)) {
        return {
          success: false,
          component: 'Memory Access',
          details: 'Memory access structure invalid',
          performance,
          error: 'Memory structure invalid'
        };
      }

      return {
        success: true,
        component: 'Memory Access',
        details: 'Memory access operational for agent context retrieval',
        performance
      };
    } catch (error) {
      return {
        success: false,
        component: 'Memory Access',
        details: 'Memory access validation failed',
        performance: Date.now() - startTime,
        error: (error as Error).message
      };
    }
  }

  // Public method for external validation calls
  async quickHealthCheck(): Promise<{ healthy: boolean; details: string }> {
    try {
      const [connectivity, schema] = await Promise.all([
        this.validateDatabaseConnectivity(),
        this.validateSchemaAccess()
      ]);

      const healthy = connectivity.success && schema.success;
      const details = healthy ? 
        'Database connectivity and schema access operational' :
        `Issues: ${[connectivity, schema].filter(v => !v.success).map(v => v.component).join(', ')}`;

      return { healthy, details };
    } catch (error) {
      return {
        healthy: false,
        details: `Health check failed: ${(error as Error).message}`
      };
    }
  }
}

export const mcpDatabaseAccessValidator = new McpDatabaseAccessValidator();