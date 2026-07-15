import Groq from 'groq-sdk';
import type { ChatCompletionMessageParam } from 'groq-sdk/resources/chat/completions';
import {
  TASK_PLANNER_MODEL,
  TASK_PLANNER_MAX_TOKENS,
  buildPlannerMessages,
  parsePlannedTasks,
} from '../../shared/taskPlanner';

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// Netlify Function (v2). The frontend calls /api/generate-tasks, proxied here by
// the redirect in netlify.toml. Uses the server-side GROQ_API_KEY.
export default async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return json({ error: 'GROQ_API_KEY is not configured' }, 401);

  try {
    const { clientName, niche, description, notes, instagramUrl } = await req.json();
    const groq = new Groq({ apiKey });

    const completion = await groq.chat.completions.create({
      messages: buildPlannerMessages({ clientName, niche, description, notes, instagramUrl }) as ChatCompletionMessageParam[],
      model: TASK_PLANNER_MODEL,
      temperature: 0.6,
      max_tokens: TASK_PLANNER_MAX_TOKENS,
    });

    const tasks = parsePlannedTasks(completion.choices[0]?.message?.content || '');
    if (tasks.length === 0) {
      return json({ error: 'La IA no generó tareas válidas. Intenta de nuevo.' }, 502);
    }

    return json({ tasks });
  } catch (error: any) {
    console.error('Task planner error:', error);
    return json({ error: error?.message || 'Error al generar el plan.' }, 500);
  }
};
