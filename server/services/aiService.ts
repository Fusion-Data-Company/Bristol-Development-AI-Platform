import { storage } from "../storage";
import type { ChatMessage, InsertChatMessage } from "@shared/schema";

interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class AIService {
  private apiKey: string;
  private baseUrl = "https://openrouter.ai/api/v1";

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || "";
    if (!this.apiKey) {
      throw new Error("OPENROUTER_API_KEY or OPENAI_API_KEY environment variable is required");
    }
  }

  async createChatCompletion(
    messages: OpenRouterMessage[],
    model = "openai/gpt-5"
  ): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.REPLIT_DOMAINS?.split(",")[0] || "http://localhost:5000",
          "X-Title": "Bristol Site Intelligence Platform"
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: 4000,
          temperature: 0.7,
          stream: false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
      }

      const data: OpenRouterResponse = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error("No response from OpenRouter API");
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error("AI Service Error:", error);
      throw new Error(`Failed to generate AI response: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async processUserMessage(
    sessionId: string,
    userMessage: string,
    userId: string
  ): Promise<ChatMessage> {
    try {
      // Store user message
      const userChatMessage: InsertChatMessage = {
        sessionId,
        role: "user",
        content: userMessage,
      };
      await storage.createChatMessage(userChatMessage);

      // Check for scrape intent first
      const { parseScrapeIntent, formatScrapeResults } = await import('../utils/scrapeIntentParser');
      const scrapeIntent = parseScrapeIntent(userMessage);

      if (scrapeIntent) {
        try {
          console.log('Detected scrape intent:', scrapeIntent);
          
          // Execute scraper
          const { runScrapeAgent } = await import('../scrapers/agent');
          const scrapeResult = await runScrapeAgent(scrapeIntent);
          
          // Insert results into database
          const { randomUUID } = await import('crypto');
          const rows = (scrapeResult.records || []).map(r => ({
            ...r,
            id: randomUUID(),
            jobId: randomUUID(),
            scrapedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }));

          if (rows.length > 0) {
            const { compsAnnex } = await import('../../shared/schema');
            const { db } = await import('../db');
            const { sql } = await import('drizzle-orm');

            // Map scraper results to compsAnnex schema
            const mappedRows = rows.map(r => ({
              id: r.id,
              source: r.source,
              sourceUrl: r.sourceUrl,
              name: r.name,
              address: r.address,
              city: r.city,
              state: r.state,
              zip: r.zip,
              assetType: r.assetType,
              units: r.units,
              yearBuilt: r.yearBuilt,
              rentPsf: r.rentPsf,
              rentPu: r.rentPu,
              occupancyPct: r.occupancyPct,
              concessionPct: r.concessionPct,
              amenityTags: r.amenityTags,
              notes: r.notes,
              canonicalAddress: r.canonicalAddress,
              unitPlan: r.unitPlan,
              scrapedAt: new Date(r.scrapedAt),
              jobId: r.jobId,
              createdAt: new Date(r.createdAt),
              updatedAt: new Date(r.updatedAt)
            }));

            await db.insert(compsAnnex).values(mappedRows).onConflictDoUpdate({
              target: [compsAnnex.canonicalAddress, compsAnnex.unitPlan],
              set: {
                rentPsf: sql`excluded.rent_psf`,
                rentPu: sql`excluded.rent_pu`,
                occupancyPct: sql`excluded.occupancy_pct`,
                concessionPct: sql`excluded.concession_pct`,
                amenityTags: sql`coalesce(excluded.amenity_tags, comps_annex.amenity_tags)`,
                source: sql`coalesce(excluded.source, comps_annex.source)`,
                sourceUrl: sql`coalesce(excluded.source_url, comps_annex.source_url)`,
                scrapedAt: sql`excluded.scraped_at`,
                jobId: sql`excluded.job_id`,
                updatedAt: sql`now()`
              }
            });
          }

          const formattedResponse = formatScrapeResults({
            ...scrapeResult,
            inserted: rows.length,
            records: rows.slice(0, 5)
          });

          // Store AI response
          const aiChatMessage: InsertChatMessage = {
            sessionId,
            role: "assistant",
            content: formattedResponse,
          };
          
          return await storage.createChatMessage(aiChatMessage);
        } catch (scrapeError) {
          console.error('Scrape execution failed:', scrapeError);
          // Fall through to normal AI response with error context
        }
      }

      // Get conversation history
      const messages = await storage.getSessionMessages(sessionId);
      
      // Convert to OpenRouter format
      const openRouterMessages: OpenRouterMessage[] = [
        {
          role: "system",
          content: this.getSystemPrompt()
        },
        ...messages.slice(-10).map(msg => ({
          role: msg.role as "user" | "assistant",
          content: msg.content
        }))
      ];

      // Get AI response using GPT-5
      const aiResponse = await this.createChatCompletion(openRouterMessages);

      // Store AI response
      const aiChatMessage: InsertChatMessage = {
        sessionId,
        role: "assistant",
        content: aiResponse,
      };
      const savedMessage = await storage.createChatMessage(aiChatMessage);

      return savedMessage;
    } catch (error) {
      console.error("Error processing user message:", error);
      
      // Store error message
      const errorMessage: InsertChatMessage = {
        sessionId,
        role: "assistant",
        content: "I apologize, but I'm experiencing technical difficulties. Please try again in a moment.",
        metadata: { error: error instanceof Error ? error.message : "Unknown error" }
      };
      
      return await storage.createChatMessage(errorMessage);
    }
  }

  private getSystemPrompt(): string {
    return `You are the Bristol Site Intelligence AI Assistant, specializing in multifamily real estate development analysis across Sunbelt markets. You provide comprehensive site feasibility studies, market comparables analysis, and development insights.

Key Capabilities:
- Site Analysis: Evaluate demographic trends, zoning compliance, and development potential
- Market Intelligence: Access Census ACS, HUD FMR, BLS employment data, and ArcGIS insights
- Bristol Scoring: Apply the proprietary 1-100 Bristol methodology for property comparison
- Development Metrics: Analyze feasibility, cost projections, and ROI calculations

Bristol Brand Values:
- Precision and data-driven insights
- Professional, enterprise-level analysis
- Focus on Sunbelt multifamily opportunities
- Comprehensive market intelligence

Response Guidelines:
- Provide actionable, specific recommendations
- Reference relevant data sources when available
- Use professional real estate terminology
- Structure responses with clear sections and bullet points
- Always consider local market conditions and regulatory environment
- Emphasize quality and thoroughness over speed

When discussing sites or markets, consider:
- Demographics and population growth trends
- Employment and economic indicators
- Housing supply and demand dynamics
- Regulatory and zoning considerations
- Infrastructure and transportation access
- Competitive landscape analysis`;
  }

  async generateSiteAnalysis(siteId: string): Promise<string> {
    try {
      const site = await storage.getSite(siteId);
      if (!site) {
        throw new Error("Site not found");
      }

      const metrics = await storage.getSiteMetrics(siteId);
      
      const prompt = `Analyze this development site and provide a comprehensive feasibility assessment:

Site Details:
- Name: ${site.name}
- Location: ${site.addrLine1 || "Not specified"}, ${site.city || "Not specified"}, ${site.state || "Not specified"} ${site.postalCode || "Not specified"}
- Acreage: ${site.acreage || "Not specified"}
- Total Units: ${site.unitsTotal || "Not specified"}
- Completion Year: ${site.completionYear || "Not yet built"}

Available Metrics:
${metrics.map(m => `- ${m.metricName}: ${m.value} ${m.unit || ""} (Source: ${m.source})`).join("\n")}

Provide analysis covering:
1. Market Overview
2. Site Suitability Assessment
3. Development Recommendations
4. Risk Factors
5. Next Steps`;

      return await this.createChatCompletion([
        { role: "system", content: this.getSystemPrompt() },
        { role: "user", content: prompt }
      ]);
    } catch (error) {
      console.error("Error generating site analysis:", error);
      throw error;
    }
  }
}

export const aiService = new AIService();
