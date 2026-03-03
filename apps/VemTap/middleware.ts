import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Middleware (Edge Runtime)
 * Protects /dashboard routes from unauthorized access.
 * 
 * Since Zustand persists auth in localStorage (client-only),
 * we sync an `vemtap-auth-token` cookie on login/logout
 * so that this middleware can verify authentication.
 */
export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check for the auth token cookie
    const authToken = request.cookies.get('vemtap-auth-token')?.value;

    // Protected routes: /dashboard and all sub-routes
    const isProtectedRoute = pathname.startsWith('/dashboard');

    // Auth pages that logged-in users should be redirected away from
    const isAuthPage = pathname === '/login' || pathname === '/get-started';

    if (isProtectedRoute && !authToken) {
        // Unauthorized user trying to access dashboard → redirect to login
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    if (isAuthPage && authToken) {
        // Already authenticated user on login/signup page → redirect to dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

// Only run middleware on these paths
export const config = {
    matcher: [
        '/dashboard/:path*',
        '/login',
        '/get-started',
    ],
};
