import React, { useState } from 'react';
import { Briefcase, Plus, AlertCircle } from 'lucide-react';
import { Account } from '../../types';
import { db } from '../../lib/db';
import { AccountItem } from './AccountItem';

interface ExternalAccountsListProps {
  accounts: Account[];
}

export function ExternalAccountsList({ accounts }: ExternalAccountsListProps) {
  const [newAccountName, setNewAccountName] = useState('');
  const isAtExternalLimit = accounts.length >= 4;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountName.trim()) return;
    
    await db.accounts.add({
      id: crypto.randomUUID(),
      name: newAccountName.trim(),
      type: 'external',
      createdAt: new Date().toISOString(),
    });
    setNewAccountName('');
  };

  return (
    <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] rounded-3xl p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <h2 className="text-xl font-semibold text-white drop-shadow-md flex items-center gap-2">
          <Briefcase className="text-cyan-400" size={24} />
          Cuentas Externas (Clientes)
        </h2>
        <span className={`text-sm font-medium px-3 py-1 rounded-full border ${isAtExternalLimit ? 'bg-pink-500/20 border-pink-500/30 text-pink-300' : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300'}`}>
          {accounts.length} / 4 permitidas
        </span>
      </div>

      {isAtExternalLimit && (
        <div className="mb-6 p-4 bg-pink-500/10 border border-pink-500/30 rounded-2xl flex gap-3 text-pink-200 shadow-[0_0_15px_rgba(236,72,153,0.1)]">
          <AlertCircle className="flex-shrink-0 text-pink-400 mt-0.5" size={20} />
          <div className="text-sm leading-relaxed">
            <strong>Atención Contractual:</strong> Has alcanzado el límite de 4 clientes externos. Según la <em>Cláusula 4.2</em> del contrato, al ingresar un 5to cliente, se debe programar una revisión formal de carga de trabajo y compensación.
          </div>
        </div>
      )}

      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newAccountName}
          onChange={(e) => setNewAccountName(e.target.value)}
          placeholder="Nombre del nuevo cliente..."
          className="flex-1 bg-black/20 border border-white/10 text-white placeholder-slate-500 px-4 py-3 rounded-xl focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 text-sm transition-all"
        />
        <button
          type="submit"
          disabled={!newAccountName.trim()}
          className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium py-2 px-5 rounded-xl hover:from-cyan-400 hover:to-blue-400 focus:outline-none disabled:opacity-50 transition-all text-sm shadow-[0_0_10px_rgba(6,182,212,0.3)] flex items-center gap-2"
        >
          <Plus size={18} /> Agregar
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accounts.map(acc => (
          <AccountItem 
            key={acc.id} 
            account={acc} 
            icon={<Briefcase size={20} />} 
            iconBgColor="bg-cyan-500/20 shadow-[0_0_10px_rgba(34,211,238,0.2)]" 
            iconTextColor="text-cyan-400" 
          />
        ))}
        {accounts.length === 0 && (
          <div className="col-span-1 md:col-span-2 text-center py-8 border border-dashed border-white/10 rounded-2xl text-slate-500 text-sm">
            Aún no tienes clientes externos registrados.
          </div>
        )}
      </div>
    </div>
  );
}
