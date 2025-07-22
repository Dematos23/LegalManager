
'use server';

import prisma from '@/lib/prisma';
import { z } from 'zod';
import { redirect } from 'next/navigation';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function loginAction(data: z.infer<typeof LoginSchema>) {
  const validatedFields = LoginSchema.safeParse(data);

  if (!validatedFields.success) {
    return { error: 'Invalid fields.' };
  }

  const { email, password } = validatedFields.data;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return { error: 'Invalid credentials.' };
  }

  // In a real application, you would use a library like bcrypt or argon2
  // to compare the hashed password.
  // const isPasswordValid = await argon2.verify(user.password, password);
  const isPasswordValid = user.password === password;

  if (!isPasswordValid) {
    return { error: 'Invalid credentials.' };
  }

  // Here you would typically create a session, e.g., using cookies or JWTs.
  // For this example, we'll just redirect.

  return { success: true };
}
