import React, { useState } from 'react';
import { Task, Account } from '../../types';
import { db } from '../../lib/db';
import { removeTaskFromCalendar } from '../../lib/calendar';
import { CheckCircle, Trash2, Building, Briefcase, Pencil, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TaskItemProps {
  task: Task;
  account?: Account;
  accounts?: Account[];
  onTaskUpdate: () => void;
}

const toInputValue = (dueDate: string) => {
  const d = new Date(dueDate);
  return isNaN(d.getTime()) ? '' : format(d, "yyyy-MM-dd'T'HH:mm");
};

export function TaskItem({ task, account, accounts = [], onTaskUpdate }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || '');
  const [editDueDate, setEditDueDate] = useState(toInputValue(task.dueDate));
  const [editPriority, setEditPriority] = useState<'baja' | 'media' | 'alta'>(task.priority || 'media');
  const [editAccountId, setEditAccountId] = useState(task.accountId || '');

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

  const startEdit = () => {
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setEditDueDate(toInputValue(task.dueDate));
    setEditPriority(task.priority || 'media');
    setEditAccountId(task.accountId || '');
    setIsEditing(true);
  };

  const saveEdit = async () => {
    if (!editTitle.trim() || !editDueDate) return;
    const dueDateChanged = editDueDate !== toInputValue(task.dueDate);
    await db.tasks.update(task.id, {
      title: editTitle.trim(),
      description: editDescription.trim() || undefined,
      dueDate: editDueDate,
      priority: editPriority,
      accountId: editAccountId || undefined,
      // A rescheduled task needs to be pushed to Google Calendar again.
      ...(dueDateChanged && task.syncedToCalendar
        ? { syncedToCalendar: false, calendarEventId: undefined }
        : {}),
    });
    if (dueDateChanged && task.calendarEventId) {
      removeTaskFromCalendar(task.calendarEventId).catch(console.error);
    }
    setIsEditing(false);
    onTaskUpdate();
  };

  const isPastDue = new Date(task.dueDate) < new Date() && !task.completed;

  if (isEditing) {
    return (
      <div className="p-4 rounded-2xl border border-purple-500/40 bg-white/[0.04] backdrop-blur-md shadow-[0_0_15px_rgba(168,85,247,0.1)] space-y-3">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          placeholder="Título de la tarea"
          autoFocus
          className="w-full bg-black border border-white/10 text-white placeholder-slate-500 px-3 py-2 rounded-xl focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/40 focus:shadow-[0_0_14px_rgba(6,182,212,0.25)] text-sm transition-all"
        />
        <textarea
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          placeholder="Descripción (opcional)"
          className="w-full bg-black border border-white/10 text-white placeholder-slate-500 px-3 py-2 rounded-xl focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/40 focus:shadow-[0_0_14px_rgba(6,182,212,0.25)] text-sm h-[60px] resize-none transition-all"
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input
            type="datetime-local"
            value={editDueDate}
            onChange={(e) => setEditDueDate(e.target.value)}
            className="w-full bg-black border border-white/10 text-white px-3 py-2 rounded-xl focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/40 focus:shadow-[0_0_14px_rgba(6,182,212,0.25)] text-sm [color-scheme:dark] transition-all"
          />
          <select
            value={editPriority}
            onChange={(e) => setEditPriority(e.target.value as 'baja' | 'media' | 'alta')}
            className="w-full bg-black border border-white/10 text-white px-3 py-2 rounded-xl focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/40 focus:shadow-[0_0_14px_rgba(6,182,212,0.25)] text-sm transition-all appearance-none"
          >
            <option value="baja" className="bg-slate-900 text-slate-300">Prioridad: Baja</option>
            <option value="media" className="bg-slate-900 text-yellow-300">Prioridad: Media</option>
            <option value="alta" className="bg-slate-900 text-pink-400">Prioridad: Alta</option>
          </select>
          <select
            value={editAccountId}
            onChange={(e) => setEditAccountId(e.target.value)}
            className="w-full bg-black border border-white/10 text-white px-3 py-2 rounded-xl focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/40 focus:shadow-[0_0_14px_rgba(6,182,212,0.25)] text-sm transition-all appearance-none"
          >
            <option value="" className="bg-slate-900">Sin cuenta asociada</option>
            <optgroup label="Cuentas Internas" className="bg-slate-900 text-purple-300">
              {accounts.filter(a => a.type === 'internal').map(acc => (
                <option key={acc.id} value={acc.id} className="text-white">{acc.name}</option>
              ))}
            </optgroup>
            <optgroup label="Clientes (Externas)" className="bg-slate-900 text-cyan-300">
              {accounts.filter(a => a.type === 'external').map(acc => (
                <option key={acc.id} value={acc.id} className="text-white">{acc.name}</option>
              ))}
            </optgroup>
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={() => setIsEditing(false)}
            className="px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-colors flex items-center gap-1"
          >
            <X size={14} /> Cancelar
          </button>
          <button
            onClick={saveEdit}
            disabled={!editTitle.trim() || !editDueDate}
            className="px-4 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-purple-600/80 to-blue-600/80 hover:from-purple-500 hover:to-blue-500 rounded-full transition-all flex items-center gap-1 disabled:opacity-50"
          >
            <Check size={14} /> Guardar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-2xl border transition-all group backdrop-blur-md ${
        task.completed
          ? 'opacity-60 bg-white/[0.01] border-white/5'
          : isPastDue
              ? 'bg-rose-500/5 border-rose-500/40 border-overdue'
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
        {task.description && !task.completed && (
          <div className="text-xs text-slate-500 truncate mt-0.5">{task.description}</div>
        )}

        <div className="flex items-center flex-wrap mt-1.5 text-xs gap-2">
          {task.priority && (
            <div className={`flex items-center px-2.5 py-0.5 rounded-full font-mono uppercase tracking-wider text-[10px] font-medium ${
              task.priority === 'alta' ? 'bg-pink-500 text-white shadow-[0_0_12px_rgba(236,72,153,0.45)]' :
              task.priority === 'media' ? 'bg-amber-400 text-black' :
              'bg-cyan-400 text-black'
            }`}>
              {task.priority}
            </div>
          )}

          <div className={`flex items-center px-2.5 py-0.5 rounded-full border font-mono text-[10px] tracking-wide ${isPastDue ? 'text-rose-300 bg-rose-500/10 border-rose-500/20' : task.completed ? 'text-slate-500 bg-white/5 border-white/5' : 'text-slate-300 bg-white/10 border-white/10'}`}>
            {format(new Date(task.dueDate), "d MMM, h:mm a", { locale: es })}
          </div>

          {account && (
            <div className={`flex items-center px-2.5 py-0.5 rounded-full border font-mono text-[10px] tracking-wide ${account.type === 'internal' ? 'text-purple-300 bg-purple-500/10 border-purple-500/20' : 'text-cyan-300 bg-cyan-500/10 border-cyan-500/20'}`}>
              {account.type === 'internal' ? <Building size={12} className="mr-1" /> : <Briefcase size={12} className="mr-1" />}
              <span className="truncate max-w-[120px]">{account.name}</span>
            </div>
          )}

          {task.syncedToCalendar && (
            <div className="flex items-center gap-1.5 text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-full font-mono text-[10px] tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.9)] dot-breathe"></span>
              Sincronizado
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); startEdit(); }}
          className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-colors focus:outline-none"
          aria-label="Editar tarea"
          title="Editar tarea"
        >
          <Pencil size={16} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); deleteTask(); }}
          className="p-2 text-slate-500 hover:text-pink-400 hover:bg-pink-500/10 rounded-xl transition-colors focus:outline-none"
          aria-label="Eliminar tarea"
          title="Eliminar tarea"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
