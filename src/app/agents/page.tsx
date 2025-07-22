
import { getAgentsList } from '@/lib/data';
import { AgentsClient } from '@/components/agents-client';
import { MainLayout } from '@/components/main-layout';

export default async function AgentsPage() {
    const agents = await getAgentsList();
    return (
        <MainLayout>
            <AgentsClient agents={agents} />
        </MainLayout>
    );
}
