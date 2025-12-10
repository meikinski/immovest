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
  const [clerkIsReady, setClerkIsReady] = useState(false);

  useEffect(() => {
    // Check if this is a bot request via cookie set by middleware
    const isBot = document.cookie.includes('x-is-bot=1');

    // Only load Clerk for real users (not bots)
    const shouldLoad = !isBot;
    setShouldLoadClerk(shouldLoad);
    setIsReady(true);

    // If we're loading Clerk, wait a bit for it to initialize
    if (shouldLoad) {
      const timer = setTimeout(() => {
        setClerkIsReady(true);
      }, 150);
      return () => clearTimeout(timer);
    } else {
      // For bots, we're immediately ready
      setClerkIsReady(false);
    }
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
    <ClerkLoadedContext.Provider value={clerkIsReady}>
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
