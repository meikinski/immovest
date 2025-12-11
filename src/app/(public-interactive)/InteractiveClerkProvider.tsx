'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { deDE } from '@clerk/localizations';
import { ReactNode, createContext, useContext, useEffect, useState } from 'react';

/**
 * Context to check if Clerk is loaded
 * Shared with SmartClerkProvider for consistency
 */
const ClerkLoadedContext = createContext<boolean>(false);

export function useIsClerkLoaded() {
  return useContext(ClerkLoadedContext);
}

/**
 * Client-side only ClerkProvider for interactive public pages
 *
 * Features:
 * - Bot Detection: Bots/Google never see Clerk scripts (no indexing issues)
 * - Smart Loading: Real users get Clerk after hydration for full auth UX
 * - Context API: Provides ClerkLoadedContext for components like AuthUI
 *
 * This ensures:
 * ✅ Google can index without Clerk redirect errors
 * ✅ Real users see profile button when logged in
 * ✅ Professional UX with proper auth state
 */
export function InteractiveClerkProvider({ children }: { children: ReactNode }) {
  const [isClient, setIsClient] = useState(false);
  const [shouldLoadClerk, setShouldLoadClerk] = useState(false);

  useEffect(() => {
    setIsClient(true);

    // Check if this is a bot request
    // 1. Check middleware cookie (server-side bot detection)
    const botCookie = document.cookie.split('; ').find(row => row.startsWith('x-is-bot='));
    const isBotFromMiddleware = botCookie?.split('=')[1] === '1';

    // 2. Client-side user agent check (backup)
    const userAgent = navigator.userAgent.toLowerCase();
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
      'slackbot',
      'vkshare',
      'w3c_validator',
      'whatsapp',
    ];
    const isBotFromUA = botPatterns.some(pattern => userAgent.includes(pattern));

    // Only load Clerk for real users (not bots)
    const isBot = isBotFromMiddleware || isBotFromUA;
    setShouldLoadClerk(!isBot);
  }, []);

  // During SSR and initial render, return children without Clerk
  if (!isClient) {
    return (
      <ClerkLoadedContext.Provider value={false}>
        {children}
      </ClerkLoadedContext.Provider>
    );
  }

  // If this is a bot, never load Clerk
  if (!shouldLoadClerk) {
    return (
      <ClerkLoadedContext.Provider value={false}>
        {children}
      </ClerkLoadedContext.Provider>
    );
  }

  // For real users, wrap with ClerkProvider after hydration
  return (
    <ClerkLoadedContext.Provider value={true}>
      <ClerkProvider
        localization={deDE}
        telemetry={false}
        signInFallbackRedirectUrl="/input-method"
        signUpFallbackRedirectUrl="/input-method"
      >
        {children}
      </ClerkProvider>
    </ClerkLoadedContext.Provider>
  );
}
