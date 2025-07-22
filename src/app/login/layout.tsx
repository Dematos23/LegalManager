
'use client';

import type { ReactNode } from 'react';
import { LanguageProvider } from '@/context/language-context';


export default function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
        {children}
    </LanguageProvider>
  );
}
