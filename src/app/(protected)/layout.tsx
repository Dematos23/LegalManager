
'use client';

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import type { ReactNode } from 'react';
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { SessionProvider } from '@/context/session-context';
import { MobileHeader } from '@/components/mobile-header';
import { PermissionGuard } from '@/components/permission-guard';

export default function ProtectedLayout({ children }: { children: ReactNode }) {
    return (
        <SessionProvider>
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <MobileHeader />
                    <PermissionGuard>
                        {children}
                    </PermissionGuard>
                </SidebarInset>
            </SidebarProvider>
        </SessionProvider>
    );
}
