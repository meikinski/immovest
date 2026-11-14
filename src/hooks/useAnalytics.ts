'use client';

import { useCallback } from 'react';
import {
  trackEvent,
  AnalyticsEvents,
  trackSubscriptionPurchase as trackSubscriptionPurchaseLib,
  type AnalyticsEventName,
  type SubscriptionPlanId,
} from '@/lib/analytics';

/**
 * React-Hook als dünne Hülle um den zentralen Helper in src/lib/analytics.ts.
 */
export function useAnalytics() {
  const track = useCallback((eventName: AnalyticsEventName, eventParams?: Record<string, unknown>) => {
    trackEvent(eventName, eventParams);
  }, []);

  const trackCTA = useCallback((ctaName: string, location: string) => {
    track(AnalyticsEvents.CTA_CLICKED, { cta_name: ctaName, cta_location: location });
  }, [track]);

  const trackUpgradeClick = useCallback((planName: string, location: string) => {
    track(AnalyticsEvents.UPGRADE_CLICKED, { plan_name: planName, click_location: location });
  }, [track]);

  const trackSubscriptionPurchase = useCallback((
    planId: SubscriptionPlanId,
    transactionId: string,
    value: number
  ) => {
    trackSubscriptionPurchaseLib(planId, transactionId, value);
  }, []);

  return { track, trackCTA, trackUpgradeClick, trackSubscriptionPurchase };
}
