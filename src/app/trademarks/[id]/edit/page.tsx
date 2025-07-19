
import { TrademarkForm } from '@/components/trademark-form';
import { getAgents, getOwners, getContacts } from '@/app/trademarks/actions';
import { getTrademarkDetails } from '@/lib/data';
import { notFound } from 'next/navigation';

type EditTrademarkPageProps = {
    params: {
        id: string;
    }
}

export default async function EditTrademarkPage({ params }: EditTrademarkPageProps) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    notFound();
  }
  
  const [trademark, agents, owners, contacts] = await Promise.all([
    getTrademarkDetails(id),
    getAgents(),
    getOwners(),
    getContacts(),
  ]);

  if (!trademark) {
    notFound();
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <TrademarkForm trademark={trademark} agents={agents} owners={owners} contacts={contacts} />
    </div>
  );
}
