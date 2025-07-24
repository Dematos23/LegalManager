
'use server';

import prisma from '@/lib/prisma';
import { Country, TrademarkType } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { checkPermission } from '@/lib/permissions';

const TrademarkFormSchema = z.object({
  denomination: z.string().min(1, 'Denomination is required.'),
  classIds: z.array(z.string()).min(1, 'At least one class is required.'),
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
  await checkPermission('trademark:create');

  const rawFormData = {
    denomination: formData.get('denomination'),
    classIds: formData.getAll('classIds'),
    type: formData.get('type'),
    certificate: formData.get('certificate'),
    expiration: formData.get('expiration'),
    products: formData.get('products'),
    ownerId: formData.get('ownerId'),
    ownerName: formData.get('ownerName'),
    ownerCountry: formData.get('ownerCountry'),
    contactId: formData.get('contactId'),
  };

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
      const finalOwnerId = ownerId;
      if (!finalOwnerId) {
        throw new Error('Invalid Owner ID provided.');
      }
      
      const finalContactId = contactId;
       if (!finalContactId) {
        throw new Error('Invalid Contact ID provided.');
      }

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
      
      const parsedClassIds = classIds.map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
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

export async function updateTrademark(trademarkId: string, formData: FormData) {
  await checkPermission('trademark:update');

  const rawFormData = {
    denomination: formData.get('denomination'),
    classIds: formData.getAll('classIds'),
    type: formData.get('type'),
    certificate: formData.get('certificate'),
    expiration: formData.get('expiration'),
    products: formData.get('products'),
    ownerId: formData.get('ownerId'),
    ownerName: formData.get('ownerName'),
    ownerCountry: formData.get('ownerCountry'),
    contactId: formData.get('contactId'),
  };

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
  
  const finalOwnerId = ownerId;
  const finalContactId = contactId;

  if (!finalOwnerId || !finalContactId) {
    return { errors: { _form: ['Invalid Owner or Contact ID'] } };
  }

  try {
    await prisma.$transaction(async (tx) => {
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

      await tx.trademarkClass.deleteMany({
        where: { trademarkId: trademarkId },
      });
      
      const parsedClassIds = classIds.map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
      if (parsedClassIds.length > 0) {
        await tx.trademarkClass.createMany({
          data: parsedClassIds.map(classId => ({
            trademarkId: trademarkId,
            classId: classId,
          })),
        });
      }
      
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
