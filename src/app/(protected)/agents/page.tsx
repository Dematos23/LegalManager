
import { getAgentsList } from '@/lib/data';
import { AgentsClient } from '@/components/agents-client';

export default async function AgentsPage() {
    const agents = await getAgentsList();
    return (
        <AgentsClient agents={agents} />
    );
}
