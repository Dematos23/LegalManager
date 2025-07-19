
import { getTrademarkDetails } from '@/lib/data';
import { notFound } from 'next/navigation';
import { TrademarkDetailClient } from '@/components/trademark-detail-client';

type TrademarkDetailPageProps = {
    params: {
        id: string;
    }
}

export default async function TrademarkDetailPage({ params }: TrademarkDetailPageProps) {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
        notFound();
    }

    const trademark = await getTrademarkDetails(id);

    if (!trademark) {
        notFound();
    }
    
    return <TrademarkDetailClient trademark={trademark} />;
}
