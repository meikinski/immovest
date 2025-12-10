'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { deDE } from '@clerk/localizations';
import { ReactNode, useEffect, useState } from 'react';

/**
 * Client-side only ClerkProvider for interactive public pages
 * This prevents Clerk scripts from loading during SSR (for bots/Google)
 * but provides full auth functionality after hydration for real users
 *
 * ONLY used on / and /input-method for better UX
 * NOT used on /pricing to avoid Google indexing issues
 */
export function InteractiveClerkProvider({ children }: { children: ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // During SSR and initial render, return children without Clerk
  if (!isClient) {
    return <>{children}</>;
  }

  // After hydration, wrap with ClerkProvider
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
