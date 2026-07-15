// Shared logic to turn raw, real data scraped from a public Instagram profile
// (via Apify) into a clean niche + business description that gets saved onto
// the account profile. Groq only ever sees text we already fetched — it does
// not browse anything itself.
//
// Imported by both the Netlify Function (netlify/functions/analyze-social.mts)
// and the local Express dev server (server.ts).

export const SOCIAL_ANALYZER_MODEL = 'llama-3.3-70b-versatile';

export const SOCIAL_ANALYZER_MAX_TOKENS = 500;

export interface ScrapedProfile {
  username?: string;
  fullName?: string;
  bio?: string;
  followersCount?: number;
  posts: string[]; // recent real caption texts
}

export interface SocialSummaryResult {
  niche: string;
  description: string;
}

interface AnalyzerMessage {
  role: 'system' | 'user';
  content: string;
}

const SYSTEM_PROMPT = `Eres un analista de marca senior especializado en redes sociales y posicionamiento de negocios. Te entregan datos REALES extraídos de un perfil público de Instagram (biografía y publicaciones recientes) y debes sintetizarlos en dos campos precisos para el perfil de un cliente de agencia:

- "niche": el nicho/industria concreto del negocio, en 2 a 6 palabras (ej. "pizzería artesanal con delivery").
- "description": 3 a 5 frases describiendo qué vende u ofrece, su público objetivo aparente, el tono/estilo de marca que se nota en sus publicaciones, y cualquier diferenciador real mencionado (ubicación, especialidad, promociones recurrentes).

Reglas estrictas:
- Basa todo ÚNICAMENTE en el texto proporcionado. Si la bio o las publicaciones no dan suficiente información para algún punto, sé breve y honesto en vez de inventar o rellenar con generalidades.
- NO agregues datos, cifras o afirmaciones que no estén respaldados por el texto entregado.
- Responde ÚNICAMENTE con un objeto JSON válido (sin texto adicional ni markdown) con esta forma exacta:
{"niche":"...","description":"..."}`;

export function buildSocialSummaryMessages(profile: ScrapedProfile): AnalyzerMessage[] {
  const user = `Usuario: @${profile.username || 'desconocido'}
Nombre visible: ${profile.fullName || 'No disponible'}
Biografía: ${profile.bio || 'No disponible'}
Seguidores: ${profile.followersCount ?? 'No disponible'}
Publicaciones recientes (texto real, una por línea):
${profile.posts.length ? profile.posts.map((p, i) => `${i + 1}. ${p}`).join('\n') : 'No disponibles'}

Sintetiza el nicho y la descripción del negocio a partir de estos datos reales.`;

  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: user },
  ];
}

/** Safely parse the model's JSON output into a validated SocialSummaryResult. */
export function parseSocialSummary(content: string): SocialSummaryResult | null {
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
  if (typeof p.description !== 'string' || !p.description.trim()) return null;

  return {
    niche: typeof p.niche === 'string' ? p.niche.trim() : '',
    description: p.description.trim(),
  };
}
