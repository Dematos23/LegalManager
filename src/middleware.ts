
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { permissions } from './config/permissions';
import type { Role } from '@prisma/client';

export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth;
    const { pathname } = req.nextUrl;
    
    // Add user ID to the request headers so server actions can access it
    const requestHeaders = new Headers(req.headers);
    if (token?.id) {
      requestHeaders.set('X-User-Id', token.id as string);
    }
    
    const role = token?.role as Role | undefined;

    if (!role) {
      // If no role, redirect to login unless they are already there
      if (pathname !== '/login') {
        return NextResponse.redirect(new URL('/login', req.url));
      }
      return NextResponse.next({ request: { headers: requestHeaders } });
    }

    const userPermissions = permissions[role];
    if (!userPermissions) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    
    // Check if the user's role has access to the requested route
    const baseRoute = '/' + (pathname.split('/')[1] || '');
    const hasAccess = userPermissions.routes.some(allowedRoute => {
        if (allowedRoute.endsWith('/*')) {
            // e.g., /trademarks/* should match /trademarks/123
            return baseRoute.startsWith(allowedRoute.slice(0, -2));
        }
        return baseRoute === allowedRoute;
    });

    if (!hasAccess && pathname !== '/login') {
      // If no access, redirect to their default allowed page or dashboard
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
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
  // Match all routes except for static files and the API folder
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|logo.png).*)'],
};
