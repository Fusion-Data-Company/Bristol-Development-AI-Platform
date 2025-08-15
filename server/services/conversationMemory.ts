import { storage } from "../storage";

interface ConversationContext {
  sessionId: string;
  userId: string;
  recentMessages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
    metadata?: any;
  }>;
  toolHistory: Array<{
    tool: string;
    parameters: any;
    result: any;
    timestamp: string;
  }>;
  userPreferences: {
    preferredModel?: string;
    communicationStyle?: 'technical' | 'casual' | 'formal';
    dataDetailLevel?: 'basic' | 'detailed' | 'comprehensive';
    analysisDepth?: 'quick' | 'standard' | 'thorough';
  };
  conversationThemes: string[];
  lastActivity: string;
}

interface PersonalityProfile {
  investmentExperience: 'beginner' | 'intermediate' | 'expert';
  focusAreas: string[];
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  investmentGoals: string[];
  preferredMetrics: string[];
}

class ConversationMemoryService {
  private contextCache: Map<string, ConversationContext> = new Map();
  private readonly CONTEXT_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  // Get or create conversation context
  async getConversationContext(sessionId: string, userId: string): Promise<ConversationContext> {
    // Check cache first
    const cached = this.contextCache.get(sessionId);
    if (cached && Date.now() - new Date(cached.lastActivity).getTime() < this.CONTEXT_CACHE_TTL) {
      return cached;
    }

    // Fetch from database
    try {
      const messages = await storage.getChatMessages(sessionId, 20); // Last 20 messages
      const recentMessages = messages.map(msg => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
        timestamp: msg.createdAt?.toISOString() || new Date().toISOString(),
        metadata: msg.metadata
      }));

      // Extract tool history from message metadata
      const toolHistory = messages
        .filter(msg => msg.metadata?.toolCalls || msg.metadata?.toolResults)
        .flatMap(msg => {
          const tools = [];
          if (msg.metadata?.toolCalls) {
            for (const toolCall of msg.metadata.toolCalls) {
              tools.push({
                tool: toolCall.function?.name || 'unknown',
                parameters: JSON.parse(toolCall.function?.arguments || '{}'),
                result: msg.metadata.toolResults?.[toolCall.function?.name],
                timestamp: msg.createdAt?.toISOString() || new Date().toISOString()
              });
            }
          }
          return tools;
        });

      // Analyze conversation themes
      const conversationThemes = this.extractConversationThemes(recentMessages);

      // Get user preferences from message patterns
      const userPreferences = this.inferUserPreferences(recentMessages);

      const context: ConversationContext = {
        sessionId,
        userId,
        recentMessages,
        toolHistory,
        userPreferences,
        conversationThemes,
        lastActivity: new Date().toISOString()
      };

      // Cache the context
      this.contextCache.set(sessionId, context);
      
      return context;
    } catch (error) {
      console.error('Error fetching conversation context:', error);
      
      // Return minimal context
      return {
        sessionId,
        userId,
        recentMessages: [],
        toolHistory: [],
        userPreferences: {},
        conversationThemes: [],
        lastActivity: new Date().toISOString()
      };
    }
  }

  // Update conversation context with new message
  async updateConversationContext(
    sessionId: string, 
    message: { role: 'user' | 'assistant'; content: string; metadata?: any }
  ): Promise<void> {
    const context = this.contextCache.get(sessionId);
    if (context) {
      context.recentMessages.push({
        ...message,
        timestamp: new Date().toISOString()
      });

      // Keep only last 20 messages
      if (context.recentMessages.length > 20) {
        context.recentMessages = context.recentMessages.slice(-20);
      }

      // Update tool history if applicable
      if (message.metadata?.toolCalls) {
        for (const toolCall of message.metadata.toolCalls) {
          context.toolHistory.push({
            tool: toolCall.function?.name || 'unknown',
            parameters: JSON.parse(toolCall.function?.arguments || '{}'),
            result: message.metadata.toolResults?.[toolCall.function?.name],
            timestamp: new Date().toISOString()
          });
        }
      }

      // Update conversation themes
      context.conversationThemes = this.extractConversationThemes(context.recentMessages);
      context.lastActivity = new Date().toISOString();

      this.contextCache.set(sessionId, context);
    }
  }

  // Extract conversation themes from messages
  private extractConversationThemes(messages: any[]): string[] {
    const themes: Set<string> = new Set();
    
    for (const message of messages) {
      const content = message.content.toLowerCase();
      
      // Real estate themes
      if (content.includes('multifamily') || content.includes('apartment')) themes.add('multifamily');
      if (content.includes('commercial') || content.includes('office')) themes.add('commercial');
      if (content.includes('retail')) themes.add('retail');
      if (content.includes('industrial')) themes.add('industrial');
      
      // Financial themes
      if (content.includes('irr') || content.includes('return')) themes.add('financial_analysis');
      if (content.includes('cap rate') || content.includes('valuation')) themes.add('valuation');
      if (content.includes('cash flow') || content.includes('noi')) themes.add('cash_flow');
      if (content.includes('financing') || content.includes('loan')) themes.add('financing');
      
      // Market themes
      if (content.includes('demographic') || content.includes('population')) themes.add('demographics');
      if (content.includes('market') || content.includes('trends')) themes.add('market_analysis');
      if (content.includes('comparable') || content.includes('comps')) themes.add('comparables');
      
      // Location themes
      if (content.includes('atlanta') || content.includes('georgia')) themes.add('atlanta_market');
      if (content.includes('nashville') || content.includes('tennessee')) themes.add('nashville_market');
      if (content.includes('charlotte') || content.includes('carolina')) themes.add('charlotte_market');
      if (content.includes('sunbelt') || content.includes('southeast')) themes.add('sunbelt_markets');
    }
    
    return Array.from(themes);
  }

  // Infer user preferences from conversation patterns
  private inferUserPreferences(messages: any[]): any {
    const preferences: any = {};
    
    // Analyze message complexity and technical depth
    let technicalTerms = 0;
    let totalMessages = 0;
    
    for (const message of messages) {
      if (message.role === 'user') {
        totalMessages++;
        const content = message.content.toLowerCase();
        
        // Count technical terms
        const techTerms = ['irr', 'npv', 'cap rate', 'noi', 'dcf', 'ltv', 'dscr', 'basis points'];
        technicalTerms += techTerms.filter(term => content.includes(term)).length;
        
        // Detect preference patterns
        if (content.includes('detailed') || content.includes('comprehensive')) {
          preferences.dataDetailLevel = 'comprehensive';
        }
        if (content.includes('quick') || content.includes('summary')) {
          preferences.dataDetailLevel = 'basic';
        }
        if (content.includes('thorough') || content.includes('deep dive')) {
          preferences.analysisDepth = 'thorough';
        }
      }
    }
    
    // Determine communication style
    if (totalMessages > 0) {
      const techRatio = technicalTerms / totalMessages;
      if (techRatio > 2) {
        preferences.communicationStyle = 'technical';
      } else if (techRatio > 0.5) {
        preferences.communicationStyle = 'formal';
      } else {
        preferences.communicationStyle = 'casual';
      }
    }
    
    return preferences;
  }

  // Generate context-aware system prompt enhancement
  generateContextPrompt(context: ConversationContext): string {
    let contextPrompt = '';
    
    // Add conversation continuity
    if (context.recentMessages.length > 0) {
      contextPrompt += `\n## Conversation Context\nThis is an ongoing conversation. `;
      
      if (context.conversationThemes.length > 0) {
        contextPrompt += `Current focus areas: ${context.conversationThemes.join(', ')}. `;
      }
      
      // Recent tool usage
      if (context.toolHistory.length > 0) {
        const recentTools = context.toolHistory.slice(-3).map(t => t.tool);
        contextPrompt += `Recently used tools: ${recentTools.join(', ')}. `;
      }
    }
    
    // Add user preferences
    if (Object.keys(context.userPreferences).length > 0) {
      contextPrompt += `\n## User Preferences\n`;
      
      if (context.userPreferences.communicationStyle) {
        contextPrompt += `Communication style: ${context.userPreferences.communicationStyle}. `;
      }
      
      if (context.userPreferences.dataDetailLevel) {
        contextPrompt += `Data detail level: ${context.userPreferences.dataDetailLevel}. `;
      }
      
      if (context.userPreferences.analysisDepth) {
        contextPrompt += `Analysis depth: ${context.userPreferences.analysisDepth}. `;
      }
    }
    
    // Add relevant tool history context
    if (context.toolHistory.length > 0) {
      const recentToolResults = context.toolHistory.slice(-2).map(t => ({
        tool: t.tool,
        outcome: t.result?.success ? 'successful' : 'failed'
      }));
      
      contextPrompt += `\n## Recent Tool Results\n`;
      recentToolResults.forEach(result => {
        contextPrompt += `- ${result.tool}: ${result.outcome}\n`;
      });
    }
    
    return contextPrompt;
  }

  // Get user's investment personality profile
  async getUserPersonalityProfile(userId: string): Promise<PersonalityProfile | null> {
    try {
      // In a real implementation, this would be stored in a dedicated table
      // For now, we'll infer from recent conversations
      const sessions = await storage.getChatSessions(userId, 10);
      
      if (sessions.length === 0) return null;
      
      // Analyze across all sessions to build profile
      const profile: PersonalityProfile = {
        investmentExperience: 'intermediate',
        focusAreas: [],
        riskTolerance: 'moderate',
        investmentGoals: [],
        preferredMetrics: []
      };
      
      // This would be more sophisticated in production
      return profile;
      
    } catch (error) {
      console.error('Error fetching user personality profile:', error);
      return null;
    }
  }

  // Clear expired contexts from cache
  clearExpiredContexts(): void {
    const now = Date.now();
    for (const [sessionId, context] of this.contextCache.entries()) {
      if (now - new Date(context.lastActivity).getTime() > this.CONTEXT_CACHE_TTL) {
        this.contextCache.delete(sessionId);
      }
    }
  }

  // Get conversation analytics
  getConversationAnalytics(sessionId: string): any {
    const context = this.contextCache.get(sessionId);
    if (!context) return null;
    
    return {
      messageCount: context.recentMessages.length,
      toolUsageCount: context.toolHistory.length,
      conversationThemes: context.conversationThemes,
      userPreferences: context.userPreferences,
      sessionDuration: Date.now() - new Date(context.recentMessages[0]?.timestamp || Date.now()).getTime(),
      mostUsedTools: this.getMostUsedTools(context.toolHistory)
    };
  }

  private getMostUsedTools(toolHistory: any[]): Array<{ tool: string; count: number }> {
    const toolCounts = new Map<string, number>();
    
    for (const entry of toolHistory) {
      const current = toolCounts.get(entry.tool) || 0;
      toolCounts.set(entry.tool, current + 1);
    }
    
    return Array.from(toolCounts.entries())
      .map(([tool, count]) => ({ tool, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }
}

// Start cleanup interval
const conversationMemory = new ConversationMemoryService();
setInterval(() => {
  conversationMemory.clearExpiredContexts();
}, 10 * 60 * 1000); // Every 10 minutes

export { conversationMemory, ConversationMemoryService };