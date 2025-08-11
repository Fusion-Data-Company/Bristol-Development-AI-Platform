import OpenAI from "openai";
import { storage } from "../storage";
import type { ChatMessage, InsertChatMessage } from "@shared/schema";

export class AIService {
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is required");
    }
    
    this.openai = new OpenAI({ apiKey });
  }

  async createChatCompletion(
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
    model = "gpt-4o"
  ): Promise<string> {
    try {
      // The newest OpenAI model is "gpt-4o" which was released May 13, 2024. Do not change this unless explicitly requested by the user
      const response = await this.openai.chat.completions.create({
        model,
        messages,
        max_tokens: 4000,
        temperature: 0.7,
      });

      if (!response.choices || response.choices.length === 0) {
        throw new Error("No response from OpenAI API");
      }

      return response.choices[0].message.content || "";
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

      // Get conversation history
      const messages = await storage.getSessionMessages(sessionId);
      
      // Convert to OpenAI format
      const openAIMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
        {
          role: "system",
          content: this.getSystemPrompt()
        },
        ...messages.slice(-10).map(msg => ({
          role: msg.role as "user" | "assistant",
          content: msg.content
        }))
      ];

      // Get AI response
      const aiResponse = await this.createChatCompletion(openAIMessages);

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
- Location: ${site.address}, ${site.city}, ${site.state} ${site.zipCode}
- Acreage: ${site.acreage || "Not specified"}
- Zoning: ${site.zoning || "Not specified"}
- Bristol Score: ${site.bristolScore || "Not yet scored"}

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
