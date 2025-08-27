// OpenAI API Documentation for Company A.I. Elite
// This documentation is referenced by the AI to understand OpenAI capabilities

export const OPENAI_DOCUMENTATION = {
  overview: {
    description: "OpenAI API provides RESTful, streaming, and realtime APIs for AI integration",
    authentication: "Uses API keys with HTTP Bearer authentication",
    baseUrl: "https://api.openai.com/v1"
  },
  
  gpt5: {
    modelId: "gpt-5",
    description: "OpenAI's flagship model for coding, reasoning, and agentic tasks across domains",
    capabilities: {
      contextWindow: 400000,
      maxOutputTokens: 128000,
      knowledgeCutoff: "Sep 30, 2024",
      reasoningTokenSupport: true,
      modalities: {
        text: { input: true, output: true },
        image: { input: true, output: false },
        audio: { input: false, output: false }
      }
    },
    
    pricing: {
      textTokens: {
        input: "$1.25 per 1M tokens",
        cachedInput: "$0.125 per 1M tokens", 
        output: "$10.00 per 1M tokens"
      }
    },

    endpoints: [
      "v1/chat/completions",
      "v1/responses", 
      "v1/realtime",
      "v1/assistants",
      "v1/batch",
      "v1/fine-tuning",
      "v1/embeddings",
      "v1/images/generations",
      "v1/images/edits",
      "v1/audio/speech", 
      "v1/audio/transcriptions",
      "v1/audio/translations",
      "v1/moderations"
    ],

    features: {
      streaming: true,
      functionCalling: true,
      structuredOutputs: true,
      fineTuning: true,
      distillation: true,
      tools: {
        webSearch: true,
        fileSearch: true, 
        imageGeneration: true,
        codeInterpreter: true,
        computerUse: false,
        mcp: true
      }
    },

    snapshots: [
      "gpt-5",
      "gpt-5-2025-08-07"
    ],

    rateLimits: {
      free: { supported: false },
      tier1: { rpm: 500, tpm: 30000, batchQueueLimit: 90000 },
      tier2: { rpm: 5000, tpm: 450000, batchQueueLimit: 1350000 },
      tier3: { rpm: 5000, tpm: 800000, batchQueueLimit: 100000000 },
      tier4: { rpm: 10000, tpm: 2000000, batchQueueLimit: 200000000 },
      tier5: { rpm: 15000, tpm: 40000000, batchQueueLimit: 15000000000 }
    }
  },

  bestPractices: {
    realEstate: [
      "Use structured outputs for property analysis data",
      "Leverage function calling for market data retrieval",
      "Implement reasoning tokens for complex financial calculations",
      "Use file search for document analysis (leases, contracts)",
      "Apply web search for current market conditions"
    ],
    
    errorHandling: [
      "Implement exponential backoff for rate limits",
      "Check API key validity before requests",
      "Handle 401 authentication errors gracefully", 
      "Provide fallback responses for API failures",
      "Log errors with context for debugging"
    ],

    performance: [
      "Cache frequent requests when appropriate",
      "Use batch API for bulk operations",
      "Implement streaming for real-time responses",
      "Optimize prompt length for cost efficiency",
      "Monitor token usage and costs"
    ]
  },

  integrationNotes: {
    bristolBrain: "GPT-5 serves as the flagship model for Company Development Group's AI analysis platform",
    authentication: "Uses OPENAI_API_KEY2 environment variable for BYOK setup",
    defaultModel: "Always defaults to GPT-5 unless user specifically selects alternative",
    capabilities: "Supports all advanced features including reasoning, tool use, and multimodal input"
  }
};

export default OPENAI_DOCUMENTATION;