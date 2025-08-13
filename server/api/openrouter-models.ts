import { Router } from 'express';

const router = Router();

const ELITE_MODELS = new Set<string>([
  "openai/gpt-5",
  "openai/gpt-5-chat",
  "anthropic/claude-opus-4",
  "anthropic/claude-opus-4.1",
  "anthropic/claude-sonnet-4",
  "x-ai/grok-4",
  "google/gemini-2.5-pro",
  "google/gemini-2.5-flash",
  "perplexity/sonar-deep-research",
  "perplexity/sonar-reasoning",
  "perplexity/sonar-pro",
  "perplexity/sonar-reasoning-pro"
]);

function getModelLabel(slug: string): string {
  const labelMap: Record<string, string> = {
    "openai/gpt-5": "GPT-5",
    "openai/gpt-5-chat": "GPT-5 Chat",
    "anthropic/claude-opus-4": "Claude Opus 4",
    "anthropic/claude-opus-4.1": "Claude Opus 4.1",
    "anthropic/claude-sonnet-4": "Claude Sonnet 4",
    "x-ai/grok-4": "Grok 4",
    "google/gemini-2.5-pro": "Gemini 2.5 Pro",
    "google/gemini-2.5-flash": "Gemini 2.5 Flash",
    "perplexity/sonar-deep-research": "Sonar Deep Research",
    "perplexity/sonar-reasoning": "Sonar Reasoning",
    "perplexity/sonar-pro": "Sonar Pro",
    "perplexity/sonar-reasoning-pro": "Sonar Reasoning Pro"
  };
  return labelMap[slug] || slug;
}

router.get('/', async (req, res) => {
  try {
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY2 || process.env.OPENAI_API_KEY;
    
    if (!OPENROUTER_API_KEY) {
      return res.status(500).json({ error: "API key not configured" });
    }

    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: { 
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      cache: "no-store" as any,
    });

    if (!response.ok) {
      return res.status(502).json({ error: "Failed to fetch models from OpenRouter" });
    }

    const { data } = await response.json();
    const now = Date.now() / 1000;
    const cutoff = now - 240 * 24 * 3600; // ~240 days

    const filtered = (data || [])
      .filter((m: any) => ELITE_MODELS.has(m.id))
      .filter((m: any) => (m.created ?? cutoff) >= cutoff)
      .map((m: any) => ({ 
        id: m.id, 
        label: getModelLabel(m.id),
        context: m.context_length || 0
      }));

    // Prefer GPT-5 Chat as the default model
    filtered.sort((a: any, b: any) => {
      const preferred = ["openai/gpt-5-chat", "openai/gpt-5", "anthropic/claude-opus-4.1", "google/gemini-2.5-pro"];
      const aIndex = preferred.indexOf(a.id);
      const bIndex = preferred.indexOf(b.id);
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.label.localeCompare(b.label);
    });

    res.json(filtered);
  } catch (error: any) {
    console.error("Error fetching OpenRouter models:", error);
    res.status(500).json({ error: error?.message || "unknown" });
  }
});

export default router;