
'use server';

import prisma from '@/lib/prisma';
import { Country, TrademarkType } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const TrademarkFormSchema = z.object({
  denomination: z.string().min(1, 'Denomination is required.'),
  classIds: z.string().min(1, 'At least one class is required.'),
  type: z.nativeEnum(TrademarkType),
  certificate: z.string().min(1, 'Certificate is required.'),
  expiration: z.coerce.date({ required_error: 'Expiration date is required.' }),
  products: z.string().optional(),
  
  ownerId: z.string(),
  ownerName: z.string().min(1, 'Owner name is required.'),
  ownerCountry: z.nativeEnum(Country),

  contactId: z.string(),
});

export async function createTrademark(formData: FormData) {
  const rawFormData = Object.fromEntries(formData.entries());

  // Handle optional fields that might not be in formData if empty
  if (!rawFormData.contactFirstName) rawFormData.contactFirstName = undefined;
  if (!rawFormData.contactLastName) rawFormData.contactLastName = undefined;
  if (!rawFormData.contactEmail) rawFormData.contactEmail = undefined;
  if (!rawFormData.agentId) rawFormData.agentId = undefined;

  const validatedFields = TrademarkFormSchema.safeParse(rawFormData);
  
  if (!validatedFields.success) {
    console.log(validatedFields.error.flatten().fieldErrors);
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const {
    denomination, classIds, type, certificate, expiration, products,
    ownerId, ownerName, ownerCountry,
    contactId,
  } = validatedFields.data;

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Owner should already exist, we just get its ID
      const finalOwnerId = parseInt(ownerId, 10);
      if (isNaN(finalOwnerId)) {
        throw new Error('Invalid Owner ID provided.');
      }
      
      // 2. Contact should already exist
      const finalContactId = parseInt(contactId, 10);
       if (isNaN(finalContactId)) {
        throw new Error('Invalid Contact ID provided.');
      }

      // 3. Connect Contact to Owner using the explicit join table
      await tx.ownerContact.upsert({
        where: {
          ownerId_contactId: {
            ownerId: finalOwnerId,
            contactId: finalContactId,
          },
        },
        update: {},
        create: {
          ownerId: finalOwnerId,
          contactId: finalContactId,
        },
      });
      

      // 4. Create Trademark
      const newTrademark = await tx.trademark.create({
        data: {
          denomination,
          type,
          certificate,
          expiration,
          products,
          ownerId: finalOwnerId,
        },
      });
      
      // 5. Connect Trademark to Classes
      const parsedClassIds = classIds.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
      if (parsedClassIds.length > 0) {
          await tx.trademarkClass.createMany({
              data: parsedClassIds.map(classId => ({
                  trademarkId: newTrademark.id,
                  classId: classId
              }))
          });
      }
    });
  } catch (error: any) {
    console.error('Failed to create trademark:', error);
    return {
      errors: { _form: [error.message || 'An unexpected error occurred.'] },
    };
  }

  revalidatePath('/');
  redirect('/');
}

export async function updateTrademark(trademarkId: number, formData: FormData) {
  const rawFormData = Object.fromEntries(formData.entries());
  const validatedFields = TrademarkFormSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const {
    denomination, classIds, type, certificate, expiration, products,
    ownerId,
    contactId,
  } = validatedFields.data;
  
  const finalOwnerId = parseInt(ownerId, 10);
  const finalContactId = parseInt(contactId, 10);

  if (isNaN(finalOwnerId) || isNaN(finalContactId)) {
    return { errors: { _form: ['Invalid Owner or Contact ID'] } };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Update the trademark's main details
      await tx.trademark.update({
        where: { id: trademarkId },
        data: {
          denomination,
          type,
          certificate,
          expiration,
          products,
          ownerId: finalOwnerId,
        },
      });

      // 2. Update the classes (delete old, create new)
      await tx.trademarkClass.deleteMany({
        where: { trademarkId: trademarkId },
      });
      
      const parsedClassIds = classIds.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
      if (parsedClassIds.length > 0) {
        await tx.trademarkClass.createMany({
          data: parsedClassIds.map(classId => ({
            trademarkId: trademarkId,
            classId: classId,
          })),
        });
      }
      
      // 3. Ensure Owner-Contact relationship exists
      await tx.ownerContact.upsert({
        where: { ownerId_contactId: { ownerId: finalOwnerId, contactId: finalContactId } },
        update: {},
        create: { ownerId: finalOwnerId, contactId: finalContactId },
      });
    });
  } catch (error: any) {
    console.error('Failed to update trademark:', error);
    return {
      errors: { _form: [error.message || 'An unexpected error occurred.'] },
    };
  }

  revalidatePath('/');
  revalidatePath(`/trademarks/${trademarkId}`);
  revalidatePath(`/trademarks/${trademarkId}/edit`);
  redirect(`/trademarks/${trademarkId}`);
}


// --- Data fetching functions for the form ---
export async function getAgents() {
  return prisma.agent.findMany({ orderBy: { name: 'asc' } });
}

export async function getOwners() {
  return prisma.owner.findMany({ orderBy: { name: 'asc' } });
}

export async function getContacts() {
  return prisma.contact.findMany({
    include: { agent: true },
    orderBy: { firstName: 'asc' } 
  });
}
