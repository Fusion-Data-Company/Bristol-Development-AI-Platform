import { Router } from "express";

const router = Router();

// Premium AI Models Configuration for Bristol Brain Elite
const PREMIUM_MODELS = [
  {
    id: "gpt-5",
    name: "GPT-5",
    provider: "OpenAI",
    category: "general",
    description: "OpenAI's most advanced model for coding and agentic tasks",
    features: ["Step-by-step Reasoning", "400k Context Window", "Tool Support", "Function Calling"],
    contextLength: 400000,
    pricing: {
      input: "$1.25/M tokens",
      output: "$10/M tokens"
    },
    bestFor: ["Coding", "Agentic Tasks", "Complex Reasoning", "Real Estate Analysis"],
    status: "active"
  },
  {
    id: "x-ai/grok-4",
    name: "Grok 4",
    provider: "xAI", 
    category: "reasoning",
    description: "xAI's latest reasoning model with 256k context window",
    features: ["Advanced Reasoning", "Parallel Tool Calling", "Structured Outputs", "Vision Support"],
    contextLength: 256000,
    pricing: {
      input: "$3/M tokens",
      output: "$15/M tokens"
    },
    bestFor: ["Complex Analysis", "Real Estate Reasoning", "Multi-step Problem Solving"],
    status: "active"
  },
  {
    id: "anthropic/claude-opus-4.1",
    name: "Claude Opus 4.1", 
    provider: "Anthropic",
    category: "coding",
    description: "World's best coding model with enhanced performance",
    features: ["Extended Thinking", "Code Refactoring", "Debugging Precision", "Agentic Tasks"],
    contextLength: 200000,
    pricing: {
      input: "$15/M tokens", 
      output: "$75/M tokens",
      images: "$24/K images"
    },
    bestFor: ["Software Engineering", "Code Analysis", "Technical Documentation"],
    status: "active"
  },
  {
    id: "google/gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "Google",
    category: "reasoning", 
    description: "Google's state-of-the-art model with thinking capabilities",
    features: ["Thinking Capabilities", "Advanced Reasoning", "Scientific Tasks", "Mathematics"],
    contextLength: 1048576,
    pricing: {
      input: "$1.25/M tokens",
      output: "$10/M tokens", 
      images: "$5.16/K images"
    },
    bestFor: ["Scientific Analysis", "Market Research", "Financial Modeling"],
    status: "active"
  },
  {
    id: "perplexity/sonar-deep-research",
    name: "Sonar Deep Research",
    provider: "Perplexity",
    category: "research",
    description: "Research-focused model with multi-step retrieval and synthesis",
    features: ["Web Search", "Multi-step Research", "Source Evaluation", "Report Generation"],
    contextLength: 128000,
    pricing: {
      input: "$2/M tokens",
      output: "$8/M tokens",
      search: "$5/K searches"
    },
    bestFor: ["Market Research", "Due Diligence", "Competitive Analysis"],
    status: "active"
  }
];

// Get all premium models
router.get("/", (req, res) => {
  res.json({
    models: PREMIUM_MODELS,
    default: "gpt-5",
    categories: ["general", "reasoning", "coding", "research"]
  });
});

// Get models by category
router.get("/category/:category", (req, res) => {
  const { category } = req.params;
  const filteredModels = PREMIUM_MODELS.filter(model => model.category === category);
  
  res.json({
    category,
    models: filteredModels
  });
});

// Get specific model details
router.get("/:modelId", (req, res) => {
  const { modelId } = req.params;
  const model = PREMIUM_MODELS.find(m => m.id === modelId);
  
  if (!model) {
    return res.status(404).json({ error: "Model not found" });
  }
  
  res.json(model);
});

export default router;