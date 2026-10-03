'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { usePaywall } from '@/contexts/PaywallContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { vergissPlanStatus } from '@/hooks/usePlanStatus';
import { PREIS_JAHR, PREIS_MONAT } from '@/lib/preise';

/** Nach dem Stripe-Checkout: Kauf tracken und warten, bis Premium aktiv ist */
export function PurchaseTracker() {
  const searchParams = useSearchParams();
  const { trackSubscriptionPurchase } = useAnalytics();
  const { refreshPremiumStatus, isPremium } = usePaywall();
  const purchaseTracked = useRef(false);
  const [retryCount, setRetryCount] = useState(0);

  // Store the success params so we can use them even after URL cleanup
  const successRef = useRef<{ success: boolean; sessionId: string | null; plan: string | null }>({
    success: false,
    sessionId: null,
    plan: null,
  });

  useEffect(() => {
    const success = searchParams.get('success');
    const sessionId = searchParams.get('session_id');
    const plan = searchParams.get('plan');

    if (success === 'true' && sessionId && plan && !purchaseTracked.current) {
      purchaseTracked.current = true;

      // Store in ref for polling
      successRef.current = { success: true, sessionId, plan };

      // Determine purchase value and plan ID based on plan
      const value = plan === 'yearly' ? PREIS_JAHR : PREIS_MONAT;
      const planId = plan === 'yearly' ? 'premium_yearly' : 'premium_monthly';

      // Track the purchase event for GTM/GA4 with detailed subscription info
      trackSubscriptionPurchase(planId, sessionId, value);

      // Show initial loading message
      toast.loading('Aktiviere Premium-Zugang...', { id: 'premium-activation' });
    }
  }, [searchParams, trackSubscriptionPurchase]);

  // Poll for premium status after purchase
  useEffect(() => {
    console.log('[PurchaseTracker] Effect triggered - isPremium:', isPremium, 'retryCount:', retryCount, 'hasSuccess:', successRef.current.success);

    if (successRef.current.success && successRef.current.sessionId && !isPremium && retryCount < 15) {
      // First check is immediate, subsequent checks have delay
      const delay = retryCount === 0 ? 0 : 2000;

      const timer = setTimeout(async () => {
        console.log(`[PurchaseTracker] 🔄 Checking premium status (attempt ${retryCount + 1}/15)`);
        console.log('[PurchaseTracker] Session ID:', successRef.current.sessionId);

        // After 5 failed attempts, try manual verification
        if (retryCount >= 5 && successRef.current.sessionId) {
          console.log('[PurchaseTracker] 🔧 Attempting manual session verification...');
          try {
            const verifyResponse = await fetch('/api/stripe/verify-session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sessionId: successRef.current.sessionId }),
            });

            if (verifyResponse.ok) {
              const verifyData = await verifyResponse.json();
              console.log('[PurchaseTracker] Manual verification result:', verifyData);

              if (verifyData.success && verifyData.isPremium) {
                console.log('[PurchaseTracker] ✅ Manual verification successful!');
                // Force refresh premium status
                await refreshPremiumStatus();
                setRetryCount(prev => prev + 1);
                return; // Exit early, let next cycle check isPremium
              }
            }
          } catch (err) {
            console.error('[PurchaseTracker] Manual verification error:', err);
          }
        }

        await refreshPremiumStatus();
        setRetryCount(prev => prev + 1);
      }, delay);

      return () => clearTimeout(timer);
    } else if (isPremium && successRef.current.success) {
      // Premium status confirmed!
      vergissPlanStatus();
      toast.success('Zahlung erfolgreich! Dein Premium-Zugang wurde aktiviert.', { id: 'premium-activation' });
      console.log('[PurchaseTracker] ✅ Premium status confirmed after', retryCount, 'attempts');

      // Clear URL parameters after success
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);

      // Clear ref
      successRef.current = { success: false, sessionId: null, plan: null };
    } else if (retryCount >= 15 && !isPremium && successRef.current.success) {
      // Failed to get premium status after retries
      console.error('[PurchaseTracker] ❌ Failed after 15 retries');
      console.error('[PurchaseTracker] Session ID:', successRef.current.sessionId);

      toast.error('Premium-Aktivierung verzögert. Die Zahlung war erfolgreich, aber die Aktivierung dauert länger. Bitte lade die Seite in 1-2 Minuten neu.', {
        id: 'premium-activation',
        duration: 10000
      });

      // Clear URL parameters even on failure
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }
  }, [isPremium, retryCount, refreshPremiumStatus]);

  return null;
}
