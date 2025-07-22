
'use client';

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { MobileHeader } from '@/components/mobile-header';
import type { ReactNode } from 'react';

export function MainLayout({ children }: { children: ReactNode }) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <MobileHeader />
                {children}
            </SidebarInset>
        </SidebarProvider>
    );
}
