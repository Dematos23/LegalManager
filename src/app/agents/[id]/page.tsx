
import { getAgentDetails } from '@/lib/data';
import { notFound } from 'next/navigation';
import { AgentDetailClient } from '@/components/agent-detail-client';
import { MainLayout } from '@/components/main-layout';

type AgentDetailPageProps = {
    params: {
        id: string;
    }
}

export default async function AgentDetailPage({ params }: AgentDetailPageProps) {
    const agent = await getAgentDetails(params.id);

    if (!agent) {
        notFound();
    }
    
    return (
        <MainLayout>
            <AgentDetailClient agent={agent} />
        </MainLayout>
    );
}
