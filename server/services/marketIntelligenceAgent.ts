import { storage } from '../storage';
import { InsertMarketIntelligence, InsertAgentExecution } from '@shared/schema';

interface PerplexityResponse {
  id: string;
  model: string;
  object: string;
  created: number;
  citations: string[];
  choices: Array<{
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
    delta: {
      role: string;
      content: string;
    };
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class MarketIntelligenceAgent {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
  private readonly agentName = 'market-intelligence-agent';
  
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️ OpenRouter API key not found - Market Intelligence Agent will use fallback data');
    }
  }

  /**
   * Main execution method - searches for market intelligence and processes results
   */
  async executeMarketIntelligenceGathering(): Promise<{
    success: boolean;
    itemsCreated: number;
    executionData: any;
    error?: string;
  }> {
    // Skip execution if no API key is available
    if (!this.apiKey) {
      console.log('⏭️ Skipping market intelligence gathering - no API key configured');
      return {
        success: true,
        itemsCreated: 0,
        executionData: { skipped: true, reason: 'No API key configured' }
      };
    }

    const executionId = await this.startExecution();
    
    try {
      console.log('🔍 Starting automated market intelligence gathering...');
      
      const searchQueries = this.getSearchQueries();
      const results: any[] = [];
      let totalItemsCreated = 0;

      for (const query of searchQueries) {
        try {
          console.log(`🌐 Searching: ${query.topic}`);
          const searchResult = await this.searchWithPerplexity(query.query, query.category);
          
          if (searchResult) {
            const intelligenceEntries = await this.processSearchResult(searchResult, query);
            totalItemsCreated += intelligenceEntries.length;
            results.push({
              query: query.topic,
              category: query.category,
              itemsFound: intelligenceEntries.length,
              entries: intelligenceEntries.map(e => ({ id: e.id, title: e.title }))
            });
          }
        } catch (error) {
          console.error(`❌ Search failed for ${query.topic}:`, error);
          results.push({
            query: query.topic,
            category: query.category,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      await this.completeExecution(executionId, totalItemsCreated, results);
      
      console.log(`✅ Market Intelligence gathering completed: ${totalItemsCreated} items created`);
      
      return {
        success: true,
        itemsCreated: totalItemsCreated,
        executionData: {
          queries: searchQueries.length,
          results: results,
          timestamp: new Date().toISOString()
        }
      };
      
    } catch (error) {
      console.error('❌ Market Intelligence Agent execution failed:', error);
      await this.failExecution(executionId, error instanceof Error ? error.message : 'Unknown error');
      
      // If API key issues, create sample entries to demonstrate functionality
      if (!this.apiKey || (error instanceof Error && error.message.includes('401'))) {
        console.log('🔧 Creating sample market intelligence entries due to API key issues');
        const sampleEntries = await this.createSampleEntries();
        
        return {
          success: true,
          itemsCreated: sampleEntries.length,
          executionData: { 
            note: 'Created sample entries - Perplexity API key needed for real data',
            sampleEntries: sampleEntries.length
          }
        };
      }
      
      return {
        success: false,
        itemsCreated: 0,
        executionData: { error: error instanceof Error ? error.message : 'Unknown error' },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Search queries for different market intelligence categories
   */
  private getSearchQueries() {
    const today = new Date();
    const recentDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    return [
      {
        topic: 'Federal Reserve Interest Rate Policy',
        category: 'monetary_policy',
        query: `Federal Reserve interest rate decision mortgage rates real estate market impact since ${recentDate}`
      },
      {
        topic: 'Sunbelt Population Migration',
        category: 'demographics', 
        query: `population migration trends sunbelt states Texas Florida North Carolina Tennessee real estate demand ${new Date().getFullYear()}`
      },
      {
        topic: 'Multifamily Construction Costs',
        category: 'development',
        query: `multifamily apartment construction costs materials labor availability ${new Date().getFullYear()} real estate development`
      },
      {
        topic: 'Institutional Capital Real Estate',
        category: 'capital_markets',
        query: `institutional investors pension funds multifamily real estate cap rates investment activity recent weeks`
      },
      {
        topic: 'Employment and Job Growth',
        category: 'employment',
        query: `employment job growth United States regional markets real estate demand rental market impact ${recentDate}`
      },
      {
        topic: 'Housing Market Regulatory Changes',
        category: 'regulatory',
        query: `housing market regulation zoning policy multifamily development local government changes recent news`
      }
    ];
  }

  /**
   * Search with Perplexity API for real-time market intelligence
   */
  private async searchWithPerplexity(query: string, category: string): Promise<PerplexityResponse | null> {
    if (!this.apiKey) {
      console.warn('⚠️ No Perplexity API key - skipping search');
      return null;
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'perplexity/sonar-deep-research',
          messages: [
            {
              role: 'system',
              content: `You are a market intelligence analyst for Company Development Group, a real estate investment firm. Analyze recent news and provide specific, actionable insights for real estate investment decisions. Focus on concrete data, trends, and implications for multifamily real estate investments. Include specific dates, numbers, and sources when available.`
            },
            {
              role: 'user',
              content: query
            }
          ],
          max_tokens: 2000,
          temperature: 0.2,
          top_p: 0.9,
          stream: false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`);
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
      }

      const data: PerplexityResponse = await response.json();
      return data;
      
    } catch (error) {
      console.error('❌ Perplexity search failed:', error);
      throw error;
    }
  }

  /**
   * Process search results and create market intelligence entries
   */
  private async processSearchResult(
    searchResult: PerplexityResponse, 
    queryInfo: { topic: string; category: string; query: string }
  ): Promise<any[]> {
    const content = searchResult.choices[0]?.message?.content || '';
    const citations = searchResult.citations || [];
    
    if (!content || content.length < 50) {
      console.warn(`⚠️ Insufficient content for ${queryInfo.topic}`);
      return [];
    }

    // Extract key insights from the content
    const insights = this.extractInsights(content, queryInfo.category);
    const createdEntries = [];

    for (const insight of insights) {
      try {
        const intelligence: InsertMarketIntelligence = {
          title: insight.title,
          description: insight.description,
          source: 'Perplexity Search',
          sourceUrl: citations[0] || null,
          category: queryInfo.category,
          impact: insight.impact,
          priority: insight.priority,
          bristolImplication: insight.bristolImplication,
          actionRequired: insight.actionRequired,
          agentSource: this.agentName,
          metadata: {
            searchQuery: queryInfo.query,
            citations: citations,
            fullContent: content,
            extractionTimestamp: new Date().toISOString(),
            perplexityModel: searchResult.model
          },
          // Set expiration to 30 days from now
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        };

        const created = await storage.createMarketIntelligence(intelligence);
        createdEntries.push(created);
        console.log(`📝 Created intelligence entry: ${insight.title}`);
        
      } catch (error) {
        console.error('❌ Failed to create intelligence entry:', error);
      }
    }

    return createdEntries;
  }

  /**
   * Extract actionable insights from search content
   */
  private extractInsights(content: string, category: string): Array<{
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    priority: number;
    bristolImplication: string;
    actionRequired: boolean;
  }> {
    // Split content into meaningful segments
    const paragraphs = content.split('\n').filter(p => p.trim().length > 30);
    const insights = [];

    // Look for key phrases that indicate market-moving information
    const highImpactKeywords = [
      'federal reserve', 'interest rate', 'fed decision', 'rate cut', 'rate hike',
      'employment report', 'job growth', 'unemployment', 'inflation',
      'construction costs', 'material prices', 'labor shortage',
      'cap rates', 'institutional investment', 'pension fund', 'real estate investment'
    ];

    const mediumImpactKeywords = [
      'migration', 'population growth', 'demographic shift',
      'zoning', 'regulation', 'policy change',
      'supply pipeline', 'new construction', 'development'
    ];

    let insightCount = 0;
    const maxInsights = 3; // Limit to avoid noise

    for (const paragraph of paragraphs) {
      if (insightCount >= maxInsights) break;
      
      const lowerContent = paragraph.toLowerCase();
      let impact: 'high' | 'medium' | 'low' = 'low';
      let priority = 5;

      // Determine impact level
      if (highImpactKeywords.some(keyword => lowerContent.includes(keyword))) {
        impact = 'high';
        priority = 8;
      } else if (mediumImpactKeywords.some(keyword => lowerContent.includes(keyword))) {
        impact = 'medium';
        priority = 6;
      }

      // Only create insights for medium/high impact items
      if (impact !== 'low' && paragraph.length > 50) {
        const title = this.extractTitle(paragraph, category);
        const bristolImplication = this.generateCompanyImplication(paragraph, category);
        
        insights.push({
          title,
          description: paragraph.trim(),
          impact,
          priority,
          bristolImplication,
          actionRequired: impact === 'high' || paragraph.toLowerCase().includes('action') || paragraph.toLowerCase().includes('decision')
        });

        insightCount++;
      }
    }

    // If no insights found, create one summary insight
    if (insights.length === 0 && content.length > 100) {
      insights.push({
        title: `${category.replace('_', ' ')} Market Update`,
        description: content.substring(0, 500) + (content.length > 500 ? '...' : ''),
        impact: 'medium' as const,
        priority: 5,
        bristolImplication: `Monitor ${category.replace('_', ' ')} trends for potential portfolio impact`,
        actionRequired: false
      });
    }

    return insights;
  }

  /**
   * Extract a meaningful title from content
   */
  private extractTitle(content: string, category: string): string {
    // Look for sentence that contains key information
    const sentences = content.split(/[.!?]/).filter(s => s.trim().length > 10);
    
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (trimmed.length < 100 && trimmed.length > 20) {
        // Check if it contains actionable information
        if (trimmed.toLowerCase().includes('rate') || 
            trimmed.toLowerCase().includes('growth') ||
            trimmed.toLowerCase().includes('increased') ||
            trimmed.toLowerCase().includes('decreased') ||
            trimmed.toLowerCase().includes('change')) {
          return trimmed;
        }
      }
    }

    // Fallback to category-based title
    const categoryTitles = {
      monetary_policy: 'Federal Reserve Policy Update',
      demographics: 'Population Migration Trends',
      development: 'Construction Market Conditions',
      capital_markets: 'Investment Activity Update',
      employment: 'Employment Market Changes',
      regulatory: 'Regulatory Environment Update'
    };

    return categoryTitles[category as keyof typeof categoryTitles] || 'Market Intelligence Update';
  }

  /**
   * Generate Company-specific implications
   */
  private generateCompanyImplication(content: string, category: string): string {
    const lowerContent = content.toLowerCase();

    if (category === 'monetary_policy') {
      if (lowerContent.includes('rate cut') || lowerContent.includes('lower rates')) {
        return 'Positive for acquisition financing and refinancing pipeline - expect improved deal economics';
      } else if (lowerContent.includes('rate hike') || lowerContent.includes('higher rates')) {
        return 'May pressure acquisition activity - reassess deal pipeline and financing strategy';
      }
      return 'Monitor impact on borrowing costs and cap rates across portfolio markets';
    }

    if (category === 'demographics') {
      if (lowerContent.includes('migration') || lowerContent.includes('population growth')) {
        return 'Potential rent growth opportunity in target markets - accelerate acquisition efforts';
      }
      return 'Assess demographic trends for portfolio positioning and market selection';
    }

    if (category === 'development') {
      if (lowerContent.includes('costs') && (lowerContent.includes('rising') || lowerContent.includes('increase'))) {
        return 'Rising construction costs may limit new supply - positive for existing assets';
      } else if (lowerContent.includes('costs') && (lowerContent.includes('declining') || lowerContent.includes('decrease'))) {
        return 'Consider restarting development projects - improved construction economics';
      }
      return 'Evaluate development pipeline and construction cost assumptions';
    }

    if (category === 'capital_markets') {
      if (lowerContent.includes('cap rates') || lowerContent.includes('compression')) {
        return 'Monitor valuation impact - consider disposition opportunities';
      }
      return 'Assess competitive landscape and pricing expectations for acquisitions';
    }

    return 'Monitor trends for potential portfolio impact and strategic implications';
  }

  /**
   * Start agent execution tracking
   */
  private async startExecution(): Promise<string> {
    const execution: InsertAgentExecution = {
      agentName: this.agentName,
      executionType: 'scheduled',
      status: 'running',
      executionData: {
        startReason: 'automated_market_intelligence_gathering',
        searchQueries: this.getSearchQueries().length
      },
      // Schedule next execution for 2 hours from now
      nextScheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000)
    };

    const created = await storage.createAgentExecution(execution);
    return created.id;
  }

  /**
   * Complete successful execution
   */
  private async completeExecution(executionId: string, itemsCreated: number, results: any[]): Promise<void> {
    const duration = Date.now() - new Date().getTime();
    
    await storage.updateAgentExecution(executionId, {
      status: 'completed',
      completedAt: new Date(),
      duration,
      itemsCreated,
      executionData: {
        results,
        completedAt: new Date().toISOString(),
        success: true
      }
    });
  }

  /**
   * Mark execution as failed
   */
  private async failExecution(executionId: string, errorMessage: string): Promise<void> {
    const duration = Date.now() - new Date().getTime();
    
    await storage.updateAgentExecution(executionId, {
      status: 'failed',
      completedAt: new Date(),
      duration,
      errorMessage,
      executionData: {
        error: errorMessage,
        failedAt: new Date().toISOString()
      }
    });
  }

  /**
   * Check if agent should run (for manual triggers)
   */
  async shouldExecute(): Promise<boolean> {
    const recentExecutions = await storage.getAgentExecutions(this.agentName, 'completed');
    
    if (recentExecutions.length === 0) {
      return true; // First run
    }

    // If API key issues and no data exists, always allow execution to create samples
    if (!this.apiKey) {
      const existingData = await storage.getMarketIntelligence(1);
      if (existingData.length === 0) {
        return true;
      }
    }

    const lastExecution = recentExecutions[0];
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    
    return lastExecution.completedAt ? lastExecution.completedAt < twoHoursAgo : true;
  }

  /**
   * Create sample market intelligence entries for demonstration
   */
  private async createSampleEntries(): Promise<any[]> {
    const sampleEntries = [
      {
        title: 'Federal Reserve Maintains Interest Rate at 5.25-5.50%',
        description: 'The Federal Reserve held interest rates steady at their current range, signaling a cautious approach to monetary policy amid mixed economic indicators. This decision impacts real estate financing costs and acquisition strategies.',
        source: 'Sample Data',
        sourceUrl: null,
        category: 'monetary_policy',
        impact: 'high' as const,
        priority: 8,
        bristolImplication: 'Stable rates provide predictable financing costs for current pipeline deals and refinancing opportunities',
        actionRequired: false,
        agentSource: this.agentName,
        metadata: {
          note: 'Sample entry - replace with Perplexity API data',
          sampleData: true
        },
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      },
      {
        title: 'Sunbelt Migration Trends Continue Strong',
        description: 'Latest census data shows continued population growth in Texas, Florida, and Tennessee markets, with young professionals driving demand for quality rental housing in urban and suburban markets.',
        source: 'Sample Data',
        sourceUrl: null,
        category: 'demographics',
        impact: 'medium' as const,
        priority: 6,
        bristolImplication: 'Strong demographic tailwinds support rental demand and rent growth in core Company markets',
        actionRequired: false,
        agentSource: this.agentName,
        metadata: {
          note: 'Sample entry - replace with Perplexity API data',
          sampleData: true
        },
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Construction Material Costs Stabilizing',
        description: 'Recent reports indicate construction material costs are stabilizing after previous volatility, with lumber and steel prices showing signs of normalization. This could impact new development timelines and costs.',
        source: 'Sample Data',
        sourceUrl: null,
        category: 'development',
        impact: 'medium' as const,
        priority: 5,
        bristolImplication: 'Improved construction cost predictability may accelerate development project timelines',
        actionRequired: false,
        agentSource: this.agentName,
        metadata: {
          note: 'Sample entry - replace with Perplexity API data',
          sampleData: true
        },
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    ];

    const createdEntries = [];
    for (const entry of sampleEntries) {
      try {
        const created = await storage.createMarketIntelligence(entry as any);
        createdEntries.push(created);
        console.log(`📝 Created sample intelligence entry: ${entry.title}`);
      } catch (error) {
        console.error('❌ Failed to create sample entry:', error);
      }
    }

    return createdEntries;
  }

  /**
   * Get agent status for monitoring
   */
  async getStatus(): Promise<{
    lastExecution?: Date;
    nextScheduled?: Date;
    recentItems: number;
    isHealthy: boolean;
  }> {
    const recentExecutions = await storage.getAgentExecutions(this.agentName);
    const lastExecution = recentExecutions[0];
    
    // Count items created in last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentIntelligence = await storage.getMarketIntelligence(100);
    const recentItems = recentIntelligence.filter(
      item => item.agentSource === this.agentName && 
              item.createdAt && 
              item.createdAt > oneDayAgo
    ).length;

    return {
      lastExecution: lastExecution?.completedAt || undefined,
      nextScheduled: lastExecution?.nextScheduledAt || undefined,
      recentItems,
      isHealthy: this.apiKey !== '' && (recentItems > 0 || !lastExecution || lastExecution.status !== 'failed')
    };
  }
}

export const marketIntelligenceAgent = new MarketIntelligenceAgent();