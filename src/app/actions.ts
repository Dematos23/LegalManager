'use server';

import { generateTrademarkEmailDraft } from '@/ai/flows/generate-trademark-email-draft';
import { getContactData } from '@/lib/data';
import { format } from 'date-fns';

interface GenerateEmailPayload {
  contactEmail: string;
}

export async function generateEmailAction(payload: GenerateEmailPayload) {
  const data = getContactData(payload.contactEmail);

  if (!data) {
    throw new Error('Contact not found');
  }

  const { contact, trademarks } = data;

  const formattedTrademarks = trademarks.map((tm) => ({
    trademark: tm.trademark,
    class: tm.class,
    certificate: tm.certificate,
    expiration: format(tm.expiration, 'yyyy-MM-dd'),
  }));

  try {
    const result = await generateTrademarkEmailDraft({
      contact: {
        name: contact.name,
        email: contact.email,
      },
      trademarks: formattedTrademarks,
      crmData: `Contact associated with Agent: ${trademarks[0]?.agent.name || 'N/A'}.`,
    });
    return { emailDraft: result.emailDraft };
  } catch (error) {
    console.error('Error generating email draft:', error);
    return { error: 'Failed to generate email draft.' };
  }
}
