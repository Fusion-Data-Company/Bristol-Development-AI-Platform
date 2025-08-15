import { advancedMemoryService } from './advancedMemoryService';
import { propertyAnalysisService } from './propertyAnalysisService';
import { intelligentSearchService } from './intelligentSearchService';
import { reportGenerationService } from './reportGenerationService';

export interface ToolChain {
  id: string;
  name: string;
  description: string;
  tools: ToolStep[];
  triggers: string[];
  category: 'analysis' | 'research' | 'reporting' | 'automation';
}

export interface ToolStep {
  toolName: string;
  parameters: Record<string, any>;
  condition?: string;
  outputMapping?: Record<string, string>;
}

export interface ToolExecution {
  chainId: string;
  stepIndex: number;
  toolName: string;
  input: any;
  output: any;
  duration: number;
  success: boolean;
  error?: string;
}

export interface OrchestrationResult {
  chainId: string;
  success: boolean;
  executions: ToolExecution[];
  finalOutput: any;
  totalDuration: number;
  recommendations: string[];
}

class EnhancedToolOrchestrationService {
  private toolChains: ToolChain[] = [];
  private availableTools: Map<string, Function> = new Map();

  constructor() {
    this.initializeToolChains();
    this.registerTools();
  }

  private initializeToolChains(): void {
    this.toolChains = [
      {
        id: 'comprehensive-property-analysis',
        name: 'Comprehensive Property Analysis',
        description: 'Complete property underwriting with market comparables and risk assessment',
        tools: [
          {
            toolName: 'property-analysis',
            parameters: { includeProjections: true },
            outputMapping: { propertyId: 'propertyId', analysis: 'financialMetrics' }
          },
          {
            toolName: 'market-comparables',
            parameters: { radius: 5, limit: 10 },
            outputMapping: { comparables: 'marketData' }
          },
          {
            toolName: 'risk-assessment',
            parameters: { includeRegulatory: true },
            outputMapping: { riskFactors: 'riskProfile' }
          },
          {
            toolName: 'investment-recommendation',
            parameters: { confidenceThreshold: 0.7 },
            outputMapping: { recommendation: 'finalRecommendation' }
          }
        ],
        triggers: ['analyze property', 'underwrite deal', 'full property analysis'],
        category: 'analysis'
      },
      {
        id: 'market-intelligence-research',
        name: 'Market Intelligence Research',
        description: 'Comprehensive market research with demographic and economic analysis',
        tools: [
          {
            toolName: 'property-search',
            parameters: { includeMetrics: true },
            outputMapping: { properties: 'marketInventory' }
          },
          {
            toolName: 'demographic-analysis',
            parameters: { includeProjections: true },
            outputMapping: { demographics: 'populationData' }
          },
          {
            toolName: 'economic-indicators',
            parameters: { includeEmployment: true, includeGDP: true },
            outputMapping: { economics: 'economicContext' }
          },
          {
            toolName: 'market-trends',
            parameters: { timeframe: '5years' },
            outputMapping: { trends: 'marketDirection' }
          }
        ],
        triggers: ['market research', 'analyze market', 'market intelligence'],
        category: 'research'
      },
      {
        id: 'automated-reporting-suite',
        name: 'Automated Reporting Suite',
        description: 'Generate comprehensive reports with charts and executive summaries',
        tools: [
          {
            toolName: 'data-compilation',
            parameters: { includeCharts: true },
            outputMapping: { compiledData: 'reportData' }
          },
          {
            toolName: 'report-generation',
            parameters: { format: 'html', includeBranding: true },
            outputMapping: { report: 'generatedReport' }
          },
          {
            toolName: 'executive-summary',
            parameters: { keyMetricsOnly: true },
            outputMapping: { summary: 'executiveSummary' }
          }
        ],
        triggers: ['generate report', 'create summary', 'prepare presentation'],
        category: 'reporting'
      },
      {
        id: 'investment-opportunity-scanner',
        name: 'Investment Opportunity Scanner',
        description: 'Automated scanning for investment opportunities based on criteria',
        tools: [
          {
            toolName: 'opportunity-search',
            parameters: { sortBy: 'capRate', includeOffMarket: true },
            outputMapping: { opportunities: 'investmentTargets' }
          },
          {
            toolName: 'quick-analysis',
            parameters: { analysisDepth: 'preliminary' },
            outputMapping: { analysis: 'opportunityMetrics' }
          },
          {
            toolName: 'ranking-algorithm',
            parameters: { weightIRR: 0.4, weightRisk: 0.3, weightLocation: 0.3 },
            outputMapping: { rankings: 'prioritizedOpportunities' }
          },
          {
            toolName: 'alert-generation',
            parameters: { threshold: 'high-priority' },
            outputMapping: { alerts: 'investmentAlerts' }
          }
        ],
        triggers: ['find opportunities', 'scan market', 'investment alerts'],
        category: 'automation'
      }
    ];
  }

  private registerTools(): void {
    // Register available tools with their implementation functions
    this.availableTools.set('property-analysis', this.executePropertyAnalysis.bind(this));
    this.availableTools.set('market-comparables', this.executeMarketComparables.bind(this));
    this.availableTools.set('risk-assessment', this.executeRiskAssessment.bind(this));
    this.availableTools.set('investment-recommendation', this.executeInvestmentRecommendation.bind(this));
    this.availableTools.set('property-search', this.executePropertySearch.bind(this));
    this.availableTools.set('demographic-analysis', this.executeDemographicAnalysis.bind(this));
    this.availableTools.set('economic-indicators', this.executeEconomicIndicators.bind(this));
    this.availableTools.set('market-trends', this.executeMarketTrends.bind(this));
    this.availableTools.set('data-compilation', this.executeDataCompilation.bind(this));
    this.availableTools.set('report-generation', this.executeReportGeneration.bind(this));
    this.availableTools.set('executive-summary', this.executeExecutiveSummary.bind(this));
    this.availableTools.set('opportunity-search', this.executeOpportunitySearch.bind(this));
    this.availableTools.set('quick-analysis', this.executeQuickAnalysis.bind(this));
    this.availableTools.set('ranking-algorithm', this.executeRankingAlgorithm.bind(this));
    this.availableTools.set('alert-generation', this.executeAlertGeneration.bind(this));
  }

  // Enhanced MCP tool orchestration
  async orchestrateToolChain(
    chainId: string,
    userId: string,
    sessionId: string,
    initialInput: any = {}
  ): Promise<OrchestrationResult> {
    const startTime = Date.now();
    console.log(`🔧 Orchestrating tool chain: ${chainId} for user ${userId}`);

    try {
      const chain = this.toolChains.find(c => c.id === chainId);
      if (!chain) {
        throw new Error(`Tool chain not found: ${chainId}`);
      }

      const executions: ToolExecution[] = [];
      let currentData = { ...initialInput };
      let success = true;

      // Execute each tool in the chain
      for (let i = 0; i < chain.tools.length; i++) {
        const step = chain.tools[i];
        const stepStartTime = Date.now();

        try {
          console.log(`  🔹 Executing step ${i + 1}: ${step.toolName}`);

          // Check condition if specified
          if (step.condition && !this.evaluateCondition(step.condition, currentData)) {
            console.log(`  ⏭️ Skipping step ${i + 1}: condition not met`);
            continue;
          }

          // Prepare tool input
          const toolInput = { ...step.parameters, ...currentData };

          // Execute tool
          const tool = this.availableTools.get(step.toolName);
          if (!tool) {
            throw new Error(`Tool not found: ${step.toolName}`);
          }

          const toolOutput = await tool(toolInput, userId, sessionId);

          // Map output if specified
          if (step.outputMapping) {
            for (const [outputKey, dataKey] of Object.entries(step.outputMapping)) {
              if (toolOutput[outputKey] !== undefined) {
                currentData[dataKey] = toolOutput[outputKey];
              }
            }
          } else {
            // Merge all output into current data
            Object.assign(currentData, toolOutput);
          }

          const execution: ToolExecution = {
            chainId,
            stepIndex: i,
            toolName: step.toolName,
            input: toolInput,
            output: toolOutput,
            duration: Date.now() - stepStartTime,
            success: true
          };

          executions.push(execution);
          console.log(`  ✅ Step ${i + 1} completed in ${execution.duration}ms`);

        } catch (error) {
          const execution: ToolExecution = {
            chainId,
            stepIndex: i,
            toolName: step.toolName,
            input: { ...step.parameters, ...currentData },
            output: null,
            duration: Date.now() - stepStartTime,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };

          executions.push(execution);
          success = false;
          console.error(`  ❌ Step ${i + 1} failed:`, error);
          
          // Continue with other steps unless this is critical
          if (step.toolName.includes('critical')) {
            break;
          }
        }
      }

      // Generate recommendations based on results
      const recommendations = await this.generateRecommendations(chain, executions, currentData);

      // Store orchestration results in memory
      await advancedMemoryService.storeMemory(
        userId,
        sessionId,
        `Tool chain executed: ${chain.name} -> ${executions.length} steps, ${success ? 'success' : 'partial failure'}`,
        'task',
        { importance: 8, confidence: success ? 0.9 : 0.6 }
      );

      const result: OrchestrationResult = {
        chainId,
        success,
        executions,
        finalOutput: currentData,
        totalDuration: Date.now() - startTime,
        recommendations
      };

      console.log(`✅ Tool chain orchestration completed in ${result.totalDuration}ms`);
      return result;

    } catch (error) {
      console.error('Tool chain orchestration failed:', error);
      throw new Error(`Orchestration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Smart tool recommendation based on conversation context
  async recommendToolChains(
    userId: string,
    sessionId: string,
    conversationContext: string
  ): Promise<ToolChain[]> {
    console.log(`🎯 Generating tool recommendations for context: "${conversationContext}"`);

    try {
      // Get user's tool usage patterns from memory
      const context = await advancedMemoryService.getRelevantContext(
        userId,
        sessionId,
        conversationContext,
        15
      );

      const recommendations: ToolChain[] = [];
      const lowerContext = conversationContext.toLowerCase();

      // Analyze context and suggest appropriate tool chains
      for (const chain of this.toolChains) {
        let relevanceScore = 0;

        // Check if triggers match context
        for (const trigger of chain.triggers) {
          if (lowerContext.includes(trigger)) {
            relevanceScore += 3;
          }
        }

        // Check category relevance
        if (lowerContext.includes('analyze') || lowerContext.includes('underwrite')) {
          if (chain.category === 'analysis') relevanceScore += 2;
        }
        if (lowerContext.includes('research') || lowerContext.includes('market')) {
          if (chain.category === 'research') relevanceScore += 2;
        }
        if (lowerContext.includes('report') || lowerContext.includes('summary')) {
          if (chain.category === 'reporting') relevanceScore += 2;
        }
        if (lowerContext.includes('find') || lowerContext.includes('opportunity')) {
          if (chain.category === 'automation') relevanceScore += 2;
        }

        // Boost score based on user's past usage
        const pastUsage = context.relevantMemories.filter(m => 
          m.content.includes(chain.name) || m.content.includes(chain.id)
        );
        relevanceScore += pastUsage.length * 0.5;

        if (relevanceScore > 1) {
          recommendations.push(chain);
        }
      }

      // Sort by relevance and user preference
      recommendations.sort((a, b) => {
        const aUsage = context.relevantMemories.filter(m => m.content.includes(a.name)).length;
        const bUsage = context.relevantMemories.filter(m => m.content.includes(b.name)).length;
        return bUsage - aUsage;
      });

      console.log(`📊 Generated ${recommendations.length} tool chain recommendations`);
      return recommendations.slice(0, 5); // Top 5 recommendations

    } catch (error) {
      console.error('Error generating tool recommendations:', error);
      return this.toolChains.slice(0, 3); // Fallback to top 3 chains
    }
  }

  // Automated tool chains based on user patterns
  async executeAutomaticToolChains(
    userId: string,
    triggerEvent: string,
    eventData: any
  ): Promise<OrchestrationResult[]> {
    console.log(`🤖 Executing automatic tool chains for event: ${triggerEvent}`);

    try {
      // Get user's automation preferences
      const context = await advancedMemoryService.getRelevantContext(
        userId,
        `auto-${Date.now()}`,
        `Automation preferences for ${triggerEvent}`,
        10
      );

      const results: OrchestrationResult[] = [];

      // Find matching automation chains
      for (const chain of this.toolChains) {
        if (chain.category === 'automation' && chain.triggers.some(trigger => 
          triggerEvent.toLowerCase().includes(trigger)
        )) {
          try {
            const result = await this.orchestrateToolChain(
              chain.id,
              userId,
              `auto-${Date.now()}`,
              eventData
            );
            results.push(result);
          } catch (error) {
            console.error(`Automatic chain ${chain.id} failed:`, error);
          }
        }
      }

      console.log(`🎯 Executed ${results.length} automatic tool chains`);
      return results;

    } catch (error) {
      console.error('Automatic tool chain execution failed:', error);
      return [];
    }
  }

  private evaluateCondition(condition: string, data: any): boolean {
    // Simple condition evaluation (would be more sophisticated in production)
    try {
      // Example conditions: "data.price > 1000000", "data.capRate > 6"
      return new Function('data', `return ${condition}`)(data);
    } catch {
      return true; // Default to true if condition can't be evaluated
    }
  }

  private async generateRecommendations(
    chain: ToolChain,
    executions: ToolExecution[],
    finalData: any
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // Analyze execution results to generate recommendations
    const successfulSteps = executions.filter(e => e.success).length;
    const totalSteps = executions.length;

    if (successfulSteps === totalSteps) {
      recommendations.push(`All ${totalSteps} tools executed successfully`);
    } else {
      recommendations.push(`${successfulSteps}/${totalSteps} tools completed successfully`);
    }

    // Performance recommendations
    const avgDuration = executions.reduce((sum, e) => sum + e.duration, 0) / executions.length;
    if (avgDuration > 5000) {
      recommendations.push('Consider optimizing slow-running tools for better performance');
    }

    // Data quality recommendations
    if (finalData.confidence && finalData.confidence < 0.7) {
      recommendations.push('Low confidence results - consider gathering additional data');
    }

    // Next steps recommendations
    if (chain.category === 'analysis') {
      recommendations.push('Consider generating a detailed report based on these results');
    } else if (chain.category === 'research') {
      recommendations.push('Use these insights for property targeting and acquisition strategy');
    }

    return recommendations;
  }

  // Tool implementation methods
  private async executePropertyAnalysis(input: any, userId: string, sessionId: string): Promise<any> {
    if (!input.propertyId) {
      throw new Error('Property ID required for analysis');
    }
    return await propertyAnalysisService.analyzeProperty(
      input.propertyId,
      userId,
      input.acquisitionPrice,
      input.loanAmount,
      input.interestRate
    );
  }

  private async executeMarketComparables(input: any, userId: string, sessionId: string): Promise<any> {
    if (!input.propertyId) {
      throw new Error('Property ID required for comparables');
    }
    return await propertyAnalysisService.runCMA(input.propertyId, userId);
  }

  private async executeRiskAssessment(input: any, userId: string, sessionId: string): Promise<any> {
    // Implement risk assessment logic
    return {
      riskFactors: {
        market: 5,
        financial: 4,
        location: 3,
        regulatory: 6,
        overall: 4.5,
        factors: ['Moderate market risk', 'Stable financial metrics']
      }
    };
  }

  private async executeInvestmentRecommendation(input: any, userId: string, sessionId: string): Promise<any> {
    // Implement investment recommendation logic
    return {
      recommendation: {
        action: 'investigate',
        confidence: 0.75,
        reasoning: ['Strong financial metrics', 'Favorable market conditions'],
        targetPrice: input.price * 0.95
      }
    };
  }

  private async executePropertySearch(input: any, userId: string, sessionId: string): Promise<any> {
    const query = input.query || 'multifamily properties';
    return await intelligentSearchService.searchProperties(query, userId, input.filters);
  }

  private async executeDemographicAnalysis(input: any, userId: string, sessionId: string): Promise<any> {
    // Implement demographic analysis
    return {
      demographics: {
        population: 850000,
        growthRate: 2.1,
        medianIncome: 65000,
        unemployment: 3.8
      }
    };
  }

  private async executeEconomicIndicators(input: any, userId: string, sessionId: string): Promise<any> {
    // Implement economic indicators analysis
    return {
      economics: {
        gdpGrowth: 2.8,
        employmentGrowth: 1.5,
        businessGrowth: 3.2,
        outlook: 'positive'
      }
    };
  }

  private async executeMarketTrends(input: any, userId: string, sessionId: string): Promise<any> {
    // Implement market trends analysis
    return {
      trends: {
        priceAppreciation: 4.2,
        rentGrowth: 3.8,
        vacancyTrend: 'declining',
        demandIndicators: 'strong'
      }
    };
  }

  private async executeDataCompilation(input: any, userId: string, sessionId: string): Promise<any> {
    // Compile data for reporting
    return {
      compiledData: {
        properties: input.properties || [],
        metrics: input.metrics || {},
        analysis: input.analysis || {},
        timestamp: new Date().toISOString()
      }
    };
  }

  private async executeReportGeneration(input: any, userId: string, sessionId: string): Promise<any> {
    const reportRequest = {
      type: input.reportType || 'market-report',
      data: input.compiledData || input,
      userId,
      sessionId,
      customizations: input.customizations
    };
    
    return await reportGenerationService.generateReport(reportRequest);
  }

  private async executeExecutiveSummary(input: any, userId: string, sessionId: string): Promise<any> {
    // Generate executive summary
    return {
      summary: {
        keyMetrics: input.analysis || {},
        recommendation: input.recommendation || 'No recommendation available',
        riskLevel: input.riskFactors?.overall || 'Unknown',
        confidence: input.confidence || 0.5
      }
    };
  }

  private async executeOpportunitySearch(input: any, userId: string, sessionId: string): Promise<any> {
    const filters = {
      capRateRange: { min: 6, max: 15 },
      status: 'available',
      ...input.filters
    };
    
    return await intelligentSearchService.searchProperties(
      'investment opportunities',
      userId,
      filters
    );
  }

  private async executeQuickAnalysis(input: any, userId: string, sessionId: string): Promise<any> {
    // Quick analysis implementation
    return {
      analysis: {
        score: Math.random() * 100,
        category: 'promising',
        keyMetrics: {
          estimatedIRR: 8.5 + Math.random() * 4,
          estimatedCapRate: 5.5 + Math.random() * 2
        }
      }
    };
  }

  private async executeRankingAlgorithm(input: any, userId: string, sessionId: string): Promise<any> {
    // Ranking algorithm implementation
    const opportunities = input.opportunities || [];
    const ranked = opportunities.sort(() => Math.random() - 0.5); // Simplified ranking
    
    return {
      rankings: ranked.slice(0, 10)
    };
  }

  private async executeAlertGeneration(input: any, userId: string, sessionId: string): Promise<any> {
    // Alert generation implementation
    return {
      alerts: [
        {
          type: 'high-priority',
          message: 'New high-cap-rate opportunity detected',
          propertyId: 'prop-123',
          timestamp: new Date().toISOString()
        }
      ]
    };
  }

  // Get available tool chains
  getAvailableToolChains(): ToolChain[] {
    return this.toolChains;
  }

  // Get tool chain by ID
  getToolChain(chainId: string): ToolChain | undefined {
    return this.toolChains.find(c => c.id === chainId);
  }
}

export const enhancedToolOrchestrationService = new EnhancedToolOrchestrationService();