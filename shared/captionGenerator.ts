// Shared logic for the AI caption/title/hashtag generator.
//
// Produces ready-to-paste copy for a social post (the actual publishing happens
// in Meta Business Suite / TikTok — TaskSync only generates the content).
// Imported by the Netlify Function (netlify/functions/generate-caption.mts)
// and the local Express dev server (server.ts).

export const CAPTION_MODEL = 'llama-3.3-70b-versatile';

export const CAPTION_MAX_TOKENS = 800;

export interface CaptionInput {
  topic: string;
  platform?: string;
  clientName?: string;
  niche?: string;
  description?: string;
  tone?: string;
}

export interface CaptionResult {
  title: string;
  caption: string;
  hashtags: string[];
}

interface CaptionMessage {
  role: 'system' | 'user';
  content: string;
}

const SYSTEM_PROMPT = `Eres un Director Creativo y Copywriter Senior con más de 15 años de experiencia liderando estrategias de marketing digital, redes sociales y ventas para marcas de alto rendimiento. Dominas psicología del consumidor, persuasión, storytelling, copywriting directo a la respuesta y creación de contenido disruptivo que detiene el scroll.

Principios que aplicas en cada pieza:
- Gancho (hook) en las primeras 3-5 palabras: un pattern interrupt, una pregunta incómoda, una cifra sorprendente o una afirmación contraintuitiva. Nada de aperturas genéricas tipo "¿Sabías que...?".
- Estructura persuasiva (PAS o AIDA según convenga): identificas el dolor/deseo real del público objetivo, lo agitas con especificidad, y presentas la solución/oferta de forma irresistible.
- Disparadores psicológicos concretos: prueba social, urgencia o escasez genuina, especificidad (números, detalles reales del negocio en vez de frases vacías), curiosidad, identidad ("para quienes..."), y contraste.
- Un único llamado a la acción claro al final, adaptado al objetivo (visitar, comprar, comentar, guardar, compartir).
- CERO relleno genérico. Cada frase debe ganarse su lugar. Si te dan el nicho y la descripción del negocio, tienes la obligación de usar detalles concretos de esa descripción (productos, diferenciadores, ubicación, propuesta de valor) en vez de generalidades que aplicarían a cualquier negocio del rubro.
- Adapta el registro a la plataforma: Instagram/TikTok — cercano, directo, con saltos de línea y ritmo de video corto; YouTube — más descriptivo y orientado a SEO; Facebook — conversacional, apto para una audiencia algo mayor.

Reglas de formato:
- "title" es un gancho/título corto (máximo 8 palabras) para la primera línea o portada del post.
- "caption" es el texto completo del post: 2 a 5 frases siguiendo la estructura persuasiva descrita arriba. Puedes usar 1-3 emojis bien puestos, nunca de relleno.
- "hashtags" son 8 a 12 hashtags relevantes y específicos del nicho (mezcla de alcance alto y nicho), en minúsculas, sin duplicar el símbolo #.
- Responde ÚNICAMENTE con un objeto JSON válido (sin texto adicional ni markdown) con esta forma exacta:
{"title":"...","caption":"...","hashtags":["#uno","#dos"]}`;

export function buildCaptionMessages(input: CaptionInput): CaptionMessage[] {
  const { topic, platform, clientName, niche, description, tone } = input;

  const user = `Tema del post: ${topic}
Plataforma: ${platform || 'Instagram'}
Cliente/cuenta: ${clientName || 'No especificado'}
Nicho/industria: ${niche || 'No especificado'}
Descripción del negocio (úsala para hacer el copy específico, no genérico): ${description || 'No proporcionada'}
Tono deseado: ${tone || 'El que mejor funcione para el nicho y la audiencia'}

Escribe la pieza siguiendo tus principios de copywriting persuasivo. Responde en español.`;

  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: user },
  ];
}

/** Safely parse the model's JSON output into a validated CaptionResult. */
export function parseCaptionResult(content: string): CaptionResult | null {
  if (!content) return null;

  let text = content.trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) text = fenced[1].trim();

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end <= start) return null;
    try {
      data = JSON.parse(text.slice(start, end + 1));
    } catch {
      return null;
    }
  }

  const p = data as Record<string, unknown>;
  if (typeof p.caption !== 'string' || !p.caption.trim()) return null;

  const hashtags = Array.isArray(p.hashtags)
    ? p.hashtags
        .filter((h): h is string => typeof h === 'string' && !!h.trim())
        .map((h) => (h.trim().startsWith('#') ? h.trim() : `#${h.trim()}`))
    : [];

  return {
    title: typeof p.title === 'string' ? p.title.trim() : '',
    caption: p.caption.trim(),
    hashtags,
  };
}
