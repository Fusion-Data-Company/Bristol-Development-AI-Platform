import { Router } from 'express';

const router = Router();

const ELITE_MODELS = new Set<string>([
  "openai/gpt-4o",
  "openai/gpt-4o-mini",
  "openai/gpt-4-turbo",
  "anthropic/claude-3.5-sonnet",
  "anthropic/claude-3-opus",
  "anthropic/claude-3-haiku",
  "google/gemini-2.0-flash-exp",
  "google/gemini-pro-1.5",
  "meta-llama/llama-3.1-70b-instruct",
  "meta-llama/llama-3.1-405b-instruct",
  "perplexity/sonar",
  "x-ai/grok-2",
  "x-ai/grok-2-vision-1212",
  "deepseek/deepseek-chat",
  "mistralai/mistral-large"
]);

function getModelLabel(slug: string): string {
  const labelMap: Record<string, string> = {
    "openai/gpt-4o": "GPT-4o",
    "openai/gpt-4o-mini": "GPT-4o Mini",
    "openai/gpt-4-turbo": "GPT-4 Turbo",
    "anthropic/claude-3.5-sonnet": "Claude 3.5 Sonnet",
    "anthropic/claude-3-opus": "Claude 3 Opus",
    "anthropic/claude-3-haiku": "Claude 3 Haiku",
    "google/gemini-2.0-flash-exp": "Gemini 2.0 Flash",
    "google/gemini-pro-1.5": "Gemini Pro 1.5",
    "meta-llama/llama-3.1-70b-instruct": "Llama 3.1 70B",
    "meta-llama/llama-3.1-405b-instruct": "Llama 3.1 405B",
    "perplexity/sonar": "Perplexity Sonar",
    "x-ai/grok-2": "Grok 2",
    "x-ai/grok-2-vision-1212": "Grok 2 Vision",
    "deepseek/deepseek-chat": "DeepSeek Chat",
    "mistralai/mistral-large": "Mistral Large"
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

    // Prefer GPT-4o as the default model
    filtered.sort((a: any, b: any) => {
      const preferred = ["openai/gpt-4o", "anthropic/claude-3.5-sonnet", "google/gemini-2.0-flash-exp"];
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