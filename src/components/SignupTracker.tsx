'use client';

import { useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { trackEvent, AnalyticsEvents } from '@/lib/analytics';

/**
 * SignupTracker Component
 *
 * Tracks Google Ads conversion event when a user signs up.
 * Uses Clerk's user creation timestamp to detect new signups.
 * Prevents duplicate tracking via localStorage.
 */
export function SignupTracker() {
  const { user, isLoaded } = useUser();
  const hasTracked = useRef(false);

  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') return;
    if (!isLoaded) return;
    if (!user) return;
    if (hasTracked.current) return;

    // Check if we've already tracked this user's signup
    const trackingKey = `ads_conversion_tracked_${user.id}`;
    const alreadyTracked = localStorage.getItem(trackingKey);

    if (alreadyTracked) {
      hasTracked.current = true;
      return;
    }

    // Check if user was created recently (within last 30 seconds)
    // This indicates a fresh signup
    const userCreatedAt = new Date(user.createdAt);
    const now = new Date();
    const secondsSinceCreation = (now.getTime() - userCreatedAt.getTime()) / 1000;

    // If user was created within the last 30 seconds, track the conversion
    if (secondsSinceCreation < 30) {
      // Track Google Ads conversion event
      trackEvent(AnalyticsEvents.ADS_CONVERSION_SIGNUP, {
        user_id: user.id,
        timestamp: new Date().toISOString(),
      });

      // Also track the standard signup_completed event
      trackEvent(AnalyticsEvents.SIGNUP_COMPLETED, {
        user_id: user.id,
        timestamp: new Date().toISOString(),
      });

      // Mark as tracked in localStorage to prevent duplicates
      localStorage.setItem(trackingKey, 'true');
      hasTracked.current = true;

      console.log('✅ Google Ads signup conversion tracked for user:', user.id);
    }
  }, [user, isLoaded]);

  // This component doesn't render anything
  return null;
}
