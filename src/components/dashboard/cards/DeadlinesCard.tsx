import { Task } from '../../../types';
import { Login } from '../../Login';

interface DeadlinesCardProps {
  activeTab: string;
  isAuthenticated: boolean;
  pendingTasks: Task[];
}

export function DeadlinesCard({ activeTab, isAuthenticated, pendingTasks }: DeadlinesCardProps) {
  const nextDeadlines = pendingTasks.filter(t => new Date(t.dueDate) >= new Date()).slice(0, 3);
  const pastDue = pendingTasks.filter(t => new Date(t.dueDate) < new Date());

  return (
    <section className={`col-span-1 md:col-span-4 md:row-span-3 bg-white/[0.02] backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] rounded-3xl p-6 flex flex-col ${activeTab === 'tasks' ? 'flex' : 'hidden md:flex'}`}>
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 drop-shadow-md">
        <span className="w-2 h-2 bg-pink-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(236,72,153,0.8)]"></span>
        Próximos Vencimientos
      </h2>
      <div className="space-y-4 overflow-y-auto max-h-[300px] flex-1 pr-2">
        {pastDue.map(task => (
          <div key={task.id} className="border-l-2 border-pink-500 pl-4 py-1 relative">
            <div className="absolute -left-[1px] top-1/2 -translate-y-1/2 w-[2px] h-3/4 bg-pink-500 blur-[2px]"></div>
            <p className="text-sm font-bold text-white line-clamp-1">{task.title}</p>
            <p className="text-xs text-pink-400 font-medium">Atrasada</p>
          </div>
        ))}
        {nextDeadlines.map(task => (
          <div key={task.id} className="border-l-2 border-purple-500 pl-4 py-1 relative">
            <div className="absolute -left-[1px] top-1/2 -translate-y-1/2 w-[2px] h-3/4 bg-purple-500 blur-[2px]"></div>
            <p className="text-sm font-bold text-white line-clamp-1">{task.title}</p>
            <p className="text-xs text-purple-300 font-medium">
              {new Date(task.dueDate).toLocaleString('es-ES', { weekday: 'short', hour: '2-digit', minute:'2-digit' })}
            </p>
          </div>
        ))}
        {pastDue.length === 0 && nextDeadlines.length === 0 && (
          <p className="text-sm text-slate-400">No hay vencimientos próximos.</p>
        )}
      </div>
      
      {!isAuthenticated && (
         <div className="mt-6 pt-4 border-t border-white/5 hidden md:block">
           <Login onSuccess={() => {}} />
         </div>
      )}
    </section>
  );
}
