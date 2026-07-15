import { Task } from '../types';
import { getAccessToken } from './auth';
import { db } from './db';
import { createGoogleTask, removeGoogleTask } from './googleTasks';

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
  /** Tasks that made it to Calendar but could not reach Google Tasks (usually
   * because the account hasn't granted the Tasks permission yet). */
  tasksSkipped: number;
}

/**
 * Syncs on demand every pending task that hasn't been pushed to Google yet: a
 * Calendar event AND a mirrored Google Task, so the same item shows up both
 * in Google Calendar and in the user's Google Tasks list.
 */
export const syncPendingTasksToCalendar = async (tasks: Task[]): Promise<SyncResult> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Conecta tu cuenta de Google antes de sincronizar.');

  const result: SyncResult = { synced: 0, failed: 0, alreadySynced: 0, tasksSkipped: 0 };

  for (const task of tasks) {
    if (task.completed) continue;

    const needsCalendar = !task.syncedToCalendar && !task.calendarEventId;
    const needsTasks = !task.syncedToTasks && !task.googleTaskId;

    if (!needsCalendar && !needsTasks) {
      result.alreadySynced++;
      continue;
    }

    const updates: Partial<Task> = {};
    let calendarOk = !needsCalendar;
    let tasksOk = !needsTasks;

    if (needsCalendar) {
      try {
        const eventId = await syncTaskToCalendar(task);
        if (eventId) {
          updates.syncedToCalendar = true;
          updates.calendarEventId = eventId;
          calendarOk = true;
        }
      } catch {
        // calendarOk stays false
      }
    }

    if (needsTasks) {
      try {
        const ref = await createGoogleTask(task.title, task.description, task.dueDate);
        if (ref) {
          updates.syncedToTasks = true;
          updates.googleTaskId = ref.taskId;
          updates.googleTaskListId = ref.taskListId;
          tasksOk = true;
        }
      } catch {
        // tasksOk stays false
      }
    }

    if (Object.keys(updates).length > 0) {
      await db.tasks.update(task.id, updates);
    }

    if (calendarOk && tasksOk) {
      result.synced++;
    } else if (calendarOk && !tasksOk) {
      // Calendar succeeded; Google Tasks likely needs the user to reconnect
      // and grant the Tasks permission.
      result.synced++;
      result.tasksSkipped++;
    } else {
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
};

/** Removes both the Calendar event and the mirrored Google Task for a task. */
export const removeTaskFromGoogle = async (task: Pick<Task, 'calendarEventId' | 'googleTaskId' | 'googleTaskListId'>) => {
  if (task.calendarEventId) {
    removeTaskFromCalendar(task.calendarEventId).catch(console.error);
  }
  if (task.googleTaskId && task.googleTaskListId) {
    removeGoogleTask(task.googleTaskListId, task.googleTaskId).catch(console.error);
  }
};
