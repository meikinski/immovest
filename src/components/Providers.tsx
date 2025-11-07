'use client';

import React from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { deDE } from '@clerk/localizations';
import { PaywallProvider } from '@/contexts/PaywallContext';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider localization={deDE}>
      <PaywallProvider>
        {children}
        <Toaster position="top-center" richColors />
      </PaywallProvider>
    </ClerkProvider>
  );
}
