
import { getCampaigns } from '@/app/(protected)/campaigns/actions';
import { TrackingClient } from '@/components/tracking-client';

export default async function TrackingPage() {
    const campaigns = await getCampaigns();
    return (
        <TrackingClient campaigns={campaigns} />
    );
}
