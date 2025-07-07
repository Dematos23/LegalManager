
import { getEmailTemplate } from '@/app/templates/actions';
import { getTrademarks } from '@/lib/data';
import { notFound } from 'next/navigation';
import { TemplateSendClient } from '@/components/template-send-client';

type SendTemplatePageProps = {
    params: {
        id: string;
    }
}

export default async function SendTemplatePage({ params }: SendTemplatePageProps) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    notFound();
  }

  const template = await getEmailTemplate(id);
  if (!template) {
    notFound();
  }

  const trademarks = await getTrademarks();

  return <TemplateSendClient template={template} trademarks={trademarks} />;
}
