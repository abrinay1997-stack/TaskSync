export type Platform = 'Instagram' | 'TikTok' | 'YouTube' | 'Facebook';

export const PLATFORMS: Platform[] = ['Instagram', 'TikTok', 'YouTube', 'Facebook'];

export const PLATFORM_STYLES: Record<Platform, string> = {
  Instagram: 'text-pink-300 bg-pink-500/10 border-pink-500/25',
  TikTok: 'text-slate-200 bg-white/10 border-white/20',
  YouTube: 'text-red-300 bg-red-500/10 border-red-500/25',
  Facebook: 'text-blue-300 bg-blue-500/10 border-blue-500/25',
};

export type Recurrence = 'daily' | 'weekly';

export type ContentType = 'post' | 'reel' | 'carrusel';
export const CONTENT_TYPES: ContentType[] = ['post', 'reel', 'carrusel'];

export type ContentStatus = 'idea' | 'listo' | 'aprobado';

export const CONTENT_STATUS_STYLES: Record<ContentStatus, string> = {
  idea: 'text-slate-300 bg-slate-500/10 border-slate-500/25',
  listo: 'text-amber-300 bg-amber-500/10 border-amber-500/25',
  aprobado: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/25',
};

export interface ContentItem {
  id: string;
  accountId?: string;
  platform: Platform;
  type: ContentType;
  thumbnail?: string; // JPEG data URL (cover image)
  caption: string;
  hashtags?: string;
  publishDate: string; // yyyy-MM-dd
  status: ContentStatus;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  completed: boolean;
  syncedToCalendar?: boolean;
  calendarEventId?: string;
  syncedToTasks?: boolean;
  googleTaskId?: string;
  googleTaskListId?: string;
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
  /** Business niche/industry, e.g. "restaurante de comida rápida". */
  niche?: string;
  /** What the business does, its products/services, differentiators, audience. */
  description?: string;
  /** Per-platform profile/link, so the AI can tell content per network apart. */
  socialLinks?: Partial<Record<Platform, string>>;
}

export interface User {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
}
