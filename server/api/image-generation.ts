import express from 'express';
import OpenAI from 'openai';

const router = express.Router();

// Initialize OpenAI client for image generation
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Enhanced image generation endpoint for Company AI Elite
router.post('/generate', async (req, res) => {
  try {
    const { prompt, size = '1024x1024', quality = 'standard', style = 'vivid' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ 
        error: 'OpenAI API key not configured',
        message: 'Please add your OPENAI_API_KEY to environment variables'
      });
    }

    // Enhanced prompt for Fortune 500-grade professional imagery
    const enhancedPrompt = `${prompt}. Professional, high-quality, Fortune 500 enterprise-grade visual. Clean, sophisticated, modern design. Corporate aesthetic with premium presentation.`;

    console.log('🎨 Generating image with DALL-E 3:', enhancedPrompt.substring(0, 100) + '...');

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: enhancedPrompt,
      n: 1,
      size: size as "1024x1024" | "1792x1024" | "1024x1792",
      quality: quality as "standard" | "hd",
      style: style as "vivid" | "natural"
    });

    const imageUrl = response.data[0]?.url;
    const revisedPrompt = response.data[0]?.revised_prompt;

    console.log('✅ Image generated successfully');

    res.json({
      success: true,
      imageUrl,
      revisedPrompt,
      metadata: {
        size,
        quality,
        style,
        model: "dall-e-3",
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Image generation error:', error);
    
    if (error?.code === 'content_policy_violation') {
      return res.status(400).json({
        error: 'Content policy violation',
        message: 'The prompt was rejected due to content policy. Please try a different prompt.'
      });
    }
    
    if (error?.code === 'rate_limit_exceeded') {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.'
      });
    }

    res.status(500).json({
      error: 'Image generation failed',
      message: (error as Error)?.message || 'Unknown error occurred'
    });
  }
});

// Background generation specifically for Company Elite pages
router.post('/generate-background', async (req, res) => {
  try {
    const { 
      theme = 'corporate', 
      colors = 'brand-gold-cyan', 
      style = 'abstract',
      purpose = 'dashboard'
    } = req.body;

    const backgroundPrompts = {
      dashboard: `Abstract corporate background with ${colors} color scheme, professional geometric patterns, Fortune 500 enterprise aesthetic, subtle gradients, modern minimalist design`,
      data: `Data visualization inspired background, ${colors} palette, network patterns, professional tech aesthetic, clean geometric forms, enterprise dashboard style`,
      tools: `Professional tools and analytics background, ${colors} color scheme, subtle tech patterns, Fortune 500 corporate aesthetic, clean minimal design`,
      analytics: `Business analytics inspired background, ${colors} palette, chart and graph patterns, professional corporate aesthetic, clean sophisticated design`
    };

    const prompt = backgroundPrompts[purpose as keyof typeof backgroundPrompts] || backgroundPrompts.dashboard;

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: `${prompt}. Ultra-high quality, professional, abstract, suitable for website background, no text, no logos, seamless pattern.`,
      n: 1,
      size: "1792x1024",
      quality: "hd",
      style: "natural"
    });

    console.log(`🎨 Generated ${purpose} background successfully`);

    res.json({
      success: true,
      imageUrl: response.data[0]?.url,
      purpose,
      theme,
      colors,
      revisedPrompt: response.data[0]?.revised_prompt,
      metadata: {
        size: "1792x1024",
        quality: "hd",
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Background generation error:', error);
    res.status(500).json({
      error: 'Background generation failed',
      message: (error as Error)?.message || 'Unknown error occurred'
    });
  }
});

// Property visualization generation for real estate
router.post('/generate-property', async (req, res) => {
  try {
    const { 
      propertyType = 'apartment', 
      location = 'urban',
      style = 'modern',
      features = []
    } = req.body;

    const propertyPrompt = `Professional architectural visualization of ${propertyType} in ${location} setting, ${style} design, ${features.join(', ')}, high-quality rendering, real estate marketing image, professional photography style, bright natural lighting, attractive curb appeal`;

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: propertyPrompt,
      n: 1,
      size: "1024x1024",
      quality: "hd",
      style: "natural"
    });

    console.log('🏢 Generated property visualization successfully');

    res.json({
      success: true,
      imageUrl: response.data[0]?.url,
      propertyType,
      location,
      style,
      revisedPrompt: response.data[0]?.revised_prompt
    });

  } catch (error) {
    console.error('❌ Property visualization error:', error);
    res.status(500).json({
      error: 'Property visualization failed',
      message: (error as Error)?.message || 'Unknown error occurred'
    });
  }
});

export { router as imageGenerationRouter };