
'use client';

import { useMemo } from 'react';
import { permissions, type Action } from '@/config/permissions';
import type { Role } from '@prisma/client';
import { useSession } from '@/context/session-context';

export function usePermission() {
  const { user } = useSession();
  const role = user?.role;

  const userPermissions = useMemo(() => {
    if (!role) return { routes: [], actions: [], menus: [] };
    return permissions[role] || { routes: [], actions: [], menus: [] };
  }, [role]);

  const canAccessRoute = (path: string): boolean => {
    if (role === 'ADMIN') return true;
    if (!role) return false;
    
    // Handle the root path explicitly
    if (path === '/') return true;

    const baseRoute = '/' + (path.split('/')[1] || '');

    return userPermissions.routes.some(allowedRoute => {
        if (allowedRoute.endsWith('/*')) {
            return baseRoute.startsWith(allowedRoute.slice(0, -2));
        }
        return baseRoute === allowedRoute;
    });
  };

  const canSeeMenu = (menu: string): boolean => {
    if (role === 'ADMIN') return true;
    if (!role) return false;
    return userPermissions.menus.includes(menu);
  };

  const canPerform = (action: Action): boolean => {
    if (role === 'ADMIN') return true;
    if (!role) return false;
    return userPermissions.actions.includes(action);
  };

  return { canAccessRoute, canSeeMenu, canPerform };
}
