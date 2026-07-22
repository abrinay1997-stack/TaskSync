// Shared guard for the APP_ACCESS_KEY gate protecting every AI/scraping
// endpoint (advisor, generate-tasks, generate-caption, analyze-social) from
// being called by anyone who merely has the app's URL. Used by both the
// Netlify Functions (Request/Headers.get) and the local Express server
// (req.headers, which can be string | string[] | undefined).
export function isAppAccessAuthorized(headerValue: unknown, expected: string | undefined): boolean {
  const value = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  return !!expected && typeof value === 'string' && value === expected;
}
