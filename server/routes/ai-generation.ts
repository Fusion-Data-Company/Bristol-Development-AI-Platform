import { Router } from 'express';
import OpenAI from 'openai';

const router = Router();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Image generation endpoint using DALL-E
router.post('/generate-image', async (req, res) => {
  try {
    const { prompt, size = "1024x1024", quality = "standard", style = "vivid" } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log('🎨 Generating image with DALL-E 3:', { prompt, size, quality, style });

    const response = await openai.images.generate({
      model: "dall-e-3", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      prompt,
      n: 1,
      size: size as "1024x1024" | "1024x1792" | "1792x1024",
      quality: quality as "standard" | "hd",
      style: style as "vivid" | "natural",
    });

    const imageUrl = response.data?.[0]?.url;
    const revisedPrompt = response.data?.[0]?.revised_prompt;

    console.log('✅ Image generated successfully:', imageUrl);

    res.json({
      success: true,
      imageUrl,
      revisedPrompt,
      originalPrompt: prompt,
      metadata: {
        model: "dall-e-3",
        size,
        quality,
        style,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Image generation error:', error);
    
    if (error instanceof Error) {
      res.status(500).json({ 
        error: 'Failed to generate image', 
        details: error.message 
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to generate image', 
        details: 'Unknown error occurred' 
      });
    }
  }
});

// GPT-4o text generation for enhanced prompts
router.post('/enhance-prompt', async (req, res) => {
  try {
    const { prompt, mode = "image" } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log('🧠 Enhancing prompt with GPT-4o:', { prompt, mode });

    const systemPrompts = {
      image: "You are an expert at creating detailed, vivid image generation prompts. Enhance the user's prompt to be more specific, artistic, and likely to produce a high-quality image. Include details about lighting, composition, style, and mood. Keep it under 400 characters.",
      video: "You are an expert at creating detailed video generation prompts. Enhance the user's prompt to include camera movements, timing, transitions, and visual effects. Make it cinematic and engaging. Keep it under 400 characters.",
      avatar: "You are an expert at creating detailed 3D avatar prompts. Enhance the user's prompt to include facial features, clothing, pose, background, and rendering style. Make it suitable for creating a realistic 3D character. Keep it under 400 characters."
    };

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: systemPrompts[mode as keyof typeof systemPrompts] || systemPrompts.image
        },
        {
          role: "user",
          content: `Enhance this prompt: ${prompt}`
        }
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    const enhancedPrompt = response.choices[0].message.content?.trim() || prompt;

    console.log('✅ Prompt enhanced successfully');

    res.json({
      success: true,
      originalPrompt: prompt,
      enhancedPrompt,
      mode
    });

  } catch (error) {
    console.error('❌ Prompt enhancement error:', error);
    
    if (error instanceof Error) {
      res.status(500).json({ 
        error: 'Failed to enhance prompt', 
        details: error.message 
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to enhance prompt', 
        details: 'Unknown error occurred' 
      });
    }
  }
});

// Get available models and capabilities
router.get('/models', async (req, res) => {
  try {
    res.json({
      success: true,
      models: {
        image: {
          "dall-e-3": {
            name: "DALL-E 3",
            description: "Most advanced image generation model",
            sizes: ["1024x1024", "1024x1792", "1792x1024"],
            qualities: ["standard", "hd"],
            styles: ["vivid", "natural"]
          }
        },
        text: {
          "gpt-4o": {
            name: "GPT-4o",
            description: "Most advanced multimodal model for prompt enhancement",
            capabilities: ["text generation", "prompt enhancement", "creative writing"]
          }
        }
      }
    });
  } catch (error) {
    console.error('❌ Models endpoint error:', error);
    res.status(500).json({ error: 'Failed to fetch models' });
  }
});

export default router;