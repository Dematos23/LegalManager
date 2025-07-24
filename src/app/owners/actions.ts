
'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updateOwnerContacts(ownerId: string, contactIds: string[]) {
  try {
    // Use a transaction to ensure atomicity: delete old associations and create new ones.
    await prisma.$transaction([
      // 1. Delete all existing entries for this owner in the join table
      prisma.ownerContact.deleteMany({
        where: { ownerId: ownerId },
      }),
      // 2. Create new entries for the selected contacts
      prisma.ownerContact.createMany({
        data: contactIds.map(contactId => ({
          ownerId: ownerId,
          contactId: contactId,
        })),
      }),
    ]);
    
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
