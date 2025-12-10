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
  const isBotRequest = isBot(userAgent);

  // For bot requests on public routes, set a cookie to signal bot traffic
  if (isPublicRoute(req) && isBotRequest) {
    const response = NextResponse.next();

    // Set cookie to indicate bot traffic (client can check this)
    response.cookies.set('x-is-bot', '1', {
      httpOnly: false, // Client needs to read this
      maxAge: 60, // Short lived (1 minute)
      sameSite: 'lax',
    });

    return response;
  }

  // For real user requests on public routes, ensure bot cookie is cleared
  if (isPublicRoute(req) && !isBotRequest) {
    const response = NextResponse.next();
    response.cookies.delete('x-is-bot');
    return response;
  }

  // Skip Clerk processing for public routes
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