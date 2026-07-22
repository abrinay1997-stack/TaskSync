import Groq from 'groq-sdk';
import type { ChatCompletionMessageParam } from 'groq-sdk/resources/chat/completions';
import { ADVISOR_MODEL, ADVISOR_MAX_TOKENS, buildAdvisorMessages } from '../../shared/advisor';
import { isAppAccessAuthorized } from '../../shared/appAccess';

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// Netlify Function (v2). The frontend calls /api/advisor, which is proxied here
// by the redirect in netlify.toml. GROQ_API_KEY is read from Netlify's
// server-side environment variables and never reaches the browser.
export default async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  if (!isAppAccessAuthorized(req.headers.get('x-app-access-key'), process.env.APP_ACCESS_KEY)) {
    return json({ error: 'Acceso no autorizado. Ingresa la clave de acceso de la aplicación.' }, 401);
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return json({ error: 'GROQ_API_KEY is not configured' }, 401);

  try {
    const { tasks, context } = await req.json();
    const groq = new Groq({ apiKey });

    const completion = await groq.chat.completions.create({
      messages: buildAdvisorMessages(tasks, context) as ChatCompletionMessageParam[],
      model: ADVISOR_MODEL,
      temperature: 0.7,
      max_tokens: ADVISOR_MAX_TOKENS,
    });

    return json({ message: completion.choices[0]?.message?.content || 'Sin respuesta.' });
  } catch (error: any) {
    console.error('AI Advisor error:', error);
    return json({ error: error?.message || 'Error al conectar con la IA.' }, 500);
  }
};
