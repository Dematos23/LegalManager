
'use server';

import prisma from '@/lib/prisma';
import * as XLSX from 'xlsx';
import { z } from 'zod';
import { Country, TrademarkType, Agent, Contact } from '@prisma/client';

// Define schemas for validation, now accounting for optional fields
const TrademarkSchema = z.object({
  denomination: z.string().min(1, "Denomination is required."),
  class: z.coerce.number().int().min(1, "Class must be between 1 and 45.").max(45, "Class must be between 1 and 45."),
  type: z.preprocess(
    (val) => (typeof val === 'string' ? val.trim().toUpperCase() : val),
    z.nativeEnum(TrademarkType)
  ).optional().nullable(),
  certificate: z.coerce.string().min(1, "Certificate is required."),
  expiration: z.coerce.date({ required_error: 'Expiration date is required and must be a valid date format.' }),
  products: z.string().optional().nullable(),
});

const OwnerSchema = z.object({
  name: z.string().min(1, "Owner name is required."),
  country: z.nativeEnum(Country, { errorMap: () => ({ message: 'A valid country is required.' }) }),
});

const ContactSchema = z.object({
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  email: z.string().trim().email("A valid email is required."),
});

const AgentSchema = z.object({
  name: z.string().min(1, "Agent name is required."),
  country: z.nativeEnum(Country, { errorMap: () => ({ message: 'A valid country is required for the agent.' }) }),
  area: z.string().optional().nullable(),
});

async function parseAndValidateRows(formData: FormData) {
    const file = formData.get('file') as File;
    const mappings = JSON.parse(formData.get('mappings') as string);

    if (!file) {
        return { error: 'No file uploaded.' };
    }

    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: null });

    const results = {
        validRows: 0,
        errors: 0,
        errorDetails: [] as any[],
    };

    const reverseMappings: Record<string, string> = {};
    for (const header in mappings) {
        if (mappings[header] && mappings[header] !== 'ignore') {
            reverseMappings[mappings[header]] = header;
        }
    }

    const getValue = (row: any, modelPropertyPath: string) => {
        const header = reverseMappings[modelPropertyPath];
        let value = header ? row[header] : undefined;
        // Trim strings, but leave other types alone.
        if (typeof value === 'string') {
            value = value.trim();
        }
        return value;
    };

    const getCountryEnumValue = (value: any) => {
        if (typeof value === 'string') {
            return value.trim().toUpperCase().replace(/\s/g, '_');
        }
        return value;
    };

    for (const [index, row] of jsonData.entries()) {
        try {
            const agentName = getValue(row, 'agent.name');
            const ownerCountryValue = getValue(row, 'owner.country');

            if (agentName) {
                const agentCountryForDb = getValue(row, 'agent.country') || ownerCountryValue;
                AgentSchema.parse({
                    name: agentName,
                    country: getCountryEnumValue(agentCountryForDb),
                    area: getValue(row, 'agent.area'),
                });
            }

            const contactEmail = getValue(row, 'contact.email');
            if (contactEmail) {
                if (!agentName) {
                    throw new Error(`Contact email provided without a mapped Agent. An agent is required to create a contact.`);
                }
                ContactSchema.parse({
                    firstName: getValue(row, 'contact.firstName'),
                    lastName: getValue(row, 'contact.lastName'),
                    email: contactEmail,
                });
            }

            OwnerSchema.parse({
                name: getValue(row, 'owner.name'),
                country: getCountryEnumValue(ownerCountryValue),
            });

            const expirationValue = getValue(row, 'trademark.expiration');
            TrademarkSchema.parse({
                denomination: getValue(row, 'trademark.denomination'),
                class: getValue(row, 'trademark.class'),
                type: getValue(row, 'trademark.type'),
                certificate: String(getValue(row, 'trademark.certificate')),
                // Handle Excel's numeric date format
                expiration: typeof expirationValue === 'number' ? new Date(Math.round((expirationValue - 25569) * 86400 * 1000)) : expirationValue,
                products: getValue(row, 'trademark.products'),
            });

            results.validRows++;
        } catch (e) {
            results.errors++;
            const errorMessage = e instanceof z.ZodError ? JSON.stringify(e.flatten().fieldErrors) : e instanceof Error ? e.message : String(e);
            results.errorDetails.push({ row: index + 2, data: JSON.parse(JSON.stringify(row)), error: errorMessage });
        }
    }

    return results;
}

export async function verifyDataAction(formData: FormData) {
    try {
        const validationResult = await parseAndValidateRows(formData);
        if ('error' in validationResult) {
            return { error: validationResult.error };
        }
        
        if (validationResult.errors > 0) {
            console.error("Verification errors:", JSON.stringify(validationResult.errorDetails, null, 2));
            return {
                status: 'error' as const,
                message: `Verification complete. Found ${validationResult.errors} error(s) in ${validationResult.validRows + validationResult.errors} rows. Please fix them and try again.`,
                errorDetails: validationResult.errorDetails,
            };
        }

        return {
            status: 'success' as const,
            message: `Verification successful! All ${validationResult.validRows} rows are valid and ready for import.`
        };

    } catch (error) {
        console.error('Verification failed:', error);
        return { error: 'An unexpected error occurred during verification.' };
    }
}


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

    const reverseMappings: Record<string, string> = {};
    for (const header in mappings) {
      if (mappings[header] && mappings[header] !== 'ignore') {
        reverseMappings[mappings[header]] = header;
      }
    }

    for (const [index, row] of jsonData.entries()) {
      try {
        const getValue = (modelPropertyPath: string) => {
          const header = reverseMappings[modelPropertyPath];
          let value = header ? row[header] : undefined;
          if (typeof value === 'string') {
              value = value.trim();
          }
          return value;
        };

        const getCountryEnumValue = (value: any) => {
          if (typeof value === 'string') {
            return value.trim().toUpperCase().replace(/\s/g, '_');
          }
          return value;
        };

        await prisma.$transaction(async (tx) => {
          let agent: Agent | null = null;
          const agentName = getValue('agent.name');
          
          const ownerCountryValue = getValue('owner.country');

          if (agentName) {
            const agentCountryForDb = getCountryEnumValue(getValue('agent.country') || ownerCountryValue);

            const agentData = AgentSchema.parse({
              name: agentName,
              country: agentCountryForDb,
              area: getValue('agent.area'),
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
              country: getCountryEnumValue(ownerCountryValue),
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
          
          const expirationValue = getValue('trademark.expiration');
          const trademarkData = TrademarkSchema.parse({
              denomination: getValue('trademark.denomination'),
              class: getValue('trademark.class'),
              type: getValue('trademark.type'),
              certificate: String(getValue('trademark.certificate')),
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
        const errorMessage = e instanceof z.ZodError ? JSON.stringify(e.flatten().fieldErrors) : e instanceof Error ? e.message : String(e);
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
