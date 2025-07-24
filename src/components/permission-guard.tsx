
'use client';

import { usePermission } from '@/hooks/usePermission';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useSession } from '@/context/session-context';
import { permissions } from '@/config/permissions';

export function PermissionGuard({ children }: { children: ReactNode }) {
  const { canAccessRoute } = usePermission();
  const { user } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (user && !canAccessRoute(pathname)) {
        // If the user can't access the route, redirect them to the first route they CAN access.
        const userPermissions = permissions[user.role];
        let fallbackRoute = userPermissions?.routes[0] || '/login';
        if (fallbackRoute === '/') {
            fallbackRoute = '/trademarks'
        }
        router.replace(fallbackRoute);
    }
  }, [pathname, user, canAccessRoute, router]);

  if (!user || !canAccessRoute(pathname)) {
    // Render nothing or a loading spinner while redirecting
    return null;
  }

  return <>{children}</>;
}
