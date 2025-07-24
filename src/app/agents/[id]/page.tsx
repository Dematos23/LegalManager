
import { getAgentDetails } from '@/lib/data';
import { notFound } from 'next/navigation';
import { AgentDetailClient } from '@/components/agent-detail-client';

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
    
    return <AgentDetailClient agent={agent} />;
}
