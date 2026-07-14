import Dexie, { type EntityTable } from 'dexie';
import { Task, Account, ContentItem } from '../types';

const db = new Dexie('TasksDB') as Dexie & {
  tasks: EntityTable<Task, 'id'>;
  accounts: EntityTable<Account, 'id'>;
  content: EntityTable<ContentItem, 'id'>;
};

// Schema declaration
db.version(1).stores({
  tasks: 'id, dueDate, completed, createdAt'
});

db.version(2).stores({
  tasks: 'id, dueDate, completed, createdAt, accountId',
  accounts: 'id, type, name'
});

// v3: the "Master" content board (posts/reels/carousels with cover images).
db.version(3).stores({
  content: 'id, accountId, publishDate, status, createdAt'
});

export { db };
