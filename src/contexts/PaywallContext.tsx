'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { useAuth } from '@clerk/nextjs';
import { premiumStatusAbrufen } from '@/lib/premiumStatus';

type PaywallContextType = {
  isPremium: boolean;
  premiumUsageCount: number;
  canAccessPremium: boolean;
  incrementPremiumUsage: () => void;
  showUpgradeModal: boolean;
  setShowUpgradeModal: (show: boolean) => void;
  refreshPremiumStatus: () => Promise<void>;
};

const PaywallContext = createContext<PaywallContextType | undefined>(undefined);

/**
 * Inner provider that uses Clerk auth - only rendered after hydration
 */
function PaywallProviderInner({ children }: { children: ReactNode }) {
  const { isSignedIn, userId, getToken } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [premiumUsageCount, setPremiumUsageCount] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Check premium status from database or localStorage
  const checkPremiumStatus = useCallback(async () => {
    if (!isSignedIn || !userId) {
      // Guest users - use session storage
      const guestUsage = sessionStorage.getItem('guest_premium_usage');
      if (guestUsage) {
        setPremiumUsageCount(parseInt(guestUsage, 10));
      }
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
  }, [isSignedIn, userId, getToken]);

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
      localStorage.setItem(`premium_usage_${userId}`, newCount.toString());
    } else {
      sessionStorage.setItem('guest_premium_usage', newCount.toString());
    }
  }, [premiumUsageCount, isSignedIn, userId]);

  const canAccessPremium = useMemo(
    () => isPremium || premiumUsageCount < 2,
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
