
import { getCampaignDetails } from '@/app/campaigns/actions';
import { CampaignDetailClient } from '@/components/campaign-detail-client';
import { notFound } from 'next/navigation';

type CampaignDetailPageProps = {
    params: {
        id: string;
    }
}

export default async function CampaignDetailPage({ params }: CampaignDetailPageProps) {
    const campaignId = await params;
    const id = parseInt(campaignId.id, 10);
    if (isNaN(id)) {
        notFound();
    }

    const campaign = await getCampaignDetails(id);
    if (!campaign) {
        notFound();
    }

    return <CampaignDetailClient campaign={campaign} />;
}
