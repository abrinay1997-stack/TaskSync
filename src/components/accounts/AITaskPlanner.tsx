import React, { useState } from 'react';
import { Sparkles, Loader2, Check, Trash2, CalendarClock } from 'lucide-react';
import { addDays, format } from 'date-fns';
import { Account, Task } from '../../types';
import { db } from '../../lib/db';

interface AITaskPlannerProps {
  accounts: Account[];
}

interface PreviewTask {
  id: string;
  stage: number;
  stageName: string;
  title: string;
  description: string;
  priority: 'baja' | 'media' | 'alta';
  dueDate: string; // datetime-local value
  selected: boolean;
}

const STAGE_COLORS = [
  'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'bg-pink-500/20 text-pink-300 border-pink-500/30',
  'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
];

const PRIORITY_STYLES: Record<PreviewTask['priority'], string> = {
  alta: 'text-pink-400',
  media: 'text-yellow-300',
  baja: 'text-slate-400',
};

export function AITaskPlanner({ accounts }: AITaskPlannerProps) {
  const defaultAccount =
    accounts.find((a) => a.type === 'external')?.id || accounts[0]?.id || '';

  const [accountId, setAccountId] = useState(defaultAccount);
  const [instagramUrl, setInstagramUrl] = useState('');
  const [niche, setNiche] = useState('');
  const [notes, setNotes] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewTask[]>([]);
  const [savedCount, setSavedCount] = useState<number | null>(null);

  const selectedAccount = accounts.find((a) => a.id === accountId);
  const selectedForSaveCount = preview.filter((p) => p.selected).length;

  const computeDueDate = (offsetDays: number) => {
    const base = new Date(`${startDate}T09:00`);
    return format(addDays(base, offsetDays), "yyyy-MM-dd'T'HH:mm");
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setSavedCount(null);
    setPreview([]);
    try {
      const response = await fetch('/api/generate-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: selectedAccount?.name || '',
          niche,
          notes,
          instagramUrl,
        }),
      });

      let data: any;
      try {
        data = await response.json();
      } catch {
        throw new Error(
          `El servidor respondió ${response.status} sin datos válidos (posible timeout). Intenta de nuevo o reduce las notas.`
        );
      }
      if (!response.ok) throw new Error(data.error || 'Error al generar el plan.');

      const items: PreviewTask[] = (data.tasks || []).map((t: any) => ({
        id: crypto.randomUUID(),
        stage: t.stage,
        stageName: t.stageName,
        title: t.title,
        description: t.description || '',
        priority: t.priority,
        dueDate: computeDueDate(t.dueOffsetDays ?? 0),
        selected: true,
      }));

      if (items.length === 0) throw new Error('La IA no devolvió tareas. Intenta de nuevo.');
      setPreview(items);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateItem = (id: string, patch: Partial<PreviewTask>) => {
    setPreview((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const removeItem = (id: string) => {
    setPreview((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSave = async () => {
    const chosen = preview.filter((p) => p.selected && p.title.trim());
    if (chosen.length === 0) return;

    const nowIso = new Date().toISOString();
    const newTasks: Task[] = chosen.map((p) => ({
      id: crypto.randomUUID(),
      title: p.title.trim(),
      description: `[Etapa ${p.stage} · ${p.stageName}] ${p.description}`.trim(),
      dueDate: p.dueDate,
      completed: false,
      accountId: accountId || undefined,
      priority: p.priority,
      createdAt: nowIso,
    }));

    await db.tasks.bulkAdd(newTasks);
    setSavedCount(newTasks.length);
    setPreview([]);
  };

  return (
    <div className="ai-card">
      <div className="ai-card-inner p-6">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="text-indigo-400" size={22} />
        <h2 className="text-xl font-semibold text-white drop-shadow-md">Planificador de Contenido con IA</h2>
      </div>
      <p className="text-xs text-slate-400 mb-5">
        Genera un plan de tareas para un cliente siguiendo las 5 etapas (cronograma → contenido por lotes → programación → campañas → informe).
        La IA usa el nombre y el nicho que le des; el link de Instagram queda como referencia.
      </p>

      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className="w-full bg-black border border-white/10 text-white px-3 py-2 rounded-xl focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/40 focus:shadow-[0_0_14px_rgba(6,182,212,0.25)] text-sm h-[42px] transition-all appearance-none"
        >
          <option value="" className="bg-slate-900">Cliente / cuenta…</option>
          <optgroup label="Clientes (Externas)" className="bg-slate-900">
            {accounts.filter((a) => a.type === 'external').map((a) => (
              <option key={a.id} value={a.id} className="text-white">{a.name}</option>
            ))}
          </optgroup>
          <optgroup label="Cuentas Internas" className="bg-slate-900">
            {accounts.filter((a) => a.type === 'internal').map((a) => (
              <option key={a.id} value={a.id} className="text-white">{a.name}</option>
            ))}
          </optgroup>
        </select>

        <input
          type="text"
          value={instagramUrl}
          onChange={(e) => setInstagramUrl(e.target.value)}
          placeholder="Link de Instagram / redes (opcional)"
          className="w-full bg-black border border-white/10 text-white placeholder-slate-500 px-3 py-2 rounded-xl focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/40 focus:shadow-[0_0_14px_rgba(6,182,212,0.25)] text-sm h-[42px] transition-all"
        />

        <input
          type="text"
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
          placeholder="Nicho / industria (ej: restaurante, moda, gym)"
          className="w-full bg-black border border-white/10 text-white placeholder-slate-500 px-3 py-2 rounded-xl focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/40 focus:shadow-[0_0_14px_rgba(6,182,212,0.25)] text-sm h-[42px] transition-all"
        />

        <div className="flex items-center gap-2">
          <CalendarClock size={16} className="text-slate-400 flex-shrink-0" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            title="Fecha de inicio del plan"
            className="w-full bg-black border border-white/10 text-white px-3 py-2 rounded-xl focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/40 focus:shadow-[0_0_14px_rgba(6,182,212,0.25)] text-sm h-[42px] [color-scheme:dark] transition-all"
          />
        </div>
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notas para la IA (objetivos, tono, campañas, productos a destacar…)"
        className="w-full bg-black border border-white/10 text-white placeholder-slate-500 px-3 py-2 rounded-xl focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/40 focus:shadow-[0_0_14px_rgba(6,182,212,0.25)] text-sm h-[60px] resize-none transition-all mb-4"
      />

      <button
        onClick={handleGenerate}
        disabled={loading || !accountId}
        className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white font-medium py-2.5 px-4 rounded-full transition-all text-sm shadow-[0_0_15px_rgba(99,102,241,0.3)] flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
        {loading ? 'Generando plan…' : 'Generar plan con IA'}
      </button>

      {error && (
        <div className="mt-4 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {savedCount !== null && (
        <div className="mt-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-3 rounded-xl text-sm flex items-center gap-2">
          <Check size={16} /> Se agregaron {savedCount} tarea{savedCount === 1 ? '' : 's'} a {selectedAccount?.name || 'la cuenta'}.
        </div>
      )}

      {/* Preview */}
      {preview.length > 0 && (
        <div className="mt-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Revisa y aprueba las tareas ({selectedForSaveCount})</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setPreview((p) => p.map((t) => ({ ...t, selected: true })))}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                Seleccionar todo
              </button>
              <span className="text-slate-600">·</span>
              <button
                onClick={() => setPreview((p) => p.map((t) => ({ ...t, selected: false })))}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                Ninguno
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {preview.map((t) => (
              <div
                key={t.id}
                className={`border rounded-2xl p-3 transition-all ${
                  t.selected ? 'bg-white/[0.04] border-white/15' : 'bg-white/[0.01] border-white/5 opacity-60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={t.selected}
                    onChange={(e) => updateItem(t.id, { selected: e.target.checked })}
                    className="mt-1 w-4 h-4 rounded border-white/20 text-indigo-600 focus:ring-indigo-500 bg-black/20 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${STAGE_COLORS[t.stage - 1] || STAGE_COLORS[0]}`}>
                        {t.stage}. {t.stageName}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={t.title}
                      onChange={(e) => updateItem(t.id, { title: e.target.value })}
                      className="w-full bg-transparent border-b border-white/10 focus:border-indigo-500/50 text-sm text-white font-medium focus:outline-none pb-1 mb-1.5 transition-all"
                    />
                    <textarea
                      value={t.description}
                      onChange={(e) => updateItem(t.id, { description: e.target.value })}
                      placeholder="Descripción (opcional)"
                      rows={2}
                      className="w-full bg-black/20 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 resize-none mb-2 transition-all"
                    />
                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={t.priority}
                        onChange={(e) => updateItem(t.id, { priority: e.target.value as PreviewTask['priority'] })}
                        className={`bg-black border border-white/10 rounded-lg px-2 py-1 text-xs focus:outline-none appearance-none ${PRIORITY_STYLES[t.priority]}`}
                      >
                        <option value="alta" className="bg-slate-900 text-pink-400">Alta</option>
                        <option value="media" className="bg-slate-900 text-yellow-300">Media</option>
                        <option value="baja" className="bg-slate-900 text-slate-300">Baja</option>
                      </select>
                      <input
                        type="datetime-local"
                        value={t.dueDate}
                        onChange={(e) => updateItem(t.id, { dueDate: e.target.value })}
                        className="bg-black border border-white/10 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none [color-scheme:dark]"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(t.id)}
                    className="text-slate-500 hover:text-pink-400 hover:bg-pink-500/10 p-1.5 rounded-lg transition-colors flex-shrink-0"
                    title="Descartar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleSave}
            disabled={selectedForSaveCount === 0}
            className="w-full mt-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-medium py-2.5 px-4 rounded-full transition-all text-sm shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Check size={16} /> Agregar {selectedForSaveCount} tarea{selectedForSaveCount === 1 ? '' : 's'} a {selectedAccount?.name || 'la cuenta'}
          </button>
        </div>
      )}
      </div>
    </div>
  );
}
