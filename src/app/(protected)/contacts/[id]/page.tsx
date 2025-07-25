
import { getContactDetails } from '@/lib/data';
import { notFound } from 'next/navigation';
import { ContactDetailClient } from '@/components/contact-detail-client';

type ContactDetailPageProps = {
    params: {
        id: string;
    }
}

export default async function ContactDetailPage({ params }: ContactDetailPageProps) {
    const contact = await getContactDetails(params.id);

    if (!contact) {
        notFound();
    }
    
    return (
        <ContactDetailClient contact={contact} />
    );
}
