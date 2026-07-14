import { Task, Account, PLATFORM_STYLES } from '../../types';
import { isSameDay, format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ScheduleDayCellProps {
  day: Date;
  tasks: Task[];
  accounts: Account[];
  today: Date;
  dimmed?: boolean; // day outside the focused month
  maxItems?: number;
}

const shortPlatform = (p: string) =>
  p === 'Instagram' ? 'IG' : p === 'Facebook' ? 'FB' : p === 'YouTube' ? 'YT' : 'TT';

export function ScheduleDayCell({ day, tasks, accounts, today, dimmed, maxItems = 4 }: ScheduleDayCellProps) {
  const isToday = isSameDay(day, today);
  const dayTasks = tasks
    .filter((t) => isSameDay(new Date(t.dueDate), day))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const accountName = (id?: string) => accounts.find((a) => a.id === id)?.name;

  return (
    <div
      className={`rounded-2xl border p-2.5 min-h-[110px] ${
        isToday
          ? 'border-purple-500/40 bg-purple-500/[0.06] shadow-[0_0_15px_rgba(147,51,234,0.15)]'
          : dimmed
          ? 'border-white/5 bg-white/[0.01] opacity-50'
          : 'border-white/10 bg-white/[0.02]'
      }`}
    >
      <div className={`text-[10px] font-mono uppercase tracking-wider mb-2 ${isToday ? 'text-purple-300' : 'text-slate-500'}`}>
        {format(day, 'EEE d', { locale: es })}
        {isToday && ' · hoy'}
      </div>
      <div className="space-y-1.5">
        {dayTasks.length === 0 && <div className="text-[11px] text-slate-600">Sin tareas</div>}
        {dayTasks.slice(0, maxItems).map((t) => (
          <div
            key={t.id}
            className={`rounded-xl border px-2 py-1.5 ${
              t.completed ? 'border-white/5 bg-white/[0.01] opacity-50' : 'border-white/10 bg-black/30'
            }`}
          >
            <div className={`text-[11px] font-medium leading-tight line-clamp-2 ${t.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
              {t.title}
            </div>
            <div className="flex items-center gap-1 flex-wrap mt-1">
              <span className="text-[9px] font-mono text-slate-500">{format(new Date(t.dueDate), 'HH:mm')}</span>
              {(t.platforms || []).map((p) => (
                <span key={p} className={`text-[8px] font-mono px-1.5 py-px rounded-full border ${PLATFORM_STYLES[p]}`}>
                  {shortPlatform(p)}
                </span>
              ))}
            </div>
            {accountName(t.accountId) && (
              <div className="text-[9px] text-slate-500 truncate mt-0.5">{accountName(t.accountId)}</div>
            )}
          </div>
        ))}
        {dayTasks.length > maxItems && (
          <div className="text-[10px] font-mono text-slate-500 pl-1">+{dayTasks.length - maxItems} más</div>
        )}
      </div>
    </div>
  );
}
