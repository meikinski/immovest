import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest, NextFetchEvent } from 'next/server';
import { sichererPfad } from '@/lib/anmeldeLinks';

// Routen die Auth benötigen
const isProtectedRoute = createRouteMatcher([
  '/api/calculations(.*)',
  '/api/user(.*)',
]);

// Static public routes - COMPLETELY skip Clerk middleware (no initialization at all)
const isStaticPublicRoute = createRouteMatcher([
  '/',
  '/pricing',
  '/blog',
  '/blog/(.*)',
  '/rechner/(.*)',
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
 * - Static public routes (/, /pricing, /blog, /blog/.*, /rechner/.*): SKIP Clerk entirely
 * - Other public routes: Clerk initializes but no redirects
 * - Protected routes: Full Clerk authentication
 *
 * This ensures:
 * ✅ No Clerk initialization on static public pages → No redirect errors
 * ✅ Perfect crawlability for Google
 * ✅ Auth works on protected pages
 */

// Einstiegsseiten der Anmeldung (ohne Clerks Unterschritte wie /sign-in/sso-callback)
const isAuthEntry = (req: NextRequest) => req.nextUrl.pathname === '/sign-in' || req.nextUrl.pathname === '/sign-up';

// Create Clerk middleware instance
const clerkMiddlewareInstance = clerkMiddleware(async (auth, req) => {
  // Bereits angemeldet: sofort serverseitig weiter, statt eine leere Anmeldeseite zu laden
  // (sonst zählt GA4 einen Sekunden-Besuch auf /sign-in bzw. /sign-up)
  if (isAuthEntry(req)) {
    const { userId } = await auth();
    if (userId) {
      const ziel = sichererPfad(req.nextUrl.searchParams.get('redirect_url')) ?? '/input-method';
      return NextResponse.redirect(new URL(ziel, req.url));
    }
    return;
  }

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
export default function middleware(req: NextRequest, event: NextFetchEvent) {
  // Static public routes: Skip Clerk completely (bypass clerkMiddleware entirely)
  if (isStaticPublicRoute(req)) {
    return NextResponse.next();
  }

  // All other routes: Use Clerk middleware
  return clerkMiddlewareInstance(req, event);
}

export const config = {
  matcher: [
    // Skip Next.js internals, the Sentry tunnel (/monitoring) and all static files
    '/((?!_next|monitoring|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};