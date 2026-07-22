import Groq from 'groq-sdk';
import type { ChatCompletionMessageParam } from 'groq-sdk/resources/chat/completions';
import {
  SOCIAL_ANALYZER_MODEL,
  SOCIAL_ANALYZER_MAX_TOKENS,
  buildSocialSummaryMessages,
  parseSocialSummary,
  ScrapedProfile,
} from '../../shared/socialAnalyzer';
import { isAppAccessAuthorized } from '../../shared/appAccess';

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// Public Apify actor for Instagram profile scraping, referenced by its
// "username~actor-name" form (stable, human-readable). Override via
// APIFY_ACTOR_ID if a different/paid actor works better for your account.
const DEFAULT_ACTOR = 'apify~instagram-profile-scraper';

function extractUsername(url: string): string | undefined {
  try {
    const withProtocol = url.startsWith('http') ? url : `https://${url}`;
    const parsed = new URL(withProtocol);
    return parsed.pathname.split('/').filter(Boolean)[0] || undefined;
  } catch {
    return undefined;
  }
}

// Apify's various Instagram actors don't all use identical field names, so
// this reads defensively across the common shapes instead of assuming one.
function extractProfile(item: any, username: string | undefined): ScrapedProfile {
  const bio = item.biography ?? item.bio ?? item.description ?? '';
  const fullName = item.fullName ?? item.full_name ?? '';
  const followersCount = item.followersCount ?? item.followers ?? undefined;
  const rawPosts = item.latestPosts ?? item.posts ?? item.topPosts ?? [];
  const posts: string[] = Array.isArray(rawPosts)
    ? rawPosts
        .map((p: any) => (typeof p === 'string' ? p : p?.caption ?? p?.text ?? ''))
        .filter((c: string) => !!c)
        .slice(0, 12)
    : [];

  return { username: item.username ?? username, fullName, bio, followersCount, posts };
}

// Netlify Function (v2). The frontend calls /api/analyze-social, proxied here
// by the redirect in netlify.toml. Fetches real public profile data via Apify,
// then asks Groq to synthesize it into niche + description text.
export default async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  if (!isAppAccessAuthorized(req.headers.get('x-app-access-key'), process.env.APP_ACCESS_KEY)) {
    return json({ error: 'Acceso no autorizado. Ingresa la clave de acceso de la aplicación.' }, 401);
  }

  const apifyToken = process.env.APIFY_API_TOKEN;
  if (!apifyToken) return json({ error: 'APIFY_API_TOKEN is not configured' }, 401);
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return json({ error: 'GROQ_API_KEY is not configured' }, 401);

  try {
    const { instagramUrl } = await req.json();
    if (!instagramUrl || typeof instagramUrl !== 'string') {
      return json({ error: 'Falta el link de Instagram de la cuenta.' }, 400);
    }

    const username = extractUsername(instagramUrl);
    const actorId = process.env.APIFY_ACTOR_ID || DEFAULT_ACTOR;

    const apifyRes = await fetch(
      `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${encodeURIComponent(apifyToken)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Different Apify Instagram actors expect different input field
        // names (some want `usernames`, others `directUrls`); sending both
        // maximizes compatibility since actors ignore fields they don't use.
        body: JSON.stringify({
          usernames: username ? [username] : undefined,
          directUrls: [instagramUrl],
          resultsLimit: 12,
        }),
      }
    );

    if (!apifyRes.ok) {
      const text = await apifyRes.text().catch(() => '');
      console.error('Apify error', apifyRes.status, text.slice(0, 500));
      return json(
        {
          error: `No se pudo obtener datos de Instagram (Apify respondió ${apifyRes.status}). Verifica el link o intenta de nuevo.`,
          apifyDetail: text.slice(0, 500) || undefined,
        },
        502
      );
    }

    const items = await apifyRes.json();
    const first = Array.isArray(items) ? items[0] : null;
    if (!first) {
      return json(
        { error: 'No se encontraron datos públicos para ese perfil. Verifica que sea público y que el link sea correcto.' },
        404
      );
    }

    const profile = extractProfile(first, username);

    const groq = new Groq({ apiKey: groqKey });
    const completion = await groq.chat.completions.create({
      messages: buildSocialSummaryMessages(profile) as ChatCompletionMessageParam[],
      model: SOCIAL_ANALYZER_MODEL,
      temperature: 0.4,
      max_tokens: SOCIAL_ANALYZER_MAX_TOKENS,
    });

    const summary = parseSocialSummary(completion.choices[0]?.message?.content || '');
    if (!summary) {
      return json({ error: 'No se pudo sintetizar el perfil analizado. Intenta de nuevo.' }, 502);
    }

    return json({
      ...summary,
      postsAnalyzed: profile.posts.length,
    });
  } catch (error: any) {
    console.error('Social analyzer error:', error);
    return json({ error: error?.message || 'Error al analizar el perfil.' }, 500);
  }
};
