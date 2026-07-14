import { Task, Account } from '../../types';
import { WeeklyProgress } from '../WeeklyProgress';

import { DailyTasksCard } from './cards/DailyTasksCard';
import { DeadlinesCard } from './cards/DeadlinesCard';
import { CalendarCard } from './cards/CalendarCard';
import { AIAdvisor } from './AIAdvisor';
import { AITaskPlanner } from '../accounts/AITaskPlanner';
import { StatsRow } from './StatsRow';
import { WeeklyScheduleCard } from './WeeklyScheduleCard';
import { CaptionGenerator } from './CaptionGenerator';

interface BentoGridProps {
  activeTab: string;
  isAuthenticated: boolean;
  accounts: Account[];
  allTasks: Task[];
  pendingTasks: Task[];
  completedTasks: Task[];
}

export function BentoGrid({
  activeTab,
  isAuthenticated,
  accounts,
  allTasks,
  pendingTasks,
  completedTasks,
}: BentoGridProps) {
  return (
    <main className="grid grid-cols-1 md:grid-cols-12 md:grid-rows-[auto] gap-4 flex-1 relative z-10">
      <StatsRow allTasks={allTasks} />

      <DailyTasksCard
        activeTab={activeTab} 
        isAuthenticated={isAuthenticated} 
        accounts={accounts} 
        pendingTasks={pendingTasks} 
        completedTasks={completedTasks} 
      />

      <DeadlinesCard 
        activeTab={activeTab} 
        isAuthenticated={isAuthenticated} 
        pendingTasks={pendingTasks} 
      />

      <section className={`col-span-1 md:col-span-6 md:row-span-2 bg-white/[0.02] backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] rounded-3xl p-6 ${activeTab === 'progress' ? 'block' : 'hidden md:block'}`}>
        <WeeklyProgress tasks={allTasks} />
      </section>

      <CalendarCard 
        activeTab={activeTab} 
        isAuthenticated={isAuthenticated} 
        pendingTasks={pendingTasks} 
      />

      <WeeklyScheduleCard allTasks={allTasks} accounts={accounts} />

      <div className={`col-span-1 md:col-span-12 ${activeTab === 'tasks' || activeTab === 'progress' ? 'block' : 'hidden md:block'}`}>
        <CaptionGenerator accounts={accounts} />
      </div>

      <div className={`col-span-1 md:col-span-12 ${activeTab === 'tasks' || activeTab === 'progress' ? 'block' : 'hidden md:block'}`}>
        <AITaskPlanner accounts={accounts} />
      </div>

      <div className={`col-span-1 md:col-span-12 ${activeTab === 'tasks' || activeTab === 'progress' ? 'block' : 'hidden md:block'}`}>
        <AIAdvisor tasks={pendingTasks} />
      </div>
    </main>
  );
}
