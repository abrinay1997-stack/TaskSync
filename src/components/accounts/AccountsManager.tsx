import { Account } from '../../types';
import { InternalAccountsList } from './InternalAccountsList';
import { ExternalAccountsList } from './ExternalAccountsList';
import { AITaskPlanner } from './AITaskPlanner';

interface AccountsManagerProps {
  accounts: Account[];
}

export function AccountsManager({ accounts }: AccountsManagerProps) {
  const internalAccounts = accounts.filter(a => a.type === 'internal');
  const externalAccounts = accounts.filter(a => a.type === 'external');

  return (
    <div className="space-y-6">
      <AITaskPlanner accounts={accounts} />
      <InternalAccountsList accounts={internalAccounts} />
      <ExternalAccountsList accounts={externalAccounts} />
    </div>
  );
}
