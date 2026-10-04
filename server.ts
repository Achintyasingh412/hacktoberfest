import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ElevenLabs TTS API Endpoint
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voiceId } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Valid text parameter is required' });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY || process.env.VITE_ELEVENLABS_API_KEY;
    if (!apiKey) {
      // Signal client to seamlessly use Web Speech API fallback
      return res.json({ fallback: true, message: 'No ElevenLabs API key found. Using Web Speech API fallback.' });
    }

    // Default voice: 'pNInz6obpgDQGcFmaJgB' (Adam - deep authoritative warden tone)
    const targetVoice = voiceId || 'pNInz6obpgDQGcFmaJgB';
    const elevenLabsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${targetVoice}`;

    const response = await fetch(elevenLabsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: 0.65,
          similarity_boost: 0.8,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn('ElevenLabs API request failed, delegating to client Web Speech:', errText);
      return res.json({ fallback: true, message: 'ElevenLabs API error' });
    }

    const audioBuffer = await response.arrayBuffer();
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.byteLength,
    });
    res.send(Buffer.from(audioBuffer));
  } catch (err: any) {
    console.error('Server TTS Endpoint Error:', err);
    res.json({ fallback: true, message: err.message });
  }
});

// Vite Middleware Integration in Dev / Static Serving in Prod
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
} else {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true, port: Number(PORT), host: '0.0.0.0' },
    appType: 'custom',
  });
  app.use(vite.middlewares);
  app.use('*', async (req, res, next) => {
    try {
      const fs = await import('fs');
      let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
      template = await vite.transformIndexHtml(req.originalUrl, template);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Hostel Nexus Full-Stack Server active on port ${PORT}`);
});
