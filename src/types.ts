export type Platform = 'Instagram' | 'TikTok' | 'YouTube' | 'Facebook';

export const PLATFORMS: Platform[] = ['Instagram', 'TikTok', 'YouTube', 'Facebook'];

export const PLATFORM_STYLES: Record<Platform, string> = {
  Instagram: 'text-pink-300 bg-pink-500/10 border-pink-500/25',
  TikTok: 'text-slate-200 bg-white/10 border-white/20',
  YouTube: 'text-red-300 bg-red-500/10 border-red-500/25',
  Facebook: 'text-blue-300 bg-blue-500/10 border-blue-500/25',
};

export type Recurrence = 'daily' | 'weekly';

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
  platforms?: Platform[];
  recurrence?: Recurrence;
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
