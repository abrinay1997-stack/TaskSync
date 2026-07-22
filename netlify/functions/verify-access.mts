const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// Netlify Function (v2). The frontend calls /api/verify-access, proxied here by
// the redirect in netlify.toml. Checks the entered code against the
// server-side APP_ACCESS_KEY; never exposes the real key to the browser.
export default async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const accessKey = process.env.APP_ACCESS_KEY;
  if (!accessKey) return json({ error: 'APP_ACCESS_KEY is not configured' }, 401);

  try {
    const { code } = await req.json();
    if (typeof code !== 'string' || code !== accessKey) {
      return json({ ok: false, error: 'Clave incorrecta.' }, 401);
    }
    return json({ ok: true });
  } catch {
    return json({ error: 'Solicitud inválida.' }, 400);
  }
};
