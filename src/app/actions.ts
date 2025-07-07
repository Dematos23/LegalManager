
'use server';

import { generateTrademarkEmailDraft } from '@/ai/flows/generate-trademark-email-draft';
import { getContactAndTrademarksForEmail } from '@/lib/data';
import { format } from 'date-fns';

interface GenerateEmailPayload {
  contactEmail: string;
}

export async function generateEmailAction(payload: GenerateEmailPayload) {
  const { contactEmail } = payload;
  const result = await getContactAndTrademarksForEmail(contactEmail);

  if (result.error || !result.contact || !result.trademarks) {
    return { error: result.error || 'Failed to retrieve data for email generation.' };
  }

  const { contact, trademarks } = result;

  const emailInput = {
    contact: {
        name: `${contact.firstName} ${contact.lastName}`,
        email: contact.email,
    },
    trademarks: trademarks.map(tm => ({
        denomination: tm.denomination,
        class: String(tm.class),
        certificate: tm.certificate,
        expiration: format(tm.expiration, 'yyyy-MM-dd'),
    })),
    crmData: `Contact since ${format(contact.createdAt, 'yyyy-MM-dd')}. Associated with agent: ${contact.agent.name}.`
  };

  try {
    const { emailDraft } = await generateTrademarkEmailDraft(emailInput);
    return { emailDraft };
  } catch (error) {
    console.error("AI email generation failed:", error);
    return { error: 'Failed to generate email draft with AI.' };
  }
}
