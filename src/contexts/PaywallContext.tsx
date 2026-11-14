'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { useAuth } from '@clerk/nextjs';
import { premiumStatusAbrufen } from '@/lib/premiumStatus';
import { GRATIS_ANALYSEN } from '@/lib/preise';
import { trackEvent, AnalyticsEvents } from '@/lib/analytics';

type PaywallContextType = {
  isPremium: boolean;
  premiumUsageCount: number;
  canAccessPremium: boolean;
  incrementPremiumUsage: () => void;
  showUpgradeModal: boolean;
  /** trigger: welche Sperre das Modal geöffnet hat (für paywall_viewed) */
  setShowUpgradeModal: (show: boolean, trigger?: string) => void;
  /** Welche Sperre die Paywall zuletzt geöffnet hat (z. B. "tab_markt"), null wenn geschlossen */
  upgradeTrigger: string | null;
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
  const [showUpgradeModal, setShowUpgradeModalState] = useState(false);
  const [upgradeTrigger, setUpgradeTrigger] = useState<string | null>(null);
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

  /**
   * Nur Anzeige: zählt lokal hoch, damit die Sperren sofort greifen. Das echte Kontingent verbucht
   * ausschließlich der Server in /api/agent/run; beim nächsten Abruf des Status gilt dessen Wert.
   * localStorage ist nur Zwischenspeicher für die Anzeige.
   */
  const incrementPremiumUsage = useCallback(() => {
    const newCount = premiumUsageCount + 1;
    setPremiumUsageCount(newCount);

    if (isSignedIn && userId) {
      try {
        localStorage.setItem(`premium_usage_${userId}`, newCount.toString());
      } catch { /* privater Modus */ }
    } else {
      try { sessionStorage.setItem('guest_premium_usage', newCount.toString()); } catch { /* privater Modus */ }
    }
  }, [premiumUsageCount, isSignedIn, userId]);

  const setShowUpgradeModal = useCallback((show: boolean, trigger?: string) => {
    if (show) {
      // Angemeldet ohne Premium: Die Sperre greift nur, wenn die Gratis-Analyse für eine andere Wohnung
      // verbraucht ist, also beim Start der 2. vollständigen Analyse. Die konkrete Sperre steht in source.
      const zweiteAnalyse = !!isSignedIn && !isPremium;
      trackEvent(AnalyticsEvents.PAYWALL_VIEWED, {
        trigger: zweiteAnalyse ? 'second_analysis' : (trigger || 'unknown'),
        source: trigger || 'unknown',
        signed_in: !!isSignedIn,
        free_analyses_used: premiumUsageCount,
      });
    }
    setUpgradeTrigger(show ? (trigger ?? null) : null);
    setShowUpgradeModalState(show);
  }, [isSignedIn, isPremium, premiumUsageCount]);

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
        upgradeTrigger,
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
      upgradeTrigger: null,
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
