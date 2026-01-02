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
    if (typeof window === 'undefined') {
      console.log('🔍 SignupTracker: Server-side, skipping');
      return;
    }

    console.log('🔍 SignupTracker: Running check', { isLoaded, hasUser: !!user, hasTracked: hasTracked.current });

    if (!isLoaded) {
      console.log('🔍 SignupTracker: Clerk not loaded yet');
      return;
    }

    if (!user) {
      console.log('🔍 SignupTracker: No user logged in');
      return;
    }

    if (hasTracked.current) {
      console.log('🔍 SignupTracker: Already tracked in this session');
      return;
    }

    // Check if we've already tracked this user's signup
    const trackingKey = `ads_conversion_tracked_${user.id}`;
    const alreadyTracked = localStorage.getItem(trackingKey);

    if (alreadyTracked) {
      console.log('🔍 SignupTracker: Already tracked in localStorage for user:', user.id);
      hasTracked.current = true;
      return;
    }

    // Check if user was created recently (within last 5 minutes = 300 seconds)
    // This gives enough time for email verification and redirects
    if (!user.createdAt) {
      console.log('⚠️ SignupTracker: No createdAt timestamp on user');
      hasTracked.current = true;
      return;
    }

    const userCreatedAt = new Date(user.createdAt);
    const now = new Date();
    const secondsSinceCreation = (now.getTime() - userCreatedAt.getTime()) / 1000;

    console.log('🔍 SignupTracker: User created', {
      createdAt: userCreatedAt.toISOString(),
      secondsAgo: Math.round(secondsSinceCreation),
      userId: user.id,
    });

    // If user was created within the last 5 minutes, track the conversion
    if (secondsSinceCreation < 300) {
      console.log('🎉 SignupTracker: New signup detected! Tracking conversion...');

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
    } else {
      console.log('ℹ️ SignupTracker: User created more than 5 minutes ago, skipping tracking');
    }
  }, [user, isLoaded]);

  // This component doesn't render anything
  return null;
}
