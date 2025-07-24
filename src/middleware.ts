
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { permissions } from './config/permissions';
import type { Role } from '@prisma/client';

export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth;
    const { pathname } = req.nextUrl;
    
    if (pathname === '/login' && token) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    
    const role = token?.role as Role | undefined;

    if (!role) {
      if (pathname !== '/login') {
        return NextResponse.redirect(new URL('/login', req.url));
      }
      return NextResponse.next();
    }

    const userPermissions = permissions[role];
    if (!userPermissions) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    
    const hasAccess = userPermissions.routes.some(allowedRoute => {
        const regex = new RegExp(`^${allowedRoute.replace(/\[.*?\]/g, '[^/]+')}$`);
        return regex.test(pathname);
    });

    if (!hasAccess) {
      // If user is trying to access a forbidden page, redirect them to their default page.
      // For simplicity, we'll redirect all unauthorized access to the dashboard.
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: () => true, // Let the middleware function handle all auth logic
    },
  }
);

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|logo.png).*)'],
};
