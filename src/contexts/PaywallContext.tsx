'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { useAuth } from '@clerk/nextjs';

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

export function PaywallProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, userId } = useAuth();
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

    try {
      // Try to fetch from API/Supabase
      const response = await fetch('/api/premium/status');
      if (response.ok) {
        const data = await response.json();
        setIsPremium(data.isPremium || false);
        setPremiumUsageCount(data.usageCount || 0);

        // Update localStorage as cache
        localStorage.setItem(`is_premium_${userId}`, data.isPremium ? 'true' : 'false');
        localStorage.setItem(`premium_usage_${userId}`, (data.usageCount || 0).toString());
      } else {
        // Fallback to localStorage
        const storedPremium = localStorage.getItem(`is_premium_${userId}`);
        const storedUsage = localStorage.getItem(`premium_usage_${userId}`);

        setIsPremium(storedPremium === 'true');
        setPremiumUsageCount(storedUsage ? parseInt(storedUsage, 10) : 0);
      }
    } catch (error) {
      console.error('Error checking premium status:', error);
      // Fallback to localStorage
      const storedPremium = localStorage.getItem(`is_premium_${userId}`);
      const storedUsage = localStorage.getItem(`premium_usage_${userId}`);

      setIsPremium(storedPremium === 'true');
      setPremiumUsageCount(storedUsage ? parseInt(storedUsage, 10) : 0);
    }
  }, [isSignedIn, userId]);

  // Load premium status on mount and when userId changes
  useEffect(() => {
    checkPremiumStatus();
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

export function usePaywall() {
  const context = useContext(PaywallContext);
  if (!context) {
    throw new Error('usePaywall must be used within PaywallProvider');
  }
  return context;
}
