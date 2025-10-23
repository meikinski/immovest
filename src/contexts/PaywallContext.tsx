'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@clerk/nextjs';

type PaywallContextType = {
  isPremium: boolean;
  premiumUsageCount: number;
  canAccessPremium: boolean;
  incrementPremiumUsage: () => void;
  showUpgradeModal: boolean;
  setShowUpgradeModal: (show: boolean) => void;
};

const PaywallContext = createContext<PaywallContextType | undefined>(undefined);

export function PaywallProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, userId } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [premiumUsageCount, setPremiumUsageCount] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Load premium status and usage count
  useEffect(() => {
    if (isSignedIn && userId) {
      // TODO: Load from Supabase/Database
      // For now, use localStorage
      const storedUsage = localStorage.getItem(`premium_usage_${userId}`);
      if (storedUsage) {
        setPremiumUsageCount(parseInt(storedUsage, 10));
      }

      // TODO: Check premium status from user metadata or Stripe
      const storedPremium = localStorage.getItem(`is_premium_${userId}`);
      setIsPremium(storedPremium === 'true');
    } else if (!isSignedIn) {
      // Guest users - use session storage
      const guestUsage = sessionStorage.getItem('guest_premium_usage');
      if (guestUsage) {
        setPremiumUsageCount(parseInt(guestUsage, 10));
      }
    }
  }, [isSignedIn, userId]);

  const incrementPremiumUsage = () => {
    const newCount = premiumUsageCount + 1;
    setPremiumUsageCount(newCount);

    if (isSignedIn && userId) {
      localStorage.setItem(`premium_usage_${userId}`, newCount.toString());
    } else {
      sessionStorage.setItem('guest_premium_usage', newCount.toString());
    }
  };

  const canAccessPremium = isPremium || premiumUsageCount < 2;

  return (
    <PaywallContext.Provider
      value={{
        isPremium,
        premiumUsageCount,
        canAccessPremium,
        incrementPremiumUsage,
        showUpgradeModal,
        setShowUpgradeModal,
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
