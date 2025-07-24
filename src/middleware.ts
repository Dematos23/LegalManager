
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { permissions } from './config/permissions';
import type { Role } from '@prisma/client';

export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth;
    const { pathname } = req.nextUrl;
    
    const requestHeaders = new Headers(req.headers);
    if (token?.id) {
      requestHeaders.set('X-User-Id', token.id as string);
    }
    
    const role = token?.role as Role | undefined;

    if (!role) {
      if (pathname !== '/login') {
        return NextResponse.redirect(new URL('/login', req.url));
      }
      return NextResponse.next({ request: { headers: requestHeaders } });
    }

    const userPermissions = permissions[role];
    if (!userPermissions) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    
    const hasAccess = userPermissions.routes.some(allowedRoute => {
        const regex = new RegExp(`^${allowedRoute.replace(/\[.*?\]/g, '[^/]+')}$`);
        return regex.test(pathname);
    });

    if (!hasAccess && pathname !== '/login') {
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
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|logo.png).*)'],
};
