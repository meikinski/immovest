'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { deDE } from '@clerk/localizations';
import { ReactNode, createContext, useContext, useEffect, useState } from 'react';

/**
 * Context to check if Clerk is loaded
 */
const ClerkLoadedContext = createContext<boolean>(false);

export function useIsClerkLoaded() {
  return useContext(ClerkLoadedContext);
}

/**
 * Smart ClerkProvider for public pages (like /pricing)
 *
 * Features:
 * - Bot Detection: Bots/Google never see Clerk scripts (no indexing issues)
 * - Smart Loading: Real users get Clerk for full auth functionality
 * - Context API: Provides ClerkLoadedContext for components
 *
 * This ensures:
 * ✅ Google can index without Clerk redirect errors
 * ✅ Real users get full auth UX (profile button when logged in)
 * ✅ Professional user experience
 */
export function SmartClerkProvider({ children }: { children: ReactNode }) {
  const [shouldLoadClerk, setShouldLoadClerk] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
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
    setIsReady(true);
  }, []);

  // During SSR, don't load Clerk
  if (!isReady) {
    return (
      <ClerkLoadedContext.Provider value={false}>
        {children}
      </ClerkLoadedContext.Provider>
    );
  }

  // For bots, don't load Clerk
  if (!shouldLoadClerk) {
    return (
      <ClerkLoadedContext.Provider value={false}>
        {children}
      </ClerkLoadedContext.Provider>
    );
  }

  // For real users, load full Clerk functionality
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
