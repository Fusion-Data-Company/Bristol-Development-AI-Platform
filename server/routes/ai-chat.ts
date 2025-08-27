// server/routes/ai-chat.ts
import type { Request, Response } from "express";
import { COMPANY_SYSTEM_PROMPT } from "../agent/company_system_prompt";
import { COMPANY_TOOLS } from "../agent/tools";

export function registerAIAgentRoute(app: import("express").Express) {
  app.post("/api/ai/brand-chat", async (req: Request, res: Response) => {
    try {
      const key = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
      const { model = "openai/gpt-5", messages, stream = false } = req.body || {};
      
      if (!key) {
        return res.status(500).json({ error: "missing_openrouter_key" });
      }

      // Prepend Company system prompt
      const fullMessages = [
        { role: "system", content: COMPANY_SYSTEM_PROMPT },
        ...(Array.isArray(messages) ? messages : [])
      ];

      const body: any = {
        model,
        messages: fullMessages,
        tools: COMPANY_TOOLS,
        tool_choice: "auto",
        temperature: 0.2,
        max_tokens: 4000
      };

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.REPLIT_DOMAINS?.split(",")[0] || "http://localhost:5000",
          "X-Title": "Company Elite Agent"
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenRouter API error:", response.status, errorText);
        return res.status(response.status).json({ error: errorText });
      }

      const data = await response.json();
      
      // Handle tool calls if present
      if (data.choices?.[0]?.message?.tool_calls) {
        const toolCalls = data.choices[0].message.tool_calls;
        const toolResults = [];

        for (const toolCall of toolCalls) {
          try {
            const result = await handleToolCall(toolCall);
            toolResults.push({
              tool_call_id: toolCall.id,
              role: "tool",
              content: JSON.stringify(result)
            });
          } catch (error) {
            console.error("Tool call error:", error);
            toolResults.push({
              tool_call_id: toolCall.id,
              role: "tool",
              content: JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" })
            });
          }
        }

        // If there were tool calls, make another request with the results
        if (toolResults.length > 0) {
          const followUpMessages = [
            ...fullMessages,
            data.choices[0].message,
            ...toolResults
          ];

          const followUpResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json",
              "HTTP-Referer": process.env.REPLIT_DOMAINS?.split(",")[0] || "http://localhost:5000",
              "X-Title": "Company Elite Agent"
            },
            body: JSON.stringify({
              ...body,
              messages: followUpMessages,
              tools: undefined, // Don't allow recursive tool calls
              tool_choice: undefined
            })
          });

          if (followUpResponse.ok) {
            const followUpData = await followUpResponse.json();
            return res.json(followUpData);
          }
        }
      }

      res.json(data);
    } catch (e: any) {
      console.error("Company chat error:", e);
      res.status(500).json({ error: String(e?.message || e) });
    }
  });
}

async function handleToolCall(toolCall: any) {
  const { function: func } = toolCall;
  const args = JSON.parse(func.arguments);

  switch (func.name) {
    case "comps_agent_scrape":
      return await handleCompsAgentScrape(args);
    case "comps_status":
      return await handleCompsStatus(args);
    case "comps_search":
      return await handleCompsSearch(args);
    case "demographics_analysis":
      return await handleDemographicsAnalysis(args);
    case "market_intelligence":
      return await handleMarketIntelligence(args);
    default:
      throw new Error(`Unknown tool: ${func.name}`);
  }
}

async function handleCompsAgentScrape(args: any) {
  const response = await fetch("http://localhost:5000/api/scraper/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args)
  });

  if (!response.ok) {
    throw new Error(`Scraper failed: ${response.statusText}`);
  }

  return await response.json();
}

async function handleCompsStatus(args: { id: string }) {
  // For now, return a simple status since we're running scrapes synchronously
  return { id: args.id, status: "completed" };
}

async function handleCompsSearch(args: { q?: string; limit?: number }) {
  const params = new URLSearchParams();
  if (args.q) params.append('q', args.q);
  if (args.limit) params.append('limit', args.limit.toString());

  const response = await fetch(`http://localhost:5000/api/comps-annex?${params}`);
  
  if (!response.ok) {
    throw new Error(`Comps search failed: ${response.statusText}`);
  }

  return await response.json();
}

async function handleDemographicsAnalysis(args: { address: string; radius_mi?: number }) {
  const response = await fetch(`http://localhost:5000/api/address-demographics?address=${encodeURIComponent(args.address)}`);
  
  if (!response.ok) {
    throw new Error(`Demographics analysis failed: ${response.statusText}`);
  }

  return await response.json();
}

async function handleMarketIntelligence(args: { market: string; asset_type?: string }) {
  const response = await fetch(`http://localhost:5000/api/analytics/market/${encodeURIComponent(args.market)}`);
  
  if (!response.ok) {
    throw new Error(`Market intelligence failed: ${response.statusText}`);
  }

  return await response.json();
}