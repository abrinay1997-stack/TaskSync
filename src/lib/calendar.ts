import { Task } from '../types';
import { getAccessToken } from './auth';
import { db } from './db';

export const syncTaskToCalendar = async (task: Task): Promise<string | null> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated');

  const event = {
    summary: task.title,
    description: task.description || '',
    start: {
      dateTime: new Date(task.dueDate).toISOString(),
    },
    end: {
      // Default to 1 hour event
      dateTime: new Date(new Date(task.dueDate).getTime() + 60 * 60 * 1000).toISOString(),
    },
  };

  try {
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      throw new Error('Failed to create calendar event');
    }

    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error('Error syncing to calendar:', error);
    return null;
  }
};

export interface SyncResult {
  synced: number;
  failed: number;
  alreadySynced: number;
}

/**
 * Syncs on demand every pending task that hasn't been pushed to Google Calendar
 * yet, and records the created event id back on each task.
 */
export const syncPendingTasksToCalendar = async (tasks: Task[]): Promise<SyncResult> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Conecta tu cuenta de Google antes de sincronizar.');

  const result: SyncResult = { synced: 0, failed: 0, alreadySynced: 0 };

  for (const task of tasks) {
    if (task.completed) continue;
    if (task.syncedToCalendar || task.calendarEventId) {
      result.alreadySynced++;
      continue;
    }
    try {
      const eventId = await syncTaskToCalendar(task);
      if (eventId) {
        await db.tasks.update(task.id, { syncedToCalendar: true, calendarEventId: eventId });
        result.synced++;
      } else {
        result.failed++;
      }
    } catch {
      result.failed++;
    }
  }

  return result;
};

export const removeTaskFromCalendar = async (eventId: string) => {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated');

  try {
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.ok;
  } catch (error) {
    console.error('Error removing from calendar:', error);
    return false;
  }
}
