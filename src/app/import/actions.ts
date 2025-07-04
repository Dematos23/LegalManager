
'use server';

import prisma from '@/lib/prisma';
import * as XLSX from 'xlsx';
import { z } from 'zod';
import { Country, TrademarkType, Agent, Contact } from '@prisma/client';

// Define schemas for validation
const TrademarkSchema = z.object({
  trademark: z.string().min(1),
  class: z.coerce.number().int().min(1).max(45),
  type: z.nativeEnum(TrademarkType),
  certificate: z.string().min(1),
  expiration: z.coerce.date(),
  products: z.string().optional().nullable(),
});

const OwnerSchema = z.object({
  name: z.string().min(1),
  country: z.nativeEnum(Country),
});

const ContactSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
});

const AgentSchema = z.object({
  name: z.string().min(1),
  country: z.nativeEnum(Country),
});

export async function importDataAction(formData: FormData) {
  const file = formData.get('file') as File;
  const mappings = JSON.parse(formData.get('mappings') as string);
  
  if (!file) {
    return { error: 'No file uploaded.' };
  }

  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: null });

    const results = {
      success: 0,
      errors: 0,
      errorDetails: [] as any[],
    };

    for (const [index, row] of jsonData.entries()) {
      try {
        const getVal = (prefix: string, field: string) => {
          const header = Object.keys(mappings).find(h => mappings[h] === `${prefix}.${field}`);
          return header ? row[header] : undefined;
        };
        
        await prisma.$transaction(async (tx) => {
          let agent: Agent | null = null;
          const agentName = getVal('agent', 'name');
          if (agentName) {
            const agentData = AgentSchema.parse({
              name: agentName,
              country: getVal('agent', 'country')?.toUpperCase().replace(/\s/g, '_'),
            });
            agent = await tx.agent.upsert({
              where: { name: agentData.name },
              update: agentData,
              create: agentData,
            });
          }

          let contact: Contact | null = null;
          const contactEmail = getVal('contact', 'email');
          
          if (contactEmail) {
            if (!agent) {
              throw new Error(`Row ${index + 2}: Contact email provided without a mapped Agent. An agent is required to create a contact.`);
            }
            const contactData = ContactSchema.parse({
                firstName: getVal('contact', 'firstName'),
                lastName: getVal('contact', 'lastName'),
                email: contactEmail,
            });
            contact = await tx.contact.upsert({
              where: { email: contactData.email },
              update: { ...contactData, agentId: agent.id },
              create: { ...contactData, agentId: agent.id },
            });
          }
          
          const ownerData = OwnerSchema.parse({
              name: getVal('owner', 'name'),
              country: getVal('owner', 'country')?.toUpperCase().replace(/\s/g, '_'),
          });
          
          const owner = await tx.owner.upsert({
            where: { name: ownerData.name },
            update: {
              ...ownerData,
              ...(contact && { contacts: { connect: { id: contact.id } } })
            },
            create: {
              ...ownerData,
              ...(contact && { contacts: { connect: { id: contact.id } } })
            },
          });
          
          const expirationValue = getVal('trademark', 'expiration');
          const trademarkData = TrademarkSchema.parse({
              trademark: getVal('trademark', 'trademark'),
              class: getVal('trademark', 'class'),
              type: getVal('trademark', 'type')?.toUpperCase(),
              certificate: getVal('trademark', 'certificate'),
              expiration: typeof expirationValue === 'number' ? new Date(Math.round((expirationValue - 25569) * 86400 * 1000)) : expirationValue,
              products: getVal('trademark', 'products'),
          });

          await tx.trademark.create({
            data: {
              ...trademarkData,
              ownerId: owner.id,
            },

          });
        });

        results.success++;
      } catch (e) {
        results.errors++;
        const errorMessage = e instanceof z.ZodError ? JSON.stringify(e.errors) : e instanceof Error ? e.message : String(e);
        results.errorDetails.push({ row: index + 2, data: JSON.parse(JSON.stringify(row)), error: errorMessage });
      }
    }

    if (results.errors > 0) {
      console.error("Import errors:", JSON.stringify(results.errorDetails, null, 2));
    }
    return { 
      message: `Import complete. ${results.success} rows successfully imported. ${results.errors} rows failed.`,
      errorDetails: results.errors > 0 ? results.errorDetails : undefined,
    };

  } catch (error) {
    console.error('Import failed:', error);
    return { error: 'An unexpected error occurred during import.' };
  }
}
