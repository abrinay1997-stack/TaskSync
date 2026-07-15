import Groq from 'groq-sdk';
import type { ChatCompletionMessageParam } from 'groq-sdk/resources/chat/completions';
import {
  CAPTION_MODEL,
  CAPTION_MAX_TOKENS,
  buildCaptionMessages,
  parseCaptionResult,
} from '../../shared/captionGenerator';

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// Netlify Function (v2). The frontend calls /api/generate-caption, proxied here
// by the redirect in netlify.toml. Uses the server-side GROQ_API_KEY.
export default async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return json({ error: 'GROQ_API_KEY is not configured' }, 401);

  try {
    const { topic, platform, clientName, niche, description, tone } = await req.json();
    if (!topic || typeof topic !== 'string') {
      return json({ error: 'Falta el tema del post.' }, 400);
    }

    const groq = new Groq({ apiKey });
    const completion = await groq.chat.completions.create({
      messages: buildCaptionMessages({ topic, platform, clientName, niche, description, tone }) as ChatCompletionMessageParam[],
      model: CAPTION_MODEL,
      temperature: 0.8,
      max_tokens: CAPTION_MAX_TOKENS,
    });

    const result = parseCaptionResult(completion.choices[0]?.message?.content || '');
    if (!result) {
      return json({ error: 'La IA no generó un caption válido. Intenta de nuevo.' }, 502);
    }

    return json(result);
  } catch (error: any) {
    console.error('Caption generator error:', error);
    return json({ error: error?.message || 'Error al generar el caption.' }, 500);
  }
};
