
import { getEmailTemplate } from '@/app/templates/actions';
import { getTrademarks, getContacts } from '@/lib/data';
import { notFound } from 'next/navigation';
import { TemplateSendClient } from '@/components/template-send-client';
import { MainLayout } from '@/components/main-layout';

type SendTemplatePageProps = {
    params: {
        id: string;
    }
}

export default async function SendTemplatePage({ params }: SendTemplatePageProps) {
  const template = await getEmailTemplate(params.id);
  if (!template) {
    notFound();
  }

  const trademarks = await getTrademarks();
  const contacts = await getContacts();

  return (
    <MainLayout>
        <TemplateSendClient template={template} trademarks={trademarks} contacts={contacts} />
    </MainLayout>
  );
}

    
