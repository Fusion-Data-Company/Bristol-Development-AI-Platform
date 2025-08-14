/**
 * Elite Property Extraction Engine
 * Replaces placeholder extraction with real Firecrawl elite extraction
 */

import { randomUUID } from 'crypto';
import { db } from '../db';
import { compsAnnex } from '@shared/schema';

interface ExtractionRequest {
  urls: string[];
  extractionFocus: 'financial' | 'units' | 'amenities' | 'location' | 'management';
  propertyClass: 'A' | 'B' | 'C' | 'D';
  sessionId?: string;
  userId?: string;
}

interface ExtractedProperty {
  propertyName: string;
  address: string;
  totalUnits: number;
  averageRent: number;
  rentRange: string;
  occupancyRate: number;
  yearBuilt: number;
  propertyClass: string;
  amenities: string[];
  financialMetrics: {
    noi: number;
    capRate: number;
    rentPsf: number;
    operatingExpenseRatio: number;
  };
  managementInfo: {
    company: string;
    contact: string;
    leasing: string;
  };
}

export class EliteExtractionEngine {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.FIRECRAWL_API_KEY!;
    if (!this.apiKey) {
      throw new Error('FIRECRAWL_API_KEY is required for elite extraction');
    }
  }

  async extractPropertiesFromUrls(request: ExtractionRequest): Promise<{
    success: boolean;
    jobId: string;
    propertiesExtracted: number;
    properties: ExtractedProperty[];
    metadata: any;
  }> {
    const jobId = randomUUID();
    
    try {
      console.log(`🎯 Elite extraction starting: ${request.urls.length} URLs, focus: ${request.extractionFocus}`);

      const extractedProperties: ExtractedProperty[] = [];

      for (const url of request.urls) {
        try {
          const propertyData = await this.extractFromSingleUrl(url, request);
          if (propertyData) {
            extractedProperties.push(propertyData);
          }
        } catch (error) {
          console.warn(`Failed to extract from ${url}:`, error);
        }
      }

      // Store extracted properties in database
      const storedCount = await this.storeExtractedProperties(extractedProperties, jobId);

      return {
        success: true,
        jobId,
        propertiesExtracted: storedCount,
        properties: extractedProperties,
        metadata: {
          extractionFocus: request.extractionFocus,
          propertyClass: request.propertyClass,
          urlsProcessed: request.urls.length,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Elite extraction failed:', error);
      return {
        success: false,
        jobId,
        propertiesExtracted: 0,
        properties: [],
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  private async extractFromSingleUrl(url: string, request: ExtractionRequest): Promise<ExtractedProperty | null> {
    const extractionSchema = this.buildExtractionSchema(request.extractionFocus);
    
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        url,
        formats: ['extract'],
        extract: {
          schema: extractionSchema,
          systemPrompt: this.buildExtractionPrompt(request.extractionFocus, request.propertyClass)
        },
        timeout: 45000,
        waitFor: 3000
      })
    });

    if (!response.ok) {
      throw new Error(`Firecrawl extraction failed: ${response.status}`);
    }

    const result = await response.json();
    return result.success && result.data?.extract ? result.data.extract : null;
  }

  private buildExtractionSchema(focus: string) {
    const baseSchema = {
      type: 'object',
      properties: {
        propertyName: { type: 'string', description: 'Name of the property' },
        address: { type: 'string', description: 'Full street address' },
        totalUnits: { type: 'number', description: 'Total number of units' },
        averageRent: { type: 'number', description: 'Average monthly rent' },
        rentRange: { type: 'string', description: 'Rent range (e.g., $1,200-$2,500)' },
        yearBuilt: { type: 'number', description: 'Year property was built' },
        propertyClass: { type: 'string', description: 'Property class (A, B, C, or D)' },
        amenities: { type: 'array', items: { type: 'string' }, description: 'List of amenities' }
      }
    };

    switch (focus) {
      case 'financial':
        baseSchema.properties.financialMetrics = {
          type: 'object',
          properties: {
            noi: { type: 'number', description: 'Net Operating Income' },
            capRate: { type: 'number', description: 'Capitalization rate' },
            rentPsf: { type: 'number', description: 'Rent per square foot' },
            operatingExpenseRatio: { type: 'number', description: 'Operating expense ratio' },
            occupancyRate: { type: 'number', description: 'Current occupancy percentage' }
          }
        };
        break;
      
      case 'management':
        baseSchema.properties.managementInfo = {
          type: 'object',
          properties: {
            company: { type: 'string', description: 'Management company name' },
            contact: { type: 'string', description: 'Management contact info' },
            leasing: { type: 'string', description: 'Leasing office information' }
          }
        };
        break;

      case 'units':
        baseSchema.properties.unitDetails = {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              bedrooms: { type: 'number' },
              bathrooms: { type: 'number' },
              sqft: { type: 'number' },
              rent: { type: 'number' },
              available: { type: 'boolean' }
            }
          }
        };
        break;
    }

    return baseSchema;
  }

  private buildExtractionPrompt(focus: string, propertyClass: string): string {
    const basePrompt = `You are an elite real estate data extraction specialist. Extract comprehensive property information with investment-grade precision.`;

    const focusPrompts = {
      financial: `Focus on financial metrics critical for investment analysis: NOI, cap rates, rent per square foot, operating expenses, occupancy rates, and revenue metrics. Extract exact numbers and percentages.`,
      
      management: `Focus on management and operational details: management company, contact information, leasing office details, property management structure, and operational contacts.`,
      
      units: `Focus on unit mix and rental details: number of units by bedroom count, square footage, current rents, availability, unit features, and floor plans.`,
      
      amenities: `Focus on amenities and property features: comprehensive list of amenities, community features, unit features, parking details, and special facilities.`,
      
      location: `Focus on location and market context: exact address, neighborhood details, proximity to transit, schools, employment centers, and local market characteristics.`
    };

    return `${basePrompt} Target property class: ${propertyClass}. ${focusPrompts[focus] || focusPrompts.financial}`;
  }

  private async storeExtractedProperties(properties: ExtractedProperty[], jobId: string): Promise<number> {
    let storedCount = 0;

    for (const property of properties) {
      try {
        await db.insert(compsAnnex).values({
          id: randomUUID(),
          name: property.propertyName,
          address: property.address,
          city: property.address.split(',')[1]?.trim() || '',
          state: property.address.split(',')[2]?.trim() || '',
          units: property.totalUnits,
          rentPu: property.averageRent,
          assetType: 'Multifamily',
          subtype: property.propertyClass,
          yearBuilt: property.yearBuilt,
          amenityTags: property.amenities,
          notes: `Elite extraction job: ${jobId}`,
          source: 'elite_extraction',
          scrapedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        });

        storedCount++;
      } catch (error) {
        console.warn('Failed to store extracted property:', error);
      }
    }

    return storedCount;
  }

  async extractFromMultipleUrls(urls: string[], focus: string = 'financial'): Promise<ExtractedProperty[]> {
    const request: ExtractionRequest = {
      urls,
      extractionFocus: focus as any,
      propertyClass: 'A',
      sessionId: `extraction_${Date.now()}`,
      userId: 'bristol_ai'
    };

    const result = await this.extractPropertiesFromUrls(request);
    return result.properties;
  }
}

export const eliteExtractionEngine = new EliteExtractionEngine();