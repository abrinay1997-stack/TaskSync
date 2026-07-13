import { Task } from '../types';
import { getAccessToken } from './auth';

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
