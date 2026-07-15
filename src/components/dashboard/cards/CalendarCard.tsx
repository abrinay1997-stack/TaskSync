import { useState } from 'react';
import { Calendar as CalendarIcon, RefreshCw, Loader2 } from 'lucide-react';
import { Task } from '../../../types';
import { syncPendingTasksToCalendar } from '../../../lib/calendar';

interface CalendarCardProps {
  activeTab: string;
  isAuthenticated: boolean;
  pendingTasks: Task[];
}

export function CalendarCard({ activeTab, isAuthenticated, pendingTasks }: CalendarCardProps) {
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const syncedTasks = pendingTasks.filter(t => t.syncedToCalendar);
  const unsyncedCount = pendingTasks.filter(t =>
    (!t.syncedToCalendar && !t.calendarEventId) || (!t.syncedToTasks && !t.googleTaskId)
  ).length;

  const handleSync = async () => {
    setSyncing(true);
    setMessage(null);
    try {
      const { synced, failed, tasksSkipped } = await syncPendingTasksToCalendar(pendingTasks);
      if (synced === 0 && failed === 0) {
        setMessage('Todo está al día. No hay tareas nuevas por sincronizar.');
      } else {
        const tasksNote = tasksSkipped
          ? ` · ${tasksSkipped} sin Google Tasks (reconecta tu cuenta para habilitarlo)`
          : '';
        setMessage(`${synced} sincronizada${synced === 1 ? '' : 's'}${failed ? ` · ${failed} con error` : ''}${tasksNote}.`);
      }
    } catch (err: any) {
      setMessage(err.message || 'Error al sincronizar.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <section className={`col-span-1 md:col-span-3 md:row-span-2 bg-white/[0.02] backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] rounded-3xl p-6 flex-col justify-between ${activeTab === 'progress' ? 'flex' : 'hidden md:flex'}`}>
      <div>
        <h2 className="text-lg font-semibold text-white mb-2 drop-shadow-md">Calendario</h2>
        <p className="text-xs text-slate-400">
          {isAuthenticated ? 'Sincronizado con Google Calendar' : 'Inicia sesión para sincronizar'}
        </p>
      </div>
      <div className="flex flex-col gap-2 mt-4 mb-4">
         {syncedTasks.slice(0, 2).map(t => (
            <div key={t.id} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs text-cyan-400 flex-shrink-0 shadow-[0_0_10px_rgba(34,211,238,0.2)]">
                <CalendarIcon size={14} />
              </div>
              <div className="text-sm text-slate-300 line-clamp-1">{t.title}</div>
            </div>
         ))}
         {syncedTasks.length === 0 && (
             <div className="text-sm text-slate-500">Sin eventos sincronizados</div>
         )}
      </div>

      {isAuthenticated && (
        <div className="space-y-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="w-full bg-gradient-to-r from-cyan-500/80 to-blue-500/80 hover:from-cyan-400 hover:to-blue-400 text-white text-center py-2 rounded-full text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
          >
            {syncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            {syncing ? 'Sincronizando…' : `Sincronizar${unsyncedCount ? ` (${unsyncedCount})` : ''}`}
          </button>
          {message && <p className="text-[11px] text-slate-400 text-center">{message}</p>}
          <a href="https://calendar.google.com" target="_blank" rel="noreferrer" className="bg-white/5 border border-white/10 text-center py-2 rounded-full text-xs font-bold text-slate-300 cursor-pointer hover:bg-white/10 transition-colors block">
            VER AGENDA
          </a>
        </div>
      )}
    </section>
  );
}
