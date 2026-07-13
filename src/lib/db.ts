import Dexie, { type EntityTable } from 'dexie';
import { Task, Account } from '../types';

const db = new Dexie('TasksDB') as Dexie & {
  tasks: EntityTable<Task, 'id'>;
  accounts: EntityTable<Account, 'id'>;
};

// Schema declaration
db.version(1).stores({
  tasks: 'id, dueDate, completed, createdAt'
});

db.version(2).stores({
  tasks: 'id, dueDate, completed, createdAt, accountId',
  accounts: 'id, type, name'
});

export { db };
