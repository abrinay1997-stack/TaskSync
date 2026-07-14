// Shared logic for the AI caption/title/hashtag generator.
//
// Produces ready-to-paste copy for a social post (the actual publishing happens
// in Meta Business Suite / TikTok — TaskSync only generates the content).
// Imported by the Netlify Function (netlify/functions/generate-caption.mts)
// and the local Express dev server (server.ts).

export const CAPTION_MODEL = 'llama-3.3-70b-versatile';

export const CAPTION_MAX_TOKENS = 700;

export interface CaptionInput {
  topic: string;
  platform?: string;
  clientName?: string;
  niche?: string;
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

export function buildCaptionMessages(input: CaptionInput): CaptionMessage[] {
  const { topic, platform, clientName, niche, tone } = input;

  const system = `Eres el copywriter de redes sociales de una agencia de marketing digital. Escribes contenido en español para cuentas de clientes, listo para publicar.

Reglas:
- "title" es un gancho/título corto y llamativo (máximo 8 palabras), pensado para la primera línea o portada del post.
- "caption" es el texto del post: 2 a 4 frases, con gancho al inicio, valor en el medio y llamada a la acción al final. Adapta el estilo a la plataforma (Instagram/TikTok: cercano y directo con saltos de línea; YouTube: descriptivo; Facebook: conversacional). Puedes usar 1-3 emojis bien puestos.
- "hashtags" son 8 a 12 hashtags relevantes y específicos del nicho, en minúsculas, sin repetir, mezclando alcance alto y nicho. Sin el símbolo # duplicado.
- Responde ÚNICAMENTE con un objeto JSON válido (sin texto adicional ni markdown) con esta forma exacta:
{"title":"...","caption":"...","hashtags":["#uno","#dos"]}`;

  const user = `Tema del post: ${topic}
Plataforma: ${platform || 'Instagram'}
Cliente/cuenta: ${clientName || 'No especificado'}
Nicho: ${niche || 'No especificado'}
Tono deseado: ${tone || 'El que mejor funcione para el nicho'}`;

  return [
    { role: 'system', content: system },
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
