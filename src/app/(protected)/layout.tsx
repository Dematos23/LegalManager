
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
<<<<<<< HEAD
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
=======
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
>>>>>>> 207140b (after loging in check the permission of the user to validate the menus a)
    );
}
