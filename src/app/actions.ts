
'use server';

import { generateTrademarkEmailDraft } from '@/ai/flows/generate-trademark-email-draft';
import { getContactAndTrademarksForEmail } from '@/lib/data';
import prisma from '@/lib/prisma';
import { format } from 'date-fns';
import { revalidatePath } from 'next/cache';

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

export async function deleteAllDataAction() {
    try {
      // Prisma's `deleteMany` does not cascade. To delete records with many-to-many
      // relations, we first need to disconnect them to clear the implicit join table.
      await prisma.owner.updateMany({
        data: {
          contacts: {
            set: [],
          },
        },
      });

      // Now, delete from all tables in an order that respects the remaining
      // one-to-many foreign key constraints (children with FKs first, then parents).
      await prisma.$transaction([
        prisma.sentEmail.deleteMany({}),
        prisma.trademark.deleteMany({}),
        prisma.contact.deleteMany({}),
        prisma.campaign.deleteMany({}),
        prisma.owner.deleteMany({}),
        prisma.agent.deleteMany({}),
      ]);
      
      revalidatePath('/');
      revalidatePath('/tracking');
      return { success: true };
    } catch (error) {
      console.error('Failed to delete all data:', error);
      return { success: false, error: 'An unexpected error occurred while deleting data.' };
    }
}
