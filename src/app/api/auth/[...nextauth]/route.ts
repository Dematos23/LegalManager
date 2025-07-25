
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { loginAction } from '@/app/login/actions';
import { authOptions } from '@/lib/auth';


const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
