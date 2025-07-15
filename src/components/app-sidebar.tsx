
'use client';

import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarContent,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  LayoutDashboard,
  FileUp,
  Settings,
  LayoutTemplate,
  Languages,
  History,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/context/language-context';
import Image from 'next/image';

export function AppSidebar() {
  const pathname = usePathname();
  const { language, dictionary, switchLanguage } = useLanguage();

  const isActive = (path: string) => {
    // Exact match for root, partial for others
    return path === '/' ? pathname === path : pathname.startsWith(path);
  };

  const currentLanguageLabel = language === 'es' ? dictionary.sidebar.spanish : dictionary.sidebar.english;

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <div className="bg-white p-1 rounded-lg">
            <Image src="/logo.png" alt="Legal CRM Logo" width={32} height={32} />
          </div>
          <h2 className="text-lg font-semibold tracking-tighter text-sidebar-foreground">
            Legal CRM
          </h2>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/" passHref>
              <SidebarMenuButton
                isActive={isActive('/')}
                tooltip={{ children: dictionary.sidebar.dashboard }}
              >
                <LayoutDashboard />
                <span>{dictionary.sidebar.dashboard}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/import" passHref>
              <SidebarMenuButton
                isActive={isActive('/import')}
                tooltip={{ children: dictionary.sidebar.import }}
              >
                <FileUp />
                <span>{dictionary.sidebar.import}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/templates" passHref>
              <SidebarMenuButton
                isActive={isActive('/templates')}
                tooltip={{ children: dictionary.sidebar.templates }}
              >
                <LayoutTemplate />
                <span>{dictionary.sidebar.templates}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
           <SidebarMenuItem>
            <Link href="/tracking" passHref>
              <SidebarMenuButton
                isActive={isActive('/tracking')}
                tooltip={{ children: dictionary.sidebar.tracking }}
              >
                <History />
                <span>{dictionary.sidebar.tracking}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton tooltip={{ children: dictionary.sidebar.language, side: 'right', align: 'center' }}>
                  <Languages />
                  <span>{currentLanguageLabel}</span>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start">
                <DropdownMenuItem onSelect={() => switchLanguage('en')}>
                  {dictionary.sidebar.english}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => switchLanguage('es')}>
                  {dictionary.sidebar.spanish}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={{ children: dictionary.sidebar.settings }}>
              <Settings />
              <span>{dictionary.sidebar.settings}</span>
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
