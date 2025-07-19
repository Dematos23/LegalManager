
import { TrademarkForm } from '@/components/trademark-form';
import { getAgents, getOwners, getContacts } from '@/app/trademarks/actions';

export default async function NewTrademarkPage() {
  const [agents, owners, contacts] = await Promise.all([
    getAgents(),
    getOwners(),
    getContacts(),
  ]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <TrademarkForm agents={agents} owners={owners} contacts={contacts} />
    </div>
  );
}
