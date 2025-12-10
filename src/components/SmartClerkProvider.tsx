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
 * Smart ClerkProvider for public pages
 *
 * - For bots (detected by middleware): Never loads Clerk
 * - For real users: Loads Clerk for full auth functionality
 *
 * This ensures:
 * ✅ Google can index without seeing Clerk scripts
 * ✅ Real users get full auth UX (profile button when logged in)
 * ✅ Professional user experience
 */
export function SmartClerkProvider({ children }: { children: ReactNode }) {
  const [shouldLoadClerk, setShouldLoadClerk] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // First, delete any stale bot cookie
    document.cookie = 'x-is-bot=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax';

    // Check user agent client-side to detect bots
    const userAgent = navigator.userAgent.toLowerCase();
    const isBot = /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot|rogerbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest|slackbot|vkShare|W3C_Validator|whatsapp/i.test(userAgent);

    // For real users (not bots), always load Clerk
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
