'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { useAuth } from '@clerk/nextjs';
import { premiumStatusAbrufen } from '@/lib/premiumStatus';
import { GRATIS_ANALYSEN } from '@/lib/preise';

type PaywallContextType = {
  isPremium: boolean;
  premiumUsageCount: number;
  canAccessPremium: boolean;
  incrementPremiumUsage: () => void;
  showUpgradeModal: boolean;
  setShowUpgradeModal: (show: boolean) => void;
  refreshPremiumStatus: () => Promise<void>;
  /** true, sobald der Plan des Nutzers bekannt ist (Server oder Zwischenspeicher) */
  premiumStatusLoaded: boolean;
};

const PaywallContext = createContext<PaywallContextType | undefined>(undefined);

/**
 * Inner provider that uses Clerk auth - only rendered after hydration
 */
function PaywallProviderInner({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, userId, getToken } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [premiumUsageCount, setPremiumUsageCount] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [premiumStatusLoaded, setPremiumStatusLoaded] = useState(false);

  // Check premium status from database or localStorage
  const checkPremiumStatus = useCallback(async () => {
    // Clerk noch nicht bereit: weder als Gast noch als Nutzer werten
    if (!isLoaded) return;

    if (!isSignedIn || !userId) {
      // Guest users - use session storage
      const guestUsage = sessionStorage.getItem('guest_premium_usage');
      if (guestUsage) {
        setPremiumUsageCount(parseInt(guestUsage, 10));
      }
      setPremiumStatusLoaded(true);
      return;
    }

    const data = await premiumStatusAbrufen(getToken);
    if (data && !data.usingFallback) {
      setIsPremium(data.isPremium);
      setPremiumUsageCount(data.usageCount);

      // Update localStorage as cache
      try {
        localStorage.setItem(`is_premium_${userId}`, data.isPremium ? 'true' : 'false');
        localStorage.setItem(`premium_usage_${userId}`, data.usageCount.toString());
      } catch { /* privater Modus */ }
    } else {
      console.warn('[PaywallContext] Premium status request failed, falling back to localStorage');
      try {
        const storedPremium = localStorage.getItem(`is_premium_${userId}`);
        const storedUsage = localStorage.getItem(`premium_usage_${userId}`);
        setIsPremium(storedPremium === 'true');
        setPremiumUsageCount(storedUsage ? parseInt(storedUsage, 10) : 0);
      } catch { /* privater Modus */ }
    }
    setPremiumStatusLoaded(true);
  }, [isLoaded, isSignedIn, userId, getToken]);

  // Load premium status on mount and when userId changes
  useEffect(() => {
    checkPremiumStatus();
    // Mobil: Tab kommt aus dem Hintergrund zurück → Status frisch abfragen
    const beiSichtbar = () => {
      if (document.visibilityState === 'visible') checkPremiumStatus();
    };
    document.addEventListener('visibilitychange', beiSichtbar);
    return () => document.removeEventListener('visibilitychange', beiSichtbar);
  }, [checkPremiumStatus]);

  const incrementPremiumUsage = useCallback(() => {
    const newCount = premiumUsageCount + 1;
    setPremiumUsageCount(newCount);

    if (isSignedIn && userId) {
      try {
        localStorage.setItem(`premium_usage_${userId}`, newCount.toString());
      } catch { /* privater Modus */ }
      // Zählerstand im Konto speichern, damit das Limit auch nach Neuladen und auf anderen Geräten gilt
      (async () => {
        let token: string | null = null;
        try { token = await getToken(); } catch { /* Cookie kann reichen */ }
        try {
          const r = await fetch('/api/premium/status', {
            method: 'POST',
            credentials: 'same-origin',
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          });
          const d = r.ok ? await r.json() : null;
          if (typeof d?.newCount === 'number') {
            setPremiumUsageCount(c => Math.max(c, d.newCount));
            try { localStorage.setItem(`premium_usage_${userId}`, String(d.newCount)); } catch { /* privater Modus */ }
          }
        } catch (e) {
          console.warn('[PaywallContext] Nutzung konnte nicht gespeichert werden', e);
        }
      })();
    } else {
      sessionStorage.setItem('guest_premium_usage', newCount.toString());
    }
  }, [premiumUsageCount, isSignedIn, userId, getToken]);

  const canAccessPremium = useMemo(
    () => isPremium || premiumUsageCount < GRATIS_ANALYSEN,
    [isPremium, premiumUsageCount]
  );

  const refreshPremiumStatus = useCallback(async () => {
    await checkPremiumStatus();
  }, [checkPremiumStatus]);

  return (
    <PaywallContext.Provider
      value={{
        isPremium,
        premiumUsageCount,
        canAccessPremium,
        incrementPremiumUsage,
        showUpgradeModal,
        setShowUpgradeModal,
        refreshPremiumStatus,
        premiumStatusLoaded,
      }}
    >
      {children}
    </PaywallContext.Provider>
  );
}

/**
 * Outer provider that waits for hydration before using Clerk
 * During SSR and first render, provides default values without auth
 */
export function PaywallProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Before hydration, provide default context without Clerk auth
  if (!mounted) {
    const defaultValue: PaywallContextType = {
      isPremium: false,
      premiumUsageCount: 0,
      canAccessPremium: true,
      incrementPremiumUsage: () => {},
      showUpgradeModal: false,
      setShowUpgradeModal: () => {},
      refreshPremiumStatus: async () => {},
      premiumStatusLoaded: false,
    };

    return (
      <PaywallContext.Provider value={defaultValue}>
        {children}
      </PaywallContext.Provider>
    );
  }

  // After hydration, use real provider with Clerk auth
  return <PaywallProviderInner>{children}</PaywallProviderInner>;
}

export function usePaywall() {
  const context = useContext(PaywallContext);
  if (!context) {
    throw new Error('usePaywall must be used within PaywallProvider');
  }
  return context;
}
