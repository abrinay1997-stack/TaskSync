import React, { useState } from 'react';
import { Brain, Loader2 } from 'lucide-react';
import { Task } from '../../types';

interface AIAdvisorProps {
  tasks: Task[];
}

export function AIAdvisor({ tasks }: AIAdvisorProps) {
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAdvice = async () => {
    if (tasks.length === 0) {
      setError("No tienes tareas para analizar.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tasks: tasks.map(t => ({ title: t.title, priority: t.priority, completed: t.completed, dueDate: t.dueDate }))
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al obtener respuesta de la IA');
      }

      setAdvice(data.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="col-span-1 md:col-span-12 ai-card">
      <div className="ai-card-inner p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2" title="Consejos de productividad">
          <span className="w-10 h-10 rounded-full bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_12px_rgba(99,102,241,0.25)]">
            <Brain className="text-indigo-400" size={22} />
          </span>
        </h2>
        <button
          onClick={getAdvice}
          disabled={loading}
          className="bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 border border-indigo-500/30 disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : 'Generar Consejos'}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm mb-4">
          {error}
        </div>
      )}

      {advice && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
          {advice}
        </div>
      )}
      
      {!advice && !error && !loading && (
        <p className="text-slate-400 text-sm">
          Presiona "Generar Consejos" para que la IA analice tus tareas y te sugiera cómo organizar tu día.
        </p>
      )}
      </div>
    </section>
  );
}
