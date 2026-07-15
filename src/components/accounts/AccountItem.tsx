import React, { useState } from 'react';
import { Edit2, Trash2, Check, X, Info } from 'lucide-react';
import { Account, Platform } from '../../types';
import { db } from '../../lib/db';
import { AccountProfileFields, AccountProfileDraft } from './AccountProfileFields';

interface AccountItemProps {
  account: Account;
  icon: React.ReactNode;
  iconBgColor: string;
  iconTextColor: string;
}

const toDraft = (account: Account): AccountProfileDraft => ({
  niche: account.niche || '',
  description: account.description || '',
  socialLinks: account.socialLinks || {},
});

export function AccountItem({ account, icon, iconBgColor, iconTextColor }: AccountItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(account.name);
  const [profile, setProfile] = useState<AccountProfileDraft>(toDraft(account));

  const hasProfile = Boolean(account.niche || account.description || (account.socialLinks && Object.keys(account.socialLinks).length > 0));

  const startEdit = () => {
    setEditName(account.name);
    setProfile(toDraft(account));
    setIsEditing(true);
  };

  const saveEdit = async () => {
    if (!editName.trim()) return;
    const socialLinks = Object.fromEntries(
      Object.entries(profile.socialLinks).filter(([, v]) => v && v.trim())
    ) as Partial<Record<Platform, string>>;

    await db.accounts.update(account.id, {
      name: editName.trim(),
      niche: profile.niche.trim() || undefined,
      description: profile.description.trim() || undefined,
      socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
    });
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditName(account.name);
    setProfile(toDraft(account));
  };

  const deleteAccount = async () => {
    await db.accounts.delete(account.id);
  };

  if (isEditing) {
    return (
      <div className="bg-white/5 border border-purple-500/50 rounded-2xl p-4 space-y-3 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          className="w-full bg-black border border-white/10 text-white px-3 py-1.5 rounded-lg focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/40 focus:shadow-[0_0_14px_rgba(6,182,212,0.25)] text-sm transition-all"
          autoFocus
        />
        <AccountProfileFields draft={profile} onChange={(patch) => setProfile((p) => ({ ...p, ...patch }))} />
        <div className="flex justify-end gap-2">
          <button onClick={cancelEdit} className="px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-colors flex items-center gap-1">
            <X size={14} /> Cancelar
          </button>
          <button onClick={saveEdit} disabled={!editName.trim()} className="px-4 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-purple-600/80 to-blue-600/80 hover:from-purple-500 hover:to-blue-500 rounded-full transition-all flex items-center gap-1 disabled:opacity-50">
            <Check size={14} /> Guardar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex items-center justify-between group hover:bg-white/[0.05] transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-10 h-10 rounded-full ${iconBgColor} flex items-center justify-center ${iconTextColor} flex-shrink-0`}>
          {icon}
        </div>
        <div className="min-w-0">
          <span className="text-slate-200 font-medium block truncate">{account.name}</span>
          {hasProfile ? (
            <span className="text-[11px] text-slate-500 truncate block">{account.niche || 'Perfil completado'}</span>
          ) : (
            <span className="text-[11px] text-amber-400/80 flex items-center gap-1">
              <Info size={11} /> Sin perfil para la IA
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex-shrink-0">
        <button
          onClick={startEdit}
          className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-colors outline-none"
          title="Editar cuenta"
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
