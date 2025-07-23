
'use server';

import prisma from '@/lib/prisma';
import { z } from 'zod';
import { redirect } from 'next/navigation';
import argon2 from 'argon2';
import type { User } from '@prisma/client';

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

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return { success: false, error: 'Invalid credentials.' };
  }

  const isPasswordValid = await argon2.verify(user.password, password);

  if (!isPasswordValid) {
    return { success: false, error: 'Invalid credentials.' };
  }

  const { password: _, ...userWithoutPassword } = user;

  return { success: true, user: userWithoutPassword as User };
}
