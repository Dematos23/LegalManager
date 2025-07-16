
'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updateOwnerContacts(ownerId: number, contactIds: number[]) {
  try {
    await prisma.owner.update({
      where: { id: ownerId },
      data: {
        contacts: {
          set: contactIds.map(id => ({ id })),
        },
      },
    });
    revalidatePath(`/owners/${ownerId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to update owner contacts:', error);
    if (error instanceof Error) {
        return { success: false, error: `An unexpected error occurred: ${error.message}` };
    }
    return { success: false, error: 'An unexpected error occurred while updating contacts.' };
  }
}
