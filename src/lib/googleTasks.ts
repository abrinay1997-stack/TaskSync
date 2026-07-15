// Thin wrapper over the Google Tasks REST API (tasks.googleapis.com), used to
// mirror TaskSync tasks into the user's Google Tasks list alongside the
// Google Calendar event created for the same task.
import { getAccessToken } from './auth';

const TASKLIST_TITLE = 'TaskSync';
const CACHE_KEY = 'tasksync.googleTaskListId';

interface GoogleTaskList {
  id: string;
  title: string;
}

function getCachedListId(): string | null {
  try {
    return localStorage.getItem(CACHE_KEY);
  } catch {
    return null;
  }
}

function setCachedListId(id: string | null) {
  try {
    if (id) localStorage.setItem(CACHE_KEY, id);
    else localStorage.removeItem(CACHE_KEY);
  } catch {
    // localStorage may be unavailable; ignore.
  }
}

async function findOrCreateTaskList(token: string): Promise<string> {
  const cached = getCachedListId();
  if (cached) {
    // Confirm the cached list still exists before trusting it.
    const check = await fetch(`https://www.googleapis.com/tasks/v1/users/@me/lists/${cached}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (check.ok) return cached;
    setCachedListId(null);
  }

  const listRes = await fetch('https://www.googleapis.com/tasks/v1/users/@me/lists', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (listRes.ok) {
    const data = await listRes.json();
    const existing = (data.items as GoogleTaskList[] | undefined)?.find((l) => l.title === TASKLIST_TITLE);
    if (existing) {
      setCachedListId(existing.id);
      return existing.id;
    }
  }

  const createRes = await fetch('https://www.googleapis.com/tasks/v1/users/@me/lists', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: TASKLIST_TITLE }),
  });
  if (!createRes.ok) throw new Error('No se pudo crear la lista de Google Tasks.');
  const created = await createRes.json();
  setCachedListId(created.id);
  return created.id;
}

export interface GoogleTaskRef {
  taskListId: string;
  taskId: string;
}

/** Creates a Google Task mirroring a TaskSync task. Returns null on failure. */
export const createGoogleTask = async (
  title: string,
  notes: string | undefined,
  dueDate: string
): Promise<GoogleTaskRef | null> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated');

  try {
    const taskListId = await findOrCreateTaskList(token);
    const res = await fetch(`https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        notes: notes || undefined,
        // Google Tasks' `due` only carries the date part in its UI.
        due: new Date(dueDate).toISOString(),
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return { taskListId, taskId: data.id };
  } catch (error) {
    console.error('Error creating Google Task:', error);
    return null;
  }
};

export const removeGoogleTask = async (taskListId: string, taskId: string): Promise<boolean> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated');

  try {
    const res = await fetch(`https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch (error) {
    console.error('Error removing Google Task:', error);
    return false;
  }
};
