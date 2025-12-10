'use client';

import React from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { deDE } from '@clerk/localizations';
import { PaywallProvider } from '@/contexts/PaywallContext';
import { Toaster } from 'sonner';

// Detect if the current visitor is a bot
function isBot(): boolean {
  if (typeof window === 'undefined') return false;

  const userAgent = window.navigator.userAgent.toLowerCase();
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
    'developers.google.com/+/web/snippet',
  ];

  return botPatterns.some(pattern => userAgent.includes(pattern));
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [isBotDetected, setIsBotDetected] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    // Detect bots on client-side
    setIsBotDetected(isBot());
  }, []);

  // While detecting, render without Clerk to avoid flash
  if (isBotDetected === null) {
    return (
      <PaywallProvider>
        {children}
        <Toaster position="top-center" richColors />
      </PaywallProvider>
    );
  }

  // If bot detected, skip ClerkProvider entirely to avoid loading external scripts
  if (isBotDetected) {
    return (
      <PaywallProvider>
        {children}
        <Toaster position="top-center" richColors />
      </PaywallProvider>
    );
  }

  // Normal users get full Clerk functionality
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
