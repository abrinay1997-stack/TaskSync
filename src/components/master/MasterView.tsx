import React, { useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Plus, ImagePlus, Loader2, Trash2, Pencil, FileDown, Sparkles, LayoutGrid, X, Check,
} from 'lucide-react';
import {
  Account, ContentItem, ContentType, ContentStatus,
  Platform, PLATFORMS, PLATFORM_STYLES, CONTENT_TYPES, CONTENT_STATUS_STYLES,
} from '../../types';
import { db } from '../../lib/db';
import { useContent } from '../../hooks/useContent';
import { fileToThumbnail } from '../../lib/media';
import { exportContentPDF } from '../../lib/contentPdf';

interface MasterViewProps {
  accounts: Account[];
}

const INPUT =
  'w-full bg-black border border-white/10 text-white placeholder-slate-500 px-3 py-2 rounded-xl focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/40 focus:shadow-[0_0_14px_rgba(6,182,212,0.25)] text-sm transition-all';

const emptyDraft = (accountId: string): Omit<ContentItem, 'id' | 'createdAt'> => ({
  accountId: accountId || undefined,
  platform: 'Instagram',
  type: 'post',
  thumbnail: undefined,
  caption: '',
  hashtags: '',
  publishDate: format(new Date(), 'yyyy-MM-dd'),
  status: 'idea',
});

export function MasterView({ accounts }: MasterViewProps) {
  const { content } = useContent();
  const fileRef = useRef<HTMLInputElement>(null);

  const [filterAccount, setFilterAccount] = useState('');
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState(emptyDraft(''));
  const [thumbLoading, setThumbLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const monthLabel = format(new Date(`${month}-01T00:00`), 'MMMM yyyy', { locale: es });
  const filterAccountObj = accounts.find((a) => a.id === filterAccount);

  const visible = useMemo(
    () =>
      content
        .filter((c) => c.publishDate.startsWith(month))
        .filter((c) => (filterAccount ? c.accountId === filterAccount : true))
        .sort((a, b) => new Date(a.publishDate).getTime() - new Date(b.publishDate).getTime()),
    [content, month, filterAccount]
  );

  const openNew = () => {
    setEditingId(null);
    setDraft(emptyDraft(filterAccount));
    setError(null);
    setShowForm(true);
  };

  const openEdit = (item: ContentItem) => {
    setEditingId(item.id);
    const { id, createdAt, ...rest } = item;
    setDraft(rest);
    setError(null);
    setShowForm(true);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setThumbLoading(true);
    setError(null);
    try {
      const thumb = await fileToThumbnail(file);
      setDraft((d) => ({ ...d, thumbnail: thumb }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setThumbLoading(false);
    }
  };

  const generateWithAI = async () => {
    if (!draft.caption.trim()) {
      setError('Escribe un tema en la descripción y la IA lo desarrolla.');
      return;
    }
    setAiLoading(true);
    setError(null);
    try {
      const draftAccount = accounts.find((a) => a.id === draft.accountId);
      const res = await fetch('/api/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: draft.caption,
          platform: draft.platform,
          clientName: draftAccount?.name,
          niche: draftAccount?.niche,
          description: draftAccount?.description,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al generar.');
      setDraft((d) => ({
        ...d,
        caption: data.caption || d.caption,
        hashtags: Array.isArray(data.hashtags) ? data.hashtags.join(' ') : d.hashtags,
      }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const save = async () => {
    if (!draft.caption.trim() && !draft.thumbnail) {
      setError('Agrega al menos una portada o una descripción.');
      return;
    }
    if (editingId) {
      await db.content.update(editingId, draft);
    } else {
      await db.content.add({ ...draft, id: crypto.randomUUID(), createdAt: new Date().toISOString() });
    }
    setShowForm(false);
  };

  const remove = async (id: string) => {
    await db.content.delete(id);
  };

  const cycleStatus = async (item: ContentItem) => {
    const order: ContentStatus[] = ['idea', 'listo', 'aprobado'];
    const next = order[(order.indexOf(item.status) + 1) % order.length];
    await db.content.update(item.id, { status: next });
  };

  const handleExport = () => {
    if (!filterAccountObj) {
      setError('Elige un cliente para exportar su PDF.');
      return;
    }
    exportContentPDF(visible, filterAccountObj, monthLabel);
  };

  return (
    <div className="flex-1 relative z-10 w-full max-w-6xl mx-auto space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <LayoutGrid className="text-purple-400" size={22} />
          <h2 className="text-xl font-semibold text-white drop-shadow-md">Master</h2>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 hidden sm:inline">Mesa de contenido</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={filterAccount} onChange={(e) => setFilterAccount(e.target.value)} className={`${INPUT} !w-auto h-[38px] appearance-none`}>
            <option value="" className="bg-slate-900">Todos los clientes</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id} className="bg-slate-900 text-white">{a.name}</option>
            ))}
          </select>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className={`${INPUT} !w-auto h-[38px] [color-scheme:dark]`} />
          <button
            onClick={handleExport}
            disabled={!filterAccount || visible.length === 0}
            title={!filterAccount ? 'Elige un cliente' : 'Descargar PDF del cliente'}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-medium px-4 h-[38px] rounded-full text-sm shadow-[0_0_12px_rgba(16,185,129,0.3)] disabled:opacity-40 transition-all"
          >
            <FileDown size={16} /> PDF cliente
          </button>
          <button onClick={openNew} className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium px-4 h-[38px] rounded-full text-sm shadow-[0_0_12px_rgba(147,51,234,0.3)] transition-all">
            <Plus size={16} /> Nueva pieza
          </button>
        </div>
      </div>

      {error && !showForm && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm">{error}</div>
      )}

      {/* Editor */}
      {showForm && (
        <div className="bg-white/[0.03] backdrop-blur-2xl border border-purple-500/30 rounded-3xl p-5 shadow-[0_0_20px_rgba(147,51,234,0.1)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">{editingId ? 'Editar pieza' : 'Nueva pieza de contenido'}</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-5">
            {/* Cover */}
            <div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full aspect-square rounded-2xl border-2 border-dashed border-white/15 hover:border-cyan-400/50 bg-black/30 flex flex-col items-center justify-center gap-2 overflow-hidden transition-all"
              >
                {thumbLoading ? (
                  <Loader2 size={22} className="animate-spin text-slate-400" />
                ) : draft.thumbnail ? (
                  <img src={draft.thumbnail} alt="portada" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <ImagePlus size={26} className="text-slate-500" />
                    <span className="text-xs text-slate-500">Subir portada</span>
                  </>
                )}
              </button>
              {draft.thumbnail && (
                <button onClick={() => setDraft((d) => ({ ...d, thumbnail: undefined }))} className="text-[11px] text-slate-500 hover:text-pink-400 mt-1.5">Quitar imagen</button>
              )}
            </div>

            {/* Fields */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <select value={draft.platform} onChange={(e) => setDraft((d) => ({ ...d, platform: e.target.value as Platform }))} className={`${INPUT} h-[38px] appearance-none`}>
                  {PLATFORMS.map((p) => <option key={p} value={p} className="bg-slate-900">{p}</option>)}
                </select>
                <select value={draft.type} onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value as ContentType }))} className={`${INPUT} h-[38px] appearance-none capitalize`}>
                  {CONTENT_TYPES.map((t) => <option key={t} value={t} className="bg-slate-900 capitalize">{t}</option>)}
                </select>
                <input type="date" value={draft.publishDate} onChange={(e) => setDraft((d) => ({ ...d, publishDate: e.target.value }))} className={`${INPUT} h-[38px] [color-scheme:dark]`} />
                <select value={draft.status} onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as ContentStatus }))} className={`${INPUT} h-[38px] appearance-none capitalize`}>
                  <option value="idea" className="bg-slate-900">Idea</option>
                  <option value="listo" className="bg-slate-900">Listo</option>
                  <option value="aprobado" className="bg-slate-900">Aprobado</option>
                </select>
              </div>

              <select value={draft.accountId || ''} onChange={(e) => setDraft((d) => ({ ...d, accountId: e.target.value || undefined }))} className={`${INPUT} h-[38px] appearance-none`}>
                <option value="" className="bg-slate-900">Sin cliente asignado</option>
                {accounts.map((a) => <option key={a.id} value={a.id} className="bg-slate-900 text-white">{a.name}</option>)}
              </select>

              <div className="relative">
                <textarea
                  value={draft.caption}
                  onChange={(e) => setDraft((d) => ({ ...d, caption: e.target.value }))}
                  placeholder="Descripción / caption (o escribe un tema y pulsa IA)"
                  className={`${INPUT} h-[84px] resize-none pr-24`}
                />
                <button
                  onClick={generateWithAI}
                  disabled={aiLoading}
                  className="absolute top-2 right-2 flex items-center gap-1 bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[11px] px-2 py-1 rounded-full hover:bg-cyan-500/25 transition-all disabled:opacity-50"
                >
                  {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} IA
                </button>
              </div>

              <input value={draft.hashtags || ''} onChange={(e) => setDraft((d) => ({ ...d, hashtags: e.target.value }))} placeholder="#hashtags" className={INPUT} />

              {error && <div className="text-red-400 text-xs">{error}</div>}

              <div className="flex justify-end gap-2">
                <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-white/5 rounded-full flex items-center gap-1"><X size={14} /> Cancelar</button>
                <button onClick={save} className="px-4 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-full flex items-center gap-1"><Check size={14} /> Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feed grid */}
      {visible.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-white/10 rounded-3xl text-slate-500">
          No hay contenido para {filterAccountObj ? filterAccountObj.name : 'este mes'} en {monthLabel}. Crea la primera pieza.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {visible.map((item) => {
            const acc = accounts.find((a) => a.id === item.accountId);
            return (
              <div key={item.id} className="group bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/30 transition-all">
                <div className="relative aspect-square bg-black/40">
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">Sin imagen</div>
                  )}
                  <div className="absolute top-2 left-2 flex gap-1">
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border backdrop-blur-md ${PLATFORM_STYLES[item.platform]}`}>{item.platform}</span>
                  </div>
                  <button
                    onClick={() => cycleStatus(item)}
                    title="Cambiar estado"
                    className={`absolute top-2 right-2 text-[9px] font-mono uppercase px-2 py-0.5 rounded-full border backdrop-blur-md ${CONTENT_STATUS_STYLES[item.status]}`}
                  >
                    {item.status}
                  </button>
                  <div className="absolute bottom-0 inset-x-0 flex justify-end gap-1 p-1.5 bg-gradient-to-t from-black/70 to-transparent opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(item)} className="p-1.5 bg-black/50 rounded-lg text-slate-200 hover:text-blue-300"><Pencil size={13} /></button>
                    <button onClick={() => remove(item.id)} className="p-1.5 bg-black/50 rounded-lg text-slate-200 hover:text-pink-400"><Trash2 size={13} /></button>
                  </div>
                </div>
                <div className="p-2.5">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
                    <span className="capitalize">{item.type}</span>
                    <span>{format(new Date(`${item.publishDate}T00:00`), 'd MMM', { locale: es })}</span>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2 leading-snug">{item.caption || '—'}</p>
                  {acc && <p className="text-[10px] text-slate-500 truncate mt-1">{acc.name}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
