import React, { useState } from 'react';
import { Building, Plus } from 'lucide-react';
import { Account } from '../../types';
import { db } from '../../lib/db';
import { AccountItem } from './AccountItem';

interface InternalAccountsListProps {
  accounts: Account[];
}

export function InternalAccountsList({ accounts }: InternalAccountsListProps) {
  const [newAccountName, setNewAccountName] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountName.trim()) return;
    
    await db.accounts.add({
      id: crypto.randomUUID(),
      name: newAccountName.trim(),
      type: 'internal',
      createdAt: new Date().toISOString(),
    });
    setNewAccountName('');
  };

  return (
    <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] rounded-3xl p-6">
      <h2 className="text-xl font-semibold text-white drop-shadow-md mb-6 flex items-center gap-2">
        <Building className="text-purple-400" size={24} />
        Cuentas Internas
      </h2>
      
      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newAccountName}
          onChange={(e) => setNewAccountName(e.target.value)}
          placeholder="Nombre de la nueva cuenta interna..."
          className="flex-1 bg-black border border-white/10 text-white placeholder-slate-500 px-4 py-3 rounded-xl focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/40 focus:shadow-[0_0_14px_rgba(6,182,212,0.25)] text-sm transition-all"
        />
        <button
          type="submit"
          disabled={!newAccountName.trim()}
          className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-medium py-2 px-5 rounded-full hover:from-purple-400 hover:to-indigo-400 focus:outline-none disabled:opacity-50 transition-all text-sm shadow-[0_0_10px_rgba(168,85,247,0.3)] flex items-center gap-2"
        >
          <Plus size={18} /> Agregar
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accounts.map(acc => (
          <AccountItem 
            key={acc.id} 
            account={acc} 
            icon={<Building size={20} />} 
            iconBgColor="bg-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.2)]" 
            iconTextColor="text-purple-400" 
          />
        ))}
      </div>
    </div>
  );
}
