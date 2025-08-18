import { Router } from 'express';
import { mcpDatabaseAccessValidator } from '../services/mcpDatabaseAccessValidator';
import { httpErrorEnhancement } from '../services/httpErrorEnhancement';

const router = Router();

// Comprehensive system validation endpoint
router.get('/validate-complete-system', httpErrorEnhancement.wrapApiEndpointWithRecovery(async (req, res) => {
  const report = await mcpDatabaseAccessValidator.validateCompleteSystem();
  
  res.json({
    success: true,
    ...report,
    message: `System validation completed: ${report.overallStatus} (${report.summary.passed}/${report.summary.totalChecks} checks passed)`
  });
}));

// Quick health check endpoint
router.get('/quick-health', httpErrorEnhancement.wrapApiEndpointWithRecovery(async (req, res) => {
  const healthCheck = await mcpDatabaseAccessValidator.quickHealthCheck();
  
  res.json({
    success: true,
    healthy: healthCheck.healthy,
    details: healthCheck.details,
    timestamp: new Date().toISOString()
  });
}));

// Database access test endpoint
router.post('/test-database-access', httpErrorEnhancement.wrapApiEndpointWithRecovery(async (req, res) => {
  const { operation, params = {} } = req.body;
  
  const validOperations = [
    'getAllSites',
    'getPortfolioAnalytics', 
    'getBristolScoring',
    'getTableCounts',
    'getSystemHealth'
  ];
  
  if (!validOperations.includes(operation)) {
    return res.status(400).json({
      success: false,
      error: `Invalid operation. Valid operations: ${validOperations.join(', ')}`
    });
  }
  
  try {
    const { megaMcpDatabaseAccess } = await import('../services/megaMcpDatabaseAccess');
    const startTime = Date.now();
    
    // Dynamic method call
    const result = await (megaMcpDatabaseAccess as any)[operation](params);
    const executionTime = Date.now() - startTime;
    
    res.json({
      success: true,
      operation,
      params,
      result,
      executionTime,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      operation,
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    });
  }
}));

// Security test endpoint  
router.post('/test-security', httpErrorEnhancement.wrapApiEndpointWithRecovery(async (req, res) => {
  const { query } = req.body;
  
  if (!query) {
    return res.status(400).json({
      success: false,
      error: 'Query parameter required'
    });
  }
  
  try {
    const { megaMcpDatabaseAccess } = await import('../services/megaMcpDatabaseAccess');
    
    // This should fail for dangerous queries
    const result = await megaMcpDatabaseAccess.executeCustomQuery(query);
    
    res.json({
      success: true,
      query,
      result,
      message: 'Query executed successfully (security check passed)',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // Expected for dangerous queries
    res.json({
      success: false,
      query,
      error: (error as Error).message,
      securityBlocked: true,
      message: 'Query blocked by security validation (this is expected behavior)',
      timestamp: new Date().toISOString()
    });
  }
}));

export { router as mcpDatabaseValidationRouter };