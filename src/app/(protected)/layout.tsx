
'use client';

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import type { ReactNode } from 'react';
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { SessionProvider } from '@/context/session-context';
import { MobileHeader } from '@/components/mobile-header';

export default function ProtectedLayout({ children }: { children: ReactNode }) {
    return (
        <NextAuthSessionProvider>
            <SessionProvider>
                <SidebarProvider>
                    <AppSidebar />
                    <SidebarInset>
                        <MobileHeader />
                        {children}
                    </SidebarInset>
                </SidebarProvider>
            </SessionProvider>
        </NextAuthSessionProvider>
    );
}
