import React, { useState } from 'react';
import { Edit2, Trash2, Check, X } from 'lucide-react';
import { Account } from '../../types';
import { db } from '../../lib/db';

interface AccountItemProps {
  account: Account;
  icon: React.ReactNode;
  iconBgColor: string;
  iconTextColor: string;
}

export function AccountItem({ account, icon, iconBgColor, iconTextColor }: AccountItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(account.name);

  const startEdit = () => {
    setIsEditing(true);
    setEditName(account.name);
  };

  const saveEdit = async () => {
    if (editName.trim()) {
      await db.accounts.update(account.id, { name: editName.trim() });
    }
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditName(account.name);
  };

  const deleteAccount = async () => {
    await db.accounts.delete(account.id);
  };

  if (isEditing) {
    return (
      <div className="bg-white/5 border border-purple-500/50 rounded-2xl p-4 flex items-center justify-between shadow-[0_0_15px_rgba(168,85,247,0.1)]">
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          className="flex-1 bg-black/20 border border-white/10 text-white px-3 py-1.5 rounded-lg focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 text-sm transition-all mr-2"
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
        />
        <div className="flex gap-1">
          <button onClick={saveEdit} className="p-1.5 text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors">
            <Check size={16} />
          </button>
          <button onClick={cancelEdit} className="p-1.5 text-slate-400 hover:text-pink-400 hover:bg-pink-400/10 rounded-lg transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex items-center justify-between group hover:bg-white/[0.05] transition-colors">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full ${iconBgColor} flex items-center justify-center ${iconTextColor}`}>
          {icon}
        </div>
        <span className="text-slate-200 font-medium">{account.name}</span>
      </div>
      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        <button
          onClick={startEdit}
          className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-colors outline-none"
          title="Editar nombre"
        >
          <Edit2 size={16} />
        </button>
        <button
          onClick={deleteAccount}
          className="p-2 text-slate-500 hover:text-pink-400 hover:bg-pink-500/10 rounded-xl transition-colors outline-none"
          title="Eliminar cuenta"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
