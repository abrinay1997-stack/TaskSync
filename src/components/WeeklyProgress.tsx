import { useMemo, useState } from 'react';
import { Task } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  eachWeekOfInterval,
  addDays,
  format,
  isSameDay,
  isWithinInterval,
} from 'date-fns';
import { es } from 'date-fns/locale';

interface WeeklyProgressProps {
  tasks: Task[];
}

type Range = 'week' | 'month';

export function WeeklyProgress({ tasks }: WeeklyProgressProps) {
  const [range, setRange] = useState<Range>('week');

  const chartData = useMemo(() => {
    const today = new Date();

    if (range === 'week') {
      const start = startOfWeek(today, { weekStartsOn: 1 });
      const end = endOfWeek(today, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end }).map((day) => {
        const dayTasks = tasks.filter((t) => isSameDay(new Date(t.dueDate), day));
        const completed = dayTasks.filter((t) => t.completed).length;
        return {
          name: format(day, 'E', { locale: es }).substring(0, 1).toUpperCase(),
          completadas: completed,
          pendientes: dayTasks.length - completed,
          total: dayTasks.length,
          highlight: isSameDay(day, today),
        };
      });
    }

    // Month: one bar per week ("S1".."S5").
    const start = startOfMonth(today);
    const end = endOfMonth(today);
    const weekStarts = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
    return weekStarts.map((ws, i) => {
      const we = addDays(ws, 6.999);
      const weekTasks = tasks.filter((t) => isWithinInterval(new Date(t.dueDate), { start: ws, end: we }));
      const completed = weekTasks.filter((t) => t.completed).length;
      return {
        name: `S${i + 1}`,
        completadas: completed,
        pendientes: weekTasks.length - completed,
        total: weekTasks.length,
        highlight: isWithinInterval(today, { start: ws, end: we }),
      };
    });
  }, [tasks, range]);

  const totalCompleted = chartData.reduce((sum, d) => sum + d.completadas, 0);
  const totalTasks = chartData.reduce((sum, d) => sum + d.total, 0);
  const completionRate = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Progreso</h2>
          <p className="text-xs text-slate-400 mt-1">
            {totalCompleted} de {totalTasks} tareas · {range === 'week' ? 'esta semana' : 'este mes'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 p-1 bg-white/[0.03] rounded-full border border-white/10">
            <button
              onClick={() => setRange('week')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${range === 'week' ? 'bg-purple-600/70 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Semana
            </button>
            <button
              onClick={() => setRange('month')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${range === 'month' ? 'bg-purple-600/70 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Mes
            </button>
          </div>
          <span className="text-3xl font-bold text-emerald-500">{completionRate}%</span>
        </div>
      </div>

      <div className="flex-1 w-full mt-2 min-h-[120px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }} barSize={range === 'week' ? 32 : 44}>
            <defs>
              <linearGradient id="colorCompletadas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" stopOpacity={1} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={1} />
              </linearGradient>
            </defs>
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.05)', opacity: 1 }}
              contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(8px)', color: '#f1f5f9' }}
              itemStyle={{ color: '#f8fafc' }}
            />
            <Bar dataKey="completadas" stackId="a" fill="url(#colorCompletadas)" radius={[0, 0, 4, 4]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.highlight ? '#22d3ee' : 'url(#colorCompletadas)'} />
              ))}
            </Bar>
            <Bar dataKey="pendientes" stackId="a" fill="rgba(255,255,255,0.05)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
