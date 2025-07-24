
import { getCampaignDetails } from '@/app/(protected)/campaigns/actions';
import { CampaignDetailClient } from '@/components/campaign-detail-client';
import { notFound } from 'next/navigation';

type CampaignDetailPageProps = {
    params: {
        id: string;
    }
}

export default async function CampaignDetailPage({ params }: CampaignDetailPageProps) {
    const campaign = await getCampaignDetails(params.id);
    if (!campaign) {
        notFound();
    }

    return (
        <CampaignDetailClient campaign={campaign} />
    );
}
