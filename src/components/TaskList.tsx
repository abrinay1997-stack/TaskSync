import { Task, Account } from '../types';
import { TaskItem } from './tasks/TaskItem';

interface TaskListProps {
  tasks: Task[];
  accounts?: Account[];
  onTaskUpdate: () => void;
}

export function TaskList({ tasks, accounts = [], onTaskUpdate }: TaskListProps) {
  return (
    <div className="space-y-3">
      {tasks.map((task) => {
        const account = accounts.find(a => a.id === task.accountId);
        return (
          <TaskItem
            key={task.id}
            task={task}
            account={account}
            accounts={accounts}
            onTaskUpdate={onTaskUpdate}
          />
        );
      })}
    </div>
  );
}

