
'use server';

import prisma from '@/lib/prisma';
import { Country, TrademarkType } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const TrademarkFormSchema = z.object({
  denomination: z.string().min(1, 'Denomination is required.'),
  class: z.coerce.number().int().min(1, 'Class must be between 1 and 45.').max(45, 'Class must be between 1 and 45.'),
  type: z.nativeEnum(TrademarkType),
  certificate: z.string().min(1, 'Certificate is required.'),
  expiration: z.coerce.date({ required_error: 'Expiration date is required.' }),
  products: z.string().optional(),
  
  ownerId: z.string(),
  ownerName: z.string().min(1, 'Owner name is required.'),
  ownerCountry: z.nativeEnum(Country),

  contactId: z.string(),
  contactFirstName: z.string().optional(),
  contactLastName: z.string().optional(),
  contactEmail: z.string().optional(),
  
  agentId: z.string().optional(),
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
    denomination, class: trademarkClass, type, certificate, expiration, products,
    ownerId, ownerName, ownerCountry,
    contactId, contactFirstName, contactLastName, contactEmail,
    agentId,
  } = validatedFields.data;

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Upsert Owner
      let finalOwnerId: number;
      if (ownerId === 'new') {
        const newOwner = await tx.owner.create({
          data: {
            name: ownerName,
            country: ownerCountry,
          },
        });
        finalOwnerId = newOwner.id;
      } else {
        finalOwnerId = parseInt(ownerId, 10);
      }

      // 2. Upsert Contact and Agent if a new contact is being created
      let finalContactId: number;
      if (contactId === 'new') {
        if (!agentId) {
            throw new Error("Agent is required to create a new contact.");
        }
        if (!contactEmail || !contactFirstName || !contactLastName) {
            throw new Error("First name, last name, and email are required for a new contact.");
        }
        const newContact = await tx.contact.create({
          data: {
            email: contactEmail,
            firstName: contactFirstName,
            lastName: contactLastName,
            agentId: parseInt(agentId, 10),
          },
        });
        finalContactId = newContact.id;
      } else {
        finalContactId = parseInt(contactId, 10);
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
      await tx.trademark.create({
        data: {
          denomination,
          class: trademarkClass,
          type,
          certificate,
          expiration,
          products,
          ownerId: finalOwnerId,
        },
      });
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


// --- Data fetching functions for the form ---
export async function getAgents() {
  return prisma.agent.findMany({ orderBy: { name: 'asc' } });
}

export async function getOwners() {
  return prisma.owner.findMany({ orderBy: { name: 'asc' } });
}

export async function getContacts() {
  return prisma.contact.findMany({ orderBy: { firstName: 'asc' } });
}
