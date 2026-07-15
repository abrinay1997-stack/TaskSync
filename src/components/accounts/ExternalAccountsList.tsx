import React, { useState } from 'react';
import { Briefcase, Plus, AlertCircle, X, Check } from 'lucide-react';
import { Account, Platform } from '../../types';
import { db } from '../../lib/db';
import { AccountItem } from './AccountItem';
import { AccountProfileFields, AccountProfileDraft } from './AccountProfileFields';

interface ExternalAccountsListProps {
  accounts: Account[];
}

const emptyProfile = (): AccountProfileDraft => ({ niche: '', description: '', socialLinks: {} });

export function ExternalAccountsList({ accounts }: ExternalAccountsListProps) {
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState('');
  const [profile, setProfile] = useState<AccountProfileDraft>(emptyProfile());
  const isAtExternalLimit = accounts.length >= 4;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const socialLinks = Object.fromEntries(
      Object.entries(profile.socialLinks).filter(([, v]) => v && v.trim())
    ) as Partial<Record<Platform, string>>;

    await db.accounts.add({
      id: crypto.randomUUID(),
      name: name.trim(),
      type: 'external',
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

      {!expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="w-full mb-6 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium py-2.5 px-5 rounded-full hover:from-cyan-400 hover:to-blue-400 transition-all text-sm shadow-[0_0_10px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2"
        >
          <Plus size={18} /> Agregar cliente
        </button>
      ) : (
        <form onSubmit={handleAdd} className="mb-6 bg-black/20 border border-white/10 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Nuevo cliente</h3>
            <button type="button" onClick={() => { setExpanded(false); setName(''); setProfile(emptyProfile()); }} className="text-slate-400 hover:text-white">
              <X size={16} />
            </button>
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre del cliente..."
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
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium py-2 px-5 rounded-full hover:from-cyan-400 hover:to-blue-400 focus:outline-none disabled:opacity-50 transition-all text-sm shadow-[0_0_10px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2"
          >
            <Check size={18} /> Guardar cliente
          </button>
        </form>
      )}

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
