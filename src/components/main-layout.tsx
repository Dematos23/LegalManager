
'use client';

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import type { ReactNode } from 'react';
import { SessionProvider } from '@/context/session-context';
import { MobileHeader } from './mobile-header';

export function MainLayout({ children }: { children: ReactNode }) {
    return (
        <SessionProvider>
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <MobileHeader />
                    {children}
                </SidebarInset>
            </SidebarProvider>
        </SessionProvider>
    );
}
