
'use server';

// TODO: Replace with Firebase/Firestore imports
// import prisma from '@/lib/prisma';
import { z } from 'zod';
import { redirect } from 'next/navigation';
import argon2 from 'argon2';
// TODO: Use correct User type from /src/types
import type { User } from '@/types';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function loginAction(data: z.infer<typeof LoginSchema>): Promise<{ success: false, error: string } | { success: true, user: User }> {
  const validatedFields = LoginSchema.safeParse(data);

  if (!validatedFields.success) {
    return { success: false, error: 'Invalid fields.' };
  }

  const { email, password } = validatedFields.data;

  // TODO: Implement with Firebase Auth
  console.log(`Authenticating user ${email} with Firebase Auth...`);
  // This is a placeholder. You'll need to implement actual Firebase Auth logic.
  const user = null; // await getUserByEmailFromFirestore(email);

  if (!user) {
    return { success: false, error: 'Invalid credentials.' };
  }

  // TODO: Firebase Auth handles password verification. This logic will change.
  // const isPasswordValid = await argon2.verify(user.password, password);

  // if (!isPasswordValid) {
  //   return { success: false, error: 'Invalid credentials.' };
  // }

  // const { password: _, ...userWithoutPassword } = user;
  // return { success: true, user: userWithoutPassword as User };

  return { success: false, error: 'Not implemented' };
}
