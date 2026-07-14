// Shared logic for the AI "Content Plan" generator.
//
// Given a client's name/niche/notes (the LLM cannot browse the Instagram link,
// so the URL is passed only as a reference label), Groq produces a set of
// actionable tasks that follow the agency's 5-stage content workflow.
//
// Imported by both the Netlify Function (netlify/functions/generate-tasks.mts)
// and the local Express dev server (server.ts).

export const TASK_PLANNER_MODEL = 'llama-3.3-70b-versatile';

export const TASK_PLANNER_MAX_TOKENS = 2048;

// The agency's fixed content-production pipeline.
export const PLANNER_STAGES = [
  'Cronograma de contenido para redes',
  'Crear contenido por lotes',
  'Programar la publicación',
  'Crear campañas de anuncios',
  'Informe de producción completo para el cliente',
];

export interface PlannerInput {
  clientName: string;
  niche?: string;
  notes?: string;
  instagramUrl?: string;
}

export interface PlannedTask {
  stage: number; // 1..5
  stageName: string;
  title: string;
  description: string;
  priority: 'baja' | 'media' | 'alta';
  dueOffsetDays: number; // days from the chosen start date
}

interface PlannerMessage {
  role: 'system' | 'user';
  content: string;
}

export function buildPlannerMessages(input: PlannerInput): PlannerMessage[] {
  const { clientName, niche, notes, instagramUrl } = input;

  const system = `Eres el planificador de producción de contenido de TaskSync para una agencia de marketing digital (Juancito Ads). Generas planes de trabajo accionables para gestionar la cuenta de un cliente en redes sociales.

El flujo de trabajo SIEMPRE sigue estas 5 etapas, en este orden:
${PLANNER_STAGES.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Reglas:
- Genera entre 2 y 3 tareas por cada etapa (10 a 15 tareas en total), ordenadas por etapa.
- Cada tarea debe ser concreta y accionable (empieza con un verbo) y adaptada al nicho del cliente.
- "priority" debe ser exactamente "alta", "media" o "baja".
- "dueOffsetDays" es un entero: días desde la fecha de inicio. Las etapas posteriores llevan offsets mayores; distribuye de forma realista a lo largo de ~2 a 4 semanas.
- Escribe en español.
- Responde ÚNICAMENTE con un objeto JSON válido (sin texto adicional ni markdown) con esta forma exacta:
{"tasks":[{"stage":1,"stageName":"Cronograma de contenido para redes","title":"...","description":"...","priority":"alta","dueOffsetDays":0}]}`;

  const user = `Cliente: ${clientName || 'Cliente sin nombre'}
Nicho/industria: ${niche || 'No especificado'}
Notas: ${notes || 'Ninguna'}
Instagram/redes (solo referencia, NO intentes analizarlo): ${instagramUrl || 'No especificado'}

Genera el plan de contenido siguiendo las 5 etapas.`;

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}

/** Safely parse the model's JSON output into validated PlannedTask objects. */
export function parsePlannedTasks(content: string): PlannedTask[] {
  if (!content) return [];

  let text = content.trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) text = fenced[1].trim();

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end <= start) return [];
    try {
      data = JSON.parse(text.slice(start, end + 1));
    } catch {
      return [];
    }
  }

  const rawList = Array.isArray(data)
    ? data
    : (data as { tasks?: unknown }).tasks;
  if (!Array.isArray(rawList)) return [];

  const clampStage = (n: number) => Math.min(5, Math.max(1, n));

  return rawList
    .map((raw): PlannedTask | null => {
      const p = raw as Record<string, unknown>;
      if (!p || typeof p.title !== 'string' || !p.title.trim()) return null;
      const stage = clampStage(Math.round(Number(p.stage)) || 1);
      const priority =
        p.priority === 'alta' || p.priority === 'media' || p.priority === 'baja'
          ? p.priority
          : 'media';
      const offset = Number(p.dueOffsetDays);
      return {
        stage,
        stageName:
          typeof p.stageName === 'string' && p.stageName.trim()
            ? p.stageName.trim()
            : PLANNER_STAGES[stage - 1],
        title: p.title.trim(),
        description: typeof p.description === 'string' ? p.description.trim() : '',
        priority,
        dueOffsetDays: Number.isFinite(offset) ? Math.max(0, Math.round(offset)) : (stage - 1) * 3,
      };
    })
    .filter((t): t is PlannedTask => t !== null);
}
