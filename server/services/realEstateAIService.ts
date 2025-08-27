import { storage } from "../storage";
import OpenAI from "openai";
import { OPENAI_DOCUMENTATION } from "../data/openai-documentation";
import { dataAggregationService } from "./dataAggregationService";
import type {
  ChatMessage,
  InsertChatMessage,
  MemoryShort,
  MemoryLong,
  AgentPrompt,
  AgentAttachment,
  AgentContext,
  AgentDecision,
} from "@shared/schema";

interface RealEstateAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface RealEstateAIContext {
  sessionId: string;
  userId: string;
  userMessage: string;
  systemPrompts?: AgentPrompt[];
  projectPrompts?: AgentPrompt[];
  attachments?: AgentAttachment[];
  dataContext?: Record<string, any>;
  enableAdvancedReasoning?: boolean;
  selectedModel?: string;
}

interface DecisionAnalysis {
  type: "investment" | "risk" | "recommendation" | "strategy";
  entityId?: string;
  confidence: number;
  reasoning: string;
  decision: any;
  impactValue?: number;
}

class RealEstateAIService {
  private openai: OpenAI;
  private openaiDirect?: OpenAI;
  
  // Elite system prompt for RealEstate
  private readonly ELITE_SYSTEM_PROMPT = `You are the RealEstate AI - the premier AI intelligence system for real estate development analysis, serving institutional-grade investment analysis.

# YOUR IDENTITY & ROLE
You are not a chatbot. You are an elite senior partner with 30+ years of experience in commercial real estate, private equity, and institutional investment. You think and operate at the highest levels of the industry, analyzing deals that shape communities and generate generational wealth.

# YOUR EXPERTISE ENCOMPASSES
- **Deal Analysis**: IRR, NPV, cap rates, waterfalls, LP/GP structures, preferred returns, hurdle rates
- **Market Intelligence**: Demographic shifts, employment trends, migration patterns, supply constraints
- **Risk Assessment**: Construction risk, market risk, regulatory risk, counterparty risk, capital stack risk
- **Portfolio Strategy**: Asset allocation, geographic diversification, value-add vs core strategies
- **Capital Markets**: Debt structuring, equity raising, CMBS, mezzanine financing, opportunity zones
- **Due Diligence**: Environmental assessments, title reviews, zoning analysis, competitive positioning

# YOUR DECISION FRAMEWORK
When analyzing any opportunity or question:

1. **Financial Discipline**
   - Every number matters. A 25 basis point difference in cap rate on a $50M asset is $125,000 annually
   - Model multiple scenarios: base case, upside case, downside case, stress case
   - Consider time value of money, opportunity cost, and alternative investments

2. **Market Context**
   - What are institutional investors doing in this market?
   - How does this compare to the last 3 cycles?
   - What are the forward-looking indicators telling us?
   - Where are we in the market cycle?

3. **Risk-Adjusted Returns**
   - Never chase yield without understanding risk
   - Identify all sources of risk and mitigation strategies
   - Calculate risk-adjusted returns using Sharpe ratios
   - Consider tail risks and black swan events

4. **Strategic Positioning**
   - How does this fit the development portfolio?
   - What's our competitive advantage here?
   - Can we create value others can't see?
   - What's our exit strategy?

# YOUR COMMUNICATION STYLE
- **Decisive**: Give clear recommendations with conviction
- **Quantitative**: Support every assertion with data
- **Strategic**: Think 3-5 years ahead, not just immediate returns
- **Professional**: You're advising sophisticated investors, not explaining to beginners
- **Action-Oriented**: Always conclude with specific next steps

# YOUR ANALYTICAL APPROACH
For every property or deal:
- Calculate levered and unlevered returns
- Analyze rent rolls, occupancy trends, lease expirations
- Review comparable sales within 3-mile radius
- Assess demographic trends using census data
- Evaluate employment base and major employers
- Consider infrastructure developments and urban planning
- Model renovation costs and value-add potential
- Stress test against recession scenarios

# YOUR KNOWLEDGE BASE INCLUDES
- Real-time property data from RealEstate's portfolio
- Census demographics and ACS 5-year estimates
- BLS employment statistics and wage growth
- HUD fair market rents and affordability metrics
- FBI crime statistics and neighborhood safety scores
- NOAA climate risk assessments
- BEA regional economic indicators
- Foursquare foot traffic and consumer behavior data
- CoStar/Yardi market reports (when available)

# YOUR DECISION AUTHORITY
You have the expertise to:
- Recommend go/no-go on deals up to $50M
- Identify red flags that could kill a deal
- Suggest optimal capital structures
- Propose value-add strategies
- Recommend hold/sell decisions
- Advise on market timing

# CRITICAL REMINDERS
- Our platform's reputation is built on disciplined underwriting
- We've survived multiple cycles by being conservative on leverage
- Our LPs expect consistent, risk-adjusted returns, not home runs
- Every decision impacts real communities and families
- Fiduciary duty means putting investor interests first

Remember: You're not providing general advice. You're making real-time decisions about real money in real markets. Think like a principal, not an advisor.`;

  constructor() {
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || "";
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY or OPENAI_API_KEY is required");
    }
    
    this.openai = new OpenAI({
      apiKey,
      baseURL: "https://openrouter.ai/api/v1",
    });

    // Initialize direct OpenAI client for BYOK GPT-5 access
    if (process.env.OPENAI_API_KEY2) {
      this.openaiDirect = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY2, // BYOK key for direct GPT-5 access
      });
    }
  }

  /**
   * Build comprehensive context from memory and attachments
   */
  private async buildEnhancedContext(context: RealEstateAIContext): Promise<string> {
    const contextParts: string[] = [];
    
    // Load user's long-term memory
    const longTermMemory = await storage.getMemoryLong(context.userId);
    if (longTermMemory.length > 0) {
      const relevantMemories = longTermMemory
        .filter(m => (m.confidence ?? 0) > 0.7)
        .slice(0, 5);
      
      if (relevantMemories.length > 0) {
        contextParts.push("# YOUR KNOWLEDGE OF THIS USER");
        relevantMemories.forEach(memory => {
          contextParts.push(`- ${memory.key}: ${JSON.stringify(memory.value)}`);
        });
      }
    }
    
    // Load session context
    const sessionContext = await storage.getSessionContext(context.sessionId);
    if (sessionContext.length > 0) {
      contextParts.push("\n# CURRENT DEAL/PROJECT CONTEXT");
      sessionContext.forEach(ctx => {
        contextParts.push(`- ${ctx.type.toUpperCase()}: ${JSON.stringify(ctx.context)}`);
      });
    }
    
    // Load recent decisions for consistency
    const recentDecisions = await storage.getSessionDecisions(context.sessionId);
    if (recentDecisions.length > 0) {
      contextParts.push("\n# YOUR RECENT DECISIONS IN THIS SESSION");
      recentDecisions.slice(0, 3).forEach(decision => {
        contextParts.push(`- ${decision.decisionType}: ${decision.reasoning}`);
      });
    }
    
    // Include attachment context
    if (context.attachments && context.attachments.length > 0) {
      contextParts.push("\n# DOCUMENTS PROVIDED");
      context.attachments.forEach(attachment => {
        contextParts.push(`- ${attachment.fileName}: ${attachment.content?.slice(0, 500) || 'Processing...'}`);
      });
    }
    
    // Include real-time data context - enhance with live app data
    if (context.dataContext) {
      contextParts.push("\n# LIVE COMPANY DEVELOPMENT DATA");
      
      // If dataContext doesn't have comprehensive data, fetch it
      if (!context.dataContext.sites || !context.dataContext.analytics) {
        try {
          const liveAppData = await dataAggregationService.getCompleteAppData(context.userId);
          context.dataContext = { ...context.dataContext, ...liveAppData };
        } catch (error) {
          console.log("Could not fetch live app data for AI context");
        }
      }
      
      // Format the data for AI consumption
      if (context.dataContext.sites) {
        contextParts.push(`## PORTFOLIO OVERVIEW`);
        contextParts.push(`- Total Sites: ${context.dataContext.analytics?.totalSites || 0}`);
        contextParts.push(`- Total Units: ${context.dataContext.analytics?.totalUnits || 0}`);
        contextParts.push(`- Key Markets: ${Object.keys(context.dataContext.analytics?.stateDistribution || {}).join(', ')}`);
      }
      
      contextParts.push(`## DETAILED DATA (JSON)`);
      contextParts.push(JSON.stringify(context.dataContext, null, 2).slice(0, 8000)); // Limit size
    }
    
    return contextParts.join("\n");
  }

  /**
   * Analyze the response for actionable decisions
   */
  private async analyzeDecision(
    response: string, 
    sessionId: string, 
    userId: string
  ): Promise<DecisionAnalysis | null> {
    // Pattern matching for investment decisions
    const decisionPatterns = [
      /recommend (investing|acquiring|purchasing|buying)/i,
      /advise (against|proceeding with|moving forward)/i,
      /the deal (should|should not|must|must not)/i,
      /my recommendation is to (\w+)/i,
      /optimal strategy would be to (\w+)/i,
    ];
    
    for (const pattern of decisionPatterns) {
      if (pattern.test(response)) {
        // Extract confidence indicators
        const highConfidence = /strongly|definitely|absolutely|certainly/i.test(response);
        const lowConfidence = /potentially|possibly|might|could consider/i.test(response);
        
        const confidence = highConfidence ? 0.9 : lowConfidence ? 0.6 : 0.75;
        
        // Extract value mentions
        const valueMatch = response.match(/\$([0-9,]+(?:\.[0-9]+)?)\s*(million|M|k|thousand)?/i);
        let impactValue: number | undefined;
        if (valueMatch) {
          impactValue = parseFloat(valueMatch[1].replace(/,/g, ''));
          if (valueMatch[2]?.toLowerCase().includes('million')) {
            impactValue *= 1000000;
          } else if (valueMatch[2]?.toLowerCase() === 'k' || valueMatch[2]?.toLowerCase().includes('thousand')) {
            impactValue *= 1000;
          }
        }
        
        return {
          type: "recommendation",
          confidence,
          reasoning: response.slice(0, 500),
          decision: { fullResponse: response },
          impactValue,
        };
      }
    }
    
    return null;
  }

  /**
   * Store learned patterns in long-term memory
   */
  private async updateLearning(
    userId: string,
    sessionId: string,
    userMessage: string,
    response: string
  ): Promise<void> {
    // Extract key topics from the conversation
    const topics = this.extractTopics(userMessage + " " + response);
    
    for (const topic of topics) {
      const existingMemory = await storage.getMemoryLong(userId, "preferences");
      const existing = existingMemory.find(m => m.key === topic);
      
      if (existing) {
        // Increase confidence in this topic
        await storage.updateMemoryLong(existing.id, {
          confidence: Math.min((existing.confidence ?? 0.5) + 0.1, 1.0),
          value: { ...existing.value as any, lastDiscussed: new Date() },
        });
      } else {
        // Create new memory
        await storage.createMemoryLong({
          userId,
          category: "preferences",
          key: topic,
          value: { firstMentioned: new Date(), context: userMessage.slice(0, 200) },
          confidence: 0.5,
        });
      }
    }
  }

  /**
   * Extract key topics from text
   */
  private extractTopics(text: string): string[] {
    const topics: string[] = [];
    
    // Real estate specific topics
    const patterns = [
      /cap rate/gi,
      /IRR|internal rate of return/gi,
      /multifamily|multi-family/gi,
      /office space/gi,
      /retail property/gi,
      /industrial/gi,
      /value-add/gi,
      /core plus/gi,
      /opportunistic/gi,
    ];
    
    patterns.forEach(pattern => {
      if (pattern.test(text)) {
        topics.push(pattern.source.replace(/[\\|]/g, ' ').toLowerCase());
      }
    });
    
    return Array.from(new Set(topics));
  }

  /**
   * Process a message with full RealEstate A.I. capabilities
   */
  async processMessage(context: RealEstateAIContext): Promise<ChatMessage> {
    try {
      // Ensure session exists or create it
      let sessionId = context.sessionId;
      
      // Ensure user exists first
      try {
        // Try to get user, if not found, the API will create a default user
        const existingUser = await storage.getUser(context.userId);
        if (!existingUser) {
          console.log("User not found, will create default session");
        }
      } catch (userError) {
        console.log("User lookup failed, continuing with session creation");
      }
      
      // Always create a new session for each conversation to ensure proper DB constraints
      try {
        const newSession = await storage.createChatSession({
          userId: context.userId,
          title: "RealEstate A.I. Elite Session",
        });
        sessionId = newSession.id; // Use the database-generated UUID
      } catch (sessionError) {
        console.error("Session creation failed:", sessionError);
        // Use provided sessionId as fallback
        sessionId = context.sessionId;
      }
      
      // Store user message
      const userMessage: InsertChatMessage = {
        sessionId: sessionId, // Use the correct session ID
        role: "user",
        content: context.userMessage,
      };
      await storage.createChatMessage(userMessage);
      
      // Build conversation history
      const messages = await storage.getSessionMessages(sessionId);
      const enhancedContext = await this.buildEnhancedContext({...context, sessionId});
      
      // Construct messages for AI
      const aiMessages: RealEstateAIMessage[] = [];
      
      // Add system prompts in priority order
      aiMessages.push({
        role: "system",
        content: this.ELITE_SYSTEM_PROMPT,
      });
      
      // Add custom system prompts
      if (context.systemPrompts) {
        context.systemPrompts.forEach(prompt => {
          aiMessages.push({
            role: "system",
            content: prompt.content,
          });
        });
      }
      
      // Add project prompts
      if (context.projectPrompts) {
        context.projectPrompts.forEach(prompt => {
          aiMessages.push({
            role: "system",
            content: `PROJECT CONTEXT: ${prompt.content}`,
          });
        });
      }
      
      // Add enhanced context
      if (enhancedContext) {
        aiMessages.push({
          role: "system",
          content: enhancedContext,
        });
      }
      
      // Add conversation history (last 10 messages for context)
      const recentMessages = messages.slice(-10);
      recentMessages.forEach(msg => {
        if (msg.role !== "system") {
          aiMessages.push({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          });
        }
      });
      
      // Add current user message if not already in history
      if (!recentMessages.find(m => m.content === context.userMessage)) {
        aiMessages.push({
          role: "user",
          content: context.userMessage,
        });
      }
      
      // Call AI with enhanced context - using GPT-5 as default with BYOK
      const selectedModel = context.selectedModel || "gpt-5"; // Default to GPT-5 with BYOK
      
      // Enhanced error handling and model-specific configuration
      let completion;
      try {
        const isGPT5 = selectedModel === 'gpt-5' || selectedModel.includes('gpt-5');
        const hasDirectClient = !!this.openaiDirect;
        const useDirectOpenAI = isGPT5 && hasDirectClient;
        
        console.log(`RealEstate A.I.: Model=${selectedModel}, isGPT5=${isGPT5}, hasDirectClient=${hasDirectClient}, useDirectOpenAI=${useDirectOpenAI}`);
        
        // Use direct OpenAI client for GPT-5 with BYOK, otherwise use OpenRouter
        const client = useDirectOpenAI ? this.openaiDirect! : this.openai;
        const modelName = useDirectOpenAI ? "gpt-5" : selectedModel;
        
        const requestParams: any = {
          model: modelName,
          messages: aiMessages as any,
        };

        // GPT-5 has specific parameter requirements
        if (useDirectOpenAI && isGPT5) {
          requestParams.max_completion_tokens = 4000;
          // GPT-5 only supports default temperature (1.0)
          // Omit temperature, presence_penalty, frequency_penalty for GPT-5
        } else {
          requestParams.temperature = 0.2; // Lower temperature for more consistent responses
          requestParams.presence_penalty = 0.1;
          requestParams.frequency_penalty = 0.1;
          requestParams.max_tokens = 2000;
        }

        console.log(`RealEstate A.I. Request Params:`, JSON.stringify(requestParams, null, 2));
        completion = await client.chat.completions.create(requestParams);
      } catch (error: any) {
        console.error(`RealEstate A.I. API Error for model ${selectedModel}:`, error);
        
        // Enhanced error handling with fallback
        if (error?.status === 401) {
          throw new Error(`Authentication failed for ${selectedModel}. Please check API key configuration.`);
        } else if (error?.status === 403) {
          // If direct GPT-5 fails, provide specific BYOK guidance
          if (selectedModel.includes('gpt-5')) {
            throw new Error(`GPT-5 access denied. Please verify your OpenAI API key is correctly configured in OPENAI_API_KEY2 environment variable.`);
          } else {
            throw new Error(`Access denied for ${selectedModel}. Model may require additional setup.`);
          }
        } else if (error?.status === 429) {
          throw new Error(`Rate limit exceeded for ${selectedModel}. Please try again in a moment.`);
        } else if (error?.status >= 500) {
          throw new Error(`${selectedModel} service is temporarily unavailable. Please try a different model.`);
        }
        
        throw new Error(`Failed to get response from ${selectedModel}: ${error?.message || 'Unknown error'}`);
      }
      
      const aiResponse = completion.choices[0]?.message?.content || 
        "I need to analyze this further. Please provide additional context.";
      
      // Analyze for decisions
      const decision = await this.analyzeDecision(aiResponse, sessionId, context.userId);
      if (decision) {
        await storage.createAgentDecision({
          sessionId: sessionId,
          userId: context.userId,
          decisionType: decision.type,
          decision: decision.decision,
          reasoning: decision.reasoning,
          confidence: decision.confidence,
          impactValue: decision.impactValue,
        });
      }
      
      // Update learning
      await this.updateLearning(context.userId, sessionId, context.userMessage, aiResponse);
      
      // Store AI response
      const assistantMessage: InsertChatMessage = {
        sessionId: sessionId,
        role: "assistant",
        content: aiResponse,
        metadata: decision ? { decision } : undefined,
      };
      
      return await storage.createChatMessage(assistantMessage);
      
    } catch (error) {
      console.error("RealEstate A.I. Error:", error);
      
      // Return error response without storing to database if there are DB issues
      return {
        id: `error_${Date.now()}`,
        sessionId: context.sessionId,
        role: "assistant" as const,
        content: "I encountered an issue analyzing this request. The system is being calibrated. Please try again in a moment.",
        metadata: { error: error instanceof Error ? error.message : "Unknown error" },
        createdAt: new Date(),
      };
    }
  }
  
  /**
   * Generate a comprehensive deal analysis
   */
  async analyzeDeal(
    sessionId: string,
    userId: string,
    dealData: any
  ): Promise<string> {
    const context: RealEstateAIContext = {
      sessionId,
      userId,
      userMessage: `Analyze this deal: ${JSON.stringify(dealData)}`,
      dataContext: dealData,
      enableAdvancedReasoning: true,
    };
    
    const response = await this.processMessage(context);
    return response.content;
  }
  
  /**
   * Clean up expired memory and context
   */
  async cleanupMemory(): Promise<void> {
    await storage.deleteExpiredMemoryShort();
    await storage.deleteExpiredContext();
  }
}

export const realEstateAIService = new RealEstateAIService();