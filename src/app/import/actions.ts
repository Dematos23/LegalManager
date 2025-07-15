
'use server';

import prisma from '@/lib/prisma';
import * as XLSX from 'xlsx';
import { z } from 'zod';
import { Country, TrademarkType, Agent, Contact } from '@prisma/client';
import { revalidatePath } from 'next/cache';

// Define schemas for validation, now accounting for optional fields
const TrademarkSchema = z.object({
  denomination: z.string().min(1),
  class: z.coerce.number().int().min(1).max(45),
  type: z.preprocess(
    (val) => (typeof val === 'string' ? val.trim().toUpperCase() : val),
    z.nativeEnum(TrademarkType)
  ).optional().nullable(),
  certificate: z.coerce.string().min(1),
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
  email: z.string().trim().email(),
});

const AgentSchema = z.object({
  name: z.string().min(1),
  country: z.nativeEnum(Country),
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
    
    const RowSchema = z.object({
        agentName: z.string().optional().nullable(),
        agentCountry: z.string().optional().nullable(),
        agentArea: z.string().optional().nullable(),
        contactFirstName: z.string().optional().nullable(),
        contactLastName: z.string().optional().nullable(),
        contactEmail: z.string().email().optional().nullable(),
        ownerName: z.string().min(1, "Required"),
        ownerCountry: z.string().min(1, "Required"),
        trademarkDenomination: z.string().min(1, "Required"),
        trademarkClass: z.coerce.number({invalid_type_error: "Invalid number"}).int().min(1).max(45),
        trademarkType: z.preprocess(
            (val) => (typeof val === 'string' && val.trim() !== '' ? val.trim().toUpperCase() : null),
            z.nativeEnum(TrademarkType, {invalid_type_error: "Invalid type"}).nullable()
        ),
        trademarkCertificate: z.coerce.string().min(1, "Required"),
        trademarkExpiration: z.coerce.date({required_error: "Required", invalid_type_error: "Invalid date"}),
        trademarkProducts: z.string().optional().nullable(),
    }).superRefine((data, ctx) => {
        if (data.contactEmail && !data.agentName) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['contactEmail'],
                message: 'Agent required for contact',
            });
        }
        if (data.agentName) {
             const agentCountry = data.agentCountry || data.ownerCountry;
             if (!agentCountry || Object.values(Country).indexOf(getCountryEnumValue(agentCountry)) === -1) {
                 ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['agentCountry'],
                    message: "Invalid country",
                 });
             }
        }
        if (Object.values(Country).indexOf(getCountryEnumValue(data.ownerCountry)) === -1) {
             ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['ownerCountry'],
                message: "Invalid country",
             });
        }
    });


    for (const [index, row] of jsonData.entries()) {
        const expirationValue = getValue(row, 'trademark.expiration');
        const dataToValidate = {
            agentName: getValue(row, 'agent.name'),
            agentCountry: getValue(row, 'agent.country'),
            agentArea: getValue(row, 'agent.area'),
            contactFirstName: getValue(row, 'contact.firstName'),
            contactLastName: getValue(row, 'contact.lastName'),
            contactEmail: getValue(row, 'contact.email'),
            ownerName: getValue(row, 'owner.name'),
            ownerCountry: getValue(row, 'owner.country'),
            trademarkDenomination: getValue(row, 'trademark.denomination'),
            trademarkClass: getValue(row, 'trademark.class'),
            trademarkType: getValue(row, 'trademark.type'),
            trademarkCertificate: getValue(row, 'trademark.certificate'),
            trademarkExpiration: typeof expirationValue === 'number' ? new Date(Math.round((expirationValue - 25569) * 86400 * 1000)) : expirationValue,
            trademarkProducts: getValue(row, 'trademark.products'),
        };

        const validationResult = RowSchema.safeParse(dataToValidate);

        if (validationResult.success) {
            results.validRows++;
        } else {
            results.errors++;
            results.errorDetails.push({ 
                row: index + 2, 
                data: JSON.parse(JSON.stringify(row)),
                fieldErrors: validationResult.error.flatten().fieldErrors,
                formErrors: validationResult.error.flatten().formErrors,
            });
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
              expiration: typeof expirationValue === 'number' ? new Date(Math.round((expirationValue - 25569) * 86400 * 1000)) : new Date(expirationValue),
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
    
    if (results.success > 0) {
      revalidatePath('/');
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
