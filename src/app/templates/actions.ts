'use server';

import prisma from '@/lib/prisma';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const TemplateSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters long.' }),
  subject: z.string().min(3, { message: 'Subject must be at least 3 characters long.' }),
  body: z.string().min(10, { message: 'Body must be at least 10 characters long.' }),
});

export async function getEmailTemplates() {
  return prisma.emailTemplate.findMany({
    orderBy: {
      updatedAt: 'desc',
    },
  });
}

export async function getEmailTemplate(id: number) {
    if (isNaN(id)) return null;
    return prisma.emailTemplate.findUnique({
      where: { id },
    });
}

export async function createEmailTemplate(formData: FormData) {
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

export async function updateEmailTemplate(id: number, formData: FormData) {
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


export async function deleteEmailTemplate(id: number) {
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
