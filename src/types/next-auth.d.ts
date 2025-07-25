
import { Role } from '@prisma/client';
import NextAuth, { DefaultSession, DefaultUser } from 'next-auth';
import { JWT, DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: Role;
      firstName: string;
      lastName: string;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    role: Role;
    firstName: string;
    lastName: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    role: Role;
    firstName: string;
    lastName: string;
  }
}
