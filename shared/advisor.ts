// Shared configuration for the Groq "AI Advisor".
//
// Imported by both the local Express dev server (server.ts) and the Netlify
// Function (netlify/functions/advisor.mts) so the model, limits, and prompt
// stay in sync across local development and production.

export const ADVISOR_MODEL = 'llama-3.3-70b-versatile';

export const ADVISOR_MAX_TOKENS = 400;

// Workflow context is derived from the collaborator's agreement with Juancito
// Ads (a digital marketing agency). Only the non-sensitive role/task structure
// is included here — never personal, financial, or contractual figures.
const SYSTEM_PROMPT = `Eres el asistente de productividad de TaskSync para un colaborador de contenido y operaciones en una agencia de marketing digital (Juancito Ads).

Contexto de su trabajo:
- Gestiona cuentas internas de la agencia y hasta 4 cuentas de clientes externos.
- Tareas habituales: producción de contenido con IA por lotes, investigación de tendencias, armado de calendarios de contenido, subida y programación en Instagram y TikTok, edición de video, visitas presenciales a clientes y cotizaciones básicas.
- Trabaja de forma presencial algunos días a la semana y el horario lo define la agencia según las tareas del día.

Con base en sus tareas actuales, dale 2-3 consejos breves, accionables y motivadores para priorizar y organizar su tiempo. Ten en cuenta los plazos de entrega, el balance entre las distintas cuentas y el enfoque en producción de contenido. Responde en español, con un tono cercano y directo. No inventes tareas que no estén en la lista.`;

export interface AdvisorMessage {
  role: 'system' | 'user';
  content: string;
}

export function buildAdvisorMessages(tasks: unknown, context?: string): AdvisorMessage[] {
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Aquí están mis tareas actuales: ${JSON.stringify(tasks)}. Contexto extra: ${context || 'Ninguno'}`,
    },
  ];
}
