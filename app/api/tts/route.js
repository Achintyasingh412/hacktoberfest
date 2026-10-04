export async function POST(req) {
  try {
    const body = await req.json();
    const { text, voiceId } = body || {};

    if (!text || typeof text !== 'string') {
      return new Response(JSON.stringify({ error: 'Valid text parameter is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          fallback: true,
          message: 'ELEVENLABS_API_KEY environment variable is missing.',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
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
      return new Response(
        JSON.stringify({
          fallback: true,
          error: 'ElevenLabs API request failed',
          details: errText,
        }),
        {
          status: response.status || 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const audioBuffer = await response.arrayBuffer();

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        fallback: true,
        error: err.message || 'Internal server error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
