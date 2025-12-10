import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

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

// Detect if request is from a bot
function isBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  const botPatterns = [
    'googlebot',
    'bingbot',
    'slurp',
    'duckduckbot',
    'baiduspider',
    'yandexbot',
    'facebookexternalhit',
    'twitterbot',
    'rogerbot',
    'linkedinbot',
    'embedly',
    'quora link preview',
    'showyoubot',
    'outbrain',
    'pinterest',
    'google-structured-data-testing-tool',
    'developers.google.com/+/web/snippet',
  ];

  return botPatterns.some(pattern => ua.includes(pattern));
}

export default clerkMiddleware(async (auth, req) => {
  const userAgent = req.headers.get('user-agent') || '';

  // For public routes with bot user-agents, block Clerk external scripts via CSP
  if (isPublicRoute(req) && isBot(userAgent)) {
    const response = NextResponse.next();

    // Set CSP header to block Clerk's external domain
    // This prevents the redirect error Google sees when Clerk scripts load
    response.headers.set(
      'Content-Security-Policy',
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://stats.g.doubleclick.net; " +
      "connect-src 'self' https://stats.g.doubleclick.net; " +
      "default-src *;"
    );

    return response;
  }

  // Skip Clerk processing for public routes (non-bot traffic)
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