import { marketIntelligenceAgent } from './marketIntelligenceAgent';
import { storage } from '../storage';

class SchedulerService {
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private isInitialized = false;

  /**
   * Initialize the scheduler with all recurring tasks
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('📅 Scheduler already initialized');
      return;
    }

    console.log('📅 Initializing scheduler service...');

    try {
      // Start market intelligence agent every 2 hours
      await this.scheduleMarketIntelligenceAgent();
      
      // Clean up expired data every 6 hours
      this.scheduleCleanupTasks();

      this.isInitialized = true;
      console.log('✅ Scheduler service initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize scheduler service:', error);
      throw error;
    }
  }

  /**
   * Schedule market intelligence agent to run every 2 hours
   */
  private async scheduleMarketIntelligenceAgent(): Promise<void> {
    const AGENT_INTERVAL = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
    
    // Run immediately on startup if no recent execution
    const shouldExecute = await marketIntelligenceAgent.shouldExecute();
    if (shouldExecute) {
      console.log('🚀 Running initial market intelligence gathering...');
      this.executeMarketIntelligenceWithErrorHandling();
    } else {
      console.log('⏭️ Skipping initial market intelligence run - recent execution found');
    }

    // Schedule recurring execution
    const interval = setInterval(async () => {
      try {
        const shouldRun = await marketIntelligenceAgent.shouldExecute();
        if (shouldRun) {
          console.log('⏰ Scheduled market intelligence gathering starting...');
          await this.executeMarketIntelligenceWithErrorHandling();
        } else {
          console.log('⏭️ Skipping scheduled run - too recent execution');
        }
      } catch (error) {
        console.error('❌ Scheduled market intelligence execution failed:', error);
      }
    }, AGENT_INTERVAL);

    this.intervals.set('market-intelligence', interval);
    console.log(`📊 Market intelligence agent scheduled every ${AGENT_INTERVAL / 1000 / 60} minutes`);
  }

  /**
   * Execute market intelligence gathering with proper error handling
   */
  private async executeMarketIntelligenceWithErrorHandling(): Promise<void> {
    try {
      const result = await marketIntelligenceAgent.executeMarketIntelligenceGathering();
      
      if (result.success) {
        console.log(`✅ Market intelligence completed: ${result.itemsCreated} items created`);
      } else {
        console.error(`❌ Market intelligence failed: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Market intelligence agent execution error:', error);
    }
  }

  /**
   * Schedule cleanup tasks to run every 6 hours
   */
  private scheduleCleanupTasks(): void {
    const CLEANUP_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

    const interval = setInterval(async () => {
      try {
        console.log('🧹 Running scheduled cleanup tasks...');
        
        // Clean up expired market intelligence
        await storage.deleteExpiredMarketIntelligence();
        
        // Clean up expired short-term memory
        await storage.deleteExpiredMemoryShort();
        
        // Clean up expired agent context
        await storage.deleteExpiredContext();
        
        console.log('✅ Cleanup tasks completed');
        
      } catch (error) {
        console.error('❌ Cleanup tasks failed:', error);
      }
    }, CLEANUP_INTERVAL);

    this.intervals.set('cleanup', interval);
    console.log(`🧹 Cleanup tasks scheduled every ${CLEANUP_INTERVAL / 1000 / 60 / 60} hours`);
  }

  /**
   * Stop a specific scheduled task
   */
  stopTask(taskName: string): void {
    const interval = this.intervals.get(taskName);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(taskName);
      console.log(`⏹️ Stopped scheduled task: ${taskName}`);
    } else {
      console.warn(`⚠️ Task not found: ${taskName}`);
    }
  }

  /**
   * Stop all scheduled tasks
   */
  stopAll(): void {
    console.log('⏹️ Stopping all scheduled tasks...');
    
    for (const [taskName, interval] of this.intervals) {
      clearInterval(interval);
      console.log(`⏹️ Stopped: ${taskName}`);
    }
    
    this.intervals.clear();
    this.isInitialized = false;
    console.log('✅ All scheduled tasks stopped');
  }

  /**
   * Get status of all scheduled tasks
   */
  getStatus(): {
    initialized: boolean;
    activeTasks: string[];
    taskCount: number;
  } {
    return {
      initialized: this.isInitialized,
      activeTasks: Array.from(this.intervals.keys()),
      taskCount: this.intervals.size
    };
  }

  /**
   * Manually trigger market intelligence gathering
   */
  async triggerMarketIntelligence(): Promise<{
    success: boolean;
    message: string;
    itemsCreated?: number;
    error?: string;
  }> {
    try {
      console.log('🔧 Manual market intelligence trigger requested');
      
      const shouldExecute = await marketIntelligenceAgent.shouldExecute();
      if (!shouldExecute) {
        return {
          success: false,
          message: 'Agent recently executed, wait before triggering again'
        };
      }

      const result = await marketIntelligenceAgent.executeMarketIntelligenceGathering();
      
      return {
        success: result.success,
        message: result.success ? 'Market intelligence gathering completed' : 'Market intelligence gathering failed',
        itemsCreated: result.itemsCreated,
        error: result.error
      };
      
    } catch (error) {
      console.error('❌ Manual market intelligence trigger failed:', error);
      
      return {
        success: false,
        message: 'Failed to trigger market intelligence gathering',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get next scheduled execution times
   */
  async getSchedule(): Promise<{
    marketIntelligence?: {
      nextScheduled?: Date;
      lastExecution?: Date;
    };
  }> {
    try {
      const agentStatus = await marketIntelligenceAgent.getStatus();
      
      return {
        marketIntelligence: {
          nextScheduled: agentStatus.nextScheduled,
          lastExecution: agentStatus.lastExecution
        }
      };
    } catch (error) {
      console.error('❌ Failed to get schedule:', error);
      return {};
    }
  }
}

export const schedulerService = new SchedulerService();