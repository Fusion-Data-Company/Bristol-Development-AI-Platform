import { Router } from 'express';

const router = Router();

const ELITE_MODELS = new Set<string>([
  "openai/gpt-5-chat", 
  "openai/gpt-5",
  "anthropic/claude-opus-4", 
  "anthropic/claude-sonnet-4",
  "x-ai/grok-4",
  "perplexity/sonar-deep-research", 
  "perplexity/sonar-reasoning",
  "perplexity/sonar-pro", 
  "perplexity/sonar-reasoning-pro",
]);

function getModelLabel(slug: string): string {
  const labelMap: Record<string, string> = {
    "openai/gpt-5-chat": "GPT-5 Chat",
    "openai/gpt-5": "GPT-5",
    "anthropic/claude-opus-4": "Claude 4 Opus",
    "anthropic/claude-sonnet-4": "Claude 4 Sonnet",
    "x-ai/grok-4": "Grok 4",
    "perplexity/sonar-deep-research": "Perplexity Sonar Deep Research",
    "perplexity/sonar-reasoning": "Perplexity Sonar Reasoning",
    "perplexity/sonar-pro": "Perplexity Sonar Pro",
    "perplexity/sonar-reasoning-pro": "Perplexity Sonar Reasoning Pro",
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

    // Prefer GPT-5 Chat if both are present
    filtered.sort((a: any, b: any) => {
      const preferred = ["openai/gpt-5-chat", "openai/gpt-5"];
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