import { storage } from '../storage';
import { z } from 'zod';

// Advanced memory types
interface MemoryContext {
  id: string;
  userId: string;
  sessionId: string;
  type: 'conversation' | 'fact' | 'preference' | 'task' | 'relationship' | 'temporal';
  content: string;
  metadata: {
    importance: number; // 1-10 scale
    confidence: number; // 0-1 scale
    lastAccessed: string;
    accessCount: number;
    relatedContexts: string[];
    sourceInstance: 'main' | 'floating';
    vectorEmbedding?: number[];
    keywords: string[];
    entities: string[];
    topics: string[];
  };
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

interface ConversationSummary {
  sessionId: string;
  userId: string;
  keyTopics: string[];
  decisions: string[];
  actionItems: string[];
  preferences: string[];
  context: string;
  lastSummaryAt: string;
}

interface UserProfile {
  userId: string;
  preferences: {
    communicationStyle: string;
    techLevel: string;
    focus: string[];
    tools: string[];
  };
  expertise: string[];
  interests: string[];
  context: {
    currentProjects: string[];
    goals: string[];
    constraints: string[];
  };
  history: {
    totalInteractions: number;
    primaryTopics: string[];
    toolUsage: Record<string, number>;
    lastActive: string;
  };
}

class AdvancedMemoryService {
  private memoryCache = new Map<string, MemoryContext>();
  private summaryCache = new Map<string, ConversationSummary>();
  private profileCache = new Map<string, UserProfile>();

  // Initialize user profile and memory context
  async initializeUserContext(userId: string): Promise<UserProfile> {
    try {
      // Check cache first
      if (this.profileCache.has(userId)) {
        return this.profileCache.get(userId)!;
      }

      // Try to load from database
      const existingProfile = await this.loadUserProfile(userId);
      if (existingProfile) {
        this.profileCache.set(userId, existingProfile);
        return existingProfile;
      }

      // Create new profile
      const newProfile: UserProfile = {
        userId,
        preferences: {
          communicationStyle: 'professional',
          techLevel: 'intermediate',
          focus: ['real-estate', 'development', 'analytics'],
          tools: ['all']
        },
        expertise: [],
        interests: [],
        context: {
          currentProjects: [],
          goals: [],
          constraints: []
        },
        history: {
          totalInteractions: 0,
          primaryTopics: [],
          toolUsage: {},
          lastActive: new Date().toISOString()
        }
      };

      await this.saveUserProfile(newProfile);
      this.profileCache.set(userId, newProfile);
      return newProfile;
    } catch (error) {
      console.error('Error initializing user context:', error);
      return this.getDefaultProfile(userId);
    }
  }

  // Store conversation memory with advanced context
  async storeMemory(
    userId: string,
    sessionId: string,
    content: string,
    type: MemoryContext['type'],
    metadata: Partial<MemoryContext['metadata']> = {},
    sourceInstance: 'main' | 'floating' = 'main'
  ): Promise<MemoryContext> {
    try {
      const memoryId = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Extract entities and keywords from content
      const extractedData = await this.extractContentData(content);
      
      const memory: MemoryContext = {
        id: memoryId,
        userId,
        sessionId,
        type,
        content,
        metadata: {
          importance: metadata.importance || this.calculateImportance(content, type),
          confidence: metadata.confidence || 0.8,
          lastAccessed: new Date().toISOString(),
          accessCount: 0,
          relatedContexts: metadata.relatedContexts || [],
          sourceInstance,
          keywords: extractedData.keywords,
          entities: extractedData.entities,
          topics: extractedData.topics,
          ...metadata
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Store in cache and database
      this.memoryCache.set(memoryId, memory);
      await this.saveMemoryToDatabase(memory);

      // Update user profile
      await this.updateUserProfile(userId, memory);

      return memory;
    } catch (error) {
      console.error('Error storing memory:', error);
      throw error;
    }
  }

  // Retrieve relevant context for conversation
  async getRelevantContext(
    userId: string,
    sessionId: string,
    query: string,
    maxContexts: number = 10
  ): Promise<{
    recentContext: MemoryContext[];
    relevantMemories: MemoryContext[];
    userProfile: UserProfile;
    conversationSummary?: ConversationSummary;
  }> {
    try {
      // Get user profile
      const userProfile = await this.initializeUserContext(userId);

      // Get recent conversation context (last 20 messages)
      const recentContext = await this.getRecentContext(sessionId, 20);

      // Get conversation summary if available
      const conversationSummary = await this.getConversationSummary(sessionId);

      // Find relevant memories using semantic search
      const relevantMemories = await this.findRelevantMemories(
        userId,
        query,
        recentContext,
        maxContexts
      );

      // Update access counts
      await this.updateAccessCounts(relevantMemories);

      return {
        recentContext,
        relevantMemories,
        userProfile,
        conversationSummary
      };
    } catch (error) {
      console.error('Error getting relevant context:', error);
      return {
        recentContext: [],
        relevantMemories: [],
        userProfile: await this.initializeUserContext(userId)
      };
    }
  }

  // Generate conversation summary
  async generateConversationSummary(sessionId: string, messages: any[]): Promise<ConversationSummary> {
    try {
      const userId = messages[0]?.userId || 'demo-user';
      
      // Extract key information from conversation
      const keyTopics = this.extractTopics(messages);
      const decisions = this.extractDecisions(messages);
      const actionItems = this.extractActionItems(messages);
      const preferences = this.extractPreferences(messages);
      
      const summary: ConversationSummary = {
        sessionId,
        userId,
        keyTopics,
        decisions,
        actionItems,
        preferences,
        context: this.generateContextSummary(messages),
        lastSummaryAt: new Date().toISOString()
      };

      // Cache and store
      this.summaryCache.set(sessionId, summary);
      await this.saveConversationSummary(summary);

      return summary;
    } catch (error) {
      console.error('Error generating conversation summary:', error);
      throw error;
    }
  }

  // Cross-session memory sharing
  async shareMemoryAcrossSessions(userId: string, sourceSessionId: string, targetSessionId: string): Promise<void> {
    try {
      const sourceMemories = await this.getSessionMemories(sourceSessionId);
      
      // Copy relevant memories to target session
      for (const memory of sourceMemories) {
        if (memory.metadata.importance >= 7) { // Only copy important memories
          await this.storeMemory(
            userId,
            targetSessionId,
            memory.content,
            memory.type,
            {
              ...memory.metadata,
              relatedContexts: [...memory.metadata.relatedContexts, sourceSessionId]
            },
            memory.metadata.sourceInstance
          );
        }
      }
    } catch (error) {
      console.error('Error sharing memory across sessions:', error);
    }
  }

  // Tool context integration
  async integrateToolContext(
    userId: string,
    sessionId: string,
    toolName: string,
    toolResult: any,
    sourceInstance: 'main' | 'floating'
  ): Promise<void> {
    try {
      const toolContext = this.formatToolContext(toolName, toolResult);
      
      await this.storeMemory(
        userId,
        sessionId,
        toolContext,
        'task',
        {
          importance: 8,
          confidence: 0.9,
          relatedContexts: [`tool:${toolName}`],
          keywords: [toolName, 'tool-result', 'data'],
          entities: this.extractToolEntities(toolResult),
          topics: [toolName, 'analysis', 'data']
        },
        sourceInstance
      );

      // Update user profile tool usage
      await this.updateToolUsage(userId, toolName);
    } catch (error) {
      console.error('Error integrating tool context:', error);
    }
  }

  // Private helper methods
  private async extractContentData(content: string): Promise<{
    keywords: string[];
    entities: string[];
    topics: string[];
  }> {
    // Simple keyword extraction (could be enhanced with NLP)
    const words = content.toLowerCase().split(/\s+/);
    const keywords = words.filter(word => 
      word.length > 3 && 
      !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'has', 'let', 'put', 'say', 'she', 'too', 'use'].includes(word)
    ).slice(0, 10);

    // Extract potential entities (capitalized words, numbers, etc.)
    const entities = content.match(/[A-Z][a-z]+|[\$\€\£][\d,]+|\d+\.?\d*%?/g) || [];
    
    // Extract topics based on Bristol context
    const bristolTopics = ['development', 'real estate', 'investment', 'property', 'market', 'analysis', 'finance', 'demographics'];
    const topics = bristolTopics.filter(topic => content.toLowerCase().includes(topic));

    return { keywords, entities, topics };
  }

  private calculateImportance(content: string, type: MemoryContext['type']): number {
    let score = 5; // Base score

    // Type-based scoring
    const typeScores = {
      'fact': 7,
      'preference': 8,
      'task': 6,
      'relationship': 5,
      'temporal': 4,
      'conversation': 3
    };
    score = typeScores[type] || 5;

    // Content-based adjustments
    if (content.includes('important') || content.includes('remember')) score += 2;
    if (content.includes('never') || content.includes('always')) score += 1;
    if (content.includes('prefer') || content.includes('like')) score += 1;
    if (content.length > 200) score += 1;

    return Math.min(Math.max(score, 1), 10);
  }

  private async findRelevantMemories(
    userId: string,
    query: string,
    recentContext: MemoryContext[],
    maxResults: number
  ): Promise<MemoryContext[]> {
    try {
      // Get all user memories
      const allMemories = await this.getUserMemories(userId);
      
      // Simple relevance scoring (could be enhanced with vector similarity)
      const scoredMemories = allMemories.map(memory => {
        let score = 0;
        
        // Keyword matching
        const queryWords = query.toLowerCase().split(/\s+/);
        const contentWords = memory.content.toLowerCase();
        queryWords.forEach(word => {
          if (contentWords.includes(word)) score += 1;
        });
        
        // Metadata matching
        memory.metadata.keywords.forEach(keyword => {
          if (query.toLowerCase().includes(keyword)) score += 2;
        });
        
        // Importance weighting
        score *= (memory.metadata.importance / 10);
        
        // Recency bonus
        const daysSinceAccess = (Date.now() - new Date(memory.metadata.lastAccessed).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceAccess < 7) score += 1;
        
        return { memory, score };
      });

      // Sort by score and return top results
      return scoredMemories
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults)
        .map(item => item.memory);
    } catch (error) {
      console.error('Error finding relevant memories:', error);
      return [];
    }
  }

  private extractTopics(messages: any[]): string[] {
    const allContent = messages.map(m => m.content || '').join(' ');
    const topics = new Set<string>();
    
    // Bristol-specific topics
    const bristolTopics = [
      'development', 'real estate', 'investment', 'property', 'market', 
      'analysis', 'finance', 'demographics', 'IRR', 'NPV', 'cap rate',
      'multifamily', 'acquisition', 'underwriting', 'due diligence'
    ];
    
    bristolTopics.forEach(topic => {
      if (allContent.toLowerCase().includes(topic)) {
        topics.add(topic);
      }
    });
    
    return Array.from(topics).slice(0, 10);
  }

  private extractDecisions(messages: any[]): string[] {
    const decisions: string[] = [];
    const decisionWords = ['decided', 'choose', 'selected', 'will proceed', 'agreed'];
    
    messages.forEach(message => {
      if (message.role === 'user' || message.role === 'assistant') {
        decisionWords.forEach(word => {
          if (message.content?.toLowerCase().includes(word)) {
            decisions.push(message.content.substring(0, 200));
          }
        });
      }
    });
    
    return decisions.slice(0, 5);
  }

  private extractActionItems(messages: any[]): string[] {
    const actionItems: string[] = [];
    const actionWords = ['need to', 'should', 'must', 'will', 'plan to', 'next step'];
    
    messages.forEach(message => {
      actionWords.forEach(word => {
        if (message.content?.toLowerCase().includes(word)) {
          actionItems.push(message.content.substring(0, 200));
        }
      });
    });
    
    return actionItems.slice(0, 5);
  }

  private extractPreferences(messages: any[]): string[] {
    const preferences: string[] = [];
    const prefWords = ['prefer', 'like', 'want', 'need', 'always', 'never'];
    
    messages.forEach(message => {
      if (message.role === 'user') {
        prefWords.forEach(word => {
          if (message.content?.toLowerCase().includes(word)) {
            preferences.push(message.content.substring(0, 200));
          }
        });
      }
    });
    
    return preferences.slice(0, 5);
  }

  private generateContextSummary(messages: any[]): string {
    const recentMessages = messages.slice(-10);
    const summary = recentMessages
      .map(m => `${m.role}: ${m.content?.substring(0, 100)}`)
      .join('\n');
    return summary.substring(0, 1000);
  }

  private formatToolContext(toolName: string, toolResult: any): string {
    return `Tool: ${toolName}\nResult: ${JSON.stringify(toolResult, null, 2).substring(0, 500)}`;
  }

  private extractToolEntities(toolResult: any): string[] {
    const entities: string[] = [];
    
    if (typeof toolResult === 'object' && toolResult !== null) {
      Object.values(toolResult).forEach(value => {
        if (typeof value === 'string' && value.match(/[A-Z][a-z]+/)) {
          entities.push(value);
        } else if (typeof value === 'number') {
          entities.push(value.toString());
        }
      });
    }
    
    return entities.slice(0, 10);
  }

  // Database operations (simplified for now)
  private async saveMemoryToDatabase(memory: MemoryContext): Promise<void> {
    try {
      // Store in Bristol's memory system (could be enhanced with proper schema)
      console.log(`📝 Storing memory: ${memory.id} for user ${memory.userId}`);
    } catch (error) {
      console.error('Error saving memory to database:', error);
    }
  }

  private async loadUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      // Load from database (placeholder)
      return null;
    } catch (error) {
      return null;
    }
  }

  private async saveUserProfile(profile: UserProfile): Promise<void> {
    try {
      console.log(`💾 Saving profile for user ${profile.userId}`);
    } catch (error) {
      console.error('Error saving user profile:', error);
    }
  }

  private async saveConversationSummary(summary: ConversationSummary): Promise<void> {
    try {
      console.log(`📊 Saving summary for session ${summary.sessionId}`);
    } catch (error) {
      console.error('Error saving conversation summary:', error);
    }
  }

  private async getRecentContext(sessionId: string, limit: number): Promise<MemoryContext[]> {
    try {
      // Get from cache/database
      return Array.from(this.memoryCache.values())
        .filter(memory => memory.sessionId === sessionId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
    } catch (error) {
      return [];
    }
  }

  private async getConversationSummary(sessionId: string): Promise<ConversationSummary | undefined> {
    return this.summaryCache.get(sessionId);
  }

  private async getSessionMemories(sessionId: string): Promise<MemoryContext[]> {
    return Array.from(this.memoryCache.values())
      .filter(memory => memory.sessionId === sessionId);
  }

  private async getUserMemories(userId: string): Promise<MemoryContext[]> {
    return Array.from(this.memoryCache.values())
      .filter(memory => memory.userId === userId);
  }

  private async updateAccessCounts(memories: MemoryContext[]): Promise<void> {
    memories.forEach(memory => {
      memory.metadata.accessCount++;
      memory.metadata.lastAccessed = new Date().toISOString();
    });
  }

  private async updateUserProfile(userId: string, memory: MemoryContext): Promise<void> {
    try {
      const profile = this.profileCache.get(userId);
      if (profile) {
        profile.history.totalInteractions++;
        profile.history.lastActive = new Date().toISOString();
        
        // Update topics
        memory.metadata.topics.forEach(topic => {
          if (!profile.history.primaryTopics.includes(topic)) {
            profile.history.primaryTopics.push(topic);
          }
        });
        
        // Keep only top 20 topics
        profile.history.primaryTopics = profile.history.primaryTopics.slice(0, 20);
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
    }
  }

  private async updateToolUsage(userId: string, toolName: string): Promise<void> {
    try {
      const profile = this.profileCache.get(userId);
      if (profile) {
        profile.history.toolUsage[toolName] = (profile.history.toolUsage[toolName] || 0) + 1;
      }
    } catch (error) {
      console.error('Error updating tool usage:', error);
    }
  }

  private getDefaultProfile(userId: string): UserProfile {
    return {
      userId,
      preferences: {
        communicationStyle: 'professional',
        techLevel: 'intermediate',
        focus: ['real-estate'],
        tools: ['all']
      },
      expertise: [],
      interests: [],
      context: {
        currentProjects: [],
        goals: [],
        constraints: []
      },
      history: {
        totalInteractions: 0,
        primaryTopics: [],
        toolUsage: {},
        lastActive: new Date().toISOString()
      }
    };
  }

  // Public API for clearing/managing memory
  async clearUserMemory(userId: string): Promise<void> {
    const userMemories = Array.from(this.memoryCache.entries())
      .filter(([_, memory]) => memory.userId === userId);
    
    userMemories.forEach(([id, _]) => {
      this.memoryCache.delete(id);
    });
    
    this.profileCache.delete(userId);
  }

  async getMemoryStats(userId: string): Promise<{
    totalMemories: number;
    byType: Record<string, number>;
    averageImportance: number;
    totalInteractions: number;
  }> {
    const userMemories = Array.from(this.memoryCache.values())
      .filter(memory => memory.userId === userId);
    
    const byType = userMemories.reduce((acc, memory) => {
      acc[memory.type] = (acc[memory.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const averageImportance = userMemories.length > 0 
      ? userMemories.reduce((sum, memory) => sum + memory.metadata.importance, 0) / userMemories.length
      : 0;
    
    const profile = this.profileCache.get(userId);
    
    return {
      totalMemories: userMemories.length,
      byType,
      averageImportance,
      totalInteractions: profile?.history.totalInteractions || 0
    };
  }
}

export const advancedMemoryService = new AdvancedMemoryService();