
'use server';

import prisma from '@/lib/prisma';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { checkPermission } from '@/lib/permissions';

const TemplateSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters long.' }),
  subject: z.string().min(3, { message: 'Subject must be at least 3 characters long.' }),
  body: z.string().min(1, { message: 'Body must be at least 1 character long.' }),
});

function validateTemplateLogic(body: string) {
    const hasTrademarksLoop = /\{\{#each trademarks\}\}/.test(body);
    const hasOwnersLoop = /\{\{#each owners\}\}/.test(body);
    // This regex looks for single owner fields like {{owner.name}} but not inside an owners loop.
    const hasSingleOwnerFields = /\{\{owner\.(name|country)\}\}/.test(body);

    // Rule 3: multitrademark and single owner: should never be possible to create.
    // This is invalid if it has a trademark loop AND single owner fields, but NOT an owners loop.
    if (hasTrademarksLoop && !hasOwnersLoop && hasSingleOwnerFields) {
        return {
            isValid: false,
            error: { body: ["Invalid combination: A multi-trademark loop ('{{#each trademarks}}') cannot be used with single owner fields ('{{owner.name}}') outside of a multi-owner loop ('{{#each owners}}'). This template structure is ambiguous."] }
        };
    }

    return { isValid: true };
}


export async function getEmailTemplates() {
  return prisma.emailTemplate.findMany({
    orderBy: {
      updatedAt: 'desc',
    },
  });
}

export async function getEmailTemplate(id: string) {
    if (!id) return null;
    return prisma.emailTemplate.findUnique({
      where: { id },
    });
}

export async function createEmailTemplate(formData: FormData) {
  await checkPermission('template:create');

  const validatedFields = TemplateSchema.safeParse({
    name: formData.get('name'),
    subject: formData.get('subject'),
    body: formData.get('body'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  const logicValidation = validateTemplateLogic(validatedFields.data.body);
  if (!logicValidation.isValid) {
    return { errors: logicValidation.error };
  }

  try {
    await prisma.emailTemplate.create({
      data: validatedFields.data,
    });
  } catch (error: any) {
    if (error.code === 'P2002') { // Unique constraint violation
      return {
        errors: { name: ['A template with this name already exists.'] }
      }
    }
    return {
      errors: { _form: ['An unexpected error occurred.'] }
    }
  }

  revalidatePath('/templates');
  redirect('/templates');
}

export async function updateEmailTemplate(id: string, formData: FormData) {
    await checkPermission('template:update');
    
    const validatedFields = TemplateSchema.safeParse({
        name: formData.get('name'),
        subject: formData.get('subject'),
        body: formData.get('body'),
      });
    
      if (!validatedFields.success) {
        return {
          errors: validatedFields.error.flatten().fieldErrors,
        };
      }
    
      const logicValidation = validateTemplateLogic(validatedFields.data.body);
      if (!logicValidation.isValid) {
          return { errors: logicValidation.error };
      }

      try {
        await prisma.emailTemplate.update({
          where: { id },
          data: validatedFields.data,
        });
      } catch (error: any) {
        if (error.code === 'P2002') {
          return {
            errors: { name: ['A template with this name already exists.'] }
          }
        }
        return {
            errors: { _form: ['An unexpected error occurred.'] }
        }
      }

  revalidatePath('/templates');
  revalidatePath(`/templates/edit/${id}`);
  redirect('/templates');
}


export async function deleteEmailTemplate(id: string) {
    await checkPermission('template:delete');
    try {
        await prisma.emailTemplate.delete({
            where: { id },
        });
        revalidatePath('/templates');
        return { success: true }
    } catch (error) {
        return { success: false, error: 'Failed to delete template.' }
    }
}


export async function getTemplatePreviewData() {
  const agents = await prisma.agent.findMany({
    orderBy: { name: 'asc' },
    include: {
      contacts: {
        orderBy: { firstName: 'asc' },
        include: {
          ownerContacts: {
            include: {
              owner: {
                include: {
                  trademarks: {
                    include: {
                        trademarkClasses: {
                            include: {
                                class: true
                            }
                        }
                    },
                    orderBy: { denomination: 'asc' },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
  return agents;
}
