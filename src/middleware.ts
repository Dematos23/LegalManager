import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { permissions } from './config/permissions';
import type { Role } from '@prisma/client';

export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth;
    const { pathname } = req.nextUrl;
    
    // Allow access to login page
    if (pathname === '/login') {
        return NextResponse.next();
    }
    
    // Redirect to login if no token
    if (!token) {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    // If on login page with token, redirect to a default page
    if (pathname === '/login' && token) {
        return NextResponse.redirect(new URL('/trademarks', req.url));
    }
    
    const role = token?.role as Role | undefined;

    if (!role) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    const userPermissions = permissions[role];
    if (!userPermissions) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    
    const hasAccess = userPermissions.routes.some(allowedRoute => {
        // Exact match for simple routes
        if (allowedRoute === pathname) return true;
        // Handle dynamic routes like /trademarks/[id]
        if (allowedRoute.includes('[id]')) {
            const baseRoute = allowedRoute.split('/[id]')[0];
            if (pathname.startsWith(baseRoute) && pathname.split('/').length === allowedRoute.split('/').length) {
                return true;
            }
        }
        // Handle dynamic routes like /templates/edit/[id]
        if (allowedRoute.includes('[id]')) {
             const regex = new RegExp(`^${allowedRoute.replace(/\[.*?\]/g, '[^/]+')}$`);
             return regex.test(pathname);
        }
        return false;
    });

    if (!hasAccess) {
      const fallbackRoute = userPermissions.routes[0] || '/login';
      return NextResponse.redirect(new URL(fallbackRoute, req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
     pages: {
        signIn: '/login',
    },
  }
);

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|logo.png).*)'],
};
