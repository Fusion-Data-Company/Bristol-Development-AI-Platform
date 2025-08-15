// server/agent/tools.ts
export const BRISTOL_TOOLS = [
  {
    name: "comps_agent_scrape",
    description: "Launch the Scraping Agent with address ground zero, radius, property type, amenities, and keywords.",
    parameters: {
      type: "object",
      properties: {
        address: { type: "string" },
        radius_mi: { type: "number", default: 5 },
        asset_type: { type: "string", default: "Multifamily" },
        amenities: { type: "array", items: { type: "string" }, default: [] },
        keywords: { type: "array", items: { type: "string" }, default: [] },
        city: { type: "string" }, 
        state: { type: "string" }, 
        zip: { type: "string" }
      },
      required: ["address"]
    }
  },
  {
    name: "comps_status",
    description: "Check scrape job status by id.",
    parameters: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"]
    }
  },
  {
    name: "comps_search",
    description: "Query saved comparables (DB) by filter string and limit.",
    parameters: {
      type: "object",
      properties: { 
        q: { type: "string" }, 
        limit: { type: "number", default: 2000 } 
      }
    }
  },
  {
    name: "demographics_analysis",
    description: "Get demographic and economic analysis for a location.",
    parameters: {
      type: "object",
      properties: {
        address: { type: "string" },
        radius_mi: { type: "number", default: 3 }
      },
      required: ["address"]
    }
  },
  {
    name: "market_intelligence",
    description: "Get comprehensive market intelligence including employment, housing, and economic indicators.",
    parameters: {
      type: "object",
      properties: {
        market: { type: "string" },
        asset_type: { type: "string", default: "Multifamily" }
      },
      required: ["market"]
    }
  }
];