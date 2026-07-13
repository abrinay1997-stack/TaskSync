import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { Account } from '../types';

export function useAccounts() {
  const accounts = useLiveQuery(() => db.accounts.toArray(), []) || [];

  useEffect(() => {
    const seedAccounts = async () => {
      const existingAccounts = await db.accounts.where('type').equals('internal').toArray();
      if (existingAccounts.length === 0) {
        await db.accounts.bulkAdd([
          { id: crypto.randomUUID(), name: 'Juancito Ads', type: 'internal', createdAt: new Date().toISOString() },
          { id: crypto.randomUUID(), name: 'Baby Caleb', type: 'internal', createdAt: new Date().toISOString() },
          { id: crypto.randomUUID(), name: 'Cuenta personal de artista', type: 'internal', createdAt: new Date().toISOString() },
        ]);
      }
    };
    seedAccounts();
  }, []);

  return { accounts };
}
