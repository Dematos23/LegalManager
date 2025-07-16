
import { getOwnerDetails, getContacts } from '@/lib/data';
import { notFound } from 'next/navigation';
import { OwnerDetailClient } from '@/components/owner-detail-client';

type OwnerDetailPageProps = {
    params: {
        id: string;
    }
}

export default async function OwnerDetailPage({ params }: OwnerDetailPageProps) {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
        notFound();
    }

    const [owner, allContacts] = await Promise.all([
        getOwnerDetails(id),
        getContacts(),
    ]);

    if (!owner) {
        notFound();
    }
    
    return <OwnerDetailClient owner={owner} allContacts={allContacts} />;
}
