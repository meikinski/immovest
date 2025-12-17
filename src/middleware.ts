import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routen die Auth benötigen
const isProtectedRoute = createRouteMatcher([
  '/api/calculations(.*)',
  '/api/user(.*)',
]);

// Static public routes - COMPLETELY skip Clerk middleware (no initialization at all)
const isStaticPublicRoute = createRouteMatcher([
  '/',
  '/pricing',
  '/input-method',
]);

// Other public routes - Clerk initializes but no auth required
const isPublicRoute = createRouteMatcher([
  '/impressum',
  '/datenschutz',
  '/agb',
]);

/**
 * Middleware for authentication
 *
 * Strategy for Google indexing (FIXED):
 * - Static public routes (/, /pricing, /input-method): SKIP Clerk entirely
 * - Other public routes: Clerk initializes but no redirects
 * - Protected routes: Full Clerk authentication
 *
 * This ensures:
 * ✅ No Clerk initialization on static public pages → No redirect errors
 * ✅ Perfect crawlability for Google
 * ✅ Auth works on protected pages
 */

// Create Clerk middleware instance
const clerkMiddlewareInstance = clerkMiddleware(async (auth, req) => {
  // Other public routes: let them through (no auth required)
  if (isPublicRoute(req)) {
    return;
  }

  // Protected routes: require authentication
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

// Main middleware that decides whether to use Clerk or not
export default function middleware(req: NextRequest) {
  // Static public routes: Skip Clerk completely (bypass clerkMiddleware entirely)
  if (isStaticPublicRoute(req)) {
    return NextResponse.next();
  }

  // All other routes: Use Clerk middleware
  return clerkMiddlewareInstance(req);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};