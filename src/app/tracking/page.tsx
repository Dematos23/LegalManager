
import { getCampaigns } from '@/app/campaigns/actions';
import { TrackingClient } from '@/components/tracking-client';
import { MainLayout } from '@/components/main-layout';

export default async function TrackingPage() {
    const campaigns = await getCampaigns();
    return (
        <MainLayout>
            <TrackingClient campaigns={campaigns} />
        </MainLayout>
    );
}
