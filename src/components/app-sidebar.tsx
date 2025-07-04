'use client';

import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarContent,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  LayoutDashboard,
  FileUp,
  Settings,
  Gavel,
  LayoutTemplate,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function AppSidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    // Exact match for root, partial for others
    return path === '/' ? pathname === path : pathname.startsWith(path);
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <div className="bg-primary p-2 rounded-lg">
            <Gavel className="text-primary-foreground" />
          </div>
          <h2 className="text-lg font-semibold tracking-tighter font-headline text-sidebar-foreground">
            LegalIntel CRM
          </h2>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/" passHref>
              <SidebarMenuButton
                isActive={isActive('/')}
                tooltip={{ children: 'Dashboard' }}
              >
                <LayoutDashboard />
                <span>Dashboard</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/import" passHref>
              <SidebarMenuButton
                isActive={isActive('/import')}
                tooltip={{ children: 'Import Data' }}
              >
                <FileUp />
                <span>Import</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/templates" passHref>
              <SidebarMenuButton
                isActive={isActive('/templates')}
                tooltip={{ children: 'Email Templates' }}
              >
                <LayoutTemplate />
                <span>Templates</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={{ children: 'Settings' }}>
              <Settings />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <div className="flex items-center gap-3 p-2">
              <Avatar className="h-9 w-9">
                <AvatarImage src="https://placehold.co/100x100" alt="@user" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden">
                <span className="font-medium text-sm truncate">John Doe</span>
                <span className="text-xs text-sidebar-foreground/70 truncate">
                  john.doe@legalfirm.com
                </span>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
