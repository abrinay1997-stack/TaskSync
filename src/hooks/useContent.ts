import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';

export function useContent() {
  const content = useLiveQuery(() => db.content.toArray(), []) || [];
  return { content };
}
