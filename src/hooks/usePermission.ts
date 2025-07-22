
'use client';

import { useMemo } from 'react';
import { permissions, type Action } from '@/config/permissions';
import type { Role } from '@prisma/client';
import { useSession } from '@/context/session-context';

export function usePermission() {
  const { role } = useSession();

  const userPermissions = useMemo(() => {
    return permissions[role] || { routes: [], actions: [], menus: [] };
  }, [role]);

  const canAccessRoute = (path: string): boolean => {
    if (role === 'ADMIN') return true;
    
    const baseRoute = path.split('/')[1] || '';
    const checkRoute = `/${baseRoute}`;

    return userPermissions.routes.some(allowedRoute => {
        if (allowedRoute.endsWith('/*')) {
            return checkRoute.startsWith(allowedRoute.slice(0, -2));
        }
        return checkRoute === allowedRoute;
    });
  };

  const canSeeMenu = (menu: string): boolean => {
    if (role === 'ADMIN') return true;
    return userPermissions.menus.includes(menu);
  };

  const canPerform = (action: Action): boolean => {
    if (role === 'ADMIN') return true;
    return userPermissions.actions.includes(action);
  };

  return { canAccessRoute, canSeeMenu, canPerform };
}
