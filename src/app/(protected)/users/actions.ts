
'use server';

// TODO: Replace with Firebase/Firestore imports
// import prisma from '@/lib/prisma';
import { z } from 'zod';
// TODO: Use correct Role type from /src/types
import { Role } from '@/types';
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
    // TODO: Implement with Firebase Auth and Firestore
    console.log(`Creating user ${email} in Firebase...`);
    // const hashedPassword = await argon2.hash(password);
    /*
    await prisma.user.create({
      data: {
        ...rest,
        email: email,
        password: hashedPassword,
      },
    });
    */
    revalidatePath('/users');
    return { success: true };
  } catch (error: any) {
    // TODO: Adapt error handling for Firebase
    if (error.code === 'auth/email-already-exists' || (error.code === 'P2002' && error.meta?.target?.includes('email'))) {
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
    // TODO: Implement with Firebase Auth and Firestore
    console.log(`Updating user ${userId} in Firebase...`);
    /*
    await prisma.user.update({
      where: { id: userId },
      data: validatedFields.data,
    });
    */
    revalidatePath('/users');
    return { success: true };
  } catch (error: any) {
    // TODO: Adapt error handling for Firebase
     if (error.code === 'auth/email-already-exists' || (error.code === 'P2002' && error.meta?.target?.includes('email'))) {
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
        // TODO: Implement with Firebase Auth
        console.log(`Resetting password for user ${userId}...`);
        // const hashedPassword = await argon2.hash(password);
        /*
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });
        */
        revalidatePath('/users');
        return { success: true };
    } catch (error) {
        return { errors: { _form: ['An unexpected error occurred.'] } };
    }
}

export async function deactivateUser(userId: string) {
    await checkPermission('user:delete');
    try {
        // TODO: Implement with Firebase Auth (disable user) and Firestore (update status)
        console.log(`Deactivating user ${userId}...`);
        // await prisma.user.delete({ where: { id: userId }});
        revalidatePath('/users');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to deactivate user.' };
    }
}
