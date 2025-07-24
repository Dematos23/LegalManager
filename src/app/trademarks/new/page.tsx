
import { TrademarkForm } from '@/components/trademark-form';
import { getAgents, getOwners, getContacts } from '@/app/trademarks/actions';
import { MainLayout } from '@/components/main-layout';

export default async function NewTrademarkPage() {
  const [agents, owners, contacts] = await Promise.all([
    getAgents(),
    getOwners(),
    getContacts(),
  ]);

  return (
    <MainLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <TrademarkForm agents={agents} owners={owners} contacts={contacts} />
        </div>
    </MainLayout>
  );
}
