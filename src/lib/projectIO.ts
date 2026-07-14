import { db } from './db';
import { Task, Account } from '../types';

interface ProjectFile {
  app: 'TaskSync';
  version: number;
  exportedAt: string;
  accounts: Account[];
  tasks: Task[];
}

/** Serialize the whole project (accounts + tasks) and download it as JSON. */
export async function exportProjectJSON() {
  const [accounts, tasks] = await Promise.all([
    db.accounts.toArray(),
    db.tasks.toArray(),
  ]);

  const payload: ProjectFile = {
    app: 'TaskSync',
    version: 1,
    exportedAt: new Date().toISOString(),
    accounts,
    tasks,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tasksync-proyecto-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export interface ImportResult {
  accounts: number;
  tasks: number;
  replaced: boolean;
}

/**
 * Load a project file. If `replace` is true the current project is wiped first;
 * otherwise the imported records are merged (upserted by id).
 */
export async function importProjectJSON(file: File, replace: boolean): Promise<ImportResult> {
  const text = await file.text();
  let data: ProjectFile;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('El archivo no es un JSON válido.');
  }

  if (data.app !== 'TaskSync' || !Array.isArray(data.tasks) || !Array.isArray(data.accounts)) {
    throw new Error('Este archivo no es un proyecto de TaskSync válido.');
  }

  await db.transaction('rw', db.tasks, db.accounts, async () => {
    if (replace) {
      await db.tasks.clear();
      await db.accounts.clear();
    }
    if (data.accounts.length) await db.accounts.bulkPut(data.accounts);
    if (data.tasks.length) await db.tasks.bulkPut(data.tasks);
  });

  return { accounts: data.accounts.length, tasks: data.tasks.length, replaced: replace };
}
