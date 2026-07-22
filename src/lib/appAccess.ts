// Client side of the app's access-key gate. The key is stored in sessionStorage
// (not localStorage) so it is asked for again every time the app is opened in a
// new browser session, per how this gate is meant to work.
const STORAGE_KEY = 'tasksync.accessKey';

export function getAccessKey(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function saveAccessKey(key: string) {
  try {
    sessionStorage.setItem(STORAGE_KEY, key);
  } catch {
    // sessionStorage may be unavailable (e.g. private mode); ignore.
  }
}

export function clearAccessKey() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

// Attach to every fetch() that hits an AI/scraping endpoint so those calls
// stay blocked server-side even if someone bypasses the lock screen UI.
export function accessKeyHeader(): Record<string, string> {
  const key = getAccessKey();
  return key ? { 'x-app-access-key': key } : {};
}

/** Verifies the code server-side and, if correct, stores it for this session. */
export async function verifyAccessKey(code: string): Promise<boolean> {
  const res = await fetch('/api/verify-access', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) return false;
  const data = await res.json().catch(() => null);
  if (!data?.ok) return false;
  saveAccessKey(code);
  return true;
}
