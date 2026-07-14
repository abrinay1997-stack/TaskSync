import { CheckCircle2, Clock, AlertTriangle, Target } from 'lucide-react';
import { Task } from '../../types';
import { startOfWeek, endOfWeek } from 'date-fns';

interface StatsRowProps {
  allTasks: Task[];
}

// KPI cards computed from real local data (no fake platform metrics).
export function StatsRow({ allTasks }: StatsRowProps) {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const thisWeek = allTasks.filter((t) => {
    const due = new Date(t.dueDate);
    return due >= weekStart && due <= weekEnd;
  });
  const completedWeek = thisWeek.filter((t) => t.completed).length;
  const pending = allTasks.filter((t) => !t.completed).length;
  const overdue = allTasks.filter((t) => !t.completed && new Date(t.dueDate) < now).length;
  const completionRate = thisWeek.length > 0 ? Math.round((completedWeek / thisWeek.length) * 100) : 0;

  const stats = [
    {
      label: 'Completadas (semana)',
      value: String(completedWeek),
      Icon: CheckCircle2,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
    },
    {
      label: 'Cumplimiento semanal',
      value: `${completionRate}%`,
      Icon: Target,
      color: 'text-purple-300 bg-purple-500/10 border-purple-500/25',
    },
    {
      label: 'Pendientes',
      value: String(pending),
      Icon: Clock,
      color: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/25',
    },
    {
      label: 'Atrasadas',
      value: String(overdue),
      Icon: AlertTriangle,
      color: overdue > 0
        ? 'text-rose-300 bg-rose-500/10 border-rose-500/25'
        : 'text-slate-400 bg-white/5 border-white/10',
    },
  ];

  return (
    <div className="col-span-1 md:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map(({ label, value, Icon, color }) => (
        <div
          key={label}
          className="bg-white/[0.02] backdrop-blur-2xl border border-white/10 rounded-3xl p-4 flex items-center gap-3"
        >
          <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center flex-shrink-0 ${color}`}>
            <Icon size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-2xl font-bold text-white leading-none">{value}</div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mt-1.5 truncate">{label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
