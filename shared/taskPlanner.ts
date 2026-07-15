// Shared logic for the AI "Content Plan" generator.
//
// Given a client's profile (niche/description/social links), the LLM cannot
// browse the links themselves, so they're passed only as reference labels.
// Groq produces a set of actionable tasks that follow the agency's 5-stage
// content workflow.
//
// Imported by both the Netlify Function (netlify/functions/generate-tasks.mts)
// and the local Express dev server (server.ts).

export const TASK_PLANNER_MODEL = 'llama-3.3-70b-versatile';

// Kept modest so the Groq call comfortably finishes within Netlify's ~10s
// synchronous function timeout.
export const TASK_PLANNER_MAX_TOKENS = 1400;

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
  description?: string;
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

const SYSTEM_PROMPT = `Eres un Estratega Senior de Marketing Digital y Crecimiento en Redes Sociales, con más de 15 años dirigiendo cuentas de agencia. Dominas copywriting persuasivo, psicología del consumidor, ventas, atracción de clientes y creación de contenido disruptivo que se diferencia de la competencia. Planificas el trabajo mensual de producción de contenido de una agencia (Juancito Ads) para sus cuentas de clientes.

El flujo de trabajo SIEMPRE sigue estas 5 etapas, en este orden:
${PLANNER_STAGES.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Reglas:
- Genera exactamente 2 tareas por cada etapa (10 tareas en total), ordenadas por etapa.
- Cada tarea debe ser concreta, accionable (empieza con un verbo) y ESPECÍFICA al negocio: usa detalles reales del nicho y la descripción proporcionada (productos, propuesta de valor, público objetivo, temporada/ocasión, diferenciadores) en vez de tareas genéricas que servirían para cualquier cuenta. Por ejemplo, en vez de "Crear contenido de valor", escribe algo como "Grabar reel mostrando [producto/servicio concreto del negocio] resolviendo [dolor específico del cliente ideal]".
- Aplica principios de persuasión y psicología del consumidor al definir los ángulos de contenido: prueba social, urgencia/escasez genuina, curiosidad, identidad de marca, contraste. La etapa de "Crear campañas de anuncios" debe proponer ángulos de venta concretos (oferta, dolor que resuelve, gancho), no solo "lanzar anuncio".
- "priority" debe ser exactamente "alta", "media" o "baja".
- "dueOffsetDays" es un entero: días desde la fecha de inicio. Las etapas posteriores llevan offsets mayores; distribuye de forma realista a lo largo de ~2 a 4 semanas.
- Escribe en español.
- Responde ÚNICAMENTE con un objeto JSON válido (sin texto adicional ni markdown) con esta forma exacta:
{"tasks":[{"stage":1,"stageName":"Cronograma de contenido para redes","title":"...","description":"...","priority":"alta","dueOffsetDays":0}]}`;

export function buildPlannerMessages(input: PlannerInput): PlannerMessage[] {
  const { clientName, niche, description, notes, instagramUrl } = input;

  const user = `Cliente: ${clientName || 'Cliente sin nombre'}
Nicho/industria: ${niche || 'No especificado'}
Descripción del negocio (úsala para que cada tarea sea específica, no genérica): ${description || 'No proporcionada'}
Notas adicionales de esta campaña: ${notes || 'Ninguna'}
Instagram/redes (solo referencia, NO intentes analizarlo): ${instagramUrl || 'No especificado'}

Genera el plan de contenido siguiendo las 5 etapas, aplicando tu experiencia en marketing, copywriting y persuasión.`;

  return [
    { role: 'system', content: SYSTEM_PROMPT },
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
