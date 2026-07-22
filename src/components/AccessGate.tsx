import React, { useState } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import { verifyAccessKey } from '../lib/appAccess';

interface AccessGateProps {
  onUnlock: () => void;
}

export function AccessGate({ onUnlock }: AccessGateProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || checking) return;
    setChecking(true);
    setError(null);
    try {
      const ok = await verifyAccessKey(code.trim());
      if (!ok) {
        setError('Clave incorrecta. Intenta de nuevo.');
        return;
      }
      onUnlock();
    } catch {
      setError('No se pudo verificar la clave. Intenta de nuevo.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050508] text-slate-200 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{
          background:
            'radial-gradient(circle at 25% 20%, rgba(147,51,234,0.25), transparent 50%), radial-gradient(circle at 75% 80%, rgba(6,182,212,0.2), transparent 50%)',
        }}
      />
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-sm bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl p-8 space-y-5 shadow-[0_0_40px_rgba(147,51,234,0.15)]"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600/80 to-blue-600/80 flex items-center justify-center shadow-[0_0_20px_rgba(147,51,234,0.4)]">
            <Lock size={20} className="text-white" />
          </div>
          <h1 className="text-lg font-semibold text-white">TaskSync</h1>
          <p className="text-xs text-slate-500">Acceso restringido. Ingresa la clave para continuar.</p>
        </div>

        <input
          type="password"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Clave de acceso"
          autoFocus
          autoComplete="off"
          className="w-full bg-black border border-white/10 text-white placeholder-slate-500 px-4 py-2.5 rounded-xl focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/40 focus:shadow-[0_0_14px_rgba(6,182,212,0.25)] text-sm text-center tracking-wider transition-all"
        />

        {error && <p className="text-red-400 text-xs text-center">{error}</p>}

        <button
          type="submit"
          disabled={checking || !code.trim()}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600/80 to-blue-600/80 hover:from-purple-500 hover:to-blue-500 text-white text-sm font-medium py-2.5 rounded-full transition-all disabled:opacity-50"
        >
          {checking ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
          {checking ? 'Verificando…' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}
