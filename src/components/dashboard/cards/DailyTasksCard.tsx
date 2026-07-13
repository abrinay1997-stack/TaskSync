import { Task, Account } from '../../../types';
import { TaskForm } from '../../TaskForm';
import { TaskList } from '../../TaskList';

interface DailyTasksCardProps {
  activeTab: string;
  isAuthenticated: boolean;
  accounts: Account[];
  pendingTasks: Task[];
  completedTasks: Task[];
}

export function DailyTasksCard({
  activeTab,
  isAuthenticated,
  accounts,
  pendingTasks,
  completedTasks
}: DailyTasksCardProps) {
  return (
    <section className={`col-span-1 md:col-span-8 md:row-span-4 bg-white/[0.02] backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] rounded-3xl p-6 flex-col ${activeTab === 'tasks' ? 'flex' : 'hidden md:flex'}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-white drop-shadow-md">Tareas Diarias</h2>
      </div>
      
      <TaskForm onTaskAdded={() => {}} isAuthenticated={isAuthenticated} accounts={accounts} />
      
      <div className="flex-1 overflow-y-auto pr-2 mt-4 space-y-4">
        {pendingTasks.length > 0 ? (
          <TaskList tasks={pendingTasks} accounts={accounts} onTaskUpdate={() => {}} />
        ) : (
          <div className="text-center py-8 text-slate-500">No hay tareas pendientes</div>
        )}
        
        {completedTasks.length > 0 && (
          <div className="pt-4 border-t border-white/5 mt-6">
            <h3 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">Completadas</h3>
            <TaskList tasks={completedTasks} accounts={accounts} onTaskUpdate={() => {}} />
          </div>
        )}
      </div>
    </section>
  );
}
