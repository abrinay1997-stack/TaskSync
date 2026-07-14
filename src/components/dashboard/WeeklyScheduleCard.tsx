import { CalendarRange } from 'lucide-react';
import { Task, Account, PLATFORM_STYLES } from '../../types';
import { startOfWeek, addDays, isSameDay, format } from 'date-fns';
import { es } from 'date-fns/locale';

interface WeeklyScheduleCardProps {
  allTasks: Task[];
  accounts: Account[];
}

// Weekly content schedule (stage 1 of the agency workflow): current week's
// tasks grouped by day, with platform chips — inspired by the AutoPost Pro
// "Scheduled Posts" strip, but backed by real local task data.
export function WeeklyScheduleCard({ allTasks, accounts }: WeeklyScheduleCardProps) {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const accountName = (id?: string) => accounts.find((a) => a.id === id)?.name;

  return (
    <section className="col-span-1 md:col-span-12 bg-white/[0.02] backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] rounded-3xl p-6">
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 drop-shadow-md">
        <CalendarRange className="text-purple-400" size={20} />
        Cronograma Semanal
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-2">
        {days.map((day) => {
          const isToday = isSameDay(day, now);
          const dayTasks = allTasks
            .filter((t) => isSameDay(new Date(t.dueDate), day))
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

          return (
            <div
              key={day.toISOString()}
              className={`rounded-2xl border p-2.5 min-h-[110px] ${
                isToday
                  ? 'border-purple-500/40 bg-purple-500/[0.06] shadow-[0_0_15px_rgba(147,51,234,0.15)]'
                  : 'border-white/10 bg-white/[0.02]'
              }`}
            >
              <div className={`text-[10px] font-mono uppercase tracking-wider mb-2 ${isToday ? 'text-purple-300' : 'text-slate-500'}`}>
                {format(day, 'EEE d', { locale: es })}
                {isToday && ' · hoy'}
              </div>
              <div className="space-y-1.5">
                {dayTasks.length === 0 && (
                  <div className="text-[11px] text-slate-600">Sin tareas</div>
                )}
                {dayTasks.slice(0, 3).map((t) => (
                  <div
                    key={t.id}
                    className={`rounded-xl border px-2 py-1.5 ${
                      t.completed
                        ? 'border-white/5 bg-white/[0.01] opacity-50'
                        : 'border-white/10 bg-black/30'
                    }`}
                  >
                    <div className={`text-[11px] font-medium leading-tight line-clamp-2 ${t.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                      {t.title}
                    </div>
                    <div className="flex items-center gap-1 flex-wrap mt-1">
                      <span className="text-[9px] font-mono text-slate-500">
                        {format(new Date(t.dueDate), 'HH:mm')}
                      </span>
                      {(t.platforms || []).map((p) => (
                        <span key={p} className={`text-[8px] font-mono px-1.5 py-px rounded-full border ${PLATFORM_STYLES[p]}`}>
                          {p === 'Instagram' ? 'IG' : p === 'Facebook' ? 'FB' : p === 'YouTube' ? 'YT' : 'TT'}
                        </span>
                      ))}
                    </div>
                    {accountName(t.accountId) && (
                      <div className="text-[9px] text-slate-500 truncate mt-0.5">{accountName(t.accountId)}</div>
                    )}
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <div className="text-[10px] font-mono text-slate-500 pl-1">+{dayTasks.length - 3} más</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
