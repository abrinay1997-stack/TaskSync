import { useState } from 'react';
import { CalendarRange, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  startOfWeek,
  addWeeks,
  addDays,
  addMonths,
  startOfMonth,
  endOfMonth,
  format,
  isSameMonth,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { Task, Account } from '../../types';
import { ScheduleDayCell } from './ScheduleDayCell';

interface ScheduleViewProps {
  allTasks: Task[];
  accounts: Account[];
}

type Mode = 'week' | 'month';

// Build the Monday-based weeks that a month spans ("Semana 1..5").
function weeksOfMonth(monthDate: Date): Date[][] {
  const first = startOfMonth(monthDate);
  const last = endOfMonth(monthDate);
  const weeks: Date[][] = [];
  let cursor = startOfWeek(first, { weekStartsOn: 1 });
  while (cursor <= last) {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(cursor, i)));
    cursor = addWeeks(cursor, 1);
  }
  return weeks;
}

export function ScheduleView({ allTasks, accounts }: ScheduleViewProps) {
  const today = new Date();
  const [mode, setMode] = useState<Mode>('week');
  const [weekStart, setWeekStart] = useState(startOfWeek(today, { weekStartsOn: 1 }));
  const [monthDate, setMonthDate] = useState(startOfMonth(today));

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const monthWeeks = weeksOfMonth(monthDate);

  return (
    <div className="flex-1 relative z-10 w-full max-w-6xl mx-auto space-y-4">
      {/* Header: mode toggle + navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-white drop-shadow-md">Cronograma</h2>
          <div className="flex gap-1 p-1 bg-white/[0.03] rounded-full border border-white/10">
            <button
              onClick={() => setMode('week')}
              className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
                mode === 'week' ? 'bg-gradient-to-r from-purple-600/80 to-blue-600/80 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <CalendarRange size={13} /> Semana
            </button>
            <button
              onClick={() => setMode('month')}
              className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
                mode === 'month' ? 'bg-gradient-to-r from-purple-600/80 to-blue-600/80 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <CalendarDays size={13} /> Mes
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => (mode === 'week' ? setWeekStart(addWeeks(weekStart, -1)) : setMonthDate(addMonths(monthDate, -1)))}
            className="p-2 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-mono text-slate-300 min-w-[160px] text-center capitalize">
            {mode === 'week'
              ? `${format(weekStart, "d MMM", { locale: es })} – ${format(addDays(weekStart, 6), "d MMM", { locale: es })}`
              : format(monthDate, 'MMMM yyyy', { locale: es })}
          </span>
          <button
            onClick={() => (mode === 'week' ? setWeekStart(addWeeks(weekStart, 1)) : setMonthDate(addMonths(monthDate, 1)))}
            className="p-2 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
          {mode === 'week' ? (
            <button onClick={() => setWeekStart(startOfWeek(today, { weekStartsOn: 1 }))} className="text-xs text-cyan-300 hover:text-cyan-200 px-2">Hoy</button>
          ) : (
            <button onClick={() => setMonthDate(startOfMonth(today))} className="text-xs text-cyan-300 hover:text-cyan-200 px-2">Hoy</button>
          )}
        </div>
      </div>

      {/* Week view */}
      {mode === 'week' && (
        <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/10 rounded-3xl p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-2">
            {weekDays.map((day) => (
              <ScheduleDayCell key={day.toISOString()} day={day} tasks={allTasks} accounts={accounts} today={today} maxItems={6} />
            ))}
          </div>
        </div>
      )}

      {/* Month view: one row per "Semana N" */}
      {mode === 'month' && (
        <div className="space-y-3">
          {monthWeeks.map((week, i) => (
            <div key={i} className="bg-white/[0.02] backdrop-blur-2xl border border-white/10 rounded-3xl p-3 md:p-4">
              <div className="text-xs font-mono uppercase tracking-wider text-purple-300 mb-2 pl-1">
                Semana {i + 1}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-2">
                {week.map((day) => (
                  <ScheduleDayCell
                    key={day.toISOString()}
                    day={day}
                    tasks={allTasks}
                    accounts={accounts}
                    today={today}
                    dimmed={!isSameMonth(day, monthDate)}
                    maxItems={3}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
