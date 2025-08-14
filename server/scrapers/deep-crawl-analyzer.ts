/**
 * Deep Crawl Analyzer
 * Replaces placeholder crawling with real Firecrawl deep crawling
 */

import { randomUUID } from 'crypto';
import { db } from '../db';
import { compsAnnex } from '@shared/schema';

interface CrawlRequest {
  startUrls: string[];
  crawlDepth: number;
  propertyTypes: string[];
  marketFocus: 'sunbelt' | 'coastal' | 'midwest' | 'national';
  analysisType: 'comparative' | 'market_survey' | 'competitive_analysis';
}

interface CrawlResult {
  url: string;
  properties: any[];
  marketData: any;
  crawlDepth: number;
  timestamp: string;
}

export class DeepCrawlAnalyzer {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.FIRECRAWL_API_KEY!;
    if (!this.apiKey) {
      throw new Error('FIRECRAWL_API_KEY is required for deep crawl analysis');
    }
  }

  async performDeepCrawl(request: CrawlRequest): Promise<{
    success: boolean;
    jobId: string;
    urlsCrawled: number;
    propertiesFound: number;
    results: CrawlResult[];
    metadata: any;
  }> {
    const jobId = randomUUID();
    
    try {
      console.log(`🕷️ Deep crawl analysis starting: ${request.startUrls.length} start URLs, depth: ${request.crawlDepth}`);

      const crawlResults: CrawlResult[] = [];

      for (const startUrl of request.startUrls) {
        try {
          const result = await this.crawlSingleDomain(startUrl, request);
          if (result) {
            crawlResults.push(result);
          }
        } catch (error) {
          console.warn(`Failed to crawl ${startUrl}:`, error);
        }
      }

      // Extract and store all properties found
      const allProperties = crawlResults.flatMap(r => r.properties);
      const storedCount = await this.storeDiscoveredProperties(allProperties, jobId);

      return {
        success: true,
        jobId,
        urlsCrawled: crawlResults.length,
        propertiesFound: storedCount,
        results: crawlResults,
        metadata: {
          crawlDepth: request.crawlDepth,
          propertyTypes: request.propertyTypes,
          marketFocus: request.marketFocus,
          analysisType: request.analysisType,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Deep crawl analysis failed:', error);
      return {
        success: false,
        jobId,
        urlsCrawled: 0,
        propertiesFound: 0,
        results: [],
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  private async crawlSingleDomain(startUrl: string, request: CrawlRequest): Promise<CrawlResult | null> {
    const response = await fetch('https://api.firecrawl.dev/v1/crawl', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        url: startUrl,
        crawlerOptions: {
          maxDepth: request.crawlDepth,
          limit: 25,
          allowBackwardLinks: false,
          allowExternalLinks: false,
          includes: [
            '*apartment*',
            '*property*',
            '*rental*',
            '*lease*',
            '*community*',
            '*units*',
            '*floor-plan*',
            '*amenities*'
          ],
          excludes: [
            '*blog*',
            '*news*',
            '*careers*',
            '*contact*',
            '*.pdf',
            '*.jpg',
            '*.png'
          ]
        },
        scrapeOptions: {
          formats: ['extract', 'markdown'],
          onlyMainContent: true,
          waitFor: 3000,
          timeout: 45000,
          extract: {
            schema: this.buildCrawlExtractionSchema(request.analysisType),
            systemPrompt: this.buildCrawlPrompt(request.marketFocus, request.propertyTypes)
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Firecrawl crawl failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(`Crawl failed: ${result.error || 'Unknown error'}`);
    }

    // Process crawl results
    const properties = [];
    const marketData = {};

    if (result.data && Array.isArray(result.data)) {
      for (const page of result.data) {
        if (page.extract) {
          if (page.extract.properties && Array.isArray(page.extract.properties)) {
            properties.push(...page.extract.properties);
          }
          if (page.extract.marketData) {
            Object.assign(marketData, page.extract.marketData);
          }
        }
      }
    }

    return {
      url: startUrl,
      properties,
      marketData,
      crawlDepth: request.crawlDepth,
      timestamp: new Date().toISOString()
    };
  }

  private buildCrawlExtractionSchema(analysisType: string) {
    const baseSchema = {
      type: 'object',
      properties: {
        properties: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              propertyName: { type: 'string' },
              address: { type: 'string' },
              totalUnits: { type: 'number' },
              rentRange: { type: 'string' },
              amenities: { type: 'array', items: { type: 'string' } },
              propertyType: { type: 'string' },
              managementCompany: { type: 'string' },
              contactInfo: { type: 'string' },
              website: { type: 'string' },
              yearBuilt: { type: 'number' },
              propertyClass: { type: 'string' }
            }
          }
        }
      }
    };

    switch (analysisType) {
      case 'market_survey':
        baseSchema.properties.marketData = {
          type: 'object',
          properties: {
            averageRent: { type: 'number' },
            occupancyRate: { type: 'number' },
            concessionRate: { type: 'number' },
            marketTrends: { type: 'array', items: { type: 'string' } },
            competitiveProperties: { type: 'array', items: { type: 'string' } }
          }
        };
        break;

      case 'competitive_analysis':
        baseSchema.properties.competitiveMetrics = {
          type: 'object',
          properties: {
            pricePerUnit: { type: 'number' },
            amenityScore: { type: 'number' },
            locationScore: { type: 'number' },
            managementRating: { type: 'number' },
            competitiveAdvantages: { type: 'array', items: { type: 'string' } }
          }
        };
        break;
    }

    return baseSchema;
  }

  private buildCrawlPrompt(marketFocus: string, propertyTypes: string[]): string {
    const focusPrompts = {
      sunbelt: 'Focus on Sunbelt market characteristics: growth patterns, employment drivers, migration trends, and development patterns typical of markets like Austin, Dallas, Atlanta, Nashville, and Miami.',
      
      coastal: 'Focus on coastal market dynamics: premium positioning, luxury features, resort-style amenities, and high-value market characteristics.',
      
      midwest: 'Focus on Midwest market fundamentals: stable cash flows, value-oriented positioning, and traditional multifamily characteristics.',
      
      national: 'Extract comprehensive data suitable for national portfolio analysis and comparative studies across multiple markets.'
    };

    return `You are conducting deep market analysis for institutional real estate investment. ${focusPrompts[marketFocus]} Property types of interest: ${propertyTypes.join(', ')}. Extract investment-grade data including financial metrics, operational details, and competitive positioning.`;
  }

  private async storeDiscoveredProperties(properties: any[], jobId: string): Promise<number> {
    let storedCount = 0;

    for (const property of properties) {
      try {
        await db.insert(compsAnnex).values({
          id: randomUUID(),
          name: property.propertyName || 'Discovered Property',
          address: property.address || '',
          city: property.address?.split(',')[1]?.trim() || '',
          state: property.address?.split(',')[2]?.trim() || '',
          units: property.totalUnits || null,
          assetType: property.propertyType || 'Multifamily',
          subtype: property.propertyClass || 'Unknown',
          yearBuilt: property.yearBuilt || null,
          amenityTags: property.amenities || [],
          notes: `Deep crawl discovery: ${jobId}. Management: ${property.managementCompany || 'N/A'}`,
          source: 'deep_crawl',
          sourceUrl: property.website || '',
          scrapedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        });

        storedCount++;
      } catch (error) {
        console.warn('Failed to store discovered property:', error);
      }
    }

    return storedCount;
  }

  async quickCrawl(startUrls: string[]): Promise<any[]> {
    const request: CrawlRequest = {
      startUrls,
      crawlDepth: 2,
      propertyTypes: ['Multifamily', 'Apartment'],
      marketFocus: 'sunbelt',
      analysisType: 'comparative'
    };

    const result = await this.performDeepCrawl(request);
    return result.results;
  }
}

export const deepCrawlAnalyzer = new DeepCrawlAnalyzer();