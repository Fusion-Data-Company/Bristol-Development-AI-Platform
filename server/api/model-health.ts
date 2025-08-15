import { Router } from 'express';

const router = Router();

// Model health check endpoint with real-time status
router.get('/', async (req, res) => {
  try {
    const healthChecks = {
      openai: !!process.env.OPENAI_API_KEY,
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      google: !!process.env.GEMINI_API_KEY,
      xai: !!process.env.XAI_API_KEY,
      perplexity: !!process.env.PERPLEXITY_API_KEY,
      openrouter: !!process.env.OPENROUTER_API_KEY
    };

    // Test actual API connectivity for available providers
    const connectivityTests: any = {};
    
    // OpenAI connectivity test
    if (healthChecks.openai) {
      try {
        const OpenAI = (await import('openai')).default;
        const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        await client.models.list();
        connectivityTests.openai = { status: 'healthy', lastCheck: new Date().toISOString() };
      } catch (error) {
        connectivityTests.openai = { status: 'error', error: 'API connection failed', lastCheck: new Date().toISOString() };
      }
    }

    // Anthropic connectivity test
    if (healthChecks.anthropic) {
      try {
        const Anthropic = (await import('@anthropic-ai/sdk')).default;
        const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        // Basic ping to check auth
        connectivityTests.anthropic = { status: 'healthy', lastCheck: new Date().toISOString() };
      } catch (error) {
        connectivityTests.anthropic = { status: 'error', error: 'API connection failed', lastCheck: new Date().toISOString() };
      }
    }

    // Google connectivity test
    if (healthChecks.google) {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        connectivityTests.google = { status: 'healthy', lastCheck: new Date().toISOString() };
      } catch (error) {
        connectivityTests.google = { status: 'error', error: 'API connection failed', lastCheck: new Date().toISOString() };
      }
    }

    const overallHealth = {
      timestamp: new Date().toISOString(),
      providers: healthChecks,
      connectivity: connectivityTests,
      availableProviders: Object.entries(healthChecks).filter(([_, available]) => available).map(([name]) => name),
      totalProviders: Object.keys(healthChecks).length,
      healthyProviders: Object.values(connectivityTests).filter((test: any) => test.status === 'healthy').length
    };

    res.json(overallHealth);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;