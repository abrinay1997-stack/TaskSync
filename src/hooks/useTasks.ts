import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { Task } from '../types';

export function useTasks() {
  const allTasks = useLiveQuery(() => db.tasks.orderBy('dueDate').toArray(), []) || [];
  
  const pendingTasks = allTasks.filter(t => !t.completed);
  const completedTasks = allTasks.filter(t => t.completed);

  return {
    allTasks,
    pendingTasks,
    completedTasks
  };
}
