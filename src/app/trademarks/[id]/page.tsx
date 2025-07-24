
import { getTrademarkDetails } from '@/lib/data';
import { notFound } from 'next/navigation';
import { TrademarkDetailClient } from '@/components/trademark-detail-client';
import { MainLayout } from '@/components/main-layout';

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
    
    return (
        <MainLayout>
            <TrademarkDetailClient trademark={trademark} />
        </MainLayout>
    );
}
