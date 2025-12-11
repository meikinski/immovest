import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that should NEVER use Clerk middleware (for Google indexing)
const publicRoutes = [
  '/',
  '/pricing',
  '/input-method',
  '/impressum',
  '/datenschutz',
  '/agb',
];

// Routen die Auth benötigen
const isProtectedRoute = createRouteMatcher([
  '/api/calculations(.*)',
  '/api/user(.*)',
]);

/**
 * Main middleware function
 */
const clerkMiddlewareHandler = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

/**
 * Middleware for authentication and public route handling
 *
 * CRITICAL for Google indexing:
 * - Public routes SKIP clerkMiddleware entirely (no Clerk scripts injected)
 * - Protected routes use full Clerk authentication
 *
 * This ensures:
 * ✅ Google sees NO Clerk JavaScript on public pages
 * ✅ No redirect errors in Google Search Console
 * ✅ Perfect indexing
 */
export default function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // For public routes: bypass Clerk entirely (critical for indexing!)
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // For all other routes: use Clerk middleware
  return clerkMiddlewareHandler(req, {} as any);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};