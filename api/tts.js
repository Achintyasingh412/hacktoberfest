export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, voiceId } = req.body || {};
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Valid text parameter is required' });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return res.status(200).json({
        fallback: true,
        message: 'ELEVENLABS_API_KEY environment variable is not set.',
      });
    }

    const targetVoice = voiceId || 'pNInz6obpgDQGcFmaJgB';
    const elevenLabsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${targetVoice}`;

    const response = await fetch(elevenLabsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
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
      return res.status(response.status || 500).json({
        fallback: true,
        error: 'ElevenLabs API request failed',
        details: errText,
      });
    }

    const audioBuffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.byteLength);
    res.status(200).send(Buffer.from(audioBuffer));
  } catch (err) {
    res.status(500).json({
      fallback: true,
      error: err.message || 'Internal server error',
    });
  }
}
