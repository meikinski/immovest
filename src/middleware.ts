import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Routen die Auth benötigen
const isProtectedRoute = createRouteMatcher([
  '/api/calculations(.*)',
  '/api/user(.*)',
]);

// Public routes - no auth required but Clerk still initializes (for SSR auth checks)
const isPublicRoute = createRouteMatcher([
  '/',
  '/pricing',
  '/input-method',
  '/impressum',
  '/datenschutz',
  '/agb',
]);

/**
 * Middleware for authentication
 *
 * Strategy for Google indexing:
 * - Public routes: Clerk initializes (for SSR auth()) but no redirects
 * - Protected routes: Full Clerk authentication
 * - Client-side: We prevent Clerk JS loading via layout (AuthProvider)
 *
 * This ensures:
 * ✅ SSR auth() works on public pages
 * ✅ No Clerk client-side JS on public pages (handled in layout)
 * ✅ No redirect errors in Google Search Console
 */
export default clerkMiddleware(async (auth, req) => {
  // Public routes: let them through (no auth required)
  if (isPublicRoute(req)) {
    return;
  }

  // Protected routes: require authentication
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};