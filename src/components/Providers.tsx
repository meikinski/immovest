'use client';

import React from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { deDE } from '@clerk/localizations';
import { PaywallProvider } from '@/contexts/PaywallContext';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  // Always render ClerkProvider to avoid SSR/hydration issues
  // Bot detection and script blocking is handled in middleware via CSP headers
  return (
    <ClerkProvider
      localization={deDE}
      telemetry={false}
    >
      <PaywallProvider>
        {children}
        <Toaster position="top-center" richColors />
      </PaywallProvider>
    </ClerkProvider>
  );
}
