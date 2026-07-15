import { User } from '../types';

// Minimal ambient typing for the Google Identity Services (GIS) client that is
// loaded from https://accounts.google.com/gsi/client (see index.html).
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: TokenResponse) => void;
          }) => TokenClient;
          revoke: (token: string, done?: () => void) => void;
        };
      };
    };
  }
}

interface TokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

interface TokenClient {
  callback: (response: TokenResponse) => void;
  requestAccessToken: (overrides?: { prompt?: string }) => void;
}

// The OAuth Web Client ID. Configure it via VITE_GOOGLE_CLIENT_ID; the fallback
// is the client ID already present in firebase-applet-config.json.
const CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '529117690569-hot49dniftkk2prs6jp26pjk82rjvjqd.apps.googleusercontent.com';

// calendar.events lets us create/delete calendar events; tasks lets us mirror
// them into Google Tasks; the userinfo scopes give us the signed-in user's
// name/email/photo.
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/tasks',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
].join(' ');

const STORAGE_KEY = 'tasksync.auth';

interface StoredSession {
  accessToken: string;
  expiresAt: number; // epoch milliseconds
  user: User;
  scope: string;
}

let session: StoredSession | null = loadSession();
let tokenClient: TokenClient | null = null;
let onSuccessCb: ((user: User, token: string) => void) | null = null;
let onFailureCb: (() => void) | null = null;

function loadSession(): StoredSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    // Treat tokens that expire within the next 30s as already expired.
    if (parsed.expiresAt <= Date.now() + 30_000) return null;
    // If the app now requests more scopes than this stored token was granted
    // (e.g. Google Tasks was added later), force a fresh consent instead of
    // silently missing permissions.
    if (parsed.scope !== SCOPES) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveSession(next: StoredSession | null) {
  session = next;
  try {
    if (next) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // sessionStorage may be unavailable (e.g. private mode); ignore.
  }
}

// The GIS script loads asynchronously, so wait until window.google is ready.
function waitForGoogle(timeoutMs = 10_000): Promise<NonNullable<Window['google']>> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      if (window.google?.accounts?.oauth2) return resolve(window.google);
      if (Date.now() - start > timeoutMs) {
        return reject(new Error('Google Identity Services no se cargó a tiempo.'));
      }
      setTimeout(check, 100);
    };
    check();
  });
}

async function getTokenClient(): Promise<TokenClient> {
  if (tokenClient) return tokenClient;
  const google = await waitForGoogle();
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: () => {}, // replaced per sign-in request
  });
  return tokenClient;
}

async function fetchUserInfo(accessToken: string): Promise<User> {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('No se pudo obtener la información del usuario de Google.');
  const info = await res.json();
  return {
    uid: info.sub,
    displayName: info.name || info.email,
    email: info.email,
    photoURL: info.picture || '',
  };
}

/**
 * Registers auth callbacks and restores an existing (non-expired) session, e.g.
 * after a page reload. Does not open a popup — sign-in is user-initiated.
 */
export const initAuth = (
  onAuthSuccess: (user: User, token: string) => void,
  onAuthFailure: () => void
) => {
  onSuccessCb = onAuthSuccess;
  onFailureCb = onAuthFailure;

  // Warm up the token client so the popup opens promptly on the first click.
  getTokenClient().catch((err) => console.error('GIS init error:', err));

  if (session) {
    onAuthSuccess(session.user, session.accessToken);
  } else {
    onAuthFailure();
  }

  return () => {
    onSuccessCb = null;
    onFailureCb = null;
  };
};

/** Opens the Google consent popup and requests an access token. */
export const googleSignIn = async () => {
  try {
    const client = await getTokenClient();
    client.callback = async (response: TokenResponse) => {
      if (response.error || !response.access_token) {
        console.error('Google sign-in error:', response.error_description || response.error);
        onFailureCb?.();
        return;
      }
      try {
        const accessToken = response.access_token;
        const expiresAt = Date.now() + (Number(response.expires_in) || 3600) * 1000;
        const user = await fetchUserInfo(accessToken);
        saveSession({ accessToken, expiresAt, user, scope: SCOPES });
        onSuccessCb?.(user, accessToken);
      } catch (err) {
        console.error('Post sign-in error:', err);
        onFailureCb?.();
      }
    };
    // Prompt for consent on a fresh login; allow silent re-grant if we already
    // had a session this browser session.
    client.requestAccessToken({ prompt: session ? '' : 'consent' });
  } catch (err) {
    console.error('Google sign-in failed:', err);
    onFailureCb?.();
  }
};

/** Returns the current access token if it is still valid, otherwise null. */
export const getAccessToken = async (): Promise<string | null> => {
  if (session && session.expiresAt > Date.now()) return session.accessToken;
  return null;
};

export const logout = async () => {
  const token = session?.accessToken;
  saveSession(null);
  try {
    if (token && window.google?.accounts?.oauth2) {
      window.google.accounts.oauth2.revoke(token);
    }
  } catch {
    // Revocation is best-effort.
  }
  window.location.reload();
};
