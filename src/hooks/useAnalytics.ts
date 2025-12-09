'use client';

import { useCallback } from 'react';
import {
  trackEvent,
  AnalyticsEvents,
  trackSubscriptionPurchase as trackSubscriptionPurchaseLib,
  type SubscriptionPlanId
} from '@/lib/analytics';

/**
 * React Hook for Analytics Tracking
 *
 * Usage example:
 * ```tsx
 * const { track } = useAnalytics();
 *
 * <button onClick={() => track(AnalyticsEvents.CTA_CLICKED, { cta_location: 'hero' })}>
 *   Start Analysis
 * </button>
 * ```
 */
export function useAnalytics() {
  const track = useCallback((eventName: string, eventParams?: Record<string, unknown>) => {
    trackEvent(eventName, eventParams);
  }, []);

  // Shorthand methods for common events
  const trackCTA = useCallback((ctaName: string, location: string) => {
    track(AnalyticsEvents.CTA_CLICKED, {
      cta_name: ctaName,
      cta_location: location,
    });
  }, [track]);

  const trackInputMethod = useCallback((method: 'ai_import' | 'manual' | 'excel') => {
    track(AnalyticsEvents.INPUT_METHOD_SELECTED, {
      input_method: method,
    });
  }, [track]);

  const trackUpgradeClick = useCallback((planName: string, location: string) => {
    track(AnalyticsEvents.UPGRADE_CLICKED, {
      plan_name: planName,
      click_location: location,
    });
  }, [track]);

  const trackPurchase = useCallback((
    transactionId: string,
    value: number,
    items: Array<{
      item_id: string;
      item_name: string;
      price: number;
      quantity: number;
    }>
  ) => {
    track(AnalyticsEvents.PURCHASE_COMPLETED, {
      transaction_id: transactionId,
      value,
      currency: 'EUR',
      items,
    });
  }, [track]);

  const trackSubscriptionPurchase = useCallback((
    planId: SubscriptionPlanId,
    transactionId: string,
    value: number
  ) => {
    trackSubscriptionPurchaseLib(planId, transactionId, value);
  }, []);

  return {
    track,
    trackCTA,
    trackInputMethod,
    trackUpgradeClick,
    trackPurchase,
    trackSubscriptionPurchase,
  };
}
