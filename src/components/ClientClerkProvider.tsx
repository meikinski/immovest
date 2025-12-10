'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { deDE } from '@clerk/localizations';
import { ReactNode, useEffect, useState } from 'react';

/**
 * Client-side only ClerkProvider that loads after hydration
 * This prevents Clerk scripts from loading during SSR (for bots/Google)
 * but provides full auth functionality for real users
 */
export function ClientClerkProvider({ children }: { children: ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Only run on client after hydration
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
