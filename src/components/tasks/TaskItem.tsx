import { Task, Account } from '../../types';
import { db } from '../../lib/db';
import { removeTaskFromCalendar } from '../../lib/calendar';
import { Calendar, CheckCircle, Trash2, Building, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TaskItemProps {
  task: Task;
  account?: Account;
  onTaskUpdate: () => void;
}

export function TaskItem({ task, account, onTaskUpdate }: TaskItemProps) {
  const toggleStatus = async () => {
    await db.tasks.update(task.id, { completed: !task.completed });
    onTaskUpdate();
  };

  const deleteTask = async () => {
    if (task.calendarEventId) {
      removeTaskFromCalendar(task.calendarEventId).catch(console.error);
    }
    
    await db.tasks.delete(task.id);
    onTaskUpdate();
  };

  const isPastDue = new Date(task.dueDate) < new Date() && !task.completed;

  return (
    <div 
      className={`flex items-center gap-4 p-4 rounded-2xl border transition-all group backdrop-blur-md ${
        task.completed 
          ? 'opacity-60 bg-white/[0.01] border-white/5' 
          : isPastDue 
              ? 'bg-pink-500/5 border-pink-500/20 shadow-[0_0_15px_rgba(236,72,153,0.05)]' 
              : 'bg-white/[0.03] border-white/10 hover:border-purple-500/30 hover:bg-white/[0.05] hover:shadow-[0_4px_20px_rgba(168,85,247,0.1)]'
      }`}
    >
      <button 
        onClick={(e) => { e.stopPropagation(); toggleStatus(); }}
        className="flex-shrink-0 focus:outline-none"
      >
        {task.completed ? (
          <div className="w-6 h-6 bg-purple-500 border-2 border-purple-500 rounded-lg flex items-center justify-center shadow-[0_0_10px_rgba(168,85,247,0.5)]">
              <CheckCircle size={16} className="text-white" />
          </div>
        ) : (
          <div className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-colors bg-black/20 ${isPastDue ? 'border-pink-500/50' : 'border-white/20 hover:border-cyan-400/80'}`}>
          </div>
        )}
      </button>
      
      <div className="flex-1 min-w-0">
        <div className={`text-base font-medium truncate drop-shadow-sm ${task.completed ? 'text-slate-400 line-through' : 'text-slate-100'}`}>
          {task.title}
        </div>
        
        <div className="flex items-center flex-wrap mt-1.5 text-xs gap-2">
          {task.priority && (
            <div className={`flex items-center px-2 py-0.5 rounded border capitalize ${
              task.priority === 'alta' ? 'text-pink-400 bg-pink-500/10 border-pink-500/20' : 
              task.priority === 'media' ? 'text-yellow-300 bg-yellow-500/10 border-yellow-500/20' : 
              'text-slate-300 bg-slate-500/10 border-slate-500/20'
            }`}>
              {task.priority}
            </div>
          )}

          <div className={`flex items-center px-2 py-0.5 rounded border ${isPastDue ? 'text-pink-400 bg-pink-500/10 border-pink-500/20' : task.completed ? 'text-slate-500 bg-white/5 border-white/5' : 'text-slate-300 bg-white/10 border-white/10'}`}>
            {format(new Date(task.dueDate), "d MMM, h:mm a", { locale: es })}
          </div>
          
          {account && (
            <div className={`flex items-center px-2 py-0.5 rounded border ${account.type === 'internal' ? 'text-purple-300 bg-purple-500/10 border-purple-500/20' : 'text-cyan-300 bg-cyan-500/10 border-cyan-500/20'}`}>
              {account.type === 'internal' ? <Building size={12} className="mr-1" /> : <Briefcase size={12} className="mr-1" />}
              <span className="truncate max-w-[120px]">{account.name}</span>
            </div>
          )}
          
          {task.syncedToCalendar && (
            <div className="flex items-center text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
              <Calendar size={12} className="mr-1" />
              Sincronizado
            </div>
          )}
        </div>
      </div>
      
      <button 
        onClick={(e) => { e.stopPropagation(); deleteTask(); }}
        className="p-2 text-slate-500 hover:text-pink-400 hover:bg-pink-500/10 rounded-xl transition-colors focus:outline-none flex-shrink-0 opacity-100 md:opacity-0 group-hover:opacity-100"
        aria-label="Eliminar tarea"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
