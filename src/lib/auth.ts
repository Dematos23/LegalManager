
import type { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { User } from '@prisma/client';
import { loginAction } from '@/app/login/actions';

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials) return null;

        const result = await loginAction({
          email: credentials.email,
          password: credentials.password,
        });

        if (result.success) {
          // Destructure to remove password before returning
          const { password: _, ...userWithoutPassword } = result.user;
          return userWithoutPassword as any;
        }
        
        return null;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      // After sign in, `user` is passed, which contains role and other details.
      // We persist this in the token.
      if (user) {
        const u = user as User;
        token.id = u.id;
        token.role = u.role;
        token.firstName = u.firstName;
        token.lastName = u.lastName;
      }
      return token;
    },
    async session({ session, token }) {
      // Pass the role and other user details to the session object
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as User['role'];
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login', // Redirect to login on error
  },
};
