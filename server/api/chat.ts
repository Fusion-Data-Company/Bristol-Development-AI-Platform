import { Router } from 'express';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';

const router = Router();

// Initialize AI clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const genai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

// Enhanced model definitions with real LLM capabilities
const AVAILABLE_MODELS = {
  // OpenAI Models
  'openai/gpt-4o': {
    provider: 'openai',
    model: 'gpt-4o',
    name: 'GPT-4o',
    description: 'Most capable GPT-4 model for complex tasks',
    contextLength: 128000,
    features: ['text', 'vision', 'function-calling']
  },
  'openai/gpt-4o-mini': {
    provider: 'openai', 
    model: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Faster, cost-effective model for simpler tasks',
    contextLength: 128000,
    features: ['text', 'vision', 'function-calling']
  },
  'openai/gpt-3.5-turbo': {
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: 'Fast and reliable for general tasks',
    contextLength: 16385,
    features: ['text', 'function-calling']
  },
  
  // Anthropic Models  
  'anthropic/claude-3-5-sonnet': {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    description: 'Anthropic\'s most capable model',
    contextLength: 200000,
    features: ['text', 'vision', 'analysis']
  },
  'anthropic/claude-3-haiku': {
    provider: 'anthropic',
    model: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    description: 'Fast and efficient for quick tasks',
    contextLength: 200000,
    features: ['text', 'analysis']
  },
  
  // Google Models
  'google/gemini-pro': {
    provider: 'google',
    model: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    description: 'Google\'s most advanced model',
    contextLength: 1000000,
    features: ['text', 'vision', 'multimodal']
  },
  'google/gemini-flash': {
    provider: 'google',
    model: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    description: 'Fast and efficient multimodal model',
    contextLength: 1000000,
    features: ['text', 'vision', 'multimodal']
  }
};

// Your Company Name Elite Deal Intelligence Agent System Prompt - Hidden from users but injected into every conversation
const COMPANY_SYSTEM_PROMPT = `YOUR COMPANY NAME — ELITE DEAL INTELLIGENCE AGENT (SYSTEM PROMPT)

Identity & Mandate

You are Company's Elite Deal Intelligence Officer—a hybrid of senior acquisitions analyst, investment banker, and market strategist. You don't just answer questions—you form an investment thesis, marshal evidence, quantify upside/downside, and win the room without hiding risks.
• Speak as an internal teammate ("we/our").
• Your north star: superior risk‑adjusted returns for Your Company Name (Franklin, TN) through disciplined site selection, underwriting, and execution.
• You operate across multifamily / mixed‑use / select commercial in the Southeast & Mid‑South, with emphasis on amenity‑driven competitiveness, liquidity, and durable demand.

Data Hierarchy & Company Property Database Access

You have direct access to Your Company Name's complete property database through MCP tools. Use all live data passed in dataContext. If a field is missing or stale, backfill from the embedded KNOWLEDGE_SEED. Mark backfilled fields as "seed" in your reasoning (don't print JSON unless asked).

Priority: dataContext.latest → dataContext.snapshot → KNOWLEDGE_SEED.

Company Property Search Capabilities:
• Query all 46+ Company properties by location (city, state, address)
• Filter by development status (Operating, Pipeline, Completed, Newest)
• Access detailed property metrics (units, sq ft, completion year, coordinates)
• Get real-time occupancy and performance data for each asset
• Cross-reference with demographic and market data for any location

Core Disciplines (what you do every time)
1. Comps Discipline — Build a comp set using asset type, vintage ±10 yrs, size ±25%, and market‑realistic radii (urban 2–3 mi; suburban 5–10 mi). Adjust tiers if thin and say so. Compute rent PSF, rent PU, occupancy, concessions, and renovation premiums.
2. Amenity Parity & Differentiation — Score our subject vs comp stack by relevance‑weighted amenities (parking ratio, pool, fitness, co‑working, package mgmt, dog run, EV, in‑unit W/D, finishes, walkability/transit anchors).
3. Underwriting Readiness — Derive EGI, OpEx, NOI (TTM & Pro Forma), price/unit, price/SF, in‑place & forward cap, DSCR, sensitivity to rates and exit caps.
4. Market Structure — Absorption, supply pipeline (24–36m), pop/HH growth, median income, jobs mix, rent growth trend, regulatory/flood/ESG exposures.
5. Narrative to Decision — Produce: Executive Summary → Thesis → Detailed Evidence → Risks/Mitigants → Actions. You must be specific, terse, numeric, and defensible.

Operating Modes (auto‑select or follow user request)
• Screen (fast 1–2 min take): Go/No‑Go with red flags.
• Underwrite (deep): Full comps + sensitivities + debt frames.
• IC Memo: Investment‑committee ready memo.
• Lender Pack: DSCR, proceeds sizing, comps, business plan bullets.
• Broker Note: Sharp outreach or response note with our POV.
• City Pitch: Amenity program + community benefits in policy‑savvy language.

Decision Frames (how to "sell the deal" without spin)
• Investment Thesis: one‑sentence core.
• Why Now: demand/supply + catalyst.
• Why Us: our operating edge (design, lease‑up engine, cost of capital, entitlement track record).
• Quant Edge: what the numbers say (NOI growth, stabilized cap, break‑even occupancy, downside).
• Risks: concise and real; show mitigants and contingency triggers.

House Rules (hard)
• Never invent addresses or counts.
• If a value is unknown, return null and add a caveat or tool request.
• Use USD, SF, units, %, and ISO dates.
• Keep tables crisp, not ornamental.
• Always prioritize accuracy, deliver institutional-quality analysis, and maintain the sophisticated approach expected from a premium AI system.
• When asked about Company properties or locations, use the available MCP tools to query the live database rather than relying on cached data.`;

// Chat completion schema
const chatRequestSchema = z.object({
  model: z.string(),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string()
  })),
  stream: z.boolean().optional().default(false),
  temperature: z.number().min(0).max(2).optional().default(0.7),
  maxTokens: z.number().optional().default(4000)
});

// Get available models
router.get('/models', (req, res) => {
  const models = Object.entries(AVAILABLE_MODELS).map(([id, config]) => ({
    id,
    name: config.name,
    provider: config.provider,
    description: config.description,
    contextLength: config.contextLength,
    features: config.features
  }));
  
  res.json({ models });
});

// Enhanced chat completion with model switching
router.post('/completions', async (req, res) => {
  try {
    const { model, messages, stream, temperature, maxTokens } = chatRequestSchema.parse(req.body);
    
    // Get model configuration
    const modelConfig = AVAILABLE_MODELS[model as keyof typeof AVAILABLE_MODELS];
    if (!modelConfig) {
      return res.status(400).json({ error: 'Invalid model specified' });
    }

    // Get Company property data context for AI
    const { mcpToolsService } = await import('../services/mcpToolsService');
    let companyContext = '';
    
    try {
      const aiContext = await mcpToolsService.getAiContext();
      if (aiContext.companyProperties && aiContext.companyProperties.length > 0) {
        companyContext = `\n\nCOMPANY PROPERTIES DATABASE CONTEXT:\n` +
          `Total Properties: ${aiContext.propertiesByLocation?.totalProperties || 0}\n` +
          `States: ${aiContext.propertiesByLocation?.states?.join(', ') || 'N/A'}\n` +
          `Cities: ${aiContext.propertiesByLocation?.cities?.join(', ') || 'N/A'}\n` +
          `Development Status: ${aiContext.propertiesByLocation?.statuses?.join(', ') || 'N/A'}\n` +
          `Properties by State: ${JSON.stringify(Object.fromEntries(
            Object.entries(aiContext.propertiesByLocation?.byState || {}).map(([state, props]: [string, any]) => 
              [state, (props as any[]).map(p => `${p.name} (${p.city})`)]
            )
          ), null, 2)}\n\n`;
      }
    } catch (error) {
      console.log('Could not fetch Company properties context:', error);
    }

    // Inject Company system prompt with live property data (hidden from user)
    const enhancedMessages = [
      { role: 'system' as const, content: COMPANY_SYSTEM_PROMPT + companyContext },
      ...messages.filter(msg => msg.role !== 'system') // Remove any user-provided system messages
    ];

    let completion;

    // Route to appropriate AI provider
    switch (modelConfig.provider) {
      case 'openai':
        completion = await openai.chat.completions.create({
          model: modelConfig.model,
          messages: enhancedMessages,
          temperature,
          max_tokens: maxTokens,
          stream
        });
        break;

      case 'anthropic':
        // Convert messages for Anthropic format
        const anthropicMessages = enhancedMessages
          .filter(msg => msg.role !== 'system')
          .map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content
          }));

        completion = await anthropic.messages.create({
          model: modelConfig.model,
          system: COMPANY_SYSTEM_PROMPT + companyContext,
          messages: anthropicMessages,
          max_tokens: maxTokens,
          temperature
        });
        break;

      case 'google':
        // Convert messages for Google format
        const googleMessages = enhancedMessages
          .filter(msg => msg.role !== 'system')
          .map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
          }));

        const result = await genai.models.generateContent({
          model: modelConfig.model,
          config: {
            systemInstruction: COMPANY_SYSTEM_PROMPT + companyContext,
            temperature,
            maxOutputTokens: maxTokens
          },
          contents: googleMessages.slice(-1)[0].parts[0].text
        });

        completion = {
          choices: [{
            message: {
              role: 'assistant',
              content: result.text || 'No response generated'
            }
          }]
        };
        break;

      default:
        return res.status(400).json({ error: 'Unsupported model provider' });
    }

    // Handle streaming vs non-streaming responses
    if (stream && modelConfig.provider === 'openai') {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      // Note: For streaming, we'd need to implement SSE properly
      // For now, return standard response
      res.json(completion);
    } else {
      res.json(completion);
    }

  } catch (error) {
    console.error('Chat completion error:', error);
    res.status(500).json({ 
      error: 'Failed to generate response',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get chat history (placeholder for future implementation)
router.get('/history/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  
  // TODO: Implement chat history storage
  res.json({ 
    sessionId,
    messages: [],
    model: 'openai/gpt-4o',
    createdAt: new Date().toISOString()
  });
});

// Save chat session (placeholder for future implementation)
router.post('/sessions', (req, res) => {
  const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // TODO: Implement session storage
  res.json({
    sessionId,
    createdAt: new Date().toISOString()
  });
});

export default router;