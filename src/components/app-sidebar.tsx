
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
  Briefcase,
  Users,
  LogOut,
  User
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/context/language-context';
import Image from 'next/image';
import { useSession } from '@/context/session-context';
import { usePermission } from '@/hooks/usePermission';

export function AppSidebar() {
  const pathname = usePathname();
  const { language, dictionary, switchLanguage } = useLanguage();
  const { user, logout } = useSession();
  const { canSeeMenu } = usePermission();
  const router = useRouter();


  const isActive = (path: string) => {
    return pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
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
            Estudio Delion
          </h2>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {canSeeMenu('dashboard') && (
            <SidebarMenuItem>
              <Link href="/dashboard" passHref>
                <SidebarMenuButton
                  isActive={isActive('/dashboard')}
                  tooltip={{ children: dictionary.sidebar.dashboard }}
                >
                  <LayoutDashboard />
                  <span>{dictionary.sidebar.dashboard}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          )}
<<<<<<< HEAD
           {canSeeMenu('agents') && (
              <SidebarMenuItem>
                <Link href="/agents" passHref>
                  <SidebarMenuButton
                    isActive={isActive('/agents')}
                    tooltip={{ children: dictionary.sidebar.agents }}
                  >
                    <Briefcase />
                    <span>{dictionary.sidebar.agents}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
           )}
=======
          {canSeeMenu('agents') && (
            <SidebarMenuItem>
              <Link href="/agents" passHref>
                <SidebarMenuButton
                  isActive={isActive('/agents')}
                  tooltip={{ children: dictionary.sidebar.agents }}
                >
                  <Briefcase />
                  <span>{dictionary.sidebar.agents}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          )}
>>>>>>> 207140b (after loging in check the permission of the user to validate the menus a)
          {canSeeMenu('import') && (
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
          )}
          {canSeeMenu('templates') && (
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
          )}
<<<<<<< HEAD
           {canSeeMenu('tracking') && (
=======
          {canSeeMenu('tracking') && (
>>>>>>> 207140b (after loging in check the permission of the user to validate the menus a)
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
<<<<<<< HEAD
           )}
=======
          )}
>>>>>>> 207140b (after loging in check the permission of the user to validate the menus a)
          {canSeeMenu('users') && (
            <SidebarMenuItem>
              <Link href="/users" passHref>
                <SidebarMenuButton
                  isActive={isActive('/users')}
                  tooltip={{ children: dictionary.sidebar.users }}
                >
                  <Users />
                  <span>{dictionary.sidebar.users}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
             <SidebarMenuButton onClick={handleLogout} tooltip={{ children: dictionary.sidebar.logout }}>
                <LogOut />
                <span>{dictionary.sidebar.logout}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
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
            <div className="flex items-center gap-3 p-2">
              <Avatar className="h-9 w-9">
                <AvatarFallback>
                  <User />
                </AvatarFallback>
              </Avatar>
              {user ? (
                <div className="flex flex-col overflow-hidden">
                  <span className="font-medium text-sm truncate">{`${user.firstName} ${user.lastName}`}</span>
                  <span className="text-xs text-sidebar-foreground/70 truncate">
                    {user.email}
                  </span>
                </div>
              ) : (
                 <div className="flex flex-col overflow-hidden">
                  <span className="font-medium text-sm truncate">...</span>
                  <span className="text-xs text-sidebar-foreground/70 truncate">
                    ...
                  </span>
                </div>
              )}
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
