'use client';

import React, { useState, useEffect } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { deDE } from '@clerk/localizations';
import { PaywallProvider } from '@/contexts/PaywallContext';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <ClerkProvider localization={deDE}>
      {mounted ? (
        <PaywallProvider>
          {children}
          <Toaster position="top-center" richColors />
        </PaywallProvider>
      ) : (
        <>
          {children}
          <Toaster position="top-center" richColors />
        </>
      )}
    </ClerkProvider>
  );
}
