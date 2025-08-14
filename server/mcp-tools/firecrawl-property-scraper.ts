/**
 * Bristol AI Agent MCP Tool: Firecrawl Property Scraper
 * Provides web scraping capabilities for property data extraction
 * Results are stored in Comparables Annex and returned to the AI agent
 */

import { randomUUID } from 'crypto';

interface PropertyScrapeTool {
  name: 'bristol_property_scraper';
  description: string;
  inputSchema: {
    type: 'object';
    properties: any;
    required: string[];
  };
}

interface ScrapeRequest {
  urls: string[];
  query?: string;
  location?: string;
  propertyType?: string;
  extractionPrompt?: string;
}

interface ScrapeResult {
  success: boolean;
  jobId: string;
  propertiesFound: number;
  properties: any[];
  metadata: any;
  error?: string;
}

// MCP Tool Definition for Bristol AI Agent
export const bristolPropertyScraperTool: PropertyScrapeTool = {
  name: 'bristol_property_scraper',
  description: `Professional property data scraper using Firecrawl for comprehensive real estate analysis. 

This tool extracts detailed property information from websites and automatically stores results in the Bristol Comparables Annex database for analysis. Perfect for comp analysis, market research, and property intelligence.

Key capabilities:
- Extracts property names, addresses, rent prices, unit counts, amenities
- Handles multiple URLs efficiently with rate limiting
- Structured data output with normalization
- Auto-storage in Comparables Annex for cross-reference
- Provides both immediate results and database persistence

Use this when users ask to:
- "Find comps in [location]"
- "Scrape property data from [website]"  
- "Research multifamily properties"
- "Get rental rates for [area]"
- "Analyze apartment complexes"

Results appear in both this chat and the Comparables Annex page.`,

  inputSchema: {
    type: 'object',
    properties: {
      urls: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of URLs to scrape for property data (max 10 for cost control)',
        examples: [
          'https://www.apartments.com/austin-tx/',
          'https://www.rent.com/texas/austin/',
          'https://www.loopnet.com/search/commercial-real-estate/austin-tx/'
        ]
      },
      query: {
        type: 'string',
        description: 'Search context or user query (for metadata)',
        examples: ['luxury apartments downtown Austin', 'multifamily properties Miami']
      },
      location: {
        type: 'string', 
        description: 'Target location for context',
        examples: ['Austin, TX', 'Miami, FL', 'Nashville, TN']
      },
      propertyType: {
        type: 'string',
        description: 'Type of property to focus extraction on',
        default: 'Multifamily',
        examples: ['Multifamily', 'Apartment', 'Mixed-Use', 'Student Housing']
      },
      extractionPrompt: {
        type: 'string',
        description: 'Custom prompt to guide property data extraction',
        default: 'Extract detailed property information including names, addresses, rent prices, amenities, unit counts, and contact details for multifamily/apartment properties.'
      }
    },
    required: ['urls']
  }
};

// MCP Tool Handler Function
export async function handlePropertyScraping(args: ScrapeRequest): Promise<ScrapeResult> {
  try {
    console.log(`🤖 Bristol AI initiated property scraping: ${args.urls?.length || 0} URLs`);
    
    // Call the AI scraping API endpoint
    const response = await fetch('http://localhost:5000/api/ai-scraping/ai-scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        urls: args.urls || [],
        query: args.query || `Property scraping for ${args.location || 'multiple locations'}`,
        extractSchema: buildPropertyExtractionSchema(args.propertyType),
        sessionId: randomUUID(),
        userId: 'bristol-ai-agent'
      })
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    console.log(`✅ Bristol AI scraping completed: ${result.propertiesFound || 0} properties`);
    
    return {
      success: result.success || false,
      jobId: result.jobId || 'unknown',
      propertiesFound: result.propertiesFound || 0,
      properties: result.properties || [],
      metadata: {
        ...result.metadata,
        aiAgent: 'Bristol AI Elite v5.0',
        integrationLevel: 'MCP + Database',
        comparablesAnnexUrl: '/comparables-annex'
      }
    };

  } catch (error) {
    console.error('Bristol AI property scraping failed:', error);
    
    return {
      success: false,
      jobId: 'failed',
      propertiesFound: 0,
      properties: [],
      metadata: {
        error: 'Bristol AI scraping failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Helper to build property extraction schema
function buildPropertyExtractionSchema(propertyType: string = 'Multifamily') {
  return {
    type: 'object',
    properties: {
      properties: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { 
              type: 'string', 
              description: 'Property or complex name' 
            },
            address: { 
              type: 'string', 
              description: 'Full street address with city, state' 
            },
            city: { 
              type: 'string', 
              description: 'City name' 
            },
            state: { 
              type: 'string', 
              description: 'State abbreviation (e.g., TX, FL, TN)' 
            },
            zip: { 
              type: 'string', 
              description: 'ZIP code' 
            },
            units: { 
              type: 'number', 
              description: 'Total number of units in the property' 
            },
            rent: { 
              type: 'string', 
              description: 'Rent range or price (e.g., "$1,200-$2,000")' 
            },
            rentPerUnit: { 
              type: 'number', 
              description: 'Average rent per unit in dollars' 
            },
            rentPerSqft: { 
              type: 'number', 
              description: 'Rent per square foot' 
            },
            amenities: { 
              type: 'array', 
              items: { type: 'string' },
              description: 'List of property amenities (pool, fitness, parking, etc.)' 
            },
            yearBuilt: { 
              type: 'number', 
              description: 'Year the property was built' 
            },
            occupancy: { 
              type: 'string', 
              description: 'Occupancy status or percentage' 
            },
            squareFeet: { 
              type: 'number', 
              description: 'Total or average square footage' 
            },
            assetType: { 
              type: 'string', 
              description: `Property type (default: ${propertyType})` 
            },
            phone: { 
              type: 'string', 
              description: 'Contact phone number' 
            },
            website: { 
              type: 'string', 
              description: 'Property website URL' 
            },
            management: { 
              type: 'string', 
              description: 'Property management company' 
            },
            description: { 
              type: 'string', 
              description: 'Property description or marketing summary' 
            }
          }
        }
      }
    }
  };
}