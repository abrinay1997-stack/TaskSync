import React, { useState } from 'react';
import { db } from '../lib/db';
import { syncTaskToCalendar } from '../lib/calendar';
import { Calendar, Plus } from 'lucide-react';
import { Task, Account } from '../types';

interface TaskFormProps {
  onTaskAdded: () => void;
  isAuthenticated: boolean;
  accounts?: Account[];
}

export function TaskForm({ onTaskAdded, isAuthenticated, accounts = [] }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [accountId, setAccountId] = useState('');
  const [priority, setPriority] = useState<'baja' | 'media' | 'alta'>('media');
  const [syncToCalendar, setSyncToCalendar] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dueDate) return;

    setIsSubmitting(true);
    try {
      const newTask: Task = {
        id: crypto.randomUUID(),
        title,
        description,
        dueDate,
        completed: false,
        accountId: accountId || undefined,
        priority,
        createdAt: new Date().toISOString(),
      };

      if (syncToCalendar && isAuthenticated) {
        const eventId = await syncTaskToCalendar(newTask);
        if (eventId) {
          newTask.syncedToCalendar = true;
          newTask.calendarEventId = eventId;
        }
      }

      await db.tasks.add(newTask);
      
      setTitle('');
      setDescription('');
      setDueDate('');
      setAccountId('');
      setSyncToCalendar(false);
      setExpanded(false);
      onTaskAdded();
      
      // Schedule notification
      if ('Notification' in window && Notification.permission === 'granted') {
        const timeUntilDue = new Date(dueDate).getTime() - new Date().getTime();
        if (timeUntilDue > 0) {
          setTimeout(() => {
            new Notification('¡Tarea por vencer!', {
              body: title,
              icon: '/favicon.ico'
            });
          }, Math.max(0, timeUntilDue - 15 * 60 * 1000)); // Notify 15 mins before
        }
      }
      
    } catch (err) {
      console.error('Failed to add task:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  };

  if (!expanded) {
    return (
      <button 
        onClick={() => setExpanded(true)}
        className="w-full bg-gradient-to-r from-purple-600/80 to-blue-600/80 hover:from-purple-500 hover:to-blue-500 text-white text-sm px-4 py-3 rounded-xl transition-all font-medium flex items-center justify-center gap-2 mb-2 border border-white/10 shadow-[0_0_15px_rgba(147,51,234,0.3)] backdrop-blur-md"
      >
        <Plus size={18} /> Nueva Tarea
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white/[0.03] p-4 rounded-2xl border border-white/10 shadow-[0_4px_16px_0_rgba(0,0,0,0.2)] mb-4 transition-all backdrop-blur-md">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-white flex items-center">
          <Plus size={16} className="mr-1 text-cyan-400" />
          Nueva Tarea
        </h3>
        <button type="button" onClick={() => setExpanded(false)} className="text-slate-400 hover:text-white text-xs">Cancelar</button>
      </div>
      
      <div className="space-y-3">
        <div>
          <input
            type="text"
            placeholder="Título de la tarea"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-black/20 border border-white/10 text-white placeholder-slate-500 px-3 py-2 rounded-xl focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 text-sm transition-all"
            required
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <textarea
            placeholder="Descripción (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-black/20 border border-white/10 text-white placeholder-slate-500 px-3 py-2 rounded-xl focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 text-sm h-[42px] resize-none transition-all"
          />
          
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => {
              setDueDate(e.target.value);
              requestNotificationPermission();
            }}
            className="w-full bg-black/20 border border-white/10 text-white px-3 py-2 rounded-xl focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 text-sm h-[42px] [color-scheme:dark] transition-all"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as 'baja' | 'media' | 'alta')}
            className="w-full bg-black/20 border border-white/10 text-white px-3 py-2 rounded-xl focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 text-sm h-[42px] transition-all appearance-none"
          >
            <option value="baja" className="bg-slate-900 text-slate-300">Prioridad: Baja</option>
            <option value="media" className="bg-slate-900 text-yellow-300">Prioridad: Media</option>
            <option value="alta" className="bg-slate-900 text-pink-400">Prioridad: Alta</option>
          </select>

          {accounts && accounts.length > 0 && (
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full bg-black/20 border border-white/10 text-white px-3 py-2 rounded-xl focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 text-sm h-[42px] transition-all appearance-none"
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
          )}
        </div>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
          {isAuthenticated ? (
            <div className="flex items-center">
              <input
                id="sync-calendar"
                type="checkbox"
                checked={syncToCalendar}
                onChange={(e) => setSyncToCalendar(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 text-purple-600 focus:ring-purple-500 bg-black/20"
              />
              <label htmlFor="sync-calendar" className="ml-2 text-xs font-medium text-slate-300 flex items-center cursor-pointer">
                <Calendar size={14} className="mr-1 text-slate-400" />
                Sincronizar
              </label>
            </div>
          ) : (
            <div className="text-xs text-slate-500 flex items-center">
              <Calendar size={14} className="mr-1" />
              Inicia sesión para sincronizar
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !title || !dueDate}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium py-1.5 px-4 rounded-lg hover:from-cyan-400 hover:to-blue-400 focus:outline-none disabled:opacity-50 transition-all text-sm shadow-[0_0_10px_rgba(6,182,212,0.3)]"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </form>
  );
}
