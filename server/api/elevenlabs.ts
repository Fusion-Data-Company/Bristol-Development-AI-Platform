import express from 'express';
import multer from 'multer';
import { z } from 'zod';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit
  },
});

// Validation schemas
const textToSpeechSchema = z.object({
  text: z.string().min(1).max(5000),
  voice_id: z.string().min(1),
  stability: z.number().min(0).max(1).optional().default(0.5),
  clarity_boost: z.number().min(0).max(1).optional().default(0.75),
  style: z.number().min(0).max(1).optional().default(0),
  use_speaker_boost: z.boolean().optional().default(true),
});

// Get available voices
router.get('/voices', async (req, res) => {
  try {
    const ELEVEN_LABS_API_KEY = process.env.ELEVEN_LABS_API_KEY || process.env.ELEVENLABS_API_KEY;
    
    if (!ELEVEN_LABS_API_KEY) {
      // Return default voices if no API key is configured
      return res.json({
        voices: [
          { voice_id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', category: 'premade' },
          { voice_id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', category: 'premade' },
          { voice_id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', category: 'premade' },
          { voice_id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', category: 'premade' },
          { voice_id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli', category: 'premade' },
          { voice_id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', category: 'premade' },
        ]
      });
    }

    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': ELEVEN_LABS_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching voices:', error);
    res.status(500).json({ 
      error: 'Failed to fetch voices',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Text to speech conversion
router.post('/text-to-speech', async (req, res) => {
  try {
    const ELEVEN_LABS_API_KEY = process.env.ELEVEN_LABS_API_KEY || process.env.ELEVENLABS_API_KEY;
    
    if (!ELEVEN_LABS_API_KEY) {
      return res.status(400).json({ 
        error: 'ElevenLabs API key not configured',
        message: 'Please provide your ElevenLabs API key to use voice synthesis features'
      });
    }

    // Validate request body
    const validatedData = textToSpeechSchema.parse(req.body);

    const elevenLabsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${validatedData.voice_id}`;
    
    const response = await fetch(elevenLabsUrl, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVEN_LABS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text: validatedData.text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: validatedData.stability,
          similarity_boost: validatedData.clarity_boost,
          style: validatedData.style,
          use_speaker_boost: validatedData.use_speaker_boost,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      
      let errorMessage = 'Failed to generate speech';
      if (response.status === 401) {
        errorMessage = 'Invalid API key';
      } else if (response.status === 422) {
        errorMessage = 'Invalid request parameters';
      } else if (response.status === 429) {
        errorMessage = 'Rate limit exceeded';
      }
      
      return res.status(response.status).json({ 
        error: errorMessage,
        message: errorText || `ElevenLabs API error: ${response.status}`
      });
    }

    // Stream the audio response
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', 'inline; filename="speech.mp3"');
    
    const audioBuffer = await response.arrayBuffer();
    res.send(Buffer.from(audioBuffer));
    
  } catch (error) {
    console.error('Error in text-to-speech:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error',
        message: error.errors[0].message 
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Speech to text conversion (using OpenAI Whisper via ElevenLabs or fallback)
router.post('/speech-to-text', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const ELEVEN_LABS_API_KEY = process.env.ELEVEN_LABS_API_KEY || process.env.ELEVENLABS_API_KEY;
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    
    // Try ElevenLabs first, then fallback to OpenAI Whisper
    if (ELEVEN_LABS_API_KEY) {
      try {
        const formData = new FormData();
        formData.append('audio', new Blob([req.file.buffer], { type: req.file.mimetype }));
        formData.append('model', 'whisper-1');

        const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
          method: 'POST',
          headers: {
            'xi-api-key': ELEVEN_LABS_API_KEY,
          },
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          return res.json({ text: result.text || '' });
        }
      } catch (elevenLabsError) {
        console.warn('ElevenLabs speech-to-text failed, trying OpenAI:', elevenLabsError);
      }
    }

    // Fallback to OpenAI Whisper
    if (OPENAI_API_KEY) {
      try {
        const formData = new FormData();
        formData.append('file', new Blob([req.file.buffer], { type: req.file.mimetype }), 'audio.wav');
        formData.append('model', 'whisper-1');

        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
          },
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          return res.json({ text: result.text || '' });
        }
      } catch (openAiError) {
        console.error('OpenAI Whisper failed:', openAiError);
      }
    }

    return res.status(400).json({ 
      error: 'Speech-to-text service unavailable',
      message: 'Please configure ElevenLabs API key or OpenAI API key for speech recognition'
    });

  } catch (error) {
    console.error('Error in speech-to-text:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Voice cloning (create a new voice from samples)
router.post('/clone-voice', upload.array('samples', 10), async (req, res) => {
  try {
    const ELEVEN_LABS_API_KEY = process.env.ELEVEN_LABS_API_KEY || process.env.ELEVENLABS_API_KEY;
    
    if (!ELEVEN_LABS_API_KEY) {
      return res.status(400).json({ 
        error: 'ElevenLabs API key not configured',
        message: 'Voice cloning requires an ElevenLabs API key'
      });
    }

    const { name, description } = req.body;
    const files = req.files as Express.Multer.File[];
    
    if (!name || !files || files.length === 0) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Please provide a voice name and at least one audio sample'
      });
    }

    const formData = new FormData();
    formData.append('name', name);
    if (description) {
      formData.append('description', description);
    }

    // Add audio files
    files.forEach((file, index) => {
      formData.append('files', new Blob([file.buffer], { type: file.mimetype }), `sample_${index}.wav`);
    });

    const response = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVEN_LABS_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Voice cloning error:', response.status, errorText);
      
      return res.status(response.status).json({ 
        error: 'Voice cloning failed',
        message: errorText || `API error: ${response.status}`
      });
    }

    const result = await response.json();
    res.json(result);

  } catch (error) {
    console.error('Error in voice cloning:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get voice details
router.get('/voices/:voiceId', async (req, res) => {
  try {
    const ELEVEN_LABS_API_KEY = process.env.ELEVEN_LABS_API_KEY || process.env.ELEVENLABS_API_KEY;
    
    if (!ELEVEN_LABS_API_KEY) {
      return res.status(400).json({ 
        error: 'ElevenLabs API key not configured'
      });
    }

    const { voiceId } = req.params;

    const response = await fetch(`https://api.elevenlabs.io/v1/voices/${voiceId}`, {
      headers: {
        'xi-api-key': ELEVEN_LABS_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching voice details:', error);
    res.status(500).json({ 
      error: 'Failed to fetch voice details',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete a voice
router.delete('/voices/:voiceId', async (req, res) => {
  try {
    const ELEVEN_LABS_API_KEY = process.env.ELEVEN_LABS_API_KEY || process.env.ELEVENLABS_API_KEY;
    
    if (!ELEVEN_LABS_API_KEY) {
      return res.status(400).json({ 
        error: 'ElevenLabs API key not configured'
      });
    }

    const { voiceId } = req.params;

    const response = await fetch(`https://api.elevenlabs.io/v1/voices/${voiceId}`, {
      method: 'DELETE',
      headers: {
        'xi-api-key': ELEVEN_LABS_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    res.json({ success: true, message: 'Voice deleted successfully' });
  } catch (error) {
    console.error('Error deleting voice:', error);
    res.status(500).json({ 
      error: 'Failed to delete voice',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get user subscription info
router.get('/subscription', async (req, res) => {
  try {
    const ELEVEN_LABS_API_KEY = process.env.ELEVEN_LABS_API_KEY || process.env.ELEVENLABS_API_KEY;
    
    if (!ELEVEN_LABS_API_KEY) {
      return res.status(400).json({ 
        error: 'ElevenLabs API key not configured'
      });
    }

    const response = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
      headers: {
        'xi-api-key': ELEVEN_LABS_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching subscription info:', error);
    res.status(500).json({ 
      error: 'Failed to fetch subscription info',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;