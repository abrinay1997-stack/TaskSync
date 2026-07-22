import React, { useEffect, useState } from 'react';
import { PenLine, Loader2, Copy, Check } from 'lucide-react';
import { Account, PLATFORMS, Platform } from '../../types';
import { accessKeyHeader } from '../../lib/appAccess';

interface CaptionGeneratorProps {
  accounts: Account[];
}

interface CaptionResult {
  title: string;
  caption: string;
  hashtags: string[];
}

const INPUT_CLASS =
  'w-full bg-black border border-white/10 text-white placeholder-slate-500 px-3 py-2 rounded-xl focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/40 focus:shadow-[0_0_14px_rgba(6,182,212,0.25)] text-sm transition-all';

export function CaptionGenerator({ accounts }: CaptionGeneratorProps) {
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState<Platform>('Instagram');
  const [accountId, setAccountId] = useState('');
  const [niche, setNiche] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CaptionResult | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const selectedAccount = accounts.find((a) => a.id === accountId);

  // Auto-fill the niche from the account's saved profile; still editable.
  useEffect(() => {
    if (!selectedAccount) return;
    setNiche(selectedAccount.niche || '');
  }, [accountId]);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch('/api/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...accessKeyHeader() },
        body: JSON.stringify({
          topic,
          platform,
          clientName: selectedAccount?.name,
          niche,
          description: selectedAccount?.description,
        }),
      });
      let data: any;
      try {
        data = await response.json();
      } catch {
        throw new Error(`El servidor respondió ${response.status} sin datos válidos. Intenta de nuevo.`);
      }
      if (!response.ok) throw new Error(data.error || 'Error al generar el caption.');
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // Clipboard may be unavailable; ignore.
    }
  };

  const fullText = result
    ? `${result.title}\n\n${result.caption}\n\n${result.hashtags.join(' ')}`
    : '';

  return (
    <div className="ai-card">
      <div className="ai-card-inner p-6">
        <div className="flex items-center gap-2 mb-1">
          <PenLine className="text-cyan-400" size={22} />
          <h2 className="text-xl font-semibold text-white drop-shadow-md">Generador de Captions con IA</h2>
        </div>
        <p className="text-xs text-slate-400 mb-5">
          Escribe el tema del post y la IA genera título, caption y hashtags listos para pegar en Meta Business Suite o TikTok.
          El nicho se autocompleta al elegir la cuenta (edítalo en Cuentas para mejores resultados).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Tema del post (ej: promo 2x1 en hamburguesas)"
            className={`${INPUT_CLASS} md:col-span-3 h-[42px]`}
          />
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as Platform)}
            className={`${INPUT_CLASS} h-[42px] appearance-none`}
          >
            {PLATFORMS.map((p) => (
              <option key={p} value={p} className="bg-slate-900 text-white">{p}</option>
            ))}
          </select>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className={`${INPUT_CLASS} h-[42px] appearance-none`}
          >
            <option value="" className="bg-slate-900">Cuenta (opcional)…</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id} className="bg-slate-900 text-white">{a.name}</option>
            ))}
          </select>
          <input
            type="text"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            placeholder="Nicho (ej: comida rápida)"
            className={`${INPUT_CLASS} h-[42px]`}
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !topic.trim()}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-medium py-2.5 px-4 rounded-full transition-all text-sm shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <PenLine size={16} />}
          {loading ? 'Generando…' : 'Generar caption'}
        </button>

        {error && (
          <div className="mt-4 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-5 space-y-3">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Título</span>
                <button onClick={() => copy('title', result.title)} className="text-slate-400 hover:text-cyan-300 transition-colors" title="Copiar título">
                  {copied === 'title' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>
              <p className="text-white font-semibold">{result.title}</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Caption</span>
                <button onClick={() => copy('caption', result.caption)} className="text-slate-400 hover:text-cyan-300 transition-colors" title="Copiar caption">
                  {copied === 'caption' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>
              <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">{result.caption}</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Hashtags</span>
                <button onClick={() => copy('hashtags', result.hashtags.join(' '))} className="text-slate-400 hover:text-cyan-300 transition-colors" title="Copiar hashtags">
                  {copied === 'hashtags' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.hashtags.map((h) => (
                  <span key={h} className="text-[11px] font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                    {h}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => copy('all', fullText)}
              className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 font-medium py-2 rounded-full transition-all text-xs flex items-center justify-center gap-2"
            >
              {copied === 'all' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              Copiar todo (título + caption + hashtags)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
