
'use server';

import prisma from '@/lib/prisma';
import { z } from 'zod';
import { Role, Area } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const PasswordSchema = z.string().min(8, 'Password must be at least 8 characters long.');

const UserSchema = z.object({
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  email: z.string().email('Invalid email address.'),
  role: z.nativeEnum(Role),
  area: z.nativeEnum(Area),
});

export async function createUser(formData: FormData) {
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
    // In a real app, hash the password here with a library like argon2 or bcrypt
    // const hashedPassword = await hashPassword(password);
    
    await prisma.user.create({
      data: {
        ...rest,
        email: email,
        password: password, // Should be hashedPassword
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

export async function updateUser(userId: number, formData: FormData) {
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

export async function resetPassword(userId: number, formData: FormData) {
    const validatedFields = z.object({ password: PasswordSchema }).safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors };
    }

    const { password } = validatedFields.data;

    try {
        // In a real app, hash the password here
        await prisma.user.update({
            where: { id: userId },
            data: { password: password }, // Should be hashedPassword
        });
        revalidatePath('/users');
        return { success: true };
    } catch (error) {
        return { errors: { _form: ['An unexpected error occurred.'] } };
    }
}

export async function deactivateUser(userId: number) {
    try {
        await prisma.user.delete({ where: { id: userId }});
        revalidatePath('/users');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to deactivate user.' };
    }
}
