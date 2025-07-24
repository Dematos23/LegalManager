
import { getTrademarkDetails } from '@/lib/data';
import { notFound } from 'next/navigation';
import { TrademarkDetailClient } from '@/components/trademark-detail-client';

type TrademarkDetailPageProps = {
    params: {
        id: string;
    }
}

export default async function TrademarkDetailPage({ params }: TrademarkDetailPageProps) {
    const trademark = await getTrademarkDetails(params.id);

    if (!trademark) {
        notFound();
    }
    
    return <TrademarkDetailClient trademark={trademark} />;
}
