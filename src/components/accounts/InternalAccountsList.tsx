import React, { useState } from 'react';
import { Building, Plus, X, Check } from 'lucide-react';
import { Account, Platform } from '../../types';
import { db } from '../../lib/db';
import { AccountItem } from './AccountItem';
import { AccountProfileFields, AccountProfileDraft } from './AccountProfileFields';

interface InternalAccountsListProps {
  accounts: Account[];
}

const emptyProfile = (): AccountProfileDraft => ({ niche: '', description: '', socialLinks: {} });

export function InternalAccountsList({ accounts }: InternalAccountsListProps) {
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState('');
  const [profile, setProfile] = useState<AccountProfileDraft>(emptyProfile());

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const socialLinks = Object.fromEntries(
      Object.entries(profile.socialLinks).filter(([, v]) => v && v.trim())
    ) as Partial<Record<Platform, string>>;

    await db.accounts.add({
      id: crypto.randomUUID(),
      name: name.trim(),
      type: 'internal',
      createdAt: new Date().toISOString(),
      niche: profile.niche.trim() || undefined,
      description: profile.description.trim() || undefined,
      socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
    });
    setName('');
    setProfile(emptyProfile());
    setExpanded(false);
  };

  return (
    <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] rounded-3xl p-6">
      <h2 className="text-xl font-semibold text-white drop-shadow-md mb-6 flex items-center gap-2">
        <Building className="text-purple-400" size={24} />
        Cuentas Internas
      </h2>

      {!expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="w-full mb-6 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-medium py-2.5 px-5 rounded-full hover:from-purple-400 hover:to-indigo-400 transition-all text-sm shadow-[0_0_10px_rgba(168,85,247,0.3)] flex items-center justify-center gap-2"
        >
          <Plus size={18} /> Agregar cuenta interna
        </button>
      ) : (
        <form onSubmit={handleAdd} className="mb-6 bg-black/20 border border-white/10 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Nueva cuenta interna</h3>
            <button type="button" onClick={() => { setExpanded(false); setName(''); setProfile(emptyProfile()); }} className="text-slate-400 hover:text-white">
              <X size={16} />
            </button>
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre de la nueva cuenta interna..."
            autoFocus
            className="w-full bg-black border border-white/10 text-white placeholder-slate-500 px-4 py-3 rounded-xl focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/40 focus:shadow-[0_0_14px_rgba(6,182,212,0.25)] text-sm transition-all"
          />
          <p className="text-[11px] text-slate-500">
            Completa el nicho, la descripción y las redes para que la IA genere contenido especializado sin tener que repetir esta información cada vez.
          </p>
          <AccountProfileFields draft={profile} onChange={(patch) => setProfile((p) => ({ ...p, ...patch }))} />
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-medium py-2 px-5 rounded-full hover:from-purple-400 hover:to-indigo-400 focus:outline-none disabled:opacity-50 transition-all text-sm shadow-[0_0_10px_rgba(168,85,247,0.3)] flex items-center justify-center gap-2"
          >
            <Check size={18} /> Guardar cuenta
          </button>
        </form>
      )}

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
