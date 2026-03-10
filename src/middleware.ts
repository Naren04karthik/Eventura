// Middleware for Authentication and Authorization
// Protects routes and checks user roles

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

// Define routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/user/dashboard',
  '/admin',
  '/admin/dashboard',
  '/superadmin',
  '/superadmin/dashboard',
  '/organizer',
  '/organizer/dashboard',
  '/waiting-for-approval',
  '/request-rejected',
  '/complete-profile',
  '/events',
  '/browse',
  '/bookmarks',
  '/profile',
  '/settings',
  '/api/events',
  '/api/users',
  '/api/registrations',
  '/api/bookmarks',
  '/api/admin',
  '/api/organiser',
  '/api/organizer',
  '/api/profile',
];

// Define routes that are public (no auth required)
const publicRoutes = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
  '/api/auth/superadmin/login',
  '/api/organiser/register',
  '/api/organiser/status',
  '/api/contact/admin-request',
  '/api/colleges',
];

// Define routes that should be accessible even with incomplete profile
const profileExemptRoutes = [
  '/complete-profile',
  '/api/profile/complete',
  '/api/auth/logout',
  '/api/auth/me', // Allow checking auth status
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is public
  const isPublic = publicRoutes.some((route) => pathname.startsWith(route));
  if (isPublic) {
    return NextResponse.next();
  }

  // Check if the route requires authentication
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Get token from cookie (use 'auth_token' to match what's set in auth.ts)
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    // Redirect to login for dashboard routes
    if (pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Return 401 for API routes
    return NextResponse.json(
      {
        success: false,
        error: 'Not authenticated',
      },
      { status: 401 }
    );
  }

  // Verify token
  const payload = await verifyToken(token);

  if (!payload) {
    // Clear invalid cookie
    const response = pathname.startsWith('/dashboard')
      ? NextResponse.redirect(new URL('/login', request.url))
      : NextResponse.json(
          {
            success: false,
            error: 'Invalid or expired token',
          },
          { status: 401 }
        );

    response.cookies.delete('auth_token');
    return response;
  }

  const role = payload.role;
  const status = payload.status;
  const isProfileComplete = payload.isProfileComplete ?? false;
  const isApiRoute = pathname.startsWith('/api');

  // Check if profile completion is required
  // Skip for admins, superadmins, and profile-exempt routes
  const isProfileExempt = profileExemptRoutes.some((route) => pathname.startsWith(route));
  if (
    !isProfileComplete &&
    !isProfileExempt &&
    role !== 'SUPERADMIN' &&
    role !== 'ADMIN'
  ) {
    // For organizers, only redirect if they are ACTIVE
    if (role === 'ORGANIZER' && status !== 'ACTIVE') {
      // Let pending/rejected organizers continue to their status pages
    } else {
      // Redirect to complete-profile page
      if (isApiRoute) {
        return NextResponse.json(
          {
            success: false,
            error: 'Profile completion required',
            redirect: '/complete-profile',
          },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL('/complete-profile', request.url));
    }
  }

  const roleRedirect = () => {
    if (role === 'ADMIN') return '/admin/dashboard';
    if (role === 'SUPERADMIN') return '/superadmin/dashboard';
    if (role === 'ORGANIZER') {
      if (status === 'ACTIVE') return '/organizer/dashboard';
      if (status === 'PENDING') return '/waiting-for-approval';
      return '/request-rejected';
    }
    return '/user/dashboard';
  };

  if (!isApiRoute) {
    if (pathname === '/dashboard') {
      return NextResponse.redirect(new URL(roleRedirect(), request.url));
    }

    if (pathname.startsWith('/user/dashboard') && role !== 'USER') {
      return NextResponse.redirect(new URL(roleRedirect(), request.url));
    }

    if (pathname.startsWith('/admin') && role !== 'ADMIN') {
      return NextResponse.redirect(new URL(roleRedirect(), request.url));
    }

    if (pathname.startsWith('/superadmin') && role !== 'SUPERADMIN') {
      return NextResponse.redirect(new URL(roleRedirect(), request.url));
    }

    if (pathname.startsWith('/organizer')) {
      if (role !== 'ORGANIZER') {
        return NextResponse.redirect(new URL(roleRedirect(), request.url));
      }

      if (status !== 'ACTIVE' && pathname.startsWith('/organizer/dashboard')) {
        return NextResponse.redirect(new URL(roleRedirect(), request.url));
      }
    }

    if (pathname.startsWith('/waiting-for-approval')) {
      if (role !== 'ORGANIZER' || status !== 'PENDING') {
        return NextResponse.redirect(new URL(roleRedirect(), request.url));
      }
    }

    if (pathname.startsWith('/request-rejected')) {
      if (role !== 'ORGANIZER' || (status !== 'REJECTED' && status !== 'SUSPENDED')) {
        return NextResponse.redirect(new URL(roleRedirect(), request.url));
      }
    }
  }

  // Add user info to request headers for downstream use
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.userId);
  requestHeaders.set('x-user-email', payload.email);
  requestHeaders.set('x-user-role', payload.role);
  requestHeaders.set('x-user-status', payload.status);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
