
'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Gavel } from 'lucide-react';

export function MobileHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 md:hidden">
      <SidebarTrigger />
      <div className="flex items-center gap-2">
        <div className="bg-primary p-2 rounded-lg">
          <Gavel className="text-primary-foreground" />
        </div>
        <h2 className="text-lg font-semibold tracking-tighter text-foreground">
          LegalIntel CRM
        </h2>
      </div>
    </header>
  );
}
