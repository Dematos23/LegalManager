
'use client';

import type { ReactNode } from 'react';
import { LanguageProvider } from '@/context/language-context';
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';


export default function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <NextAuthSessionProvider>
        <LanguageProvider>
            {children}
        </LanguageProvider>
    </NextAuthSessionProvider>
  );
}
