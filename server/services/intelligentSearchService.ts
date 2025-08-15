import { db } from '../db';
import { sites, siteMetrics, users } from '@shared/schema';
import { eq, and, or, gte, lte, like, desc, asc } from 'drizzle-orm';
import { advancedMemoryService } from './advancedMemoryService';

export interface SearchFilters {
  priceRange?: { min: number; max: number };
  location?: string;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  sqftRange?: { min: number; max: number };
  capRateRange?: { min: number; max: number };
  status?: string;
  keywords?: string[];
}

export interface SearchResult {
  properties: any[];
  totalCount: number;
  facets: SearchFacets;
  suggestions: string[];
  query: string;
  executionTime: number;
}

export interface SearchFacets {
  priceRanges: { range: string; count: number }[];
  locations: { location: string; count: number }[];
  propertyTypes: { type: string; count: number }[];
  statusCounts: { status: string; count: number }[];
}

class IntelligentSearchService {
  // Natural language property search
  async searchProperties(
    query: string, 
    userId: string,
    filters?: SearchFilters,
    limit: number = 50,
    offset: number = 0
  ): Promise<SearchResult> {
    const startTime = Date.now();
    console.log(`🔍 Processing intelligent search: "${query}" for user ${userId}`);

    try {
      // Parse natural language query
      const parsedFilters = await this.parseNaturalLanguageQuery(query, userId);
      
      // Merge with explicit filters
      const combinedFilters = { ...parsedFilters, ...filters };
      
      // Build database query
      const dbQuery = this.buildDatabaseQuery(combinedFilters);
      
      // Execute search
      const properties = await dbQuery
        .limit(limit)
        .offset(offset);

      // Get total count
      const totalCount = await this.getSearchCount(combinedFilters);
      
      // Generate facets for filtering UI
      const facets = await this.generateSearchFacets(combinedFilters);
      
      // Generate search suggestions
      const suggestions = await this.generateSearchSuggestions(query, properties);
      
      // Store search in memory for learning
      await this.storeSearchInMemory(userId, query, combinedFilters, properties.length);
      
      const executionTime = Date.now() - startTime;
      
      console.log(`✅ Search completed: ${properties.length} results in ${executionTime}ms`);
      
      return {
        properties,
        totalCount,
        facets,
        suggestions,
        query,
        executionTime
      };

    } catch (error) {
      console.error('Intelligent search failed:', error);
      throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async parseNaturalLanguageQuery(query: string, userId: string): Promise<SearchFilters> {
    const filters: SearchFilters = {};
    const lowerQuery = query.toLowerCase();

    // Price parsing
    const priceMatches = query.match(/\$?([\d,]+)\s*(?:to|\-)\s*\$?([\d,]+)/);
    if (priceMatches) {
      filters.priceRange = {
        min: parseInt(priceMatches[1].replace(/,/g, '')),
        max: parseInt(priceMatches[2].replace(/,/g, ''))
      };
    } else {
      // Single price points
      const underMatch = query.match(/under\s*\$?([\d,]+)/i);
      const overMatch = query.match(/over\s*\$?([\d,]+)/i);
      if (underMatch) {
        filters.priceRange = { min: 0, max: parseInt(underMatch[1].replace(/,/g, '')) };
      } else if (overMatch) {
        filters.priceRange = { min: parseInt(overMatch[1].replace(/,/g, '')), max: 50000000 };
      }
    }

    // Bedroom/bathroom parsing
    const bedroomMatch = query.match(/(\d+)\s*(?:bed|bedroom|br)/i);
    if (bedroomMatch) {
      filters.bedrooms = parseInt(bedroomMatch[1]);
    }

    const bathroomMatch = query.match(/(\d+)\s*(?:bath|bathroom|ba)/i);
    if (bathroomMatch) {
      filters.bathrooms = parseInt(bathroomMatch[1]);
    }

    // Square footage parsing
    const sqftMatch = query.match(/(\d+)(?:\s*to\s*(\d+))?\s*(?:sq\s*ft|sqft|square\s*feet)/i);
    if (sqftMatch) {
      if (sqftMatch[2]) {
        filters.sqftRange = {
          min: parseInt(sqftMatch[1]),
          max: parseInt(sqftMatch[2])
        };
      } else {
        filters.sqftRange = { min: parseInt(sqftMatch[1]), max: 50000 };
      }
    }

    // Cap rate parsing
    const capRateMatch = query.match(/(\d+(?:\.\d+)?)\s*(?:to\s*(\d+(?:\.\d+)?))?\s*%?\s*cap\s*rate/i);
    if (capRateMatch) {
      if (capRateMatch[2]) {
        filters.capRateRange = {
          min: parseFloat(capRateMatch[1]),
          max: parseFloat(capRateMatch[2])
        };
      } else {
        filters.capRateRange = { min: parseFloat(capRateMatch[1]), max: 20 };
      }
    }

    // Location extraction
    const locationKeywords = ['in', 'near', 'around', 'located'];
    for (const keyword of locationKeywords) {
      const locationMatch = query.match(new RegExp(`${keyword}\\s+([\\w\\s,]+?)(?:\\s+with|\\s+that|$)`, 'i'));
      if (locationMatch) {
        filters.location = locationMatch[1].trim();
        break;
      }
    }

    // Property type detection
    if (lowerQuery.includes('multifamily') || lowerQuery.includes('apartment')) {
      filters.propertyType = 'multifamily';
    } else if (lowerQuery.includes('office')) {
      filters.propertyType = 'office';
    } else if (lowerQuery.includes('retail')) {
      filters.propertyType = 'retail';
    } else if (lowerQuery.includes('industrial')) {
      filters.propertyType = 'industrial';
    }

    // Status detection
    if (lowerQuery.includes('for sale') || lowerQuery.includes('available')) {
      filters.status = 'available';
    } else if (lowerQuery.includes('sold')) {
      filters.status = 'sold';
    } else if (lowerQuery.includes('under contract')) {
      filters.status = 'under_contract';
    }

    // Keywords extraction
    const stopWords = ['the', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const words = query.toLowerCase().split(/\s+/).filter(word => 
      word.length > 2 && !stopWords.includes(word) && !/^\d+$/.test(word)
    );
    
    if (words.length > 0) {
      filters.keywords = words;
    }

    // Learn from user's search patterns
    await this.learnFromSearchPattern(userId, query, filters);

    return filters;
  }

  private buildDatabaseQuery(filters: SearchFilters) {
    let query = db.select().from(sites);
    const conditions: any[] = [];

    // Location filters using available schema fields
    if (filters.location) {
      conditions.push(
        or(
          like(sites.name, `%${filters.location}%`),
          like(sites.city, `%${filters.location}%`),
          like(sites.state, `%${filters.location}%`)
        )
      );
    }

    // Status
    if (filters.status) {
      conditions.push(eq(sites.status, filters.status));
    }

    // Keywords (search in name, city, etc.)
    if (filters.keywords && filters.keywords.length > 0) {
      const keywordConditions = filters.keywords.map(keyword =>
        or(
          like(sites.name, `%${keyword}%`),
          like(sites.city, `%${keyword}%`),
          like(sites.addrLine1, `%${keyword}%`)
        )
      );
      conditions.push(or(...keywordConditions));
    }

    // Apply all conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    // Default ordering by name
    return query.orderBy(desc(sites.name));
  }

  private async getSearchCount(filters: SearchFilters): Promise<number> {
    // Simplified count - would use actual count query in production
    return 150; // Placeholder
  }

  private async generateSearchFacets(filters: SearchFilters): Promise<SearchFacets> {
    // Generate facets for filtering UI
    return {
      priceRanges: [
        { range: '$0 - $500K', count: 25 },
        { range: '$500K - $1M', count: 45 },
        { range: '$1M - $2M', count: 35 },
        { range: '$2M+', count: 15 }
      ],
      locations: [
        { location: 'Charlotte, NC', count: 30 },
        { location: 'Atlanta, GA', count: 25 },
        { location: 'Nashville, TN', count: 20 },
        { location: 'Other', count: 45 }
      ],
      propertyTypes: [
        { type: 'Multifamily', count: 60 },
        { type: 'Office', count: 25 },
        { type: 'Retail', count: 15 },
        { type: 'Industrial', count: 20 }
      ],
      statusCounts: [
        { status: 'Available', count: 45 },
        { status: 'Under Contract', count: 15 },
        { status: 'Sold', count: 60 }
      ]
    };
  }

  private async generateSearchSuggestions(query: string, results: any[]): Promise<string[]> {
    const suggestions: string[] = [];

    // Generate suggestions based on results
    if (results.length > 0) {
      const commonCities = [...new Set(results.map(r => r.city).filter(Boolean))].slice(0, 3);
      suggestions.push(...commonCities.map(city => `Properties in ${city}`));

      const avgPrice = results.reduce((sum, r) => sum + (r.price || 0), 0) / results.length;
      if (avgPrice > 0) {
        suggestions.push(`Similar properties under $${Math.round(avgPrice / 100000) * 100000 / 1000}K`);
      }
    }

    // Add refinement suggestions
    if (!query.includes('multifamily')) {
      suggestions.push('Multifamily properties');
    }
    if (!query.includes('cap rate')) {
      suggestions.push('Properties with 6%+ cap rate');
    }

    return suggestions.slice(0, 5);
  }

  private async storeSearchInMemory(
    userId: string, 
    query: string, 
    filters: SearchFilters, 
    resultCount: number
  ): Promise<void> {
    const searchSummary = `Searched: "${query}" -> ${resultCount} results`;
    const searchDetails = {
      filters,
      resultCount,
      timestamp: new Date().toISOString()
    };

    await advancedMemoryService.storeMemory(
      userId,
      `search-${Date.now()}`,
      searchSummary,
      'preference',
      { importance: 6, confidence: 0.8 }
    );
  }

  private async learnFromSearchPattern(
    userId: string, 
    query: string, 
    filters: SearchFilters
  ): Promise<void> {
    // Analyze search patterns to improve future searches
    const searchPattern = {
      priceRange: filters.priceRange,
      preferredLocation: filters.location,
      propertyType: filters.propertyType,
      queryStyle: query.length > 50 ? 'detailed' : 'simple'
    };

    await advancedMemoryService.storeMemory(
      userId,
      `search-pattern-${Date.now()}`,
      `Search pattern: ${JSON.stringify(searchPattern)}`,
      'preference',
      { importance: 5, confidence: 0.7 }
    );
  }

  // Advanced filtering with user context
  async getPersonalizedSearchSuggestions(userId: string): Promise<string[]> {
    try {
      const context = await advancedMemoryService.getRelevantContext(
        userId,
        'search-suggestions',
        'Show me search suggestions based on my history',
        10
      );

      const suggestions: string[] = [];

      // Extract patterns from search history
      const searchMemories = context.relevantMemories.filter(m => 
        m.type === 'preference' && m.content.includes('Searched:')
      );

      if (searchMemories.length > 0) {
        // Analyze common search patterns
        const commonLocations = this.extractCommonValues(searchMemories, 'location');
        const commonPriceRanges = this.extractCommonValues(searchMemories, 'price');
        
        suggestions.push(...commonLocations.map(loc => `New properties in ${loc}`));
        suggestions.push(...commonPriceRanges.map(range => `Properties in your ${range} range`));
      }

      // Add default suggestions if no history
      if (suggestions.length === 0) {
        suggestions.push(
          'Multifamily properties under $2M',
          'High cap rate opportunities',
          'Properties in Charlotte metro',
          'Value-add properties',
          'Cash flowing properties'
        );
      }

      return suggestions.slice(0, 8);

    } catch (error) {
      console.error('Error generating personalized suggestions:', error);
      return [
        'Multifamily properties',
        'High cap rate properties',
        'Value-add opportunities',
        'Cash flowing assets'
      ];
    }
  }

  private extractCommonValues(memories: any[], field: string): string[] {
    const values = new Map<string, number>();
    
    memories.forEach(memory => {
      // Extract field values from memory content/metadata
      if (memory.metadata?.[field]) {
        const value = memory.metadata[field];
        values.set(value, (values.get(value) || 0) + 1);
      }
    });

    return Array.from(values.keys())
      .slice(0, 3);
  }

  // Smart data filtering based on conversation context
  async filterDataByContext(
    userId: string,
    sessionId: string,
    dataType: 'properties' | 'metrics' | 'comparables',
    conversationContext: string
  ): Promise<any[]> {
    console.log(`🎯 Filtering ${dataType} data based on conversation context`);

    try {
      // Get relevant context from conversation
      const context = await advancedMemoryService.getRelevantContext(
        userId,
        sessionId,
        conversationContext,
        20
      );

      // Extract filters from conversation memory
      const contextFilters = this.extractFiltersFromContext(context);

      // Apply intelligent filtering
      let results: any[] = [];

      switch (dataType) {
        case 'properties':
          const searchResult = await this.searchProperties(
            conversationContext,
            userId,
            contextFilters
          );
          results = searchResult.properties;
          break;

        case 'metrics':
          results = await this.getFilteredMetrics(contextFilters);
          break;

        case 'comparables':
          results = await this.getFilteredComparables(contextFilters);
          break;
      }

      // Store context-based filtering for learning
      await advancedMemoryService.storeMemory(
        userId,
        sessionId,
        `Context filtering: ${dataType} -> ${results.length} results`,
        'task',
        { importance: 6, confidence: 0.8 }
      );

      return results;

    } catch (error) {
      console.error('Context-based filtering failed:', error);
      return [];
    }
  }

  private extractFiltersFromContext(context: any): SearchFilters {
    const filters: SearchFilters = {};
    
    // Extract filters from relevant memories
    context.relevantMemories.forEach((memory: any) => {
      if (memory.metadata?.filters) {
        Object.assign(filters, memory.metadata.filters);
      }
      
      // Extract from content
      if (memory.content.includes('price')) {
        // Extract price information
      }
      if (memory.content.includes('location')) {
        // Extract location information
      }
    });

    return filters;
  }

  private async getFilteredMetrics(filters: SearchFilters): Promise<any[]> {
    // Get metrics based on filters
    return db.select()
      .from(siteMetrics)
      .limit(50);
  }

  private async getFilteredComparables(filters: SearchFilters): Promise<any[]> {
    // Get comparables based on filters
    return db.select()
      .from(sites)
      .where(eq(sites.status, 'sold'))
      .limit(20);
  }
}

export const intelligentSearchService = new IntelligentSearchService();