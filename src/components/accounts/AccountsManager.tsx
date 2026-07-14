import { Account, Task } from '../../types';
import { InternalAccountsList } from './InternalAccountsList';
import { ExternalAccountsList } from './ExternalAccountsList';
import { ClientReportCard } from './ClientReportCard';

interface AccountsManagerProps {
  accounts: Account[];
  allTasks: Task[];
}

export function AccountsManager({ accounts, allTasks }: AccountsManagerProps) {
  const internalAccounts = accounts.filter(a => a.type === 'internal');
  const externalAccounts = accounts.filter(a => a.type === 'external');

  return (
    <div className="space-y-6">
      <ClientReportCard accounts={accounts} allTasks={allTasks} />
      <InternalAccountsList accounts={internalAccounts} />
      <ExternalAccountsList accounts={externalAccounts} />
    </div>
  );
}
