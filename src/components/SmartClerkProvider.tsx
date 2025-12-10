'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { deDE } from '@clerk/localizations';
import { ReactNode, useEffect, useState } from 'react';

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

  useEffect(() => {
    // Check if this is a bot request via cookie set by middleware
    const isBot = document.cookie.includes('x-is-bot=1');

    // Only load Clerk for real users (not bots)
    setShouldLoadClerk(!isBot);
  }, []);

  // Don't load Clerk during SSR or for bots
  if (!shouldLoadClerk) {
    return <>{children}</>;
  }

  // For real users, load full Clerk functionality
  return (
    <ClerkProvider
      localization={deDE}
      telemetry={false}
      signInFallbackRedirectUrl="/input-method"
      signUpFallbackRedirectUrl="/input-method"
    >
      {children}
    </ClerkProvider>
  );
}
