
'use server';

import prisma from '@/lib/prisma';
import * as XLSX from 'xlsx';
import { z } from 'zod';
import { Country, TrademarkType, Agent, Contact } from '@prisma/client';

// Define schemas for validation
const TrademarkSchema = z.object({
  denomination: z.string().min(1),
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
  const mappings = JSON.parse(formData.get('mappings') as string); // { "File Header": "model.field" }
  
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

    // Create a reverse mapping for easier lookup: { "model.field": "File Header" }
    const reverseMappings: Record<string, string> = {};
    for (const header in mappings) {
      if (mappings[header] && mappings[header] !== 'ignore') {
        reverseMappings[mappings[header]] = header;
      }
    }

    for (const [index, row] of jsonData.entries()) {
      try {
        // Helper to get a value from the row using the model property path (e.g., 'agent.name')
        const getValue = (modelPropertyPath: string) => {
          const header = reverseMappings[modelPropertyPath];
          return header ? row[header] : undefined;
        };

        // Helper to sanitize country strings to match the Enum
        const getCountryEnumValue = (value: any) => {
          if (typeof value === 'string') {
            return value.trim().toUpperCase().replace(/\s/g, '_');
          }
          return value;
        };

        await prisma.$transaction(async (tx) => {
          let agent: Agent | null = null;
          const agentName = getValue('agent.name');
          if (agentName) {
            const agentData = AgentSchema.parse({
              name: agentName,
              country: getCountryEnumValue(getValue('agent.country')),
            });
            agent = await tx.agent.upsert({
              where: { name: agentData.name },
              update: agentData,
              create: agentData,
            });
          }

          let contact: Contact | null = null;
          const contactEmail = getValue('contact.email');
          if (contactEmail) {
            if (!agent) {
              throw new Error(`Row ${index + 2}: Contact email provided without a mapped Agent. An agent is required to create a contact.`);
            }
            const contactData = ContactSchema.parse({
                firstName: getValue('contact.firstName'),
                lastName: getValue('contact.lastName'),
                email: contactEmail,
            });
            contact = await tx.contact.upsert({
              where: { email: contactData.email },
              update: { ...contactData, agentId: agent.id },
              create: { ...contactData, agentId: agent.id },
            });
          }
          
          const ownerData = OwnerSchema.parse({
              name: getValue('owner.name'),
              country: getCountryEnumValue(getValue('owner.country')),
          });
          const owner = await tx.owner.upsert({
            where: { name: ownerData.name },
            update: {
              ...ownerData,
              ...(contact && { contacts: { connect: { id: contact.id } } })
            },
            create: {
              ...ownerData,
              ...(contact && { contacts: { connect: { connect: { id: contact.id } } } })
            },
          });
          
          const expirationValue = getValue('trademark.expiration');
          const trademarkData = TrademarkSchema.parse({
              denomination: getValue('trademark.denomination'),
              class: getValue('trademark.class'),
              type: getValue('trademark.type')?.toUpperCase(),
              certificate: getValue('trademark.certificate'),
              expiration: typeof expirationValue === 'number' ? new Date(Math.round((expirationValue - 25569) * 86400 * 1000)) : expirationValue,
              products: getValue('trademark.products'),
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
