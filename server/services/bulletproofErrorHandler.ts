/**
 * Bulletproof Error Handler for Agent Communication System
 * Provides comprehensive error recovery and system resilience
 */

export class BulletproofErrorHandler {
  private static instance: BulletproofErrorHandler;
  private errorCounts: Map<string, number> = new Map();
  private circuitBreakers: Map<string, { isOpen: boolean; lastFailure: number; failures: number }> = new Map();
  private recoveryStrategies: Map<string, () => Promise<void>> = new Map();

  static getInstance(): BulletproofErrorHandler {
    if (!this.instance) {
      this.instance = new BulletproofErrorHandler();
    }
    return this.instance;
  }

  /**
   * Handle errors with automatic recovery and circuit breaking
   */
  async handleError(
    errorContext: string,
    error: unknown,
    recoveryFn?: () => Promise<void>
  ): Promise<boolean> {
    console.error(`🚨 [BulletproofError] ${errorContext}:`, error);
    
    try {
      // Track error frequency
      const currentCount = this.errorCounts.get(errorContext) || 0;
      this.errorCounts.set(errorContext, currentCount + 1);
      
      // Check circuit breaker
      const breaker = this.getCircuitBreaker(errorContext);
      if (breaker.isOpen) {
        console.warn(`⚡ [BulletproofError] Circuit breaker open for ${errorContext}`);
        return false;
      }
      
      // Attempt recovery
      if (recoveryFn) {
        try {
          console.log(`🔧 [BulletproofError] Attempting recovery for ${errorContext}`);
          await recoveryFn();
          console.log(`✅ [BulletproofError] Recovery successful for ${errorContext}`);
          this.resetCircuitBreaker(errorContext);
          return true;
        } catch (recoveryError) {
          console.error(`❌ [BulletproofError] Recovery failed for ${errorContext}:`, recoveryError);
          this.updateCircuitBreaker(errorContext);
        }
      }
      
      return false;
      
    } catch (handlerError) {
      console.error(`💥 [BulletproofError] Error handler itself failed:`, handlerError);
      return false;
    }
  }

  /**
   * Register recovery strategy for specific error types
   */
  registerRecoveryStrategy(errorContext: string, recoveryFn: () => Promise<void>): void {
    this.recoveryStrategies.set(errorContext, recoveryFn);
    console.log(`📋 [BulletproofError] Recovery strategy registered for ${errorContext}`);
  }

  /**
   * Get or create circuit breaker for context
   */
  private getCircuitBreaker(context: string) {
    if (!this.circuitBreakers.has(context)) {
      this.circuitBreakers.set(context, {
        isOpen: false,
        lastFailure: 0,
        failures: 0
      });
    }
    return this.circuitBreakers.get(context)!;
  }

  /**
   * Update circuit breaker on failure
   */
  private updateCircuitBreaker(context: string): void {
    const breaker = this.getCircuitBreaker(context);
    breaker.failures++;
    breaker.lastFailure = Date.now();
    
    // Open circuit if too many failures
    if (breaker.failures >= 5) {
      breaker.isOpen = true;
      console.warn(`⚡ [BulletproofError] Circuit breaker opened for ${context}`);
      
      // Auto-reset after 5 minutes
      setTimeout(() => {
        this.resetCircuitBreaker(context);
      }, 5 * 60 * 1000);
    }
  }

  /**
   * Reset circuit breaker on success
   */
  private resetCircuitBreaker(context: string): void {
    const breaker = this.getCircuitBreaker(context);
    breaker.isOpen = false;
    breaker.failures = 0;
    console.log(`✅ [BulletproofError] Circuit breaker reset for ${context}`);
  }

  /**
   * Get error statistics
   */
  getErrorStats(): Record<string, any> {
    return {
      errorCounts: Object.fromEntries(this.errorCounts.entries()),
      circuitBreakers: Object.fromEntries(
        Array.from(this.circuitBreakers.entries()).map(([key, value]) => [
          key,
          { isOpen: value.isOpen, failures: value.failures }
        ])
      ),
      totalRegisteredRecoveries: this.recoveryStrategies.size
    };
  }

  /**
   * Perform system health check and auto-recovery
   */
  async performHealthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'critical';
    errors: number;
    openCircuits: number;
    recoveryAttempts: number;
  }> {
    console.log('🏥 [BulletproofError] Performing system health check...');
    
    try {
      const totalErrors = Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0);
      const openCircuits = Array.from(this.circuitBreakers.values()).filter(b => b.isOpen).length;
      let recoveryAttempts = 0;
      
      // Attempt recovery for failed services
      for (const [context, recoveryFn] of Array.from(this.recoveryStrategies.entries())) {
        const breaker = this.getCircuitBreaker(context);
        if (breaker.failures > 0 && !breaker.isOpen) {
          try {
            console.log(`🔄 [BulletproofError] Health check recovery for ${context}`);
            await recoveryFn();
            recoveryAttempts++;
            this.resetCircuitBreaker(context);
          } catch (error) {
            console.error(`❌ [BulletproofError] Health check recovery failed for ${context}:`, error);
          }
        }
      }
      
      // Determine system status
      let status: 'healthy' | 'degraded' | 'critical';
      if (openCircuits > 2 || totalErrors > 50) {
        status = 'critical';
      } else if (openCircuits > 0 || totalErrors > 10) {
        status = 'degraded';
      } else {
        status = 'healthy';
      }
      
      console.log(`✅ [BulletproofError] Health check completed - Status: ${status}`);
      
      return {
        status,
        errors: totalErrors,
        openCircuits,
        recoveryAttempts
      };
      
    } catch (error) {
      console.error('💥 [BulletproofError] Health check failed:', error);
      return {
        status: 'critical',
        errors: 999,
        openCircuits: 999,
        recoveryAttempts: 0
      };
    }
  }

  /**
   * Clear old error counts and reset statistics
   */
  performMaintenance(): void {
    console.log('🧹 [BulletproofError] Performing maintenance...');
    
    // Reset error counts older than 1 hour
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    for (const [context, breaker] of Array.from(this.circuitBreakers.entries())) {
      if (breaker.lastFailure < oneHourAgo) {
        breaker.failures = Math.max(0, breaker.failures - 1);
      }
    }
    
    console.log('✅ [BulletproofError] Maintenance completed');
  }
}

export const bulletproofErrorHandler = BulletproofErrorHandler.getInstance();