export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  completed: boolean;
  syncedToCalendar?: boolean;
  calendarEventId?: string;
  createdAt: string;
  accountId?: string;
  priority?: 'baja' | 'media' | 'alta';
}

export type AccountType = 'internal' | 'external';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  createdAt: string;
}

export interface User {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
}
