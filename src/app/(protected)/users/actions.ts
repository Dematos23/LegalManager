
'use server';

import prisma from '@/lib/prisma';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import argon2 from 'argon2';
import { checkPermission } from '@/lib/permissions';

const PasswordSchema = z.string().min(8, 'Password must be at least 8 characters long.');

const UserSchema = z.object({
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  email: z.string().email('Invalid email address.'),
  role: z.nativeEnum(Role),
});

export async function createUser(formData: FormData) {
  await checkPermission('user:create');
  
  const validatedFields = UserSchema.extend({
    password: PasswordSchema,
  }).safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  const { email, password, ...rest } = validatedFields.data;

  try {
    const hashedPassword = await argon2.hash(password);
    
    await prisma.user.create({
      data: {
        ...rest,
        email: email,
        password: hashedPassword,
      },
    });
    revalidatePath('/users');
    return { success: true };
  } catch (error: any) {
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return {
        errors: { email: ['A user with this email already exists.'] },
      };
    }
    return {
      errors: { _form: ['An unexpected error occurred.'] },
    };
  }
}

export async function updateUser(userId: string, formData: FormData) {
  await checkPermission('user:update');

  const validatedFields = UserSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: validatedFields.data,
    });
    revalidatePath('/users');
    return { success: true };
  } catch (error: any) {
     if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return {
        errors: { email: ['A user with this email already exists.'] },
      };
    }
    return {
       errors: { _form: ['An unexpected error occurred.'] },
    };
  }
}

export async function resetPassword(userId: string, formData: FormData) {
    await checkPermission('user:reset-password');

    const validatedFields = z.object({ password: PasswordSchema }).safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors };
    }

    const { password } = validatedFields.data;

    try {
        const hashedPassword = await argon2.hash(password);
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });
        revalidatePath('/users');
        return { success: true };
    } catch (error) {
        return { errors: { _form: ['An unexpected error occurred.'] } };
    }
}

export async function deactivateUser(userId: string) {
    await checkPermission('user:delete');
    try {
        await prisma.user.delete({ where: { id: userId }});
        revalidatePath('/users');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to deactivate user.' };
    }
}
