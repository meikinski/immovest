import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Routen die Auth benötigen
const isProtectedRoute = createRouteMatcher([
  '/api/calculations(.*)',
  '/api/user(.*)',
]);

// Public routes that should NEVER redirect (important for Google indexing)
const isPublicRoute = createRouteMatcher([
  '/',
  '/pricing',
  '/input-method',
  '/impressum',
  '/datenschutz',
  '/agb',
]);

export default clerkMiddleware(async (auth, req) => {
  // Skip middleware entirely for public routes to avoid any redirect issues
  if (isPublicRoute(req)) {
    return;
  }

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