/**
 * Bristol AI Elite Real Estate MCP Tools
 * Advanced Firecrawl integration for comprehensive property data extraction
 */

// Elite Real Estate Extraction Schema
export const ELITE_REAL_ESTATE_SCHEMA = {
  type: "object",
  properties: {
    properties: {
      type: "array",
      items: {
        type: "object",
        properties: {
          // Core Property Information
          propertyName: { type: "string", description: "Property or complex name" },
          address: { type: "string", description: "Full street address" },
          city: { type: "string", description: "City name" },
          state: { type: "string", description: "State abbreviation" },
          zipCode: { type: "string", description: "ZIP code" },
          
          // Financial Metrics
          totalUnits: { type: "number", description: "Total apartment/rental units" },
          rentRange: { type: "string", description: "Rent range (e.g., '$1,200-$2,500')" },
          averageRent: { type: "number", description: "Average monthly rent" },
          rentPerSqft: { type: "number", description: "Rent per square foot" },
          securityDeposit: { type: "number", description: "Security deposit amount" },
          applicationFee: { type: "number", description: "Application fee" },
          
          // Property Details
          yearBuilt: { type: "number", description: "Year constructed" },
          yearRenovated: { type: "number", description: "Year of last major renovation" },
          totalSquareFootage: { type: "number", description: "Total property square footage" },
          lotSize: { type: "string", description: "Lot size in acres or square feet" },
          numberOfBuildings: { type: "number", description: "Number of buildings" },
          numberOfFloors: { type: "number", description: "Number of floors" },
          
          // Unit Mix
          studioUnits: { type: "number", description: "Number of studio units" },
          oneBedUnits: { type: "number", description: "Number of 1-bedroom units" },
          twoBedUnits: { type: "number", description: "Number of 2-bedroom units" },
          threeBedUnits: { type: "number", description: "Number of 3-bedroom units" },
          fourPlusBedUnits: { type: "number", description: "Number of 4+ bedroom units" },
          
          // Occupancy & Performance
          occupancyRate: { type: "number", description: "Current occupancy percentage" },
          leaseUpRate: { type: "number", description: "Lease-up velocity" },
          turnoverRate: { type: "number", description: "Annual turnover rate" },
          averageLeaseLength: { type: "number", description: "Average lease length in months" },
          concessionRate: { type: "number", description: "Concession percentage" },
          
          // Amenities & Features
          amenities: {
            type: "array",
            items: { type: "string" },
            description: "Property amenities (pool, fitness, concierge, etc.)"
          },
          unitFeatures: {
            type: "array", 
            items: { type: "string" },
            description: "Unit features (hardwood, granite, balcony, etc.)"
          },
          parkingSpaces: { type: "number", description: "Number of parking spaces" },
          parkingType: { type: "string", description: "Parking type (covered, garage, surface)" },
          petPolicy: { type: "string", description: "Pet policy details" },
          
          // Management & Contact
          managementCompany: { type: "string", description: "Property management company" },
          leasingOfficePhone: { type: "string", description: "Leasing office phone" },
          leasingOfficeHours: { type: "string", description: "Leasing office hours" },
          website: { type: "string", description: "Property website URL" },
          virtualTourUrl: { type: "string", description: "Virtual tour link" },
          
          // Market Position
          propertyClass: { type: "string", description: "Property class (A, B, C)" },
          targetDemographic: { type: "string", description: "Target renter demographic" },
          marketPosition: { type: "string", description: "Market positioning (luxury, affordable, etc.)" },
          competitorProperties: {
            type: "array",
            items: { type: "string" },
            description: "Nearby competitor properties"
          },
          
          // Investment Metrics
          listingPrice: { type: "number", description: "Property listing price if for sale" },
          pricePerUnit: { type: "number", description: "Price per unit" },
          capRate: { type: "number", description: "Capitalization rate" },
          grossRentMultiplier: { type: "number", description: "Gross rent multiplier" },
          netOperatingIncome: { type: "number", description: "Net operating income" },
          
          // Location Intelligence
          walkScore: { type: "number", description: "Walk Score rating" },
          transitScore: { type: "number", description: "Transit Score rating" },
          bikeScore: { type: "number", description: "Bike Score rating" },
          nearbyAttractions: {
            type: "array",
            items: { type: "string" },
            description: "Nearby attractions and points of interest"
          },
          schoolDistrict: { type: "string", description: "School district name" },
          crimeRating: { type: "string", description: "Area crime rating" },
          
          // Sustainability & Certifications
          energyRating: { type: "string", description: "Energy efficiency rating" },
          certifications: {
            type: "array",
            items: { type: "string" },
            description: "Property certifications (LEED, Energy Star, etc.)"
          },
          
          // Data Source Metadata
          sourceUrl: { type: "string", description: "Source URL where data was extracted" },
          lastUpdated: { type: "string", description: "Date of last data update" },
          dataQuality: { type: "string", description: "Data completeness assessment" }
        }
      }
    }
  }
};

// Elite Search Configuration for Real Estate
export const ELITE_SEARCH_CONFIG = {
  lang: "en",
  country: "us",
  limit: 20,
  scrapeOptions: {
    formats: ["extract", "markdown"],
    onlyMainContent: true,
    waitFor: 3000,
    timeout: 45000,
    includeTags: ["article", "section", "div[class*='property']", "div[class*='listing']", "div[class*='unit']"],
    excludeTags: ["nav", "footer", "header", "advertisement", "cookie"],
    schema: ELITE_REAL_ESTATE_SCHEMA
  }
};

// Elite Crawl Configuration for Property Websites
export const ELITE_CRAWL_CONFIG = {
  maxDepth: 3,
  limit: 100,
  allowExternalLinks: false,
  deduplicateSimilarURLs: true,
  scrapeOptions: {
    formats: ["extract", "markdown"],
    onlyMainContent: true,
    waitFor: 2000,
    timeout: 60000,
    schema: ELITE_REAL_ESTATE_SCHEMA
  }
};

// Elite Extract Configuration
export const ELITE_EXTRACT_CONFIG = {
  prompt: `Extract comprehensive multifamily/apartment property data including:
  
  FINANCIAL: Rent ranges, pricing, fees, unit costs, investment metrics
  PROPERTY: Unit counts, square footage, year built, amenities, features
  PERFORMANCE: Occupancy rates, lease terms, turnover, concessions
  LOCATION: Address details, neighborhood info, walkability, transit
  MANAGEMENT: Contact info, leasing details, management company
  MARKET: Property class, positioning, competitors, demographics
  
  Focus on quantitative data and specific details. Extract all available metrics.`,
  
  systemPrompt: `You are an elite real estate data extraction specialist. Extract detailed, accurate property information for multifamily/apartment investment analysis. Focus on financial metrics, unit counts, rental rates, occupancy data, and market positioning. Be precise with numbers and comprehensive with details.`,
  
  schema: ELITE_REAL_ESTATE_SCHEMA,
  allowExternalLinks: false,
  enableWebSearch: false,
  includeSubdomains: true
};

// Bristol AI MCP Tool Definitions
export const BRISTOL_ELITE_TOOLS = [
  {
    name: "bristol_property_search",
    description: "Elite real estate search using Firecrawl with advanced property data extraction",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query (e.g., 'luxury apartments Austin TX', 'multifamily properties Miami')",
          examples: [
            "luxury apartments downtown Austin Texas",
            "multifamily properties Miami Florida investment",
            "Class A apartments Nashville TN rent rates"
          ]
        },
        location: {
          type: "string",
          description: "Specific location to focus search",
          examples: ["Austin, TX", "Miami, FL", "Nashville, TN"]
        },
        propertyType: {
          type: "string",
          description: "Property type filter",
          default: "multifamily",
          examples: ["multifamily", "apartment", "luxury", "student housing"]
        },
        limit: {
          type: "number",
          description: "Maximum search results",
          default: 20,
          maximum: 50
        }
      },
      required: ["query"]
    }
  },
  {
    name: "bristol_property_crawl",
    description: "Deep crawl of property websites for comprehensive data extraction",
    inputSchema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "Property website or listing page URL to crawl",
          examples: [
            "https://www.apartments.com/austin-tx/",
            "https://www.equityapartments.com/",
            "https://www.maac.com/"
          ]
        },
        maxDepth: {
          type: "number",
          description: "Maximum crawl depth",
          default: 3,
          maximum: 5
        },
        maxUrls: {
          type: "number", 
          description: "Maximum URLs to process",
          default: 100,
          maximum: 500
        }
      },
      required: ["url"]
    }
  },
  {
    name: "bristol_property_extract",
    description: "Advanced property data extraction from specific URLs with elite schema",
    inputSchema: {
      type: "object",
      properties: {
        urls: {
          type: "array",
          items: { type: "string" },
          description: "Array of property listing URLs to extract data from",
          maxItems: 20
        },
        extractionFocus: {
          type: "string",
          description: "Specific data focus area",
          default: "comprehensive",
          enum: ["comprehensive", "financial", "units", "amenities", "location", "management"]
        },
        propertyClass: {
          type: "string",
          description: "Expected property class for targeted extraction",
          enum: ["A", "B", "C", "mixed", "luxury", "affordable"]
        }
      },
      required: ["urls"]
    }
  },
  {
    name: "bristol_market_research",
    description: "Deep market research using Firecrawl's research capabilities",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Market research query",
          examples: [
            "Austin multifamily market trends 2024",
            "Miami luxury apartment rent growth",
            "Nashville Class A property investment analysis"
          ]
        },
        maxDepth: {
          type: "number",
          description: "Research depth",
          default: 3,
          maximum: 5
        },
        timeLimit: {
          type: "number",
          description: "Research time limit in seconds",
          default: 180,
          maximum: 300
        },
        maxUrls: {
          type: "number",
          description: "Maximum URLs to analyze",
          default: 50,
          maximum: 100
        }
      },
      required: ["query"]
    }
  }
];

// Default real estate search queries for common requests
export const DEFAULT_REAL_ESTATE_QUERIES = {
  "find properties": "luxury multifamily apartment properties",
  "find apartments": "apartment complex rental properties",
  "find comps": "comparable multifamily properties rent analysis",
  "find investments": "multifamily investment properties for sale",
  "market analysis": "multifamily apartment market analysis rent trends",
  "rent rates": "apartment rental rates pricing analysis",
  "luxury properties": "luxury apartment complex amenities pricing",
  "student housing": "student housing properties near universities"
};