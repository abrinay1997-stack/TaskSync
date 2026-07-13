import { Calendar as CalendarIcon } from 'lucide-react';
import { Task } from '../../../types';

interface CalendarCardProps {
  activeTab: string;
  isAuthenticated: boolean;
  pendingTasks: Task[];
}

export function CalendarCard({ activeTab, isAuthenticated, pendingTasks }: CalendarCardProps) {
  return (
    <section className={`col-span-1 md:col-span-3 md:row-span-2 bg-white/[0.02] backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] rounded-3xl p-6 flex-col justify-between ${activeTab === 'progress' ? 'flex' : 'hidden md:flex'}`}>
      <div>
        <h2 className="text-lg font-semibold text-white mb-2 drop-shadow-md">Calendario</h2>
        <p className="text-xs text-slate-400">
          {isAuthenticated ? 'Sincronizado con Google Calendar' : 'Inicia sesión para sincronizar'}
        </p>
      </div>
      <div className="flex flex-col gap-2 mt-4 mb-4">
         {pendingTasks.filter(t => t.syncedToCalendar).slice(0, 2).map(t => (
            <div key={t.id} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs text-cyan-400 flex-shrink-0 shadow-[0_0_10px_rgba(34,211,238,0.2)]">
                <CalendarIcon size={14} />
              </div>
              <div className="text-sm text-slate-300 line-clamp-1">{t.title}</div>
            </div>
         ))}
         {pendingTasks.filter(t => t.syncedToCalendar).length === 0 && (
             <div className="text-sm text-slate-500">Sin eventos sincronizados</div>
         )}
      </div>
      {isAuthenticated && (
        <a href="https://calendar.google.com" target="_blank" rel="noreferrer" className="bg-white/5 border border-white/10 text-center py-2 rounded-xl text-xs font-bold text-slate-300 cursor-pointer hover:bg-white/10 transition-colors block">
          VER AGENDA
        </a>
      )}
    </section>
  );
}
